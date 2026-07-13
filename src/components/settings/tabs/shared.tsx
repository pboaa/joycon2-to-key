// Shared primitives for the settings tabs: the labelled setting row, the
// preview-select row, the number/colour field wrappers, the reset helper, and
// the option lists. Each tab lives in its own file and pulls what it needs here.
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconPlayerPlay, IconRotate } from "@tabler/icons-react";
import type { GlobalSettings, ThemeMode } from "../../../lib/types";
import { DEFAULT_GLOBAL_SETTINGS } from "../../../lib/types";
import { testVibrate } from "../../../lib/tauri";
import { THEMES } from "../../../lib/themes";
import { sameColor, deepenMapColor } from "../../../lib/joyconColors";
import { ColorPickerModal } from "../ColorPickerModal";
import { Button } from "../../ui/Button";
import { Select } from "../../ui/Select";
import { NumberField } from "../../ui/NumberField";

/** Apply a partial patch to the global settings. */
export type SetGlobal = (patch: Partial<GlobalSettings>) => void;

/** Uniform width for the settings dropdowns / colour buttons so the column of
 * controls lines up instead of jumping with each option's text length. */
export const CTRL_W = "w-40";

export interface RowReset {
  /** True when the value differs from its default (the ↺ is enabled). */
  canReset: boolean;
  onReset: () => void;
}

/** Build a RowReset from a current/default value pair (`===` compare). Shared by
 * the settings tabs (via {@link useRowReset}) and the per-pie style panel. */
export const makeReset = (
  cur: unknown,
  def: unknown,
  onReset: () => void,
): RowReset => ({ canReset: cur !== def, onReset });

/** Same as {@link makeReset} but compares colours with {@link sameColor} (so
 * `#FFF` vs `#ffffff` don't count as different). */
export const makeColorReset = (
  cur: string,
  def: string,
  onReset: () => void,
): RowReset => ({ canReset: !sameColor(cur, def), onReset });

/** Reset controls for a setting key. The ↺ is always rendered (so rows don't
 * shift) but disabled while the value is already at its default. */
export function useRowReset(settings: GlobalSettings, setG: SetGlobal) {
  return (key: keyof GlobalSettings): RowReset => {
    const def = DEFAULT_GLOBAL_SETTINGS[key];
    return makeReset(settings[key], def, () =>
      setG({ [key]: def } as Partial<GlobalSettings>),
    );
  };
}

export const IDLE_OPTIONS = [
  { secs: 180, label: "3分" },
  { secs: 300, label: "5分" },
  { secs: 600, label: "10分" },
  { secs: 900, label: "15分" },
  { secs: 1800, label: "30分" },
  { secs: 3600, label: "1時間" },
];

// Derived from the theme registry (+ the built-in "system"), so adding a theme
// needs no change here.
export const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "system", label: "システムに合わせる" },
  ...THEMES.map((t) => ({ value: t.id, label: t.label })),
];

// Explicit enumeration: the label is the translation key as-is. Building a key
// dynamically (`パターン${n}`) would produce a t() key that doesn't exist (not
// translated to English, and orphan detection wouldn't work), so keep them as literals.
export const VIBRATION_OPTIONS = [
  { value: 0, label: "なし" },
  { value: 1, label: "パターン1" },
  { value: 2, label: "パターン2" },
  { value: 3, label: "パターン3" },
  { value: 4, label: "パターン4" },
  { value: 5, label: "パターン5" },
  { value: 6, label: "パターン6" },
  { value: 7, label: "パターン7" },
];

/** Play a built-in vibration sample (1–7); 0 = none is a no-op. */
export const buzzSample = (v: number) => {
  if (v > 0) void testVibrate({ sample: v });
};

/** A settings row: label on the left, control on the right. If `onReset` is given
 * (= it differs from the default), a ↺ appears on the right edge to reset it individually. */
export function SettingRow({
  label,
  hint,
  reset,
  children,
}: {
  label: ReactNode;
  hint?: string;
  /** When provided, an always-visible ↺ (disabled while at default). */
  reset?: RowReset;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-body text-text min-w-0">
        {typeof label === "string" ? t(label) : label}
        {hint && <span className="ml-1 text-caption text-text3">{t(hint)}</span>}
      </span>
      <div className="shrink-0 flex items-center gap-1">
        {children}
        {/* Always-present fixed-width slot so every row's control lines up on the
            right, whether or not it has a reset: ↺ / 既定 / (empty). */}
        <span className="w-8 shrink-0 text-right leading-none">
          {reset ? (
            reset.canReset ? (
              <button
                onClick={reset.onReset}
                data-tip={t("この項目を既定に戻す")}
                aria-label={t("この項目を既定に戻す")}
                className="px-0.5 text-text3 hover:text-accent inline-flex items-center justify-end w-full"
              >
                <IconRotate size={12} aria-hidden />
              </button>
            ) : (
              <span className="text-micro text-text3/60">{t("既定")}</span>
            )
          ) : null}
        </span>
      </div>
    </div>
  );
}

