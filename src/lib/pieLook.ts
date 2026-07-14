// The pie-overlay "look" is defined once here — its fields, the field→settings
// mapping, and the derive/merge helpers — so adding a new appearance field means
// editing one place instead of the ~8 hand-written field lists it used to take
// (which is how the preview once silently dropped new fields).

import type { GlobalSettings, PieAppearance } from "./types";
import { DEFAULT_GLOBAL_SETTINGS } from "./types";

/** The look fields shared by the global settings, per-pie overrides and the
 * renderer. */
export interface PieLookValues {
  design: string;
  size: number;
  bg: string;
  opacity: number;
  accent: string;
  accentOpacity: number;
  line: string;
  lineOpacity: number;
  lineStyle: string;
  labels: boolean;
  labelsCurrentOnly: boolean;
  dividers: boolean;
  dots: boolean;
  labelColor: string;
  thresholdShow: boolean;
  thresholdColor: string;
}

/** Each look field → its `pieOverlay*` global-settings key. The single source of
 * truth the helpers below iterate, so the mappings never drift apart. */
export const PIE_LOOK_GLOBAL_KEY: Record<keyof PieLookValues, keyof GlobalSettings> = {
  design: "pieOverlayDesign",
  size: "pieOverlaySize",
  bg: "pieOverlayBg",
  opacity: "pieOverlayOpacity",
  accent: "pieOverlayAccent",
  accentOpacity: "pieOverlayAccentOpacity",
  line: "pieOverlayLine",
  lineOpacity: "pieOverlayLineOpacity",
  lineStyle: "pieOverlayLineStyle",
  labels: "pieOverlayLabels",
  labelsCurrentOnly: "pieOverlayLabelsCurrentOnly",
  dividers: "pieOverlayDividers",
  dots: "pieOverlayDots",
  labelColor: "pieOverlayLabelColor",
  thresholdShow: "pieOverlayThresholdShow",
  thresholdColor: "pieOverlayThresholdColor",
};

const LOOK_KEYS = Object.keys(PIE_LOOK_GLOBAL_KEY) as (keyof PieLookValues)[];

/** Look fields that are colours (compared loosely on reset / preset match). */
export const PIE_COLOR_FIELDS = ["bg", "accent", "line", "labelColor", "thresholdColor"] as const;

/** Build the look from the global settings (each field via {@link PIE_LOOK_GLOBAL_KEY}). */
export function lookFromSettings(s: GlobalSettings): PieLookValues {
  const out = {} as PieLookValues;
  for (const k of LOOK_KEYS) {
    (out as unknown as Record<string, unknown>)[k] = s[PIE_LOOK_GLOBAL_KEY[k]];
  }
  return out;
}

