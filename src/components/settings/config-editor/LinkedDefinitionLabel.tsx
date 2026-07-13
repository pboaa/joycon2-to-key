import { useTranslation } from "react-i18next";
import type { Definition, DefinitionGroup } from "../../../lib/types";

/** Resolve a definition's group display name, if it belongs to one. */
export function resolveGroupName(
  groups: DefinitionGroup[] | undefined,
  def: Definition | undefined,
): string | undefined {
  return def?.group ? groups?.find((g) => g.id === def.group)?.name : undefined;
}

/** Shared display of a linked definition: its name (optionally clickable to open
 * the manager), a faint preview of the cached keys, and its group chip. Used by
 * both the variant row and the pie direction rows, which supply their own
 * surrounding "operation" label / Unlink button and container. */
export function LinkedDefinitionLabel({
  def,
  fallbackName,
  keyPreview,
  groupName,
  emphasize = false,
  onOpen,
}: {
  /** Resolved definition, or undefined when the linked id no longer exists. */
  def: Definition | undefined;
  /** Name shown (in red) when `def` is undefined. */
  fallbackName?: string;
  /** Faint preview of the cached keys, shown next to the name. */
  keyPreview?: string;
  /** Group name shown as a faint chip after the name. */
  groupName?: string;
  /** Render the name with a heavier weight (used by the variant row). */
  emphasize?: boolean;
  /** When set (and `def` exists), the name becomes a button that opens it. */
  onOpen?: (id: string) => void;
}) {
  const { t } = useTranslation();
  const name = def
    ? def.name || t("(名前なし)")
    : (fallbackName ?? t("(削除された操作)"));
  const nameCls =
    "text-label truncate " +
    (emphasize ? "font-medium " : "") +
    (def ? "text-text " : "text-danger");
  return (
    <>
      <div className="flex-1 min-w-0 flex items-baseline gap-1">
        {def && onOpen ? (
          <button
            type="button"
            onClick={() => onOpen(def.id)}
            data-tip={t("この操作を開く")}
            className={
              nameCls +
              " hover:underline hover:text-accent "
            }
          >
            {name}
          </button>
        ) : (
          <span className={nameCls} data-tip={name}>
            {name}
          </span>
        )}
        {keyPreview && (
          <span className="text-caption font-mono text-text3/80 truncate shrink-0">
            {keyPreview}
          </span>
        )}
      </div>
      {groupName && (
        <span
          className="text-caption text-text3/70 shrink-0 max-w-[64px] truncate"
          data-tip={t("フォルダ: {{name}}", { name: groupName })}
        >
          {groupName}
        </span>
      )}
    </>
  );
}
