import { describe, expect, it } from "vitest";
import type { AppConfig, ButtonAssignment } from "../types";
import { sanitizeProfiles } from "./sanitize";

const tap = (key: string): ButtonAssignment => ({
  press: { type: "input", mode: "tap", inputs: [{ type: "keyboard", value: key }] },
});
const none = (): ButtonAssignment => ({ press: { type: "none" } });
const emptyInput = (): ButtonAssignment => ({
  press: { type: "input", mode: "tap", inputs: [] },
});
const emptyPie = (): ButtonAssignment => ({
  press: {
    type: "pie",
    slices: [
      { angle: 0, inputs: [] },
      { angle: 180, inputs: [] },
    ],
  },
});
const filledPie = (): ButtonAssignment => ({
  press: {
    type: "pie",
    slices: [
      { angle: 0, inputs: [{ type: "keyboard", value: "a" }] },
      { angle: 180, inputs: [] },
    ],
  },
});
/** Linked to a saved operation but with a bare cached press — the link is content. */
const linkedButBare = (): ButtonAssignment => ({
  def: "op1",
  press: { type: "input", mode: "tap", inputs: [] },
});
const holdWithRepeat = (): ButtonAssignment => ({
  press: {
    type: "input",
    mode: "hold",
    repeatMs: 50,
    inputs: [{ type: "keyboard", value: "a" }],
  },
});

function cfg(buttons: Record<string, ButtonAssignment>): AppConfig {
  return {
    デフォルト: {
      matchApps: [],
      initialLayer: "base",
      layers: { base: { buttons } },
    },
  };
}

describe("sanitizeProfiles", () => {
  it("drops unset (none) drafts", () => {
    const out = sanitizeProfiles(cfg({ A: none() }));
    expect(out["デフォルト"].layers.base.buttons.A).toBeUndefined();
  });
  it("keeps a real assignment", () => {
    const out = sanitizeProfiles(cfg({ A: tap("a") }));
    expect(out["デフォルト"].layers.base.buttons.A).toBeDefined();
  });
  it("drops a key input with no keys", () => {
    const out = sanitizeProfiles(cfg({ A: emptyInput() }));
    expect(out["デフォルト"].layers.base.buttons.A).toBeUndefined();
  });
  it("drops a pie with every direction empty", () => {
    const out = sanitizeProfiles(cfg({ A: emptyPie() }));
    expect(out["デフォルト"].layers.base.buttons.A).toBeUndefined();
  });
  it("keeps a pie that has at least one key", () => {
    const out = sanitizeProfiles(cfg({ A: filledPie() }));
    expect(out["デフォルト"].layers.base.buttons.A).toBeDefined();
  });
  it("keeps a definition-linked assignment even with a bare press", () => {
    const out = sanitizeProfiles(cfg({ A: linkedButBare() }));
    expect(out["デフォルト"].layers.base.buttons.A).toBeDefined();
  });
  it("strips repeatMs from non-tap input (runtime ignores it)", () => {
    const out = sanitizeProfiles(cfg({ A: holdWithRepeat() }));
    const press = out["デフォルト"].layers.base.buttons.A.press;
    expect(press.type).toBe("input");
    expect("repeatMs" in press).toBe(false);
  });
  it("reconciles dangling layerHold refs (defense in depth)", () => {
    const out = sanitizeProfiles(
      cfg({ ZL: { press: { type: "layerHold", layer: "ghost" } } }),
    );
    expect(out["デフォルト"].layers.base.buttons.ZL).toBeUndefined();
  });
});
