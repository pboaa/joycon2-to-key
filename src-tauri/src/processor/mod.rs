//! Input processor: turns pressed-button frames into keyboard/mouse output.
//! Split by concern: `press` (per-button down/hold/up dispatch + variant
//! effects), `effects` (per-press-type actions), `variant` (profile/layer
//! resolution), `cursor` (stick→mouse motion), `resolver` (foreground-app
//! → profile/layer resolution).

mod cursor;
mod effects;
mod press;
mod resolver;
mod variant;

use std::collections::HashMap;
use std::sync::atomic::Ordering;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use serde::Serialize;
use tauri::{Emitter, Manager};

use crate::buttons::ButtonSet;
use crate::config::{
    AppConfig, ButtonAssignment, InputCommand, InputTuning, ProfileConfig, RuntimeSettings,
};
use crate::input_thread::Analog;
use crate::joycon::Side;
use crate::keyboard::release_all;
use crate::SharedAppHandle;

use cursor::CursorMotion;
use effects::release_inputs;

/// The runtime's currently-active profile + layer, shared with the UI so the
/// Joy-Con view can follow layer switches made from the physical controller.
#[derive(Clone, Default, Serialize)]
pub struct ActiveLayer {
    pub profile: String,
    pub layer: String,
}

pub type SharedActiveLayer = Arc<Mutex<ActiveLayer>>;

pub struct InputProcessor {
    config: AppConfig,

    prev_buttons: ButtonSet,
    /// Per-profile-name → currently active layer name. Persists across
    /// process changes so each app remembers its own layer selection.
    active_layers: HashMap<String, String>,

    /// btnKey → the assignment captured on down, for a symmetric onUp.
    active_configs: HashMap<String, ButtonAssignment>,
    /// btnKey → keys currently held due to a Modifier or Input(hold).
    active_effects: HashMap<String, Vec<InputCommand>>,
    /// btnKey → keys latched down by an Input(toggle). Persist across button-up;
    /// a second press releases them.
    toggled: HashMap<String, Vec<InputCommand>>,
    /// btnKey → last fire instant (Input.tap repeat).
    repeat_timers: HashMap<String, Instant>,
    /// btnKey → cursor pos captured on down (Pie).
    pie_starts: HashMap<String, (i32, i32)>,
    /// btnKey → (profile, previous layer) captured while a LayerHold is held.
    layer_hold_prev: HashMap<String, (String, String)>,

    current_app: String,
    last_app_check: Option<Instant>,
    /// Our own executable file name, so focusing the editor doesn't count as an
    /// app switch (keeps the last real app's profile).
    self_exe: String,
    /// True while our own window is the foreground app. Button presses then fire
    /// nothing and aren't counted — we don't want the mappings driving (or
    /// polluting the stats of) the app's own editor.
    self_focused: bool,

    /// Cached (app, profile_name, merged profile). Rebuilt only when the
    /// foreground app changes, so per-button events avoid the deep clone/merge.
    resolved: Option<(String, String, Arc<ProfileConfig>)>,

    /// Published (profile, layer) for the UI, and the last value written.
    active: SharedActiveLayer,
    last_active: (String, String),

    /// App-wide input tuning (pie threshold, scroll amount).
    runtime: Arc<RuntimeSettings>,

    /// Definition id → its inputs, for resolving `InputCommand::Def` references
    /// live (input-type definitions only). Refreshed on save.
    definitions: HashMap<String, Vec<InputCommand>>,

    /// Smoothed stick→mouse cursor motion (velocity, sub-pixel carry, time).
    cursor: CursorMotion,

    /// App handle for emitting `active-layer` events (empty until setup).
    app: SharedAppHandle,

    /// Active pie's slice angles (set on pie-down) so the live-direction
    /// ticker can find the nearest slice as the mouse moves.
    pie_slice_angles: Vec<f32>,
    /// Last slice index pushed to the overlay (`-1` = centre), so we only emit on
    /// change while a pie button is held.
    last_pie_slice: Option<i32>,
    /// Last cursor offset (from the pie start, physical px) pushed to the
    /// overlay, so the active-direction label can follow the mouse; emitted only on
    /// change.
    last_pie_pos: Option<(i32, i32)>,
    /// Physical-px radius (from the pie start) beyond which a release cancels
    /// the pie (moved past the pie's outer ring). 0 = disabled. Set on open.
    pie_cancel_radius: i32,
    /// Per-pie overrides for the active pie (`None` = use the global value).
    pie_threshold_override: Option<i32>,
    pie_size_override: Option<i32>,
    /// Last time the usage counts were flushed to disk (throttle file writes).
    last_usage_flush: Instant,
    /// (profile, layer, button) of the active pie, captured at button-down,
    /// so the fired direction is recorded under the same context at button-up.
    pie_ctx: Option<(String, String, String)>,
}

