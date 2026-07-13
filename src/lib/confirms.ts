import type { TFunction } from "i18next";
import type { ConfirmFn } from "../components/Confirm";

/** Shared "reset/clear this?" confirmation — the red dialog for destructive
 * resets (usage stats, config, operations). Just fills `danger` and translates,
 * so callers pass only their wording. `okLabel` defaults to "リセット" (Reset). */
export function confirmReset(
  confirm: ConfirmFn,
  t: TFunction,
  {
    title,
    message,
    okLabel = "リセット",
  }: { title: string; message: string; okLabel?: string },
): Promise<boolean> {
  return confirm({
    title: t(title),
    message: t(message),
    danger: true,
    okLabel: t(okLabel),
  });
}
