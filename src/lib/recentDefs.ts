// Most-recently-picked saved operations, so the "assign an operation" picker can
// surface them first. A tiny localStorage list of definition ids (most-recent
// first, capped). Ids that no longer exist are simply skipped by the reader.
const KEY = "joycon.recentDefs";
const MAX = 6;

export function getRecentDefIds(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function pushRecentDef(id: string): void {
  const next = [id, ...getRecentDefIds().filter((x) => x !== id)].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // best-effort; recents are non-essential
  }
}
