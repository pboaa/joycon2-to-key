import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconClick, IconPalette, IconPhotoPlus } from "@tabler/icons-react";
import type { Definition, DefinitionGroup, PressConfig } from "../../lib/types";
import { OP_COLOR_PRESETS } from "../../lib/opIcons";
import { OpIcon } from "../ui/OpIcon";
import { PressEditor } from "./config-editor/PressEditor";
import { IconPicker } from "./IconPicker";
import { ColorPickerModal } from "./ColorPickerModal";
import { DeleteButton } from "../ui/DeleteButton";
import { TextInput } from "../ui/TextInput";
import { EmptyState } from "../ui/EmptyState";
import { DefUsageChips } from "./DefUsageChips";
import { EDITOR_BODY_PAD, EDITOR_CARD_CLS } from "../ui/layout";

/** Right pane of the definitions manager: the name / group / action editor for
 * the selected definition (or an empty-state hint when nothing is selected). */
export function DefinitionEditorPane({
  selected,
  definitions,
  groups,
  layerOptions,
  focusNameSignal,
  onRename,
  onSetIcon,
  onSetIconColor,
  onUpdatePress,
  onDelete,
  onJumpToDefinition,
}: {
  selected: Definition | null;
  /** Whole library (empty-state copy differs when there are none at all). */
  definitions: Definition[];
  groups: DefinitionGroup[];
  layerOptions: string[];
  /** Bumped by the caller (right-click → Rename) to focus the name field. */
  focusNameSignal?: number;
  onRename: (id: string, name: string) => void;
  onSetIcon: (id: string, icon: string | undefined) => void;
  onSetIconColor: (id: string, color: string | undefined) => void;
  onUpdatePress: (id: string, press: PressConfig) => void;
  onDelete: (d: Definition) => void;
  /** Jump to another definition referenced inside this one's inputs. */
  onJumpToDefinition: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [pickingIcon, setPickingIcon] = useState(false);
  const [pickingColor, setPickingColor] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (focusNameSignal) {
      nameRef.current?.focus();
      nameRef.current?.select();
    }
  }, [focusNameSignal]);
  return (
    <div className={`flex-1 min-w-0 min-h-0 overflow-y-auto [scrollbar-gutter:stable] ${EDITOR_BODY_PAD}`}>
      {selected ? (
        // Same card style as the main screen (VariantRow): bordered, small padding,
        // name → divider → body → delete at the bottom.
        <div className={EDITOR_CARD_CLS}>
          {/* アイコン・色・名前を1行に。フォルダ移動は左レールへドラッグで行う。
              色はこの操作のボタン（Joy-Con 図）／パイスライス／アイコンを染める。 */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPickingIcon(true)}
              data-tip={t("アイコンを選ぶ")}
              aria-label={t("アイコンを選ぶ")}
              className="w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-row border border-border text-text2 hover:border-accent hover:text-accent"
            >
              {selected.icon ? (
                <OpIcon name={selected.icon} size={16} color={selected.iconColor} />
              ) : (
                <IconPhotoPlus size={15} aria-hidden />
              )}
            </button>
            <button
              onClick={() => setPickingColor(true)}
              data-tip={t("色を選ぶ")}
              aria-label={t("色を選ぶ")}
              className="w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-row border border-border hover:border-accent"
            >
              {selected.iconColor ? (
                <span
                  className="w-4 h-4 rounded-full border border-black/20"
                  style={{ background: selected.iconColor }}
                />
              ) : (
                <IconPalette size={15} className="text-text3" aria-hidden />
              )}
            </button>
            <TextInput
              ref={nameRef}
              value={selected.name}
              onChange={(e) => onRename(selected.id, e.target.value)}
              placeholder={t("操作名（例: 元に戻す）")}
              className="flex-1 min-w-0"
            />
          </div>
          {/* 区切り＋本体（メインと同じ順・体裁）。 */}
          <div className="pt-2 border-t border-border">
            <PressEditor
              press={selected.press}
              onChange={(p) => onUpdatePress(selected.id, p)}
              cacheKey={`def ${selected.id}`}
              layerOptions={layerOptions}
              definitions={definitions}
              groups={groups}
              onJumpToDefinition={onJumpToDefinition}
            />
          </div>
          {/* 逆引き：この操作が割り当てられているボタン一覧（削除の判断材料）。 */}
          <div className="pt-3 border-t border-border">
            <DefUsageChips defId={selected.id} />
          </div>
          {/* 削除は本体と区切り線＋間隔で分ける（ボタン編集と揃える）。 */}
          <div className="flex pt-3 border-t border-border">
            <DeleteButton onClick={() => onDelete(selected)} />
          </div>

          {pickingIcon && (
            <IconPicker
              value={selected.icon}
              onPick={(name) => onSetIcon(selected.id, name)}
              onClose={() => setPickingIcon(false)}
            />
          )}
          {pickingColor && (
            <ColorPickerModal
              title="操作の色"
              value={selected.iconColor ?? ""}
              presets={OP_COLOR_PRESETS}
              onPick={(hex) => onSetIconColor(selected.id, hex)}
              onClear={() => onSetIconColor(selected.id, undefined)}
              onClose={() => setPickingColor(false)}
            />
          )}
        </div>
      ) : (
        <EmptyState centered icon={<IconClick size={30} />}>
          {definitions.length === 0
            ? "下の「新しい操作」で作成してください"
            : "左の一覧から操作を選択してください"}
        </EmptyState>
      )}
    </div>
  );
}
