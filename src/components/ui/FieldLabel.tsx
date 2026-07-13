import type { LabelHTMLAttributes } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "./cn";

/** Uppercase section/field label used in every settings pane. String children
 * are translated (they're JA source keys). */
export function FieldLabel({
  className,
  children,
  ...rest
}: LabelHTMLAttributes<HTMLLabelElement>) {
  const { t } = useTranslation();
  return (
    <label
      className={cn(
        "block text-caption font-semibold uppercase tracking-wide text-text3 mb-1",
        className,
      )}
      {...rest}
    >
      {typeof children === "string" ? t(children) : children}
    </label>
  );
}
