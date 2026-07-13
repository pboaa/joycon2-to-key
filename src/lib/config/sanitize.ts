// Save-time normalization of the profiles map: drop drafts / duplicates, tidy
// per-variant cruft, and reconcile layer references. Shared by the workspace
// store (the single save path) so integrity is enforced in one place.
import type { AppConfig, ButtonAssignment, LayerConfig } from "../types";
import { reconcileLayerRefs } from "./layers";
import { isEmptyPress } from "./press";

/** Drop config cruft an assignment may carry: `repeatMs` only applies to tap-mode
 * input (the runtime ignores it otherwise), so strip it elsewhere. */
function tidyAssignment(a: ButtonAssignment): ButtonAssignment {
  if (a.press.type === "input" && (a.press.mode ?? "tap") !== "tap" && a.press.repeatMs != null) {
    const { repeatMs: _drop, ...rest } = a.press;
    return { ...a, press: rest };
  }
  return a;
}

/** Prepare the profiles for disk/runtime: drop unset ("none") drafts, tidy
 * per-assignment cruft, and reconcile every layer reference (layerHold targets)
 * against the layers that actually exist. */
export function sanitizeProfiles(config: AppConfig): AppConfig {
  const out: AppConfig = {};
  for (const [pName, p] of Object.entries(config)) {
    const layers: Record<string, LayerConfig> = {};
    for (const [lName, l] of Object.entries(p.layers)) {
      const buttons: Record<string, ButtonAssignment> = {};
      for (const [btn, a] of Object.entries(l.buttons)) {
        // Drop empty drafts so no keyless assignment is persisted: an unset
        // ("none") button, a key input with no keys, a pie whose every direction
        // (and centre) is empty, or a layer-hold with no target. A definition
        // link is kept even if its cached press looks bare — the link is content.
        if (!a.def && isEmptyPress(a.press)) continue;
        buttons[btn] = tidyAssignment(a);
      }
      layers[lName] = { ...l, buttons };
    }
    // Defense in depth: catch any dangling layer refs from import / migration /
    // manual edits, not just the delete/rename paths.
    out[pName] = reconcileLayerRefs(
      { ...p, layers },
      { valid: new Set(Object.keys(layers)) },
    );
  }
  return out;
}
