import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { IconX } from "@tabler/icons-react";
import { cn } from "./cn";
import { useEscapeKey } from "../../lib/useEscapeKey";

/** Shared size for the definitions manager (its editor pane is content-heavy —
 * roomy for pie editing, but clamped so it still fits the min window). */
export const MANAGER_WIDTH = "w-[920px] max-w-[calc(100vw-2rem)]";
export const MANAGER_HEIGHT = "h-[88vh]";

/** The one modal chrome: dimmed backdrop (click to close), panel, header with
 * title + ✕, optional footer bar. Escape closes the topmost open modal. */
export function ModalShell({
  title,
  onClose,
  children,
  footer,
  width = "w-[420px]",
  height,
  z = 50,
  bodyClassName = "overflow-y-auto p-2.5",
  closeOnEscape = true,
  hideClose = false,
}: {
  title?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** Tailwind width class, e.g. "w-[760px]". */
  width?: string;
  /** Tailwind height class, e.g. "h-[80vh]"; defaults to content-sized. */
  height?: string;
  /** 60 overlays other modals (e.g. a picker on top of a manager). */
  z?: 50 | 60;
  /** Body layout; default is a padded scroll area. Managers pass "flex" so
   * their columns own the scrolling. */
  bodyClassName?: string;
  closeOnEscape?: boolean;
  /** Hide the header ✕ (dialogs whose actions are explicit footer buttons).
   * With no title either, the header bar is dropped entirely. */
  hideClose?: boolean;
}) {
  const { t } = useTranslation();
  useEscapeKey(onClose, closeOnEscape);
  const showHeader = title != null || !hideClose;
  // Render at document.body so every modal backdrop is a body-level sibling.
  // In-tree rendering let an ancestor stacking context (e.g. a backdrop-filter)
  // trap a modal, so a z-60 confirm could end up behind a z-50 modal.
  return createPortal(
    <div
      data-modal-backdrop
      className={cn(
        "fixed inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[3px] p-4",
        z === 60 ? "z-[var(--z-modal-top)]" : "z-[var(--z-modal)]",
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          "flex flex-col overflow-hidden rounded-card border border-border bg-bg",
          "shadow-modal ring-1 ring-edge animate-pop-in",
          height ?? "max-h-[85vh]",
          width,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {showHeader && (
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border bg-bg2">
            <h3 className="text-title font-semibold text-text truncate">
              {typeof title === "string" ? t(title) : title}
            </h3>
            {!hideClose && (
              <button
                onClick={onClose}
                className="shrink-0 -mr-1 inline-flex items-center rounded-row p-1 text-text3 hover:text-text hover:bg-bg3 transition-colors"
                aria-label={t("閉じる")}
              >
                <IconX size={16} aria-hidden />
              </button>
            )}
          </div>
        )}
        <div className={cn("flex-1 min-h-0", bodyClassName)}>{children}</div>
        {footer && (
          <div className="px-4 py-2.5 border-t border-border bg-bg2 flex items-center gap-2 text-label">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
