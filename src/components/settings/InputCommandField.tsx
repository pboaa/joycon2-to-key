import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IconKeyboard, IconLink } from "@tabler/icons-react";
import { OpIcon } from "../ui/OpIcon";
import type {
  Definition,
  DefinitionGroup,
  InputCommand,
} from "../../lib/types";
import { shortLabel } from "../../lib/variants";
import { isDefRef } from "../../lib/defRef";
import { NumberField } from "../ui/NumberField";
import { KeyPicker } from "./KeyPicker";
import { KeyCaptureModal } from "./KeyCaptureModal";
import { resolveGroupName } from "./config-editor/LinkedDefinitionLabel";
import {
  commandToPickerValue,
  inputLabel,
  pickerValueToCommand,
} from "./inputCommands";

/**
 * Edit one {@link InputCommand}. The single source of truth for how any input
 * looks & behaves, used by the input list (InputCommandEditor): a
 * definition-reference is shown inline; keys and mouse use the picker; scroll
 * shows its amount field.
 */
export function InputCommandField({
  cmd,
  onChange,
  definitions,
  groups,
  onJumpToDefinition,
}: {
  cmd: InputCommand;
  onChange: (next: InputCommand) => void;
  definitions?: Definition[];
  groups?: DefinitionGroup[];
  /** Jump to the referenced definition's editor (like the linked-variant card).
   * When unset, the reference name isn't clickable. */
  onJumpToDefinition?: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false); // full keyboard picker (click-only)
  const [cap, setCap] = useState(false); // quick capture (key / mouse / scroll)
  const def = isDefRef(cmd)
    ? definitions?.find((d) => d.id === cmd.def)
    : undefined;
  const defKeys =
    def && def.press ? shortLabel({ ...def.press, label: undefined }) : "";
  const defGroup = resolveGroupName(groups, def);

  return (
    <>
      {isDefRef(cmd) ? (
        <span
          className="flex-1 min-w-0 h-6 inline-flex items-center gap-1.5 px-2 text-caption rounded-row border border-border bg-bg"
          data-tip={t("保存した操作への参照。操作を編集するとここも変わります。")}
        >
          {/* Reference marker first (so it reads as "a link to a saved op"), then
              that op's icon if it has one. */}
          <IconLink size={12} className="shrink-0 text-accent" aria-hidden />
          {def?.icon && (
            <OpIcon name={def.icon} size={12} color={def.iconColor} className="shrink-0 text-text2" />
          )}
          {def && onJumpToDefinition ? (
            <button
              type="button"
              onClick={() => onJumpToDefinition(def.id)}
              data-tip={t("この操作を開く")}
              className="text-text font-medium truncate hover:underline hover:text-accent"
            >
              {def.name || t("(名前なし)")}
            </button>
          ) : (
            <span
              className={
                def ? "text-text font-medium truncate" : "text-danger truncate"
              }
            >
              {def ? def.name || t("(名前なし)") : t("（削除済みの操作）")}
            </span>
          )}
          {defKeys && (
            <span className="font-mono text-text3/80 truncate shrink">
              {defKeys}
            </span>
          )}
          {defGroup && (
            <span className="ml-auto text-text3/70 shrink-0 max-w-[80px] truncate">
              {defGroup}
            </span>
          )}
        </span>
      ) : (
        <>
          {/* Same quick-capture field as the main input, roomy; the keyboard icon
              opens the full on-screen picker (click-only) for special keys. */}
          <button
            onClick={(e) => {
              e.currentTarget.blur();
              setCap(true);
            }}
            data-tip={t("クリックしてキー・マウス・スクロールを設定")}
            className="flex-1 min-w-0 h-9 px-3 rounded-row border border-border bg-bg2 text-text hover:border-accent text-label font-mono text-left truncate focus:outline-none"
          >
            {inputLabel(cmd)}
          </button>
          <button
            onClick={() => setOpen(true)}
            data-tip={t("キーボードから選ぶ")}
            aria-label={t("キーボードから選ぶ")}
            className="shrink-0 h-9 px-2 rounded-row border border-border bg-bg2 text-text2 hover:border-accent hover:text-text inline-flex items-center focus:outline-none"
          >
            <IconKeyboard size={15} aria-hidden />
          </button>
        </>
      )}

      {cmd.type === "scroll" && (
        <NumberField
          value={cmd.amount ?? null}
          min={1}
          placeholder={t("量")}
          onChange={(v) => onChange({ ...cmd, amount: v })}
          onClear={() => onChange({ ...cmd, amount: undefined })}
          tip={t("スクロール量（空欄なら既定値。押しっぱなしの連続スクロールはキー入力の連打間隔で）")}
          className="w-16 h-9 text-caption"
        />
      )}

      {cap && (
        <KeyCaptureModal
          single
          onResult={(cmds) => {
            const next = cmds[0];
            // Keep a scroll's amount when re-capturing to another scroll.
            onChange(
              next.type === "scroll" && cmd.type === "scroll"
                ? { ...next, amount: cmd.amount }
                : next,
            );
            setCap(false);
          }}
          onClose={() => setCap(false)}
        />
      )}
      {open && (
        <KeyPicker
          pointer
          noCapture
          value={commandToPickerValue(cmd)}
          onSelect={(v) => {
            onChange(pickerValueToCommand(v, cmd));
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
