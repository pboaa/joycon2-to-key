//! Connection sequence (subscribe → connection parameters → LED → vibration →
//! IMU enable) and the notification loop. Sends each command to the WRITE
//! characteristic (LED / vibration / IMU), and on each frame updates the
//! snapshot, hands off to the input thread, and monitors link liveness.

use std::sync::atomic::Ordering;
use std::sync::Arc;
use std::time::Duration;

use btleplug::api::{
    Characteristic, ConnectionParameterPreset, Manager as _, Peripheral as _, WriteType,
};
use btleplug::platform::{Manager, Peripheral};
use futures::stream::StreamExt;
use tokio::time::sleep;
use uuid::{uuid, Uuid};

use crate::config::Vibration;
use crate::input_thread::Analog;

use super::discovery::find_joycon;
use super::protocol::{build_command, parse_snapshot, pressed_set, REQUIRED_FRAME_LEN};
use super::{JoyConHandle, LinkEvent, Side};

const NOTIFY_UUID: Uuid = uuid!("ab7de9be-89fe-49ad-828f-118f09df7fd2");
const WRITE_UUID: Uuid = uuid!("649d4ac9-8eb7-4e6c-af44-1ea54fe5f005");

/// Opt-in per-phase connect timing (set the `JC_TIMING` env var). Prints the
/// elapsed ms at each phase so the connect latency can be measured on real
/// hardware before tuning the fixed waits — silent otherwise.
struct PhaseTimer {
    start: std::time::Instant,
    on: bool,
}
impl PhaseTimer {
    fn new() -> Self {
        Self {
            start: std::time::Instant::now(),
            on: std::env::var("JC_TIMING").is_ok(),
        }
    }
    fn mark(&self, phase: &str) {
        if self.on {
            eprintln!("[joycon/timing] {phase}: +{}ms", self.start.elapsed().as_millis());
        }
    }
}

impl JoyConHandle {
    pub(super) async fn connect_inner(self: Arc<Self>) -> Result<(), String> {
        let timing = PhaseTimer::new();
        let manager = Manager::new().await.map_err(|e| e.to_string())?;
        let adapters = manager.adapters().await.map_err(|e| e.to_string())?;
        let adapter = adapters
            .into_iter()
            .next()
            .ok_or_else(|| "No BLE adapter found".to_string())?;

        let (peripheral, side) = find_joycon(&adapter).await?;
        *self.side.lock().await = side;
        timing.mark("scan/find");

        peripheral.connect().await.map_err(|e| e.to_string())?;
        timing.mark("connect");
        peripheral
            .discover_services()
            .await
            .map_err(|e| e.to_string())?;

        let chars = peripheral.characteristics();
        let notify_char = chars
            .iter()
            .find(|c| c.uuid == NOTIFY_UUID)
            .cloned()
            .ok_or_else(|| "Notify characteristic not found".to_string())?;
        let write_char = chars
            .iter()
            .find(|c| c.uuid == WRITE_UUID)
            .cloned()
            .ok_or_else(|| "Write characteristic not found".to_string())?;
        sleep(Duration::from_millis(150)).await; // brief settle wait right after connecting
        timing.mark("discover+chars");

        // Mark "connected" as soon as we subscribe; input frames flow from here.
        peripheral
            .subscribe(&notify_char)
            .await
            .map_err(|e| e.to_string())?;
        timing.mark("subscribe");

        // The scan above can take up to ~15s; the user may have pressed Stop
        // during it (disconnect() had no peripheral to tear down yet). Honor that
        // now instead of coming up Connected and driving input against their wish.
        if self.user_disconnected.load(Ordering::SeqCst) {
            let _ = peripheral.disconnect().await;
            return Ok(());
        }

        {
            let mut guard = self.peripheral.lock().await;
            *guard = Some(peripheral.clone());
        }
        self.apply_event(LinkEvent::LinkUp).await;
        timing.mark("LinkUp (connected)");

        // Start the fresh link with a clean idle state: drop any idle-disconnect
        // request that accumulated while we were disconnected, and re-arm the
        // idle timer (input.reset resets last_activity). Without this, a long
        // disconnect could immediately tear down the connection we just made.
        self.runtime
            .idle_disconnect_pending
            .store(false, Ordering::Relaxed);
        self.input.reset();

        // Decorative/diagnostic init isn't needed for a perceived connection, so do
        // it non-blocking after the link is established (low-latency tuning / LED /
        // connect vibration / extended report = battery diagnostics). Run it
        // alongside the read loop, off the critical path to LinkUp. All non-fatal.
        {
            let p = peripheral.clone();
            let wc = write_char.clone();
            let rt = self.runtime.clone();
            tokio::spawn(async move {
                // Move Windows' default ~60ms interval to low latency (~15ms) (needs Win11 22000+).
                let _ = p
                    .request_connection_parameters(ConnectionParameterPreset::ThroughputOptimized)
                    .await;
                let leds = rt.player_leds.load(Ordering::Relaxed);
                let _ = init_controller(&p, &wc, leds).await;
                // We just sent the current LEDs on connect, so clear the pending resend (from startup apply).
                rt.led_dirty.store(false, Ordering::Relaxed);
                // Connect-time vibration is controlled by the setting (connect_vibration). 0 = none.
                let connect_vib = rt.connect_vibration.load(Ordering::Relaxed);
                if connect_vib > 0 {
                    send_vibration(&p, &wc, &Vibration::Sample(connect_vib)).await;
                }
                // Enable the IMU / extended report (Feature Select). Motion input was
                // removed, but the extended frames also carry battery current/temp
                // diagnostics (0x28/0x2E), so we keep this.
                enable_imu(&p, &wc).await;
            });
        }

        let handle = self.clone();
        tokio::spawn(async move {
            // The notification loop only parses, updates the snapshot, and sends to
            // the input thread. It never calls SendInput on this task (tokio worker).
            // It does forward queued vibration requests (runtime.vibrate_pending),
            // which need the WRITE characteristic.
            if let Err(e) = run_notification_loop(peripheral, write_char, handle.clone(), side).await {
                eprintln!("notification loop ended: {e}");
            }
            // On stream end, drop the peripheral handle.
            {
                let mut guard = handle.peripheral.lock().await;
                *guard = None;
            }
            handle.input.reset();
            handle.clear_battery();
            *handle.snapshot.lock().await = None;

            if handle.user_disconnected.load(Ordering::SeqCst) {
                handle.apply_event(LinkEvent::UserDisconnect).await;
                return;
            }
            // BLE link dropped (unexpectedly, or released after idle) — switch to
            // scanning and keep retrying until the user disconnects or it succeeds.
            handle.apply_event(LinkEvent::LinkLost).await;
            handle.spawn_reconnect_loop();
        });

        Ok(())
    }
}

