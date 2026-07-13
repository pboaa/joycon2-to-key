import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IconBan } from "@tabler/icons-react";
import type { AccentColor } from "../../lib/joyconColors";
import { sameColor, deepenMapColor } from "../../lib/joyconColors";
import { ModalShell } from "../ui/ModalShell";
import { TextInput } from "../ui/TextInput";
import { Button } from "../ui/Button";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/** A visual swatch-grid color picker, opened from a ColorRow. Replaces the long
 * preset dropdown (which overflowed as the palette grew): all presets are shown
 * at once as labelled swatches, plus a manual #rrggbb field for custom colors.
 * Stacks over the settings modal (z=60). */
export function ColorPickerModal({
  title,
  value,
  presets,
  onPick,
  onClose,
  onClear,
  clearLabel,
  deepen = false,
}: {
  title: string;
  value: string;
  presets: AccentColor[];
  onPick: (hex: string) => void;
  onClose: () => void;
  /** When set, a leading "no colour / default" swatch is shown that calls this
   * (and closes). For optional colours like a saved operation's tint. */
  onClear?: () => void;
  /** Label under the clear swatch (defaults to "既定"). */
  clearLabel?: string;
  /** Show swatches in the deepened colour actually drawn on the figure (used for
   * the assigned-button colour), so the preview matches the result. */
  deepen?: boolean;
}) {
  const { t } = useTranslation();
  const [hex, setHex] = useState(value);
  const validHex = HEX_RE.test(hex.trim());
  const shown = (h: string) => (deepen ? deepenMapColor(h) : h);
  const choose = (h: string) => {
    onPick(h);
    onClose();
  };
  const commitHex = () => {
    if (validHex) choose(hex.trim());
  };

  return (
    <ModalShell title={title} onClose={onClose} width="w-[360px]" z={60}>
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {onClear && (
            <button
              onClick={() => {
                onClear();
                onClose();
              }}
              data-tip={clearLabel ?? t("既定の色")}
              className={
                "flex flex-col items-center gap-1 rounded-row border p-2 transition-colors " +
                (!value ? "border-accent bg-accent/10" : "border-border hover:bg-bg3")
              }
            >
              <span className="w-8 h-8 rounded-full border border-border shrink-0 inline-flex items-center justify-center text-text3">
                <IconBan size={16} aria-hidden />
              </span>
              <span className="text-caption text-text2 text-center leading-tight">
                {clearLabel ?? t("既定")}
              </span>
            </button>
          )}
          {presets.map((c) => {
            const on = sameColor(c.hex, value);
            return (
              <button
                key={c.hex}
                onClick={() => choose(c.hex)}
                data-tip={c.hex}
                className={
                  "flex flex-col items-center gap-1 rounded-row border p-2 transition-colors " +
                  (on ? "border-accent bg-accent/10" : "border-border hover:bg-bg3")
                }
              >
                <span
                  className="w-8 h-8 rounded-full border border-border shrink-0"
                  style={{ background: shown(c.hex) }}
                />
                <span className="text-caption text-text2 text-center leading-tight">
                  {t(c.label)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 border-t border-border pt-2.5">
          <span
            className="w-6 h-6 rounded-row border border-border shrink-0"
            style={{ background: validHex ? shown(hex.trim()) : "transparent" }}
          />
          <TextInput
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitHex();
            }}
            placeholder="#rrggbb"
            mono
            size="sm"
            fullWidth={false}
            className="flex-1"
          />
          <Button variant="primary" size="xs" onClick={commitHex} disabled={!validHex}>
            {t("適用")}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
