import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Print the release notes for a given version, pulled from the SAME source the
// in-app "更新履歴" reads: src/lib/changelog.json. The release workflow feeds
// this to tauri-action as the release body, which also becomes the updater's
// latest.json `notes` (shown in the in-app update modal). So you write the
// update notes once, concisely, in changelog.json — nowhere else.
//
//   node scripts/release-notes.mjs v0.1.1   (or 0.1.1)
//
// Notes are per language (ja / en). Both are emitted when present so the GitHub
// release and the update modal read for everyone; keep each bullet short.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHANGELOG = path.join(ROOT, "src", "lib", "changelog.json");

const raw = process.argv[2] ?? "";
const version = raw.replace(/^v/, "").trim();
if (!version) {
  console.error("usage: node scripts/release-notes.mjs <version>");
  process.exit(2);
}

const log = JSON.parse(readFileSync(CHANGELOG, "utf8"));
const entry = log.find((e) => e.version === version);
if (!entry) {
  // Don't fail the release over a missing note; emit a minimal body.
  process.stdout.write(`v${version}\n`);
  process.exit(0);
}

const bullets = (arr) => (arr ?? []).map((n) => `- ${n}`).join("\n");
const ja = bullets(entry.notes?.ja);
const en = bullets(entry.notes?.en);

const parts = [];
if (ja) parts.push(ja);
if (en) parts.push(en);
process.stdout.write(parts.join("\n\n") + "\n");
