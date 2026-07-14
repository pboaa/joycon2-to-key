//! Lock-free runtime view of the app-wide settings.

use std::sync::atomic::{AtomicBool, AtomicI32, AtomicU64, AtomicU8, Ordering};
use std::sync::Mutex;

use super::schema::{GlobalSettings, InputTuning};
use super::storage::{today_key, DayDefUsageMap, DayPieUsageMap, DayUsageMap};

/// A pending haptic request handed from the input thread to the BLE loop.
#[derive(Debug, Clone)]
pub enum Vibration {
    /// Play a built-in vibration sample (subcmd 0x02; ids 1–7).
    Sample(u8),
}

/// Lock-free view of [`GlobalSettings`] shared with the input thread and the
/// BLE loops so they can read the current values without a mutex.
#[derive(Debug)]
pub struct RuntimeSettings {
    pub idle_enabled: AtomicBool,
    pub idle_timeout_secs: AtomicU64,
    /// Set by the input thread when an idle-disconnect is due; consumed by the
    /// BLE liveness loop.
    pub idle_disconnect_pending: AtomicBool,
    /// Vibration sample (1–7; 0 = off) buzzed by the input thread a few seconds
    /// before the idle disconnect, while the link is still up.
    pub idle_warn_vibration: AtomicU8,
    /// Vibration sample (1–7; 0 = off) buzzed by the BLE loop when the link
    /// comes up (after the init handshake).
    pub connect_vibration: AtomicU8,
    /// Player-indicator LED byte (see `GlobalSettings::player_leds`). Sent on
    /// connect; live changes are flagged by `led_dirty`.
    pub player_leds: AtomicU8,
    /// Set when `player_leds` changed and the BLE loop should re-send it.
    pub led_dirty: AtomicBool,
    pub pie_threshold: AtomicI32,
    pub scroll_amount: AtomicI32,
    /// Whether to show the pie pie-menu overlay (pies fire either way).
    pub pie_overlay_enabled: AtomicBool,
    /// Whether releasing beyond the outer ring cancels the pie (global
    /// default; a per-pie appearance can override it).
    pub pie_cancel_outside: AtomicBool,
    /// Pie overlay diameter in logical px.
    pub pie_overlay_size: AtomicI32,
    /// Stick centre deadzone as a percent (0–50).
    pub stick_deadzone: AtomicI32,
    /// A haptic queued by the input thread, consumed by the BLE notify loop.
    /// Low-frequency, so a mutex is fine (and lets us carry raw bytes).
    pub vibrate_pending: Mutex<Option<Vibration>>,
    /// Button-activation counts (profile → layer → button → count), loaded from
    /// and flushed to usage.json by the input thread.
    usage: Mutex<DayUsageMap>,
    /// Pie-direction activation counts, daily buckets (day → pie id → slice → n).
    pie_usage: Mutex<DayPieUsageMap>,
    /// Per-operation activation counts, daily buckets (day → definition id → n).
    /// Counted by the operation so it survives moving it to another button.
    def_usage: Mutex<DayDefUsageMap>,
    /// Set when any usage map changed since the last flush.
    usage_dirty: AtomicBool,
    /// Keep only the most recent N days of usage stats (0 = unlimited). Applied
    /// via [`RuntimeSettings::prune_usage`] whenever settings are (re)applied.
    usage_retention_days: AtomicI32,
    /// True while the settings UI is showing the pie-style *preview* overlay.
    /// The processor then leaves the overlay window alone (a config-replace on
    /// every autosave would otherwise reset → hide it mid-preview).
    overlay_preview: AtomicBool,
}

impl RuntimeSettings {
    pub fn from(s: &GlobalSettings) -> Self {
        let rt = Self {
            idle_enabled: AtomicBool::new(false),
            idle_timeout_secs: AtomicU64::new(0),
            idle_disconnect_pending: AtomicBool::new(false),
            idle_warn_vibration: AtomicU8::new(0),
            connect_vibration: AtomicU8::new(0),
            player_leds: AtomicU8::new(0),
            led_dirty: AtomicBool::new(false),
            pie_threshold: AtomicI32::new(0),
            scroll_amount: AtomicI32::new(0),
            pie_overlay_enabled: AtomicBool::new(true),
            pie_cancel_outside: AtomicBool::new(false),
            pie_overlay_size: AtomicI32::new(280),
            stick_deadzone: AtomicI32::new(0),
            vibrate_pending: Mutex::new(None),
            usage: Mutex::new(super::storage::load_usage()),
            pie_usage: Mutex::new(super::storage::load_pie_usage()),
            def_usage: Mutex::new(super::storage::load_def_usage()),
            usage_dirty: AtomicBool::new(false),
            usage_retention_days: AtomicI32::new(0),
            overlay_preview: AtomicBool::new(false),
        };
        rt.apply(s);
        rt
    }

