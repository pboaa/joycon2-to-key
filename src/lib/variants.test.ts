import { describe, expect, it } from "vitest";
import type { ButtonAssignment } from "./types";
import { inheritsUnderModifiers, shortLabel } from "./variants";

const tap = (key: string): ButtonAssignment => ({
  press: { type: "input", mode: "tap", inputs: [{ type: "keyboard", value: key }] },
});
const holdMods = (...keys: string[]): ButtonAssignment => ({
  press: { type: "input", mode: "hold", inputs: keys.map((value) => ({ type: "keyboard", value })) },
});

describe("inheritsUnderModifiers", () => {
  it("true for layerHold", () => {
    expect(inheritsUnderModifiers({ press: { type: "layerHold", layer: "x" } })).toBe(true);
  });
  it("true for a hold made only of modifier keys", () => {
    expect(inheritsUnderModifiers(holdMods("Ctrl", "Shift"))).toBe(true);
  });
  it("false for a hold that includes a non-modifier key", () => {
    expect(inheritsUnderModifiers(holdMods("Ctrl", "a"))).toBe(false);
  });
  it("false for a plain tap", () => {
    expect(inheritsUnderModifiers(tap("a"))).toBe(false);
  });
});

describe("shortLabel", () => {
  it("prefers an explicit label", () => {
    expect(shortLabel({ type: "input", label: "カスタム", inputs: [] })).toBe("カスタム");
  });
  it("joins input command labels with +", () => {
    expect(
      shortLabel({
        type: "input",
        inputs: [
          { type: "keyboard", value: "Ctrl" },
          { type: "keyboard", value: "C" },
        ],
      }),
    ).toBe("Ctrl+C");
  });
  it("shows a dash for an empty input", () => {
    expect(shortLabel({ type: "input", inputs: [] })).toBe("—");
  });
  it("labels a layerHold with its target", () => {
    expect(shortLabel({ type: "layerHold", layer: "mouse" })).toBe("⇩mouse");
  });
  it("empty string for a none draft", () => {
    expect(shortLabel({ type: "none" })).toBe("");
  });
});
