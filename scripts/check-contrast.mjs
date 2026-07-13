// WCAG contrast audit for the theme text tokens, parsed straight from
// src/index.css so it can't drift from the real values. For each theme it
// checks text2 / text3 against the bg / bg2 / bg3 surfaces.
//
//   text2 (secondary body/labels, small text)  → must be ≥ 4.5:1 (AA)
//   text3 (tertiary captions/hints, muted)      → must be ≥ 3.0:1 (AA large/UI)
//
// text3 is intentionally the quietest tier, so it's held to the 3.0 UI/large-
// text floor rather than 4.5 (pushing it to 4.5 would collide with text2 and
// flatten the hierarchy). Run: `node scripts/check-contrast.mjs`.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(join(root, "src/index.css"), "utf8");

const hex = (h) => {
  const n = h.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
};
const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (h) => {
  const [r, g, b] = hex(h).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

/** Pull a `--token: #hex;` value out of a CSS block. */
const tok = (block, name) => block.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1];

/** The four theme blocks and the selector that opens each. `:root` is the light
 * default. */
const THEMES = [
  ["light", /:root\s*\{([^}]*)\}/],
  ["dark", /html\.dark\s*\{([^}]*)\}/],
  ["matcha", /html\[data-theme="matcha"\]\s*\{([^}]*)\}/],
  ["hatsuyuki", /html\[data-theme="hatsuyuki"\]\s*\{([^}]*)\}/],
];

const MIN = { text2: 4.5, text3: 3.0 };
const failures = [];

for (const [name, re] of THEMES) {
  const block = css.match(re)?.[1];
  if (!block) {
    failures.push(`${name}: theme block not found in index.css`);
    continue;
  }
  const surfaces = ["bg", "bg2", "bg3"].map((s) => [s, tok(block, s)]);
  for (const fg of ["text2", "text3"]) {
    const c = tok(block, fg);
    if (!c) {
      failures.push(`${name}: --${fg} not found`);
      continue;
    }
    for (const [sName, sHex] of surfaces) {
      if (!sHex) continue;
      const r = ratio(c, sHex);
      if (r < MIN[fg]) {
        failures.push(
          `${name}: ${fg} on ${sName} = ${r.toFixed(2)} (need ≥ ${MIN[fg]})`,
        );
      }
    }
  }
}

if (failures.length) {
  console.error("✗ contrast below target:");
  for (const f of failures) console.error("  " + f);
  process.exit(1);
}
console.log("✓ text2 ≥ 4.5:1 and text3 ≥ 3.0:1 on every surface, all themes.");
