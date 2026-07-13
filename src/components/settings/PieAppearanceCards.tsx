import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { ACCENT_PRESETS, sameColor } from "../../lib/joyconColors";
import { type PieLookValues, type PresetLook, PIE_COLOR_FIELDS, DEFAULT_LOOK, PIE_PRESETS } from "../../lib/pieLook";
import { Card } from "../ui/Card";
import { Select } from "../ui/Select";
import { Toggle } from "../ui/Toggle";
import { PIE_DESIGNS } from "../PieVisual";
import { ColorRow, CTRL_W, NumSlider, SettingRow, type RowReset } from "./tabs/shared";

/** Background / line colour presets (custom #rrggbb also allowed in the picker). */
export const PIE_BG_PRESETS = [
  { label: "黒", hex: "#101018" },
  { label: "濃紺", hex: "#0d1b2a" },
  { label: "灰", hex: "#2a2a30" },
  { label: "白", hex: "#f0f0f4" },
];
export const PIE_LINE_PRESETS = [
  { label: "白", hex: "#ffffff" },
  { label: "薄灰", hex: "#c8c8d4" },
  { label: "黒", hex: "#101018" },
  { label: "青", hex: "#5a5ae0" },
];

/** Line style options (solid / dashed / dotted), applied to every pie line. */
export const PIE_LINE_STYLES: { value: string; label: string }[] = [
  { value: "solid", label: "実線" },
  { value: "dashed", label: "破線" },
  { value: "dotted", label: "点線" },
];

/** The shared appearance sections (shape/size / colour / label) of the pie overlay,
 * used by both Settings→Pie (global default) and the per-pie style panel, so the two
 * always offer the same controls. Only the rows the chosen design actually uses
 * are shown (e.g. no background for a lines-only design). */
