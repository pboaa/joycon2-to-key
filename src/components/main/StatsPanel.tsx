import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconPencil } from "@tabler/icons-react";
import type { Definition, PressConfig } from "../../lib/types";
import type { Heatmap } from "../../lib/useHeatmap";
import { getPieUsage, type DayPieUsageMap } from "../../lib/tauri";
import { sumPieUsage } from "../../lib/usage";
import { useUsageHeat } from "../../lib/useUsageHeat";
import { inputsLabel, assignmentLabel } from "../../lib/variants";
import { makeDefResolver } from "../../lib/defResolver";
import { useStore } from "../../store";
import { KeyCap } from "../ui/KeyCap";
import { SIDE_PANEL_CLS } from "../ui/layout";
import { PieFigure } from "../pie/PieFigure";

/** Right-hand column of the Stats mode (same width/place as the editor column so
 * the figure never shifts when switching): the selected button's total
 * activations, and — for a pie/pie button — the real pie rendered with its
 * assignments plus the per-direction usage counts below. The rolling window is
 * shared with the figure's heatmap controls. */
export function StatsPanel({
  btnKey,
  press,
  defId,
  definitions,
  heatmap,
}: {
  btnKey: string | null;
  press: PressConfig | null;
  /** The button's linked saved-operation id, if any (shows its name). */
  defId?: string;
  definitions?: Definition[];
  heatmap: Heatmap;
}) {
  const { t } = useTranslation();
  const selProfile = useStore((s) => s.selectedProfile);
  const selLayer = useStore((s) => s.selectedLayer);
  const navigate = useStore((s) => s.navigate);
  const win = heatmap.win;
  const isPie = press?.type === "pie";

  // Shared with the figure: per-button counts + a colorOf on the same scale.
  const { counts: btnCounts, colorOf } = useUsageHeat(
    heatmap.usage,
    win,
    selProfile,
    selLayer,
  );

  // Per-direction pie counts live in a separate store; fetch when a pie
  // button is selected and refresh alongside the polled button usage.
  const [pieUsage, setPieUsage] = useState<DayPieUsageMap>({});
  useEffect(() => {
    if (isPie) getPieUsage().then(setPieUsage).catch(() => {});
  }, [isPie, btnKey, heatmap.usage]);
  // Which slice is highlighted in the rendered pie (mirrors the count row).
  const [dir, setDir] = useState(0);

  const { name: resolveName, icon: resolveIcon, color: resolveColor } = makeDefResolver(definitions);

  // The operation assigned to this button (saved-op name / keys / pie menu).
  const opLabel = assignmentLabel(press, defId, resolveName);

  const content =
    btnKey ? (
      <>
        <div className="shrink-0 px-3 py-2 border-b border-border flex items-center gap-2">
          <KeyCap k={btnKey} size="md" />
          <span className="min-w-0 flex-1 text-body text-text2 truncate">
            {opLabel || t("未設定")}
          </span>
          {/* Round-trip to editing: the button stays selected across the mode
              switch, so the key-assignment page opens straight on it. */}
          <button
            onClick={() => navigate("keys")}
            data-tip={t("このボタンを編集")}
            aria-label={t("このボタンを編集")}
            className="shrink-0 inline-flex items-center gap-1 rounded-row px-1.5 py-0.5 text-caption text-text3 transition-colors hover:bg-bg3 hover:text-accent"
          >
            <IconPencil size={12} aria-hidden />
            {t("編集")}
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-body text-text2">{t("発火回数")}</span>
            <span className="text-title font-semibold tabular-nums">
              {btnCounts[btnKey] ?? 0}
            </span>
          </div>
          {press &&
            press.type === "pie" &&
            (() => {
              const counts = sumPieUsage(pieUsage, selProfile, selLayer, btnKey, win);
              const total = Object.values(counts).reduce((a, b) => a + b, 0);
              // colorOf uses the figure's max, so a count is the same colour here.
              const heatFill = (i: number) =>
                colorOf(counts[i === -1 ? "center" : String(i)] ?? 0);
              const heatCount = (i: number) =>
                counts[i === -1 ? "center" : String(i)] ?? 0;
              return (
                <div className="border-t border-border pt-2 space-y-2">
                  {/* The actual pie, painted with the usage heatmap colours. */}
                  <PieFigure
                    slices={press.slices}
                    centerInputs={press.center}
                    selected={dir}
                    onSelect={setDir}
                    resolveDefName={resolveName}
                    resolveDefIcon={resolveIcon}
                    resolveDefColor={resolveColor}
                    heatFill={heatFill}
                    heatCount={heatCount}
                  />
                  <div className="space-y-0.5 text-body">
                    <div className="text-caption font-semibold text-text2 mb-1">
                      {t("方向別の使用回数")}
                    </div>
                    {press.slices.map((s, i) => {
                      const name = inputsLabel(s.inputs, resolveName);
                      return (
                        <StatRow
                          key={i}
                          label={name || `${t("方向")}${i + 1}`}
                          muted={!name}
                          count={counts[String(i)] ?? 0}
                          on={dir === i}
                          onHover={() => setDir(i)}
                        />
                      );
                    })}
                    {(() => {
                      const name =
                        press.center && press.center.length > 0
                          ? inputsLabel(press.center, resolveName)
                          : "";
                      return (
                        <StatRow
                          label={name || t("中央")}
                          muted={!name}
                          count={counts["center"] ?? 0}
                          on={dir === -1}
                          onHover={() => setDir(-1)}
                        />
                      );
                    })()}
                    {total === 0 && (
                      <p className="text-caption text-text3 pt-1">
                        {t("まだ発火の記録がありません。")}
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}
        </div>
      </>
    ) : (
      <div className="flex items-center justify-center p-4 text-center text-body text-text3 leading-relaxed">
        {t("図のボタンを選ぶと、使用回数が表示されます。")}
      </div>
    );

  return (
    <div className={SIDE_PANEL_CLS}>{content}</div>
  );
}

function StatRow({
  label,
  count,
  on,
  muted,
  onHover,
}: {
  label: string;
  count: number;
  on?: boolean;
  /** True when the label is a placeholder (unassigned) — dim it, like direction N. */
  muted?: boolean;
  onHover?: () => void;
}) {
  return (
    <div
      onMouseEnter={onHover}
      className={
        "flex items-center justify-between gap-2 rounded-row px-1 -mx-1 " +
        (on ? "bg-bg3" : "")
      }
    >
      <span className={"min-w-0 truncate " + (muted ? "text-text3" : "text-text2")}>
        {label}
      </span>
      <span className="shrink-0 tabular-nums">{count}</span>
    </div>
  );
}