/** Merge a per-pie appearance override over a base look (each present field wins). */
export function mergeLook(base: PieLookValues, a?: PieAppearance): PieLookValues {
  if (!a) return base;
  const out = { ...base };
  for (const k of LOOK_KEYS) {
    const v = (a as Record<string, unknown>)[k];
    if (v != null) (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

/** The built-in default look. */
export const DEFAULT_LOOK: PieLookValues = lookFromSettings(DEFAULT_GLOBAL_SETTINGS);

/** A full per-pie appearance snapshot of the current global look — used when a
 * pie switches on its own dedicated look. */
export function appearanceFromSettings(s: GlobalSettings): PieAppearance {
  return { ...lookFromSettings(s), cancelOutside: s.pieCancelOutside };
}

/** A preset's overrides (a curated look). `size` and the threshold are left to
 * the user, so a preset never changes those — otherwise picking a preset that
 * set a size would then "stick" that size across later preset switches (they
 * don't touch size). Size is adjusted separately (its own control). */
export type PresetLook = Omit<PieLookValues, "size" | "thresholdShow" | "thresholdColor">;

/** Curated, differentiated looks. Picking one applies it wholesale (the detail
 * controls are folded away, since most users just pick a preset). */
export const PIE_PRESETS: { id: string; label: string; look: PresetLook }[] = [
  {
    id: "chips",
    label: "チップ（Blender風）",
    look: { design: "chips", bg: "#101018", opacity: 42, accent: "#5a5ae0", accentOpacity: 100, line: "#ffffff", lineOpacity: 40, lineStyle: "solid", labels: true, labelsCurrentOnly: false, dividers: true, dots: true, labelColor: "#ffffff" },
  },
  {
    id: "indigo",
    label: "パイ（藍）",
    look: { design: "pie", bg: "#101018", opacity: 42, accent: "#5a5ae0", accentOpacity: 100, line: "#ffffff", lineOpacity: 40, lineStyle: "solid", labels: true, labelsCurrentOnly: false, dividers: true, dots: true, labelColor: "#ffffff" },
  },
  {
    id: "minimal",
    label: "ミニマル",
    look: { design: "minimal", bg: "#101018", opacity: 20, accent: "#8b8bf0", accentOpacity: 100, line: "#ffffff", lineOpacity: 55, lineStyle: "solid", labels: true, labelsCurrentOnly: false, dividers: false, dots: false, labelColor: "#ffffff" },
  },
  {
    id: "neon",
    label: "ネオン",
    look: { design: "pie", bg: "#0a0a12", opacity: 62, accent: "#00e5ff", accentOpacity: 100, line: "#00e5ff", lineOpacity: 55, lineStyle: "dotted", labels: true, labelsCurrentOnly: false, dividers: true, dots: false, labelColor: "#e6ffff" },
  },
  {
    id: "mono",
    label: "モノクロ",
    look: { design: "pie", bg: "#181820", opacity: 55, accent: "#c8c8d0", accentOpacity: 90, line: "#ffffff", lineOpacity: 35, lineStyle: "solid", labels: true, labelsCurrentOnly: false, dividers: true, dots: true, labelColor: "#ffffff" },
  },
  {
    id: "rays",
    label: "放射",
    look: { design: "rays", bg: "#101018", opacity: 0, accent: "#5a5ae0", accentOpacity: 100, line: "#ffffff", lineOpacity: 45, lineStyle: "solid", labels: true, labelsCurrentOnly: false, dividers: false, dots: false, labelColor: "#ffffff" },
  },
  {
    id: "fade",
    label: "フェード",
    look: { design: "fade", bg: "#101018", opacity: 0, accent: "#7a7aff", accentOpacity: 100, line: "#a0a0ff", lineOpacity: 65, lineStyle: "solid", labels: true, labelsCurrentOnly: false, dividers: false, dots: false, labelColor: "#ffffff" },
  },
  {
    id: "text",
    label: "文字だけ",
    look: { design: "active", bg: "#101018", opacity: 0, accent: "#5a5ae0", accentOpacity: 100, line: "#ffffff", lineOpacity: 0, lineStyle: "solid", labels: true, labelsCurrentOnly: false, dividers: false, dots: false, labelColor: "#5a5ae0" },
  },
  {
    id: "ring",
    label: "リング",
    look: { design: "ring", bg: "#101018", opacity: 40, accent: "#5a5ae0", accentOpacity: 100, line: "#ffffff", lineOpacity: 50, lineStyle: "solid", labels: true, labelsCurrentOnly: false, dividers: true, dots: true, labelColor: "#ffffff" },
  },
  {
    id: "soft",
    label: "ソフト",
    look: { design: "pie", bg: "#12131c", opacity: 34, accent: "#7a86c8", accentOpacity: 80, line: "#c8c8d4", lineOpacity: 24, lineStyle: "solid", labels: true, labelsCurrentOnly: true, dividers: true, dots: false, labelColor: "#e8e8f0" },
  },
  {
    id: "vivid",
    label: "ビビッド",
    look: { design: "pie", bg: "#101018", opacity: 50, accent: "#ff7a45", accentOpacity: 100, line: "#ffd24a", lineOpacity: 45, lineStyle: "dashed", labels: true, labelsCurrentOnly: false, dividers: true, dots: true, labelColor: "#fff6e0" },
  },
];