export function PieAppearanceCards({
  look,
  set,
  resetFor,
  nested = false,
}: {
  /** The current (resolved) look values. */
  look: PieLookValues;
  /** Apply a partial change. */
  set: (patch: Partial<PieLookValues>) => void;
  /** ↺ descriptor for a field, or undefined for no reset control. */
  resetFor: (field: keyof PieLookValues) => RowReset | undefined;
  /** Render sections as light framed-less groups (used inside a gate toggle's
   * accordion, so the left indent doesn't straddle separate card frames). */
  nested?: boolean;
}) {
  const { t } = useTranslation();
  const isActive = look.design === "active";
  const isChips = look.design === "chips";
  const usesBg = look.design !== "rays" && look.design !== "fade";
  // Every design draws with the line colour (dividers / ring / spokes, or the
  // active / chip borders), so the line colour + opacity always apply.
  const usesLine = true;
  // active has no highlighted "current wedge" — its single label is the
  // configurable text colour — so the highlight colour is only for the others.
  const usesAccent = !isActive;
  // The label on/off + dots toggles are for the wedge/dot designs; active and
  // chip always show their labels. The text colour itself still applies to all.
  const usesLabels = !isActive && !isChips;
  const usesDividers = look.design === "ring" || look.design === "pie";
  // The threshold (in-place) circle is drawn only by the disc designs (not the
  // spoke-only rays/fade, the active chip, or the chip layout).
  const usesThreshold = usesBg && !isActive && !isChips;

  // Each section is a Card at the top level, or a bare titled group when nested
  // under a gate toggle (no border, so it reads as part of the accordion body).
  const Section = ({ title, children }: { title: string; children: ReactNode }) =>
    nested ? (
      <div className="flex flex-col gap-3">
        <h4 className="text-label font-semibold text-text2">{t(title)}</h4>
        {children}
      </div>
    ) : (
      <Card title={title}>{children}</Card>
    );

  // Most users just pick a preset; the individual controls are folded away.
  const [open, setOpen] = useState(false);
  const applyPreset = (p: (typeof PIE_PRESETS)[number]) => set({ ...p.look });
  // Changing the design starts from a clean default look (with that design), so
  // custom values from a previous design don't carry over and break it.
  const resetToDesign = (design: string) => {
    const { size: _size, ...rest } = DEFAULT_LOOK;
    void _size;
    set({ ...rest, design });
  };
  const eq = (a: unknown, b: unknown, color: boolean) =>
    color ? sameColor(String(a), String(b)) : a === b;
  const matchesPreset = (p: (typeof PIE_PRESETS)[number]) =>
    (Object.keys(p.look) as (keyof PresetLook)[]).every((k) =>
      eq(p.look[k], look[k], (PIE_COLOR_FIELDS as readonly string[]).includes(k)),
    );

  return (
    <>
      {/* ── プリセット（主操作） ── */}
      <Section title="プリセット">
        <div className="grid grid-cols-2 gap-1.5">
          {PIE_PRESETS.map((p) => {
            const on = matchesPreset(p);
            return (
              <button
                key={p.id}
                onClick={() => applyPreset(p)}
                className={
                  "flex items-center gap-2 px-2 py-1.5 rounded-row border text-body transition-colors " +
                  (on
                    ? "border-accent bg-bg3 text-accent font-medium"
                    : "border-border hover:bg-bg3 text-text2")
                }
              >
                <span className="shrink-0 inline-flex gap-0.5">
                  <span className="w-3 h-3 rounded-full border border-border" style={{ background: p.look.bg }} />
                  <span className="w-3 h-3 rounded-full border border-border" style={{ background: p.look.accent }} />
                </span>
                <span className="truncate">{t(p.label)}</span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* ── 詳細設定（折り畳み。基本はプリセットでOK） ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-1 px-1 py-1 text-label font-semibold text-text2 hover:text-accent"
      >
        {open ? <IconChevronDown size={14} aria-hidden /> : <IconChevronRight size={14} aria-hidden />}
        {t("詳細設定（プリセットを微調整）")}
      </button>

      {open && (
      <>
      {/* ── 形・サイズ ── */}
      <Section title="形・サイズ">
        <SettingRow label="デザイン" reset={resetFor("design")}>
          <Select
            value={look.design}
            onChange={(e) => resetToDesign(e.target.value)}
            fullWidth={false}
            className={CTRL_W}
          >
            {PIE_DESIGNS.map((d) => (
              <option key={d.value} value={d.value}>
                {t(d.label)}
              </option>
            ))}
          </Select>
        </SettingRow>
        <p className="-mt-1 pl-1 text-caption text-text3">
          {t(PIE_DESIGNS.find((d) => d.value === look.design)?.desc ?? "")}
        </p>
        <SettingRow label="大きさ" hint="px" reset={resetFor("size")}>
          <NumSlider
            value={look.size}
            min={120}
            max={800}
            step={10}
            onChange={(v) => set({ size: v })}
          />
        </SettingRow>
      </Section>

      {/* ── 色（背景・強調・文字） ── */}
      <Section title="色">
        {usesBg && (
          <>
            <ColorRow
              label="背景色"
              value={look.bg}
              presets={PIE_BG_PRESETS}
              onChange={(v) => set({ bg: v })}
              reset={resetFor("bg")}
            />
            <SettingRow label="背景の透明度" hint="%（0で完全透過）" reset={resetFor("opacity")}>
              <NumSlider
                value={look.opacity}
                min={0}
                max={100}
                onChange={(v) => set({ opacity: v })}
              />
            </SettingRow>
          </>
        )}
        {usesAccent && (
          <>
            <ColorRow
              label="ハイライト色"
              value={look.accent}
              presets={ACCENT_PRESETS}
              onChange={(v) => set({ accent: v })}
              reset={resetFor("accent")}
            />
            <SettingRow label="ハイライトの透明度" hint="%" reset={resetFor("accentOpacity")}>
              <NumSlider
                value={look.accentOpacity}
                min={0}
                max={100}
                onChange={(v) => set({ accentOpacity: v })}
              />
            </SettingRow>
          </>
        )}
        <ColorRow
          label="文字の色"
          value={look.labelColor}
          presets={PIE_LINE_PRESETS}
          onChange={(v) => set({ labelColor: v })}
          reset={resetFor("labelColor")}
        />
      </Section>

      {/* ── 線（区切り線・輪・放射・枠すべて） ── */}
      {usesLine && (
        <Section title="線">
          <ColorRow
            label="線の色"
            value={look.line}
            presets={PIE_LINE_PRESETS}
            onChange={(v) => set({ line: v })}
            reset={resetFor("line")}
          />
          <SettingRow label="線の透明度" hint="%（0で非表示）" reset={resetFor("lineOpacity")}>
            <NumSlider
              value={look.lineOpacity}
              min={0}
              max={100}
              onChange={(v) => set({ lineOpacity: v })}
            />
          </SettingRow>
          <SettingRow label="線のスタイル" reset={resetFor("lineStyle")}>
            <Select
              value={look.lineStyle}
              onChange={(e) => set({ lineStyle: e.target.value })}
              fullWidth={false}
              className={CTRL_W}
            >
              {PIE_LINE_STYLES.map((s) => (
                <option key={s.value} value={s.value}>
                  {t(s.label)}
                </option>
              ))}
            </Select>
          </SettingRow>
          {usesDividers && (
            <Toggle
              title="区切り線を表示する"
              desc="セグメントの境界に線を引きます。"
              checked={look.dividers}
              onChange={(v) => set({ dividers: v })}
              reset={resetFor("dividers")}
            />
          )}
        </Section>
      )}

      {/* ── 閾値の円（その場の目安） ── */}
      {usesThreshold && (
        <Section title="閾値の円">
          <Toggle
            title="閾値の円を表示する"
            desc="中心付近の「その場」判定の目安になる円。オフで消せます。"
            checked={look.thresholdShow}
            onChange={(v) => set({ thresholdShow: v })}
            reset={resetFor("thresholdShow")}
          />
          {look.thresholdShow && (
            <ColorRow
              label="閾値の円の色"
              value={look.thresholdColor}
              presets={ACCENT_PRESETS}
              onChange={(v) => set({ thresholdColor: v })}
              reset={resetFor("thresholdColor")}
            />
          )}
        </Section>
      )}

      {/* ── ラベル ── */}
      {usesLabels && (
        <Section title="ラベル">
          <Toggle
            title="操作ラベルを表示する"
            desc="オフのときは方向の点だけを表示します。"
            checked={look.labels}
            onChange={(v) => set({ labels: v })}
            reset={resetFor("labels")}
          />
          {look.labels && (
            <Toggle
              title="現在の方向だけラベル"
              desc="今指している方向だけ文字を表示（他は点）。ラベルの重なりを防げます。"
              checked={look.labelsCurrentOnly}
              onChange={(v) => set({ labelsCurrentOnly: v })}
              reset={resetFor("labelsCurrentOnly")}
            />
          )}
          <Toggle
            title="方向の点を表示する"
            desc="未設定や、ラベルの出ていない方向に表示される点。オフにすると点を消せます（指している方向の目印は残ります）。"
            checked={look.dots}
            onChange={(v) => set({ dots: v })}
            reset={resetFor("dots")}
          />
        </Section>
      )}
      </>
      )}
    </>
  );
}
