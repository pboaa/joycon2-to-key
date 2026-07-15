import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type {
  Definition,
  DefinitionGroup,
  InputMode,
  InputPress,
} from "../../../lib/types";
import { useStore } from "../../../store";
import { HelpText } from "../../HelpText";
import { ToggleChip } from "../../ui/Chip";
import { InputCommandEditor } from "../InputCommandEditor";
import { RepeatMsStepper } from "./RepeatMsStepper";

export function InputBody({
  press,
  onChange,
  definitions,
  groups,
  onJumpToDefinition,
}: {
  press: InputPress;
  onChange: (p: InputPress) => void;
  definitions?: Definition[];
  groups?: DefinitionGroup[];
  onJumpToDefinition?: (id: string) => void;
}) {
  const { t } = useTranslation();
  const mode: InputMode = press.mode ?? "tap";
  const repeat = press.repeatMs != null;
  // Default repeat interval when rapid-fire is first enabled (user-configurable).
  const defaultRepeatMs = useStore((s) => s.settings.defaultRepeatMs);

  // Scroll is meant for continuous input, so when newly included, rapid-fire
  // defaults to on (only when unset; the user can freely toggle it afterward).
  const repeatable = press.inputs.some((c) => c.type === "scroll");
  const prevRepeatable = useRef(repeatable);
  useEffect(() => {
    const added = repeatable && !prevRepeatable.current;
    prevRepeatable.current = repeatable;
    if (added && mode === "tap" && press.repeatMs == null) {
      onChange({ ...press, repeatMs: defaultRepeatMs });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repeatable]);

  // Leaving tap mode clears rapid-fire (repeatMs only applies to tap).
  const setMode = (m: InputMode) =>
    onChange({ ...press, mode: m, repeatMs: m === "tap" ? press.repeatMs : undefined });
  // Toggle-chip skin, matching the layer body's modifier chips.
  const chip = "h-8 px-3 text-label rounded-row inline-flex items-center font-sans";
  return (
    <div className="divide-y divide-border">
      {/* キー入力とオプションを1つの枠にまとめ、セクションはセパレータで区切る。 */}
      <div className="py-2 space-y-1.5">
        <div className="text-caption font-semibold text-text2">
          <HelpText text="入力するキー・マウス・スクロール。複数指定すると同時押しになります。">
            キー
          </HelpText>
        </div>
        <InputCommandEditor
          inputs={press.inputs}
          onChange={(next) => onChange({ ...press, inputs: next })}
          definitions={definitions}
          groups={groups}
          onJumpToDefinition={onJumpToDefinition}
        />
      </div>
      <div className="py-2 space-y-1.5">
        {/* Caption so the all-off state is self-explanatory (= plain tap). */}
        <div className="text-caption font-semibold text-text2">
          <HelpText text="何も選ばなければ、ボタンを押した瞬間に1回だけ入力します。">
            押し方
          </HelpText>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
        <ToggleChip
          on={mode === "hold"}
          onClick={() => setMode(mode === "hold" ? "tap" : "hold")}
          tip={t("ボタンを押している間ずっと押しっぱなしにします（キーボード/マウス向け）。")}
          className={chip}
        >
          {t("押している間")}
        </ToggleChip>
        <ToggleChip
          on={mode === "toggle"}
          onClick={() => setMode(mode === "toggle" ? "tap" : "toggle")}
          tip={t("1回押すと押しっぱなしで固定、もう1回で解除（Shift/Ctrl の固定に便利）。")}
          className={chip}
        >
          {t("固定（トグル）")}
        </ToggleChip>
        <ToggleChip
          on={repeat && mode === "tap"}
          disabled={mode !== "tap"}
          onClick={() =>
            onChange({ ...press, repeatMs: repeat ? undefined : defaultRepeatMs })
          }
          // Disabled chips still hover, so the tip can say WHY it's unavailable.
          tip={
            mode === "tap"
              ? t("押している間くり返し入力します（連打）。間隔はms。")
              : t("「押している間」「固定」とは併用できません。")
          }
          className={chip}
        >
          {t("連打")}
        </ToggleChip>
        </div>
      </div>
      {repeat && mode === "tap" && (
        <div className="py-2">
          <RepeatMsStepper
            value={press.repeatMs ?? defaultRepeatMs}
            onChange={(v) => onChange({ ...press, repeatMs: v })}
          />
        </div>
      )}
    </div>
  );
}
