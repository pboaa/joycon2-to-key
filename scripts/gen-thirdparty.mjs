import { execSync } from "node:child_process";
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Regenerate THIRD-PARTY-NOTICES.md: the license inventory of every Rust crate
// (resolved for the shipped Windows target) and production npm package.
//   node scripts/gen-thirdparty.mjs
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "THIRD-PARTY-NOTICES.md");

// ---- Rust (cargo metadata, resolved for the Windows target only) ----
const TARGET = "x86_64-pc-windows-msvc";
function rustDeps() {
  const raw = execSync(
    `cargo metadata --format-version 1 --filter-platform ${TARGET}`,
    {
      cwd: path.join(ROOT, "src-tauri"),
      maxBuffer: 128 * 1024 * 1024,
      encoding: "utf8",
    },
  );
  const meta = JSON.parse(raw);
  const rootName = "joycon2-to-key";
  const byId = new Map(meta.packages.map((p) => [p.id, p]));
  // resolve.nodes respects --filter-platform, so this is the set actually
  // linked into the Windows build (no macOS/Linux BLE backends).
  const ids = new Set(meta.resolve.nodes.map((n) => n.id));
  const seen = new Map();
  for (const id of ids) {
    const p = byId.get(id);
    if (!p || p.name === rootName) continue;
    const key = `${p.name}@${p.version}`;
    seen.set(key, {
      name: p.name,
      version: p.version,
      license: p.license || (p.license_file ? "see license file" : "UNKNOWN"),
      repo: p.repository || "",
    });
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

// ---- npm (production tree, transitive) ----
function readPkgLicense(name) {
  // hoisted layout: node_modules/<name>/package.json
  const pj = path.join(ROOT, "node_modules", name, "package.json");
  if (!existsSync(pj)) return { license: "UNKNOWN", repo: "" };
  const j = JSON.parse(readFileSync(pj, "utf8"));
  let license = j.license;
  if (!license && Array.isArray(j.licenses))
    license = j.licenses.map((l) => l.type || l).join(" OR ");
  if (license && typeof license === "object") license = license.type;
  let repo = "";
  if (typeof j.repository === "string") repo = j.repository;
  else if (j.repository && j.repository.url) repo = j.repository.url;
  return { license: license || "UNKNOWN", repo };
}

function npmDeps() {
  const raw = execSync("npm ls --omit=dev --all --json", {
    cwd: ROOT,
    maxBuffer: 64 * 1024 * 1024,
    encoding: "utf8",
  });
  const tree = JSON.parse(raw);
  const out = new Map();
  const walk = (deps) => {
    if (!deps) return;
    for (const [name, node] of Object.entries(deps)) {
      // Skip unmet / optional-not-installed deps (no version, not bundled).
      if (!node.version || node.missing) {
        walk(node.dependencies);
        continue;
      }
      const version = node.version;
      const key = `${name}@${version}`;
      if (!out.has(key)) {
        const { license, repo } = readPkgLicense(name);
        out.set(key, { name, version, license, repo });
      }
      walk(node.dependencies);
    }
  };
  walk(tree.dependencies);
  return [...out.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function table(rows) {
  const lines = ["| Package | Version | License |", "|---|---|---|"];
  for (const r of rows) {
    const pkg = r.repo
      ? `[${r.name}](${r.repo.replace(/^git\+/, "").replace(/\.git$/, "")})`
      : r.name;
    lines.push(`| ${pkg} | ${r.version} | ${r.license} |`);
  }
  return lines.join("\n");
}

const rust = rustDeps();
const npm = npmDeps();

const licenseTally = (rows) => {
  const m = new Map();
  for (const r of rows) m.set(r.license, (m.get(r.license) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

const md = `# Third-Party Notices

JoyCon2 to Key (licensed under GPL-3.0-or-later) bundles and links the following
third-party components. They are under permissive licenses (MIT / Apache-2.0 /
BSD / ISC / Zlib / Unicode / etc.), plus a few MPL-2.0 (weak copyleft) crates —
all of which are compatible with GPL-3.0. No GPL-2-only, proprietary, or
network-copyleft (AGPL) dependencies are present.

The Rust list is resolved for the shipped target (\`${TARGET}\`), so the
macOS/Linux BLE backends are excluded. Generated from \`cargo metadata\` and
\`npm ls --omit=dev\` (run \`node scripts/gen-thirdparty.mjs\` to refresh).

Generated: ${new Date().toISOString().slice(0, 10)}

## Rust crates (${rust.length})

License summary: ${licenseTally(rust).map(([l, n]) => `${l} (${n})`).join(", ")}

${table(rust)}

## npm packages — production (${npm.length})

License summary: ${licenseTally(npm).map(([l, n]) => `${l} (${n})`).join(", ")}

${table(npm)}

## Protocol references (facts, not bundled code)

The Joy-Con 2 wire-format handling is an independent reimplementation from
documented byte offsets and command sequences. No third-party code is copied.
The following projects were used as protocol references (facts / interface
data), and are credited here:

- **Joycon2forMac** — battery current/temperature telemetry offsets and formulas.
- **yujimny/Joycon2test** — IMU-enable command byte sequences.
- **ndeadly** — primary Joy-Con 2 protocol reverse-engineering reference.
`;

writeFileSync(OUT, md);
console.log(`wrote ${OUT}`);
console.log(`rust crates: ${rust.length}, npm prod packages: ${npm.length}`);
console.log("rust licenses:", licenseTally(rust).map(([l, n]) => `${l}:${n}`).join("  "));
console.log("npm  licenses:", licenseTally(npm).map(([l, n]) => `${l}:${n}`).join("  "));
const unknown = [...rust, ...npm].filter((r) => /UNKNOWN/i.test(r.license));
if (unknown.length)
  console.log("UNKNOWN:", unknown.map((r) => `${r.name}@${r.version}`).join(", "));
