//! Profile / layer resolution: which variants a button press maps to (with
//! per-layer inheritance), and the pie direction calculation.

use crate::config::{
    ButtonAssignment, InheritMode, InputCommand, InputMode, PressConfig, ProfileConfig,
};

/// Keys treated as "modifiers" for layer inheritance (mirrors the front end's
/// MODIFIER_KEYS).
const MODIFIER_KEYS: [&str; 4] = ["Ctrl", "Shift", "Alt", "Win"];

/// True when a press holds a modifier while the button is down: a `LayerHold`,
/// or a Hold/Toggle `Input` made up only of modifier keys.
fn holds_modifier(press: &PressConfig) -> bool {
    match press {
        PressConfig::LayerHold(_) => true,
        PressConfig::Input(p) => {
            matches!(p.mode, InputMode::Hold | InputMode::Toggle)
                && !p.inputs.is_empty()
                && p.inputs.iter().all(|c| {
                    matches!(
                        c,
                        InputCommand::Keyboard { value }
                            if MODIFIER_KEYS.contains(&value.as_str())
                    )
                })
        }
        _ => false,
    }
}

/// True when a button carries into a child layer under [`InheritMode::Modifiers`]:
/// the assignment holds a modifier (see [`holds_modifier`]), so hold-to-switch
/// and modifier-holding buttons keep working in every layer.
fn inherits_under_modifiers(assignment: &ButtonAssignment) -> bool {
    holds_modifier(&assignment.press)
}

/// The assignment for a button (one per button). A button in the active layer
/// wins; otherwise the base (initial) layer is inherited per the layer's
/// [`InheritMode`] (all / modifiers-only / none). Returns a cloned assignment so
/// no borrow of the profile is held across ticks.
pub(super) fn resolve_assignment(
    profile: &ProfileConfig,
    active_layer: &str,
    btn: &str,
) -> Option<ButtonAssignment> {
    let own_layer = profile.layers.get(active_layer);
    let own = own_layer.and_then(|l| l.buttons.get(btn));
    let mode = own_layer.map(|l| l.inherit).unwrap_or_default();
    let is_base = active_layer == profile.initial_layer;
    let assignment = match own {
        Some(a) => a,
        None if !is_base => {
            let base = profile
                .layers
                .get(&profile.initial_layer)
                .and_then(|l| l.buttons.get(btn))?;
            match mode {
                InheritMode::All => base,
                InheritMode::Modifiers if inherits_under_modifiers(base) => base,
                _ => return None,
            }
        }
        None => return None,
    };
    Some(assignment.clone())
}

/// The fallback profile is keyed "デフォルト"; older configs used "default".
pub(super) fn is_default_key(k: &str) -> bool {
    k == "デフォルト" || k == "default"
}

pub(super) fn strip_exe(s: &str) -> String {
    let lower = s.to_ascii_lowercase();
    lower
        .strip_suffix(".exe")
        .map(|s| s.to_string())
        .unwrap_or(lower)
}

// ── Direction calc ──────────────────────────────────────────────────────────

/// Squared cursor distance from the pie start (avoids a sqrt at the call
/// site — compare against `radius * radius`).
pub(super) fn cursor_dist_sq(start: (i32, i32), end: (i32, i32)) -> i64 {
    let dx = (end.0 - start.0) as i64;
    let dy = (end.1 - start.1) as i64;
    dx * dx + dy * dy
}

