import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "./cn";

/** The section header of a left rail (profiles / layers / folders / settings …).
 * One place owns the height + padding so every rail's header lines up (they used
 * to drift apart when tweaked). `action` is the optional right-aligned control
 * (＋ / Manage… button); `bordered` is the tighter, top-bordered sub-section header
 * (the layer list under the profile list). */
export function RailHeader({
  title,
  action,
  bordered = false,
}: {
  title: ReactNode;
  action?: ReactNode;
  bordered?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "shrink-0 flex items-center justify-between h-[32px] px-2 pb-1",
        bordered ? "pt-2 border-t border-border" : "pt-3",
      )}
    >
      <span className="text-label font-semibold text-text2">
        {typeof title === "string" ? t(title) : title}
      </span>
      {action}
    </div>
  );
}
