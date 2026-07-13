import type { ComponentProps, MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { IconAlertTriangle, IconDotsVertical } from "@tabler/icons-react";
import type { Definition } from "../../lib/types";
import type { RiskResult } from "../../lib/inputRisk";
import { shortLabel } from "../../lib/variants";
import { OpIcon } from "../ui/OpIcon";
import { RowLabel } from "../ui/RowLabel";
import { ReorderableRow } from "../ui/ReorderableRow";
import { LIST_ROW_BTN } from "../ui/layout";
import { DEF_DRAG_MIME } from "./DefinitionGroupRail";

/** One saved-operation row in the library list: icon + name/keys, all-time use
 * count, and an optional ⚠️ risk badge. The grip doubles as a drag source that
 * carries the definition id (drop onto a folder to move it). Copy/rename/delete
 * live in the row's right-click menu. */
export function DefinitionRow({
  def,
  index,
  selected,
  dnd,
  canReorder,
  risk,
  uses,
  onSelect,
  onStartRename,
  onMenu,
}: {
  def: Definition;
  index: number;
  selected: boolean;
  dnd: ComponentProps<typeof ReorderableRow>["dnd"];
  canReorder: boolean;
  risk: RiskResult;
  uses: number;
  onSelect: (id: string) => void;
  /** Double-click the row to rename (focuses the editor's name field). */
  onStartRename?: () => void;
  /** Open the row's action menu (same items as right-click) at the ⋮ button. */
  onMenu?: (e: MouseEvent) => void;
}) {
  const { t } = useTranslation();
  const on = selected;
  return (
    <ReorderableRow
      index={index}
      dnd={dnd}
      selected={on}
      enabled={canReorder}
      handleTitle="ドラッグで並べ替え／左のフォルダへ移動"
      onHandleDragStart={(e) => {
        // Same grip also carries the definition id, so dropping it on a group
        // folder in the rail moves it there.
        e.dataTransfer.setData(DEF_DRAG_MIME, def.id);
      }}
    >
      <button
        onClick={() => onSelect(def.id)}
        onDoubleClick={onStartRename}
        data-tip={t("クリックで選択")}
        className={LIST_ROW_BTN}
      >
        <RowLabel
          selected={on}
          icon={
            def.icon ? (
              <OpIcon
                name={def.icon}
                size={15}
                color={def.iconColor}
                className={"shrink-0 " + (on ? "" : "text-text2")}
              />
            ) : undefined
          }
          reserveIcon={15}
          label={def.name || t("(名前なし)")}
          sub={shortLabel(def.press)}
          mono
        />
      </button>
      <span
        data-tip={t("使用回数（累計）")}
        className={
          "shrink-0 px-1 text-caption tabular-nums " +
          (on ? "text-white/70" : uses > 0 ? "text-text3" : "text-text3/40")
        }
      >
        {uses}
      </span>
      {risk.level !== "none" && (
        <span
          data-tip={
            t("キー入力の送信で注意が必要です") +
            "\n" +
            risk.reasons.map((x) => t(x)).join("\n")
          }
          aria-label={t("キー入力の送信で注意が必要です")}
          className={
            "shrink-0 px-1 inline-flex items-center " +
            (on ? "text-white" : risk.level === "danger" ? "text-danger" : "text-amber-500")
          }
        >
          <IconAlertTriangle size={13} aria-hidden />
        </span>
      )}
      {/* ⋮ menu — same items as right-click; hidden until the row is hovered
          (or it's the selected row), like the key-assignment rail. */}
      {onMenu && (
        <button
          onClick={onMenu}
          data-tip={t("メニュー")}
          aria-label={t("メニュー")}
          className={
            "px-1 shrink-0 inline-flex items-center transition-opacity " +
            (on
              ? "text-white/70 hover:text-white"
              : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto text-text3 hover:text-accent")
          }
        >
          <IconDotsVertical size={15} aria-hidden />
        </button>
      )}
    </ReorderableRow>
  );
}
