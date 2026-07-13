//! Per-button press dispatch. A press fires its assignment immediately on down;
//! a held tap-mode input drives tap-repeat; release runs the up-side. `handle_*`
//! route the down/hold/up transitions for a button; `variant_*` run a resolved
//! variant's down/up effects (shared entry points for the press-type handlers in
//! `effects`).

use std::time::Instant;

use crate::config::{ButtonAssignment, InputMode, PressConfig, ProfileConfig};

use super::effects::fire_inputs;
use super::variant::resolve_assignment;
use super::InputProcessor;

impl InputProcessor {
    pub(super) fn handle_down(
        &mut self,
        btn: &str,
        profile_name: &str,
        profile: &ProfileConfig,
        active_layer: &str,
        now: Instant,
    ) {
        if let Some(a) = resolve_assignment(profile, active_layer, btn) {
            // Count one activation for the usage heatmap (per profile/layer/button).
            self.runtime.record_usage(profile_name, active_layer, btn);
            // If this button is a saved operation (linked to a definition), also
            // count it per-operation, so the stat survives moving it elsewhere.
            if let Some(def) = &a.def {
                self.runtime.record_def_usage(def);
            }
            // Remember the context so a fired pie direction is recorded under it.
            if matches!(a.press, PressConfig::Pie(_)) {
                self.pie_ctx = Some((
                    profile_name.to_string(),
                    active_layer.to_string(),
                    btn.to_string(),
                ));
            }
            self.assignment_down(btn, a, profile_name, active_layer, now);
        }
    }

    pub(super) fn handle_hold(&mut self, btn: &str, now: Instant) {
        // Tap-repeat for the assignment that actually fired (in active_configs).
        // Clone what we need so the immutable borrow is released before mutating.
        let repeat = match self.active_configs.get(btn).map(|v| &v.press) {
            Some(PressConfig::Input(p)) if matches!(p.mode, InputMode::Tap) => {
                p.repeat_ms.map(|iv| (iv, p.inputs.clone()))
            }
            _ => None,
        };
        let Some((interval, inputs)) = repeat else {
            return;
        };
        let last = self.repeat_timers.get(btn).copied();
        let elapsed = match last {
            Some(t) => now.saturating_duration_since(t).as_millis() as u64,
            None => u64::MAX,
        };
        if elapsed >= interval {
            fire_inputs(&self.expand_defs(&inputs), &self.settings());
            self.repeat_timers.insert(btn.to_string(), now);
        }
    }

    pub(super) fn handle_up(&mut self, btn: &str) {
        let Some(assignment) = self.active_configs.remove(btn) else {
            self.repeat_timers.remove(btn);
            return;
        };
        self.assignment_up(btn, &assignment);
        self.repeat_timers.remove(btn);
    }

    /// Run an assignment's down-side effect and record it as active (so a later
    /// button-up releases holds and tap-repeat keeps firing).
    fn assignment_down(
        &mut self,
        btn: &str,
        assignment: ButtonAssignment,
        profile_name: &str,
        active_layer: &str,
        now: Instant,
    ) {
        let settings = self.settings();
        match &assignment.press {
            PressConfig::Input(p) => self.on_down_input(btn, p, &settings, now),
            PressConfig::Pie(p) => self.on_down_pie(btn, p),
            PressConfig::LayerHold(p) => {
                self.on_down_layer_hold(btn, p, profile_name, active_layer, &settings)
            }
        }
        self.active_configs.insert(btn.to_string(), assignment);
    }

    /// Run an assignment's up-side effect (release held keys / finish pie).
    fn assignment_up(&mut self, btn: &str, assignment: &ButtonAssignment) {
        let settings = self.settings();
        match &assignment.press {
            PressConfig::Input(p) => self.on_up_input(btn, p, &settings),
            PressConfig::Pie(p) => self.on_up_pie(btn, p, &settings),
            PressConfig::LayerHold(_) => self.on_up_layer_hold(btn, &settings),
        }
    }
}
