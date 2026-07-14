//! App-wide settings (not tied to a profile): idle/BLE behaviour, sound/vibration
//! cues, the pie-overlay look, and various front-end display tunings.

use serde::{Deserialize, Serialize};

/// App-wide settings that are not tied to a profile.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GlobalSettings {
    /// Whether the BLE link is auto-disconnected after being idle.
    #[serde(default = "GlobalSettings::default_true")]
    pub idle_enabled: bool,
    /// Seconds of no activity before the auto-disconnect fires.
    #[serde(default = "GlobalSettings::default_idle_timeout_secs")]
    pub idle_timeout_secs: u64,
    /// Built-in vibration sample (1–7) buzzed on the controller a few seconds
    /// before the idle auto-disconnect, as a heads-up; 0 = off. Fired from the
    /// input thread while the link is still up (unlike the disconnect sound cue,
    /// which the frontend plays after the controller is already gone).
    #[serde(default)]
    pub disconnect_vibration: u8,
    /// Stick displacement needed to register a pie direction.
    #[serde(default = "GlobalSettings::default_pie_threshold")]
    pub pie_threshold: i32,
    /// Wheel magnitude per scroll input (when a command omits its own amount).
    #[serde(default = "GlobalSettings::default_scroll_amount")]
    pub scroll_amount: i32,
    /// UI color theme ("system" | "light" | "dark"). Frontend-only; the backend
    /// just persists it so the choice survives a save/load round-trip.
    #[serde(default = "GlobalSettings::default_theme")]
    pub theme: String,
    /// UI language ("system" | "ja" | "en"). Frontend-only; persisted only.
    #[serde(default = "GlobalSettings::default_language")]
    pub language: String,
    /// Sound cue id played on connect / auto-disconnect (frontend-only; the
    /// backend just persists the choice). "none" = silent.
    #[serde(default = "GlobalSettings::default_connect_sound")]
    pub connect_sound: String,
    #[serde(default = "GlobalSettings::default_disconnect_sound")]
    pub disconnect_sound: String,
    /// Built-in vibration sample (1–7) buzzed when the controller connects;
    /// 0 = off. Sent from the backend right after the link's init handshake
    /// (the old code always buzzed sample 1 here; now it honours this setting).
    #[serde(default = "GlobalSettings::default_connect_vibration")]
    pub connect_vibration: u8,
    /// Player-indicator LED pattern as the raw controller byte: low nibble =
    /// lamps 1–4 lit solid, high nibble = lamps 1–4 flashing. Default 0x01
    /// (lamp 1 solid). Sent on connect and whenever it changes.
    #[serde(default = "GlobalSettings::default_player_leds")]
    pub player_leds: u8,
    /// Stick centre deadzone as a percent (0–50). Applies to stick→mouse and to
    /// the digital stick directions.
    #[serde(default = "GlobalSettings::default_stick_deadzone")]
    pub stick_deadzone: i32,
    /// Voltage (mV) treated as ~100% for the rough battery estimate. Frontend-
    /// only display tuning; the backend just persists it. User-calibratable.
    #[serde(default = "GlobalSettings::default_battery_full_mv")]
    pub battery_full_mv: i32,
    /// Voltage (mV) treated as ~0% for the rough battery estimate.
    #[serde(default = "GlobalSettings::default_battery_empty_mv")]
    pub battery_empty_mv: i32,
    /// Default repeat interval (ms) applied when rapid-fire is first enabled. Frontend-
    /// only tuning; the backend just persists it.
    #[serde(default = "GlobalSettings::default_default_repeat_ms")]
    pub default_repeat_ms: i32,
    /// Joy-Con figure accent (side) color, left / right (hex). Frontend-only.
    #[serde(default = "GlobalSettings::default_accent_l")]
    pub accent_l: String,
    #[serde(default = "GlobalSettings::default_accent_r")]
    pub accent_r: String,
    /// Highlight color (hex) for assigned buttons on the figure. Frontend-only.
    #[serde(default = "GlobalSettings::default_map_color")]
    pub map_color: String,
    /// Whether the pie pie-menu overlay is drawn while a pie is held.
    /// When off, pies still fire — only the on-screen pie is hidden. Read by
    /// the input thread (via RuntimeSettings) to decide whether to show it.
    #[serde(default = "GlobalSettings::default_true")]
    pub pie_overlay_enabled: bool,
    /// Pie overlay diameter in logical px (the pie window's size).
    #[serde(default = "GlobalSettings::default_pie_overlay_size")]
    pub pie_overlay_size: i32,
    /// Pie overlay background disc color (hex). Frontend-only (the overlay
    /// reads it from the persisted settings).
    #[serde(default = "GlobalSettings::default_pie_overlay_bg")]
    pub pie_overlay_bg: String,
    /// Pie overlay background opacity as a percent (0–100). Frontend-only.
    #[serde(default = "GlobalSettings::default_pie_overlay_opacity")]
    pub pie_overlay_opacity: i32,
    /// Pie overlay highlight (current direction / assigned) color (hex).
    /// Frontend-only.
    #[serde(default = "GlobalSettings::default_pie_overlay_accent")]
    pub pie_overlay_accent: String,
    /// Pie overlay highlight opacity as a percent (0–100). Frontend-only.
    #[serde(default = "GlobalSettings::default_pie_overlay_accent_opacity")]
    pub pie_overlay_accent_opacity: i32,
    /// Pie overlay line color (dividers / ring / spokes). Frontend-only.
    #[serde(default = "GlobalSettings::default_pie_overlay_line")]
    pub pie_overlay_line: String,
    /// Whether action labels are drawn on the pie overlay. Frontend-only.
    #[serde(default = "GlobalSettings::default_true")]
    pub pie_overlay_labels: bool,
    /// Only label the direction currently pointed at (others stay dots).
    /// Frontend-only.
    #[serde(default)]
    pub pie_overlay_labels_current_only: bool,
    /// Pie overlay shape variant ("ring" | "pie" | "minimal"). Frontend-only.
    #[serde(default = "GlobalSettings::default_pie_overlay_design")]
    pub pie_overlay_design: String,
    /// Draw thin dividers between wedge segments (ring/pie). Frontend-only.
    #[serde(default = "GlobalSettings::default_true")]
    pub pie_overlay_dividers: bool,
    /// Draw the small dots for empty / non-current directions. Off = hide them
    /// entirely (only labels / the current highlight show). Frontend-only.
    #[serde(default = "GlobalSettings::default_true")]
    pub pie_overlay_dots: bool,
    /// Pie overlay label (text) color (hex). Frontend-only.
    #[serde(default = "GlobalSettings::default_pie_overlay_label_color")]
    pub pie_overlay_label_color: String,
    /// Pie overlay line opacity as a percent (0–100), independent of the
    /// background opacity. Frontend-only.
    #[serde(default = "GlobalSettings::default_pie_overlay_line_opacity")]
    pub pie_overlay_line_opacity: i32,
    /// Pie overlay line style for every line (dividers / ring / spokes / the
    /// active chip border): "solid" | "dashed" | "dotted". Frontend-only.
    #[serde(default = "GlobalSettings::default_pie_overlay_line_style")]
    pub pie_overlay_line_style: String,
    /// Draw the threshold (in-place) dead-zone circle. Off by default (a subtle
    /// guide most users don't need). Frontend-only.
    #[serde(default)]
    pub pie_overlay_threshold_show: bool,
    /// Colour (hex) of the threshold dead-zone circle. Frontend-only.
    #[serde(default = "GlobalSettings::default_pie_overlay_threshold_color")]
    pub pie_overlay_threshold_color: String,
    /// Whether releasing beyond the outer ring cancels the pie (fires
    /// nothing). Read by the input thread.
    #[serde(default = "GlobalSettings::default_true")]
    pub pie_cancel_outside: bool,
    /// Keep only the most recent N days of usage stats; older daily buckets are
    /// auto-deleted. `0` = unlimited (keep everything — the default). Applied by
    /// the runtime whenever settings are (re)applied.
    #[serde(default)]
    pub usage_retention_days: i32,
    /// Show the battery readout in the title bar (experimental — the Joy-Con 2
    /// voltage reading is only a rough estimate). Off by default. Frontend-only.
    #[serde(default)]
    pub titlebar_battery: bool,
}

