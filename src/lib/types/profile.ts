// Profiles, layers, assignments + the top-level workspace envelope (mirrors
// src-tauri/src/config/schema/profile.rs and storage/workspace.rs `WorkspaceFile`).

import type { PressConfig } from "./press";
import type { DefinitionsFile } from "./definitions";
import type { PieMenu } from "./pie";
import type { GlobalSettings } from "./settings";

/** One button's assignment (one per button, per layer). */
export interface ButtonAssignment {
  /** Link to a named Definition (id). `press` is a synced copy of it. */
  def?: string;
  press: PressConfig;
}

/** How a non-base layer draws unset buttons from the base (initial) layer. */
export type InheritMode = "all" | "modifiers" | "none";

export interface LayerConfig {
  buttons: Record<string, ButtonAssignment>;
  /** How this layer inherits the base (initial) layer:
   *  - "all": inherit every unset button (legacy `true`)
   *  - "modifiers": inherit only hold-to-switch (LayerHold) buttons (default for new layers)
   *  - "none": fully independent (legacy `false`)
   *  Absent = "all" (a pre-tristate file). Legacy booleans are still accepted. */
  inherit?: InheritMode | boolean;
  /** Move the cursor with the LEFT stick while this layer is active (per-layer,
   * so a "mouse layer" can coexist with normal layers). Replaces the stick's
   * digital directions. The right stick has its own flag. */
  stickMouse?: boolean;
  /** LEFT stick cursor speed at full deflection (px per input tick). */
  stickMouseSpeed?: number;
  /** Same as stickMouse but for the RIGHT Joy-Con's stick (independent). */
  stickMouseR?: boolean;
  /** RIGHT stick cursor speed at full deflection (px per input tick). */
  stickMouseSpeedR?: number;
}

export interface ProfileConfig {
  /** Process names this profile reacts to (e.g. "chrome.exe"). Empty on the
   * fallback "デフォルト" profile; the map key is a free display name. */
  matchApps: string[];
  initialLayer: string;
  layers: Record<string, LayerConfig>;
  /** App icon (PNG data URL) shown on the profile tab. Derived from the first
   * matched app's icon (see appIcons); kept as a field for the rail/tab. */
  icon?: string;
  /** Per-app icons (exe → PNG data URL) captured when an app is added from the
   * running-apps list. The profile's `icon` is the first app's icon. */
  appIcons?: Record<string, string>;
}

export type AppConfig = Record<string, ProfileConfig>;

/** On-disk shape of workspace.json: the whole app state (settings + definition
 * library + profiles) in one versioned document. Mirrors Rust `WorkspaceFile`. */
export interface WorkspaceFile {
  version: number;
  settings: GlobalSettings;
  definitions: DefinitionsFile;
  /** Saved pie menus (the pie library). Buttons link to these by id. */
  pieMenus: PieMenu[];
  profiles: AppConfig;
}
