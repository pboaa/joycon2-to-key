//! Per-press-type down/up effects, and InputCommand → InputAction emission.

use std::time::Instant;

use serde::Serialize;
use tauri::Emitter;

use crate::config::{
    PiePress, InputCommand, InputMode, InputPress, InputTuning, LayerHoldPress, ScrollDir,
};
use crate::keyboard::send_actions;
use crate::keys::{name_to_vk, InputAction};
use crate::mouse::cursor_pos;

use super::variant::nearest_slice;
use super::InputProcessor;

/// Payload sent to the overlay window when a pie opens: each slice's angle
/// and assigned inputs (plus the centre's), so the overlay can draw the pie and
/// label every wedge the same way the settings editor does. Inputs keep any
/// definition references intact so the overlay can show the definition's name.
#[derive(Serialize)]
struct PieMenuInfo {
    slices: Vec<PieSliceInfo>,
    center: Vec<InputCommand>,
    /// Per-pie look override (merged over the global settings by the overlay).
    appearance: Option<crate::config::PieAppearance>,
    /// Per-pie pie threshold (px), for the overlay's dead-zone circle.
    threshold: Option<i32>,
}

#[derive(Serialize)]
struct PieSliceInfo {
    angle: f32,
    inputs: Vec<InputCommand>,
}

impl InputProcessor {
    /// Press `inputs` and remember them under `btn`, to be released on the
    /// matching button-up via [`Self::release_effect`]. No-op when empty.
    fn hold_effect(&mut self, btn: &str, inputs: &[InputCommand], settings: &InputTuning) {
        if inputs.is_empty() {
            return;
        }
        // Expand any definition references, then hold (and store) the result so
        // the matching button-up releases exactly what was pressed.
        let inputs = self.expand_defs(inputs);
        if inputs.is_empty() {
            return;
        }
        press_inputs(&inputs, settings);
        self.active_effects.insert(btn.to_string(), inputs);
    }

    /// Release the inputs held under `btn` by a prior [`Self::hold_effect`].
    fn release_effect(&mut self, btn: &str, settings: &InputTuning) {
        if let Some(cmds) = self.active_effects.remove(btn) {
            release_inputs(&cmds, settings);
        }
    }

    pub(super) fn on_down_input(
        &mut self,
        btn: &str,
        p: &InputPress,
        settings: &InputTuning,
        now: Instant,
    ) {
        match p.mode {
            InputMode::Tap => {
                let inputs = self.expand_defs(&p.inputs);
                fire_inputs(&inputs, settings);
                if p.repeat_ms.is_some() {
                    self.repeat_timers.insert(btn.to_string(), now);
                }
            }
            InputMode::Hold => {
                self.hold_effect(btn, &p.inputs, settings);
            }
            InputMode::Toggle => {
                // First press latches the keys down; a second press releases
                // them. The latch persists across button-up.
                match self.toggled.remove(btn) {
                    Some(cmds) => release_inputs(&cmds, settings),
                    None => {
                        let inputs = self.expand_defs(&p.inputs);
                        press_inputs(&inputs, settings);
                        self.toggled.insert(btn.to_string(), inputs);
                    }
                }
            }
        }
    }

    pub(super) fn on_up_input(&mut self, btn: &str, p: &InputPress, settings: &InputTuning) {
        if matches!(p.mode, InputMode::Hold) {
            self.release_effect(btn, settings);
        }
    }


    pub(super) fn on_down_pie(&mut self, btn: &str, p: &PiePress) {
        let pos = cursor_pos();
        self.pie_starts.insert(btn.to_string(), pos);
        self.last_pie_slice = None;
        // Remember the slice angles so the live-direction ticker can find the
        // nearest one as the mouse moves.
        self.pie_slice_angles = p.slices.iter().map(|s| s.angle).collect();
        // Per-pie overrides (fall back to the global settings when None).
        self.pie_threshold_override = p.threshold;
        self.pie_size_override = p.appearance.as_ref().and_then(|a| a.size);
        // Release beyond the pie's outer ring cancels (fires nothing) — unless
        // the option is off (per-pie override, else the global setting), in which
        // case a radius of 0 disables the cancel check.
        let cancel_outside = p
            .appearance
            .as_ref()
            .and_then(|a| a.cancel_outside)
            .unwrap_or_else(|| {
                self.runtime
                    .pie_cancel_outside
                    .load(std::sync::atomic::Ordering::Relaxed)
            });
        self.pie_cancel_radius = if cancel_outside {
            self.pie_cancel_radius_px()
        } else {
            0
        };
        // When the overlay is disabled the pie still fires (on button-up) —
        // we just skip the on-screen pie. Per-pie override wins over the global
        // setting when set.
        let overlay_enabled = p.show_overlay.unwrap_or_else(|| {
            self.runtime
                .pie_overlay_enabled
                .load(std::sync::atomic::Ordering::Relaxed)
        });
        if !overlay_enabled {
            return;
        }
        // Tell the overlay the menu (angles + assigned inputs), then show it.
        let menu = PieMenuInfo {
            slices: p
                .slices
                .iter()
                .map(|s| PieSliceInfo {
                    angle: s.angle,
                    inputs: s.inputs.clone(),
                })
                .collect(),
            center: p.center.clone().unwrap_or_default(),
            appearance: p.appearance.clone(),
            threshold: p.threshold,
        };
        if let Some(app) = self.app.get() {
            let _ = app.emit_to(crate::PIE_OVERLAY_LABEL, "pie-open", &menu);
        }
        self.show_pie_overlay(pos);
    }

