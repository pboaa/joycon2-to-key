import { useTranslation } from "react-i18next";
import { NumberField } from "../../ui/NumberField";
import { Button } from "../../ui/Button";

/** Repeat-interval (ms) editor: a centred stepper with coarse/fine ± buttons
 * around the number field (−100ms −10ms [input] +10ms +100ms). */
export function RepeatMsStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const { t } = useTranslation();
  // Repeat interval must stay ≥ 10ms.
  const step = (delta: number) => onChange(Math.max(10, value + delta));
  return (
    <div className="flex items-center justify-center gap-1">
      <Button size="xs" onClick={() => step(-100)} data-tip={t("100ms 遅く")}>
        −100ms
      </Button>
      <Button size="xs" onClick={() => step(-10)} data-tip={t("10ms 遅く")}>
        −10ms
      </Button>
      <span className="inline-flex items-center gap-1">
        <NumberField
          value={value}
          min={10}
          onChange={onChange}
          className="w-14 text-center"
        />
        <span className="text-caption text-text3">ms</span>
      </span>
      <Button size="xs" onClick={() => step(10)} data-tip={t("10ms 速く")}>
        +10ms
      </Button>
      <Button size="xs" onClick={() => step(100)} data-tip={t("100ms 速く")}>
        +100ms
      </Button>
    </div>
  );
}
