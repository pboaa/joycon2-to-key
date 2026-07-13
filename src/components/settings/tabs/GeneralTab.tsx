import { useTranslation } from "react-i18next";
import type { GlobalSettings, Language, ThemeMode } from "../../../lib/types";
import { ACCENT_PRESETS, MAP_PRESETS } from "../../../lib/joyconColors";
import { resetWindowSize } from "../../../lib/window";
import { Button } from "../../ui/Button";
import { Select } from "../../ui/Select";
import { Card } from "../../ui/Card";
import { Toggle } from "../../ui/Toggle";
import {
  ColorRow,
  CTRL_W,
  IDLE_OPTIONS,
  NestedSettings,
  SettingRow,
  THEME_OPTIONS,
  useRowReset,
  type SetGlobal,
} from "./shared";

/** Basic settings: language, theme colours, idle auto-stop, window. Connect
 * notifications moved to the Devices & notifications tab; other input/pie settings
 * are split into their own tabs. */
export function GeneralTab({
  settings,
  setG,
}: {
  settings: GlobalSettings;
  setG: SetGlobal;
}) {
  const rst = useRowReset(settings, setG);
  const { t } = useTranslation();
  const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
    { value: "system", label: t("システムに合わせる") },
    { value: "ja", label: t("日本語") },
    { value: "en", label: t("英語") },
  ];
  return (
    <>
      <Card title="言語">
        <SettingRow label="表示言語">
          <Select
            value={settings.language}
            onChange={(e) => setG({ language: e.target.value as Language })}
            fullWidth={false}
            className={CTRL_W}
          >
            {LANGUAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </SettingRow>
      </Card>

      <Card title="テーマ・色">
        <SettingRow label="テーマ" reset={rst("theme")}>
          <Select
            value={settings.theme}
            onChange={(e) => setG({ theme: e.target.value as ThemeMode })}
            fullWidth={false}
            className={CTRL_W}
          >
            {THEME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {t(o.label)}
              </option>
            ))}
          </Select>
        </SettingRow>
        <SettingRow label="文字サイズ" reset={rst("uiScale")}>
          <Select
            value={settings.uiScale}
            onChange={(e) => setG({ uiScale: Number(e.target.value) })}
            fullWidth={false}
            className={CTRL_W}
          >
            {[0.9, 1, 1.1, 1.25].map((s) => (
              <option key={s} value={s}>
                {Math.round(s * 100)}%{s === 1 ? `（${t("標準")}）` : ""}
              </option>
            ))}
          </Select>
        </SettingRow>
        <ColorRow
          label="Joy-Con の色（左）"
          value={settings.accentL}
          presets={ACCENT_PRESETS}
          onChange={(v) => setG({ accentL: v })}
          reset={rst("accentL")}
        />
        <ColorRow
          label="Joy-Con の色（右）"
          value={settings.accentR}
          presets={ACCENT_PRESETS}
          onChange={(v) => setG({ accentR: v })}
          reset={rst("accentR")}
        />
        <ColorRow
          label="割り当て済みの色"
          value={settings.mapColor}
          presets={MAP_PRESETS}
          onChange={(v) => setG({ mapColor: v })}
          reset={rst("mapColor")}
          deepen
        />
      </Card>

      <Card title="放置時の自動停止">
        <Toggle
          title="無操作が続いたら自動で停止する"
          desc="一定時間 Joy-Con の入力がないと、押しっぱなしのキーを解放して停止します。"
          checked={settings.idleEnabled}
          onChange={(v) => setG({ idleEnabled: v })}
          reset={rst("idleEnabled")}
        />
        <NestedSettings show={settings.idleEnabled}>
          <SettingRow label="停止までの時間" reset={rst("idleTimeoutSecs")}>
            <Select
              value={settings.idleTimeoutSecs}
              onChange={(e) => setG({ idleTimeoutSecs: Number(e.target.value) })}
              fullWidth={false}
              className={CTRL_W}
            >
              {IDLE_OPTIONS.map((o) => (
                <option key={o.secs} value={o.secs}>
                  {t(o.label)}
                </option>
              ))}
            </Select>
          </SettingRow>
        </NestedSettings>
      </Card>

      <Card
        title="ウインドウ"
        desc="ウインドウを見失ったときや大きさが崩れたときに、既定のサイズ（960×660）に戻して中央に配置します。"
      >
        <div>
          <Button size="xs" onClick={() => void resetWindowSize().catch(() => {})}>
            {t("ウインドウサイズを既定に戻す")}
          </Button>
        </div>
      </Card>
    </>
  );
}
