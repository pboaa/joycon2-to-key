import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

/** A label with a dotted underline; hovering shows the explanation tooltip via
 * the global `data-tip` host (so it shares one style + positioning with every
 * other tooltip). String `text`/`children` are translated. */
export function HelpText({
  text,
  children,
}: {
  text: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <span
      data-tip={t(text)}
      className="border-b border-dotted border-border cursor-help"
    >
      {typeof children === "string" ? t(children) : children}
    </span>
  );
}
