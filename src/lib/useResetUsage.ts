import { useTranslation } from "react-i18next";
import { useConfirm } from "../components/Confirm";
import { confirmReset } from "./confirms";
import { resetUsage } from "./tauri";

/** Confirm, then wipe the recorded usage counts and refresh. Shared by the two
 * places that reset stats — the Stats rail button and the figure's heatmap
 * control — which had the identical dialog + reset + refresh inline. `onDone`
 * runs only after an actual reset (e.g. the heatmap refresh). */
export function useResetUsage(onDone?: () => void) {
  const confirm = useConfirm();
  const { t } = useTranslation();
  return async () => {
    if (
      await confirmReset(confirm, t, {
        title: "使用回数のリセット",
        message: "記録した使用回数をすべて消去しますか？",
      })
    ) {
      await resetUsage();
      onDone?.();
    }
  };
}
