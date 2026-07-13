// A settings toggle row: title + a subtle description stacked on the left, with a
// checkbox on the right. Matches SettingRow's "plain row + fixed-width reset slot
// (↺/default) on the right edge" so it looks like the other settings rows (not a bordered card).
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { IconRotate } from "@tabler/icons-react";
import { cn } from "./cn";

/** The one checkbox skin (accent-tinted, 15px). Shared so every checkbox in the
 * app matches — used by this Toggle row and by any inline checkbox elsewhere. */
export const CHECKBOX_CLS =
  "w-[15px] h-[15px] accent-[var(--accent)] disabled:cursor-default";

export interface ToggleProps {
  title: ReactNode;
  desc?: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  className?: string;
  /** When provided, an always-visible ↺ slot (disabled/"default" while at default),
   * matching SettingRow so toggle rows and control rows line up on the right. */
  reset?: { canReset: boolean; onReset: () => void };
}

export function Toggle({
  title,
  desc,
  checked,
  onChange,
  disabled,
  className,
  reset,
}: ToggleProps) {
  const { t } = useTranslation();
  return (
    <label
      className={cn(
        "flex items-start justify-between gap-3 py-1",
        disabled ? "opacity-50 cursor-default" : "cursor-pointer",
        className,
      )}
    >
      <span className="flex flex-col gap-px min-w-0">
        <span className="text-body text-text">
          {typeof title === "string" ? t(title) : title}
        </span>
        {desc != null && (
          <span className="text-caption text-text3 leading-[1.4]">
            {typeof desc === "string" ? t(desc) : desc}
          </span>
        )}
      </span>
      {/* Checkbox + the same fixed-width reset slot SettingRow uses, so the ↺/既定
          indicator lines up with the select/number rows in the same Card. */}
      <span className="mt-0.5 shrink-0 flex items-center gap-1">
        <input
          type="checkbox"
          className={CHECKBOX_CLS}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="w-8 shrink-0 text-right leading-none">
          {reset ? (
            reset.canReset ? (
              <button
                type="button"
                onClick={(e) => {
                  // Inside a <label>: stop the click from toggling the checkbox.
                  e.preventDefault();
                  e.stopPropagation();
                  reset.onReset();
                }}
                data-tip={t("この項目を既定に戻す")}
                aria-label={t("この項目を既定に戻す")}
                className="px-0.5 text-text3 hover:text-accent inline-flex items-center justify-end w-full"
              >
                <IconRotate size={12} aria-hidden />
              </button>
            ) : (
              <span className="text-micro text-text3/60">{t("既定")}</span>
            )
          ) : null}
        </span>
      </span>
    </label>
  );
}
