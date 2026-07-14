mod apps;
mod buttons;
mod commands;
mod config;
mod foreground;
mod input_thread;
mod joycon;
mod keyboard;
mod keys;
mod mouse;
mod overlay;
mod processor;

use std::sync::{Arc, Mutex, OnceLock};

use commands::AppState;
use joycon::JoyConHandle;
use processor::InputProcessor;

/// The app handle, shared with the BLE loop and the input thread once Tauri has
/// started, so they can `emit` state-change events (connection / active layer)
/// to the front end instead of being polled. Empty until `setup` sets it; any
/// change before then is picked up by the front-end's low-frequency backstop
/// poll, so nothing is lost.
type SharedAppHandle = Arc<OnceLock<tauri::AppHandle>>;

/// Window label + logical size of the pie pie-menu overlay (the transparent,
/// click-through, non-activating window shown at the cursor while a pie
/// button is held). Shared so the input thread can position it on the cursor.
pub(crate) const PIE_OVERLAY_LABEL: &str = "pie-overlay";
pub(crate) const PIE_OVERLAY_SIZE: f64 = 280.0;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Boot from the unified store so the runtime reflects the authoritative source.
    let ws = config::load_workspace();
    let settings = ws.settings;
    let runtime = Arc::new(config::RuntimeSettings::from(&settings));
    let active_layer: processor::SharedActiveLayer =
        Arc::new(Mutex::new(processor::ActiveLayer::default()));
    // Shared with the BLE loop and input thread so they can emit events once
    // Tauri is up (set in `setup`).
    let app_handle: SharedAppHandle = Arc::new(OnceLock::new());
    let mut processor = InputProcessor::new(
        ws.profiles,
        active_layer.clone(),
        runtime.clone(),
        app_handle.clone(),
    );
    processor.set_definitions(commands::input_definitions_map(&ws.definitions));
    let input = input_thread::spawn(processor, runtime.clone());
    let joycon = Arc::new(JoyConHandle::new(input, runtime.clone(), app_handle.clone()));

    let joycon_for_setup = joycon.clone();
    use tauri::Manager; // Window::app_handle (exit the app when main closes)
    tauri::Builder::default()
        // Must be the first plugin registered (Tauri requirement). A second
        // launch never spins up its own window / BLE loop — it just raises the
        // window already running.
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.unminimize();
                let _ = w.show();
                let _ = w.set_focus();
            }
        }))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        // In-app updater + process (for relaunch after an install). The check /
        // download / install is driven from the front end; nothing auto-updates.
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .manage(AppState {
            joycon,
            active_layer,
            runtime,
        })
        .setup(move |app| {
            // Publish the app handle so the BLE loop / input thread can emit
            // state-change events. Set before the reconnect loop starts so the
            // first connection's events have somewhere to go.
            let _ = app_handle.set(app.handle().clone());
            // Create the (hidden) pie pie-menu overlay window.
            if let Err(e) = overlay::create_pie_overlay(app) {
                eprintln!("[overlay] pie overlay init failed: {e}");
            }
            // Defer onto the tauri async runtime so tokio::spawn inside
            // spawn_reconnect_loop has a reactor to run on.
            tauri::async_runtime::spawn(async move {
                joycon_for_setup.spawn_reconnect_loop();
            });
            Ok(())
        })
        // Closing the main window exits the whole app. The hidden pie-overlay
        // window would otherwise keep the process alive in the background (the app
        // only auto-exits when *every* window is closed), leaving a stray process.
        // The custom title bar's ✕ calls `destroy()`, which fires `Destroyed`
        // (not `CloseRequested`), so both are handled.
        .on_window_event(|window, event| {
            if window.label() != crate::PIE_OVERLAY_LABEL
                && matches!(
                    event,
                    tauri::WindowEvent::CloseRequested { .. } | tauri::WindowEvent::Destroyed
                )
            {
                // Release injected inputs SYNCHRONOUSLY before exiting. Routing
                // through the input thread (release_all_inputs) only queues a
                // message that races process death — and Alt+F4 / taskbar-close
                // never even go through the frontend's best-effort release. A
                // key left down here stays down system-wide after we're gone.
                keyboard::release_all();
                window.app_handle().exit(0);
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::connect_joycon,
            commands::disconnect_joycon,
            commands::get_connection_state,
            commands::get_joycon_state,
            commands::get_battery,
            commands::test_vibrate,
            commands::get_active_app_name,
            commands::list_running_apps,
            commands::get_active_layer,
            commands::get_config_path,
            commands::reset_definitions,
            commands::release_all_inputs,
            commands::get_usage,
            commands::get_pie_usage,
            commands::get_def_usage,
            commands::reset_usage,
            commands::reset_button_usage,
            commands::export_backup,
            commands::import_backup,
            commands::apply_backup_stats,
            commands::list_backups,
            commands::restore_backup,
            commands::load_workspace,
            commands::save_workspace,
            commands::default_profiles,
            commands::preview_pie_overlay,
            commands::close_pie_overlay_preview,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            // Last-chance cleanup on EVERY exit path (✕ button, Alt+F4, updater
            // relaunch, exit(0)): release injected inputs synchronously and
            // flush pending usage counts. Idempotent — the window-event arm may
            // have already released.
            if let tauri::RunEvent::Exit = event {
                keyboard::release_all();
                config::save_all_usage(&app.state::<AppState>().runtime);
            }
        });
}
