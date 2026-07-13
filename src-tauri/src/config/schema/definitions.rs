//! The definition library: named reusable actions, their groups, and the
//! portable pack format for sharing them.

use serde::{Deserialize, Serialize};

use super::*;

/// A named, reusable action shared across profiles.
/// Purely a front-end editing convenience — the runtime never sees these; buttons
/// store a resolved `press` plus a `def` link.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Definition {
    pub id: String,
    #[serde(default)]
    pub name: String,
    /// Optional group id (see [`DefinitionGroup`]). Absent = ungrouped.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub group: Option<String>,
    /// Optional icon name (a key in the frontend's opIcons set). Frontend-only.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub icon: Option<String>,
    /// Optional icon tint (hex, e.g. "#ef4444"). Frontend-only; the runtime
    /// ignores it — persisted so the choice survives a save/load round-trip.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub icon_color: Option<String>,
    pub press: PressConfig,
}

/// A named group for organising definitions in the UI.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DefinitionGroup {
    pub id: String,
    #[serde(default)]
    pub name: String,
}

/// Envelope for the definition library: a version, the group list (ordered),
/// and the definitions themselves.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DefinitionsFile {
    pub version: u32,
    #[serde(default)]
    pub groups: Vec<DefinitionGroup>,
    #[serde(default)]
    pub definitions: Vec<Definition>,
}

impl Default for DefinitionsFile {
    fn default() -> Self {
        Self { version: 1, groups: Vec::new(), definitions: Vec::new() }
    }
}

/// One definition inside a shareable pack (no internal id; group by name).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PackDefinition {
    #[serde(default)]
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub group: Option<String>,
    pub press: PressConfig,
}

/// A portable, shareable bundle of definitions (export / bundled preset).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DefinitionPack {
    pub version: u32,
    pub kind: String,
    #[serde(default)]
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub author: Option<String>,
    #[serde(default)]
    pub definitions: Vec<PackDefinition>,
}
