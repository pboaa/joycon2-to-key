import type { ReactNode } from "react";

/** The shared inner layout for a selectable list row (profiles / layers /
 * operations): an optional leading icon, a primary label, and an optional
 * secondary line. Keeps every list reading the same — one type scale, the same
 * truncation and the same selected-state colour. Drop it inside a row button
 * (usually via {@link ReorderableRow}); pass `LIST_ROW_BTN` as that button's
 * className so the padding/gap match too. */
export function RowLabel({
  icon,
  label,
  sub,
  selected = false,
  mono = false,
  reserveIcon,
}: {
  icon?: ReactNode;
  label: ReactNode;
  /** Optional secondary line (app hint / key label). Falsy = single-line row. */
  sub?: ReactNode;
  selected?: boolean;
  /** Render the secondary line monospace (e.g. key labels). */
  mono?: boolean;
  /** When set (px), rows without an icon still reserve this much leading width,
   * so labels line up with icon'd rows in the same list instead of shifting left. */
  reserveIcon?: number;
}) {
  return (
    <>
      {icon ??
        (reserveIcon != null ? (
          <span
            aria-hidden
            className="shrink-0"
            style={{ width: reserveIcon }}
          />
        ) : null)}
      <span className="min-w-0 flex-1 leading-tight">
        <span
          className={"block truncate text-label " + (selected ? "font-medium" : "")}
        >
          {label}
        </span>
        {sub ? (
          <span
            className={
              "block truncate text-caption " +
              (mono ? "font-mono " : "") +
              (selected ? "text-white/70" : "text-text3")
            }
          >
            {sub}
          </span>
        ) : null}
      </span>
    </>
  );
}
