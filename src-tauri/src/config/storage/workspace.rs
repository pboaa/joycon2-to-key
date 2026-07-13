//! The unified store (workspace.json): its schema, path resolution, and the
//! corruption-safe load / atomic save. Also the generic `load_protected` reader
//! and `write_atomic` writer shared by the usage stores.

use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use super::super::defaults::builtin_default;
use super::super::schema::{AppConfig, DefinitionsFile, GlobalSettings, PieMenu};
use super::backups::{rotate_backup, should_rotate};
use super::seed::seeded_definitions;

/// Schema version of the unified store. Bumped when the on-disk shape changes.
///
/// Reset to 1 for the public release: the accumulated v2→v4 migration ladder was
/// dropped (older private builds' data is not carried forward). Any file we read
/// is normalized to this number on load, so future breaking changes start a fresh
/// migration chain from here.
pub const WORKSPACE_VERSION: u32 = 1;

/// The whole app state in one versioned document: settings, the definition
/// library, and every profile.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceFile {
    pub version: u32,
    #[serde(default)]
    pub settings: GlobalSettings,
    #[serde(default)]
    pub definitions: DefinitionsFile,
    /// Saved pie menus (the pie library). Buttons link to these by id.
    #[serde(default)]
    pub pie_menus: Vec<PieMenu>,
    #[serde(default)]
    pub profiles: AppConfig,
}

/// Stable per-user config directory: survives rebuilds / `cargo clean` and is
/// shared by every build (dev and release). On Windows this is
/// `%APPDATA%\joycon2-to-key`; otherwise it falls back to next to the exe.
pub fn config_dir() -> PathBuf {
    if let Ok(appdata) = std::env::var("APPDATA") {
        if !appdata.is_empty() {
            return PathBuf::from(appdata).join("joycon2-to-key");
        }
    }
    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            return dir.to_path_buf();
        }
    }
    PathBuf::from(".")
}

pub fn workspace_path() -> PathBuf {
    config_dir().join("workspace.json")
}

/// A fresh workspace: builtin starter profile + bundled preset definitions.
pub(super) fn fresh_workspace() -> WorkspaceFile {
    WorkspaceFile {
        version: WORKSPACE_VERSION,
        settings: GlobalSettings::default(),
        definitions: seeded_definitions(),
        pie_menus: Vec::new(),
        profiles: builtin_default(),
    }
}

/// Load the unified store (workspace.json) from `config_dir`, or start fresh.
///
/// Never destroys an unreadable file: a corrupt or version-incompatible
/// workspace.json is quarantined (renamed aside) *before* we fall back to a
/// fresh store, so the next save can't silently overwrite the user's data. On a
/// clean load the last-good text is also rotated into `backups/` (throttled) as
/// a "before this session" restore point.
pub fn load_workspace() -> WorkspaceFile {
    let path = workspace_path();
    let text = match std::fs::read_to_string(&path) {
        Ok(t) => t,
        Err(_) => {
            eprintln!("[workspace] {} not found, starting fresh", path.display());
            return fresh_workspace();
        }
    };
    match parse_workspace(&text) {
        Ok(ws) => {
            eprintln!("[workspace] loaded {}", path.display());
            if should_rotate("workspace") {
                rotate_backup("workspace", &text);
            }
            ws
        }
        Err(e) => {
            eprintln!("[workspace] parse error in {}: {e}", path.display());
            quarantine_corrupt(&path);
            fresh_workspace()
        }
    }
}

/// Deserialize a workspace from a JSON `Value`, normalizing its `version` to
/// [`WORKSPACE_VERSION`] first so an unversioned or differently-numbered document
/// still loads (serde `default`s fill any missing fields). There is no migration
/// ladder: the schema was reset to version 1 for the public release.
pub(super) fn workspace_from_value(mut value: serde_json::Value) -> Result<WorkspaceFile, String> {
    // Stamp the current version so a subsequent save writes a consistent number
    // (and so an unversioned document, which lacks the required `version` field,
    // deserializes).
    if let Some(obj) = value.as_object_mut() {
        obj.insert(
            "version".to_string(),
            serde_json::Value::from(WORKSPACE_VERSION),
        );
    }
    serde_json::from_value(value).map_err(|e| e.to_string())
}

/// Parse workspace JSON text into the typed store (version normalized).
pub(super) fn parse_workspace(text: &str) -> Result<WorkspaceFile, String> {
    let value = serde_json::from_str(text).map_err(|e| e.to_string())?;
    workspace_from_value(value)
}

