// Pure helper for keeping button assignments linked to a definition in sync.
// A linked assignment caches the definition's `press` (the runtime uses that
// copy), so when a definition changes every assignment linked to it is updated.
import type {
  AppConfig,
  ButtonAssignment,
  LayerConfig,
  PressConfig,
} from "../types";

/** Stable, collision-safe key for a button's location (profile / layer /
 * button). JSON-encoded so it's unambiguous even when a name contains spaces or
 * punctuation. Used to re-link exactly the right buttons on a delete Undo. */
export function assignmentKey(profile: string, layer: string, btn: string): string {
  return JSON.stringify([profile, layer, btn]);
}

/** Rebuild the config applying `map` to every button assignment. `map` returns a
 * replacement assignment, or null to leave that one unchanged. Returns a new
 * config, or null when nothing changed (so callers can skip a write). This is
 * the shared profile→layer→button walk behind the link/unlink helpers. */
function mapConfigAssignments(
  config: AppConfig,
  map: (a: ButtonAssignment, key: string) => ButtonAssignment | null,
): AppConfig | null {
  let changed = false;
  const next: AppConfig = {};
  for (const [pn, p] of Object.entries(config)) {
    const layers: Record<string, LayerConfig> = {};
    for (const [ln, l] of Object.entries(p.layers)) {
      const buttons: Record<string, ButtonAssignment> = {};
      for (const [btn, a] of Object.entries(l.buttons)) {
        const mapped = map(a, assignmentKey(pn, ln, btn));
        if (mapped) {
          changed = true;
          buttons[btn] = mapped;
        } else {
          buttons[btn] = a;
        }
      }
      layers[ln] = { ...l, buttons };
    }
    next[pn] = { ...p, layers };
  }
  return changed ? next : null;
}

/** Apply `map` to every assignment across the config linked to `defId`. Returns
 * a new config, or null when nothing was linked (so callers can skip a write). */
export function mapLinkedAssignments(
  config: AppConfig,
  defId: string,
  map: (a: ButtonAssignment) => ButtonAssignment,
): AppConfig | null {
  return mapConfigAssignments(config, (a) => (a.def === defId ? map(a) : null));
}

/** Drop the link on every assignment whose definition is in `defIds` (keeps the
 * cached press). Used when definitions are deleted in bulk. */
export function unlinkAssignments(
  config: AppConfig,
  defIds: Set<string>,
): AppConfig | null {
  return mapConfigAssignments(config, (a) =>
    a.def && defIds.has(a.def) ? { ...a, def: undefined } : null,
  );
}

/** Re-link the specific button locations in `locations` (keys from
 * {@link assignmentKey}) back to `defId`, re-caching `press`. Reverses a
 * definition-delete's unlink surgically — only the originally-linked buttons
 * change, so edits made elsewhere while the Undo toast was up survive. */
export function relinkAssignments(
  config: AppConfig,
  locations: ReadonlySet<string>,
  defId: string,
  press: PressConfig,
): AppConfig | null {
  if (locations.size === 0) return null;
  return mapConfigAssignments(config, (a, key) =>
    locations.has(key) ? { ...a, def: defId, press } : null,
  );
}
