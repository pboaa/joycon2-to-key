import { describe, expect, it } from "vitest";
import { fillFirst } from "./press";
import type { InputCommand } from "../types";

const key = (v: string): InputCommand => ({ type: "keyboard", value: v });

describe("fillFirst", () => {
  it("moves empty directions to the end, keeping filled ones", () => {
    const A = [key("a")];
    const B = [key("b")];
    expect(fillFirst([[], A, [], B, []])).toEqual([A, B, [], [], []]);
  });
  it("preserves the order among filled directions", () => {
    const A = [key("a")];
    const B = [key("b")];
    const C = [key("c")];
    expect(fillFirst([A, [], B, C])).toEqual([A, B, C, []]);
  });
  it("is a no-op when everything is filled", () => {
    const A = [key("a")];
    const B = [key("b")];
    expect(fillFirst([A, B])).toEqual([A, B]);
  });
});
