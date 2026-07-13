// Most-recently-picked icons, so the icon picker can surface them first — handy
// when tagging many operations with a small working set of glyphs. A tiny
// localStorage list of Tabler names (most-recent first, capped), mirroring
// recentDefs.
const KEY = "joycon.recentIcons";
const MAX = 12;

export function getRecentIcons(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function pushRecentIcon(name: string): void {
  const next = [name, ...getRecentIcons().filter((x) => x !== name)].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // best-effort; recents are non-essential
  }
}
