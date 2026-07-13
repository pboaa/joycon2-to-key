//! Rotating, timestamped backups under `config_dir/backups`: throttled rotation
//! of the workspace / usage files, pruning to a per-file cap, and the
//! "restore from backup" listing.

use std::path::{Path, PathBuf};

use super::bundle::import_backup_file;
use super::workspace::{config_dir, WorkspaceFile};

/// Don't take another backup of the same file until the newest is at least this
/// old — keeps the debounced auto-saves from spamming the backups folder.
const BACKUP_MIN_INTERVAL_SECS: u64 = 600;

/// How many timestamped backups to keep per file (older ones are pruned). The
/// stats files churn every day and matter less, so they keep only a few
/// generations; the workspace keeps more.
fn max_backups(prefix: &str) -> usize {
    match prefix {
        "workspace" => 15,
        _ => 3, // usage / pie_usage
    }
}

/// Directory holding the rotating, timestamped backups of the persisted files.
pub fn backups_dir() -> PathBuf {
    config_dir().join("backups")
}

/// True when `name` is a backup file for `prefix` (`<prefix>-<millis>.json`).
fn is_backup_of(name: &str, prefix: &str) -> bool {
    name.starts_with(&format!("{prefix}-")) && name.ends_with(".json")
}

/// Backup files for `prefix` under `dir`, sorted oldest→newest. The stamp is
/// millis-since-epoch (fixed width in this era), so a lexicographic sort is
/// chronological.
fn backups_for_in(dir: &Path, prefix: &str) -> Vec<PathBuf> {
    let mut files: Vec<PathBuf> = std::fs::read_dir(dir)
        .into_iter()
        .flatten()
        .filter_map(Result::ok)
        .map(|e| e.path())
        .filter(|p| {
            p.file_name()
                .and_then(|n| n.to_str())
                .is_some_and(|n| is_backup_of(n, prefix))
        })
        .collect();
    files.sort();
    files
}

/// True when it's time to back up `prefix` again: none yet, or the newest is
/// older than [`BACKUP_MIN_INTERVAL_SECS`].
fn should_rotate_in(dir: &Path, prefix: &str) -> bool {
    let Some(newest) = backups_for_in(dir, prefix).pop() else {
        return true;
    };
    match std::fs::metadata(&newest)
        .and_then(|m| m.modified())
        .ok()
        .and_then(|t| t.elapsed().ok())
    {
        Some(age) => age.as_secs() >= BACKUP_MIN_INTERVAL_SECS,
        None => true, // unreadable mtime → err on making one
    }
}

/// Write `text` to `dir/<prefix>-<millis>.json`, then prune to the newest
/// [`max_backups`]. Best-effort: any failure is logged, never fatal.
fn rotate_backup_in(dir: &Path, prefix: &str, text: &str) {
    if let Err(e) = std::fs::create_dir_all(dir) {
        eprintln!("[backup] could not create {}: {e}", dir.display());
        return;
    }
    let stamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let dest = dir.join(format!("{prefix}-{stamp}.json"));
    if let Err(e) = std::fs::write(&dest, text) {
        eprintln!("[backup] could not write {}: {e}", dest.display());
        return;
    }
    let cap = max_backups(prefix);
    let files = backups_for_in(dir, prefix);
    if files.len() > cap {
        for old in &files[..files.len() - cap] {
            let _ = std::fs::remove_file(old);
        }
    }
}

/// Whether a new backup of `prefix` is due (throttled). Uses [`backups_dir`].
pub(super) fn should_rotate(prefix: &str) -> bool {
    should_rotate_in(&backups_dir(), prefix)
}

/// Rotate `text` into [`backups_dir`] under `prefix` and prune. Best-effort.
pub(super) fn rotate_backup(prefix: &str, text: &str) {
    rotate_backup_in(&backups_dir(), prefix, text);
}