async fn init_controller(
    p: &Peripheral,
    write_char: &Characteristic,
    leds: u8,
) -> Result<(), String> {
    let led_cmd = build_command(0x09, 0x07, &[leds]);
    p.write(write_char, &led_cmd, WriteType::WithoutResponse)
        .await
        .map_err(|e| e.to_string())?;
    sleep(Duration::from_millis(50)).await;
    // The connect "click" is no longer hard-coded here — it's queued by the
    // caller from the connect_vibration setting (0 = silent).
    Ok(())
}

/// Set the player-indicator LEDs (subcmd 0x07: low nibble = solid, high nibble
/// = flashing). Used for live changes; the initial set is done by `init_controller`.
async fn send_player_leds(p: &Peripheral, write_char: &Characteristic, leds: u8) {
    let cmd = build_command(0x09, 0x07, &[leds]);
    let _ = p.write(write_char, &cmd, WriteType::WithoutResponse).await;
}

/// Enable the IMU (motion): send 2 commands to the WRITE characteristic via
/// Feature Select (per yujimny/Joycon2test). `0c 91 01 02 00 04 00 00 FF 00 00 00`
/// (Set mask) → `…04…` (Enable). Called twice (right after connect and after the
/// various init steps) to make sure it takes.
async fn enable_imu(p: &Peripheral, write_char: &Characteristic) {
    let cmds: [[u8; 12]; 2] = [
        [0x0c, 0x91, 0x01, 0x02, 0x00, 0x04, 0x00, 0x00, 0xff, 0x00, 0x00, 0x00],
        [0x0c, 0x91, 0x01, 0x04, 0x00, 0x04, 0x00, 0x00, 0xff, 0x00, 0x00, 0x00],
    ];
    for cmd in &cmds {
        let _ = p.write(write_char, cmd, WriteType::WithoutResponse).await;
        sleep(Duration::from_millis(50)).await;
    }
}

/// Play a haptic on the controller: a built-in pattern (subcmd 0x02, ids 1–7;
/// the same path the init "click" uses).
async fn send_vibration(p: &Peripheral, write_char: &Characteristic, v: &Vibration) {
    let Vibration::Sample(id) = v;
    let cmd = build_command(0x0a, 0x02, &[*id]);
    let _ = p.write(write_char, &cmd, WriteType::WithoutResponse).await;
}

