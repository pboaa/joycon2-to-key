//! A smoothing integrator that moves the mouse cursor from stick / gyro angular
//! velocity. Velocity is integrated over time (independent of the tick interval),
//! smoothed with a one-pole low-pass, and the sub-pixel remainder is carried over
//! so it advances a reliable 1px at a time even when slow. The caller (the
//! processor, which holds the settings) computes and passes the deadzone.

use std::time::Instant;

use crate::keyboard::send_actions;
use crate::keys::InputAction;

/// Smoothed, time-based cursor motion state for stick/gyro→mouse.
#[derive(Default)]
pub(super) struct CursorMotion {
    /// Smoothed cursor velocity (px/sec) — a one-pole low-pass so the cursor
    /// eases between ticks instead of jumping.
    vel: (f32, f32),
    /// Carried sub-pixel remainder. Integer deltas go to the OS each tick; the
    /// fraction is kept so slow motion isn't lost to rounding (accumulates until
    /// it's worth a whole pixel).
    subpixel: (f32, f32),
    /// Instant of the last update, so motion integrates over the *actual*
    /// elapsed time (irregular tick spacing doesn't stutter the cursor).
    last_at: Option<Instant>,
}

impl CursorMotion {
    /// Move the cursor from the analog stick position. `deadzone` is the radial
    /// centre cutoff (0..1). Called every tick while stick-mouse is on. Returns
    /// true when the stick actually drove the cursor (past the deadzone) — the
    /// idle timer treats that as user activity so stick-as-mouse cursor movement
    /// isn't cut off.
    pub(super) fn apply_stick(&mut self, (x, y): (f32, f32), speed: f32, deadzone: f32) -> bool {
        if speed <= 0.0 {
            self.reset();
            return false;
        }
        let mag = (x * x + y * y).sqrt();
        // `<=` (not `<`): with the deadzone slider at 0, a centred stick has
        // mag == 0.0 == deadzone; `<` would fall through, divide 0/0 into a NaN
        // scale, and report "moved" every tick — permanently defeating the idle
        // auto-disconnect (and stalling the cursor on NaN).
        if mag <= deadzone {
            // Crisp stop on release (no easing tail) so drawing lands precisely.
            self.reset();
            return false;
        }
        // Rescale past the deadzone to 0..1, preserving direction.
        let scale = ((mag - deadzone) / (1.0 - deadzone)).clamp(0.0, 1.0) / mag;
        // Stick up is +y; screen up is -dy.
        self.emit_delta(x * scale * speed, -y * scale * speed);
        true
    }

    /// Zero the smoothing/sub-pixel state (stick centred, feature off, or reset).
    pub(super) fn reset(&mut self) {
        self.vel = (0.0, 0.0);
        self.subpixel = (0.0, 0.0);
        self.last_at = None;
    }

    /// Integrate a target velocity into a whole-pixel cursor delta, smoothed and
    /// time-based. `target_*` is calibrated in px per reference tick (`REF_TICK`);
    /// it's converted to px/sec and integrated over the *actual* elapsed time, so
    /// irregular tick spacing (BLE bursts, SendInput stalls) doesn't stutter the
    /// cursor. A rate-independent one-pole low-pass interpolates toward the new
    /// velocity (less jitter, smoother direction changes), and the sub-pixel
    /// carry means slow motion builds into steady 1-px steps instead of rounding
    /// to nothing.
    fn emit_delta(&mut self, target_x: f32, target_y: f32) {
        /// Seconds the `speed` unit (px per tick) was historically calibrated to.
        const REF_TICK: f32 = 0.008;
        /// Low-pass time constant (s). Larger = smoother but laggier.
        const TAU: f32 = 0.02;

        let now = Instant::now();
        // Elapsed since the last update (clamped so a long gap can't fling the
        // cursor). First move after a stop uses one reference tick.
        let dt = match self.last_at.replace(now) {
            Some(prev) => now.duration_since(prev).as_secs_f32().clamp(0.0, 0.05),
            None => REF_TICK,
        };
        // px/sec target from the px/ref-tick input.
        let tx = target_x / REF_TICK;
        let ty = target_y / REF_TICK;
        let a = (dt / TAU).clamp(0.0, 1.0);
        self.vel.0 += (tx - self.vel.0) * a;
        self.vel.1 += (ty - self.vel.1) * a;
        // Integrate velocity over dt, carrying the sub-pixel remainder.
        let ax = self.subpixel.0 + self.vel.0 * dt;
        let ay = self.subpixel.1 + self.vel.1 * dt;
        let dx = ax.trunc();
        let dy = ay.trunc();
        self.subpixel = (ax - dx, ay - dy);
        let (dx, dy) = (dx as i32, dy as i32);
        if dx != 0 || dy != 0 {
            send_actions(&[InputAction::MouseMove { dx, dy }]);
        }
    }
}
