// Heuristic risk analysis for input macros. The app synthesizes keyboard/mouse
// input (only allow-listed virtual keys — no shell/exec, no arbitrary-text
// typing), and each action fires as a single chord (all keys down, then up), so
// a button can't run a full "open Run → type → Enter" sequence on its own. But a
// shared/imported config *is* effectively a macro: a button press can still send
// system chords (Win+…, Alt+F4, Delete, …) or type characters. A definition's
// name is attacker-controlled and can lie about its contents, so we analyze the
// resolved key list, not the name. This module flags the primitives an importer
// should eyeball; it can't prove intent, only surface risk.

import type {
  Definition,
  InputCommand,
  PieSlice,
  PressConfig,
  WorkspaceFile,
} from "./types";
import { isDefRef } from "./defRef";

export type RiskLevel = "none" | "caution" | "danger";

export interface RiskResult {
  level: RiskLevel;
  /** i18n source keys describing why it was flagged (deduped, order-stable). */
  reasons: string[];
}

/** Windows/Meta key names — a gateway to Start / the Run dialog. */
const META_KEYS = new Set(["Win", "Windows", "LWin", "LeftWin", "RWin", "RightWin"]);
/** A keyboard value that types a single character. */
const isCharKey = (v: string) => /^[0-9A-Za-z]$/.test(v);
const isEnter = (v: string) => v === "Enter" || v === "Return";

const RANK: Record<RiskLevel, number> = { none: 0, caution: 1, danger: 2 };
const worse = (a: RiskLevel, b: RiskLevel): RiskLevel => (RANK[a] >= RANK[b] ? a : b);

/** Analyze one action's input list (a chord). `resolve` expands a `def`
 * reference to that definition's inputs; `seen` stops reference cycles. */
export function analyzeInputs(
  inputs: InputCommand[] | undefined,
  resolve?: (defId: string) => InputCommand[] | undefined,
  seen: ReadonlySet<string> = new Set(),
): RiskResult {
  const reasons = new Set<string>();
  let level: RiskLevel = "none";
  let charKeys = 0;
  let enter = false;

  for (const cmd of inputs ?? []) {
    if (cmd.type === "keyboard") {
      if (META_KEYS.has(cmd.value)) {
        level = worse(level, "danger");
        reasons.add("Windowsキーを含む（スタート／「ファイル名を指定して実行」を開ける）");
      }
      if (isEnter(cmd.value)) enter = true;
      if (isCharKey(cmd.value)) charKeys++;
    } else if (isDefRef(cmd)) {
      if (cmd.def && resolve && !seen.has(cmd.def)) {
        const child = resolve(cmd.def);
        const r = analyzeInputs(child, resolve, new Set(seen).add(cmd.def));
        level = worse(level, r.level);
        r.reasons.forEach((x) => reasons.add(x));
      }
    }
  }
  if (charKeys >= 3) {
    level = worse(level, "caution");
    reasons.add("複数の文字キーを送出（文章を打ち込める）");
  }
  if (enter && charKeys >= 1) {
    level = worse(level, "caution");
    reasons.add("文字入力のあとに Enter（入力して確定）");
  }
  return { level, reasons: [...reasons] };
}

/** The input list(s) a press fires. `def` presses (definition library entries)
 * are usually `input`; pies fan out to each slice + the centre. */
function forEachPressAction(
  press: PressConfig,
  cb: (subLabel: string, inputs: InputCommand[]) => void,
): void {
  switch (press.type) {
    case "input":
      cb("", press.inputs ?? []);
      break;
    case "layerHold":
      if (press.inputs?.length) cb("", press.inputs);
      break;
    case "pie":
      forEachPieActions(press.slices, press.center, cb);
      break;
    // "none": nothing to fire.
  }
}

function forEachPieActions(
  slices: PieSlice[] | undefined,
  center: InputCommand[] | undefined,
  cb: (subLabel: string, inputs: InputCommand[]) => void,
): void {
  (slices ?? []).forEach((s, i) => cb(`方向${i + 1}`, s.inputs ?? []));
  if (center?.length) cb("中央", center);
}

/** Flatten a press to the inputs it fires (used to expand `def` references). */
function pressInputs(press: PressConfig): InputCommand[] {
  switch (press.type) {
    case "input":
    case "layerHold":
      return press.inputs ?? [];
    case "pie":
      return [
        ...(press.slices ?? []).flatMap((s) => s.inputs ?? []),
        ...(press.center ?? []),
      ];
    default:
      return [];
  }
}

/** A `def`-id → inputs resolver over a definition library, for {@link
 * analyzeInputs} / {@link pressRisk} so nested references are analyzed too. */
export function makeInputResolver(
  definitions?: Definition[],
): (defId: string) => InputCommand[] | undefined {
  return (id) => {
    const d = definitions?.find((x) => x.id === id);
    return d ? pressInputs(d.press) : undefined;
  };
}

/** Worst risk across every action a press fires (a pie's slices, etc.). */
export function pressRisk(
  press: PressConfig,
  resolve?: (defId: string) => InputCommand[] | undefined,
): RiskResult {
  let level: RiskLevel = "none";
  const reasons = new Set<string>();
  forEachPressAction(press, (_sub, inputs) => {
    const r = analyzeInputs(inputs, resolve);
    level = worse(level, r.level);
    r.reasons.forEach((x) => reasons.add(x));
  });
  return { level, reasons: [...reasons] };
}

/** Worst risk across everything an imported workspace could fire — every
 * definition, every profile button, and every saved pie menu. Used to warn
 * before importing a shared / attacker-supplied backup, since the file's names
 * and definitions are all attacker-controlled. */
export function workspaceRisk(ws: WorkspaceFile): RiskResult {
  const definitions = ws.definitions?.definitions;
  const resolve = makeInputResolver(definitions);
  let level: RiskLevel = "none";
  const reasons = new Set<string>();
  const fold = (r: RiskResult) => {
    level = worse(level, r.level);
    r.reasons.forEach((x) => reasons.add(x));
  };
  for (const d of definitions ?? []) fold(pressRisk(d.press, resolve));
  for (const profile of Object.values(ws.profiles ?? {})) {
    for (const layer of Object.values(profile.layers ?? {})) {
      for (const b of Object.values(layer.buttons ?? {})) fold(pressRisk(b.press, resolve));
    }
  }
  for (const pm of ws.pieMenus ?? []) {
    const inputs = [
      ...(pm.slices ?? []).flatMap((s) => s.inputs ?? []),
      ...(pm.center ?? []),
    ];
    fold(analyzeInputs(inputs, resolve));
  }
  return { level, reasons: [...reasons] };
}

