import { beforeEach, describe, expect, it } from "vitest";
import type { PieAppearance } from "./types";

// The test suite runs in the node env (no DOM — see vitest.config.ts), so give
// piePresets a minimal in-memory localStorage before importing it.
const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: () => null,
  length: 0,
} as Storage;

const {
  deletePiePreset,
  getPiePresets,
  savePiePreset,
} = await import("./piePresets");

const app = (design: PieAppearance["design"]): PieAppearance => ({ design });

describe("pie presets", () => {
  beforeEach(() => localStorage.clear());

  it("saves and reads back a preset", () => {
    savePiePreset("Neon", app("chips"));
    const list = getPiePresets();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ name: "Neon" });
    expect(list[0].appearance.design).toBe("chips");
  });

  it("overwrites a preset with the same name", () => {
    savePiePreset("A", app("chips"));
    savePiePreset("A", app("ring"));
    const list = getPiePresets();
    expect(list).toHaveLength(1);
    expect(list[0].appearance.design).toBe("ring");
  });

  it("stores an independent copy (later edits don't leak in)", () => {
    const a = app("chips");
    savePiePreset("A", a);
    a.design = "ring";
    expect(getPiePresets()[0].appearance.design).toBe("chips");
  });

  it("deletes by name", () => {
    savePiePreset("A", app("chips"));
    savePiePreset("B", app("ring"));
    deletePiePreset("A");
    expect(getPiePresets().map((p) => p.name)).toEqual(["B"]);
  });

  it("returns [] on empty / malformed storage", () => {
    expect(getPiePresets()).toEqual([]);
    localStorage.setItem("joycon.piePresets", "not json");
    expect(getPiePresets()).toEqual([]);
  });
});
