import { useTranslation } from "react-i18next";
import type { GlobalSettings } from "../../../lib/types";
import { batteryPercent } from "../../../lib/types";
import { useStore } from "../../../store";
import { Card } from "../../ui/Card";
import { Toggle } from "../../ui/Toggle";
import { NumField, SettingRow, useRowReset, type SetGlobal } from "./shared";

/** Battery % is estimated from voltage. Let the user calibrate the mV endpoints
 * to their controller (showing the live reading) so the estimate is sharper. */
export function BatteryTab({
  settings,
  setG,
}: {
  settings: GlobalSettings;
  setG: SetGlobal;
}) {
  const rst = useRowReset(settings, setG);
  const { t } = useTranslation();
  const battery = useStore((s) => s.battery);
  const mv = battery?.millivolts;
  const pct =
    mv != null
      ? batteryPercent(mv, settings.batteryFullMv, settings.batteryEmptyMv)
      : null;
  return (
    <>
    <Card title="タイトルバー表示（実験的）" desc="Joy-Con 2 の電池表示は実験的な機能です。">
      <Toggle
        title="タイトルバーにバッテリーを表示"
        desc="オンにすると、上部のタイトルバーに電池残量の目安を表示します。電圧からのおおまかな推定です。"
        checked={settings.titlebarBattery}
        onChange={(v) => setG({ titlebarBattery: v })}
        reset={rst("titlebarBattery")}
      />
    </Card>

    <Card
      title="バッテリー残量の目安（電圧）"
      desc="残量%は電圧からのおおまかな推定です。満充電の直後と、切れる直前の電圧を実測してここに入れると、この Joy-Con に合った精度になります。"
    >
      <SettingRow label="現在の電圧">
        <span className="text-body tabular-nums text-text2">
          {mv != null
            ? `${(mv / 1000).toFixed(2)}V（${mv}mV）${pct != null ? ` ≈ ${pct}%` : ""}`
            : t("未接続")}
        </span>
      </SettingRow>
      <SettingRow label="満充電＝100% の電圧" hint="mV" reset={rst("batteryFullMv")}>
        <NumField
          value={settings.batteryFullMv}
          min={3000}
          max={4500}
          onChange={(v) => setG({ batteryFullMv: v })}
        />
      </SettingRow>
      <SettingRow label="空＝0% の電圧" hint="mV" reset={rst("batteryEmptyMv")}>
        <NumField
          value={settings.batteryEmptyMv}
          min={2500}
          max={4000}
          onChange={(v) => setG({ batteryEmptyMv: v })}
        />
      </SettingRow>
    </Card>
    </>
  );
}
