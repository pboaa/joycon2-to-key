import { useTranslation } from "react-i18next";
import { useConfirm } from "../components/Confirm";
import { confirmReset } from "./confirms";
import { toast } from "./toast";

/** Reset to defaults with the in-app confirm dialog. Backup/restore is
 * whole-workspace (see useWorkspaceIO). */
export function useConfigIO(opts: { reset: () => Promise<void> }) {
  const { reset } = opts;
  const confirm = useConfirm();
  const { t } = useTranslation();

  const doReset = async () => {
    if (
      await confirmReset(confirm, t, {
        title: "初期化の確認",
        message: "config を初期状態にリセットしますか？",
        okLabel: "初期化",
      })
    ) {
      await reset();
      toast.success(t("初期状態にリセットしました"));
    }
  };

  return { doReset };
}
