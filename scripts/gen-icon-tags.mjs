import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Regenerate src/lib/iconTags.generated.json: a compact `IconName -> "tag tag …"`
// search index built from Tabler's own metadata, so the icon picker can match on
// concept keywords ("erase", "delete", "paint") not just the component name.
//   node scripts/gen-icon-tags.mjs
//
// Source: @tabler/icons/icons.json (ships with the icons package; ~5k icons,
// each with English `tags`). Not exposed via the package `exports`, so read by
// its physical path. Tags are English only — this widens the English search.
//
// Scoped to the curated set (the icons the picker actually offers, listed in
// opIcons.ts): the bundle only ships those, so tags for anything else would be
// dead weight the search can never render.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "node_modules", "@tabler", "icons", "icons.json");
const OP_ICONS = path.join(ROOT, "src", "lib", "opIcons.ts");
const OUT = path.join(ROOT, "src", "lib", "iconTags.generated.json");

/** Curated icon names (single source of truth) from opIcons.ts. */
function curatedNames() {
  const src = readFileSync(OP_ICONS, "utf8");
  const seen = new Set();
  for (const m of src.matchAll(/"(Icon[A-Za-z0-9]+)"/g)) seen.add(m[1]);
  return seen;
}
const curated = curatedNames();

/** kebab key ("color-picker") → React export name ("IconColorPicker"). */
function toIconName(key) {
  return (
    "Icon" +
    key
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join("")
  );
}

const icons = JSON.parse(readFileSync(SRC, "utf8"));
const index = {};
for (const key of Object.keys(icons)) {
  const name = toIconName(key);
  if (!curated.has(name)) continue; // only icons the picker can actually show
  const nameLower = name.toLowerCase();
  // Unique, lowercased tags, dropping any already a substring of the name (the
  // picker matches the name too, so those add nothing but bytes).
  const tags = [
    ...new Set((icons[key].tags ?? []).map((t) => String(t).toLowerCase())),
  ].filter((tag) => tag && !nameLower.includes(tag));
  if (tags.length) index[name] = tags.join(" ");
}

// Stable key order → deterministic, review-friendly diffs on regeneration.
const sorted = {};
for (const name of Object.keys(index).sort()) sorted[name] = index[name];

writeFileSync(OUT, JSON.stringify(sorted) + "\n");
console.log(
  `[icon-tags] wrote ${Object.keys(sorted).length} entries → ${path.relative(ROOT, OUT)}`,
);
