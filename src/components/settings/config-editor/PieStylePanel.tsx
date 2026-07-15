import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IconExternalLink, IconX } from "@tabler/icons-react";
import type { PiePress, PieAppearance } from "../../../lib/types";
import { DEFAULT_GLOBAL_SETTINGS } from "../../../lib/types";
import {
  deletePiePreset,
  getPiePresets,
  savePiePreset,
} from "../../../lib/piePresets";
import { InlineAddField } from "../../ui/InlineAddField";
import {
  type PieLookValues,
  PIE_COLOR_FIELDS,
  PIE_LOOK_GLOBAL_KEY,
  mergeLook,
  lookFromSettings,
  appearanceFromSettings,
} from "../../../lib/pieLook";
import { useStore } from "../../../store";
import { Card } from "../../ui/Card";
import { Toggle } from "../../ui/Toggle";
import { NestedSettings, NumSlider, SettingRow, makeReset, makeColorReset } from "../tabs/shared";
import { PieAppearanceCards } from "../PieAppearanceCards";

/** Per-pie appearance/threshold editor (the style tab of the pie editor).
 * Edits `press.appearance` / `press.threshold` / `press.showOverlay`; when the
 * "dedicated look" toggle is off, the pie uses the global settings (Settings → "Pie").
 * The look sections reuse the same {@link PieAppearanceCards} as Settings→Pie, so the
 * two panels always offer identical controls. */
export function PieStylePanel({
  press,
  onChange,
  preview,
}: {
  press: PiePress;
  onChange: (p: PiePress) => void;
  /** The style tab's actual-size preview state, re-surfaced in the detail modal. */
  preview?: { on: boolean; onToggle: () => void };
}) {
  const { t } = useTranslation();
  const g = useStore((s) => s.settings);
  const navigate = useStore((s) => s.navigate);
  const a = press.appearance;

  // Saved style presets (localStorage). A local mirror re-renders on save/delete
  // since localStorage isn't reactive.
  const [presets, setPresets] = useState(getPiePresets);
  const savePreset = (name: string) => {
    savePiePreset(name, a ?? appearanceFromSettings(g));
    setPresets(getPiePresets());
  };
  const applyPreset = (p: PieAppearance) =>
    onChange({ ...press, appearance: structuredClone(p) });
  const removePreset = (name: string) => {
    deletePiePreset(name);
    setPresets(getPiePresets());
  };
  const setA = (patch: Partial<PieAppearance>) =>
    onChange({ ...press, appearance: { ...(a ?? {}), ...patch } });
  const D = DEFAULT_GLOBAL_SETTINGS;

  // Resolved look values (per-pie override, else the global default).
  const look: PieLookValues = mergeLook(lookFromSettings(g), a);
  // Per-field ↺ resets to the built-in default (same meaning as Settings→Pie).
  const resetForLook = (field: keyof PieLookValues) => {
    const def = D[PIE_LOOK_GLOBAL_KEY[field]];
    const onReset = () => setA({ [field]: def } as Partial<PieAppearance>);
    return (PIE_COLOR_FIELDS as readonly string[]).includes(field)
      ? makeColorReset(look[field] as string, def as string, onReset)
      : makeReset(look[field], def, onReset);
  };

  return (
    <div className="space-y-3">
      {/* ── このパイの動作 ── */}
      <Card title="このパイ">
        <Toggle
          title="このパイで画面表示する"
          desc="オフにするとこのパイだけ画面に出さずに発火します（全体設定より優先）。"
          checked={press.showOverlay ?? g.pieOverlayEnabled}
          onChange={(v) => onChange({ ...press, showOverlay: v })}
          reset={{
            canReset: press.showOverlay !== undefined,
            onReset: () => onChange({ ...press, showOverlay: undefined }),
          }}
        />
        <SettingRow
          label="パイの閾値"
          hint="移動量(px)"
          reset={makeReset(press.threshold ?? g.pieThreshold, D.pieThreshold, () =>
            onChange({ ...press, threshold: D.pieThreshold }),
          )}
        >
          <NumSlider
            value={press.threshold ?? g.pieThreshold}
            min={1}
            max={100}
            onChange={(v) => onChange({ ...press, threshold: v })}
          />
        </SettingRow>
        <button
          onClick={() => navigate("settings", { settingsTab: "pie" })}
          className="text-caption text-text3 hover:text-accent inline-flex items-center gap-1"
          data-tip={t("全体のパイ設定（設定→パイ）を開く")}
        >
          <IconExternalLink size={11} aria-hidden />
          {t("全体設定を開く")}
        </button>
        {/* このトグルがオンのときだけ、下の見た目設定が「このパイ専用」になる。 */}
        <Toggle
          title="専用の見た目を使う"
          desc="オフのときは全体設定（設定→パイ）の見た目を使います。"
          checked={a != null}
          onChange={(on) =>
            onChange({ ...press, appearance: on ? appearanceFromSettings(g) : undefined })
          }
        />
        <NestedSettings show={a != null}>
          <Toggle
            title="範囲外に出したらキャンセル"
            desc="パイの外までカーソルを動かして離すとキャンセル。"
            checked={a?.cancelOutside ?? g.pieCancelOutside}
            onChange={(v) => setA({ cancelOutside: v })}
            reset={{
              canReset: a?.cancelOutside !== undefined,
              onReset: () => setA({ cancelOutside: undefined }),
            }}
          />
          {/* スタイルプリセット：この見た目を名前を付けて保存し、他のパイへ適用。 */}
          <div className="space-y-1.5">
            <div className="text-caption font-semibold text-text2">
              {t("スタイルプリセット")}
            </div>
            {presets.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {presets.map((p) => (
                  <span
                    key={p.name}
                    className="inline-flex items-center rounded-row border border-border bg-bg2 text-caption"
                  >
                    <button
                      onClick={() => applyPreset(p.appearance)}
                      data-tip={t("このプリセットを適用")}
                      className="max-w-[110px] truncate px-1.5 py-0.5 text-text2 hover:text-accent"
                    >
                      {p.name}
                    </button>
                    <button
                      onClick={() => removePreset(p.name)}
                      data-tip={t("削除")}
                      aria-label={t("削除")}
                      className="border-l border-border px-1 py-0.5 text-text3 hover:text-danger"
                    >
                      <IconX size={11} aria-hidden />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <InlineAddField
              size="sm"
              placeholder="このスタイルを保存（名前）"
              buttonLabel="保存"
              onAdd={savePreset}
            />
          </div>

          {/* プリセット＋大きさは同じアコーディオン内の枠なしグループ、細かな
              調整は「詳細設定」モーダルへ（狭い列でも崩れない）。 */}
          <PieAppearanceCards
            nested
            look={look}
            set={(patch) => setA(patch)}
            resetFor={resetForLook}
            preview={preview}
          />
        </NestedSettings>
      </Card>
    </div>
  );
}
