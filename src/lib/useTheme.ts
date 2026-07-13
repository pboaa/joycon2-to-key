import { useEffect } from "react";
import type { ThemeMode } from "./types";
import { resolveTheme } from "./themes";

const DARK_QUERY = "(prefers-color-scheme: dark)";

/** Apply a theme: set `data-theme` (drives the palette in index.css) and toggle
 * the `.dark` class (drives dark-tuned utilities). Data-driven via the theme
 * registry, so new themes need no changes here. Caches the resolved choice in
 * localStorage so index.html can paint it flash-free on the next launch. */
export function applyTheme(theme: ThemeMode): void {
  const def = resolveTheme(theme, window.matchMedia(DARK_QUERY).matches);
  const el = document.documentElement;
  el.dataset.theme = def.id;
  el.classList.toggle("dark", def.dark);
  try {
    localStorage.setItem("theme", theme);
    localStorage.setItem("theme-dark", def.dark ? "1" : "0");
  } catch {
    // Ignore storage failures — the theme still applies for this session.
  }
}

/** Apply the chosen theme and keep it current: react to OS changes while in
 * "system". */
export function useTheme(theme: ThemeMode): void {
  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    const mq = window.matchMedia(DARK_QUERY);
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);
}
