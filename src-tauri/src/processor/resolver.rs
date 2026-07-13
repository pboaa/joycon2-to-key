//! Foreground app name → which profile / layer to use. Throttles the Win32
//! foreground-process query and only rebuilds the resolved profile when the app
//! actually changes, keeping per-frame button handling cheap.

use std::sync::Arc;
use std::time::Instant;

use crate::config::{AppConfig, ProfileConfig};
use crate::foreground::foreground_process_name;

use super::variant::{is_default_key, strip_exe};
use super::InputProcessor;

/// How often (ms) to re-query the foreground process name (Win32 call throttle).
const APP_REFRESH_MS: u128 = 250;

impl InputProcessor {
    pub(super) fn refresh_current_app(&mut self) {
        let now = Instant::now();
        let due = match self.last_app_check {
            Some(t) => now.saturating_duration_since(t).as_millis() >= APP_REFRESH_MS,
            None => true,
        };
        if !due {
            return;
        }
        self.last_app_check = Some(now);
        let app = foreground_process_name();
        // Our own window: don't fire mappings into it, and keep the last real
        // app's profile (instead of falling back to default).
        self.self_focused =
            !self.self_exe.is_empty() && app.eq_ignore_ascii_case(&self.self_exe);
        if self.self_focused {
            return;
        }
        self.current_app = app;
    }

    pub(super) fn ensure_layer(&mut self, profile_name: &str, profile: &ProfileConfig) -> String {
        let entry = self.active_layers.get(profile_name).cloned();
        match entry {
            Some(name) if profile.layers.contains_key(&name) => name,
            _ => {
                let init = profile.initial_layer.clone();
                self.active_layers
                    .insert(profile_name.to_string(), init.clone());
                init
            }
        }
    }

    /// Rebuild the cached resolved profile when the foreground app changed.
    pub(super) fn ensure_resolved(&mut self) {
        let stale = match &self.resolved {
            Some((app, _, _)) => *app != self.current_app,
            None => true,
        };
        if stale {
            let (name, profile) = compute_resolved(&self.config, &self.current_app);
            self.resolved = Some((self.current_app.clone(), name, Arc::new(profile)));
        }
    }
}

/// The profile name + config to use for `current_app`: the matching app profile
/// if any, else the "デフォルト"/"default" fallback, else the first profile, else
/// an empty default. Pure so it can be unit-tested and reused off `&self`.
pub(super) fn compute_resolved(config: &AppConfig, current_app: &str) -> (String, ProfileConfig) {
    // Each profile is fully independent — an app profile is used as-is (no
    // merge with デフォルト), so same-named layers across profiles can't
    // collide. デフォルト is only the fallback when no app profile matches.
    if let Some((name, profile)) = find_app_profile(config, current_app) {
        return (name, profile);
    }

    // The fallback profile is keyed "デフォルト"; older configs used "default".
    let default_entry = config
        .get_key_value("デフォルト")
        .or_else(|| config.get_key_value("default"));
    if let Some((k, v)) = default_entry {
        return (k.clone(), v.clone());
    }

    // Fallback: first profile or empty.
    if let Some((k, v)) = config.iter().next() {
        return (k.clone(), v.clone());
    }
    ("デフォルト".to_string(), ProfileConfig::default())
}

