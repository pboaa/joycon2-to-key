// Pie menus (mirrors src-tauri/src/config/schema/pie.rs).

import type { InputCommand } from "./press";

/** One direction of a pie: an angle (degrees, 0 = up, clockwise) and the
 * input fired when the mouse moves nearest that angle. */
export interface PieSlice {
  angle: number;
  inputs: InputCommand[];
}

/** A pie fires the slice nearest the mouse-move direction; a free list of
 * 2–8 slices at any angle, plus an optional `center` for no movement. */
export interface PiePress {
  type: "pie";
  label?: string;
  slices: PieSlice[];
  /** Fired when the move stays within the threshold (in place). */
  center?: InputCommand[];
  /** Linked pie-menu id in the library. Buttons store the resolved slices/center
   * above plus this link (front-end editing convenience). */
  pie?: string;
  /** Per-pie look (resolved from the linked pie menu); overrides the global
   * pie-overlay appearance. Absent = use the global look. */
  appearance?: PieAppearance;
  /** Per-pie threshold (px); absent = use the global threshold. */
  threshold?: number;
  /** Whether the on-screen pie overlay shows for this pie (per-pie override of
   * the global `pieOverlayEnabled`). Absent = use the global setting. */
  showOverlay?: boolean;
}

/** Per-pie appearance override; each field falls back to the global
 * `pieOverlay*` setting when absent. */
export interface PieAppearance {
  design?: string;
  bg?: string;
  opacity?: number;
  accent?: string;
  accentOpacity?: number;
  line?: string;
  labels?: boolean;
  labelsCurrentOnly?: boolean;
  dividers?: boolean;
  dots?: boolean;
  labelColor?: string;
  lineOpacity?: number;
  lineStyle?: string;
  thresholdShow?: boolean;
  thresholdColor?: string;
  size?: number;
  /** Whether releasing beyond the outer ring cancels (per-pie override). */
  cancelOutside?: boolean;
}

/** A saved pie menu in the library. Directions are per-pie; the look/threshold
 * override the global defaults. Buttons link to these by id. */
export interface PieMenu {
  id: string;
  name: string;
  slices: PieSlice[];
  center?: InputCommand[];
  appearance?: PieAppearance;
  threshold?: number;
  /** Whether the on-screen overlay shows (per-pie override of the global
   * `pieOverlayEnabled`). Absent = use the global setting. */
  showOverlay?: boolean;
}
