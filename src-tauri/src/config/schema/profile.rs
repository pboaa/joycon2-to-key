//! Profiles, layers, per-button assignments and layer inheritance.

use std::collections::BTreeMap;

use indexmap::IndexMap;
use serde::{Deserialize, Serialize};

use super::*;

/// Top-level: process name (or "default") → ProfileConfig.
/// IndexMap preserves insertion order so profiles keep the order they were added.
pub type AppConfig = IndexMap<String, ProfileConfig>;

/// Runtime input tuning. These live in [`GlobalSettings`] (app-wide) now; this
/// struct is just the value the processor passes to the input helpers.
#[derive(Debug, Clone, Copy)]
pub struct InputTuning {
    pub pie_threshold: i32,
    pub scroll_amount: i32,
}

impl Default for InputTuning {
    fn default() -> Self {
        Self {
            pie_threshold: 20,
            scroll_amount: 120,
        }
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfileConfig {
    /// Process names this profile reacts to (e.g. "chrome.exe"). Empty on the
    /// fallback "デフォルト" profile. The profile's map key is a free display name.
    #[serde(default)]
    pub match_apps: Vec<String>,
    pub initial_layer: String,
    /// Insertion-ordered so layers keep the order they were added.
    #[serde(default)]
    pub layers: IndexMap<String, LayerConfig>,
    /// App icon (PNG data URL) shown on the profile tab. Front-end only; the
    /// runtime ignores it.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub icon: Option<String>,
    /// Per-app icons (exe → PNG data URL). Front-end only.
    #[serde(default, skip_serializing_if = "IndexMap::is_empty")]
    pub app_icons: IndexMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LayerConfig {
    /// btnKey → the button's single assignment.
    #[serde(default)]
    pub buttons: BTreeMap<String, ButtonAssignment>,
    /// How this layer draws unset buttons from the base (initial) layer.
    #[serde(default)]
    pub inherit: InheritMode,
    /// Move the cursor with the LEFT analog stick while this layer is active
    /// (replaces the stick's digital directions). Per-layer so a "mouse layer"
    /// can coexist with normal layers. The right stick has its own flag below.
    #[serde(default)]
    pub stick_mouse: bool,
    /// LEFT stick cursor speed at full deflection (px per input tick).
    #[serde(default = "LayerConfig::default_stick_mouse_speed")]
    pub stick_mouse_speed: i32,
    /// Same as `stick_mouse` but for the RIGHT Joy-Con's stick (independent so
    /// each side can be a mouse or not).
    #[serde(default)]
    pub stick_mouse_r: bool,
    /// RIGHT stick cursor speed at full deflection (px per input tick).
    #[serde(default = "LayerConfig::default_stick_mouse_speed")]
    pub stick_mouse_speed_r: i32,
}

impl LayerConfig {
    fn default_stick_mouse_speed() -> i32 {
        12
    }
}

/// How a non-base layer inherits buttons from the base (initial) layer.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum InheritMode {
    /// Inherit every unset button from the base layer.
    All,
    /// Inherit only modifier-holding buttons: a `LayerHold`, or a held
    /// (hold/toggle) `Input` of modifier keys only. Layer navigation and held
    /// modifiers keep working in every layer. Default for new layers.
    /// (The on-disk "modifiers" name is kept.)
    Modifiers,
    /// Fully independent: inherit nothing.
    None,
}

impl Default for InheritMode {
    /// A missing field means a pre-tristate file, where absent = "inherit all".
    fn default() -> Self {
        InheritMode::All
    }
}

impl<'de> Deserialize<'de> for InheritMode {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        // Accept both the legacy boolean and the new string form.
        #[derive(Deserialize)]
        #[serde(untagged)]
        enum Raw {
            Bool(bool),
            Str(String),
        }
        Ok(match Raw::deserialize(deserializer)? {
            Raw::Bool(true) => InheritMode::All,
            Raw::Bool(false) => InheritMode::None,
            Raw::Str(s) => match s.as_str() {
                "modifiers" => InheritMode::Modifiers,
                "none" => InheritMode::None,
                _ => InheritMode::All,
            },
        })
    }
}

impl Default for LayerConfig {
    fn default() -> Self {
        Self {
            buttons: BTreeMap::new(),
            inherit: InheritMode::All,
            stick_mouse: false,
            stick_mouse_speed: Self::default_stick_mouse_speed(),
            stick_mouse_r: false,
            stick_mouse_speed_r: Self::default_stick_mouse_speed(),
        }
    }
}

/// One button's assignment (one per button, per layer).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ButtonAssignment {
    /// Optional link to a named [`Definition`]. `press` is a cached copy of the
    /// definition; the front-end keeps them in sync. The runtime ignores this.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub def: Option<String>,
    pub press: PressConfig,
}
