//! Serde schema for the workspace: profiles, layers, assignments, presses,
//! definitions and global settings. Mirrored by `src/lib/types.ts` on the front
//! end — kept in sync by hand, with the serialized-shape lock tests at the
//! bottom of this file guarding the JSON contract so drift is caught in CI
//! rather than at runtime over IPC.
//!
//! Split by concern (each file mirrors a section of `src/lib/types.ts`):
//! `profile` (profiles / layers / assignments), `press` (press types + input
//! commands), `pie` (pie menus), `definitions` (the reusable-action library),
//! and `settings` (app-wide [`GlobalSettings`]). Re-exported flat, so consumers
//! keep using `crate::config::X`.

mod definitions;
mod pie;
mod press;
mod profile;
mod settings;

pub use definitions::*;
pub use pie::*;
pub use press::*;
pub use profile::*;
pub use settings::*;

#[cfg(test)]
mod tests {
    use super::*;
    use indexmap::IndexMap;
    use std::collections::BTreeMap;

    fn inherit_of(json: &str) -> InheritMode {
        serde_json::from_str::<LayerConfig>(json).unwrap().inherit
    }

    #[test]
    fn inherit_accepts_legacy_bool_and_new_strings() {
        // Legacy booleans.
        assert_eq!(inherit_of(r#"{"inherit": true}"#), InheritMode::All);
        assert_eq!(inherit_of(r#"{"inherit": false}"#), InheritMode::None);
        // New tri-state strings.
        assert_eq!(inherit_of(r#"{"inherit": "all"}"#), InheritMode::All);
        assert_eq!(
            inherit_of(r#"{"inherit": "modifiers"}"#),
            InheritMode::Modifiers
        );
        assert_eq!(inherit_of(r#"{"inherit": "none"}"#), InheritMode::None);
        // Missing = pre-tristate file → inherit all (back-compat).
        assert_eq!(inherit_of(r#"{}"#), InheritMode::All);
    }

    #[test]
    fn inherit_serializes_to_lowercase_strings() {
        let layer = LayerConfig {
            buttons: BTreeMap::new(),
            inherit: InheritMode::Modifiers,
            ..Default::default()
        };
        let json = serde_json::to_string(&layer).unwrap();
        assert!(json.contains(r#""inherit":"modifiers""#), "got {json}");
    }

    /// The tauri IPC routes command args/results through `serde_json::Value`,
    /// whose map is a sorted BTreeMap unless serde_json's "preserve_order"
    /// feature is on. This reproduces that round-trip and asserts order is
    /// kept — the actual fix that stops layers being alphabetized in the UI.
    #[test]
    fn value_roundtrip_preserves_layer_order() {
        let mut layers: IndexMap<String, LayerConfig> = IndexMap::new();
        for n in ["zzz", "aaa", "デフォルト"] {
            layers.insert(n.to_string(), LayerConfig::default());
        }
        let profile = ProfileConfig {
            match_apps: vec![],
            initial_layer: "デフォルト".into(),
            layers,
            icon: None,
            app_icons: Default::default(),
        };
        let value = serde_json::to_value(&profile).unwrap();
        let back: ProfileConfig = serde_json::from_value(value).unwrap();
        let order: Vec<&str> = back.layers.keys().map(String::as_str).collect();
        assert_eq!(order, vec!["zzz", "aaa", "デフォルト"]);
    }

    /// Layers must keep their authored order (IndexMap), NOT be alphabetized.
    /// Guards against regressing `layers` back to a sorted map like BTreeMap.
    #[test]
    fn profile_preserves_layer_order() {
        // "z" before "a" before katakana — deliberately NOT sorted.
        let json = r#"{"initialLayer":"z","layers":{
            "z":{"buttons":{}},"a":{"buttons":{}},"デフォルト":{"buttons":{}}}}"#;
        let p: ProfileConfig = serde_json::from_str(json).unwrap();
        let order: Vec<&str> = p.layers.keys().map(String::as_str).collect();
        assert_eq!(order, vec!["z", "a", "デフォルト"]);
        // A save/load round-trip keeps the same order.
        let round: ProfileConfig =
            serde_json::from_str(&serde_json::to_string(&p).unwrap()).unwrap();
        let order2: Vec<&str> = round.layers.keys().map(String::as_str).collect();
        assert_eq!(order2, vec!["z", "a", "デフォルト"]);
    }

    // ── Serialized-shape locks ───────────────────────────────────────────────
    // These pin the exact JSON contract that `src/lib/types.ts` mirrors by hand.
    // If a serde attribute changes (a renamed field, a different enum tag or
    // casing), one of these fails — a signal to update the TS types in tandem,
    // instead of the mismatch only surfacing at runtime over IPC.

    /// `InputCommand` is internally tagged (`type`) with camelCase fields.
    #[test]
    fn input_command_json_shapes() {
        use serde_json::json;
        let cases: Vec<(InputCommand, serde_json::Value)> = vec![
            (
                InputCommand::Keyboard { value: "A".into() },
                json!({"type": "keyboard", "value": "A"}),
            ),
            (
                InputCommand::MouseButton { value: MouseButtonName::Left, double: false },
                json!({"type": "mouseButton", "value": "left", "double": false}),
            ),
            (
                InputCommand::Scroll { value: ScrollDir::Up, amount: Some(120) },
                json!({"type": "scroll", "value": "up", "amount": 120}),
            ),
            (
                InputCommand::Def { def: "d1".into() },
                json!({"type": "def", "def": "d1"}),
            ),
        ];
        for (cmd, want) in cases {
            assert_eq!(serde_json::to_value(&cmd).unwrap(), want, "shape of {cmd:?}");
        }
    }

    /// `PressConfig` is internally tagged with camelCase variant names, and
    /// `InputMode` is lowercase.
    #[test]
    fn press_config_and_mode_tags() {
        let input = PressConfig::Input(InputPress {
            mode: InputMode::Toggle,
            label: None,
            repeat_ms: None,
            inputs: vec![],
        });
        let v = serde_json::to_value(&input).unwrap();
        assert_eq!(v["type"], "input");
        assert_eq!(v["mode"], "toggle");

        let pie = PressConfig::Pie(Box::new(PiePress::default()));
        assert_eq!(serde_json::to_value(&pie).unwrap()["type"], "pie");

        let layer_hold = PressConfig::LayerHold(LayerHoldPress {
            label: None,
            layer: "m".into(),
            inputs: vec![],
        });
        assert_eq!(serde_json::to_value(&layer_hold).unwrap()["type"], "layerHold");
    }

    /// `ButtonAssignment.def` is omitted when None (skip_serializing_if) and
    /// present otherwise; `press` is always present.
    #[test]
    fn button_assignment_def_is_optional() {
        let press = PressConfig::Input(InputPress {
            mode: InputMode::Tap,
            label: None,
            repeat_ms: None,
            inputs: vec![],
        });
        let unlinked = ButtonAssignment { def: None, press: press.clone() };
        let v = serde_json::to_value(&unlinked).unwrap();
        assert!(v.get("def").is_none(), "def omitted when unlinked");
        assert!(v.get("press").is_some());

        let linked = ButtonAssignment { def: Some("d".into()), press };
        assert_eq!(serde_json::to_value(&linked).unwrap()["def"], "d");
    }

    /// The app-wide settings serialize with the camelCase keys the front end
    /// reads. Locks the settings contract (a renamed field would fail here).
    #[test]
    fn global_settings_camel_case_keys() {
        let v = serde_json::to_value(GlobalSettings::default()).unwrap();
        for key in [
            "idleEnabled",
            "idleTimeoutSecs",
            "pieThreshold",
            "scrollAmount",
            "theme",
            "language",
            "connectVibration",
            "playerLeds",
            "stickDeadzone",
            "batteryFullMv",
            "batteryEmptyMv",
            "defaultRepeatMs",
            "accentL",
            "accentR",
            "mapColor",
            "usageRetentionDays",
        ] {
            assert!(v.get(key).is_some(), "settings missing camelCase key {key}");
        }
    }
}
