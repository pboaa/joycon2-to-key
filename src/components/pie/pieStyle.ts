// Shared style derivation for the pie renderer. `PieVisual` splits into three
// mutually-exclusive views (active / chips / wedge) that all need the same
// colour + geometry primitives derived from the look; this centralises that
// derivation so the views can't drift. Pure (no hooks) — safe to call anywhere.

import { PIE, hexToRgba } from "../../lib/pieGeometry";
import type { PieLookValues } from "../../lib/pieLook";
import type { InputCommand, PieSlice } from "../../lib/types";

/** Angular gap (deg) carved between adjacent slices for a segmented look. */
export const GAP = 3;

/** Highlight colour for the "cancel" state (released beyond the outer ring). */
export const CANCEL = "#ff8a8a";

/** Colour + geometry primitives derived purely from a {@link PieLookValues}. */
export interface DerivedPieStyle {
  design: string;
  /** Background/structure opacity factor (0 = fully see-through). */
  k: number;
  /** Line (dividers / ring / spokes) opacity factor. */
  lineK: number;
  /** Line colour at `lineK`, and its fainter (×0.7) variant. */
  HAIR: string;
  HAIR_DIM: string;
  /** Dash pattern for every line (undefined = solid). */
  dash: string | undefined;
  isMinimal: boolean;
  isFade: boolean;
  isRays: boolean;
  isPie: boolean;
  isActive: boolean;
  isChips: boolean;
  /** Spoke-only designs (rays/fade): no circle / background. */
  isLines: boolean;
  showWedges: boolean;
  /** Centre-disc radius (also the inner end of the dividers). */
  hub: number;
  /** Inner radius where radial spokes start. */
  spokeInner: number;
  bgFill: string;
  centreFill: string;
  /** Highlight opacity factor. */
  accentK: number;
  /** Highlight (accent) colour at alpha `a`, scaled by `accentK`. */
  hot: (a: number) => string;
  assignedFill: string;
  emptyFill: string;
}

export function derivePieStyle(style: PieLookValues): DerivedPieStyle {
  const design = style.design;
  // Background/structure opacity factor (0 = fully see-through). Applied to the
  // disc, wedge fills, ring, dividers and hair-lines so "background opacity: 0" really
  // clears the pie body — only labels and the active-direction highlight remain.
  const k = style.opacity / 100;
  // Line (dividers / ring / spokes) opacity — its own control, independent of the
  // background opacity. HAIR_DIM is the fainter variant (minimal spokes).
  const lineK = style.lineOpacity / 100;
  const HAIR = hexToRgba(style.line, lineK);
  const HAIR_DIM = hexToRgba(style.line, lineK * 0.7);
  // Line style for every line (dividers / ring / spokes / active border). The
  // SVG uses round line-caps, so a zero-length dash renders as a round dot.
  const dash =
    style.lineStyle === "dashed" ? "5 3" : style.lineStyle === "dotted" ? "0.1 3.5" : undefined;

  const isMinimal = design === "minimal";
  const isFade = design === "fade";
  const isRays = design === "rays";
  const isPie = design === "pie";
  const isActive = design === "active";
  const isChips = design === "chips"; // Blender-style framed label per direction
  const isLines = isRays || isFade; // spoke-only, no circle / background
  const showWedges = design === "ring" || isPie;
  // Centre-disc radius (also the inner end of the segment dividers): the ring is
  // a proper donut (PIE.ri hole); the pie fills nearer the centre with a small
  // hub that hides the point where the dividers would otherwise converge.
  const hub = isPie ? 14 : PIE.ri;
  // Radial spokes sit on the slice boundaries; start a touch out from the centre
  // so the centre label stays clear.
  const spokeInner = isLines ? 24 : PIE.ri;

  const bgFill = hexToRgba(style.bg, k);
  // The centre hub is normally a touch more opaque than the ring so the dead
  // zone reads — but at opacity 0 it must vanish too (fully transparent).
  const centreFill = hexToRgba(
    style.bg,
    style.opacity === 0 ? 0 : Math.min(k + 0.14, 1),
  );
  // Highlight (current direction) colour at alpha `a`, scaled by the highlight
  // opacity setting so the whole highlight can be made more/less prominent.
  const accentK = style.accentOpacity / 100;
  const hot = (a: number) => hexToRgba(style.accent, a * accentK);
  const assignedFill = hexToRgba(style.accent, 0.22 * k);
  const emptyFill = `rgba(255,255,255,${0.09 * k})`;

  return {
    design,
    k,
    lineK,
    HAIR,
    HAIR_DIM,
    dash,
    isMinimal,
    isFade,
    isRays,
    isPie,
    isActive,
    isChips,
    isLines,
    showWedges,
    hub,
    spokeInner,
    bgFill,
    centreFill,
    accentK,
    hot,
    assignedFill,
    emptyFill,
  };
}

/** The `PieVisual` public props, shared by the split views. */
export interface PieVisualProps {
  slices: PieSlice[];
  center: InputCommand[];
  current: number;
  style: PieLookValues;
  /** Dead-zone radius (viewBox units) shown as a dashed circle; the in-place
   * threshold. Omit to hide. */
  deadzone?: number;
  /** Current cursor position in viewBox units (from the pie start). Used by
   * the "active" design to place the label at the mouse. */
  cursor?: [number, number];
  /** Usage heatmap: activation count per slice (+ centre). When set, wedges/
   * centre are tinted by usage instead of the assigned/highlight colours. */
  heat?: { slices: number[]; center: number };
  resolveDefName?: (id: string) => string | undefined;
  /** Icon name for a direction that references a saved operation (id → icon). */
  resolveDefIcon?: (id: string) => string | undefined;
  /** Icon tint (hex) for a direction that references a saved operation. Applied
   * to non-current slices; the current (pointed) slice keeps its highlight. */
  resolveDefColor?: (id: string) => string | undefined;
}

/** A split view's props: the public props plus the shared style derivation. */
export interface PieViewProps extends PieVisualProps {
  derived: DerivedPieStyle;
}
