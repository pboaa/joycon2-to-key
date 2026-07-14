//! [`JoyConHandle`]: owner of the BLE connection lifecycle. It holds the state
//! and runs the reconnect loop; scanning lives in [`discovery`], the connect
//! sequence / notification loop in [`link`], and frame parsing in [`protocol`].

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;

use btleplug::api::Peripheral as _;
use btleplug::platform::Peripheral;
use serde::Serialize;
use tauri::Emitter;
use tokio::sync::Mutex;
use tokio::time::sleep;

use crate::config::{RuntimeSettings, Vibration};
use crate::input_thread::InputSender;
use crate::SharedAppHandle;

mod discovery;
mod link;
mod protocol;
mod telemetry;

pub use protocol::{JoyConSnapshot, Side};
use telemetry::Telemetry;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ConnectionState {
    Disconnected,
    Connected,
    Reconnecting,
}

/// The events that drive the published [`ConnectionState`]. The lifecycle is
/// async and spans several tasks (the reconnect loop, the notify task, the
/// idle-release path), so naming each transition by the intent that causes it
/// keeps it readable: every state change other than the user's initial connect
/// is one of these, applied via [`JoyConHandle::apply_event`]. Each event's
/// target state is independent of the current state (see [`LinkEvent::target`]),
/// so this is a faithful, unit-tested description of what the code already does.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) enum LinkEvent {
    /// The BLE link came up (init handshake finished).
    LinkUp,
    /// The link dropped — either unexpectedly, or released after the idle
    /// timeout — and we keep scanning to reconnect (standby).
    LinkLost,
    /// The user explicitly disconnected; stay stopped until they reconnect.
    UserDisconnect,
}

impl LinkEvent {
    /// The state this event moves the connection to.
    fn target(self) -> ConnectionState {
        match self {
            LinkEvent::LinkUp => ConnectionState::Connected,
            LinkEvent::LinkLost => ConnectionState::Reconnecting,
            LinkEvent::UserDisconnect => ConnectionState::Disconnected,
        }
    }
}

/// Battery voltage plus the extra telemetry carried in the same input frame.
/// `current_ma` / `temperature_c` are None until an extended frame arrives.
#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BatteryReading {
    pub millivolts: u16,
    pub charging: bool,
    pub current_ma: Option<f32>,
    pub temperature_c: Option<f32>,
}

pub struct JoyConHandle {
    peripheral: Mutex<Option<Peripheral>>,
    /// Input processing runs on a dedicated OS thread; from here we only send on a channel.
    input: InputSender,
    state: Mutex<ConnectionState>,
    /// Which side (left/right) the connected Joy-Con is (from the advertised Product ID).
    side: Mutex<Side>,
    snapshot: Mutex<Option<JoyConSnapshot>>,
    /// True when the user explicitly pressed Disconnect — halts the reconnect loop
    /// until the user re-enables it via Connect.
    user_disconnected: AtomicBool,
    /// Guards against spawning multiple reconnect loops in parallel.
    reconnect_active: AtomicBool,
    /// Battery voltage + current/temperature diagnostics accumulated from input
    /// frames (updated every frame; the UI polls it any time).
    telemetry: Telemetry,
    /// App-wide settings (connect timeout, idle behavior).
    runtime: Arc<RuntimeSettings>,
    /// App handle for emitting `connection-state` events (empty until setup).
    app: SharedAppHandle,
}

impl JoyConHandle {
    pub fn new(input: InputSender, runtime: Arc<RuntimeSettings>, app: SharedAppHandle) -> Self {
        Self {
            peripheral: Mutex::new(None),
            input,
            state: Mutex::new(ConnectionState::Reconnecting),
            side: Mutex::new(Side::Left),
            snapshot: Mutex::new(None),
            user_disconnected: AtomicBool::new(false),
            reconnect_active: AtomicBool::new(false),
            telemetry: Telemetry::default(),
            runtime,
            app,
        }
    }

    /// Set the connection state and push it to the front end. All state changes
    /// go through here so the `connection-state` event can't be forgotten at a
    /// transition site. The emit is a no-op until `setup` has published the app
    /// handle (early changes are covered by the front-end backstop poll).
    pub(super) async fn set_state(&self, s: ConnectionState) {
        *self.state.lock().await = s;
        if let Some(h) = self.app.get() {
            let _ = h.emit("connection-state", s);
        }
    }

    /// Apply a lifecycle [`LinkEvent`], moving to its target state. This is the
    /// reactive counterpart to the user's imperative [`connect`]/[`disconnect`]:
    /// the reconnect loop and the notify task drive the state through here.
    pub(super) async fn apply_event(&self, event: LinkEvent) {
        self.set_state(event.target()).await;
    }

    /// Latest battery + diagnostics reading. None until the first frame arrives.
    pub fn battery(&self) -> Option<BatteryReading> {
        self.telemetry.reading()
    }

    /// Forget the cached battery/diagnostics reading so a stale value isn't
    /// shown after the link drops (battery() returns None afterwards).
    fn clear_battery(&self) {
        self.telemetry.clear();
    }

