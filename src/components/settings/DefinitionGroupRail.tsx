import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  DragEvent,
  HTMLAttributes,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  RefObject,
} from "react";
import { IconFolder, IconGripVertical, IconInbox, IconLayoutList, IconX } from "@tabler/icons-react";
import type { DefinitionGroup } from "../../lib/types";
import { RenameInput } from "../ui/RenameInput";
import {
  useDragReorder,
  useHoldReorder,
  type DragReorder,
} from "../../lib/useDragReorder";
import { RAIL_W } from "../ui/layout";
import { RailHeader } from "../ui/RailHeader";
import { AddRow } from "../ui/AddRow";
import { useContextMenu } from "../ui/ContextMenu";

/** dataTransfer MIME set when dragging a definition item onto a group folder.
 * Distinct from the reorder drag (text/plain) so the two never cross-fire. */
export const DEF_DRAG_MIME = "application/x-ccd-definition-id";

const itemCls = (on: boolean) =>
  // No gap here: each consumer sets its own (the folder row spaces grip/label/×
  // tightly; the All/Uncategorized buttons space icon/label more generously).
  "flex items-center rounded-row text-body " +
  (on
    ? "bg-bg3 text-accent font-medium"
    : "hover:bg-bg3 text-text ");

/** Left rail: the group filter (All / Uncategorized / each group) plus add / rename
 * (double-click) / delete / drag-reorder for the real groups. */
