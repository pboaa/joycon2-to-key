// Pure press-config helpers shared by the button editor and the definitions
// editor: type metadata, defaults, and building a press for a chosen type.
import type {
  Definition,
  InputCommand,
  PieSlice,
  PressConfig,
  PressType,
} from "../types";

const norm = (deg: number) => ((deg % 360) + 360) % 360;

/** Reorder pie-slice inputs so directions that have keys come first and empty
 * ones move to the end (each group keeps its order). Used when shrinking a pie's
 * direction count, so reducing it drops the empty directions first and keeps the
 * ones that are actually set. */
export function fillFirst(inputs: InputCommand[][]): InputCommand[][] {
  return [
    ...inputs.filter((i) => i.length > 0),
    ...inputs.filter((i) => i.length === 0),
  ];
}

/** `n` evenly-spaced pie slices (empty inputs), starting at `rot` degrees. */
export function evenPieSlices(n: number, rot = 0): PieSlice[] {
  return Array.from({ length: n }, (_, k) => ({
    angle: norm(rot + (k * 360) / n),
    inputs: [],
  }));
}

export function defaultsForType(t: PressType): PressConfig {
  switch (t) {
    case "none":
      return { type: "none" };
    case "input":
      return { type: "input", mode: "tap", inputs: [] };
    case "pie":
      // Start with 4 directions (↑→↓←) ready to fill, rather than an empty pie.
      return { type: "pie", slices: evenPieSlices(4) };
    case "layerHold":
      return { type: "layerHold", layer: "" };
  }
}

/** Whether a press has no meaningful content (nothing to fire / configure) — a
 * blank operation. Used to skip the delete confirm when there's nothing to lose. */
export function isEmptyPress(press: PressConfig): boolean {
  switch (press.type) {
    case "none":
      return true;
    case "input":
      return (press.inputs?.length ?? 0) === 0;
    case "layerHold":
      return !press.layer && (press.inputs?.length ?? 0) === 0;
    case "pie":
      return (
        (press.slices ?? []).every((s) => (s.inputs?.length ?? 0) === 0) &&
        (press.center?.length ?? 0) === 0
      );
  }
}

/** Build a fresh press for a chosen type. Layer names seed the hold target. */
export function createPress(
  t: PressType,
  opts: { btnKey?: string; layerOptions: string[] },
): PressConfig {
  switch (t) {
    case "layerHold":
      return { type: "layerHold", layer: opts.layerOptions[0] ?? "" };
    default:
      return defaultsForType(t);
  }
}

/** Cached press for a variant linked to a definition. The label is the
 * definition name so the Joy-Con face shows it. */
export function linkedPress(d: Definition): PressConfig {
  return { ...structuredClone(d.press), label: d.name || undefined } as PressConfig;
}
