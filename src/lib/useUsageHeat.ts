import { useMemo } from "react";
import type { DayUsageMap } from "./tauri";
import { sumUsage, usageMax, heatColor, type UsageWindow } from "./usage";

/** Shared usage→heat computation for the Stats figure and panel: sum the rolling
 * window once, take the profile/layer's busiest-button count as the max, and
 * expose `colorOf` so a given count maps to the same colour in both places (the
 * figure and the pie were building this flow separately). */
export function useUsageHeat(
  usage: DayUsageMap,
  win: UsageWindow,
  profile: string,
  layer: string,
) {
  return useMemo(() => {
    const agg = sumUsage(usage, win);
    const counts = agg[profile]?.[layer] ?? {};
    const max = usageMax(agg, profile, layer);
    return { counts, max, colorOf: (count: number) => heatColor(count, max) };
  }, [usage, win, profile, layer]);
}