impl GlobalSettings {
    fn default_idle_timeout_secs() -> u64 {
        10 * 60
    }
    fn default_true() -> bool {
        true
    }
    fn default_pie_threshold() -> i32 {
        20
    }
    fn default_scroll_amount() -> i32 {
        120
    }
    fn default_language() -> String {
        "system".into()
    }
    fn default_theme() -> String {
        "system".to_string()
    }
    fn default_connect_sound() -> String {
        "none".to_string()
    }
    fn default_connect_vibration() -> u8 {
        1
    }
    fn default_player_leds() -> u8 {
        0x01
    }
    fn default_disconnect_sound() -> String {
        "none".to_string()
    }
    fn default_stick_deadzone() -> i32 {
        30
    }
    fn default_battery_full_mv() -> i32 {
        3750
    }
    fn default_battery_empty_mv() -> i32 {
        3400
    }
    fn default_default_repeat_ms() -> i32 {
        50
    }
    fn default_accent_l() -> String {
        "#66ccf2".to_string()
    }
    fn default_accent_r() -> String {
        "#fe9985".to_string()
    }
    fn default_map_color() -> String {
        "#d68c45".to_string()
    }
    fn default_pie_overlay_size() -> i32 {
        280
    }
    fn default_pie_overlay_bg() -> String {
        "#101018".to_string()
    }
    fn default_pie_overlay_opacity() -> i32 {
        42
    }
    fn default_pie_overlay_accent() -> String {
        "#5a5ae0".to_string()
    }
    fn default_pie_overlay_accent_opacity() -> i32 {
        100
    }
    fn default_pie_overlay_line() -> String {
        "#ffffff".to_string()
    }
    fn default_pie_overlay_label_color() -> String {
        "#ffffff".to_string()
    }
    fn default_pie_overlay_line_opacity() -> i32 {
        40
    }
    fn default_pie_overlay_line_style() -> String {
        "solid".to_string()
    }
    fn default_pie_overlay_threshold_color() -> String {
        "#5a5ae0".to_string()
    }
    fn default_pie_overlay_design() -> String {
        "pie".to_string()
    }
}

