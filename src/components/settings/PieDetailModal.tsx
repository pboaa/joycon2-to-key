import { useTranslation } from "react-i18next";
import { ACCENT_PRESETS } from "../../lib/joyconColors";
import { type PieLookValues, DEFAULT_LOOK } from "../../lib/pieLook";
import { Card } from "../ui/Card";
import { ModalShell } from "../ui/ModalShell";
import { Select } from "../ui/Select";
import { Toggle } from "../ui/Toggle";
import { PIE_DESIGNS } from "../PieVisual";
import { PiePreviewToggle } from "./PiePreviewToggle";
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

/** The pie fine-tuning dialog (design / colours / lines / threshold circle /
 * labels), opened from the "詳細設定" button under the presets. A modal gives
 * these rows a full-width surface — inline they crushed against the narrow
 * per-pie editor column — while the presets stay one click away outside.
 * Only the rows the chosen design actually uses are shown. */
export function PieDetailModal({
  look,
  set,
  resetFor,
  preview,
  onClose,
}: {
  /** The current (resolved) look values. */
  look: PieLookValues;
  /** Apply a partial change. */
  set: (patch: Partial<PieLookValues>) => void;
  /** ↺ descriptor for a field, or undefined for no reset control. */
  resetFor: (field: keyof PieLookValues) => RowReset | undefined;
  /** The caller's actual-size preview state, re-surfaced inside the modal so
   * tuning can happen with the real overlay visible beside the window. */
  preview?: { on: boolean; onToggle: () => void };
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const isActive = look.design === "active";
  const isChips = look.design === "chips";
  const usesBg = look.design !== "rays" && look.design !== "fade";
  // Every design draws with the line colour (dividers / ring / spokes, or the
  // active / chip borders), so the line colour + opacity always apply.
  const usesAccent = !isActive;
  const usesLabels = !isActive && !isChips;
  const usesDividers = look.design === "ring" || look.design === "pie";
  const usesThreshold = usesBg && !isActive && !isChips;

  // Changing the design starts from a clean default look (with that design), so
  // custom values from a previous design don't carry over and break it.
  const resetToDesign = (design: string) => {
    const { size: _size, ...rest } = DEFAULT_LOOK;
    void _size;
    set({ ...rest, design });
  };

  return (
    <ModalShell
      title="詳細設定（プリセットを微調整）"
      onClose={onClose}
      width="w-[500px]"
      bodyClassName="overflow-y-auto p-2.5 space-y-2.5"
    >
      {/* The preview overlay is its own window beside the app, so it stays
          visible while this modal is open — ideal for live tuning. */}
      {preview && <PiePreviewToggle on={preview.on} onToggle={preview.onToggle} />}

      {/* ── デザイン ── */}
      <Card title="デザイン">
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
      </Card>

      {/* ── 色（背景・強調・文字） ── */}
      <Card title="色">
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
      </Card>

      {/* ── 線（区切り線・輪・放射・枠すべて） ── */}
      <Card title="線">
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
      </Card>

      {/* ── 閾値の円（その場の目安） ── */}
      {usesThreshold && (
        <Card title="閾値の円">
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
        </Card>
      )}

      {/* ── ラベル ── */}
      {usesLabels && (
        <Card title="ラベル">
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
        </Card>
      )}
    </ModalShell>
  );
}
