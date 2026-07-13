//! Pie menus: a saved pie, its per-direction slices, and the appearance override.

use serde::{Deserialize, Serialize};

use super::*;

/// A pie fires the slice nearest the direction the mouse moved. Slices are a
/// free list (2–8), each at any `angle`, plus an optional `center` for the
/// no-movement (below-threshold) case. The pie menu is built from these.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PiePress {
    #[serde(default)]
    pub label: Option<String>,
    /// Direction slices (each at any angle). The one nearest the cursor's move
    /// angle fires on release. Resolved from the linked pie menu (`pie`) by the
    /// front end; the runtime reads these directly.
    #[serde(default)]
    pub slices: Vec<PieSlice>,
    /// Fired when the move stays within the threshold (in place / no direction).
    #[serde(default)]
    pub center: Option<Vec<InputCommand>>,
    /// Linked pie-menu id in the library. Front-end editing convenience: the
    /// buttons store the resolved slices/center above plus this link.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub pie: Option<String>,
    /// Per-pie look (resolved from the linked pie menu); overrides the global
    /// pie-overlay appearance for this pie. `None` = use the global look.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub appearance: Option<PieAppearance>,
    /// Per-pie pie threshold (px); `None` = use the global threshold.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub threshold: Option<i32>,
    /// Whether the on-screen overlay shows for this pie (per-pie override of the
    /// global `pieOverlayEnabled`). `None` = use the global setting.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub show_overlay: Option<bool>,
}

/// A saved pie menu in the library (see [`crate::config::WorkspaceFile`]). The
/// directions are per-pie; the look/threshold override the global defaults.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PieMenu {
    pub id: String,
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub slices: Vec<PieSlice>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub center: Option<Vec<InputCommand>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub appearance: Option<PieAppearance>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub threshold: Option<i32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub show_overlay: Option<bool>,
}

/// Per-pie appearance override. Each field is optional; `None` falls back to the
/// matching global `pieOverlay*` setting.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PieAppearance {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub design: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub bg: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub opacity: Option<i32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub accent: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub accent_opacity: Option<i32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub line: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub labels: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub labels_current_only: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub dividers: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub dots: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub label_color: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub line_opacity: Option<i32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub line_style: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub threshold_show: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub threshold_color: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub size: Option<i32>,
    /// Whether releasing beyond the outer ring cancels (per-pie override).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cancel_outside: Option<bool>,
}

/// One direction of a pie: an `angle` (degrees, 0 = up, clockwise) and the
/// input fired when the mouse moves nearest that angle.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PieSlice {
    pub angle: f32,
    #[serde(default)]
    pub inputs: Vec<InputCommand>,
}
