//! Usage-stats stores: the daily button / pie-direction / per-operation counts,
//! their file paths, and load/save helpers. Persisted as small separate files
//! next to workspace.json, with the same corruption protection.

use std::path::{Path, PathBuf};

use serde::Serialize;

use super::super::runtime::RuntimeSettings;
use super::workspace::{config_dir, load_protected, write_atomic};

/// Serialize `value` to compact JSON and write it atomically. Shared by the
/// three usage stores, which differ only in their value type.
fn save_json<T: Serialize>(path: &Path, value: &T) -> Result<(), String> {
    let json = serde_json::to_string(value).map_err(|e| e.to_string())?;
    write_atomic(path, &json)
}

/// Button-activation counts for one day: profile → layer → button → count.
pub type UsageMap = std::collections::BTreeMap<
    String,
    std::collections::BTreeMap<String, std::collections::BTreeMap<String, u64>>,
>;
/// Daily buckets keyed by UTC day number (unix_secs / 86400, as a string), so
/// the UI can sum any recent window. Kept in a small separate file.
pub type DayUsageMap = std::collections::BTreeMap<String, UsageMap>;

pub fn usage_path() -> PathBuf {
    config_dir().join("usage.json")
}

pub fn load_usage() -> DayUsageMap {
    load_protected(&usage_path(), "usage")
}

pub fn save_usage(path: &Path, usage: &DayUsageMap) -> Result<(), String> {
    save_json(path, usage)
}

/// Pie-direction counts for one day: profile → layer → button → slice key
/// ("0".."n"/"center") → count. Keyed like button usage plus a slice level, so a
/// button's pie usage is attributable to its context.
pub type PieUsageMap = std::collections::BTreeMap<
    String,
    std::collections::BTreeMap<
        String,
        std::collections::BTreeMap<String, std::collections::BTreeMap<String, u64>>,
    >,
>;
/// Daily buckets keyed by UTC day number (as a string).
pub type DayPieUsageMap = std::collections::BTreeMap<String, PieUsageMap>;

pub fn pie_usage_path() -> PathBuf {
    config_dir().join("pie_usage.json")
}

pub fn load_pie_usage() -> DayPieUsageMap {
    load_protected(&pie_usage_path(), "pie_usage")
}

pub fn save_pie_usage(path: &Path, usage: &DayPieUsageMap) -> Result<(), String> {
    save_json(path, usage)
}

/// Per-operation activation counts for one day: definition id → count. Keyed by
/// the definition (not the button), so the count survives moving an operation to
/// a different button — the "which operations do I actually use" view.
pub type DefUsageMap = std::collections::BTreeMap<String, u64>;
/// Daily buckets keyed by UTC day number (as a string).
pub type DayDefUsageMap = std::collections::BTreeMap<String, DefUsageMap>;

pub fn def_usage_path() -> PathBuf {
    config_dir().join("def_usage.json")
}

pub fn load_def_usage() -> DayDefUsageMap {
    load_protected(&def_usage_path(), "def_usage")
}

pub fn save_def_usage(path: &Path, usage: &DayDefUsageMap) -> Result<(), String> {
    save_json(path, usage)
}

/// Today's bucket key = UTC day number (unix seconds / 86400).
pub fn today_key() -> String {
    let secs = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    (secs / 86400).to_string()
}

/// Persist all three usage stores from the runtime's current snapshot to their
/// default paths (best-effort; write errors are ignored). The single place that
/// knows "the usage state lives in these three files" — used by the reset,
/// backup-apply and periodic-flush paths.
pub fn save_all_usage(runtime: &RuntimeSettings) {
    let _ = save_usage(&usage_path(), &runtime.snapshot_usage());
    let _ = save_pie_usage(&pie_usage_path(), &runtime.snapshot_pie_usage());
    let _ = save_def_usage(&def_usage_path(), &runtime.snapshot_def_usage());
}
