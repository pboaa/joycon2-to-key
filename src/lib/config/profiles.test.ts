import { describe, expect, it } from "vitest";
import type { AppConfig } from "../types";
import {
  addProfile,
  deleteProfile,
  isDefaultProfile,
  pinDefaultFirst,
  renameProfile,
  reorderProfiles,
  setIcon,
  setMatchApps,
} from "./profiles";

function base(): AppConfig {
  return {
    デフォルト: { matchApps: [], initialLayer: "デフォルト", layers: { デフォルト: { buttons: {} } } },
  };
}

describe("isDefaultProfile / pinDefaultFirst", () => {
  it("recognizes both default names", () => {
    expect(isDefaultProfile("デフォルト")).toBe(true);
    expect(isDefaultProfile("default")).toBe(true);
    expect(isDefaultProfile("chrome.exe")).toBe(false);
  });
  it("pins the default profile to the front", () => {
    expect(pinDefaultFirst(["a", "デフォルト", "b"])).toEqual([
      "デフォルト",
      "a",
      "b",
    ]);
  });
});

describe("addProfile", () => {
  it("adds a profile with a single base layer and the given match apps", () => {
    const next = addProfile(base(), "chrome", ["chrome.exe"]);
    expect(next).not.toBeNull();
    expect(next!["chrome"].matchApps).toEqual(["chrome.exe"]);
    expect(next!["chrome"].initialLayer).toBe("メイン");
    expect(Object.keys(next!["chrome"].layers)).toEqual(["メイン"]);
  });
  it("returns null on a duplicate name", () => {
    expect(addProfile(base(), "デフォルト")).toBeNull();
  });
});

describe("setMatchApps / setIcon", () => {
  it("replaces match apps", () => {
    const next = setMatchApps(base(), "デフォルト", ["a.exe"]);
    expect(next!["デフォルト"].matchApps).toEqual(["a.exe"]);
  });
  it("sets then clears an icon", () => {
    const withIcon = setIcon(base(), "デフォルト", "data:png");
    expect(withIcon!["デフォルト"].icon).toBe("data:png");
    const cleared = setIcon(withIcon!, "デフォルト", undefined);
    expect("icon" in cleared!["デフォルト"]).toBe(false);
  });
  it("returns null for an unknown profile", () => {
    expect(setMatchApps(base(), "ghost", [])).toBeNull();
  });
});

describe("deleteProfile", () => {
  it("refuses to delete the default profile", () => {
    expect(deleteProfile(base(), "デフォルト")).toBeNull();
  });
  it("deletes a non-default profile", () => {
    const cfg = addProfile(base(), "chrome")!;
    const next = deleteProfile(cfg, "chrome");
    expect(next).not.toBeNull();
    expect("chrome" in next!).toBe(false);
  });
});

describe("renameProfile", () => {
  it("renames while preserving key order", () => {
    const cfg = addProfile(base(), "chrome")!;
    const next = renameProfile(cfg, "chrome", "firefox");
    expect(Object.keys(next!)).toEqual(["デフォルト", "firefox"]);
  });
  it("returns null when the new name is taken", () => {
    const cfg = addProfile(base(), "chrome")!;
    expect(renameProfile(cfg, "chrome", "デフォルト")).toBeNull();
  });
});

describe("reorderProfiles", () => {
  it("keeps the default pinned first regardless of requested order", () => {
    const cfg = addProfile(addProfile(base(), "a")!, "b")!;
    const next = reorderProfiles(cfg, ["b", "a", "デフォルト"]);
    expect(Object.keys(next)).toEqual(["デフォルト", "b", "a"]);
  });
});