/// Move an unreadable file aside (`<stem>.corrupt-<ms>.json`) so a later save
/// can't overwrite and destroy it. The name is derived from the file's own stem,
/// so it works for workspace.json, usage.json and pie_usage.json alike.
/// Best-effort: logged, never fatal.
fn quarantine_corrupt(path: &Path) {
    let stamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0);
    let stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("file");
    let aside = path.with_file_name(format!("{stem}.corrupt-{stamp}.json"));
    match std::fs::rename(path, &aside) {
        Ok(()) => eprintln!("[{stem}] kept unreadable file as {}", aside.display()),
        Err(e) => eprintln!("[{stem}] could not quarantine {}: {e}", path.display()),
    }
}

/// Load a JSON document with the same protection as the workspace: on a clean
/// read, the text is rotated into `backups/` (throttled) under `prefix`; on a
/// parse error the file is quarantined aside and the default is returned (never
/// silently discarded); a missing file just starts from the default.
pub(super) fn load_protected<T>(path: &Path, prefix: &str) -> T
where
    T: serde::de::DeserializeOwned + Default,
{
    let text = match std::fs::read_to_string(path) {
        Ok(t) => t,
        Err(_) => return T::default(),
    };
    match serde_json::from_str::<T>(&text) {
        Ok(v) => {
            if should_rotate(prefix) {
                rotate_backup(prefix, &text);
            }
            v
        }
        Err(e) => {
            eprintln!("[{prefix}] parse error in {}: {e}", path.display());
            quarantine_corrupt(path);
            T::default()
        }
    }
}

/// Persist atomically: write a sibling temp file, then rename it over the target
/// (rename replaces atomically on the same volume, including Windows). Prevents
/// a crash / power loss mid-write — or a save racing an updater restart — from
/// leaving a half-written, unreadable workspace.json.
pub fn save_workspace(path: &Path, ws: &WorkspaceFile) -> Result<(), String> {
    let text = serde_json::to_string_pretty(ws).map_err(|e| e.to_string())?;
    // Rotate the about-to-be-overwritten file into backups/ (throttled), so a
    // long editing session leaves periodic restore points, not just the
    // per-launch one. Best-effort; only when the target already exists.
    if should_rotate("workspace") {
        if let Ok(old) = std::fs::read_to_string(path) {
            rotate_backup("workspace", &old);
        }
    }
    write_atomic(path, &text)
}