impl InputProcessor {
    pub fn new(
        config: AppConfig,
        active: SharedActiveLayer,
        runtime: Arc<RuntimeSettings>,
        app: SharedAppHandle,
    ) -> Self {
        let self_exe = std::env::current_exe()
            .ok()
            .and_then(|p| p.file_name().map(|f| f.to_string_lossy().into_owned()))
            .unwrap_or_default();
        Self {
            config,
            prev_buttons: ButtonSet::default(),
            active_layers: HashMap::new(),
            active_configs: HashMap::new(),
            active_effects: HashMap::new(),
            toggled: HashMap::new(),
            repeat_timers: HashMap::new(),
            pie_starts: HashMap::new(),
            layer_hold_prev: HashMap::new(),
            current_app: "default".to_string(),
            last_app_check: None,
            self_exe,
            self_focused: false,
            resolved: None,
            active,
            last_active: (String::new(), String::new()),
            runtime,
            definitions: HashMap::new(),
            cursor: CursorMotion::default(),
            app,
            pie_slice_angles: Vec::new(),
            last_pie_slice: None,
            last_pie_pos: None,
            pie_cancel_radius: 0,
            pie_threshold_override: None,
            pie_size_override: None,
            last_usage_flush: Instant::now(),
            pie_ctx: None,
        }
    }

    /// Replace the definition-resolution map (input-type definitions only).
    pub fn set_definitions(&mut self, defs: HashMap<String, Vec<InputCommand>>) {
        self.definitions = defs;
    }

    /// Expand any `InputCommand::Def` references into the referenced definition's
    /// inputs. Two guards make reference cycles / blow-ups harmless: a depth cap
    /// (a cycle can't recurse forever) and a total-output cap (even a self-
    /// referencing fan-out can't produce an unbounded list). Non-def commands
    /// pass through unchanged.
    fn expand_defs(&self, cmds: &[InputCommand]) -> Vec<InputCommand> {
        /// Max recursion depth for nested definition references.
        const MAX_DEPTH: u8 = 8;
        /// Hard cap on the number of commands one expansion may yield.
        const MAX_OUT: usize = 256;
        fn go(
            cmds: &[InputCommand],
            defs: &HashMap<String, Vec<InputCommand>>,
            depth: u8,
            out: &mut Vec<InputCommand>,
        ) {
            for c in cmds {
                if out.len() >= MAX_OUT {
                    return; // blew the budget (likely a cyclic fan-out) — stop.
                }
                match c {
                    InputCommand::Def { def } => {
                        if depth == 0 {
                            continue; // too deep (likely a cycle) — drop.
                        }
                        if let Some(inner) = defs.get(def) {
                            go(inner, defs, depth - 1, out);
                        }
                    }
                    other => out.push(other.clone()),
                }
            }
        }
        let mut out = Vec::with_capacity(cmds.len());
        go(cmds, &self.definitions, MAX_DEPTH, &mut out);
        out
    }

    /// Current app-wide input tuning as a settings value.
    fn settings(&self) -> InputTuning {
        self.runtime.input_tuning()
    }

    /// Physical-px radius matching the pie's outer ring (viewBox 132 of a
    /// `size`-logical-px window at the current DPI). Releasing beyond it cancels.
    fn pie_cancel_radius_px(&self) -> i32 {
        let size = self
            .pie_size_override
            .unwrap_or_else(|| self.runtime.pie_overlay_size.load(Ordering::Relaxed))
            as f64;
        let scale = self
            .app
            .get()
            .and_then(|a| a.get_webview_window(crate::PIE_OVERLAY_LABEL))
            .and_then(|w| w.scale_factor().ok())
            .unwrap_or(1.0);
        (132.0 * size * scale / 280.0) as i32
    }

