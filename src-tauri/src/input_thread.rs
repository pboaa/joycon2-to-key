//! Isolate input processing onto a dedicated OS thread.
//!
//! Win32 `SendInput` can block for a long time when the foreground window isn't
//! pumping its message queue. Running it inline on a tokio worker would stall the
//! whole shared runtime (BLE notification stream, IPC commands), which is what
//! causes "input sometimes stops working".
//!
//! So `InputProcessor` (= SendInput) is owned exclusively by the single OS thread
//! this module spawns; the BLE side only hands it the pressed state over a
//! channel. Even if SendInput blocks, tokio is completely unaffected.

use std::collections::HashMap;
use std::sync::atomic::Ordering;
use std::sync::mpsc::{Receiver, RecvTimeoutError, Sender, TryRecvError};
use std::sync::Arc;
use std::thread;
use std::time::{Duration, Instant};

use crate::buttons::ButtonSet;
use crate::config::{AppConfig, InputCommand, RuntimeSettings, Vibration};
use crate::joycon::Side;
use crate::keyboard::boost_current_thread_priority;
use crate::processor::InputProcessor;

/// A tick that drives tap-repeat (`repeat_ms`) and smooth stick→mouse
/// interpolation even when no new frame arrives. Kept shorter than the BLE frame
/// interval (~8–16ms) so the cursor updates between frames (motion is
/// time-based, so speed doesn't depend on the tick).
const TICK: Duration = Duration::from_millis(4);

/// How many seconds before the idle auto-disconnect to buzz the warning haptic
/// (while the controller is still connected). Enough to react without cutting
/// into the (minutes-long) idle window.
const IDLE_WARN_LEAD_SECS: u64 = 3;

/// A message from the BLE side → input thread. One frame's analog input (stick).
#[derive(Clone, Copy, Default)]
pub struct Analog {
    /// Left/right stick (-1..1).
    pub stick: (f32, f32),
    /// Which side the connected Joy-Con is (used to pick the per-side stick→mouse setting).
    pub side: Side,
}

pub enum InputMsg {
    /// One frame's set of pressed buttons + analog input.
    Frame(ButtonSet, Analog),
    /// Swap the config (on save / reset / reload).
    ReplaceConfig(AppConfig),
    /// Swap the definition-reference resolution map (on definition edit / save).
    ReplaceDefinitions(HashMap<String, Vec<InputCommand>>),
    /// Release all held-down state.
    Reset,
}

/// Send handle to the input thread. Cloneable; all sends are non-blocking.
#[derive(Clone)]
pub struct InputSender {
    tx: Sender<InputMsg>,
}

impl InputSender {
    pub fn frame(&self, pressed: ButtonSet, analog: Analog) {
        let _ = self.tx.send(InputMsg::Frame(pressed, analog));
    }

    pub fn replace_config(&self, cfg: AppConfig) {
        let _ = self.tx.send(InputMsg::ReplaceConfig(cfg));
    }

    pub fn replace_definitions(&self, defs: HashMap<String, Vec<InputCommand>>) {
        let _ = self.tx.send(InputMsg::ReplaceDefinitions(defs));
    }

    pub fn reset(&self) {
        let _ = self.tx.send(InputMsg::Reset);
    }
}

/// Spawn the input thread and return a send handle.
pub fn spawn(processor: InputProcessor, runtime: Arc<RuntimeSettings>) -> InputSender {
    let (tx, rx) = std::sync::mpsc::channel::<InputMsg>();
    thread::Builder::new()
        .name("joycon-input".into())
        .spawn(move || run(processor, rx, runtime))
        .expect("failed to spawn input thread");
    InputSender { tx }
}

