// App-wide settings (mirrors src-tauri/src/config/schema/settings.rs
// `GlobalSettings`). Frontend-only fields (theme/language/uiScale) still need a
// Rust field so they round-trip through save/load — the backend just persists
// them verbatim.

import { BATTERY_FULL_MV, BATTERY_EMPTY_MV } from "./joycon";

/** UI color theme. "system" follows the OS preference; named themes are defined
 * in `themes.ts` (registry) + index.css (palette). */
export type ThemeMode = "system" | "light" | "dark" | "matcha" | "hatsuyuki";

/** UI language. "system" follows the OS/browser; else a fixed locale. */
export type Language = "system" | "ja" | "en";

export interface GlobalSettings {
  /** UI language (frontend-only; persisted for the next launch). */
  language: Language;
  /** Whether the BLE link is auto-disconnected after being idle. */
  idleEnabled: boolean;
  /** Seconds of no activity before the auto-disconnect fires. */
  idleTimeoutSecs: number;
  /** Stick displacement needed to register a pie direction. */
  pieThreshold: number;
  /** Wheel magnitude per scroll input (when a command omits its own amount). */
  scrollAmount: number;
  /** UI color theme (frontend-only; persisted for the next launch). */
  theme: ThemeMode;
  /** UI text scale multiplier (1 = 100%). Scales the typography tokens only
   * (column widths / spacing stay fixed), so it can't break the fixed layout. */
  uiScale: number;
  /** Sound cue id played when the controller connects ("none" = silent). */
  connectSound: string;
  /** Sound cue id played on auto-disconnect (idle) or a dropped link. */
  disconnectSound: string;
  /** Built-in vibration sample (1–7) buzzed on connect; 0 = off. Fired by the
   * backend right after the link's init handshake (persisted like the rest). */
  connectVibration: number;
  /** Built-in vibration sample (1–7) buzzed a few seconds before an idle
   * auto-disconnect, as a heads-up; 0 = off. Fired by the backend while the
   * controller is still connected (the frontend can't time it). */
  disconnectVibration: number;
  /** Player-indicator LED byte: low nibble = lamps 1–4 solid, high nibble =
   * lamps 1–4 flashing (see lib/playerLeds). Sent to the controller. */
  playerLeds: number;
  /** Stick centre deadzone as a percent (0–50). */
  stickDeadzone: number;
  /** Voltage (mV) treated as ~100% for the rough battery estimate. */
  batteryFullMv: number;
  /** Voltage (mV) treated as ~0% for the rough battery estimate. */
  batteryEmptyMv: number;
  /** Default repeat interval (ms) applied when rapid-fire is first enabled. */
  defaultRepeatMs: number;
  /** Joy-Con figure accent (side) color — left / right, as hex. */
  accentL: string;
  accentR: string;
  /** Highlight color (hex) for buttons that have an assignment (the amber). */
  mapColor: string;
  /** Show the pie-menu overlay while a pie is held (pies fire
   * either way; this only toggles the on-screen pie). */
  pieOverlayEnabled: boolean;
  /** Pie overlay diameter in logical px. */
  pieOverlaySize: number;
  /** Pie overlay background disc color (hex). */
  pieOverlayBg: string;
  /** Pie overlay background opacity as a percent (0–100). */
  pieOverlayOpacity: number;
  /** Pie overlay highlight (current direction) color (hex). */
  pieOverlayAccent: string;
  /** Pie overlay highlight opacity as a percent (0–100). */
  pieOverlayAccentOpacity: number;
  /** Pie overlay line color (dividers / ring / spokes), hex. */
  pieOverlayLine: string;
  /** Draw action labels on the pie overlay. */
  pieOverlayLabels: boolean;
  /** Only label the direction currently pointed at (others stay dots). */
  pieOverlayLabelsCurrentOnly: boolean;
  /** Pie overlay shape variant ("ring" | "pie" | "minimal"). */
  pieOverlayDesign: string;
  /** Draw thin dividers between wedge segments (ring/pie). */
  pieOverlayDividers: boolean;
  /** Draw the small dots for empty / non-current directions (off = hide them). */
  pieOverlayDots: boolean;
  /** Pie overlay label (text) color (hex). */
  pieOverlayLabelColor: string;
  /** Pie overlay line opacity as a percent (0–100), independent of the bg. */
  pieOverlayLineOpacity: number;
  /** Line style for every pie line: "solid" | "dashed" | "dotted". */
  pieOverlayLineStyle: string;
  /** Draw the threshold (in-place) dead-zone circle. */
  pieOverlayThresholdShow: boolean;
  /** Colour (hex) of the threshold dead-zone circle. */
  pieOverlayThresholdColor: string;
  /** Releasing beyond the outer ring cancels the pie (fires nothing). */
  pieCancelOutside: boolean;
  /** Keep only the most recent N days of usage stats; 0 = unlimited (default).
   * The backend auto-deletes older daily buckets when settings are applied. */
  usageRetentionDays: number;
  /** Show the battery readout in the title bar (experimental; off by default). */
  titlebarBattery: boolean;
}

export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  language: "system",
  idleEnabled: true,
  idleTimeoutSecs: 600,
  pieThreshold: 20,
  scrollAmount: 120,
  theme: "system",
  uiScale: 1,
  connectSound: "none",
  disconnectSound: "none",
  connectVibration: 1,
  disconnectVibration: 0,
  playerLeds: 0x01,
  stickDeadzone: 30,
  batteryFullMv: BATTERY_FULL_MV,
  batteryEmptyMv: BATTERY_EMPTY_MV,
  defaultRepeatMs: 50,
  accentL: "#66ccf2",
  accentR: "#fe9985",
  mapColor: "#d68c45",
  pieOverlayEnabled: true,
  pieOverlaySize: 280,
  pieOverlayBg: "#101018",
  pieOverlayOpacity: 42,
  pieOverlayAccent: "#5a5ae0",
  pieOverlayAccentOpacity: 100,
  pieOverlayLine: "#ffffff",
  pieOverlayLabels: true,
  pieOverlayLabelsCurrentOnly: false,
  pieOverlayDesign: "pie",
  pieOverlayDividers: true,
  pieOverlayDots: true,
  pieOverlayLabelColor: "#ffffff",
  pieOverlayLineOpacity: 40,
  pieOverlayLineStyle: "solid",
  pieOverlayThresholdShow: false,
  pieOverlayThresholdColor: "#5a5ae0",
  pieCancelOutside: true,
  usageRetentionDays: 0,
  titlebarBattery: false,
};
