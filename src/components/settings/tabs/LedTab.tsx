import type { GlobalSettings } from "../../../lib/types";
import { LAMP_COUNT, lampOn, toggleLamp } from "../../../lib/playerLeds";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { SettingRow, type SetGlobal } from "./shared";

/** Player-indicator lamps (4). Each lamp is a simple on/off toggle; the choices
 * pack into a single byte sent to the controller (live while connected). */
export function LedTab({
  settings,
  setG,
}: {
  settings: GlobalSettings;
  setG: SetGlobal;
}) {
  return (
    <Card
      title="LED（プレイヤーランプ）"
      desc="接続中の Joy-Con のプレイヤーランプ（4つ）の点灯を選べます。"
    >
      <SettingRow label="点灯するランプ" hint="1〜4">
        <div className="flex gap-1">
          {Array.from({ length: LAMP_COUNT }, (_, i) => (
            <Button
              key={i}
              size="xs"
              variant={lampOn(settings.playerLeds, i) ? "primary" : "secondary"}
              onClick={() => setG({ playerLeds: toggleLamp(settings.playerLeds, i) })}
            >
              {i + 1}
            </Button>
          ))}
        </div>
      </SettingRow>
    </Card>
  );
}