    /// Enter/leave pie-style preview mode (see `overlay_preview`).
    pub fn set_overlay_preview(&self, on: bool) {
        self.overlay_preview.store(on, Ordering::Relaxed);
    }
    pub fn overlay_preview(&self) -> bool {
        self.overlay_preview.load(Ordering::Relaxed)
    }

    pub fn apply(&self, s: &GlobalSettings) {
        self.idle_enabled.store(s.idle_enabled, Ordering::Relaxed);
        self.idle_timeout_secs
            .store(s.idle_timeout_secs, Ordering::Relaxed);
        self.idle_warn_vibration
            .store(s.disconnect_vibration, Ordering::Relaxed);
        self.connect_vibration
            .store(s.connect_vibration, Ordering::Relaxed);
        self.player_leds.store(s.player_leds, Ordering::Relaxed);
        // Re-send the lamps on the next BLE tick (covers a live settings change).
        self.led_dirty.store(true, Ordering::Relaxed);
        self.pie_threshold
            .store(s.pie_threshold, Ordering::Relaxed);
        self.scroll_amount.store(s.scroll_amount, Ordering::Relaxed);
        self.pie_overlay_enabled
            .store(s.pie_overlay_enabled, Ordering::Relaxed);
        self.pie_cancel_outside
            .store(s.pie_cancel_outside, Ordering::Relaxed);
        self.pie_overlay_size
            .store(s.pie_overlay_size, Ordering::Relaxed);
        self.stick_deadzone
            .store(s.stick_deadzone, Ordering::Relaxed);
        self.usage_retention_days
            .store(s.usage_retention_days, Ordering::Relaxed);
        // Apply the retention window now (boot + every settings change), so
        // lowering it takes effect without waiting for the next day rollover.
        self.prune_usage();
    }

    /// Drop usage day-buckets older than the retention window (0 = keep all).
    /// Marks usage dirty only when something was actually removed, so the input
    /// thread persists the trimmed maps on its next flush.
    pub fn prune_usage(&self) {
        let days = self.usage_retention_days.load(Ordering::Relaxed);
        if days <= 0 {
            return; // unlimited
        }
        // Day-bucket keys are UTC day numbers (unix_secs / 86400) as strings.
        let today: i64 = today_key().parse().unwrap_or(0);
        let cutoff = today - days as i64;
        let mut changed = false;
        if let Ok(mut u) = self.usage.lock() {
            changed |= retain_recent_days(&mut u, cutoff);
        }
        if let Ok(mut u) = self.pie_usage.lock() {
            changed |= retain_recent_days(&mut u, cutoff);
        }
        if let Ok(mut u) = self.def_usage.lock() {
            changed |= retain_recent_days(&mut u, cutoff);
        }
        if changed {
            self.usage_dirty.store(true, Ordering::Relaxed);
        }
    }

    /// Queue a haptic for the BLE loop to send (drops any older un-sent one).
    pub fn request_vibrate(&self, v: Vibration) {
        if let Ok(mut slot) = self.vibrate_pending.lock() {
            *slot = Some(v);
        }
    }

    /// Take the queued haptic, if any (called by the BLE notify loop).
    pub fn take_vibrate(&self) -> Option<Vibration> {
        self.vibrate_pending.lock().ok().and_then(|mut s| s.take())
    }

    /// Count one activation of `btn` in `profile`/`layer` (into today's bucket).
    pub fn record_usage(&self, profile: &str, layer: &str, btn: &str) {
        if let Ok(mut u) = self.usage.lock() {
            *u.entry(today_key())
                .or_default()
                .entry(profile.to_string())
                .or_default()
                .entry(layer.to_string())
                .or_default()
                .entry(btn.to_string())
                .or_default() += 1;
        }
        self.usage_dirty.store(true, Ordering::Relaxed);
    }

    /// Count one activation of pie `pie_id`'s slice `slice_key` ("0".."n" or
    /// "center").
    pub fn record_pie_usage(&self, profile: &str, layer: &str, btn: &str, slice_key: &str) {
        if let Ok(mut u) = self.pie_usage.lock() {
            *u.entry(today_key())
                .or_default()
                .entry(profile.to_string())
                .or_default()
                .entry(layer.to_string())
                .or_default()
                .entry(btn.to_string())
                .or_default()
                .entry(slice_key.to_string())
                .or_default() += 1;
        }
        self.usage_dirty.store(true, Ordering::Relaxed);
    }

