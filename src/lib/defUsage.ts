// Reverse lookup: "where is this saved operation actually used?" A button links
// to a definition via `assignment.def` (set when you assign a saved operation to
// it). Scanning every profile → layer → button for that id tells the user which
// buttons would lose their link if the operation were deleted — the companion to
// the per-operation use count.
import type { AppConfig } from "./types";

export interface DefUsage {
  profile: string;
  layer: string;
  /** The button key (e.g. "zr", "a"); resolve to a label with buttonLabel(). */
  button: string;
}

/** Every button assignment linked to `defId`, across all profiles and layers,
 * in profile → layer → button document order. */
export function findDefUsages(
  profiles: AppConfig | null,
  defId: string,
): DefUsage[] {
  if (!profiles) return [];
  const out: DefUsage[] = [];
  for (const [profile, p] of Object.entries(profiles)) {
    for (const [layer, l] of Object.entries(p.layers)) {
      for (const [button, a] of Object.entries(l.buttons)) {
        if (a.def === defId) out.push({ profile, layer, button });
      }
    }
  }
  return out;
}