    /// Show the pie pie-menu overlay full-screen over the monitor under the
    /// cursor, and tell the frontend where the pie centre is (window-relative
    /// physical px) so it draws the pie at the cursor start. Full-screen gives the
    /// active-direction label room to follow the mouse anywhere on that monitor.
    fn show_pie_overlay(&self, (x, y): (i32, i32)) {
        let Some(app) = self.app.get() else { return };
        let Some(win) = app.get_webview_window(crate::PIE_OVERLAY_LABEL) else {
            return;
        };
        // Monitor under the cursor (fall back to primary), and cover it.
        let mon = win
            .available_monitors()
            .unwrap_or_default()
            .into_iter()
            .find(|m| {
                let p = m.position();
                let s = m.size();
                x >= p.x
                    && y >= p.y
                    && (x - p.x) < s.width as i32
                    && (y - p.y) < s.height as i32
            })
            .or_else(|| win.primary_monitor().ok().flatten());
        let geom = mon.as_ref().map(|m| {
            let p = m.position();
            let s = m.size();
            // Cover the monitor but 1px short of its full height: a borderless
            // topmost window that *exactly* fills the monitor is classified by
            // Windows as a "fullscreen app", which turns on Focus Assist (notifications off)
            // and can make the layered overlay vanish. One pixel shy avoids that
            // while still drawing the pie anywhere under the cursor.
            (
                tauri::PhysicalPosition::new(p.x, p.y),
                tauri::PhysicalSize::new(s.width, s.height.saturating_sub(1)),
            )
        });
        let (ox, oy) = geom.as_ref().map_or((0, 0), |(p, _)| (p.x, p.y));
        if let Some((pos, size)) = &geom {
            let _ = win.set_position(*pos);
            let _ = win.set_size(*size);
        }
        // Pie centre = the pie start, relative to the (full-screen) window.
        let _ = app.emit_to(crate::PIE_OVERLAY_LABEL, "pie-center", (x - ox, y - oy));
        let _ = win.show();
        // Re-apply after show: a window that was hidden (or never shown) can
        // ignore the pre-show geometry, so the realized window is positioned
        // again here — otherwise the first pie / a pie after a preview flashes
        // at the window's stale (top-left) position for a frame.
        if let Some((pos, size)) = &geom {
            let _ = win.set_position(*pos);
            let _ = win.set_size(*size);
        }
    }

    /// Hide the pie overlay on a *state reset* (config-replace on autosave,
    /// disconnect, …). No-op while the settings UI owns the overlay as a style
    /// preview — otherwise every autosave would reset → hide it mid-preview. A
    /// real pie release must still hide, so it uses [`Self::hide_pie_overlay_now`].
    fn hide_pie_overlay(&self) {
        if self.runtime.overlay_preview() {
            return;
        }
        self.hide_pie_overlay_now();
    }

    /// Hide the pie overlay unconditionally — used when a real pie is released,
    /// so the fired menu disappears even if a settings preview is open (the
    /// preview would otherwise keep it stuck on screen).
    fn hide_pie_overlay_now(&self) {
        if let Some(app) = self.app.get() {
            if let Some(win) = app.get_webview_window(crate::PIE_OVERLAY_LABEL) {
                let _ = win.hide();
            }
        }
    }

    /// While a pie button is held, push the direction the cursor currently
    /// points at to the overlay (only on change, so the highlight follows the
    /// mouse). Runs every tick — cheap and a no-op when no pie is active.
    fn update_pie_direction(&mut self) {
        let Some(start) = self.pie_starts.values().next().copied() else {
            self.last_pie_slice = None;
            self.last_pie_pos = None;
            self.pie_threshold_override = None;
            self.pie_size_override = None;
            return;
        };
        let pos = crate::mouse::cursor_pos();
        let thr = self
            .pie_threshold_override
            .unwrap_or_else(|| self.settings().pie_threshold);
        let r = self.pie_cancel_radius;
        let cancelled = r > 0 && variant::cursor_dist_sq(start, pos) > (r as i64) * (r as i64);
        let idx = if cancelled {
            -3 // beyond the outer ring → will cancel
        } else {
            match variant::nearest_slice(start, pos, thr, &self.pie_slice_angles) {
                Some(i) => i as i32,
                None => -1, // centre
            }
        };
        let app = self.app.get();
        if self.last_pie_slice != Some(idx) {
            self.last_pie_slice = Some(idx);
            if let Some(app) = app {
                let _ = app.emit_to(crate::PIE_OVERLAY_LABEL, "pie-dir", idx);
            }
        }
        // Cursor offset from the start (physical px) → the overlay places the
        // active-direction label at the mouse. Emitted only when it moves.
        let off = (pos.0 - start.0, pos.1 - start.1);
        if self.last_pie_pos != Some(off) {
            self.last_pie_pos = Some(off);
            if let Some(app) = app {
                let _ = app.emit_to(crate::PIE_OVERLAY_LABEL, "pie-pos", off);
            }
        }
    }

    pub fn replace_config(&mut self, config: AppConfig) {
        // Keep the physically-held button set across the swap. reset() zeroes
        // prev_buttons, which would make every still-held button a fresh down
        // edge on the next frame — re-firing taps, re-opening pies at the
        // current cursor, re-latching toggles — every time the 400ms debounced
        // autosave replaces the config. Preserving it means held buttons stay
        // released-but-inert until actually released and re-pressed.
        let held = self.prev_buttons;
        self.reset();
        self.prev_buttons = held;
        self.config = config;
        self.active_layers.clear();
        self.resolved = None;
    }