    /// Count one activation of the operation (definition) `def_id`.
    pub fn record_def_usage(&self, def_id: &str) {
        if let Ok(mut u) = self.def_usage.lock() {
            *u.entry(today_key())
                .or_default()
                .entry(def_id.to_string())
                .or_default() += 1;
        }
        self.usage_dirty.store(true, Ordering::Relaxed);
    }

    /// A clone of the daily usage buckets (for the UI / persistence).
    pub fn snapshot_usage(&self) -> DayUsageMap {
        self.usage.lock().map(|u| u.clone()).unwrap_or_default()
    }

    /// A clone of the daily pie-direction usage buckets.
    pub fn snapshot_pie_usage(&self) -> DayPieUsageMap {
        self.pie_usage.lock().map(|u| u.clone()).unwrap_or_default()
    }

    /// A clone of the daily per-operation usage buckets.
    pub fn snapshot_def_usage(&self) -> DayDefUsageMap {
        self.def_usage.lock().map(|u| u.clone()).unwrap_or_default()
    }

    /// Clear all usage counts (buttons + pie directions + operations).
    pub fn reset_usage(&self) {
        if let Ok(mut u) = self.usage.lock() {
            u.clear();
        }
        if let Ok(mut u) = self.pie_usage.lock() {
            u.clear();
        }
        if let Ok(mut u) = self.def_usage.lock() {
            u.clear();
        }
        self.usage_dirty.store(true, Ordering::Relaxed);
    }

    /// Clear one button's counts (button activations + its pie directions)
    /// across every day, leaving all other buttons intact. `def_usage` is keyed
    /// by operation, not button, so a shared operation's total is left alone.
    /// The caller persists.
    pub fn reset_button_usage(&self, profile: &str, layer: &str, btn: &str) {
        if let Ok(mut u) = self.usage.lock() {
            for day in u.values_mut() {
                if let Some(layers) = day.get_mut(profile) {
                    if let Some(btns) = layers.get_mut(layer) {
                        btns.remove(btn);
                    }
                }
            }
        }
        if let Ok(mut u) = self.pie_usage.lock() {
            for day in u.values_mut() {
                if let Some(layers) = day.get_mut(profile) {
                    if let Some(btns) = layers.get_mut(layer) {
                        btns.remove(btn);
                    }
                }
            }
        }
        self.usage_dirty.store(true, Ordering::Relaxed);
    }

    /// Replace all usage counts (used by backup import). The caller persists.
    pub fn set_usage(&self, usage: DayUsageMap, pie: DayPieUsageMap, def: DayDefUsageMap) {
        if let Ok(mut u) = self.usage.lock() {
            *u = usage;
        }
        if let Ok(mut u) = self.pie_usage.lock() {
            *u = pie;
        }
        if let Ok(mut u) = self.def_usage.lock() {
            *u = def;
        }
        self.usage_dirty.store(true, Ordering::Relaxed);
    }

    /// Take (and clear) the dirty flag — true if usage changed since last flush.
    pub fn take_usage_dirty(&self) -> bool {
        self.usage_dirty.swap(false, Ordering::Relaxed)
    }

    /// The current app-wide input-tuning values as an [`InputTuning`].
    pub fn input_tuning(&self) -> InputTuning {
        InputTuning {
            pie_threshold: self.pie_threshold.load(Ordering::Relaxed),
            scroll_amount: self.scroll_amount.load(Ordering::Relaxed),
        }
    }
}

/// Remove day-bucket entries whose key (a UTC day number) is before `cutoff`.
/// Returns whether anything was removed. Unparseable keys are kept defensively.
fn retain_recent_days<V>(map: &mut std::collections::BTreeMap<String, V>, cutoff: i64) -> bool {
    let before = map.len();
    map.retain(|k, _| k.parse::<i64>().map(|d| d >= cutoff).unwrap_or(true));
    map.len() != before
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::BTreeMap;

    /// Buckets older than the cutoff are dropped; the cutoff day itself, newer
    /// days and unparseable keys are kept; the return flag reflects removals.
    #[test]
    fn retain_recent_days_trims_old_buckets() {
        let mut m: BTreeMap<String, u32> = BTreeMap::new();
        for (k, v) in [("100", 1), ("109", 2), ("110", 3), ("200", 4), ("odd", 9)] {
            m.insert(k.to_string(), v);
        }
        // cutoff = 110 → drop 100/109, keep 110/200 and the unparseable "odd".
        let removed = retain_recent_days(&mut m, 110);
        assert!(removed);
        let mut kept: Vec<&str> = m.keys().map(String::as_str).collect();
        kept.sort();
        assert_eq!(kept, vec!["110", "200", "odd"]);
        // Nothing to remove the second time.
        assert!(!retain_recent_days(&mut m, 110));
    }
}
