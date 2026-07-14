//! Tauri command handlers (the IPC surface the front end calls) plus the shared
//! [`AppState`] they run against. `lib.rs` only wires these into the builder.

use std::sync::Arc;

use crate::joycon::{BatteryReading, ConnectionState, JoyConHandle, JoyConSnapshot};
use crate::{apps, config, foreground, mouse, overlay, processor, PIE_OVERLAY_LABEL};

pub(crate) struct AppState {
    pub(crate) joycon: Arc<JoyConHandle>,
    pub(crate) active_layer: processor::SharedActiveLayer,
    pub(crate) runtime: Arc<config::RuntimeSettings>,
}

#[tauri::command]
pub(crate) async fn connect_joycon(state: tauri::State<'_, AppState>) -> Result<(), String> {
    state.joycon.clone().connect().await
}

#[tauri::command]
pub(crate) async fn disconnect_joycon(state: tauri::State<'_, AppState>) -> Result<(), String> {
    state.joycon.disconnect().await;
    Ok(())
}

#[tauri::command]
pub(crate) async fn get_connection_state(
    state: tauri::State<'_, AppState>,
) -> Result<ConnectionState, String> {
    Ok(state.joycon.connection_state().await)
}

#[tauri::command]
pub(crate) async fn get_joycon_state(
    state: tauri::State<'_, AppState>,
) -> Result<Option<JoyConSnapshot>, String> {
    Ok(state.joycon.snapshot().await)
}

#[tauri::command]
pub(crate) fn get_battery(state: tauri::State<'_, AppState>) -> Option<BatteryReading> {
    state.joycon.battery()
}

/// Buzz the controller now with a built-in vibration pattern (id 1–7, default 3).
#[tauri::command]
pub(crate) fn test_vibrate(state: tauri::State<'_, AppState>, sample: Option<u8>) {
    state
        .joycon
        .vibrate(config::Vibration::Sample(sample.unwrap_or(3)));
}

#[tauri::command]
pub(crate) fn get_active_app_name() -> String {
    foreground::foreground_process_name()
}

#[tauri::command]
pub(crate) fn list_running_apps() -> Vec<apps::RunningApp> {
    apps::list_running_apps()
}

#[tauri::command]
pub(crate) fn get_active_layer(state: tauri::State<'_, AppState>) -> processor::ActiveLayer {
    state.active_layer.lock().unwrap().clone()
}

#[tauri::command]
pub(crate) fn get_config_path() -> String {
    config::workspace_path().display().to_string()
}

/// The bundled presets as a fresh definition store (for the reset action).
#[tauri::command]
pub(crate) fn reset_definitions() -> config::DefinitionsFile {
    config::seeded_definitions()
}

#[tauri::command]
pub(crate) fn release_all_inputs(state: tauri::State<'_, AppState>) -> Result<(), String> {
    state.joycon.reset_inputs();
    Ok(())
}

/// Daily button-activation buckets (day → profile → layer → button → count).
#[tauri::command]
pub(crate) fn get_usage(state: tauri::State<'_, AppState>) -> config::DayUsageMap {
    state.runtime.snapshot_usage()
}

/// Daily pie-direction buckets (day → pie id → slice key → count).
#[tauri::command]
pub(crate) fn get_pie_usage(state: tauri::State<'_, AppState>) -> config::DayPieUsageMap {
    state.runtime.snapshot_pie_usage()
}

/// Daily per-operation buckets (day → definition id → count).
#[tauri::command]
pub(crate) fn get_def_usage(state: tauri::State<'_, AppState>) -> config::DayDefUsageMap {
    state.runtime.snapshot_def_usage()
}

/// Clear all usage counts (buttons + pie + operations) and persist the empty state.
#[tauri::command]
pub(crate) fn reset_usage(state: tauri::State<'_, AppState>) {
    state.runtime.reset_usage();
    config::save_all_usage(&state.runtime);
}

/// Clear one button's usage counts (button + pie directions) and persist.
#[tauri::command]
pub(crate) fn reset_button_usage(
    state: tauri::State<'_, AppState>,
    profile: String,
    layer: String,
    button: String,
) {
    state.runtime.reset_button_usage(&profile, &layer, &button);
    config::save_all_usage(&state.runtime);
}

/// Export a full backup (workspace + usage stats) to a user-chosen path. The
/// caller passes the current workspace; the stats are attached from the runtime.
#[tauri::command]
pub(crate) fn export_backup(
    state: tauri::State<'_, AppState>,
    path: String,
    workspace: config::WorkspaceFile,
) -> Result<(), String> {
    let bundle = config::BackupBundle {
        kind: "joycon-backup".into(),
        version: config::WORKSPACE_VERSION,
        workspace,
        usage: state.runtime.snapshot_usage(),
        pie_usage: state.runtime.snapshot_pie_usage(),
        def_usage: state.runtime.snapshot_def_usage(),
    };
    config::save_backup(std::path::Path::new(&path), &bundle)
}

