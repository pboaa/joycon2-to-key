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
        message:
          "すべて（プロファイル・キー割り当て・保存した操作・統計）を初期状態に戻しますか？この操作は取り消せません。",
        okLabel: "初期化",
      })
    ) {
      await reset();
      toast.success(t("初期状態にリセットしました"));
    }
  };

  return { doReset };
}
