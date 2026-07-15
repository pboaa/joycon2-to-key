import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "./cn";

/** Muted placeholder for an empty list / no selection. `centered` fills the
 * parent and centers the message (right-pane variant); an optional `icon`
 * sits above it, so every side pane's "select something" hint reads the
 * same. String children are translated (JA source keys). */
export function EmptyState({
  children,
  centered = false,
  icon,
  className,
}: {
  children: ReactNode;
  centered?: boolean;
  /** Large muted icon above the message (centered variant only). */
  icon?: ReactNode;
  className?: string;
}) {
  const { t } = useTranslation();
  if (typeof children === "string") children = t(children);
  if (centered) {
    return (
      <div
        className={cn(
          "h-full flex flex-col items-center justify-center gap-3 p-6 text-center text-body text-text3 leading-relaxed",
          className,
        )}
      >
        {icon && (
          <span aria-hidden className="text-text3/60">
            {icon}
          </span>
        )}
        <div>{children}</div>
      </div>
    );
  }
  return (
    <p className={cn("text-label text-text3 p-1", className)}>{children}</p>
  );
}
