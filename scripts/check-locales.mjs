// Locale health check for the JP-source-key i18n (en.ts maps Japanese → English).
//
// Reports two things, run by `npm run check:locales` (also in CI):
//   • MISSING  — a Japanese string shown to the user (a `t("…")` call or a
//                translated prop like title/label/desc) that has no en.ts entry,
//                so it silently falls back to Japanese in English mode. This is a
//                real hole and FAILS the check (exit 1).
//   • ORPHAN   — an en.ts key that never appears as a literal in src. Just a
//                cleanup hint (dynamic `{{…}}` keys can't be matched), so it is
//                reported but does NOT fail the check.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const localePath = join(root, "src/lib/locales/en.ts");
const srcDir = join(root, "src");

// Extract keys: a quoted or bareword token at the start of a line, before `:`.
const locale = readFileSync(localePath, "utf8");
const keys = new Set();
for (const m of locale.matchAll(/(?:^|\n)\s*(?:"([^"\n]+)"|([^\s":]+))\s*:/g)) {
  const key = m[1] ?? m[2];
  if (key) keys.add(key);
}

// Read every source file except the locales themselves.
function collect(dir) {
  let text = "";
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === "locales") continue;
      text += collect(p);
    } else if ([".ts", ".tsx"].includes(extname(p))) {
      text += readFileSync(p, "utf8");
    }
  }
  return text;
}
const source = collect(srcDir);

// ── Orphans: en.ts keys never appearing as a literal in src (skip dynamic keys).
const orphans = [...keys].filter((k) => !k.includes("{{") && !source.includes(k));

// ── Missing: Japanese strings passed to t() or to a prop the shared components
// translate, but absent from en.ts. Dynamic `{{…}}` keys are skipped (they're
// interpolated and matched by their template, which lives in en.ts already).
const hasJa = (s) => /[぀-ヿ㐀-鿿]/.test(s);
const used = new Set();
const add = (s) => {
  if (s && !s.includes("{{") && hasJa(s)) used.add(s);
};
for (const m of source.matchAll(/\bt\(\s*"([^"]+)"/g)) add(m[1]);
const PROPS =
  "title|label|desc|hint|placeholder|previewTip|handleTitle|emptyHint|okLabel";
// JSX attribute form: title="…"
for (const m of source.matchAll(new RegExp(`\\b(?:${PROPS})=\\s*"([^"]+)"`, "g")))
  add(m[1]);
// Object-literal form: label: "…" (data-driven menu items, SECTIONS, options).
// These are translated at render (e.g. ContextMenu does t(item.label)), so the
// attribute-only scan missed them — a new one lacking an en.ts entry would pass
// the check yet fall back to Japanese. The hasJa filter keeps non-UI object keys
// (type: "input", value: "left") from being flagged.
for (const m of source.matchAll(new RegExp(`\\b(?:${PROPS}):\\s*"([^"]+)"`, "g")))
  add(m[1]);
const missing = [...used].filter((k) => !keys.has(k));

if (missing.length) {
  console.log(
    `✗ ${missing.length} Japanese string(s) missing from en.ts (fall back to Japanese in English):`,
  );
  for (const k of missing) console.log(`  ${k}`);
}
if (orphans.length) {
  console.log(
    `ℹ ${orphans.length} orphan key(s) in en.ts, unused in src (review before removing):`,
  );
  for (const k of orphans) console.log(`  ${k}`);
}
if (!missing.length) {
  const note = orphans.length ? ` (${orphans.length} orphan hint(s) above)` : ", no orphans";
  console.log(`✓ ${keys.size} keys, no missing translations${note}.`);
}
// Missing translations fail the check; orphans are only a hint.
process.exit(missing.length ? 1 : 0);
