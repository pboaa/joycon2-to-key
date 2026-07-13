import { useEffect } from "react";

const CACHE_KEY = "uiScale";

/** Apply the UI text scale by setting `--ui-scale` on <html>; the typography
 * tokens in index.css multiply by it (see `calc(var(--ui-scale) * Npx)`).
 * Caches the value so theme-init.js can paint it flash-free next launch. */
export function applyUiScale(scale: number): void {
  const s = Number.isFinite(scale) && scale > 0 ? scale : 1;
  document.documentElement.style.setProperty("--ui-scale", String(s));
  try {
    localStorage.setItem(CACHE_KEY, String(s));
  } catch {
    // Ignore storage failures — the scale still applies this session.
  }
}

/** Keep `--ui-scale` in sync with the setting. */
export function useUiScale(scale: number): void {
  useEffect(() => {
    applyUiScale(scale);
  }, [scale]);
}
