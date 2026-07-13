import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "./cn";

/** Muted placeholder for an empty list / no selection. `centered` fills the
 * parent and centers the message (right-pane variant). String children are
 * translated (JA source keys). */
export function EmptyState({
  children,
  centered = false,
  className,
}: {
  children: ReactNode;
  centered?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  if (typeof children === "string") children = t(children);
  if (centered) {
    return (
      <div
        className={cn(
          "h-full flex items-center justify-center text-center text-body text-text3",
          className,
        )}
      >
        {children}
      </div>
    );
  }
  return (
    <p className={cn("text-label text-text3 p-1", className)}>{children}</p>
  );
}
