// Pure helpers shared by the input editors (InputCommandEditor) and the
// single-command field. Maps an InputCommand to/from the KeyPicker's string
// sentinels and a readable label. No JSX here so any editor can import it
// without a component-cycle.
import {
  DEFAULT_GLOBAL_SETTINGS,
  type Definition,
  type InputCommand,
} from "../../lib/types";
import { keyGlyph } from "../../lib/keyCatalog";
import i18n from "../../lib/i18n";

/** Readable label for a command's picker button (keyboard / mouse / …). Uses
 * i18n.t directly (no hook) since these are pure helpers; components that show
 * these re-render on language change and re-call this. */
export function inputLabel(cmd: InputCommand): string {
  const t = i18n.t.bind(i18n);
  switch (cmd.type) {
    case "keyboard":
      // Symbol keys show their glyph alone (":" for Semicolon); other keys keep
      // their name.
      return keyGlyph(cmd.value) ?? (cmd.value || t("キー"));
    case "mouseButton": {
      const b =
        cmd.value === "left" ? t("左") : cmd.value === "right" ? t("右") : t("中");
      return cmd.double
        ? t("{{btn}}ダブルクリック", { btn: b })
        : t("{{btn}}クリック", { btn: b });
    }
    case "scroll":
      return cmd.value === "up" ? t("スクロール↑") : t("スクロール↓");
    case "def":
      return t("操作");
  }
}

/** Command → the picker's string value (keyboard name or a pointer sentinel). */
export function commandToPickerValue(cmd: InputCommand): string {
  switch (cmd.type) {
    case "keyboard":
      return cmd.value;
    case "mouseButton":
      return (cmd.double ? "dbl:" : "mouse:") + cmd.value;
    case "scroll":
      return `scroll:${cmd.value}:${cmd.amount ?? DEFAULT_GLOBAL_SETTINGS.scrollAmount}`;
    case "def":
      return "";
  }
}

/** The picker's chosen value → a command (keeps a scroll's amount when re-picked). */
export function pickerValueToCommand(v: string, prev: InputCommand): InputCommand {
  if (v.startsWith("mouse:")) {
    return {
      type: "mouseButton",
      value: v.slice("mouse:".length) as "left" | "right" | "middle",
    };
  }
  if (v.startsWith("dbl:")) {
    return {
      type: "mouseButton",
      value: v.slice("dbl:".length) as "left" | "right" | "middle",
      double: true,
    };
  }
  if (v.startsWith("scroll:")) {
    // scroll:<dir>[:amount]
    const [, dir, amt] = v.split(":");
    return {
      type: "scroll",
      value: dir as "up" | "down",
      amount: amt
        ? Number(amt)
        : prev.type === "scroll"
          ? prev.amount
          : DEFAULT_GLOBAL_SETTINGS.scrollAmount,
    };
  }
  return { type: "keyboard", value: v };
}

/** A definition that can be assigned to a pie direction (fires its inputs). Only
 * input-type definitions qualify — a direction fires inputs, not a nested pie. */
export const isInputDef = (d: Definition): boolean =>
  d.press.type === "input" && d.press.inputs.length > 0;

/** Readable one-line summary of a whole input list (simultaneous press), joined
 * with " + ". Definition references resolve to the def's name. Used by the
 * collapsed "prominent input" button. */
export function inputsSummary(
  inputs: InputCommand[],
  definitions?: Definition[],
): string {
  const t = i18n.t.bind(i18n);
  return inputs
    .map((c) => {
      if (c.type === "def") {
        const d = definitions?.find((x) => x.id === c.def);
        return d ? d.name || t("(名前なし)") : t("（削除済みの操作）");
      }
      return inputLabel(c);
    })
    .join(" + ");
}
