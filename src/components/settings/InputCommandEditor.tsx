import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IconKeyboard, IconLink, IconPencil, IconPlus, IconX } from "@tabler/icons-react";
import { KeyCaptureModal } from "./KeyCaptureModal";
import { KeyPicker } from "./KeyPicker";
import { DefinitionPicker } from "./DefinitionPicker";
import { CommandRow } from "./CommandRow";
import { inputsSummary, isInputDef, pickerValueToCommand } from "./inputCommands";
import type {
  Definition,
  DefinitionGroup,
  InputCommand,
} from "../../lib/types";
import { isDefRef } from "../../lib/defRef";
import { shortLabel } from "../../lib/variants";
import { useDragReorder } from "../../lib/useDragReorder";
import { Button } from "../ui/Button";
import { OpIcon } from "../ui/OpIcon";

/** Which modal / picker (if any) the editor currently has open. At most one is
 * ever open at a time. */
type InputEditorModal = "none" | "capture" | "assign" | "add" | "keyboard";

interface Props {
  inputs: InputCommand[];
  onChange: (next: InputCommand[]) => void;
  /** Saved definitions — used to resolve reference names in the summary and by
   * the per-command field (existing references stay editable/removable). */
  definitions?: Definition[];
  groups?: DefinitionGroup[];
  /** Jump to a referenced definition's editor (📌 reference chip is clickable). */
  onJumpToDefinition?: (id: string) => void;
  /** Pie directions: show an "assign a saved operation" button next to the input.
   * Picking one replaces this direction with a reference to that operation (an
   * assignment, not a list append). */
  assignable?: boolean;
  /** Button inputs: the right half links the whole press to a saved operation
   * (any type), via this callback — the relocated 📌 operation. When set it takes the
   * place of {@link assignable}'s per-direction def-reference. */
  onAssignDefinition?: () => void;
}

/**
 * Default view is one prominent input: click it and press the key/shortcut you
 * want — the captured keys replace the whole list (the common "this button = one
 * keystroke" case). "Edit" opens the full list, where inputs are reordered,
 * removed, or added one at a time from the picker.
 */
