import { useTranslation } from "react-i18next";
import type { InputCommand } from "../../../lib/types";
import { ToggleChip } from "../../ui/Chip";

/** Modifier keys that can be held by a combination button / momentary layer
 * (the only kind of "held" input that is useful — see the field's tip). */
const MODIFIER_KEYS = ["Ctrl", "Shift", "Alt", "Win"];

/** Toggle chips for the modifier keys held while a button/layer is active.
 * Operates on an InputCommand[] (non-modifier inputs are preserved). */
export function HeldModifierKeys({
  inputs,
  onChange,
}: {
  inputs: InputCommand[];
  onChange: (next: InputCommand[]) => void;
}) {
  const { t } = useTranslation();
  const held = new Set(
    inputs
      .filter(
        (c): c is Extract<InputCommand, { type: "keyboard" }> =>
          c.type === "keyboard" && MODIFIER_KEYS.includes(c.value),
      )
      .map((c) => c.value),
  );
  const toggle = (m: string) => {
    const others = inputs.filter(
      (c) => !(c.type === "keyboard" && c.value === m),
    );
    onChange(
      held.has(m) ? others : [...others, { type: "keyboard", value: m }],
    );
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {MODIFIER_KEYS.map((m) => (
        <ToggleChip
          key={m}
          on={held.has(m)}
          onClick={() => toggle(m)}
          className="h-8 px-3 text-label rounded-row inline-flex items-center"
        >
          {m}
        </ToggleChip>
      ))}
      {held.size === 0 && (
        <span className="ml-1 text-label text-text3">{t("なし")}</span>
      )}
    </div>
  );
}