impl Default for GlobalSettings {
    fn default() -> Self {
        Self {
            idle_enabled: true,
            idle_timeout_secs: Self::default_idle_timeout_secs(),
            disconnect_vibration: 0,
            pie_threshold: Self::default_pie_threshold(),
            scroll_amount: Self::default_scroll_amount(),
            theme: Self::default_theme(),
            language: Self::default_language(),
            connect_sound: Self::default_connect_sound(),
            disconnect_sound: Self::default_disconnect_sound(),
            connect_vibration: Self::default_connect_vibration(),
            player_leds: Self::default_player_leds(),
            stick_deadzone: Self::default_stick_deadzone(),
            battery_full_mv: Self::default_battery_full_mv(),
            battery_empty_mv: Self::default_battery_empty_mv(),
            default_repeat_ms: Self::default_default_repeat_ms(),
            accent_l: Self::default_accent_l(),
            accent_r: Self::default_accent_r(),
            map_color: Self::default_map_color(),
            pie_overlay_enabled: true,
            pie_overlay_size: Self::default_pie_overlay_size(),
            pie_overlay_bg: Self::default_pie_overlay_bg(),
            pie_overlay_opacity: Self::default_pie_overlay_opacity(),
            pie_overlay_accent: Self::default_pie_overlay_accent(),
            pie_overlay_accent_opacity: Self::default_pie_overlay_accent_opacity(),
            pie_overlay_line: Self::default_pie_overlay_line(),
            pie_overlay_labels: true,
            pie_overlay_labels_current_only: false,
            pie_overlay_design: Self::default_pie_overlay_design(),
            pie_overlay_dividers: true,
            pie_overlay_dots: true,
            pie_overlay_label_color: Self::default_pie_overlay_label_color(),
            pie_overlay_line_opacity: Self::default_pie_overlay_line_opacity(),
            pie_overlay_line_style: Self::default_pie_overlay_line_style(),
            pie_overlay_threshold_show: false,
            pie_overlay_threshold_color: Self::default_pie_overlay_threshold_color(),
            pie_cancel_outside: true,
            usage_retention_days: 0,
            titlebar_battery: false,
        }
    }
}
