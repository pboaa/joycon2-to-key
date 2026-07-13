//! A lock-free view that accumulates battery voltage / charge state / current /
//! temperature diagnostics from input frames. The BLE notification loop writes it
//! every frame; UI polling can read it at any time.

use std::sync::atomic::{AtomicBool, AtomicI16, AtomicU16, AtomicU8, Ordering};

use super::protocol::{
    BATTERY_CHARGE_OFFSET, BATTERY_FRAME_LEN, BATTERY_MV_OFFSET, CURRENT_OFFSET, DIAG_FRAME_LEN,
    TEMP_OFFSET,
};
use super::BatteryReading;

/// An atomic view aggregating battery + diagnostics values. Bundles 5 separate atomics into one.
#[derive(Default)]
pub(super) struct Telemetry {
    /// Battery voltage (mV) @0x1F.
    mv: AtomicU16,
    /// Charging-state byte @0x21.
    charge: AtomicU8,
    /// Raw current @0x28 (mA = raw/100) and temperature @0x2E (°C = 25 + raw/127).
    current_raw: AtomicI16,
    temp_raw: AtomicI16,
    /// Whether the last frame carried the extended (current/temp) fields. Short
    /// frames leave the raws stale, so we gate on this.
    has_diag: AtomicBool,
}

impl Telemetry {
    /// Record battery voltage/charge from an input frame, plus current/temp when
    /// the frame is long enough to carry the extended fields. Short frames leave
    /// the extended fields as they were (gated by `has_diag`).
    pub(super) fn record_frame(&self, data: &[u8]) {
        if data.len() >= BATTERY_FRAME_LEN {
            self.mv.store(
                u16::from_le_bytes([data[BATTERY_MV_OFFSET], data[BATTERY_MV_OFFSET + 1]]),
                Ordering::Relaxed,
            );
            self.charge.store(data[BATTERY_CHARGE_OFFSET], Ordering::Relaxed);
        }
        if data.len() >= DIAG_FRAME_LEN {
            self.current_raw.store(
                i16::from_le_bytes([data[CURRENT_OFFSET], data[CURRENT_OFFSET + 1]]),
                Ordering::Relaxed,
            );
            self.temp_raw.store(
                i16::from_le_bytes([data[TEMP_OFFSET], data[TEMP_OFFSET + 1]]),
                Ordering::Relaxed,
            );
            self.has_diag.store(true, Ordering::Relaxed);
        }
    }

    /// Latest reading, or None until the first frame with a voltage arrives.
    pub(super) fn reading(&self) -> Option<BatteryReading> {
        let mv = self.mv.load(Ordering::Relaxed);
        if mv == 0 {
            return None;
        }
        // 0x21 charge state: rises on USB and settles around 0x34, 0x20 when fully charged, 0x00 = not charging.
        let charging = self.charge.load(Ordering::Relaxed) > 0x20;
        // current (mA) = raw/100, temperature (°C) = 25 + raw/127 (per Joycon2forMac).
        // None unless we've received a frame that includes the extended fields.
        let (current_ma, temperature_c) = if self.has_diag.load(Ordering::Relaxed) {
            (
                Some(self.current_raw.load(Ordering::Relaxed) as f32 / 100.0),
                Some(25.0 + self.temp_raw.load(Ordering::Relaxed) as f32 / 127.0),
            )
        } else {
            (None, None)
        };
        Some(BatteryReading {
            millivolts: mv,
            charging,
            current_ma,
            temperature_c,
        })
    }

    /// Forget the cached reading so a stale value isn't shown after the link
    /// drops (reading() returns None while mv == 0).
    pub(super) fn clear(&self) {
        self.mv.store(0, Ordering::Relaxed);
        self.charge.store(0, Ordering::Relaxed);
        self.has_diag.store(false, Ordering::Relaxed);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Build a zeroed frame with battery + diagnostics bytes filled in.
    fn frame_with(mv: u16, charge: u8, current: i16, temp: i16) -> Vec<u8> {
        let mut f = vec![0u8; DIAG_FRAME_LEN];
        f[BATTERY_MV_OFFSET..BATTERY_MV_OFFSET + 2].copy_from_slice(&mv.to_le_bytes());
        f[BATTERY_CHARGE_OFFSET] = charge;
        f[CURRENT_OFFSET..CURRENT_OFFSET + 2].copy_from_slice(&current.to_le_bytes());
        f[TEMP_OFFSET..TEMP_OFFSET + 2].copy_from_slice(&temp.to_le_bytes());
        f
    }

    #[test]
    fn none_until_a_voltage_frame_arrives() {
        let t = Telemetry::default();
        assert!(t.reading().is_none());
    }

    #[test]
    fn full_frame_yields_voltage_charge_and_diagnostics() {
        let t = Telemetry::default();
        // charge byte > 0x20 → charging; current 2500 raw → 25.0 mA;
        // temp 0 raw → 25.0 °C.
        t.record_frame(&frame_with(3695, 0x34, 2500, 0));
        let r = t.reading().expect("has a reading");
        assert_eq!(r.millivolts, 3695);
        assert!(r.charging);
        assert_eq!(r.current_ma, Some(25.0));
        assert_eq!(r.temperature_c, Some(25.0));
    }

    #[test]
    fn short_frame_leaves_diagnostics_absent() {
        let t = Telemetry::default();
        // Only long enough for battery voltage/charge, not current/temp.
        let mut f = vec![0u8; BATTERY_FRAME_LEN];
        f[BATTERY_MV_OFFSET..BATTERY_MV_OFFSET + 2].copy_from_slice(&3500u16.to_le_bytes());
        f[BATTERY_CHARGE_OFFSET] = 0x10; // not charging
        t.record_frame(&f);
        let r = t.reading().expect("has a reading");
        assert_eq!(r.millivolts, 3500);
        assert!(!r.charging);
        assert_eq!(r.current_ma, None);
        assert_eq!(r.temperature_c, None);
    }

    #[test]
    fn clear_forgets_the_reading() {
        let t = Telemetry::default();
        t.record_frame(&frame_with(3700, 0x00, 0, 0));
        assert!(t.reading().is_some());
        t.clear();
        assert!(t.reading().is_none());
    }
}
