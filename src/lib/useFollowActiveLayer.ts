import { useEffect, useRef } from "react";
import type { ActiveLayer, AppConfig } from "./types";

/** Follow the runtime's active profile + layer into the selection, reacting only
 * to real changes (so it doesn't fight manual selection on every poll). Paused
 * while `suspend` is set — a profile being edited in a modal must not be yanked
 * away when its config edits re-match the foreground app. Split out of
 * useSelection as the one imperative (effect) piece of that hook.
 *
 * The active profile is shown persistently in the title bar (ActiveProfileChip),
 * so switching is not announced with a toast (it fired on every app change,
 * which was noisy). */
export function useFollowActiveLayer(
  config: AppConfig | null,
  activeLayer: ActiveLayer | null,
  suspend: boolean,
  setSelectedProfile: (n: string) => void,
  setSelectedLayer: (n: string) => void,
) {
  const followed = useRef<string>("");
  useEffect(() => {
    if (suspend) return;
    const al = activeLayer;
    if (!al || !al.profile || !config) return;
    const key = al.profile + "|" + al.layer;
    if (key === followed.current) return;
    followed.current = key;
    const p = config[al.profile];
    if (!p) return;
    setSelectedProfile(al.profile);
    if (al.layer && p.layers?.[al.layer]) setSelectedLayer(al.layer);
    // Setters are stable (zustand store actions); depend only on real inputs.
  }, [activeLayer, config, suspend]);
}