/// The profile explicitly bound to `current_app` (by `match_apps`, or a legacy
/// profile keyed by the process name), matching on both the exact name and the
/// extension-stripped form. `None` for the sentinel apps or when nothing matches.
pub(super) fn find_app_profile(
    config: &AppConfig,
    current_app: &str,
) -> Option<(String, ProfileConfig)> {
    if current_app == "default" || current_app == "unknown" {
        return None;
    }
    let no_ext = strip_exe(current_app);
    for (key, profile) in config {
        if is_default_key(key) {
            continue;
        }
        let matched = if profile.match_apps.is_empty() {
            // Legacy config: profile keyed by the process name itself.
            key == current_app || strip_exe(key) == no_ext
        } else {
            profile
                .match_apps
                .iter()
                .any(|m| m == current_app || strip_exe(m) == no_ext)
        };
        if matched {
            return Some((key.clone(), profile.clone()));
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::LayerConfig;
    use indexmap::IndexMap;

    // ── Builders ────────────────────────────────────────────────────────────

    fn profile(match_apps: &[&str]) -> ProfileConfig {
        let mut layers = IndexMap::new();
        layers.insert("base".to_string(), LayerConfig::default());
        ProfileConfig {
            match_apps: match_apps.iter().map(|s| s.to_string()).collect(),
            initial_layer: "base".to_string(),
            layers,
            ..Default::default()
        }
    }

    fn config(entries: Vec<(&str, ProfileConfig)>) -> AppConfig {
        let mut map = IndexMap::new();
        for (name, p) in entries {
            map.insert(name.to_string(), p);
        }
        map
    }

    // ── find_app_profile ────────────────────────────────────────────────────

    #[test]
    fn matches_by_match_apps_exact_and_stripped() {
        let cfg = config(vec![("Browser", profile(&["chrome.exe"]))]);
        assert_eq!(find_app_profile(&cfg, "chrome.exe").unwrap().0, "Browser");
        // Extension-insensitive: bare "chrome" matches "chrome.exe".
        assert_eq!(find_app_profile(&cfg, "chrome").unwrap().0, "Browser");
        // Case-insensitive via strip_exe's lowercasing.
        assert_eq!(find_app_profile(&cfg, "Chrome.EXE").unwrap().0, "Browser");
    }

    #[test]
    fn legacy_profile_keyed_by_process_name() {
        // No match_apps → the profile's own key acts as the process name.
        let cfg = config(vec![("notepad.exe", profile(&[]))]);
        assert_eq!(find_app_profile(&cfg, "notepad.exe").unwrap().0, "notepad.exe");
        assert_eq!(find_app_profile(&cfg, "notepad").unwrap().0, "notepad.exe");
    }

    #[test]
    fn default_profile_is_never_an_app_match() {
        let cfg = config(vec![("デフォルト", profile(&["デフォルト"]))]);
        assert!(find_app_profile(&cfg, "デフォルト").is_none());
    }

    #[test]
    fn sentinel_apps_and_no_match_return_none() {
        let cfg = config(vec![("Browser", profile(&["chrome.exe"]))]);
        assert!(find_app_profile(&cfg, "default").is_none());
        assert!(find_app_profile(&cfg, "unknown").is_none());
        assert!(find_app_profile(&cfg, "firefox.exe").is_none());
    }

    // ── compute_resolved (fallback ladder) ──────────────────────────────────

    #[test]
    fn resolves_app_profile_over_default() {
        let cfg = config(vec![
            ("デフォルト", profile(&[])),
            ("Browser", profile(&["chrome.exe"])),
        ]);
        assert_eq!(compute_resolved(&cfg, "chrome.exe").0, "Browser");
    }

    #[test]
    fn falls_back_to_default_key() {
        let cfg = config(vec![
            ("デフォルト", profile(&[])),
            ("Browser", profile(&["chrome.exe"])),
        ]);
        // An unmatched app lands on the デフォルト fallback.
        assert_eq!(compute_resolved(&cfg, "firefox.exe").0, "デフォルト");
    }

    #[test]
    fn falls_back_to_legacy_default_spelling() {
        let cfg = config(vec![("default", profile(&[]))]);
        assert_eq!(compute_resolved(&cfg, "firefox.exe").0, "default");
    }

    #[test]
    fn falls_back_to_first_profile_then_empty() {
        // No デフォルト/default present → first profile wins.
        let cfg = config(vec![("Only", profile(&["x.exe"]))]);
        assert_eq!(compute_resolved(&cfg, "unknown").0, "Only");
        // Empty config → synthesized empty default.
        let empty: AppConfig = IndexMap::new();
        assert_eq!(compute_resolved(&empty, "unknown").0, "デフォルト");
    }
}
