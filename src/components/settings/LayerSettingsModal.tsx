import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { Selection } from "../../lib/useSelection";
import type { ConfigActions } from "../../lib/useConfigActions";
import type { InheritMode } from "../../lib/types";
import { normalizeInherit } from "../../lib/config/layers";
import { useConfirmedDelete } from "../../lib/useConfirmedDelete";
import { useConfirm } from "../Confirm";
import { useRenameDraft } from "../../lib/useRenameDraft";
import { ModalShell } from "../ui/ModalShell";
import { Button } from "../ui/Button";
import { DeleteButton } from "../ui/DeleteButton";
import { Select } from "../ui/Select";
import { TextInput } from "../ui/TextInput";
import { FieldLabel } from "../ui/FieldLabel";

const INHERIT_OPTIONS: { value: InheritMode; label: string; help: string }[] = [
  {
    value: "modifiers",
    label: "切り替え・修飾キーだけ引き継ぐ",
    help: "初期レイヤーからは「レイヤーを切り替えるボタン」と「修飾キー（Ctrl / Shift / Alt など）を押し続けるボタン」だけを引き継ぎ、ほかのボタンは空から始めます。どのレイヤーにいても切り替えと修飾キーが使えるようにするための設定です（新しいレイヤーの既定）。",
  },
  {
    value: "all",
    label: "すべて引き継ぐ",
    help: "初期レイヤーの割り当てをそのまま使い、ここで設定したボタンだけ差し替えます。設定しなかったボタンは初期レイヤーと同じ動きになります。",
  },
  {
    value: "none",
    label: "引き継がない（独立）",
    help: "初期レイヤーから何も引き継ぎません。このレイヤーで設定したボタンだけが動きます（切り替え用ボタンもここで設定が必要です）。",
  },
];

/** Settings for a single layer (rename / inheritance / clear / duplicate /
 * delete). Opened from a row in the side panel — the row selects the layer
 * first, so this edits the currently selected layer. */
export function LayerSettingsModal({
  selection: s,
  actions,
  onClose,
}: {
  selection: Selection;
  actions: ConfigActions;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const del = useConfirmedDelete(actions);

  const name = s.selectedLayer;
  const isInitial = name === s.baseLayerName;
  const canDelete = s.layerNames.length > 1;
  const inheritMode = normalizeInherit(s.profile?.layers[name]?.inherit);
  const assignedCount = Object.keys(s.profile?.layers[name]?.buttons ?? {}).length;

  const { inputProps } = useRenameDraft(name, actions.renameLayer);

  // Close if the layer disappears (deleted elsewhere).
  useEffect(() => {
    if (name && !s.layerNames.includes(name)) onClose();
  }, [s.layerNames, name, onClose]);

  const askDelete = async () => {
    // Empty layer → instant + Undo; layer with assignments → confirm first.
    if (await del.deleteLayer(name)) onClose();
  };
  const askClear = async () => {
    if (
      await confirm({
        title: t("すべて割り当てなしにする"),
        message: t("このレイヤーのすべての割り当てを削除しますか？"),
        danger: true,
        okLabel: t("削除"),
      })
    )
      actions.clearLayer(name);
  };

  return (
    <ModalShell
      title={
        <>
          {t("レイヤー")}
          <span className="ml-2 text-label font-normal text-text3">{name}</span>
        </>
      }
      onClose={onClose}
      width="w-[480px]"
      footer={
        <>
          <Button
            variant="dangerOutline"
            size="xs"
            onClick={askClear}
            disabled={assignedCount === 0}
            data-tip={t("このレイヤーの割り当てをすべて削除")}
          >
            {t("すべて割り当てなしにする")}
            {assignedCount > 0 ? `（${assignedCount}）` : ""}
          </Button>
          <DeleteButton
            size="xs"
            className="ml-auto px-2"
            onClick={askDelete}
            disabled={!canDelete}
            tip={canDelete ? t("削除") : t("最後のレイヤーは削除できません")}
          />
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <FieldLabel>{t("名前")}</FieldLabel>
          <TextInput {...inputProps} />
        </div>
        <div>
        <FieldLabel>{t("継承")}</FieldLabel>
        {isInitial ? (
          <p className="text-caption text-text3">
            {t("初期レイヤー（ベース）です。他のレイヤーの継承元になります。")}
          </p>
        ) : (
          <div className="space-y-1">
            <p className="text-caption text-text3">
              {t("このレイヤーが初期レイヤーからどれだけ引き継ぐかを選びます。")}
            </p>
            <Select
              size="sm"
              value={inheritMode}
              onChange={(e) =>
                actions.setLayerInherit(name, e.target.value as InheritMode)
              }
            >
              {INHERIT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {t(o.label)}
                </option>
              ))}
            </Select>
            <p className="text-caption text-text3">
              {t(INHERIT_OPTIONS.find((o) => o.value === inheritMode)?.help ?? "")}
            </p>
          </div>
        )}
        </div>
      </div>
    </ModalShell>
  );
}
