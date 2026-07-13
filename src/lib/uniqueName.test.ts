import { describe, expect, it } from "vitest";
import { uniqueName } from "./uniqueName";

describe("uniqueName", () => {
  it("returns the base when it is free", () => {
    expect(uniqueName("レイヤー", ["他"])).toBe("レイヤー");
  });
  it("suffixes with the next free number (default half-width space)", () => {
    expect(uniqueName("レイヤー", ["レイヤー"])).toBe("レイヤー 2");
  });
  it("skips taken numbered candidates", () => {
    expect(uniqueName("A", ["A", "A 2", "A 3"])).toBe("A 4");
  });
  it("honours a custom format", () => {
    expect(uniqueName("pack", ["pack"], (b, n) => `${b}-${n}`)).toBe("pack-2");
  });
  it("accepts a Set as taken", () => {
    expect(uniqueName("x", new Set(["x"]))).toBe("x 2");
  });
});