/// Which pie slice the cursor move points at: the slice whose angle is
/// nearest the move direction. Returns `None` for the centre — the move stayed
/// within `threshold`, or there are no slices. Angles are degrees, 0 = up,
/// clockwise; the screen delta (y down) is converted to that convention.
pub(super) fn nearest_slice(
    start: (i32, i32),
    end: (i32, i32),
    threshold: i32,
    angles: &[f32],
) -> Option<usize> {
    let dx = (end.0 - start.0) as f64;
    let dy = (end.1 - start.1) as f64;
    let thr = threshold as f64;
    if angles.is_empty() || dx * dx + dy * dy < thr * thr {
        return None;
    }
    // atan2(dy, dx): 0 = right, +90° = down (screen), −90° = up. Shift so 0 = up.
    let data = (dy.atan2(dx).to_degrees() + 90.0).rem_euclid(360.0);
    let mut best = 0usize;
    let mut best_dist = f64::INFINITY;
    for (i, &a) in angles.iter().enumerate() {
        let mut d = (data - a as f64).rem_euclid(360.0);
        if d > 180.0 {
            d = 360.0 - d;
        }
        if d < best_dist {
            best_dist = d;
            best = i;
        }
    }
    Some(best)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::{InputPress, LayerConfig, LayerHoldPress, PiePress};
    use indexmap::IndexMap;
    use std::collections::BTreeMap;

    // ── Builders ────────────────────────────────────────────────────────────

    fn keys(names: &[&str]) -> Vec<InputCommand> {
        names
            .iter()
            .map(|k| InputCommand::Keyboard { value: k.to_string() })
            .collect()
    }

    fn input(mode: InputMode, names: &[&str]) -> ButtonAssignment {
        ButtonAssignment {
            def: None,
            press: PressConfig::Input(InputPress {
                mode,
                label: None,
                repeat_ms: None,
                inputs: keys(names),
            }),
        }
    }

    fn layer_hold(target: &str) -> ButtonAssignment {
        ButtonAssignment {
            def: None,
            press: PressConfig::LayerHold(LayerHoldPress {
                label: None,
                layer: target.to_string(),
                inputs: Vec::new(),
            }),
        }
    }

    fn pie() -> ButtonAssignment {
        ButtonAssignment {
            def: None,
            press: PressConfig::Pie(Box::new(PiePress::default())),
        }
    }

    fn layer(inherit: InheritMode, buttons: Vec<(&str, ButtonAssignment)>) -> LayerConfig {
        let mut map = BTreeMap::new();
        for (b, a) in buttons {
            map.insert(b.to_string(), a);
        }
        LayerConfig {
            buttons: map,
            inherit,
            ..Default::default()
        }
    }

    fn profile(initial: &str, layers: Vec<(&str, LayerConfig)>) -> ProfileConfig {
        let mut map = IndexMap::new();
        for (name, l) in layers {
            map.insert(name.to_string(), l);
        }
        ProfileConfig {
            initial_layer: initial.to_string(),
            layers: map,
            ..Default::default()
        }
    }

    // ── resolve_assignment: own-layer vs. base inheritance ──────────────────

    #[test]
    fn own_layer_button_wins() {
        let p = profile(
            "base",
            vec![(
                "base",
                layer(InheritMode::All, vec![("a", input(InputMode::Tap, &["A"]))]),
            )],
        );
        let got = resolve_assignment(&p, "base", "a").expect("button resolves");
        assert!(matches!(got.press, PressConfig::Input(_)));
    }

    #[test]
    fn missing_button_resolves_to_none() {
        let p = profile("base", vec![("base", layer(InheritMode::All, vec![]))]);
        assert!(resolve_assignment(&p, "base", "a").is_none());
    }

    #[test]
    fn base_layer_never_inherits() {
        // On the initial layer there is nothing above to inherit from, so an
        // unset button stays unset even though the mode is `All`.
        let p = profile("base", vec![("base", layer(InheritMode::All, vec![]))]);
        assert!(resolve_assignment(&p, "base", "a").is_none());
    }

    #[test]
    fn inherit_all_draws_unset_button_from_base() {
        let p = profile(
            "base",
            vec![
                (
                    "base",
                    layer(InheritMode::All, vec![("a", input(InputMode::Tap, &["A"]))]),
                ),
                ("over", layer(InheritMode::All, vec![])),
            ],
        );
        let got = resolve_assignment(&p, "over", "a").expect("inherited from base");
        assert!(matches!(got.press, PressConfig::Input(_)));
    }

    #[test]
    fn inherit_none_draws_nothing_from_base() {
        let p = profile(
            "base",
            vec![
                (
                    "base",
                    layer(InheritMode::All, vec![("a", input(InputMode::Tap, &["A"]))]),
                ),
                ("over", layer(InheritMode::None, vec![])),
            ],
        );
        assert!(resolve_assignment(&p, "over", "a").is_none());
    }

    #[test]
    fn own_button_overrides_inherited_one() {
        let p = profile(
            "base",
            vec![
                (
                    "base",
                    layer(InheritMode::All, vec![("a", input(InputMode::Tap, &["A"]))]),
                ),
                (
                    "over",
                    layer(InheritMode::All, vec![("a", input(InputMode::Tap, &["B"]))]),
                ),
            ],
        );
        let got = resolve_assignment(&p, "over", "a").expect("own button wins");
        match got.press {
            PressConfig::Input(p) => {
                assert_eq!(p.inputs, keys(&["B"]), "own layer's B, not base's A");
            }
            _ => panic!("expected input press"),
        }
    }

    // ── InheritMode::Modifiers — only modifier-holding buttons carry ────────

    #[test]
    fn modifiers_mode_inherits_layer_hold() {
        let p = profile(
            "base",
            vec![
                ("base", layer(InheritMode::All, vec![("l", layer_hold("nav"))])),
                ("over", layer(InheritMode::Modifiers, vec![])),
            ],
        );
        assert!(
            resolve_assignment(&p, "over", "l").is_some(),
            "a hold-to-switch carries into a modifiers-only layer"
        );
    }

    #[test]
    fn modifiers_mode_inherits_held_modifier_only_input() {
        let p = profile(
            "base",
            vec![
                (
                    "base",
                    layer(InheritMode::All, vec![("c", input(InputMode::Hold, &["Ctrl"]))]),
                ),
                ("over", layer(InheritMode::Modifiers, vec![])),
            ],
        );
        assert!(resolve_assignment(&p, "over", "c").is_some());
    }

    #[test]
    fn modifiers_mode_skips_tap_modifier() {
        // A Tap (not Hold/Toggle) does not "hold" a modifier, so it doesn't carry.
        let p = profile(
            "base",
            vec![
                (
                    "base",
                    layer(InheritMode::All, vec![("c", input(InputMode::Tap, &["Ctrl"]))]),
                ),
                ("over", layer(InheritMode::Modifiers, vec![])),
            ],
        );
        assert!(resolve_assignment(&p, "over", "c").is_none());
    }

    #[test]
    fn modifiers_mode_skips_mixed_key_hold() {
        // Ctrl+A is not modifier-only, so a held combo does not carry.
        let p = profile(
            "base",
            vec![
                (
                    "base",
                    layer(
                        InheritMode::All,
                        vec![("c", input(InputMode::Hold, &["Ctrl", "A"]))],
                    ),
                ),
                ("over", layer(InheritMode::Modifiers, vec![])),
            ],
        );
        assert!(resolve_assignment(&p, "over", "c").is_none());
    }

    #[test]
    fn modifiers_mode_skips_plain_input_and_pie() {
        let p = profile(
            "base",
            vec![
                (
                    "base",
                    layer(
                        InheritMode::All,
                        vec![
                            ("a", input(InputMode::Tap, &["A"])),
                            ("p", pie()),
                        ],
                    ),
                ),
                ("over", layer(InheritMode::Modifiers, vec![])),
            ],
        );
        assert!(resolve_assignment(&p, "over", "a").is_none());
        assert!(resolve_assignment(&p, "over", "p").is_none());
    }

    // ── holds_modifier (unit) ───────────────────────────────────────────────

    #[test]
    fn holds_modifier_classifies_presses() {
        assert!(holds_modifier(&layer_hold("nav").press));
        assert!(holds_modifier(&input(InputMode::Hold, &["Ctrl"]).press));
        assert!(holds_modifier(&input(InputMode::Toggle, &["Shift"]).press));
        // Not modifier-holding:
        assert!(!holds_modifier(&input(InputMode::Tap, &["Ctrl"]).press));
        assert!(!holds_modifier(&input(InputMode::Hold, &["A"]).press));
        assert!(!holds_modifier(&input(InputMode::Hold, &[]).press));
        assert!(!holds_modifier(&pie().press));
    }

    // ── App-match helpers ───────────────────────────────────────────────────

    #[test]
    fn strip_exe_lowercases_and_drops_suffix() {
        assert_eq!(strip_exe("Chrome.exe"), "chrome");
        assert_eq!(strip_exe("NOTEPAD"), "notepad");
        assert_eq!(strip_exe("photoshop.EXE"), "photoshop");
    }

    #[test]
    fn is_default_key_matches_both_spellings() {
        assert!(is_default_key("デフォルト"));
        assert!(is_default_key("default"));
        assert!(!is_default_key("chrome"));
    }

    // ── Pie direction: nearest_slice / cursor_dist_sq ───────────────────────

    /// Cardinal angles: 0 = up, 90 = right, 180 = down, 270 = left.
    const CARDINAL: [f32; 4] = [0.0, 90.0, 180.0, 270.0];

    #[test]
    fn nearest_slice_empty_angles_is_center() {
        assert_eq!(nearest_slice((0, 0), (0, -50), 10, &[]), None);
    }

    #[test]
    fn nearest_slice_within_threshold_is_center() {
        // Move of ~2.8px stays inside the 10px dead-zone → centre (None).
        assert_eq!(nearest_slice((0, 0), (2, 2), 10, &CARDINAL), None);
    }

    #[test]
    fn nearest_slice_picks_cardinal_directions() {
        // Screen y grows downward; the calc shifts so 0° = up.
        assert_eq!(nearest_slice((0, 0), (0, -50), 10, &CARDINAL), Some(0)); // up
        assert_eq!(nearest_slice((0, 0), (50, 0), 10, &CARDINAL), Some(1)); // right
        assert_eq!(nearest_slice((0, 0), (0, 50), 10, &CARDINAL), Some(2)); // down
        assert_eq!(nearest_slice((0, 0), (-50, 0), 10, &CARDINAL), Some(3)); // left
    }

    #[test]
    fn nearest_slice_snaps_diagonal_to_closest() {
        // Up-and-slightly-right → nearest is up (0), not right (90).
        assert_eq!(nearest_slice((0, 0), (5, -50), 10, &CARDINAL), Some(0));
    }

    #[test]
    fn cursor_dist_sq_is_squared_euclidean() {
        assert_eq!(cursor_dist_sq((0, 0), (3, 4)), 25);
        assert_eq!(cursor_dist_sq((10, 10), (13, 14)), 25);
        assert_eq!(cursor_dist_sq((0, 0), (0, 0)), 0);
    }
}
