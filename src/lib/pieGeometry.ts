// Shared geometry for the pie menu (arbitrary-angle slices), used by
// both the in-use overlay and the settings editor. Angles are the data
// convention: degrees, 0 = up, clockwise. `toScreen` converts to the SVG
// convention (0 = right, clockwise, y down).

/** Pie geometry in a 280×280 viewBox (centre, inner/outer radius). */
export const PIE = { cx: 140, cy: 140, ri: 30, ro: 132, viewBox: "0 0 280 280" };

/** Room (viewBox units) for the centre (in-place) label — a touch under the inner
 * hole's diameter. Shared by the overlay and the editor pie. */
export const CENTER_WIDTH = PIE.ri * 2 * 0.9;

/** `#rrggbb` (+ optional leading `#`) → `rgba(r,g,b,alpha)`; returns the input
 * unchanged if it isn't a 6-digit hex. Used to fade the pie body/lines by the
 * opacity setting (SVG fill attributes can't take a CSS alpha var). */
export function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/** Data angle (0 = up) → screen angle (0 = right, y down). */
export const toScreen = (dataDeg: number) => dataDeg - 90;

const rad = (deg: number) => (deg * Math.PI) / 180;
const norm = (deg: number) => ((deg % 360) + 360) % 360;

export function pointAt(r: number, screenDeg: number): [number, number] {
  return [PIE.cx + r * Math.cos(rad(screenDeg)), PIE.cy + r * Math.sin(rad(screenDeg))];
}

/** Annular wedge path between two screen angles (`a0`→`a1`, clockwise). */
export function wedgePath(a0: number, a1: number): string {
  const large = norm(a1 - a0) > 180 ? 1 : 0;
  const [x0i, y0i] = pointAt(PIE.ri, a0);
  const [x0o, y0o] = pointAt(PIE.ro, a0);
  const [x1o, y1o] = pointAt(PIE.ro, a1);
  const [x1i, y1i] = pointAt(PIE.ri, a1);
  return [
    `M ${x0i} ${y0i}`,
    `L ${x0o} ${y0o}`,
    `A ${PIE.ro} ${PIE.ro} 0 ${large} 1 ${x1o} ${y1o}`,
    `L ${x1i} ${y1i}`,
    `A ${PIE.ri} ${PIE.ri} 0 ${large} 0 ${x0i} ${y0i}`,
    "Z",
  ].join(" ");
}

/** Solid sector path from the centre out to the outer radius (`a0`→`a1`,
 * clockwise) — the "pie" design's slice, with no inner hole. */
export function sectorPath(a0: number, a1: number): string {
  const large = norm(a1 - a0) > 180 ? 1 : 0;
  const [x0, y0] = pointAt(PIE.ro, a0);
  const [x1, y1] = pointAt(PIE.ro, a1);
  return `M ${PIE.cx} ${PIE.cy} L ${x0} ${y0} A ${PIE.ro} ${PIE.ro} 0 ${large} 1 ${x1} ${y1} Z`;
}

/** Point at the middle radius for a slice's arrow / handle. */
export function midPoint(screenDeg: number): [number, number] {
  return pointAt((PIE.ri + PIE.ro) / 2, screenDeg);
}

const MID_R = (PIE.ri + PIE.ro) / 2;
const FONT = "system-ui, -apple-system, 'Segoe UI', sans-serif";

// Off-screen canvas for accurate text measurement (handles CJK vs ASCII widths,
// which a per-char estimate can't). Measured in the SVG viewBox's own units:
// `measureText` at font size F returns a width in the same units as F, so the
// fit-vs-available comparison is scale-independent.
let _mctx: CanvasRenderingContext2D | null = null;
function textWidth(text: string, fontSize: number): number {
  if (typeof document === "undefined") return text.length * fontSize * 0.6;
  if (!_mctx) _mctx = document.createElement("canvas").getContext("2d");
  if (!_mctx) return text.length * fontSize * 0.6;
  _mctx.font = `${fontSize}px ${FONT}`;
  return _mctx.measureText(text).width;
}