/// Periodic liveness check — Joy-Con's pair button drops the BLE link
/// without ending the notification stream on Windows, so we poll
/// `is_connected()` alongside notifications.
const LIVENESS_INTERVAL: Duration = Duration::from_secs(1);

/// A healthy Joy-Con streams frames continuously (~125 Hz) even while idle, so
/// arriving frames are the strongest proof the link is alive. We only fall back
/// to probing `is_connected()` once the stream has been silent this long — this
/// keeps a transient WinRT "disconnected" blip right after connecting (or while
/// frames are flowing) from tearing down a perfectly good link.
const FRAME_SILENCE_GRACE: Duration = Duration::from_millis(1500);

/// Number of consecutive silent-and-disconnected liveness ticks before we give
/// up on the link. Requiring more than one absorbs a lone spurious reading.
const MAX_DEAD_CHECKS: u8 = 2;

async fn run_notification_loop(
    p: Peripheral,
    write_char: Characteristic,
    handle: Arc<JoyConHandle>,
    side: Side,
) -> Result<(), String> {
    let mut notifications = p.notifications().await.map_err(|e| e.to_string())?;
    let mut liveness = tokio::time::interval(LIVENESS_INTERVAL);
    liveness.tick().await; // skip the immediate first tick

    // Assume alive at start so the first frame has time to arrive before we
    // ever probe the link. Any received frame refreshes this and clears the
    // dead-check streak.
    let mut last_frame = tokio::time::Instant::now();
    let mut dead_checks: u8 = 0;

    loop {
        tokio::select! {
            next = notifications.next() => {
                let Some(data) = next else { break };
                // A packet arrived → the link is definitely up.
                last_frame = tokio::time::Instant::now();
                dead_checks = 0;
                if data.value.len() < REQUIRED_FRAME_LEN {
                    continue;
                }
                let stick_dz =
                    (handle.runtime.stick_deadzone.load(Ordering::Relaxed) as f32 / 100.0)
                        .clamp(0.0, 0.9);
                let snap = parse_snapshot(&data.value, side, stick_dz);
                // Record battery voltage/charge + (on extended frames) current/temp
                // every frame (the UI polls it). Telemetry decides what to store based
                // on the frame length.
                handle.telemetry.record_frame(&data.value);
                let pressed = pressed_set(&snap);
                let analog = Analog {
                    stick: (snap.stick.x, snap.stick.y),
                    side: snap.side,
                };
                // Update UI snapshot (cheap copy, contention only with the poll).
                *handle.snapshot.lock().await = Some(snap);
                // Just hand the pressed set + analog input to the input thread
                // (non-blocking). Idle release, tap-repeat, and stick/gyro mouse are
                // handled on the input-thread side.
                handle.input.frame(pressed, analog);
                // Send any vibration the input thread queued, via the WRITE characteristic (rare; lock returns immediately).
                if let Some(v) = handle.runtime.take_vibrate() {
                    send_vibration(&p, &write_char, &v).await;
                }
                // Apply player-LED setting changes live (only sent when changed).
                if handle.runtime.led_dirty.swap(false, Ordering::Relaxed) {
                    let leds = handle.runtime.player_leds.load(Ordering::Relaxed);
                    send_player_leds(&p, &write_char, leds).await;
                }
            }
            _ = liveness.tick() => {
                // Idle auto-disconnect (the input thread sets the request). Here we
                // only drop the BLE link to save battery and, unlike an explicit user
                // disconnect, don't set `user_disconnected`. On loop exit the
                // reconnect logic keeps scanning while "Reconnecting", so once the
                // controller comes back it auto-resumes without pressing start.
                if handle
                    .runtime
                    .idle_disconnect_pending
                    .swap(false, Ordering::Relaxed)
                {
                    eprintln!("[joycon] idle timeout — releasing link, staying in standby");
                    let _ = p.disconnect().await;
                    break;
                }
                // Frames still flowing → link is alive; never tear down on a
                // stale is_connected() reading while packets are arriving.
                if last_frame.elapsed() < FRAME_SILENCE_GRACE {
                    dead_checks = 0;
                    continue;
                }
                // Stream has gone quiet: now the link state is worth trusting.
                // Require a couple of consecutive failures so one transient
                // false reading doesn't drop us.
                if p.is_connected().await.unwrap_or(false) {
                    dead_checks = 0;
                } else {
                    dead_checks += 1;
                    if dead_checks >= MAX_DEAD_CHECKS {
                        eprintln!(
                            "[joycon] link silent for {:?} and reports disconnected (pair button?)",
                            last_frame.elapsed()
                        );
                        break;
                    }
                }
            }
        }
    }
    Ok(())
}
