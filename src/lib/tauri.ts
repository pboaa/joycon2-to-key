import { invoke } from "@tauri-apps/api/core";
import type {
  ActiveLayer,
  AppConfig,
  BatteryInfo,
  ConnectionState,
  DefinitionsFile,
  InputCommand,
  JoyConState,
  PieAppearance,
  RunningApp,
  WorkspaceFile,
} from "./types";

export const CMD = {
  connect: "connect_joycon",
  disconnect: "disconnect_joycon",
  getConnectionState: "get_connection_state",
  getJoyConState: "get_joycon_state",
  getBattery: "get_battery",
  testVibrate: "test_vibrate",
  getActiveAppName: "get_active_app_name",
  getActiveLayer: "get_active_layer",
  listRunningApps: "list_running_apps",
  getConfigPath: "get_config_path",
  resetDefinitions: "reset_definitions",
  loadWorkspace: "load_workspace",
  saveWorkspace: "save_workspace",
  defaultProfiles: "default_profiles",
  releaseAllInputs: "release_all_inputs",
  getUsage: "get_usage",
  getPieUsage: "get_pie_usage",
  getDefUsage: "get_def_usage",
  resetUsage: "reset_usage",
  resetButtonUsage: "reset_button_usage",
  exportBackup: "export_backup",
  importBackup: "import_backup",
  applyBackupStats: "apply_backup_stats",
  listBackups: "list_backups",
  restoreBackup: "restore_backup",
  previewPieOverlay: "preview_pie_overlay",
  closePieOverlayPreview: "close_pie_overlay_preview",
} as const;

/** Button-activation counts for one day: profile → layer → button → count. */
export type UsageMap = Record<string, Record<string, Record<string, number>>>;
/** Pie-direction counts for one day: profile → layer → button → slice key
 * ("0".."n"|"center") → count. */
export type PieUsageMap = Record<
  string,
  Record<string, Record<string, Record<string, number>>>
>;
/** Per-operation counts for one day: definition id → count. */
export type DefUsageMap = Record<string, number>;
/** Daily buckets keyed by UTC day number (unix_secs/86400) as a string. */
export type DayUsageMap = Record<string, UsageMap>;
export type DayPieUsageMap = Record<string, PieUsageMap>;
export type DayDefUsageMap = Record<string, DefUsageMap>;

export const connectJoyCon = () => invoke<void>(CMD.connect);
export const disconnectJoyCon = () => invoke<void>(CMD.disconnect);
export const getConnectionState = () =>
  invoke<ConnectionState>(CMD.getConnectionState);
export const getJoyConState = () =>
  invoke<JoyConState | null>(CMD.getJoyConState);
export const getBattery = () => invoke<BatteryInfo | null>(CMD.getBattery);
/** Buzz the controller now with a built-in pattern (id 1–7). */
export const testVibrate = (opts?: { sample?: number }) =>
  invoke<void>(CMD.testVibrate, { sample: opts?.sample });
export const getActiveAppName = () => invoke<string>(CMD.getActiveAppName);
export const getActiveLayer = () => invoke<ActiveLayer>(CMD.getActiveLayer);
export const listRunningApps = () =>
  invoke<RunningApp[]>(CMD.listRunningApps);
export const getConfigPath = () => invoke<string>(CMD.getConfigPath);
export const resetDefinitions = () =>
  invoke<DefinitionsFile>(CMD.resetDefinitions);
export const loadWorkspace = () => invoke<WorkspaceFile>(CMD.loadWorkspace);
export const saveWorkspace = (workspace: WorkspaceFile) =>
  invoke<string>(CMD.saveWorkspace, { workspace });
export const defaultProfiles = () => invoke<AppConfig>(CMD.defaultProfiles);
export const releaseAllInputs = () => invoke<void>(CMD.releaseAllInputs);
/** Usage counts for the heatmap (profile → layer → button → count). */
export const getUsage = () => invoke<DayUsageMap>(CMD.getUsage);
export const getPieUsage = () => invoke<DayPieUsageMap>(CMD.getPieUsage);
/** Per-operation usage counts (definition id → count), by day. */
export const getDefUsage = () => invoke<DayDefUsageMap>(CMD.getDefUsage);
export const resetUsage = () => invoke<void>(CMD.resetUsage);
/** Clear one button's usage counts (button + pie directions) across all days. */
export const resetButtonUsage = (profile: string, layer: string, button: string) =>
  invoke<void>(CMD.resetButtonUsage, { profile, layer, button });
/** Export the whole workspace to a user-chosen path (atomic write in Rust). */
/** Export a full backup (workspace + usage stats) to a path. The backend
 * attaches the current stats; the caller passes the workspace. */
export const exportBackup = (path: string, workspace: WorkspaceFile) =>
  invoke<void>(CMD.exportBackup, { path, workspace });

/** Read-only preview of a backup file: its workspace (to review before applying)
 * and whether it also carries usage stats. Nothing is applied yet. */
export interface ImportBackupInfo {
  workspace: WorkspaceFile;
  hasStats: boolean;
}
export const importBackup = (path: string) =>
  invoke<ImportBackupInfo>(CMD.importBackup, { path });
/** Apply + persist the stats bundled in the backup (after the user confirms). */
export const applyBackupStats = (path: string) =>
  invoke<void>(CMD.applyBackupStats, { path });

/** One rotating workspace backup (from the auto-backups folder). */
export interface BackupEntry {
  name: string;
  /** Millis since the Unix epoch. */
  timestampMs: number;
}
/** List the rotating workspace backups, newest first. */
export const listBackups = () => invoke<BackupEntry[]>(CMD.listBackups);
/** Read a rotating backup by name (read-only) — the caller reviews + hydrates. */
export const restoreBackup = (name: string) =>
  invoke<WorkspaceFile>(CMD.restoreBackup, { name });

/** A pie menu as the overlay expects it (same shape a real pie emits). */
export interface PiePreviewMenu {
  slices: { angle: number; inputs: InputCommand[] }[];
  center: InputCommand[];
  appearance?: PieAppearance;
  threshold?: number;
  /** Marks this as the static settings preview (affects the active design). */
  preview?: boolean;
}
// The hide is debounced so a show arriving right after (e.g. React StrictMode's
// dev-mode mount → unmount → mount, which fires close between two opens) cancels
// it — otherwise the overlay would flash on then immediately hide. Module-level
// so it survives component remounts. 60ms is imperceptible on a real close.
let previewHideTimer: ReturnType<typeof setTimeout> | null = null;
const cancelPreviewHide = () => {
  if (previewHideTimer != null) {
    clearTimeout(previewHideTimer);
    previewHideTimer = null;
  }
};

/** Show the real pie overlay at actual size as a live preview while a pie
 * is being edited, placed clear of the app window. Click-through, so the app
 * stays usable. `current` highlights the direction being edited (-1 = centre,
 * ≥0 = slice). Hide again with `closePieOverlayPreview`. */
export const previewPieOverlay = (
  menu: PiePreviewMenu,
  current?: number,
) => {
  cancelPreviewHide();
  return invoke<void>(CMD.previewPieOverlay, { menu, current });
};
export const closePieOverlayPreview = () =>
  new Promise<void>((resolve) => {
    cancelPreviewHide();
    previewHideTimer = setTimeout(() => {
      previewHideTimer = null;
      invoke<void>(CMD.closePieOverlayPreview)
        .then(() => resolve())
        .catch(() => resolve());
    }, 60);
  });
