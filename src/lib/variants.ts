// Variant helpers shared by the SVG view and the editor.

import type { ButtonAssignment, InputCommand, PressConfig } from "./types";
import { keyGlyph } from "./keyCatalog";
import i18n from "./i18n";

/** Keys treated as "modifiers" for layer inheritance (mirrors HeldModifierKeys
 * and the Rust MODIFIER_KEYS). */
const MODIFIER_KEYS = ["Ctrl", "Shift", "Alt", "Win"];

/** True when a press holds a modifier while the button is down: a `layerHold`,
 * or a hold/toggle `input` made up only of modifier keys. */
function holdsModifier(press: PressConfig): boolean {
  if (press.type === "layerHold") return true;
  if (press.type === "input") {
    const mode = press.mode ?? "tap";
    return (
      (mode === "hold" || mode === "toggle") &&
      press.inputs.length > 0 &&
      press.inputs.every(
        (c) => c.type === "keyboard" && MODIFIER_KEYS.includes(c.value),
      )
    );
  }
  return false;
}

/** Whether a button carries into a child layer under the "modifiers" inherit
 * mode: its assignment holds a modifier (see {@link holdsModifier}), so hold-to-
 * switch and modifier-holding buttons keep working in every layer. */
export function inheritsUnderModifiers(assignment: ButtonAssignment): boolean {
  return holdsModifier(assignment.press);
}

/** Resolve a definition id to its display name, when a resolver is provided. */
type ResolveDefName = (id: string) => string | undefined;

function commandLabel(c: InputCommand, resolveDefName?: ResolveDefName): string {
  switch (c.type) {
    case "keyboard":
      // Symbol keys show their glyph (": " for Semicolon) so they're readable in
      // the compact figure/list labels; other keys keep their name.
      return keyGlyph(c.value) ?? c.value;
    case "mouseButton":
      return `M:${c.value}${c.double ? "×2" : ""}`;
    case "scroll":
      return c.value === "up" ? "⇡" : "⇣";
    case "def":
      // A reference to a saved operation. This is a plain text label (used in
      // list previews / pie slices), so no icon — just the operation's name.
      return resolveDefName?.(c.def) || i18n.t("操作");
  }
}

/** Short label for a list of input commands. Pass `resolveDefName` to show a
 * referenced definition's name instead of the generic "operation". */
export function inputsLabel(inputs: InputCommand[], resolveDefName?: ResolveDefName): string {
  return inputs.map((c) => commandLabel(c, resolveDefName)).join("+");
}

/** Short human label for a press, for display on the Joy-Con face. */
export function shortLabel(press: PressConfig): string {
  if (press.label) return press.label;
  switch (press.type) {
    case "none":
      return "";
    case "input":
      return inputsLabel(press.inputs) || "—";
    case "pie":
      return i18n.t("パイ");
    case "layerHold": {
      // A layer that's switched only while held. If there are modifier keys
      // (inputs) to hold, label it as "modifier + switched layer".
      const held = inputsLabel(press.inputs ?? []);
      const layer = press.layer || i18n.t("レイヤー");
      return held ? `${held}+⇩${layer}` : `⇩${layer}`;
    }
  }
}

/** Human-readable "what this button is assigned to" for the Stats header: a saved
 * operation's name if linked, else the keys it fires (pie menu for pies).
 * Empty string = unassigned (none). */
export function assignmentLabel(
  press: PressConfig | null,
  defId: string | undefined,
  resolveName: (id: string) => string | undefined,
): string {
  if (defId) return resolveName(defId) || i18n.t("操作");
  if (!press) return "";
  switch (press.type) {
    case "none":
      return "";
    case "pie":
      return i18n.t("パイメニュー");
    case "input":
      return inputsLabel(press.inputs, resolveName) || "—";
    case "layerHold":
      return shortLabel(press);
  }
}
