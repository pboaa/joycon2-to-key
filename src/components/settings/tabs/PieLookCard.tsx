import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { GlobalSettings, InputCommand } from "../../../lib/types";
import {
  closePieOverlayPreview,
  previewPieOverlay,
} from "../../../lib/tauri";
import { PIE_LOOK_GLOBAL_KEY, lookFromSettings } from "../../../lib/pieLook";
import { Card } from "../../ui/Card";
import { Toggle } from "../../ui/Toggle";
import { type PieSlice } from "../../PieVisual";
import { PieAppearanceCards } from "../PieAppearanceCards";
import { NestedSettings, NumSlider, SettingRow, useRowReset, type SetGlobal } from "./shared";

const kb = (value: string): InputCommand[] => [{ type: "keyboard", value }];

// Sample menu for the live preview: four directions + centre, with the "up"
// slice highlighted so the accent colour is visible.
const PREVIEW_SLICES: PieSlice[] = [
  { angle: 0, inputs: kb("PageUp") },
  { angle: 90, inputs: kb("Enter") },
  { angle: 180, inputs: kb("PageDown") },
  { angle: 270, inputs: kb("Esc") },
];
const PREVIEW_CENTER = kb("Space");

/** Global pie-overlay defaults: detection + show/hide/cancel (behaviour), then the
 * shared shape-size / colour / label sections, with an always-on live preview. */
export function PieLookCard({
  settings,
  setG,
}: {
  settings: GlobalSettings;
  setG: SetGlobal;
}) {
  const rst = useRowReset(settings, setG);
  const { t } = useTranslation();

  // Actual-size preview on the real overlay — manual only (off until the user
  // presses the button), so it never pops up unexpectedly. Re-pushes on every
  // edit so changes appear live; closed on unmount (leaving the tab).
  const [showPreview, setShowPreview] = useState(false);
  useEffect(() => {
    if (!showPreview || !settings.pieOverlayEnabled) {
      closePieOverlayPreview().catch(() => {});
      return;
    }
    previewPieOverlay(
      {
        slices: PREVIEW_SLICES.map((s) => ({ angle: s.angle, inputs: s.inputs })),
        center: PREVIEW_CENTER,
        appearance: lookFromSettings(settings),
        threshold: settings.pieThreshold,
        preview: true,
      },
      0,
    ).catch(() => {});
  }, [showPreview, settings]);
  useEffect(() => () => void closePieOverlayPreview().catch(() => {}), []);

  // Drive the shared appearance sections straight from the global pieOverlay*
  // settings.
  const look = lookFromSettings(settings);
  const setLook = (patch: Partial<typeof look>) => {
    const out: Partial<GlobalSettings> = {};
    for (const k of Object.keys(patch) as (keyof typeof look)[]) {
      (out as Record<string, unknown>)[PIE_LOOK_GLOBAL_KEY[k]] = patch[k];
    }
    setG(out);
  };

  const enabled = settings.pieOverlayEnabled;
  return (
    <>
      {/* ── 動作：発火の感度と、画面表示のオン/オフ・キャンセル ── */}
      <Card
        title="パイメニュー"
        desc="ボタンを押しながらマウスを動かした方向で発火します。見た目は全パイ共通の既定です。"
      >
        <SettingRow label="パイの閾値" hint="移動量(px)" reset={rst("pieThreshold")}>
          <NumSlider
            value={settings.pieThreshold}
            min={1}
            max={100}
            onChange={(v) => setG({ pieThreshold: v })}
          />
        </SettingRow>
        <Toggle
          title="範囲外に出したらキャンセル"
          desc="パイの外側までカーソルを動かして離すと、何も発火せずキャンセルします。"
          checked={settings.pieCancelOutside}
          onChange={(v) => setG({ pieCancelOutside: v })}
          reset={rst("pieCancelOutside")}
        />
        {/* このトグルがオフだとパイの画面表示は出ない（＝下の見た目設定の前提）。 */}
        <Toggle
          title="パイメニューを表示する"
          desc="オフにしてもパイメニューは発火します（画面上のパイだけを隠します）。"
          checked={enabled}
          onChange={(v) => setG({ pieOverlayEnabled: v })}
          reset={rst("pieOverlayEnabled")}
        />
        <NestedSettings show={enabled}>
          <button
            onClick={() => setShowPreview((v) => !v)}
            data-tip={t("実寸のパイを画面に表示して確認")}
            className={
              "w-full py-2.5 rounded-row border text-body font-semibold transition-colors " +
              (showPreview
                ? "bg-accent text-white border-accent"
                : "bg-accent/10 text-accent border-accent hover:bg-accent hover:text-white")
            }
          >
            {showPreview ? t("プレビューを閉じる") : t("実寸でプレビュー")}
          </button>
          {/* 見た目の各セクション（形・サイズ / 色 / ラベル）も同じ従属設定として、
              枠なしのグループでアコーディオン内に収める（カード枠をまたがない）。 */}
          <PieAppearanceCards
            nested
            look={look}
            set={setLook}
            resetFor={(field) => rst(PIE_LOOK_GLOBAL_KEY[field])}
          />
        </NestedSettings>
      </Card>
    </>
  );
}
