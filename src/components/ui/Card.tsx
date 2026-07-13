// A card for settings groups etc.: a heading (with an optional right action) + body.
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "./cn";

export interface CardProps {
  title?: ReactNode;
  desc?: ReactNode;
  action?: ReactNode; // 見出し右の操作（ボタン等）
  children?: ReactNode;
  className?: string;
}

export function Card({ title, desc, action, children, className }: CardProps) {
  const { t } = useTranslation();
  const hasHead = title != null || desc != null || action != null;
  return (
    <section
      className={cn(
        "bg-bg border border-border rounded-card px-4 py-3.5",
        className,
      )}
    >
      {hasHead && (
        <div className="flex items-start justify-between gap-2.5 mb-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            {title != null && (
              <h3 className="text-heading font-bold text-text tracking-[0.01em]">
                {typeof title === "string" ? t(title) : title}
              </h3>
            )}
            {desc != null && (
              <p className="text-label text-text2 leading-[1.5]">
                {typeof desc === "string" ? t(desc) : desc}
              </p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}
