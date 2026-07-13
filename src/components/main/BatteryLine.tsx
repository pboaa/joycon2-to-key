import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { IconBattery, IconBatteryCharging } from "@tabler/icons-react";
import { batteryPercent, type BatteryInfo } from "../../lib/types";
import { useStore } from "../../store";

/** Battery voltage readout, always shown: icon + volts + rough %, with the full
 * detail in the hover tooltip. Keeps the last reading so a disconnect (e.g. the
 * battery dying) still shows its final voltage — greyed out while not connected.
 * Reads straight from the store, so it can live anywhere (title bar / nav). */
export function BatteryLine() {
  const { t } = useTranslation();
  const battery = useStore((s) => s.battery);
  const connectionState = useStore((s) => s.connectionState);
  const settings = useStore((s) => s.settings);
  // Remember the last live reading across disconnects.
  const last = useRef<BatteryInfo | null>(null);
  if (battery) last.current = battery;
  const shown = battery ?? last.current;
  const connected = connectionState === "connected";
  const Icon = shown?.charging ? IconBatteryCharging : IconBattery;

  if (!shown) {
    return (
      <div
        data-tauri-drag-region
        className="text-label leading-none inline-flex items-center gap-1.5 px-1 text-text3 select-none"
        data-tip={t("バッテリー未取得")}
      >
        <Icon size={14} strokeWidth={2} className="shrink-0 pointer-events-none" aria-hidden />—
      </div>
    );
  }

  const volts = shown.millivolts / 1000;
  const pct = batteryPercent(
    shown.millivolts,
    settings.batteryFullMv,
    settings.batteryEmptyMv,
  );
  const lowish = connected && !shown.charging && pct <= 15;
  const tipLines = [
    t("参考残量: 約{{pct}}%（充電/消費で変動）", { pct }),
    connected ? (shown.charging ? t("充電中") : t("放電中")) : t("切断時の値"),
  ];
  if (shown.temperatureC != null)
    tipLines.push(t("温度: {{temp}}℃", { temp: shown.temperatureC.toFixed(1) }));
  if (shown.currentMa != null)
    tipLines.push(t("電流: {{current}}mA", { current: shown.currentMa.toFixed(0) }));

  const cls = !connected ? "text-text3" : lowish ? "text-danger" : "text-text2";
  return (
    <div
      data-tauri-drag-region
      className={`text-label leading-none tabular-nums inline-flex items-center gap-1.5 px-1 select-none ${cls}`}
      data-tip={tipLines.join("\n")}
    >
      <Icon size={14} strokeWidth={2} className="shrink-0 pointer-events-none" aria-hidden />
      {volts.toFixed(2)}V
      <span className="text-text3 pointer-events-none">· {t("約{{pct}}%", { pct })}</span>
    </div>
  );
}
