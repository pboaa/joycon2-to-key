import type { DragEvent, MouseEvent, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { IconGripVertical } from "@tabler/icons-react";
import { cn } from "./cn";
import type { DragReorder } from "../../lib/useDragReorder";
import { useHoldReorder } from "../../lib/useDragReorder";

/** A row in a drag-reorderable list. Two ways to grab it:
 *  - the grip (a full-height strip on the left) — instant drag, and
 *  - the whole row — press-and-hold (~180ms) to pick it up; a quick drag scrolls.
 * Content (title button, action buttons) comes in as children; keep their text
 * colours keyed off `selected` at the call site. */
export function ReorderableRow({
  index,
  dnd,
  selected,
  enabled = true,
  reserveHandle = false,
  handleTitle = "ドラッグで並べ替え",
  onHandleDragStart,
  onContextMenu,
  children,
}: {
  index: number;
  dnd: DragReorder;
  selected: boolean;
  /** Turn off while a search filter hides part of the list. */
  enabled?: boolean;
  /** When disabled (e.g. a pinned row), still reserve the grip's width with an
   * invisible placeholder so the row's content stays aligned with draggable
   * siblings. */
  reserveHandle?: boolean;
  handleTitle?: string;
  /** Extra work on drag start, e.g. attaching a payload so the same drag can also
   * drop onto another target (a group folder). Runs after the reorder handler. */
  onHandleDragStart?: (e: DragEvent) => void;
  /** Right-click the row (opens a context menu at the call site). */
  onContextMenu?: (e: MouseEvent) => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const handle = dnd.handleProps(index);
  const hold = useHoldReorder(handle, onHandleDragStart);

  return (
    <div {...(enabled ? dnd.rowProps(index) : {})} onContextMenu={onContextMenu}>
      {enabled && (
        <div
          className={cn(
            "relative z-10 h-0.5 -mb-0.5 rounded-full transition-colors",
            dnd.showBefore(index) ? "bg-accent" : "bg-transparent",
          )}
        />
      )}
      <div
        className={cn(
          "group flex items-center gap-0.5 rounded-row transition-shadow",
          enabled && dnd.isDragging(index) && "opacity-40",
          hold.held && "shadow-sm ring-1 ring-accent/25",
          selected ? "bg-accent text-white" : "hover:bg-bg3",
        )}
        draggable={enabled && hold.held}
        onPointerDown={enabled ? hold.onPointerDown : undefined}
        onDragStart={enabled ? hold.onDragStart : undefined}
        onDragEnd={enabled ? hold.onDragEnd : undefined}
      >
        {enabled ? (
          <span
            draggable
            data-reorder-grip
            className={cn(
              "self-stretch px-1.5 cursor-grab select-none shrink-0 inline-flex items-center",
              selected ? "text-white/60" : "text-text3",
            )}
            data-tip={t(handleTitle)}
          >
            <IconGripVertical size={16} aria-hidden />
          </span>
        ) : (
          reserveHandle && (
            <span
              className="px-1.5 shrink-0 opacity-0 inline-flex items-center"
              aria-hidden
            >
              <IconGripVertical size={16} />
            </span>
          )
        )}
        {children}
      </div>
      {enabled && (
        <div
          className={cn(
            "relative z-10 h-0.5 -mt-0.5 rounded-full transition-colors",
            dnd.showAfter(index) ? "bg-accent" : "bg-transparent",
          )}
        />
      )}
    </div>
  );
}
