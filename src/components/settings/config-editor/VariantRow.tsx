import type { ReactNode } from "react";
import type {
  ButtonAssignment,
  Definition,
  DefinitionGroup,
  PressConfig,
} from "../../../lib/types";
import { useTranslation } from "react-i18next";
import { IconLink, IconDeviceFloppy } from "@tabler/icons-react";
import { shortLabel } from "../../../lib/variants";
import { linkedPress } from "../../../lib/config/press";
import { toast } from "../../../lib/toast";
import { useStore } from "../../../store";
import { useConfirm } from "../../Confirm";
import { Button } from "../../ui/Button";
import { DeleteButton } from "../../ui/DeleteButton";
import { OpIcon } from "../../ui/OpIcon";
import { TextInput } from "../../ui/TextInput";
import { PressTypeEditor } from "./PressTypeEditor";
import { resolveGroupName } from "./LinkedDefinitionLabel";

/** One assignment (variant) row for a button: a linked-definition card, or the
 * full inline editor (type + body + display name + save). */
export function VariantRow({
  btnKey,
  variant,
  onChange,
  onDelete,
  leadingActions,
  layerOptions,
  onAddLayer,
  definitions,
  groups,
  onSaveDefinition,
  onManageDefinitions,
  onInsertDefinition,
}: {
  btnKey: string;
  variant: ButtonAssignment;
  onChange: (next: ButtonAssignment) => void;
  onDelete: () => void;
  /** Extra controls placed at the left of the bottom row, before Delete. */
  leadingActions?: ReactNode;
  layerOptions: string[];
  /** Create a layer (for LayerHold's "＋ create layer named after button"). */
  onAddLayer?: (name: string) => void;
  definitions: Definition[];
  groups?: DefinitionGroup[];
  onSaveDefinition: (name: string, press: PressConfig) => string;
  onManageDefinitions: (defId?: string) => void;
  onInsertDefinition: (apply: (def: Definition) => void) => void;
}) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const profileName = useStore((s) => s.selectedProfile);
  const layerName = useStore((s) => s.selectedLayer);
  const press = variant.press;
  // Key-input and pie (pie) presses can be saved as a definition. Layer hold
  // is profile-local, so it can't.
  const canDefine = press.type === "input" || press.type === "pie";
  const patch = (p: PressConfig) => onChange({ ...variant, press: p });
  const pickDefinition = () =>
    onInsertDefinition((d) =>
      onChange({ ...variant, def: d.id, press: linkedPress(d) }),
    );
  const requestDelete = () => {
    // Single assignment → instant delete + Undo toast (matches the figure's
    // right-click clear), no confirm. Restores via onChange with the snapshot.
    const prev = structuredClone(variant);
    onDelete();
    toast.undo(t("割り当てをクリアしました"), t("元に戻す"), () => onChange(prev));
  };
  const saveAsDefinition = async () => {
    const name = press.label || shortLabel(press) || t("操作");
    if (
      !(await confirm({
        title: t("操作として保存"),
        message: t(
          "この動作を「{{name}}」として操作に保存し、このボタンをその操作に切り替えますか？",
          { name },
        ),
        okLabel: t("保存"),
      }))
    )
      return;
    // The label becomes the definition name; drop it from the stored press so
    // its preview shows the actual keys (not the label repeated).
    const body = structuredClone(press);
    delete body.label;
    const id = onSaveDefinition(name, body);
    // Link this button to the new definition, so it now IS that saved action
    // (later edits to the definition flow back here). Stay on the button — the
    // linked view shows it; open the operation from there if you want to edit.
    onChange({ ...variant, def: id, press: linkedPress({ id, name, press: body }) });
  };

  // Frameless: the surrounding editor (EditorPopover) supplies the card frame,
  // so this is just the vertical stack of the assignment's rows.
  const cardCls = "space-y-1.5";
  // Linked to a definition: show its name (+ cached keys and group) and a
  // button to open the manager. "Unlink" unlinks it, keeping the keys so it
  // becomes a directly-editable inline variant.
  if (variant.def) {
    const linkedDef = definitions.find((d) => d.id === variant.def);
    const p = variant.press;
    // Label stripped so this describes the op's keys, not its name (linkedPress
    // sets label = the op name).
    const keys = shortLabel({ ...p, label: undefined } as PressConfig);
    const mode = p.type === "input" ? (p.mode ?? "tap") : undefined;
    const repeat = p.type === "input" && p.repeatMs != null;
    const groupName = resolveGroupName(groups, linkedDef);
    const badge =
      "px-2 py-0.5 rounded-row border border-border text-caption text-text3";
    return (
      <div className={cardCls}>
        {/* Linked to a saved operation: name opens it, plus group + 解除. */}
        <div className="flex items-center gap-1.5">
          <span className="shrink-0 inline-flex items-center gap-1 text-caption font-semibold text-text3">
            <IconLink size={12} className="text-accent" aria-hidden />
            {t("操作")}
          </span>
          <button
            type="button"
            onClick={() => onManageDefinitions(variant.def)}
            data-tip={t("この操作を開く")}
            className="min-w-0 inline-flex items-center gap-1 text-label font-medium truncate hover:underline hover:text-accent"
          >
            {linkedDef?.icon && (
              <OpIcon
                name={linkedDef.icon}
                size={13}
                color={linkedDef.iconColor}
                className="shrink-0 text-text2"
              />
            )}
            <span className={"truncate " + (linkedDef ? "text-text" : "text-danger")}>
              {linkedDef
                ? linkedDef.name || t("(名前なし)")
                : p.label || t("(削除された操作)")}
            </span>
          </button>
          {groupName && (
            <span className="shrink-0 max-w-[64px] truncate text-caption text-text3/70">
              {groupName}
            </span>
          )}
          <Button
            size="xs"
            className="ml-auto shrink-0"
            onClick={() => onChange({ ...variant, def: undefined })}
            data-tip={t("操作のリンクを解除（キーはそのまま残り、直接編集できます）")}
          >
            {t("解除")}
          </Button>
        </div>

        {/* The op's input shown in the key-input field's style, read-only — a
            label of what it does. Edit the operation to change it. */}
        <div
          data-tip={t("保存した操作への参照。操作を編集するとここも変わります。")}
          className="h-9 w-full px-3 inline-flex items-center gap-1.5 rounded-row border border-dashed border-accent/40 bg-bg2/60 text-label font-mono text-text2 cursor-default"
        >
          <span className="truncate">{keys || "—"}</span>
        </div>

        {/* Read-only press options, so how it behaves is visible. */}
        {(mode === "hold" || mode === "toggle" || repeat) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {mode === "hold" && <span className={badge}>{t("押している間")}</span>}
            {mode === "toggle" && <span className={badge}>{t("固定（トグル）")}</span>}
            {repeat && <span className={badge}>{t("連打")}</span>}
          </div>
        )}
      </div>
    );
  }

  return (
    // Order: name (+ save) on top → divider → type + body → delete at the bottom.
    <div className={cardCls}>
      {/* 上部：表示名／操作名 ＋「操作として保存」。表示名は Joy-Con 図のラベルで
          あり、そのまま操作名にもなる。レイヤー切替系は操作化できないので保存ボタン
          は非表示（表示名は共通で使えるよう残す）。 */}
      <div className="flex items-center gap-1.5">
        <TextInput
          value={press.label ?? ""}
          onChange={(e) =>
            patch({
              ...press,
              label: e.target.value === "" ? undefined : e.target.value,
            } as PressConfig)
          }
          placeholder={t("操作の表示名（任意）")}
          data-tip={t("Joy-Con 図に表示される名前。操作として保存するときの名前にもなります。")}
          className="flex-1 min-w-0"
        />
        {canDefine && (
          <button
            onClick={saveAsDefinition}
            className="shrink-0 h-9 px-2.5 rounded-row border border-accent text-accent hover:bg-accent/10 inline-flex items-center gap-1 text-label"
            data-tip={t("この動作を操作として保存し、このボタンをその操作にリンクします")}
          >
            <IconDeviceFloppy size={14} aria-hidden />
            {t("操作として保存")}
          </button>
        )}
      </div>

      {/* 区切り＋ 種類（キー入力／レイヤー／パイ）＋ 本体。 */}
      <div className="pt-2 border-t border-border">
        <PressTypeEditor
          press={press}
          onChange={patch}
          cacheKey={`${profileName} ${layerName} ${btnKey}`}
          layerOptions={layerOptions}
          btnKey={btnKey}
          onPickDefinition={definitions.length > 0 ? pickDefinition : undefined}
          definitions={definitions}
          groups={groups}
          onAddLayer={onAddLayer}
          onJumpToDefinition={onManageDefinitions}
        />
      </div>

      {/* 下部アクション行：コピー/貼り付け（あれば）を左端、削除は常に右端へ。
          本体と区切り線＋間隔で分け、確認を挟んで誤爆を防ぐ。削除を反対端に置く
          ことでコピペとの誤クリックも避ける（定義エディタは leadingActions 無しで
          従来どおり削除だけが右端）。 */}
      <div className="flex items-center gap-1.5 pt-3 border-t border-border">
        {leadingActions}
        <DeleteButton onClick={requestDelete} className="ml-auto px-3" />
      </div>
    </div>
  );
}
