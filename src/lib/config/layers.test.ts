import { describe, expect, it } from "vitest";
import type { ButtonAssignment, ProfileConfig } from "../types";
import {
  addLayer,
  deleteLayer,
  duplicateLayer,
  inheritedFromBase,
  normalizeInherit,
  reconcileLayerRefs,
  renameLayer,
  reorderLayers,
  setButtonAssignment,
} from "./layers";

const layerHold = (layer: string): ButtonAssignment => ({
  press: { type: "layerHold", layer },
});
const tap = (key: string): ButtonAssignment => ({
  press: { type: "input", mode: "tap", inputs: [{ type: "keyboard", value: key }] },
});

function profile(): ProfileConfig {
  return {
    matchApps: [],
    initialLayer: "base",
    layers: {
      base: { buttons: { ZL: layerHold("second"), A: tap("a") } },
      second: { buttons: {}, inherit: "modifiers" },
    },
  };
}

describe("normalizeInherit", () => {
  it("maps legacy booleans and absent to tri-state", () => {
    expect(normalizeInherit(true)).toBe("all");
    expect(normalizeInherit(undefined)).toBe("all");
    expect(normalizeInherit(false)).toBe("none");
    expect(normalizeInherit("modifiers")).toBe("modifiers");
  });
});

describe("inheritedFromBase", () => {
  const baseButtons = { ZL: layerHold("second"), A: tap("a") };
  it("all → everything, none → nothing", () => {
    expect(inheritedFromBase(baseButtons, "all")).toEqual(baseButtons);
    expect(inheritedFromBase(baseButtons, "none")).toEqual({});
  });
  it("modifiers → only hold-to-switch / modifier buttons", () => {
    expect(Object.keys(inheritedFromBase(baseButtons, "modifiers"))).toEqual([
      "ZL",
    ]);
  });
});

describe("addLayer / deleteLayer", () => {
  it("adds a layer that inherits modifiers by default", () => {
    const p = addLayer(profile(), "third")!;
    expect(p.layers.third.inherit).toBe("modifiers");
  });
  it("refuses a duplicate layer name", () => {
    expect(addLayer(profile(), "second")).toBeNull();
  });
  it("refuses to delete the last remaining layer", () => {
    const single: ProfileConfig = {
      matchApps: [],
      initialLayer: "only",
      layers: { only: { buttons: {} } },
    };
    expect(deleteLayer(single, "only")).toBeNull();
  });
  it("deleting a layer scrubs layerHold targets that point to it", () => {
    const p = deleteLayer(profile(), "second")!;
    // ZL pointed at "second"; with it gone the assignment is dropped.
    expect(p.layers.base.buttons.ZL).toBeUndefined();
  });
});

describe("renameLayer", () => {
  it("retargets layerHold references to the renamed layer", () => {
    const p = renameLayer(profile(), "second", "mouse")!;
    expect(Object.keys(p.layers)).toEqual(["base", "mouse"]);
    const zl = p.layers.base.buttons.ZL;
    expect(zl.press.type === "layerHold" && zl.press.layer).toBe("mouse");
  });
  it("returns null when the new name is taken", () => {
    expect(renameLayer(profile(), "second", "base")).toBeNull();
  });
});

describe("reorderLayers", () => {
  it("reorders freely — the top layer becomes the base", () => {
    const p = reorderLayers(profile(), ["second", "base"]);
    expect(Object.keys(p.layers)).toEqual(["second", "base"]);
    expect(p.initialLayer).toBe("second");
  });
});

describe("duplicateLayer", () => {
  it("clones a layer under a unique name", () => {
    const p = duplicateLayer(profile(), "base")!;
    const names = Object.keys(p.layers);
    expect(names.length).toBe(3);
    expect(names.some((n) => n !== "base" && n.startsWith("base"))).toBe(true);
  });
});

describe("setButtonAssignment", () => {
  it("sets a button's assignment", () => {
    const p = setButtonAssignment(profile(), "base", "B", tap("b"));
    expect(p.layers.base.buttons.B).toBeDefined();
  });
  it("null removes the button entry", () => {
    const p = setButtonAssignment(profile(), "base", "A", null);
    expect(p.layers.base.buttons.A).toBeUndefined();
  });
});

describe("reconcileLayerRefs", () => {
  it("drops layerHold assignments whose target no longer exists", () => {
    const p = reconcileLayerRefs(profile(), { valid: new Set(["base"]) });
    expect(p.layers.base.buttons.ZL).toBeUndefined();
    // Non-referential buttons survive untouched.
    expect(p.layers.base.buttons.A).toBeDefined();
  });
  it("returns the same object when nothing changed", () => {
    const p = profile();
    expect(reconcileLayerRefs(p, { valid: new Set(["base", "second"]) })).toBe(p);
  });
});