    /// Queue a haptic for the BLE loop to send on the next frame (the loop only
    /// drains while connected, so this is a no-op when disconnected).
    pub fn vibrate(&self, v: Vibration) {
        self.runtime.request_vibrate(v);
    }

    /// Send a config swap to the input thread (on save / reset / reload).
    pub fn replace_config(&self, cfg: crate::config::AppConfig) {
        self.input.replace_config(cfg);
    }

    /// Send the definition-reference resolution map to the input thread.
    pub fn replace_definitions(
        &self,
        defs: std::collections::HashMap<String, Vec<crate::config::InputCommand>>,
    ) {
        self.input.replace_definitions(defs);
    }

    /// Release all held-down keys.
    pub fn reset_inputs(&self) {
        self.input.reset();
    }

    pub async fn is_connected(&self) -> bool {
        let guard = self.peripheral.lock().await;
        if let Some(p) = guard.as_ref() {
            p.is_connected().await.unwrap_or(false)
        } else {
            false
        }
    }

    pub async fn connection_state(&self) -> ConnectionState {
        *self.state.lock().await
    }

    pub async fn snapshot(&self) -> Option<JoyConSnapshot> {
        *self.snapshot.lock().await
    }

    pub async fn disconnect(&self) {
        self.user_disconnected.store(true, Ordering::SeqCst);
        let mut guard = self.peripheral.lock().await;
        if let Some(p) = guard.take() {
            let _ = p.disconnect().await;
        }
        drop(guard);
        self.input.reset();
        self.clear_battery();
        self.apply_event(LinkEvent::UserDisconnect).await;
        *self.snapshot.lock().await = None;
    }

    /// Enter (or stay in) the always-on reconnect loop.
    pub async fn connect(self: Arc<Self>) -> Result<(), String> {
        self.user_disconnected.store(false, Ordering::SeqCst);
        self.runtime
            .idle_disconnect_pending
            .store(false, Ordering::Relaxed);
        if !self.is_connected().await {
            self.set_state(ConnectionState::Reconnecting).await;
        }
        self.spawn_reconnect_loop();
        Ok(())
    }

    pub fn spawn_reconnect_loop(self: &Arc<Self>) {
        // Only one loop at a time; subsequent calls are no-ops while running.
        if self.reconnect_active.swap(true, Ordering::SeqCst) {
            return;
        }
        let handle = self.clone();
        tokio::spawn(async move {
            let interval = Duration::from_secs(1);
            // Announce the wait once, not every attempt: while no controller is
            // present the loop retries every second and would otherwise spam
            // "reconnecting… / not found (timeout)" endlessly. A real success is
            // worth a line; the expected timeouts are silent.
            let mut announced = false;
            loop {
                if handle.user_disconnected.load(Ordering::SeqCst) {
                    handle.apply_event(LinkEvent::UserDisconnect).await;
                    break;
                }
                if handle.is_connected().await {
                    // notify task owns lifecycle; it will respawn this loop
                    // if the link drops unexpectedly.
                    break;
                }
                handle.apply_event(LinkEvent::LinkLost).await;
                if !announced {
                    eprintln!("[joycon] waiting for Joy-Con 2 (press its sync button)…");
                    announced = true;
                }
                if handle.clone().connect_inner().await.is_ok() {
                    // connect_inner returns Ok but bails early (no LinkUp) if the
                    // user pressed Stop mid-scan — settle on Disconnected instead
                    // of claiming a connection.
                    if handle.user_disconnected.load(Ordering::SeqCst) {
                        handle.apply_event(LinkEvent::UserDisconnect).await;
                        break;
                    }
                    eprintln!("[joycon] connected");
                    break;
                }
                if handle.user_disconnected.load(Ordering::SeqCst) {
                    handle.apply_event(LinkEvent::UserDisconnect).await;
                    break;
                }
                sleep(interval).await;
            }
            handle.reconnect_active.store(false, Ordering::SeqCst);
            // Close the race with the notify task: if the link dropped in the
            // window between this loop deciding to exit (connect succeeded) and
            // clearing the flag, that drop's spawn_reconnect_loop() saw the flag
            // still set and was swallowed — leaving us "Reconnecting" with no
            // loop scanning. Re-check now that the flag is clear and respawn if
            // we're still disconnected. (The swap-guard makes a redundant spawn a
            // no-op, so this can't double-run.)
            if !handle.user_disconnected.load(Ordering::SeqCst)
                && !handle.is_connected().await
            {
                handle.spawn_reconnect_loop();
            }
        });
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The lifecycle transitions: each event maps to a fixed target state. These
    /// mappings are what the reconnect loop and notify task rely on, so pin them
    /// — a change here is a change to the connection behaviour and should be
    /// deliberate (and re-verified on hardware).
    #[test]
    fn link_event_targets_are_stable() {
        assert_eq!(LinkEvent::LinkUp.target(), ConnectionState::Connected);
        assert_eq!(LinkEvent::LinkLost.target(), ConnectionState::Reconnecting);
        assert_eq!(
            LinkEvent::UserDisconnect.target(),
            ConnectionState::Disconnected
        );
    }
}