    pub(super) fn on_up_pie(
        &mut self,
        btn: &str,
        p: &PiePress,
        settings: &InputTuning,
    ) {
        // A real pie was released → hide even if a settings preview is open,
        // otherwise the fired menu stays stuck on screen.
        self.hide_pie_overlay_now();
        let Some(start) = self.pie_starts.remove(btn) else {
            return;
        };
        let angles: Vec<f32> = p.slices.iter().map(|s| s.angle).collect();
        let end = cursor_pos();
        let r = self.pie_cancel_radius;
        // Released beyond the outer ring → cancel (fire nothing).
        let cancelled = r > 0 && super::variant::cursor_dist_sq(start, end) > (r as i64) * (r as i64);
        // Otherwise: nearest slice fires; below threshold / no slice fires the centre.
        let thr = self
            .pie_threshold_override
            .unwrap_or(settings.pie_threshold);
        // target: None = cancelled; Some(Some(i)) = direction i; Some(None) = centre.
        let target = if cancelled {
            None
        } else {
            Some(nearest_slice(start, end, thr, &angles))
        };
        // Record the fired direction for the pie heatmap (cancels are skipped),
        // under the (profile, layer, button) captured at button-down.
        if let (Some(dir), Some((prof, layer, gbtn))) = (target, self.pie_ctx.take()) {
            let key = match dir {
                Some(i) => i.to_string(),
                None => "center".to_string(),
            };
            self.runtime.record_pie_usage(&prof, &layer, &gbtn, &key);
        }
        let cmds = match target {
            None => None,
            Some(Some(i)) => Some(&p.slices[i].inputs),
            Some(None) => p.center.as_ref(),
        };
        if let Some(cmds) = cmds {
            let cmds = self.expand_defs(cmds);
            fire_inputs(&cmds, settings);
        }
    }

    pub(super) fn on_down_layer_hold(
        &mut self,
        btn: &str,
        p: &LayerHoldPress,
        profile_name: &str,
        current_layer: &str,
        settings: &InputTuning,
    ) {
        if p.layer.is_empty() {
            return;
        }
        // Remember the layer that was active so we can restore it on release.
        self.layer_hold_prev.insert(
            btn.to_string(),
            (profile_name.to_string(), current_layer.to_string()),
        );
        self.active_layers
            .insert(profile_name.to_string(), p.layer.clone());
        // Optionally hold keys/modifiers while the layer is active (so a
        // momentary layer can also act like a combination button).
        self.hold_effect(btn, &p.inputs, settings);
    }

    pub(super) fn on_up_layer_hold(&mut self, btn: &str, settings: &InputTuning) {
        if let Some((prof, prev)) = self.layer_hold_prev.remove(btn) {
            self.active_layers.insert(prof, prev);
        }
        self.release_effect(btn, settings);
    }
}

// ── InputCommand → InputAction conversion ───────────────────────────────────

fn cmd_to_actions(
    cmd: &InputCommand,
    pressed: bool,
    settings: &InputTuning,
) -> Vec<InputAction> {
    match cmd {
        InputCommand::Keyboard { value } => match name_to_vk(value) {
            Some(vk) => vec![InputAction::Key { vk, pressed }],
            None => {
                eprintln!("[input] unknown key name: {value}");
                vec![]
            }
        },
        InputCommand::MouseButton { value, double } => {
            let button = (*value).into();
            if *double {
                // Self-contained double-click on press; nothing on release.
                if !pressed {
                    return vec![];
                }
                vec![
                    InputAction::Mouse { button, pressed: true },
                    InputAction::Mouse { button, pressed: false },
                    InputAction::Mouse { button, pressed: true },
                    InputAction::Mouse { button, pressed: false },
                ]
            } else {
                vec![InputAction::Mouse { button, pressed }]
            }
        }
        InputCommand::Scroll { value, amount } => {
            if !pressed {
                // Scroll has no "release" — only emit on press.
                return vec![];
            }
            let mag = amount.unwrap_or(settings.scroll_amount);
            let signed = match value {
                ScrollDir::Up => mag,
                ScrollDir::Down => -mag,
            };
            vec![InputAction::Scroll { amount: signed }]
        }
        // Definition references are expanded before firing (see `expand_defs`),
        // so a stray one here (unresolved id) emits nothing.
        InputCommand::Def { .. } => vec![],
    }
}

pub(super) fn press_inputs(cmds: &[InputCommand], settings: &InputTuning) {
    let actions: Vec<InputAction> = cmds
        .iter()
        .flat_map(|c| cmd_to_actions(c, true, settings))
        .collect();
    if !actions.is_empty() {
        send_actions(&actions);
    }
}