    pub fn reset(&mut self) {
        for cmds in self.active_effects.values() {
            release_inputs(cmds, &InputTuning::default());
        }
        // Release any keys still latched down by an Input(toggle).
        for cmds in self.toggled.values() {
            release_inputs(cmds, &InputTuning::default());
        }
        self.prev_buttons = ButtonSet::default();
        self.active_configs.clear();
        self.active_effects.clear();
        self.toggled.clear();
        self.repeat_timers.clear();
        self.pie_starts.clear();
        self.pie_ctx = None;
        self.hide_pie_overlay(); // a mid-hold pie was interrupted
        // Restore any layer held via a LayerHold that never saw its release.
        for (_, (prof, prev)) in self.layer_hold_prev.drain() {
            self.active_layers.insert(prof, prev);
        }
        self.cursor.reset();
        release_all();
    }

    /// Returns true when the stick drove the cursor this tick, so the idle timer
    /// can count stick-as-mouse cursor motion as activity.
    pub fn process(&mut self, pressed: ButtonSet, analog: Analog) -> bool {
        let mut pressed = pressed;
        let mut stick_moved = false;

        // Flush usage counts to disk at most every few seconds when they changed.
        if self.last_usage_flush.elapsed() >= Duration::from_secs(5)
            && self.runtime.take_usage_dirty()
        {
            self.last_usage_flush = Instant::now();
            crate::config::save_all_usage(&self.runtime);
        }

        // Resolve + publish the active profile/layer every tick so the UI can
        // follow foreground-app changes even while idle. refresh_current_app
        // throttles the Win32 call, and ensure_resolved only rebuilds the
        // merged profile when the foreground app actually changes, so this
        // stays cheap.
        self.refresh_current_app();
        self.ensure_resolved();
        let (profile_name, profile) = {
            let (_, name, rc) = self.resolved.as_ref().unwrap();
            (name.clone(), Arc::clone(rc))
        };
        let active_layer = self.ensure_layer(&profile_name, &profile);

        // Analog stick → mouse cursor, per the ACTIVE layer's settings (so a
        // "mouse layer" can coexist with normal layers). Runs every tick for
        // smooth motion; the stick's digital directions are suppressed so it
        // doesn't also fire mapped direction actions (assignment replaces).
        if let Some(layer) = profile.layers.get(&active_layer) {
            // Stick→mouse is configured independently per side; apply the setting
            // for the actually-connected Joy-Con.
            let (stick_on, stick_speed) = match analog.side {
                Side::Right => (layer.stick_mouse_r, layer.stick_mouse_speed_r),
                Side::Left => (layer.stick_mouse, layer.stick_mouse_speed),
            };
            if stick_on {
                // Convert the stick-deadzone setting (0–50%) to 0..1.
                let dz = (self.runtime.stick_deadzone.load(Ordering::Relaxed) as f32 / 100.0)
                    .clamp(0.0, 0.9);
                stick_moved = self
                    .cursor
                    .apply_stick(analog.stick, stick_speed as f32, dz);
                pressed = pressed.without_stick_directions();
            }
        }

        // Publish only on change; compare without collecting so the idle tick
        // (~125 Hz) allocates nothing. BTreeSet iterates sorted and last_mods
        // was collected from the same set, so element order matches.
        if self.last_active.0 != profile_name || self.last_active.1 != active_layer {
            if let Ok(mut g) = self.active.lock() {
                g.profile = profile_name.clone();
                g.layer = active_layer.clone();
            }
            self.last_active = (profile_name.clone(), active_layer.clone());
            // Push the change so the pad can follow the physical controller
            // without the front end polling (the backstop poll still covers a
            // missed event or a pre-setup change).
            if let Some(h) = self.app.get() {
                let _ = h.emit(
                    "active-layer",
                    ActiveLayer {
                        profile: profile_name.clone(),
                        layer: active_layer.clone(),
                    },
                );
            }
        }

        // Follow the mouse for the pie overlay highlight (before the early
        // return: mouse movement doesn't change the pressed set, but the pie
        // direction still needs to update while the button is held).
        self.update_pie_direction();

        // Skip the (Win32-heavy) button handling when nothing changed. Keep
        // ticking while a tap-repeat is running.
        if pressed == self.prev_buttons && self.repeat_timers.is_empty() {
            return stick_moved;
        }

        let now = Instant::now();

        for (i, btn) in self.prev_buttons.union(pressed).iter_names() {
            let is_now = pressed.contains(i);
            let was_prev = self.prev_buttons.contains(i);

            if is_now && !was_prev {
                // Suppress firing (and its stat) while our own window is focused
                // — the mappings shouldn't type into / drive the app itself.
                if !self.self_focused {
                    self.handle_down(btn, &profile_name, &profile, &active_layer, now);
                }
            } else if is_now && was_prev {
                if !self.self_focused {
                    self.handle_hold(btn, now);
                }
            } else if !is_now && was_prev {
                // Always release, so a hold that began before focusing the app
                // doesn't leave a key stuck down.
                self.handle_up(btn);
            }
        }

        self.prev_buttons = pressed;
        stick_moved
    }
}