fn run(mut processor: InputProcessor, rx: Receiver<InputMsg>, runtime: Arc<RuntimeSettings>) {
    // Prioritize only this thread, the one that calls SendInput.
    boost_current_thread_priority();

    let mut last_pressed = ButtonSet::default();
    let mut last_analog = Analog::default();
    let mut last_activity = Instant::now();
    let mut idle_released = false;
    // Set once the pre-disconnect warning haptic has been queued for this idle
    // stretch; cleared whenever activity resumes.
    let mut idle_warned = false;

    loop {
        // Block up to TICK waiting for the first message.
        let mut pending: Option<(ButtonSet, Analog)> = None;
        match rx.recv_timeout(TICK) {
            Ok(msg) => apply(
                msg,
                &mut processor,
                &mut pending,
                &mut last_pressed,
                &mut last_activity,
                &mut idle_released,
                &mut idle_warned,
            ),
            Err(RecvTimeoutError::Timeout) => {}
            Err(RecvTimeoutError::Disconnected) => return,
        }

        // Drain whatever queued up. Old frames piled up while SendInput was
        // blocking are collapsed to just the newest to avoid burst processing
        // (config/reset are applied in order).
        loop {
            match rx.try_recv() {
                Ok(msg) => apply(
                    msg,
                    &mut processor,
                    &mut pending,
                    &mut last_pressed,
                    &mut last_activity,
                    &mut idle_released,
                    &mut idle_warned,
                ),
                Err(TryRecvError::Empty) => break,
                Err(TryRecvError::Disconnected) => return,
            }
        }

        match pending {
            Some((frame, analog)) => {
                if !frame.is_empty() {
                    last_activity = Instant::now();
                    idle_released = false;
                    idle_warned = false;
                }
                last_pressed = frame;
                last_analog = analog;
                processor.process(frame, analog);
            }
            None => {
                // No new frame. Re-process the last state to drive tap-repeat and
                // stick/gyro mouse (if nothing changed and nothing repeats, process
                // returns immediately).
                processor.process(last_pressed, last_analog);
            }
        }

        // Idle is checked every loop. BLE keeps streaming frames even with no
        // input, so we key off last_activity (= the last non-empty frame). After
        // some idle time we auto-disconnect BLE (the actual disconnect happens in
        // the liveness loop).
        if !idle_released && runtime.idle_enabled.load(Ordering::Relaxed) {
            let secs = runtime.idle_timeout_secs.load(Ordering::Relaxed);
            let elapsed = last_activity.elapsed();
            // A bit before disconnect, buzz the still-connected controller as a warning (when the setting > 0).
            if !idle_warned {
                let warn_at = secs.saturating_sub(IDLE_WARN_LEAD_SECS);
                if warn_at > 0 && elapsed >= Duration::from_secs(warn_at) {
                    let sample = runtime.idle_warn_vibration.load(Ordering::Relaxed);
                    if sample > 0 {
                        runtime.request_vibrate(Vibration::Sample(sample));
                    }
                    idle_warned = true;
                }
            }
            if secs > 0 && elapsed >= Duration::from_secs(secs) {
                processor.reset();
                last_pressed = ButtonSet::default();
                idle_released = true;
                runtime
                    .idle_disconnect_pending
                    .store(true, Ordering::Relaxed);
            }
        }
    }
}

/// Apply an incoming message. Frame folds into `pending` as the latest value;
/// config/reset apply immediately and clear the pressed state. Reset also doubles
/// as "start of a new connection", so it re-arms the idle timer (so idle time that
/// accrued while disconnected doesn't trigger a disconnect right after reconnect).
fn apply(
    msg: InputMsg,
    processor: &mut InputProcessor,
    pending: &mut Option<(ButtonSet, Analog)>,
    last_pressed: &mut ButtonSet,
    last_activity: &mut Instant,
    idle_released: &mut bool,
    idle_warned: &mut bool,
) {
    match msg {
        InputMsg::Frame(p, analog) => *pending = Some((p, analog)),
        InputMsg::ReplaceConfig(cfg) => {
            processor.replace_config(cfg);
            *pending = Some((ButtonSet::default(), Analog::default()));
            *last_pressed = ButtonSet::default();
        }
        InputMsg::ReplaceDefinitions(defs) => processor.set_definitions(defs),
        InputMsg::Reset => {
            processor.reset();
            *pending = Some((ButtonSet::default(), Analog::default()));
            *last_pressed = ButtonSet::default();
            *last_activity = Instant::now();
            *idle_released = false;
            *idle_warned = false;
        }
    }
}
