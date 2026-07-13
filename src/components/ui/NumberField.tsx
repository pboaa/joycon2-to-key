import { useState } from "react";
import { TextInput } from "./TextInput";

/**
 * A number input that lets you type freely and only rounds/clamps to [min, max]
 * when you commit (blur or Enter) — not on every keystroke, so intermediate
 * values are editable. Empty commits call `onClear` if given, else are ignored.
 * The single number-input used across the app for a consistent feel.
 */
export function NumberField({
  value,
  min,
  max,
  step = 1,
  onChange,
  onClear,
  tip,
  className,
  placeholder,
}: {
  value: number | null | undefined;
  min?: number;
  max?: number;
  /** Wheel/arrow step (default 1). Shift multiplies by 10. */
  step?: number;
  onChange: (v: number) => void;
  /** Called when the field is committed empty (e.g. "off" / "default"). */
  onClear?: () => void;
  tip?: string;
  className?: string;
  placeholder?: string;
}) {
  // While editing, the raw string lives here so typing isn't clamped mid-way.
  // `null` means "not editing" → show the prop value.
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (value == null ? "" : String(value));

  const clamp = (n: number) => {
    let v = Math.round(n);
    if (min != null) v = Math.max(min, v);
    if (max != null) v = Math.min(max, v);
    return v;
  };

  const commit = () => {
    if (draft === null) return;
    const t = draft.trim();
    if (t === "") {
      onClear?.();
    } else {
      const n = Number(t);
      if (!Number.isNaN(n)) onChange(clamp(n));
    }
    setDraft(null);
  };

  // Nudge by ±step (Shift ×10) from the current shown value. Used by wheel and
  // ↑/↓ so a focused field can be dialled in without retyping.
  const nudge = (dir: 1 | -1, shift: boolean) => {
    const cur = draft != null ? Number(draft) : value;
    if (cur == null || Number.isNaN(cur)) return;
    onChange(clamp(cur + dir * step * (shift ? 10 : 1)));
    setDraft(null);
  };

  return (
    <TextInput
      type="text"
      inputMode="numeric"
      value={shown}
      placeholder={placeholder}
      data-tip={tip}
      mono
      fullWidth={false}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      // Only when focused, so scrolling past a field doesn't change it.
      onWheel={(e) => {
        if (document.activeElement !== e.currentTarget) return;
        e.preventDefault();
        nudge(e.deltaY < 0 ? 1 : -1, e.shiftKey);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        else if (e.key === "ArrowUp") {
          e.preventDefault();
          nudge(1, e.shiftKey);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          nudge(-1, e.shiftKey);
        }
      }}
      className={"text-right " + (className ?? "")}
    />
  );
}