/** Horizontal room (viewBox units) for a wedge's label: the chord at the middle
 * radius between its two screen-angle bounds, with a little padding. */
export function wedgeLabelWidth(a0: number, a1: number): number {
  const half = Math.min(norm(a1 - a0), 180) / 2;
  return 2 * MID_R * Math.sin(rad(half)) * 0.9;
}

/** Split a label into two balanced lines, breaking at the "+" nearest the middle
 * when there is one, else at the middle character. */
function splitTwo(text: string): [string, string] {
  const plus: number[] = [];
  for (let i = 0; i < text.length; i++) if (text[i] === "+") plus.push(i);
  if (plus.length) {
    const mid = text.length / 2;
    let best = plus[0];
    for (const i of plus) if (Math.abs(i - mid) < Math.abs(best - mid)) best = i;
    return [text.slice(0, best + 1), text.slice(best + 1)];
  }
  const m = Math.ceil(text.length / 2);
  return [text.slice(0, m), text.slice(m)];
}

/** Trim `text` (adding "…") until it fits `maxWidth` at `fontSize`. */
function truncateToWidth(text: string, maxWidth: number, fontSize: number): string {
  if (textWidth(text, fontSize) <= maxWidth) return text;
  let s = text;
  while (s.length > 1 && textWidth(s + "…", fontSize) > maxWidth) s = s.slice(0, -1);
  return s + "…";
}

export interface FittedLabel {
  lines: string[];
  fontSize: number;
}

/** How far a fitted label reaches below its anchor point (viewBox units), so a
 * caller stacking something under it (the Stats usage count) can clear the text.
 * Mirrors {@link PieLabel}'s own two-line tspan layout — a label that wraps
 * hangs half a line lower than a single-line one. */
export function labelDrop(text: string, maxWidth: number, base?: number, min?: number): number {
  const { lines, fontSize } = fitLabel(text, maxWidth, base, min);
  return (lines.length > 1 ? fontSize * 0.55 : 0) + fontSize * 0.5;
}

/** Fit `text` into `maxWidth`: shrink the font from `base` down to `min`, then
 * wrap to two lines, then truncate the (single) line with an ellipsis if it
 * still doesn't fit. */
export function fitLabel(text: string, maxWidth: number, base = 12, min = 8): FittedLabel {
  for (let fs = base; fs >= min; fs -= 0.5) {
    if (textWidth(text, fs) <= maxWidth) return { lines: [text], fontSize: fs };
  }
  const [a, b] = splitTwo(text);
  if (b && textWidth(a, min) <= maxWidth && textWidth(b, min) <= maxWidth) {
    return { lines: [a, b], fontSize: min };
  }
  return { lines: [truncateToWidth(text, maxWidth, min)], fontSize: min };
}

/** Screen-angle boundaries `{a0,a1}` for each slice (same index order as
 * `dataAngles`), so adjacent wedges meet at the midpoint between neighbours. A
 * single slice fills the whole ring. */
export function sliceBoundaries(dataAngles: number[]): { a0: number; a1: number }[] {
  const n = dataAngles.length;
  if (n === 0) return [];
  if (n === 1) {
    const c = toScreen(dataAngles[0]);
    return [{ a0: c - 180, a1: c + 180 }];
  }
  const order = dataAngles
    .map((a, i) => ({ a: norm(a), i }))
    .sort((x, y) => x.a - y.a);
  const gap = (a: number, b: number) => norm(b - a);
  const bounds = new Array<{ a0: number; a1: number }>(n);
  for (let k = 0; k < n; k++) {
    const cur = order[k];
    const prev = order[(k - 1 + n) % n];
    const next = order[(k + 1) % n];
    const lowData = cur.a - gap(prev.a, cur.a) / 2;
    const highData = cur.a + gap(cur.a, next.a) / 2;
    bounds[cur.i] = { a0: toScreen(lowData), a1: toScreen(highData) };
  }
  return bounds;
}
