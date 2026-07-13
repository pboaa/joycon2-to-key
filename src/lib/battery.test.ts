import { describe, expect, it } from "vitest";
import { batteryPercent, BATTERY_EMPTY_MV, BATTERY_FULL_MV } from "./types";

describe("batteryPercent", () => {
  it("clamps below empty to 0 and above full to 100", () => {
    expect(batteryPercent(BATTERY_EMPTY_MV - 100)).toBe(0);
    expect(batteryPercent(BATTERY_FULL_MV + 100)).toBe(100);
  });
  it("interpolates linearly at the midpoint", () => {
    const mid = (BATTERY_FULL_MV + BATTERY_EMPTY_MV) / 2;
    expect(batteryPercent(mid)).toBe(50);
  });
  it("honours custom calibration endpoints", () => {
    expect(batteryPercent(3600, 3700, 3500)).toBe(50);
  });
  it("returns 0 on an inverted/zero range instead of NaN", () => {
    expect(batteryPercent(3600, 3500, 3700)).toBe(0);
  });
});
