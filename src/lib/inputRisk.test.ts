import { describe, expect, it } from "vitest";
import type { InputCommand } from "./types";
import { analyzeInputs } from "./inputRisk";

const kb = (value: string): InputCommand => ({ type: "keyboard", value });
const def = (id: string): InputCommand => ({ type: "def", def: id });

describe("analyzeInputs", () => {
  it("flags the Windows key as danger", () => {
    const r = analyzeInputs([kb("Win"), kb("R")]);
    expect(r.level).toBe("danger");
    expect(r.reasons.length).toBeGreaterThan(0);
  });

  it("treats a plain chord (Ctrl+C) as no risk", () => {
    expect(analyzeInputs([kb("Ctrl"), kb("C")]).level).toBe("none");
  });

  it("flags typing several characters as caution", () => {
    expect(analyzeInputs([kb("H"), kb("I"), kb("A")]).level).toBe("caution");
  });

  it("flags characters followed by Enter as caution", () => {
    expect(analyzeInputs([kb("A"), kb("Enter")]).level).toBe("caution");
  });

  it("inherits risk through a def reference", () => {
    const resolve = (id: string) => (id === "d1" ? [kb("Win")] : undefined);
    const r = analyzeInputs([def("d1")], resolve);
    expect(r.level).toBe("danger");
  });

  it("does not loop on a self-referential def", () => {
    const resolve = (id: string): InputCommand[] => [def(id)]; // d → d …
    const r = analyzeInputs([def("d")], resolve);
    expect(r.level).toBe("none"); // no key primitives, and it terminates
  });
});
