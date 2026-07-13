import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { IconHelpCircle } from "@tabler/icons-react";
import { useStore } from "../../store";

/** The one page header used across every top-level page (key assignment / profiles
 * / saved operations / settings). A leading icon chip gives each page its own identity,
 * then the title with an optional one-line description inline to its right (kept
 * on one line so the bar stays short), and an optional right-aligned action
 * slot. Keeps type scale, colour and spacing identical everywhere. */
export function PageHeader({
  title,
  desc,
  icon,
  right,
  helpSection,
}: {
  title: string;
  /** Optional one-line description shown muted, inline after the title. */
  desc?: string;
  /** Small Tabler icon shown in the leading chip (gives the page identity). */
  icon?: ReactNode;
  right?: ReactNode;
  /** When set, show a ? button that jumps to this section on the help page. */
  helpSection?: string;
}) {
  const { t } = useTranslation();
  const navigate = useStore((s) => s.navigate);
  return (
    <div className="shrink-0 flex items-center justify-between gap-4 px-2 py-2 border-b border-border/60">
      <div className="flex items-center gap-2 min-w-0">
        {icon && (
          <span className="shrink-0 w-6 h-6 rounded-card bg-bg3 text-accent flex items-center justify-center">
            {icon}
          </span>
        )}
        <h2 className="shrink-0 text-title font-semibold leading-none">
          {t(title)}
        </h2>
        {desc && (
          <p className="min-w-0 truncate text-caption text-text3 leading-none">
            {t(desc)}
          </p>
        )}
      </div>
      <div className="shrink-0 flex items-center gap-1">
        {right}
        {helpSection && (
          <button
            onClick={() => navigate("help", { helpSection })}
            data-tip={t("このページのヘルプ")}
            aria-label={t("このページのヘルプ")}
            className="inline-flex items-center justify-center w-6 h-6 rounded-row text-text3 hover:bg-bg3 hover:text-text transition-colors"
          >
            <IconHelpCircle size={15} aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
