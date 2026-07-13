import type { GlobalSettings } from "../../../lib/types";
import { SOUND_OPTIONS, playSound } from "../../../lib/sounds";
import { Card } from "../../ui/Card";
import {
  buzzSample,
  PreviewSelectRow,
  useRowReset,
  VIBRATION_OPTIONS,
  type SetGlobal,
} from "./shared";

/** Notifications on Joy-Con connect / auto-disconnect (play a sound from the PC,
 * vibrate the controller). Sits in the "Devices & notifications" tab alongside the
 * other Joy-Con settings (battery / LED / vibration test). */
export function ConnectionTab({
  settings,
  setG,
}: {
  settings: GlobalSettings;
  setG: SetGlobal;
}) {
  const rst = useRowReset(settings, setG);
  return (
    <Card
      title="接続時の音・振動"
      desc="Joy-Con の接続時・放置による自動切断時に音で知らせます（PCから再生）。接続時と、自動切断の少し前（数秒前）には本体を振動させて知らせることもできます。"
    >
      <PreviewSelectRow
        label="接続したとき"
        value={settings.connectSound}
        options={SOUND_OPTIONS}
        onChange={(v) => setG({ connectSound: v })}
        onPreview={playSound}
        previewTip="試聴"
        reset={rst("connectSound")}
      />
      <PreviewSelectRow
        label="接続したときの振動"
        value={settings.connectVibration}
        options={VIBRATION_OPTIONS}
        onChange={(v) => setG({ connectVibration: v })}
        onPreview={buzzSample}
        previewDisabled={settings.connectVibration === 0}
        previewTip="試す"
        reset={rst("connectVibration")}
      />
      <PreviewSelectRow
        label="自動切断したとき"
        value={settings.disconnectSound}
        options={SOUND_OPTIONS}
        onChange={(v) => setG({ disconnectSound: v })}
        onPreview={playSound}
        previewTip="試聴"
        reset={rst("disconnectSound")}
      />
      <PreviewSelectRow
        label="自動切断の予告振動"
        hint="数秒前"
        value={settings.disconnectVibration}
        options={VIBRATION_OPTIONS}
        onChange={(v) => setG({ disconnectVibration: v })}
        onPreview={buzzSample}
        previewDisabled={settings.disconnectVibration === 0}
        previewTip="試す"
        reset={rst("disconnectVibration")}
      />
    </Card>
  );
}
