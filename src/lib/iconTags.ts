// Lazy access to the icon search-tag index (IconName → "tag tag …"), generated
// from Tabler's own metadata by scripts/gen-icon-tags.mjs. Dynamically imported
// so its ~430KB stays out of the main bundle and only loads when the icon picker
// is opened — same on-demand strategy as the icon barrel itself.

export type IconTagIndex = Record<string, string>;

let promise: Promise<IconTagIndex> | null = null;

/** The name→tags index, loaded (and cached) on first call. Resolves to an empty
 * map if the generated file is somehow unavailable, so search degrades to
 * name-only matching rather than throwing. */
export function getIconTags(): Promise<IconTagIndex> {
  return (promise ??= import("./iconTags.generated.json")
    .then((m) => (m.default ?? m) as IconTagIndex)
    .catch(() => ({})));
}
