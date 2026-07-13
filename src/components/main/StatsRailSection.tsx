import { useTranslation } from "react-i18next";
import { IconRotate } from "@tabler/icons-react";
import type { Heatmap } from "../../lib/useHeatmap";
import { USAGE_WINDOWS } from "../../lib/usage";
import { buttonLabel } from "../../lib/keyCatalog";
import { useResetUsage } from "../../lib/useResetUsage";
import { KeyCap } from "../ui/KeyCap";

/** Stats mode footer for the left rail: the "unused (but assigned)" list for the
 * chosen window, then the usage-window list (Today/Week/Month/All-time) plus a reset — so
 * the figure keeps no floating heatmap controls. Rendered as KeysRail's `footer`
 * slot; the rail itself stays a plain navigator. */
export function StatsRailSection({
  heatmap,
  unused = [],
  onSelect,
}: {
  heatmap: Heatmap;
  /** Button keys that are assigned but had 0 activations in the window. */
  unused?: string[];
  onSelect?: (key: string) => void;
}) {
  const { t } = useTranslation();
  const resetHeat = useResetUsage(heatmap.refresh);

  return (
    <>
      {/* Unused-but-assigned list: the main point of the stats view is spotting
          mappings that aren't earning their place. Click one to select it. */}
      <div className="shrink-0 border-t border-border p-2">
        <div className="mb-1 text-caption font-semibold text-text2">
          {t("未使用（割り当て済み）")}
          <span className="ml-1 text-text3">（{unused.length}）</span>
        </div>
        {unused.length === 0 ? (
          <p className="text-caption text-text3 leading-relaxed">
            {t("この期間はすべて使われています。")}
          </p>
        ) : (
          <div className="flex flex-wrap gap-1 max-h-[112px] overflow-y-auto">
            {unused.map((k) => (
              <button
                key={k}
                onClick={() => onSelect?.(k)}
                aria-label={buttonLabel(k)}
                className="rounded-row transition-transform hover:scale-105"
              >
                <KeyCap k={k} size="sm" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* One compact row (period segmented control + reset) so its top border
          lines up with the connection button's footer in the nav. */}
      <div className="shrink-0 border-t border-border p-2 flex items-center gap-1">
      <div className="flex-1 inline-flex h-7 rounded-row overflow-hidden border border-border text-caption">
        {USAGE_WINDOWS.map((w) => (
          <button
            key={w.key}
            onClick={() => heatmap.setWin(w.key)}
            className={
              "flex-1 min-w-0 px-1 transition-colors " +
              (heatmap.win === w.key
                ? "bg-accent text-white"
                : "text-text2 hover:bg-bg3")
            }
          >
            {t(w.label)}
          </button>
        ))}
      </div>
      <button
        onClick={resetHeat}
        data-tip={t("使用回数をリセット")}
        aria-label={t("使用回数をリセット")}
        className="shrink-0 w-7 h-7 rounded-row border border-border text-text3 hover:bg-bg3 hover:text-danger inline-flex items-center justify-center"
      >
        <IconRotate size={13} aria-hidden />
      </button>
      </div>
    </>
  );
}
