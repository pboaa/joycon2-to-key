import type { ThemeMode } from "./types";

/** A selectable color theme. `dark` drives the `.dark` class (so the legacy
 * `dark:` utilities and dark-tuned components follow it); the actual palette
 * lives in a matching `html[data-theme="<id>"]` block in index.css.
 *
 * Adding a theme = one entry here + one CSS block. No code branches: applyTheme
 * and the settings dropdown are both derived from this list. */
export interface ThemeDef {
  id: Exclude<ThemeMode, "system">;
  label: string;
  /** True for dark-based palettes (adds the `.dark` class). */
  dark: boolean;
}

export const THEMES: ThemeDef[] = [
  { id: "light", label: "ライト", dark: false },
  { id: "dark", label: "ダーク", dark: true },
  { id: "matcha", label: "抹茶猫", dark: true },
  { id: "hatsuyuki", label: "初雪", dark: false },
];

/** Resolve a theme mode to a concrete definition ("system" → OS preference). */
export function resolveTheme(theme: ThemeMode, prefersDark: boolean): ThemeDef {
  const id = theme === "system" ? (prefersDark ? "dark" : "light") : theme;
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