/** The body of an accordion that wraps dependent settings hanging under a gate
 * (prerequisite) toggle, with a left rule + indent. Rendered only when `show` (=
 * the parent toggle is on), visually indicating those settings depend on the toggle
 * above. The contents can be rows or cards. */
export function NestedSettings({
  show,
  children,
}: {
  show: boolean;
  children: ReactNode;
}) {
  if (!show) return null;
  return (
    <div className="ml-0.5 pl-3 border-l-2 border-accent/30 flex flex-col gap-3">
      {children}
    </div>
  );
}

/** A labelled select whose value can be previewed: choosing an option previews
 * it and the ▶ button replays the current one. Shared by the connect/disconnect
 * sound cues and the connect vibration. */
export function PreviewSelectRow<T extends string | number>({
  label,
  hint,
  value,
  options,
  onChange,
  onPreview,
  previewDisabled,
  previewTip,
  reset,
}: {
  label: string;
  hint?: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
  onPreview: (v: T) => void;
  previewDisabled?: boolean;
  previewTip: string;
  reset?: RowReset;
}) {
  const { t } = useTranslation();
  // Recover the option's typed value (string or number) from the select's string.
  const pick = (raw: string) => {
    const opt = options.find((o) => String(o.value) === raw);
    if (!opt) return;
    onChange(opt.value);
    onPreview(opt.value);
  };
  return (
    <SettingRow label={label} hint={hint} reset={reset}>
      <span className="inline-flex items-center gap-1">
        <Select value={value} onChange={(e) => pick(e.target.value)} fullWidth={false} className={CTRL_W}>
          {options.map((o) => (
            <option key={String(o.value)} value={o.value}>
              {t(o.label)}
            </option>
          ))}
        </Select>
        <Button
          size="xs"
          onClick={() => onPreview(value)}
          disabled={previewDisabled}
          data-tip={t(previewTip)}
          aria-label={t(previewTip)}
          className="inline-flex items-center"
        >
          <IconPlayerPlay size={12} aria-hidden />
        </Button>
      </span>
    </SettingRow>
  );
}

/** Thin wrapper over the shared NumberField with this modal's field width. */
export function NumField(props: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return <NumberField {...props} className="w-20" />;
}

/** A number field flanked by step buttons: −− / − / [n] / ＋ / ＋＋, where −−/＋＋
 * step by ×10. Replaces the range slider (whose drag was eaten by the window
 * drag-scroll), so bounded values are set by clicking rather than dragging. */
export function NumSlider({
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  const set = (delta: number) => onChange(clamp(value + delta));
  const btn =
    "px-1.5 h-7 shrink-0 inline-flex items-center justify-center rounded-row border border-border text-text2 leading-none font-medium hover:bg-bg3 hover:text-accent disabled:opacity-40 text-caption tabular-nums";
  return (
    <span className="inline-flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => set(-step * 10)}
        disabled={value <= min}
        data-tip={`−${step * 10}`}
        className={btn}
      >
        −−
      </button>
      <button
        type="button"
        onClick={() => set(-step)}
        disabled={value <= min}
        data-tip={`−${step}`}
        className={btn}
      >
        −
      </button>
      <NumField value={value} min={min} max={max} step={step} onChange={onChange} />
      <button
        type="button"
        onClick={() => set(step)}
        disabled={value >= max}
        data-tip={`＋${step}`}
        className={btn}
      >
        ＋
      </button>
      <button
        type="button"
        onClick={() => set(step * 10)}
        disabled={value >= max}
        data-tip={`＋${step * 10}`}
        className={btn}
      >
        ＋＋
      </button>
    </span>
  );
}

/** A color picker row: a swatch button that opens the visual swatch-grid modal
 * (the old preset dropdown grew too long as the palette expanded). */
export function ColorRow({
  label,
  value,
  presets,
  onChange,
  reset,
  deepen = false,
}: {
  label: string;
  value: string;
  presets: { label: string; hex: string }[];
  onChange: (hex: string) => void;
  reset?: RowReset;
  /** Show the swatch in the deepened colour actually drawn on the figure (used
   * for the assigned-button colour). */
  deepen?: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = presets.find((c) => sameColor(c.hex, value));
  return (
    <SettingRow label={label} reset={reset}>
      <button
        onClick={() => setOpen(true)}
        data-tip={t("色を選ぶ")}
        className={`${CTRL_W} inline-flex items-center gap-1.5 rounded-row border border-border px-2 py-1 text-body hover:bg-bg3`}
      >
        <span
          className="w-4 h-4 rounded-full border border-border shrink-0"
          style={{ background: deepen ? deepenMapColor(value) : value }}
        />
        <span className="text-text2 truncate flex-1 text-left">
          {current ? t(current.label) : value}
        </span>
        <span className="text-text3 text-micro shrink-0">▾</span>
      </button>
      {open && (
        <ColorPickerModal
          title={label}
          value={value}
          presets={presets}
          onPick={onChange}
          onClose={() => setOpen(false)}
          deepen={deepen}
        />
      )}
    </SettingRow>
  );
}