/// Read a backup from a user-chosen path *without applying anything* — so the
/// caller can review its contents (and warn about risky input macros) before the
/// user consents. Returns the workspace to preview plus whether the file also
/// carries usage stats. Applying happens later via [`apply_backup_stats`] (stats)
/// and the caller hydrating + saving the workspace.
#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ImportBackupInfo {
    workspace: config::WorkspaceFile,
    has_stats: bool,
}

#[tauri::command]
pub(crate) fn import_backup(path: String) -> Result<ImportBackupInfo, String> {
    let imported = config::import_backup_file(std::path::Path::new(&path))?;
    let has_stats = imported.usage.is_some()
        || imported.pie_usage.is_some()
        || imported.def_usage.is_some();
    Ok(ImportBackupInfo { workspace: imported.workspace, has_stats })
}

/// Apply + persist the usage stats bundled in the backup at `path` (called only
/// after the user has confirmed the import). Re-reads the file so nothing is
/// applied until consent. A plain workspace document (no stats) is a no-op.
#[tauri::command]
pub(crate) fn apply_backup_stats(
    state: tauri::State<'_, AppState>,
    path: String,
) -> Result<(), String> {
    let imported = config::import_backup_file(std::path::Path::new(&path))?;
    if imported.usage.is_some() || imported.pie_usage.is_some() || imported.def_usage.is_some() {
        let usage = imported.usage.unwrap_or_default();
        let pie = imported.pie_usage.unwrap_or_default();
        let def = imported.def_usage.unwrap_or_default();
        state.runtime.set_usage(usage, pie, def);
        config::save_all_usage(&state.runtime);
    }
    Ok(())
}

/// One rotating workspace backup, for the "restore from backup" list.
#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct BackupEntry {
    /// Bare filename in the backups folder (passed back to `restore_backup`).
    name: String,
    /// When the backup was taken (millis since the Unix epoch).
    timestamp_ms: u64,
}

/// List the rotating workspace backups (newest first) so the UI can offer to
/// restore one.
#[tauri::command]
pub(crate) fn list_backups() -> Vec<BackupEntry> {
    config::list_workspace_backups()
        .into_iter()
        .map(|(name, timestamp_ms)| BackupEntry { name, timestamp_ms })
        .collect()
}

/// Read a rotating workspace backup by name (read-only) and return its workspace
/// for the caller to review + hydrate. Nothing is applied here.
#[tauri::command]
pub(crate) fn restore_backup(name: String) -> Result<config::WorkspaceFile, String> {
    config::read_backup_workspace(&name)
}

/// Load the unified store (workspace.json), or a fresh one on first run.
#[tauri::command]
pub(crate) fn load_workspace() -> config::WorkspaceFile {
    config::load_workspace()
}

