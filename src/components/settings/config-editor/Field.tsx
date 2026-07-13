import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { HelpText } from "../../HelpText";

/** A labelled field; the label carries an optional hover tooltip. */
export function Field({
  label,
  tip,
  children,
}: {
  label: string;
  tip?: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div>
      <div className="text-caption font-semibold text-text2 mb-0.5">
        {tip ? <HelpText text={tip}>{label}</HelpText> : t(label)}
      </div>
      {children}
    </div>
  );
}
