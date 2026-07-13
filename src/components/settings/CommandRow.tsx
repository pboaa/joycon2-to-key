import { useTranslation } from "react-i18next";
import { InputCommandField } from "./InputCommandField";
import type { Definition, DefinitionGroup, InputCommand } from "../../lib/types";

/** One row of the input-command list editor: a drag handle, the per-command
 * field, and a remove button. Used by {@link InputCommandEditor}'s edit view. */
export function CommandRow({
  cmd,
  onChange,
  onRemove,
  handleProps,
  dragging,
  definitions,
  groups,
  onJumpToDefinition,
}: {
  cmd: InputCommand;
  onChange: (next: InputCommand) => void;
  onRemove: () => void;
  handleProps: React.HTMLAttributes<HTMLSpanElement> & { draggable: boolean };
  dragging: boolean;
  definitions?: Definition[];
  groups?: DefinitionGroup[];
  onJumpToDefinition?: (id: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={
        "flex items-center gap-2 py-2 " + (dragging ? "opacity-40" : "")
      }
    >
      <span
        {...handleProps}
        className="cursor-grab select-none text-text3 shrink-0"
        data-tip={t("ドラッグで並べ替え")}
      >
        ⠿
      </span>
      <InputCommandField
        cmd={cmd}
        onChange={onChange}
        definitions={definitions}
        groups={groups}
        onJumpToDefinition={onJumpToDefinition}
      />
      <button
        onClick={onRemove}
        className="ml-auto text-caption text-danger hover:text-danger px-1"
        data-tip={t("削除")}
      >
        ✕
      </button>
    </div>
  );
}