/// Show the real pie overlay as a live style preview, centred on the monitor
/// under the cursor, with `menu` (the same payload a real pie emits:
/// slices/center/appearance/threshold). Lets the pie-style modal show the pie at
/// its actual on-screen size while the user tweaks; `close_pie_overlay_preview`
/// hides it again. Click-through, so it never blocks the settings window.
#[tauri::command]
pub(crate) fn preview_pie_overlay(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
    menu: serde_json::Value,
    current: Option<i32>,
) {
    use tauri::{Emitter, Manager};
    let Some(win) = app.get_webview_window(PIE_OVERLAY_LABEL) else {
        return;
    };
    // Claim the overlay for previewing so the processor's reset (fired by the
    // autosave that follows each edit) doesn't hide it out from under us. If it
    // wasn't already claimed, this is the first call of an editing session, so
    // force a fresh show+position (a save-triggered hide may have raced ahead of
    // the flag, or the window may be stale off-screen from a prior session).
    let fresh = !state.runtime.overlay_preview();
    state.runtime.set_overlay_preview(true);
    // Monitor under the cursor (fall back to primary, then a default) — used only
    // to place the small preview window, NOT to cover it. A full-monitor
    // borderless topmost window is detected by Windows as a "fullscreen app" (it
    // turns on Focus Assist and can make the layered window vanish), so the
    // preview is a modest window sized to the pie instead.
    let (curx, cury) = mouse::cursor_pos();
    let rect_of = |m: &tauri::Monitor| {
        let p = m.position();
        let s = m.size();
        overlay::Rect { x: p.x, y: p.y, w: s.width as i32, h: s.height as i32 }
    };
    let rects: Vec<overlay::Rect> = win
        .available_monitors()
        .unwrap_or_default()
        .iter()
        .map(rect_of)
        .collect();
    let mon_rect = overlay::monitor_under(curx, cury, &rects)
        .map(|i| rects[i])
        .or_else(|| win.primary_monitor().ok().flatten().map(|m| rect_of(&m)))
        .unwrap_or(overlay::Rect { x: 0, y: 0, w: 1920, h: 1080 });

    let scale = win.scale_factor().unwrap_or(1.0);
    let size_css = menu
        .get("appearance")
        .and_then(|a| a.get("size"))
        .and_then(|v| v.as_i64())
        .unwrap_or(280) as f64;
    // The app window's x-range (when readable), so the preview lands in the gap
    // beside it rather than on top.
    let app_span = app.get_webview_window("main").and_then(|w| {
        match (w.outer_position(), w.outer_size()) {
            (Ok(p), Ok(s)) => Some((p.x, p.x + s.width as i32)),
            _ => None,
        }
    });
    let overlay::PreviewPlacement { win_phys, x, y, centre } =
        overlay::preview_placement(mon_rect, app_span, size_css, scale);

    // Position/resize on the first call of a session or when the size actually
    // changed — repositioning a visible layered window on every keystroke would
    // make it flash.
    let need_resize = win
        .inner_size()
        .map_or(true, |s| s.width != win_phys || s.height != win_phys);
    if fresh || need_resize {
        let _ = win.set_size(tauri::PhysicalSize::new(win_phys, win_phys));
        let _ = win.set_position(tauri::PhysicalPosition::new(x, y));
        // Windows can re-add a window shadow on resize — force it off again.
        let _ = win.set_shadow(false);
    }
    let _ = app.emit_to(PIE_OVERLAY_LABEL, "pie-center", centre);
    let _ = app.emit_to(PIE_OVERLAY_LABEL, "pie-open", &menu);
    // Highlight the direction being edited (matches the editor's selection):
    // -1 = centre, ≥0 = slice, -2 = none.
    let _ = app.emit_to(PIE_OVERLAY_LABEL, "pie-dir", current.unwrap_or(-2));
    if fresh {
        let _ = win.show();
    }
}

/// Hide the pie overlay after a style preview (see `preview_pie_overlay`).
#[tauri::command]
pub(crate) fn close_pie_overlay_preview(app: tauri::AppHandle, state: tauri::State<'_, AppState>) {
    use tauri::Manager;
    state.runtime.set_overlay_preview(false);
    if let Some(win) = app.get_webview_window(PIE_OVERLAY_LABEL) {
        let _ = win.hide();
    }
}

/// The builtin starter profiles (for the profiles reset action). Pure — the
/// caller swaps it into the workspace and persists via save_workspace.
#[tauri::command]
pub(crate) fn default_profiles() -> config::AppConfig {
    config::builtin_default()
}

/// Input-type definitions as an id → inputs map, for the runtime to resolve
/// `InputCommand::Def` references live.
pub(crate) fn input_definitions_map(
    defs: &config::DefinitionsFile,
) -> std::collections::HashMap<String, Vec<config::InputCommand>> {
    defs.definitions
        .iter()
        .filter_map(|d| match &d.press {
            config::PressConfig::Input(p) => Some((d.id.clone(), p.inputs.clone())),
            _ => None,
        })
        .collect()
}

/// Persist the whole workspace and swap the runtime's profiles in one step.
#[tauri::command]
pub(crate) async fn save_workspace(
    state: tauri::State<'_, AppState>,
    workspace: config::WorkspaceFile,
) -> Result<String, String> {
    // Async commands run in parallel; serialize the write + runtime swap so two
    // overlapping saves can't race the shared workspace.tmp or apply an older
    // snapshot after a newer one. (The frontend also serializes its saves; this
    // is the backend guarantee.)
    static SAVE_LOCK: std::sync::Mutex<()> = std::sync::Mutex::new(());
    let _guard = SAVE_LOCK.lock().unwrap_or_else(|p| p.into_inner());
    let path = config::workspace_path();
    config::save_workspace(&path, &workspace)?;
    // Apply live: settings drive the input thread (pie/scroll/idle), the
    // profiles are the processor's active map, and definitions resolve Def refs.
    state.runtime.apply(&workspace.settings);
    state
        .joycon
        .replace_definitions(input_definitions_map(&workspace.definitions));
    state.joycon.replace_config(workspace.profiles);
    Ok(path.display().to_string())
}
