// List/record reorder helpers shared by the drag-and-drop lists.
// `reorderRecord` and `reorderById` deliberately differ on unknown keys:
// records drop them (order is the authority), id lists keep them appended
// (a filtered view reorders only what it can see).

/** Move one element of a list from `from` to `to` (new array). */
export function moveIndex<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list];
  const [m] = next.splice(from, 1);
  next.splice(to, 0, m);
  return next;
}

/** Rebuild a record in the given key order. Keys missing from `order` are
 * dropped; keys in `order` that don't exist are skipped. */
export function reorderRecord<T>(
  rec: Record<string, T>,
  order: string[],
): Record<string, T> {
  const next: Record<string, T> = {};
  for (const k of order) if (rec[k]) next[k] = rec[k];
  return next;
}

/** Reorder items by an id list; items not named in `order` keep their
 * original relative order, appended at the end. */
export function reorderById<T>(
  items: readonly T[],
  order: string[],
  idOf: (item: T) => string,
): T[] {
  const byId = new Map(items.map((it) => [idOf(it), it]));
  const out: T[] = [];
  for (const id of order) {
    const it = byId.get(id);
    if (it !== undefined) {
      out.push(it);
      byId.delete(id);
    }
  }
  out.push(...byId.values());
  return out;
}
