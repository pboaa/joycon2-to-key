import type { ReactNode } from "react";
import { cn } from "./cn";
import { LIST_BODY_CLS } from "./layout";
import type { DragReorder } from "../../lib/useDragReorder";

/** Left column of the manager modals: fixed width, right border, optional
 * header rows (group bar, search box), a scrollable list body, and a footer
 * slot for the add button. Pass `dnd` to make the gaps between rows valid
 * drop targets (omit it while reordering is disabled). */
export function ListPane({
  width = "w-[220px]",
  header,
  footer,
  dnd,
  onBodyContextMenu,
  children,
}: {
  width?: string;
  header?: ReactNode;
  footer?: ReactNode;
  dnd?: DragReorder;
  /** Right-click the list body (its empty area — rows stop propagation). */
  onBodyContextMenu?: (e: React.MouseEvent) => void;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        width,
        "flex flex-col min-h-0 border-r border-border",
      )}
    >
      {header}
      <div
        className={`flex-1 min-h-0 ${LIST_BODY_CLS}`}
        {...(dnd?.containerProps ?? {})}
        onContextMenu={onBodyContextMenu}
      >
        {children}
      </div>
      {footer && (
        <div className="p-2 border-t border-border">{footer}</div>
      )}
    </div>
  );
}