pub(super) fn release_inputs(cmds: &[InputCommand], settings: &InputTuning) {
    let actions: Vec<InputAction> = cmds
        .iter()
        .rev()
        .flat_map(|c| cmd_to_actions(c, false, settings))
        .collect();
    if !actions.is_empty() {
        send_actions(&actions);
    }
}

pub(super) fn fire_inputs(cmds: &[InputCommand], settings: &InputTuning) {
    let mut actions: Vec<InputAction> = cmds
        .iter()
        .flat_map(|c| cmd_to_actions(c, true, settings))
        .collect();
    let ups: Vec<InputAction> = cmds
        .iter()
        .rev()
        .flat_map(|c| cmd_to_actions(c, false, settings))
        .collect();
    actions.extend(ups);
    if !actions.is_empty() {
        send_actions(&actions);
    }
}

#[cfg(test)]
mod tests {
    // Only `cmd_to_actions` (the pure InputCommand → InputAction conversion) is
    // tested here. press_inputs / release_inputs / fire_inputs drive the real
    // Win32 SendInput and can't run in a unit test.
    use super::*;
    use crate::config::MouseButtonName;
    use crate::keys::{name_to_vk, MouseButton};

    fn tuning() -> InputTuning {
        InputTuning::default()
    }

    fn kb(name: &str) -> InputCommand {
        InputCommand::Keyboard { value: name.to_string() }
    }

    // ── Keyboard ────────────────────────────────────────────────────────────

    #[test]
    fn keyboard_known_key_emits_press_and_release() {
        let vk = name_to_vk("A").unwrap();
        assert_eq!(
            cmd_to_actions(&kb("A"), true, &tuning()),
            vec![InputAction::Key { vk, pressed: true }]
        );
        assert_eq!(
            cmd_to_actions(&kb("A"), false, &tuning()),
            vec![InputAction::Key { vk, pressed: false }]
        );
    }

    #[test]
    fn keyboard_unknown_key_emits_nothing() {
        assert!(cmd_to_actions(&kb("NotARealKey"), true, &tuning()).is_empty());
    }

    // ── Mouse button ────────────────────────────────────────────────────────

    #[test]
    fn mouse_single_click_maps_button_and_edge() {
        let cmd = InputCommand::MouseButton { value: MouseButtonName::Right, double: false };
        assert_eq!(
            cmd_to_actions(&cmd, true, &tuning()),
            vec![InputAction::Mouse { button: MouseButton::Right, pressed: true }]
        );
        assert_eq!(
            cmd_to_actions(&cmd, false, &tuning()),
            vec![InputAction::Mouse { button: MouseButton::Right, pressed: false }]
        );
    }

    #[test]
    fn mouse_double_click_is_self_contained_on_press() {
        let cmd = InputCommand::MouseButton { value: MouseButtonName::Left, double: true };
        // Press emits a full down/up/down/up; release emits nothing.
        assert_eq!(
            cmd_to_actions(&cmd, true, &tuning()),
            vec![
                InputAction::Mouse { button: MouseButton::Left, pressed: true },
                InputAction::Mouse { button: MouseButton::Left, pressed: false },
                InputAction::Mouse { button: MouseButton::Left, pressed: true },
                InputAction::Mouse { button: MouseButton::Left, pressed: false },
            ]
        );
        assert!(cmd_to_actions(&cmd, false, &tuning()).is_empty());
    }

    // ── Scroll ──────────────────────────────────────────────────────────────

    #[test]
    fn scroll_uses_settings_amount_and_signs_by_direction() {
        let up = InputCommand::Scroll { value: ScrollDir::Up, amount: None };
        let down = InputCommand::Scroll { value: ScrollDir::Down, amount: None };
        let mag = tuning().scroll_amount;
        assert_eq!(
            cmd_to_actions(&up, true, &tuning()),
            vec![InputAction::Scroll { amount: mag }]
        );
        assert_eq!(
            cmd_to_actions(&down, true, &tuning()),
            vec![InputAction::Scroll { amount: -mag }]
        );
    }

    #[test]
    fn scroll_amount_override_wins_over_settings() {
        let cmd = InputCommand::Scroll { value: ScrollDir::Up, amount: Some(30) };
        assert_eq!(
            cmd_to_actions(&cmd, true, &tuning()),
            vec![InputAction::Scroll { amount: 30 }]
        );
    }

    #[test]
    fn scroll_emits_nothing_on_release() {
        let cmd = InputCommand::Scroll { value: ScrollDir::Up, amount: None };
        assert!(cmd_to_actions(&cmd, false, &tuning()).is_empty());
    }

    // ── Non-Win32 commands ──────────────────────────────────────────────────

    #[test]
    fn def_emits_no_input_actions() {
        // Definition references are expanded before firing, so a stray one here
        // emits nothing (vibration, formerly also here, is no longer an input).
        let def = InputCommand::Def { def: "x".to_string() };
        assert!(cmd_to_actions(&def, true, &tuning()).is_empty());
        assert!(cmd_to_actions(&def, false, &tuning()).is_empty());
    }
}
