import type { PressConfig, PressType } from "./types";
import { createPress } from "./config/press";

/**
 * Session-only cache of the last press config seen for each press type, per
 * button-editing slot. Switching a button's type (key input / layer /
 * pie) replaces its press with a fresh default, which would throw away
 * the previous type's data; this keeps it in memory so switching back restores
 * it. Deliberately NOT persisted — it's cleared on app restart (workspace.json
 * only ever holds the button's current type).
 */
const cache = new Map<string, Partial<Record<PressType, PressConfig>>>();

/** Remember `press` under its type for `key` (no-op for the draft `none`). */
export function stashPress(key: string, press: PressConfig): void {
  if (press.type === "none") return;
  const slot = cache.get(key) ?? {};
  slot[press.type] = press;
  cache.set(key, slot);
}

/** The last press stashed for `key` of `type`, if any. */
export function recallPress(
  key: string,
  type: PressType,
): PressConfig | undefined {
  return cache.get(key)?.[type];
}

/** Switch a press to a new type, keeping the outgoing type's data in memory and
 * restoring the target type's if it was seen before (else a fresh default). The
 * display name (`label`) carries across. Shared by the button editor and the
 * definition editor. No-op when the type is unchanged. */
export function switchPressType(params: {
  /** Cache slot id (button or definition). */
  key: string;
  current: PressConfig;
  to: PressType;
  createOpts: { btnKey?: string; layerOptions: string[] };
  onChange: (p: PressConfig) => void;
}): void {
  const { key, current, to, createOpts, onChange } = params;
  if (to === current.type) return;
  stashPress(key, current);
  const base = recallPress(key, to) ?? createPress(to, createOpts);
  onChange({ ...base, label: current.label } as PressConfig);
}
