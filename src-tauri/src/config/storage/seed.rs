//! Bundled preset packs compiled into the binary, and the seeded definition
//! store a fresh install starts from.

use super::super::schema::{Definition, DefinitionGroup, DefinitionPack, DefinitionsFile};

/// Preset packs compiled into the binary (see `src/presets/*.json`).
pub fn preset_packs() -> Vec<DefinitionPack> {
    const RAW: &[&str] = &[include_str!("../../presets/editing.json")];
    RAW.iter()
        .filter_map(|s| serde_json::from_str::<DefinitionPack>(s).ok())
        .collect()
}

/// The definition store as first seen on a fresh install: the bundled preset
/// packs, flattened into groups (matched by name) + definitions with stable
/// ids. Deterministic so that unsaved seeds keep the same ids across launches
/// (button links stay valid until the store is first written to disk).
pub fn seeded_definitions() -> DefinitionsFile {
    let mut groups: Vec<DefinitionGroup> = Vec::new();
    let mut definitions: Vec<Definition> = Vec::new();
    for pack in preset_packs() {
        for pd in pack.definitions {
            let group = pd.group.as_ref().map(|name| {
                if let Some(g) = groups.iter().find(|g| &g.name == name) {
                    g.id.clone()
                } else {
                    let id = format!("grp-seed-{}", groups.len() + 1);
                    groups.push(DefinitionGroup { id: id.clone(), name: name.clone() });
                    id
                }
            });
            definitions.push(Definition {
                id: format!("def-seed-{}", definitions.len() + 1),
                name: pd.name,
                group,
                icon: None,
                icon_color: None,
                press: pd.press,
            });
        }
    }
    DefinitionsFile { version: 1, groups, definitions }
}
