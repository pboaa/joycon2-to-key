// Usage aggregation over rolling day windows. Counts are stored as daily buckets
// keyed by UTC day number (unix_secs / 86400); the UI sums the last N days.
import type { DayPieUsageMap, DayUsageMap, UsageMap } from "./tauri";

/** Rolling window options (Today = last 1 day … All-time = everything). */
export const USAGE_WINDOWS = [
  { key: "today", label: "今日", days: 1 },
  { key: "week", label: "週", days: 7 },
  { key: "month", label: "月", days: 30 },
  { key: "all", label: "累計", days: Infinity },
] as const;

export type UsageWindow = (typeof USAGE_WINDOWS)[number]["key"];

const WINDOW_DAYS: Record<UsageWindow, number> = {
  today: 1,
  week: 7,
  month: 30,
  all: Infinity,
};

/** Today's UTC day number (matches the Rust key). */
export const todayDay = () => Math.floor(Date.now() / 86400000);

/** Activation count → heat colour. A single-hue green scale (GitHub-contribution
 * style): 0 (unused) is a dim near-neutral base, and more use fills toward a
 * brighter, milder green. Softer than a rainbow so it reads calmly. */
export function heatColor(count: number, max: number): string {
  if (count <= 0) return "hsl(150, 10%, 24%)";
  const t = 0.25 + 0.75 * (count / Math.max(max, 1));
  return `hsl(142, ${Math.round(38 + 20 * t)}%, ${Math.round(26 + 20 * t)}%)`;
}

/** First day (inclusive) of the rolling window; -Infinity for "all". */
function cutoff(win: UsageWindow): number {
  const d = WINDOW_DAYS[win];
  return d === Infinity ? -Infinity : todayDay() - d + 1;
}

/** The busiest button count for a profile/layer (≥1). Shared by the figure and
 * the pie so a given count maps to the same heat colour in both. */
export function usageMax(agg: UsageMap, profile: string, layer: string): number {
  let max = 1;
  for (const v of Object.values(agg[profile]?.[layer] ?? {})) max = Math.max(max, v);
  return max;
}

/** Sum the daily button buckets within the window → one profile→layer→button map. */
export function sumUsage(days: DayUsageMap, win: UsageWindow): UsageMap {
  const from = cutoff(win);
  const out: UsageMap = {};
  for (const [dayStr, u] of Object.entries(days)) {
    if (Number(dayStr) < from) continue;
    for (const [p, layers] of Object.entries(u))
      for (const [l, btns] of Object.entries(layers))
        for (const [b, n] of Object.entries(btns)) {
          const pm = (out[p] ??= {});
          const lm = (pm[l] ??= {});
          lm[b] = (lm[b] ?? 0) + n;
        }
  }
  return out;
}

/** Sum the daily pie buckets for one button (profile/layer/button) within the
 * window → slice key → count. */
export function sumPieUsage(
  days: DayPieUsageMap,
  profile: string,
  layer: string,
  button: string,
  win: UsageWindow,
): Record<string, number> {
  const from = cutoff(win);
  const out: Record<string, number> = {};
  for (const [dayStr, u] of Object.entries(days)) {
    if (Number(dayStr) < from) continue;
    const slices = u[profile]?.[layer]?.[button];
    if (!slices) continue;
    for (const [s, n] of Object.entries(slices)) out[s] = (out[s] ?? 0) + n;
  }
  return out;
}
