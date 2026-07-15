import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { IconAdjustmentsHorizontal } from "@tabler/icons-react";
import { sameColor } from "../../lib/joyconColors";
import { type PieLookValues, type PresetLook, PIE_COLOR_FIELDS, PIE_PRESETS } from "../../lib/pieLook";
import { Card } from "../ui/Card";
import { PIE_DESIGNS } from "../PieVisual";
import { PieDetailModal } from "./PieDetailModal";
import { NumSlider, SettingRow, type RowReset } from "./tabs/shared";

/** The shared appearance controls of the pie overlay, used by both Settings→Pie
 * (global default) and the per-pie style panel so the two always offer the same
 * things: the preset grid and size inline (the primary actions), and a button
 * opening the fine-tuning modal ({@link PieDetailModal}) — a full-width surface,
 * since these rows crushed against the narrow per-pie editor column. */
export function PieAppearanceCards({
  look,
  set,
  resetFor,
  nested = false,
  preview,
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
  /** The caller's actual-size preview state; re-surfaced inside the detail
   * modal so tuning happens with the real overlay visible. */
  preview?: { on: boolean; onToggle: () => void };
}) {
  const { t } = useTranslation();

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

  // Most users just pick a preset; the fine-tuning lives in the modal.
  const [detailOpen, setDetailOpen] = useState(false);
  const applyPreset = (p: (typeof PIE_PRESETS)[number]) => set({ ...p.look });
  const eq = (a: unknown, b: unknown, color: boolean) =>
    color ? sameColor(String(a), String(b)) : a === b;
  const matchesPreset = (p: (typeof PIE_PRESETS)[number]) =>
    (Object.keys(p.look) as (keyof PresetLook)[]).every((k) =>
      eq(p.look[k], look[k], (PIE_COLOR_FIELDS as readonly string[]).includes(k)),
    );
  // Hover tip: the full name (the narrow grid truncates it) + what the preset's
  // design looks like, so presets can be compared without trying each one.
  const presetTip = (p: (typeof PIE_PRESETS)[number]) => {
    const d = PIE_DESIGNS.find((x) => x.value === p.look.design);
    return d ? `${t(p.label)} — ${t(d.desc)}` : t(p.label);
  };

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
                data-tip={presetTip(p)}
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

      {/* ── 大きさ（プリセットとは別軸なので、モーダルを開かずに触れる位置に） ── */}
      <Section title="大きさ">
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

      {/* ── 詳細設定（モーダル。基本はプリセットでOK） ── */}
      <button
        type="button"
        onClick={() => setDetailOpen(true)}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-row border border-border text-label font-semibold text-text2 hover:bg-bg3 hover:text-text transition-colors"
      >
        <IconAdjustmentsHorizontal size={14} aria-hidden />
        {t("詳細設定（プリセットを微調整）")}
      </button>

      {detailOpen && (
        <PieDetailModal
          look={look}
          set={set}
          resetFor={resetFor}
          preview={preview}
          onClose={() => setDetailOpen(false)}
        />
      )}
    </>
  );
}
