import type { PieSlice } from "../lib/types";
import type { PieLookValues } from "../lib/pieLook";
import { derivePieStyle, type PieVisualProps } from "./pie/pieStyle";
import { PieActiveView } from "./pie/PieActiveView";
import { PieChipsView } from "./pie/PieChipsView";
import { PieWedgeView } from "./pie/PieWedgeView";

/** Pie shape variants (purely visual). */
export type PieDesign = "ring" | "pie" | "minimal" | "fade" | "rays" | "active" | "chips";

/** Design options for the settings selector (label/desc go through i18n).
 * "ring" stays in {@link PieDesign} / the renderer for older saved pies, but is
 * no longer offered here (pie is the standard now). */
export const PIE_DESIGNS: {
  value: PieDesign;
  label: string;
  desc: string;
}[] = [
  { value: "chips", label: "チップ", desc: "方向ごとに枠付きラベル（Blender風）" },
  { value: "pie", label: "パイ", desc: "中心まで塗る円グラフ型" },
  { value: "minimal", label: "ミニマル", desc: "輪と区切り線だけの控えめ表示" },
  { value: "fade", label: "フェード", desc: "外に向かって薄くなる放射線" },
  { value: "rays", label: "放射", desc: "中心から伸びる放射線のみ" },
  { value: "active", label: "アクティブ", desc: "今指している方向のラベルだけ" },
];

/** The renderer's style is the shared look (it ignores `size` — the container
 * scales the SVG). Kept as an alias so callers can keep the familiar name. */
export type PieOverlayStyle = PieLookValues;

export type { PieSlice };

/** Pie threshold (cursor px) → dead-zone radius in the 280 viewBox. The pie
 * fills a `sizePx` logical-px window, and the threshold is compared in physical
 * cursor px, so divide by the device pixel ratio. Clamped so it stays visible
 * and never swallows the whole pie. */
export function deadzoneRadius(thresholdPx: number, sizePx: number): number {
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  return Math.max(6, Math.min(120, (thresholdPx * 280) / (sizePx * dpr)));
}

/** Presentational pie, styled by {@link PieOverlayStyle}. Shared by
 * the in-use overlay (live data) and the settings appearance preview (sample
 * data), so the preview matches exactly what shows on screen. `current` is the
 * pointed slice: -2 none, -1 centre, ≥0 slice index.
 *
 * Dispatches on the design to one of three mutually-exclusive views, all sharing
 * the same colour/geometry derivation ({@link derivePieStyle}). */
export function PieVisual(props: PieVisualProps) {
  const derived = derivePieStyle(props.style);
  if (derived.isActive) return <PieActiveView {...props} derived={derived} />;
  if (derived.isChips) return <PieChipsView {...props} derived={derived} />;
  return <PieWedgeView {...props} derived={derived} />;
}