/// Write `text` to `path` atomically: a sibling temp file then rename over the
/// target (rename replaces atomically on the same volume, including Windows).
/// Prevents a crash / power loss mid-write — or a save racing an updater restart
/// — from leaving a half-written, unreadable file. Shared by the workspace and
/// the usage stores.
pub(super) fn write_atomic(path: &Path, text: &str) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        if !parent.as_os_str().is_empty() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }
    let tmp = path.with_extension("tmp");
    std::fs::write(&tmp, text).map_err(|e| e.to_string())?;
    std::fs::rename(&tmp, path).map_err(|e| {
        let _ = std::fs::remove_file(&tmp);
        e.to_string()
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::{DayUsageMap, LayerConfig, ProfileConfig};
    use indexmap::IndexMap;

    /// The real save path must write — and read back — layers in their authored
    /// order, even when the initial layer is not first and names aren't sorted.
    #[test]
    fn save_workspace_preserves_layer_order() {
        let mut layers: IndexMap<String, LayerConfig> = IndexMap::new();
        for n in ["ZL", "StickDown", "デフォルト"] {
            layers.insert(n.to_string(), LayerConfig::default());
        }
        let mut profiles = AppConfig::new();
        profiles.insert(
            "p".into(),
            ProfileConfig {
                match_apps: vec![],
                initial_layer: "デフォルト".into(),
                layers,
                icon: None,
                app_icons: Default::default(),
            },
        );
        let ws = WorkspaceFile {
            version: WORKSPACE_VERSION,
            settings: GlobalSettings::default(),
            definitions: DefinitionsFile::default(),
            pie_menus: Vec::new(),
            profiles,
        };

        let path =
            std::env::temp_dir().join(format!("joycon_ws_test_{}.json", std::process::id()));
        save_workspace(&path, &ws).unwrap();
        let text = std::fs::read_to_string(&path).unwrap();
        let _ = std::fs::remove_file(&path);

        let loaded: WorkspaceFile = serde_json::from_str(&text).unwrap();
        let order: Vec<&str> = loaded.profiles["p"]
            .layers
            .keys()
            .map(String::as_str)
            .collect();
        assert_eq!(order, vec!["ZL", "StickDown", "デフォルト"]);
    }

    /// An old, unversioned file still parses (defaults fill the gaps) and gets
    /// stamped to the current schema version.
    #[test]
    fn parse_workspace_migrates_unversioned_file() {
        let json = r#"{"profiles":{"p":{"initialLayer":"base","layers":{"base":{}}}}}"#;
        let ws = parse_workspace(json).expect("should parse");
        assert_eq!(ws.version, WORKSPACE_VERSION);
        assert!(ws.profiles.contains_key("p"));
    }

    /// Unreadable JSON is a clean error (so the caller quarantines instead of
    /// overwriting), not a panic.
    #[test]
    fn parse_workspace_rejects_garbage() {
        assert!(parse_workspace("not json at all {{{").is_err());
    }

    /// A save writes atomically and leaves no `.tmp` sibling behind.
    #[test]
    fn save_workspace_is_atomic_and_cleans_up() {
        let dir = std::env::temp_dir().join(format!("joycon_atomic_{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("workspace.json");
        save_workspace(&path, &fresh_workspace()).unwrap();
        assert!(path.exists(), "target written");
        assert!(!path.with_extension("tmp").exists(), "temp cleaned up");
        // Round-trips back through the migrating parser.
        let text = std::fs::read_to_string(&path).unwrap();
        assert!(parse_workspace(&text).is_ok());
        let _ = std::fs::remove_dir_all(&dir);
    }

    /// A real, full workspace (settings + definition library + multiple
    /// profiles, exercising layerHold / pie slices / toggle / repeat / per-layer
    /// stick-mouse / a definition reference) parses, keeps its authored profile
    /// and layer order, and survives a save→reload round-trip byte-structurally.
    /// This golden file is the regression anchor for the on-disk JSON contract.
    #[test]
    fn golden_workspace_roundtrips() {
        const GOLDEN: &str = include_str!("../fixtures/workspace_v1.json");
        let ws = parse_workspace(GOLDEN).expect("golden parses");

        // Version is stamped forward to the current schema on load.
        assert_eq!(ws.version, WORKSPACE_VERSION);
        // Profile insertion order is preserved (IndexMap, not alphabetized).
        let names: Vec<&str> = ws.profiles.keys().map(String::as_str).collect();
        assert_eq!(names, vec!["デフォルト", "chrome"]);
        // Layer order within a profile is preserved too.
        let layers: Vec<&str> = ws.profiles["デフォルト"]
            .layers
            .keys()
            .map(String::as_str)
            .collect();
        assert_eq!(layers, vec!["デフォルト", "マウス"]);
        // Tri-state inherit + per-layer stick-mouse survived the parse.
        assert!(ws.profiles["デフォルト"].layers["マウス"].stick_mouse);
        // The definition library round-tripped.
        assert_eq!(ws.definitions.definitions.len(), 1);

        // Save then reload is structurally identical (idempotent persistence).
        let dir = std::env::temp_dir().join(format!("joycon_golden_{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("workspace.json");
        save_workspace(&path, &ws).unwrap();
        let text = std::fs::read_to_string(&path).unwrap();
        let reparsed = parse_workspace(&text).expect("re-parse of saved golden");
        assert_eq!(
            serde_json::to_value(&ws).unwrap(),
            serde_json::to_value(&reparsed).unwrap(),
            "save→reload must be structurally identical"
        );
        let _ = std::fs::remove_dir_all(&dir);
    }

    /// Quarantine renames the bad file aside rather than deleting it.
    #[test]
    fn quarantine_keeps_the_bad_file() {
        let dir = std::env::temp_dir().join(format!("joycon_quar_{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("workspace.json");
        std::fs::write(&path, "broken").unwrap();
        quarantine_corrupt(&path);
        assert!(!path.exists(), "original moved away");
        let kept: Vec<_> = std::fs::read_dir(&dir)
            .unwrap()
            .filter_map(Result::ok)
            .filter(|e| e.file_name().to_string_lossy().starts_with("workspace.corrupt-"))
            .collect();
        assert_eq!(kept.len(), 1, "one quarantined copy exists");
        let _ = std::fs::remove_dir_all(&dir);
    }

    /// A corrupt usage file is quarantined (as `usage.corrupt-*`, from its own
    /// stem) and the loader returns the default instead of silently discarding.
    #[test]
    fn load_protected_quarantines_corrupt_and_defaults() {
        let dir = std::env::temp_dir().join(format!("joycon_lp_{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("usage.json");
        std::fs::write(&path, "not json {{{").unwrap();

        let v: DayUsageMap = load_protected(&path, "usage");
        assert!(v.is_empty(), "corrupt ⇒ default (empty)");
        assert!(!path.exists(), "corrupt file moved aside");
        let quarantined: Vec<_> = std::fs::read_dir(&dir)
            .unwrap()
            .filter_map(Result::ok)
            .filter(|e| e.file_name().to_string_lossy().starts_with("usage.corrupt-"))
            .collect();
        assert_eq!(quarantined.len(), 1, "quarantined as usage.corrupt-*");
        let _ = std::fs::remove_dir_all(&dir);
    }

    /// A missing file just starts from the default (no quarantine, no backup).
    #[test]
    fn load_protected_missing_is_default() {
        let path =
            std::env::temp_dir().join(format!("joycon_missing_{}.json", std::process::id()));
        let _ = std::fs::remove_file(&path);
        let v: DayUsageMap = load_protected(&path, "usage");
        assert!(v.is_empty());
    }
}
