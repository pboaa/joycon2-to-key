// Press types + input commands (mirrors src-tauri/src/config/schema/press.rs).

import type { PiePress } from "./pie";

export type InputCommand =
  | { type: "keyboard"; value: string }
  /** Mouse click; `double` fires two rapid clicks. */
  | { type: "mouseButton"; value: "left" | "right" | "middle"; double?: boolean }
  | { type: "scroll"; value: "up" | "down"; amount?: number }
  /** Reference a saved definition (input type). Fires that definition's inputs,
   * resolved live — editing the definition updates every reference. */
  | { type: "def"; def: string };

export type InputMode = "tap" | "hold" | "toggle";

export interface InputPress {
  type: "input";
  mode?: InputMode;
  label?: string;
  repeatMs?: number;
  inputs: InputCommand[];
}

/** Hold to switch to `layer`; releasing restores the previously active layer. */
export interface LayerHoldPress {
  type: "layerHold";
  label?: string;
  layer: string;
  /** Optional keys/modifiers held while the layer is active (lets a momentary
   * layer double as a combination button). */
  inputs?: InputCommand[];
}

/** A newly-added assignment with no type chosen yet. UI-only: these are never
 * written to disk (dropped on save). */
export interface NonePress {
  type: "none";
  label?: string;
}

export type PressConfig =
  | NonePress
  | InputPress
  | PiePress
  | LayerHoldPress;

export type PressType = PressConfig["type"];
