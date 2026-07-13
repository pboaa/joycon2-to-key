// Named pie-appearance presets, so a look tuned on one pie can be reused on
// others without re-setting every knob. Stored in localStorage (style data only
// — colours / numbers / enums, nothing executable), like recentDefs.
import type { PieAppearance } from "./types";

const KEY = "joycon.piePresets";

export interface PiePreset {
  name: string;
  appearance: PieAppearance;
}

export function getPiePresets(): PiePreset[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v)
      ? v.filter(
          (p): p is PiePreset =>
            !!p && typeof p.name === "string" && !!p.appearance,
        )
      : [];
  } catch {
    return [];
  }
}

function write(list: PiePreset[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // best-effort; presets are non-essential
  }
}

/** Save (or overwrite by name) a preset from the given appearance. */
export function savePiePreset(name: string, appearance: PieAppearance): void {
  const list = getPiePresets().filter((p) => p.name !== name);
  list.push({ name, appearance: structuredClone(appearance) });
  write(list);
}

export function deletePiePreset(name: string): void {
  write(getPiePresets().filter((p) => p.name !== name));
}