export function InputCommandEditor({
  inputs,
  onChange,
  definitions,
  groups,
  onJumpToDefinition,
  assignable,
  onAssignDefinition,
}: Props) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  // At most one modal / picker is open at a time (each is opened from its own
  // button and closed on result), so a single union captures which — replacing
  // four independent booleans that could never legitimately overlap:
  //  - "capture":  collapsed "press to set" dialog (replaces the whole input)
  //  - "assign":   collapsed "assign a saved operation" picker
  //  - "add":      edit-mode quick capture (key/mouse/scroll), appends
  //  - "keyboard": edit-mode on-screen picker, appends
  const [modal, setModal] = useState<InputEditorModal>("none");
  const hasAssignableDefs = (definitions ?? []).some(isInputDef);

  const updateAt = (i: number, next: InputCommand) => {
    const copy = inputs.slice();
    copy[i] = next;
    onChange(copy);
  };
  const removeAt = (i: number) => {
    onChange(inputs.filter((_, idx) => idx !== i));
  };
  const dnd = useDragReorder((from, to) => {
    const next = inputs.slice();
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    onChange(next);
  });

  // ── Collapsed: click-to-set input; pie directions add an either/or assign ──
  if (!editing) {
    const summary = inputsSummary(inputs, definitions);
    // Pie directions are either/or: a single reference to a saved operation
    // (assignment) OR key input — never both at once. A lone def reference is
    // the "assigned" state; anything else is the "key input" state.
    const assignedRef =
      assignable && inputs.length === 1 && isDefRef(inputs[0]) ? inputs[0] : null;
    const assignedDef = assignedRef
      ? definitions?.find((d) => d.id === assignedRef.def)
      : undefined;
    // The assigned op's keys, shown as a label (like a linked button) so the
    // direction reads at a glance — not just the op name.
    const assignedKeys = assignedDef
      ? shortLabel({ ...assignedDef.press, label: undefined })
      : "";
    // Show the assign half when: a button can link a saved op (onAssignDefinition),
    // or a pie direction has something to assign / is already assigned.
    const canAssign =
      !!onAssignDefinition ||
      (!!assignable && (hasAssignableDefs || !!assignedRef));

    const modals = (
      <>
        {modal === "assign" && (
          <DefinitionPicker
            definitions={definitions ?? []}
            groups={groups ?? []}
            filter={isInputDef}
            title="操作を割り当て"
            emptyHint="参照できる操作がありません（入力の操作のみ）。"
            onPick={(d) => {
              // Assign (replace), not append: this direction becomes a live
              // reference to that operation.
              onChange([{ type: "def", def: d.id }]);
              setModal("none");
            }}
            onClose={() => setModal("none")}
          />
        )}
        {modal === "capture" && (
          // A small capture dialog (key / mouse / scroll); the captured input
          // replaces the field. The full keyboard picker stays behind Edit.
          <KeyCaptureModal
            onResult={(cmds) => {
              onChange(cmds);
              setModal("none");
            }}
            onClose={() => setModal("none")}
          />
        )}
      </>
    );

    // Button inputs (and pie directions with nothing to assign): one prominent,
    // click-to-set input. Saved-operation assignment for buttons is the
    // whole-press 📌 operation elsewhere, so no assign half here.
    if (!canAssign) {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.currentTarget.blur();
              setModal("capture");
            }}
            data-tip={t("クリックしてキー・ショートカットを設定（今の内容を置き換え）")}
            className={
              "flex-1 min-w-0 h-9 px-3 rounded-row border text-label font-mono text-left truncate transition-colors focus:outline-none " +
              (summary
                ? "border-border bg-bg2 text-text hover:border-accent"
                : "border-dashed border-border bg-bg text-text3 hover:border-accent hover:text-text2")
            }
          >
            {summary || t("クリックしてキーを設定")}
          </button>
          <Button
            variant="secondary"
            size="xs"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 shrink-0"
          >
            <IconPencil size={13} aria-hidden />
            {t("編集")}
          </Button>
          {modals}
        </div>
      );
    }

    // Pie directions: a half/half either-or control. Left = key input (＋Edit),
    // right = assign a saved operation. The active side reads in full colour;
    // clicking the other side switches (replacing this direction's content).
    const inputActive = !assignedRef;
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 flex items-stretch h-9 rounded-row border border-border bg-bg2 overflow-hidden">
          {/* LEFT: key input */}
          <button
            onClick={(e) => {
              e.currentTarget.blur();
              setModal("capture");
            }}
            data-tip={t("クリックしてキー・ショートカットを設定（今の内容を置き換え）")}
            className={
              "flex-1 min-w-0 px-3 text-left text-label font-mono truncate transition-colors hover:bg-bg3 focus:outline-none " +
              (inputActive && summary ? "text-text" : "text-text3")
            }
          >
            {inputActive && summary ? summary : t("クリックして入力")}
          </button>
          {inputActive && inputs.length > 0 && (
            <button
              onClick={() => setEditing(true)}
              data-tip={t("編集")}
              aria-label={t("編集")}
              className="shrink-0 px-2 inline-flex items-center text-text3 hover:bg-bg3 hover:text-text transition-colors"
            >
              <IconPencil size={13} aria-hidden />
            </button>
          )}
          <div className="w-px bg-border shrink-0" aria-hidden />
          {/* RIGHT: assign a saved operation */}
          <button
            onClick={onAssignDefinition ?? (() => setModal("assign"))}
            data-tip={
              onAssignDefinition
                ? t("保存済みの操作を割り当て")
                : assignedRef
                  ? t("クリックで別の操作に変更")
                  : t("保存済みの操作を割り当て（この方向を置き換え）")
            }
            className={
              "flex-1 min-w-0 px-3 inline-flex items-center gap-1.5 text-label hover:bg-bg3 transition-colors " +
              (assignedRef ? "text-text" : "text-text3")
            }
          >
            <IconLink size={13} className="shrink-0 text-accent" aria-hidden />
            {assignedRef ? (
              <>
                {assignedDef?.icon && (
                  <OpIcon
                    name={assignedDef.icon}
                    size={14}
                    color={assignedDef.iconColor}
                    className="shrink-0 text-text2"
                  />
                )}
                <span
                  className={"truncate " + (assignedDef ? "font-medium" : "text-danger")}
                >
                  {assignedDef
                    ? assignedDef.name || t("(名前なし)")
                    : t("（削除済みの操作）")}
                </span>
                {assignedKeys && (
                  <span className="shrink-0 font-mono text-caption text-text3/80 truncate">
                    {assignedKeys}
                  </span>
                )}
              </>
            ) : (
              <span className="truncate">{t("操作を割り当て")}</span>
            )}
          </button>
        </div>
        {/* Clear this direction back to empty (unassigned) — the only way to undo
            an operation assignment, since the assigned state hides the 編集 pencil
            and the picker can only *switch* operations, not remove one. Pie
            directions only (buttons clear via their own 編集 / delete). */}
        {assignable && inputs.length > 0 && (
          <button
            onClick={() => onChange([])}
            data-tip={t("この方向をクリア（割り当てを解除）")}
            aria-label={t("クリア")}
            className="shrink-0 text-text3 hover:text-danger px-1 inline-flex items-center"
          >
            <IconX size={14} aria-hidden />
          </button>
        )}
        {modals}
      </div>
    );
  }

  // ── Edit: full list (reorder / remove / add one at a time) ─────────────────
  return (
    <div {...dnd.containerProps} className="space-y-2">
      {/* Frameless — the parent (InputBody / PieBody) draws one outer frame
          around the whole editor, so items aren't boxed individually. */}
      {inputs.length > 0 && (
        <div className="divide-y divide-border">
          {inputs.map((cmd, i) => (
            <div key={i} {...dnd.rowProps(i)} className="relative">
              {dnd.showBefore(i) && (
                <div className="absolute inset-x-0 top-0 z-10 h-0.5 bg-accent" />
              )}
              <CommandRow
                cmd={cmd}
                onChange={(next) => updateAt(i, next)}
                onRemove={() => removeAt(i)}
                handleProps={dnd.handleProps(i)}
                dragging={dnd.isDragging(i)}
                definitions={definitions}
                groups={groups}
                onJumpToDefinition={onJumpToDefinition}
              />
              {dnd.showAfter(i) && (
                <div className="absolute inset-x-0 bottom-0 z-10 h-0.5 bg-accent" />
              )}
            </div>
          ))}
        </div>
      )}
      <div
        className={
          "flex items-center gap-1.5 " +
          // Pie directions are already compact/boxed by PieBody — no divider.
          (assignable ? "" : "pt-2 border-t border-border")
        }
      >
        {/* Capture is the main path (press the key you want); the on-screen
            picker is the secondary fallback for special keys / mouse / scroll. */}
        <Button
          variant="primary"
          size="xs"
          onClick={() => setModal("add")}
          data-tip={t("押したキー・マウス・スクロールをそのまま取り込みます")}
          className="inline-flex items-center gap-1"
        >
          <IconPlus size={13} aria-hidden />
          {t("入力を追加")}
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setModal("keyboard")}
          data-tip={t("特殊キー・マウス・スクロールなどを一覧から追加")}
          className="inline-flex items-center gap-1"
        >
          <IconKeyboard size={13} aria-hidden />
          {t("キーボードから追加")}
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setEditing(false)}
          className="ml-auto"
        >
          {t("編集を終了")}
        </Button>
      </div>
      {modal === "add" && (
        // Same minimal capture dialog; a shortcut adds each key as its own input.
        <KeyCaptureModal
          onResult={(cmds) => {
            onChange([...inputs, ...cmds]);
            setModal("none");
          }}
          onClose={() => setModal("none")}
        />
      )}
      {modal === "keyboard" && (
        // The full on-screen picker (click-only) — for special keys / mouse /
        // scroll / vibration the quick dialog doesn't cover.
        <KeyPicker
          pointer
          noCapture
          value=""
          onSelect={(v) => {
            onChange([
              ...inputs,
              pickerValueToCommand(v, { type: "keyboard", value: "A" }),
            ]);
            setModal("none");
          }}
          onClose={() => setModal("none")}
        />
      )}
    </div>
  );
}
