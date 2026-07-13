import type { GlobalSettings } from "../../../lib/types";
import { Card } from "../../ui/Card";
import { NumSlider, SettingRow, useRowReset, type SetGlobal } from "./shared";

// Pie-related settings (threshold, look) moved to their own "Pie" tab.
export function InputTab({
  settings,
  setG,
}: {
  settings: GlobalSettings;
  setG: SetGlobal;
}) {
  const rst = useRowReset(settings, setG);
  return (
    <Card title="入力">
      <SettingRow label="スクロール量" reset={rst("scrollAmount")}>
        <NumSlider
          value={settings.scrollAmount}
          min={1}
          max={2000}
          step={10}
          onChange={(v) => setG({ scrollAmount: v })}
        />
      </SettingRow>
      <SettingRow label="連打の既定間隔" hint="ms" reset={rst("defaultRepeatMs")}>
        <NumSlider
          value={settings.defaultRepeatMs}
          min={10}
          max={2000}
          step={10}
          onChange={(v) => setG({ defaultRepeatMs: v })}
        />
      </SettingRow>
      <SettingRow label="スティックのデッドゾーン" hint="%・中心の遊び" reset={rst("stickDeadzone")}>
        <NumSlider
          value={settings.stickDeadzone}
          min={0}
          max={90}
          onChange={(v) => setG({ stickDeadzone: v })}
        />
      </SettingRow>
    </Card>
  );
}