/// Millis-since-epoch parsed from a backup filename (`<prefix>-<nanos>.json`).
fn backup_stamp_ms(name: &str) -> u64 {
    name.rsplit_once('-')
        .and_then(|(_, tail)| tail.strip_suffix(".json"))
        .and_then(|s| s.parse::<u128>().ok())
        .map(|nanos| (nanos / 1_000_000) as u64)
        .unwrap_or(0)
}

/// The rotating workspace backups, newest first: (filename, timestamp in ms).
/// The UI turns these into a "restore from backup" list.
pub fn list_workspace_backups() -> Vec<(String, u64)> {
    backups_for_in(&backups_dir(), "workspace")
        .into_iter()
        .rev() // newest first
        .filter_map(|p| {
            let name = p.file_name()?.to_str()?.to_string();
            let ms = backup_stamp_ms(&name);
            Some((name, ms))
        })
        .collect()
}

/// Read the workspace stored in a rotating backup by its bare filename. Validated
/// (no path separators, must be a `workspace-*.json` in the backups folder) so a
/// caller can't read arbitrary paths. Version-normalized like a normal load.
pub fn read_backup_workspace(name: &str) -> Result<WorkspaceFile, String> {
    if name.contains('/') || name.contains('\\') || !is_backup_of(name, "workspace") {
        return Err("不正なバックアップ名です。".into());
    }
    let path = backups_dir().join(name);
    Ok(import_backup_file(&path)?.workspace)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A rotated backup lands in the folder under the `<prefix>-…json` name and
    /// keeps the text it was given.
    #[test]
    fn rotate_backup_writes_and_is_found() {
        let dir = std::env::temp_dir().join(format!("joycon_bk_{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        rotate_backup_in(&dir, "workspace", "{\"v\":1}");
        let files = backups_for_in(&dir, "workspace");
        assert_eq!(files.len(), 1, "one backup written");
        assert_eq!(std::fs::read_to_string(&files[0]).unwrap(), "{\"v\":1}");
        // A different prefix in the same dir is listed independently.
        rotate_backup_in(&dir, "usage", "[]");
        assert_eq!(backups_for_in(&dir, "workspace").len(), 1);
        assert_eq!(backups_for_in(&dir, "usage").len(), 1);
        let _ = std::fs::remove_dir_all(&dir);
    }

    /// Rotation prunes to the newest `max_backups(prefix)`; the just-written one
    /// survives. Also checks the stats prefix keeps fewer than the workspace.
    #[test]
    fn rotate_backup_prunes_to_cap() {
        let cap = max_backups("workspace");
        assert!(max_backups("usage") < cap, "stats keep fewer generations");
        let dir = std::env::temp_dir().join(format!("joycon_bkcap_{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        // Seed cap + 5 older backups with fixed, zero-padded names (they sort
        // before the nanosecond-stamped one rotate_backup_in writes).
        for i in 0..(cap + 5) {
            std::fs::write(dir.join(format!("workspace-{i:022}.json")), "old").unwrap();
        }
        rotate_backup_in(&dir, "workspace", "new");
        let files = backups_for_in(&dir, "workspace");
        assert_eq!(files.len(), cap, "pruned to the cap");
        // Newest survives and is the fresh write.
        assert_eq!(std::fs::read_to_string(files.last().unwrap()).unwrap(), "new");
        let _ = std::fs::remove_dir_all(&dir);
    }

    /// Throttle: no backups yet ⇒ due; right after one ⇒ not due.
    #[test]
    fn should_rotate_throttles_after_a_recent_backup() {
        let dir = std::env::temp_dir().join(format!("joycon_bkthr_{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        assert!(should_rotate_in(&dir, "workspace"), "none yet ⇒ due");
        rotate_backup_in(&dir, "workspace", "x");
        assert!(
            !should_rotate_in(&dir, "workspace"),
            "just made one ⇒ throttled"
        );
        let _ = std::fs::remove_dir_all(&dir);
    }
}
