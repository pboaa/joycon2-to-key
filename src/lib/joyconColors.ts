/** Selectable Joy-Con figure accent (side) colors. Any color can be assigned to
 * either side, so the left and right dropdowns share this one list. */
export interface AccentColor {
  label: string;
  hex: string;
}

export const ACCENT_PRESETS: AccentColor[] = [
  { label: "ライトブルー", hex: "#66ccf2" },
  { label: "ライトレッド", hex: "#fe9985" },
  { label: "ライトパープル", hex: "#bf93cb" },
  { label: "ライトグリーン", hex: "#73decf" },
  { label: "ブルー", hex: "#6193d8" },
  { label: "ライトイエロー", hex: "#ede466" },
  { label: "ディープブルー", hex: "#2ea7db" },
  { label: "ディープレッド", hex: "#f0604a" },
];

/** Presets for the "assigned/mapped" button highlight color (amber by default,
 * plus the accent palette so it can contrast the device color). */
export const MAP_PRESETS: AccentColor[] = [
  { label: "アンバー", hex: "#d68c45" },
  { label: "ディープアンバー", hex: "#b26a2b" },
  { label: "ゴールド", hex: "#e0a84e" },
  ...ACCENT_PRESETS,
];

function mixHex(hex: string, mix: (c: number) => number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  if (Number.isNaN(n)) return hex;
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/** Lighten a hex color toward white by `amt` (0–1). Used to derive the softer
 * label tint from a chosen highlight color. */
export function lighten(hex: string, amt: number): string {
  return mixHex(hex, (c) => Math.round(c + (255 - c) * amt));
}

/** Darken a hex color toward black by `amt` (0–1). */
export function darken(hex: string, amt: number): string {
  return mixHex(hex, (c) => Math.round(c * (1 - amt)));
}

/** Perceived luminance (0–1) of a hex color. */
function luminance(hex: string): number {
  const n = parseInt(hex.replace("#", ""), 16);
  if (Number.isNaN(n)) return 0;
  return (
    (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) /
    255
  );
}

/** Tone a chosen highlight color down for use as the "assigned" button fill:
 * bright picks (e.g. the light Joy-Con accent colors) are darkened so they read
 * as a calm highlight rather than glare, while already-deep colors (the amber
 * default) are left as-is. */
export function deepenMapColor(hex: string): string {
  const amt = Math.min(Math.max((luminance(hex) - 0.5) * 0.7, 0), 0.35);
  return amt > 0 ? darken(hex, amt) : hex;
}

/** Case-insensitive hex equality (#RRGGBB). */
export function sameColor(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** Near-black or white, whichever reads better as a glyph/label drawn on a
 * filled `hex` button (e.g. a per-operation coloured button on the figure). */
export function readableOn(hex: string): string {
  return luminance(hex) > 0.55 ? "#1a1205" : "#ffffff";
}
