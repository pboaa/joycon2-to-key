import { describe, expect, it } from "vitest";
import { moveIndex, reorderRecord, reorderById } from "./reorder";

describe("moveIndex", () => {
  it("moves an element forward", () => {
    expect(moveIndex(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
  });
  it("moves an element backward", () => {
    expect(moveIndex(["a", "b", "c", "d"], 3, 1)).toEqual(["a", "d", "b", "c"]);
  });
  it("does not mutate the input", () => {
    const src = ["a", "b", "c"];
    moveIndex(src, 0, 2);
    expect(src).toEqual(["a", "b", "c"]);
  });
});

describe("reorderRecord", () => {
  it("rebuilds a record in the given key order", () => {
    const rec = { a: 1, b: 2, c: 3 };
    expect(Object.keys(reorderRecord(rec, ["c", "a", "b"]))).toEqual([
      "c",
      "a",
      "b",
    ]);
  });
  it("drops keys missing from the order and skips unknown order keys", () => {
    const rec = { a: 1, b: 2 };
    const out = reorderRecord(rec, ["b", "ghost"]);
    expect(out).toEqual({ b: 2 });
  });
});

describe("reorderById", () => {
  const idOf = (x: { id: string }) => x.id;
  it("orders named items and appends the rest keeping relative order", () => {
    const items = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const out = reorderById(items, ["c"], idOf);
    expect(out.map(idOf)).toEqual(["c", "a", "b"]);
  });
  it("ignores ids not present in items", () => {
    const items = [{ id: "a" }, { id: "b" }];
    const out = reorderById(items, ["ghost", "b"], idOf);
    expect(out.map(idOf)).toEqual(["b", "a"]);
  });
});
