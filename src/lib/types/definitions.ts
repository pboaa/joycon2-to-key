// The definition library (mirrors src-tauri/src/config/schema/definitions.rs).

import type { PressConfig } from "./press";

/** A named, reusable action shared across profiles (definitions.json). */
export interface Definition {
  id: string;
  name: string;
  /** Group id (see DefinitionGroup); absent = ungrouped. */
  group?: string;
  /** Optional icon name (a key in lib/opIcons); shown in the operation list. */
  icon?: string;
  /** Optional icon tint (hex, e.g. "#ef4444"). Absent = inherit the UI colour. */
  iconColor?: string;
  press: PressConfig;
}

/** A named group for organising definitions. */
export interface DefinitionGroup {
  id: string;
  name: string;
}

/** On-disk shape of definitions.json (a versioned envelope). */
export interface DefinitionsFile {
  version: number;
  groups: DefinitionGroup[];
  definitions: Definition[];
}