export function DefinitionGroupRail({
  groups,
  value,
  onChange,
  onAdd,
  onRename,
  onRequestDelete,
  onReorder,
  onMoveDefinitionToGroup,
  footer,
}: {
  groups: DefinitionGroup[];
  /** "all" | "none" | a group id */
  value: string;
  onChange: (v: string) => void;
  onAdd: (name: string) => string;
  onRename: (id: string, name: string) => void;
  /** Ask the parent to open the group-delete modal for this group. */
  onRequestDelete: (id: string) => void;
  onReorder: (order: string[]) => void;
  /** Drop a definition (dragged from the list) onto a group folder to move it.
   * `group` is undefined for the Uncategorized (ungrouped) target. */
  onMoveDefinitionToGroup?: (defId: string, group: string | undefined) => void;
  /** Optional bottom-of-column action slot (e.g. reset), so the rail's footer
   * line matches the other pages' left-column footers. */
  footer?: ReactNode;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const { t } = useTranslation();
  const ctx = useContextMenu();
  const editRef = useRef<HTMLInputElement>(null);
  const dnd = useDragReorder((from, to) => {
    setEditing(null); // a rename in progress must not linger after a move
    const ids = groups.map((g) => g.id);
    const [m] = ids.splice(from, 1);
    ids.splice(to, 0, m);
    onReorder(ids);
  });

  // Drop handlers for a folder that accepts a dragged definition. Keyed off the
  // definition MIME so group-reorder drags (text/plain) pass through untouched.
  const dropProps = (targetKey: string, group: string | undefined) => {
    if (!onMoveDefinitionToGroup) return {};
    return {
      onDragOver: (e: DragEvent) => {
        if (!e.dataTransfer.types.includes(DEF_DRAG_MIME)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (dropTarget !== targetKey) setDropTarget(targetKey);
      },
      onDragLeave: () =>
        setDropTarget((t) => (t === targetKey ? null : t)),
      onDrop: (e: DragEvent) => {
        if (!e.dataTransfer.types.includes(DEF_DRAG_MIME)) return;
        e.preventDefault();
        e.stopPropagation();
        const id = e.dataTransfer.getData(DEF_DRAG_MIME);
        if (id) onMoveDefinitionToGroup(id, group);
        setDropTarget(null);
      },
    };
  };
  const dropRing = (targetKey: string) =>
    dropTarget === targetKey ? " ring-2 ring-accent ring-inset" : "";

  // Create a group with a default name, select it, and start
  // inline rename so the user can name it right away.
  const createGroup = () => {
    const id = onAdd("新しいフォルダ");
    onChange(id);
    setEditing(id);
    setEditDraft("新しいフォルダ");
    setTimeout(() => editRef.current?.select(), 0);
  };
  const startEdit = (g: DefinitionGroup) => {
    setEditing(g.id);
    setEditDraft(g.name);
    setTimeout(() => editRef.current?.select(), 0);
  };
  const commitEdit = () => {
    if (!editing) return;
    const n = editDraft.trim();
    if (n) onRename(editing, n);
    setEditing(null);
  };

  return (
    <div className={`${RAIL_W} shrink-0 flex flex-col min-h-0 border-r border-border bg-bg2`}>
      {ctx.node}
      <RailHeader title="フォルダ" />
      <div
        className="flex-1 min-h-0 overflow-y-auto px-2 py-1.5 space-y-1"
        {...dnd.containerProps}
        onContextMenu={(e) =>
          ctx.open(e, [{ label: "新規作成", onClick: createGroup }])
        }
      >
        <button
          onClick={() => onChange("all")}
          className={itemCls(value === "all") + " w-full text-left px-2.5 py-2 gap-2.5"}
        >
          <IconLayoutList size={16} className="shrink-0" aria-hidden />
          {t("すべて")}
        </button>
        <button
          onClick={() => onChange("none")}
          {...dropProps("none", undefined)}
          className={
            itemCls(value === "none") +
            " w-full text-left px-2.5 py-2 gap-2.5" +
            dropRing("none")
          }
        >
          <IconInbox size={16} className="shrink-0" aria-hidden />
          {t("未分類")}
        </button>
        {groups.length > 0 && (
          <div className="h-px my-1 bg-bg3 " />
        )}
        {groups.map((g, i) => (
          <FolderRow
            key={g.id}
            g={g}
            index={i}
            active={value === g.id}
            dnd={dnd}
            dropProps={dropProps(g.id, g.id)}
            dropRingCls={dropRing(g.id)}
            editing={editing === g.id}
            editRef={editRef}
            editDraft={editDraft}
            onEditDraft={setEditDraft}
            onCommitEdit={commitEdit}
            onCancelEdit={() => setEditing(null)}
            onStartEdit={() => startEdit(g)}
            onSelect={() => onChange(g.id)}
            onDelete={() => onRequestDelete(g.id)}
            onContextMenu={(e) =>
              // Rename is on double-clicking the folder; the menu keeps the
              // constructive action (new folder) up top and delete at the bottom.
              ctx.open(e, [
                { label: "新規作成", onClick: createGroup },
                {
                  label: "削除",
                  danger: true,
                  separated: true,
                  onClick: () => onRequestDelete(g.id),
                },
              ])
            }
          />
        ))}
        <AddRow label="フォルダを追加" onClick={createGroup} />
      </div>
      {footer && (
        <div className="shrink-0 border-t border-border p-2 flex items-center gap-2">
          {footer}
        </div>
      )}
    </div>
  );
}

/** One folder row: reorder (grip = instant, whole row = press-and-hold), a def
 * drop target (dropProps), inline rename, and a delete ✕. */
function FolderRow({
  g,
  index,
  active,
  dnd,
  dropProps,
  dropRingCls,
  editing,
  editRef,
  editDraft,
  onEditDraft,
  onCommitEdit,
  onCancelEdit,
  onStartEdit,
  onSelect,
  onDelete,
  onContextMenu,
}: {
  g: DefinitionGroup;
  index: number;
  active: boolean;
  dnd: DragReorder;
  dropProps: HTMLAttributes<HTMLDivElement>;
  dropRingCls: string;
  editing: boolean;
  editRef: RefObject<HTMLInputElement | null>;
  editDraft: string;
  onEditDraft: (v: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onStartEdit: () => void;
  onSelect: () => void;
  onDelete: () => void;
  onContextMenu: (e: ReactMouseEvent) => void;
}) {
  const { t } = useTranslation();
  const handle = dnd.handleProps(index);
  const hold = useHoldReorder(handle);
  return (
    <div {...dnd.rowProps(index)}>
      <div
        className={
          "relative z-10 h-0.5 -mb-0.5 rounded-full transition-colors " +
          (dnd.showBefore(index) ? "bg-accent" : "bg-transparent")
        }
      />
      <div
        {...dropProps}
        onContextMenu={editing ? undefined : onContextMenu}
        draggable={!editing && hold.held}
        onPointerDown={editing ? undefined : hold.onPointerDown}
        onDragStart={hold.onDragStart}
        onDragEnd={hold.onDragEnd}
        className={
          "group " +
          itemCls(active) +
          (dnd.isDragging(index) ? " opacity-40" : "") +
          (hold.held ? " shadow-sm ring-1 ring-accent/25" : "") +
          dropRingCls
        }
      >
        <span
          draggable={!editing}
          data-reorder-grip
          className="self-stretch px-1.5 cursor-grab select-none shrink-0 text-text3 inline-flex items-center"
          data-tip={t("ドラッグで並べ替え")}
        >
          <IconGripVertical size={14} aria-hidden />
        </span>
        {editing ? (
          <RenameInput
            ref={editRef}
            value={editDraft}
            onChange={onEditDraft}
            onCommit={onCommitEdit}
            onCancel={onCancelEdit}
          />
        ) : (
          <button
            onClick={onSelect}
            onDoubleClick={onStartEdit}
            className="flex-1 min-w-0 text-left px-1 py-2 truncate inline-flex items-center gap-2"
          >
            <IconFolder size={16} className="shrink-0" aria-hidden />
            <span className="truncate">{g.name || t("(名前なし)")}</span>
          </button>
        )}
        <button
          onClick={onDelete}
          className="px-1 shrink-0 text-text3 hover:text-danger opacity-0 group-hover:opacity-100 focus:opacity-100 inline-flex items-center"
          data-tip={t("削除")}
          aria-label={t("削除")}
        >
          <IconX size={15} aria-hidden />
        </button>
      </div>
      <div
        className={
          "relative z-10 h-0.5 -mt-0.5 rounded-full transition-colors " +
          (dnd.showAfter(index) ? "bg-accent" : "bg-transparent")
        }
      />
    </div>
  );
}
