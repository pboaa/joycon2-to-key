import { useEffect, useState } from "react";
import { getUsage, type DayUsageMap } from "./tauri";
import type { UsageWindow } from "./usage";

/** Shared heatmap state for the key-assignment page: the toggle + rolling
 * window live in the top toolbar, while the Joy-Con figure consumes the polled
 * usage counts to tint its buttons. Lifting it here lets both share one source
 * of truth. Polls the usage counts (every 2s) only while the heatmap is on. */
export interface Heatmap {
  on: boolean;
  setOn: (v: boolean) => void;
  win: UsageWindow;
  setWin: (w: UsageWindow) => void;
  usage: DayUsageMap;
  /** Re-fetch immediately (e.g. right after a reset). */
  refresh: () => void;
}

export function useHeatmap(): Heatmap {
  const [on, setOn] = useState(false);
  const [win, setWin] = useState<UsageWindow>("all");
  const [usage, setUsage] = useState<DayUsageMap>({});
  const refresh = () => getUsage().then(setUsage).catch(() => {});

  useEffect(() => {
    if (!on) return;
    let alive = true;
    const load = () => getUsage().then((u) => alive && setUsage(u)).catch(() => {});
    void load();
    const id = setInterval(load, 2000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [on]);

  return { on, setOn, win, setWin, usage, refresh };
}
