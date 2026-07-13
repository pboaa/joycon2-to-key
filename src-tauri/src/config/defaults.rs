//! The builtin starter profile and its small builder helpers.

use std::collections::BTreeMap;

use indexmap::IndexMap;

use super::schema::{
    AppConfig, ButtonAssignment, InheritMode, InputCommand, InputMode, InputPress, LayerConfig,
    PressConfig, ProfileConfig,
};

pub fn builtin_default() -> AppConfig {
    // Ship a single generic profile as a starting point / schema example.
    // Users add their own app-specific profiles and layers from the settings tab.
    let mut cfg = AppConfig::new();
    cfg.insert("デフォルト".into(), default_profile());
    cfg
}

// ── builders ────────────────────────────────────────────────────────────────

fn key(v: &str) -> InputCommand {
    InputCommand::Keyboard { value: v.into() }
}

fn variant(press: PressConfig) -> ButtonAssignment {
    ButtonAssignment { def: None, press }
}

fn input(
    mode: InputMode,
    label: &str,
    repeat_ms: Option<u64>,
    inputs: Vec<InputCommand>,
) -> PressConfig {
    PressConfig::Input(InputPress {
        mode,
        label: Some(label.into()),
        repeat_ms,
        inputs,
    })
}

/// A simple tap-input button (the common case), one label.
fn tap(label: &str, inputs: Vec<InputCommand>) -> ButtonAssignment {
    variant(input(InputMode::Tap, label, None, inputs))
}

fn layer_with(buttons: &[(&str, ButtonAssignment)]) -> LayerConfig {
    let mut map: BTreeMap<String, ButtonAssignment> = BTreeMap::new();
    for (k, v) in buttons {
        map.insert(k.to_string(), v.clone());
    }
    LayerConfig {
        buttons: map,
        inherit: InheritMode::All,
        ..Default::default()
    }
}

fn profile(initial: &str, layers: &[(&str, LayerConfig)]) -> ProfileConfig {
    let mut map = IndexMap::new();
    for (k, v) in layers {
        map.insert(k.to_string(), v.clone());
    }
    ProfileConfig {
        match_apps: Vec::new(),
        initial_layer: initial.into(),
        layers: map,
        icon: None,
        app_icons: Default::default(),
    }
}

// ── default profile ─────────────────────────────────────────────────────────

fn default_profile() -> ProfileConfig {
    // A minimal starter: just undo / redo on each Joy-Con so either one
    // alone is useful out of the box. Everything else is left open for the user
    // to fill in.
    let base = layer_with(&[
        // ── Left Joy-Con ──
        ("left", tap("元に戻す", vec![key("Ctrl"), key("Z")])),
        ("right", tap("やり直し", vec![key("Ctrl"), key("Y")])),
        // ── Right Joy-Con ──
        ("x", tap("元に戻す", vec![key("Ctrl"), key("Z")])),
        ("y", tap("やり直し", vec![key("Ctrl"), key("Y")])),
    ]);

    profile("メイン", &[("メイン", base)])
}
