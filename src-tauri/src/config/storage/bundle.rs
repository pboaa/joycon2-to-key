//! The portable export/import bundle: the whole workspace plus the usage stats
//! in one file. On disk these stay separate files; the bundle exists only as the
//! export shape.

use std::path::Path;

use serde::{Deserialize, Serialize};

use super::usage::{DayDefUsageMap, DayPieUsageMap, DayUsageMap};
use super::workspace::{parse_workspace, workspace_from_value, write_atomic, WorkspaceFile};

/// The export/import file format: the whole workspace plus the usage stats, so a
/// single file is a complete backup. On disk these stay separate files
/// (workspace.json / usage.json / pie_usage.json); the bundle exists only as the
/// portable export shape.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupBundle {
    /// Marker so an importer can recognize the format ("joycon-backup").
    #[serde(default)]
    pub kind: String,
    #[serde(default)]
    pub version: u32,
    pub workspace: WorkspaceFile,
    #[serde(default)]
    pub usage: DayUsageMap,
    #[serde(default)]
    pub pie_usage: DayPieUsageMap,
    #[serde(default)]
    pub def_usage: DayDefUsageMap,
}

/// Write a full backup bundle to `path` (atomic, pretty-printed).
pub fn save_backup(path: &Path, bundle: &BackupBundle) -> Result<(), String> {
    let text = serde_json::to_string_pretty(bundle).map_err(|e| e.to_string())?;
    write_atomic(path, &text)
}

/// A backup read from disk: the workspace, plus the usage stats when the file was
/// a full bundle (both `None` for a plain workspace document).
#[derive(Debug, Clone)]
pub struct ImportedBackup {
    pub workspace: WorkspaceFile,
    pub usage: Option<DayUsageMap>,
    pub pie_usage: Option<DayPieUsageMap>,
    pub def_usage: Option<DayDefUsageMap>,
}

/// Read a backup from `path`. Accepts either a full bundle (top-level
/// `workspace`) or a plain workspace document (top-level `profiles`, for files
/// exported before stats were bundled). The workspace's version is normalized.
pub fn import_backup_file(path: &Path) -> Result<ImportedBackup, String> {
    let text = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
    let value: serde_json::Value = serde_json::from_str(&text).map_err(|e| e.to_string())?;
    if let Some(ws_val) = value.get("workspace") {
        // Full bundle: workspace + optional stats.
        let workspace = workspace_from_value(ws_val.clone())?;
        let usage = value
            .get("usage")
            .and_then(|v| serde_json::from_value(v.clone()).ok());
        let pie_usage = value
            .get("pieUsage")
            .and_then(|v| serde_json::from_value(v.clone()).ok());
        let def_usage = value
            .get("defUsage")
            .and_then(|v| serde_json::from_value(v.clone()).ok());
        Ok(ImportedBackup { workspace, usage, pie_usage, def_usage })
    } else if value.get("profiles").is_some() {
        // Plain workspace document (older export): no stats.
        Ok(ImportedBackup {
            workspace: parse_workspace(&text)?,
            usage: None,
            pie_usage: None,
            def_usage: None,
        })
    } else {
        Err("バックアップとして読み込めません。".into())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use super::super::workspace::{fresh_workspace, save_workspace, WORKSPACE_VERSION};

    /// A full backup bundle (workspace + stats) round-trips: save_backup then
    /// import_backup_file returns the workspace (version normalized) and the
    /// bundled usage.
    #[test]
    fn backup_bundle_roundtrips() {
        let dir = std::env::temp_dir().join(format!("joycon_bundle_{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("backup.json");
        let mut usage: DayUsageMap = DayUsageMap::new();
        usage
            .entry("20321".into())
            .or_default()
            .entry("デフォルト".into())
            .or_default()
            .entry("base".into())
            .or_default()
            .insert("a".into(), 7);
        let bundle = BackupBundle {
            kind: "joycon-backup".into(),
            version: WORKSPACE_VERSION,
            workspace: fresh_workspace(),
            usage: usage.clone(),
            pie_usage: DayPieUsageMap::new(),
            def_usage: DayDefUsageMap::new(),
        };
        save_backup(&path, &bundle).unwrap();

        let imported = import_backup_file(&path).expect("imports bundle");
        assert_eq!(imported.workspace.version, WORKSPACE_VERSION);
        assert_eq!(imported.usage.as_ref().unwrap()["20321"]["デフォルト"]["base"]["a"], 7);
        assert!(imported.pie_usage.is_some(), "bundle carries (empty) pie usage");
        let _ = std::fs::remove_dir_all(&dir);
    }

    /// A plain workspace document (older export, no stats) still imports; stats
    /// come back as None so the caller keeps its current usage.
    #[test]
    fn import_plain_workspace_has_no_stats() {
        let dir = std::env::temp_dir().join(format!("joycon_import_full_{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("ws.json");
        save_workspace(&path, &fresh_workspace()).unwrap();
        let imported = import_backup_file(&path).expect("imports");
        assert_eq!(imported.workspace.version, WORKSPACE_VERSION);
        assert!(imported.usage.is_none() && imported.pie_usage.is_none());
        let _ = std::fs::remove_dir_all(&dir);
    }

    /// A bare profiles-only map (no top-level `workspace` or `profiles` key) is
    /// rejected — the legacy import form was dropped.
    #[test]
    fn import_bare_profiles_map_is_rejected() {
        let dir = std::env::temp_dir().join(format!("joycon_import_{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("profiles.json");
        let json = r#"{"デフォルト":{"initialLayer":"base","layers":{"base":{
            "buttons":{"a":{"press":{"type":"input","mode":"tap",
            "inputs":[{"type":"keyboard","value":"A"}]}}}}}}}"#;
        std::fs::write(&path, json).unwrap();
        assert!(import_backup_file(&path).is_err());
        let _ = std::fs::remove_dir_all(&dir);
    }

    /// A file that is neither a bundle nor a workspace document is a clean error.
    #[test]
    fn import_rejects_unrelated_json() {
        let dir = std::env::temp_dir().join(format!("joycon_import_bad_{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("bad.json");
        std::fs::write(&path, r#"{"hello":"world"}"#).unwrap();
        assert!(import_backup_file(&path).is_err());
        let _ = std::fs::remove_dir_all(&dir);
    }
}
