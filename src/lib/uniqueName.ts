/** First available name: `base` itself, else `format(base, 2)`, `format(base, 3)`, …
 * The default numbers with a half-width space (`${base} ${n}`, e.g. "レイヤー 2");
 * pack imports pass their own `${base}-${n}`. */
export function uniqueName(
  base: string,
  taken: Iterable<string>,
  format: (base: string, n: number) => string = (b, n) => `${b} ${n}`,
): string {
  const set = taken instanceof Set ? taken : new Set(taken);
  if (!set.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = format(base, n);
    if (!set.has(candidate)) return candidate;
  }
}
