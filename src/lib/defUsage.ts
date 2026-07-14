// Reverse lookup: "where is this saved operation actually used?" A button links
// to a definition via `assignment.def` (set when you assign a saved operation to
// it), but a definition can ALSO be referenced by a `{type:"def"}` input command
// inside a pie slice, an input list, or another definition's press. Scanning all
// of those tells the user what would go dead if the operation were deleted —
// the companion to the per-operation use count.
import type { AppConfig, Definition, InputCommand, PressConfig } from "./types";
import { isDefRef } from "./defRef";

export interface DefUsage {
  profile: string;
  layer: string;
  /** The button key (e.g. "zr", "a"); resolve to a label with buttonLabel(). */
  button: string;
}

/** Every inputs list a press can fire (input / layerHold inputs, pie slices +
 * centre) — the places a `{type:"def"}` reference can hide. */
function pressInputLists(press: PressConfig): InputCommand[][] {
  switch (press.type) {
    case "input":
      return [press.inputs ?? []];
    case "layerHold":
      return press.inputs?.length ? [press.inputs] : [];
    case "pie":
      return [
        ...(press.slices ?? []).map((s) => s.inputs ?? []),
        ...(press.center?.length ? [press.center] : []),
      ];
    default:
      return [];
  }
}

function pressRefsDef(press: PressConfig, defId: string): boolean {
  return pressInputLists(press).some((inputs) =>
    inputs.some((c) => isDefRef(c) && c.def === defId),
  );
}

/** Every button that uses `defId` — via its assignment link OR a `{type:"def"}`
 * reference inside its press (pie slices included) — across all profiles and
 * layers, in profile → layer → button document order. One entry per button. */
export function findDefUsages(
  profiles: AppConfig | null,
  defId: string,
): DefUsage[] {
  if (!profiles) return [];
  const out: DefUsage[] = [];
  for (const [profile, p] of Object.entries(profiles)) {
    for (const [layer, l] of Object.entries(p.layers)) {
      for (const [button, a] of Object.entries(l.buttons)) {
        if (a.def === defId || pressRefsDef(a.press, defId)) {
          out.push({ profile, layer, button });
        }
      }
    }
  }
  return out;
}

/** Other definitions whose press references `defId` (a nested `{type:"def"}`
 * input). Deleting `defId` would leave those references silently dead. */
export function findDefRefsInDefinitions(
  definitions: Definition[],
  defId: string,
): Definition[] {
  return definitions.filter((d) => d.id !== defId && pressRefsDef(d.press, defId));
}
