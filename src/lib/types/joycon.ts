// Hardware snapshot + runtime state from the Rust side (mirrors src-tauri/src/
// joycon/ `JoyConSnapshot`, `processor::ActiveLayer`, and `apps::RunningApp`).

export interface JoyConButtons {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  l: boolean;
  zl: boolean;
  sl: boolean;
  sr: boolean;
  minus: boolean;
  capture: boolean;
  stickPress: boolean;
  stickUp: boolean;
  stickDown: boolean;
  stickLeft: boolean;
  stickRight: boolean;
  // Right Joy-Con only (always false when a left one is connected).
  a: boolean;
  b: boolean;
  x: boolean;
  y: boolean;
  r: boolean;
  zr: boolean;
  plus: boolean;
  home: boolean;
  chat: boolean;
  // The right Joy-Con's SL/SR, stick-press and stick directions (separate from the left's).
  slR: boolean;
  srR: boolean;
  stickPressR: boolean;
  stickUpR: boolean;
  stickDownR: boolean;
  stickLeftR: boolean;
  stickRightR: boolean;
}

/** Which side (left/right) the connected Joy-Con is. */
export type JoyConSide = "l" | "r";

export interface JoyConStick {
  x: number;
  y: number;
}

export interface JoyConState {
  packetId: number;
  buttons: JoyConButtons;
  stick: JoyConStick;
  side: JoyConSide;
}

export type ConnectionState = "disconnected" | "connected" | "reconnecting";

/** Battery + telemetry from input report 0x05. Current/temperature come from the
 * extended frame (0x28 / 0x2E) and may be absent on short frames. */
export interface BatteryInfo {
  /** Voltage in mV (e.g. 3695 = 3.70V). */
  millivolts: number;
  charging: boolean;
  /** Current draw in mA (@0x28); negative = discharging. */
  currentMa?: number | null;
  /** Controller temperature in °C (@0x2E). */
  temperatureC?: number | null;
}

/** Default voltage endpoints for the rough charge estimate. The upper end
 * matches the ~3.75V a typical charger tops out at for this controller; the
 * lower end is a guess (true lower bound unknown). These are only defaults now — the user
 * can calibrate per-controller endpoints in settings to sharpen the estimate. */
export const BATTERY_FULL_MV = 3750;
export const BATTERY_EMPTY_MV = 3400;

/** Very rough state-of-charge (%), for display as an approximate reference only.
 * `full`/`empty` are the calibrated mV endpoints (100% / 0%). */
export function batteryPercent(
  mv: number,
  full: number = BATTERY_FULL_MV,
  empty: number = BATTERY_EMPTY_MV,
): number {
  // Guard against an inverted/zero range from bad calibration input.
  const span = full - empty;
  if (span <= 0) return 0;
  const pct = ((mv - empty) / span) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

/** The runtime's active profile + layer (from Rust `get_active_layer`). */
export interface ActiveLayer {
  profile: string;
  layer: string;
}

/** A currently-running application (from the Rust `list_running_apps`). */
export interface RunningApp {
  /** Executable name, e.g. "chrome.exe" — used as the profile name. */
  process: string;
  /** Window title, for display. */
  title: string;
  /** Icon as a PNG data URL, if available. */
  icon?: string | null;
}
