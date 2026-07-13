import type { ReactNode } from "react";
import { cn } from "./cn";

/** A small trailing icon button inside a selectable list row (duplicate ⧉,
 * delete ✕, …). Its colour keys off the row's `selected` state so it reads on
 * the accent-filled highlight; `tone="danger"` tints the unselected hover red.
 * Pass `className` for per-row padding / hover-reveal. */
export function RowActionButton({
  selected,
  onClick,
  tone = "default",
  title,
  className,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  /** `danger` turns the unselected hover red (destructive actions). */
  tone?: "default" | "danger";
  title?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      data-tip={title}
      className={cn(
        "shrink-0 text-label",
        selected
          ? "text-white/70 hover:text-white"
          : tone === "danger"
            ? "text-text3 hover:text-danger"
            : "text-text3 hover:text-text",
        className,
      )}
    >
      {children}
    </button>
  );
}
