import { useTranslation } from "react-i18next";
import { useConfirm } from "../components/Confirm";
import { useStore } from "../store";
import type { ConfigActions } from "./useConfigActions";

/** Delete a layer / profile with a confirm dialog *only when it has contents*
 * (matches the folder rule): an empty layer / trivial profile deletes instantly
 * with an Undo toast, while one holding assignments (or matched apps) asks first.
 * Returns whether the delete went through, so callers can close a modal on it. */
export function useConfirmedDelete(actions: ConfigActions) {
  const confirm = useConfirm();
  const { t } = useTranslation();

  const deleteLayer = async (name: string): Promise<boolean> => {
    const st = useStore.getState();
    const buttons = st.profiles?.[st.selectedProfile]?.layers[name]?.buttons ?? {};
    const count = Object.keys(buttons).length;
    if (count > 0) {
      const ok = await confirm({
        title: t("レイヤーの削除"),
        message: t("レイヤー「{{name}}」（割り当て {{count}} 件）を削除します。", {
          name,
          count,
        }),
        danger: true,
        okLabel: t("削除"),
      });
      if (!ok) return false;
      actions.deleteLayer(name, true); // confirmed → no Undo toast
    } else {
      actions.deleteLayer(name); // empty → instant + Undo
    }
    return true;
  };

  const deleteProfile = async (name: string): Promise<boolean> => {
    const p = useStore.getState().profiles?.[name];
    if (!p) return false;
    const assignments = Object.values(p.layers).reduce(
      (n, l) => n + Object.keys(l.buttons).length,
      0,
    );
    const hasContent = p.matchApps.length > 0 || assignments > 0;
    if (hasContent) {
      const ok = await confirm({
        title: t("プロファイルの削除"),
        message: t("プロファイル「{{name}}」とその設定を削除します。", { name }),
        danger: true,
        okLabel: t("削除"),
      });
      if (!ok) return false;
      actions.deleteProfile(name, true); // confirmed → no Undo toast
    } else {
      actions.deleteProfile(name); // empty → instant + Undo
    }
    return true;
  };

  return { deleteLayer, deleteProfile };
}
