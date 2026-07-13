//! The pie-menu overlay window: its creation (a hidden, transparent, click-through
//! top-most window shown at the cursor while a pie is held) and the pure geometry
//! used to place the live style-preview beside the settings window.

/// Create the pie pie-menu overlay window (hidden). Transparent + always-on-top +
/// off the taskbar; `focusable(false)` keeps it from stealing focus (so fired
/// keystrokes still reach the app underneath), and click-through lets that app
/// keep receiving the mouse. The input thread shows / positions / hides it.
pub(crate) fn create_pie_overlay(app: &tauri::App) -> tauri::Result<()> {
    use tauri::{WebviewUrl, WebviewWindowBuilder};
    let win = WebviewWindowBuilder::new(
        app.handle(),
        crate::PIE_OVERLAY_LABEL,
        WebviewUrl::App("index.html".into()),
    )
    .title("pie-overlay")
    .inner_size(crate::PIE_OVERLAY_SIZE, crate::PIE_OVERLAY_SIZE)
    // Born off-screen: a never-shown window ignores set_position, so if the very
    // first show races ahead of positioning it must not flash at the top-left —
    // off-screen it stays invisible until show_pie_overlay places it.
    .position(-30000.0, -30000.0)
    .transparent(true)
    .decorations(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .focusable(false)
    .shadow(false)
    .resizable(false)
    .visible(false)
    .build()?;
    // Click-through: the app underneath keeps receiving the mouse.
    let _ = win.set_ignore_cursor_events(true);
    Ok(())
}

// ── Preview-window geometry (pure) ───────────────────────────────────────────

/// A monitor / window rectangle in physical pixels (top-left + size).
#[derive(Debug, Clone, Copy, PartialEq)]
pub(crate) struct Rect {
    pub x: i32,
    pub y: i32,
    pub w: i32,
    pub h: i32,
}

/// Index of the first monitor whose rectangle contains `(cx, cy)`, if any.
/// Matches the half-open bounds Windows uses (top-left inclusive, bottom-right
/// exclusive), so a cursor exactly on the shared edge lands on one monitor only.
pub(crate) fn monitor_under(cx: i32, cy: i32, monitors: &[Rect]) -> Option<usize> {
    monitors
        .iter()
        .position(|m| cx >= m.x && cy >= m.y && (cx - m.x) < m.w && (cy - m.y) < m.h)
}

/// Where to place the pie style-preview window, in physical pixels.
#[derive(Debug, Clone, Copy, PartialEq)]
pub(crate) struct PreviewPlacement {
    /// Square window edge length.
    pub win_phys: u32,
    /// Top-left position.
    pub x: i32,
    pub y: i32,
    /// Pie centre, relative to the window (its middle).
    pub centre: (i32, i32),
}

/// Compute the preview window's square size + position on monitor `mon`. The
/// window is sized to the pie (`size_css` logical px + margin), clamped to fit
/// the monitor so a huge pie never spills, and placed in the widest gap beside
/// the app window (`app_span` = the app's left/right x-range when it's on this
/// monitor) — preferring the gap to the left, then the right, else hard left.
/// Pure: the command resolves the monitor rect + DPI scale and feeds them in.
pub(crate) fn preview_placement(
    mon: Rect,
    app_span: Option<(i32, i32)>,
    size_css: f64,
    scale: f64,
) -> PreviewPlacement {
    let Rect { x: mx, y: my, w: mw, h: mh } = mon;
    // Window = the pie box + a little margin, clamped to fit the monitor (so a
    // huge pie never spills). Stays comfortably under full-screen.
    let mon_min_css = ((mw.min(mh) as f64) / scale) - 80.0;
    let win_css = (size_css + 40.0).clamp(160.0, mon_min_css.max(160.0));
    let win_phys = (win_css * scale).round() as u32;

    // Put it where it won't cover the app's own window — preferring the gap to
    // the LEFT of it, then the gap to the right, else hard left as a fallback.
    let margin = (24.0 * scale) as i32;
    let need = win_phys as i32 + margin * 2;
    let desired_cx = match app_span {
        Some((al, _)) if al - mx >= need => mx + (al - mx) / 2, // left gap (preferred)
        Some((_, ar)) if (mx + mw) - ar >= need => ar + ((mx + mw) - ar) / 2, // right gap
        _ => mx + win_phys as i32 / 2 + margin,                 // fallback: hard left
    };
    let x = (desired_cx - win_phys as i32 / 2)
        .clamp(mx + margin, mx + mw - win_phys as i32 - margin);
    let y = my + (mh - win_phys as i32) / 2;
    // Pie centre = window middle (physical px, window-relative).
    let centre = (win_phys as i32 / 2, win_phys as i32 / 2);
    PreviewPlacement { win_phys, x, y, centre }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn mon(x: i32, y: i32, w: i32, h: i32) -> Rect {
        Rect { x, y, w, h }
    }

    #[test]
    fn monitor_under_picks_the_containing_rect() {
        let mons = [mon(0, 0, 1920, 1080), mon(1920, 0, 2560, 1440)];
        assert_eq!(monitor_under(100, 100, &mons), Some(0));
        assert_eq!(monitor_under(2000, 200, &mons), Some(1));
        // Shared edge (x = 1920) belongs to the right monitor only (half-open).
        assert_eq!(monitor_under(1920, 0, &mons), Some(1));
        // Off every monitor.
        assert_eq!(monitor_under(-5, -5, &mons), None);
        assert_eq!(monitor_under(9999, 0, &mons), None);
    }

    #[test]
    fn placement_no_app_falls_back_to_hard_left() {
        let p = preview_placement(mon(0, 0, 1920, 1080), None, 280.0, 1.0);
        // 280 + 40 = 320, within [160, 1000].
        assert_eq!(p.win_phys, 320);
        // Hard-left fallback: centre at margin+half, clamped to margin.
        assert_eq!(p.x, 24);
        assert_eq!(p.y, (1080 - 320) / 2);
        assert_eq!(p.centre, (160, 160));
    }

    #[test]
    fn placement_prefers_the_left_gap_beside_the_app() {
        // App window occupies x 800..1200 → wide gap to its left.
        let p = preview_placement(mon(0, 0, 1920, 1080), Some((800, 1200)), 280.0, 1.0);
        assert_eq!(p.win_phys, 320);
        // Centre of the left gap (0..800) is 400 → x = 400 - 160.
        assert_eq!(p.x, 240);
    }

    #[test]
    fn placement_uses_right_gap_when_left_is_too_narrow() {
        // App at 300..1000: the left gap (300) is too narrow for the 368px need,
        // but the right gap (920) fits, so the window lands to the right.
        let p = preview_placement(mon(0, 0, 1920, 1080), Some((300, 1000)), 280.0, 1.0);
        // Right gap centre = 1000 + (1920-1000)/2 = 1460 → x = 1460 - 160 = 1300.
        assert_eq!(p.x, 1300);
    }

    #[test]
    fn placement_clamps_a_huge_pie_to_the_monitor() {
        // A pie far larger than the monitor is capped at the short side − 80.
        let p = preview_placement(mon(0, 0, 1920, 1080), None, 5000.0, 1.0);
        assert_eq!(p.win_phys, 1000, "clamped to (1080 − 80) css × scale 1");
        assert!(p.win_phys <= 1080, "never spills the monitor");
    }

    #[test]
    fn placement_offsets_by_monitor_origin() {
        // On the second monitor (origin 1920,0) the fallback position is shifted
        // by that origin, not measured from 0.
        let p = preview_placement(mon(1920, 0, 1920, 1080), None, 280.0, 1.0);
        assert_eq!(p.x, 1920 + 24);
    }
}
