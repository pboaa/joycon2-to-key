import { memo, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ButtonAssignment, JoyConSide } from "../../lib/types";
import { useJoyConSnapshot } from "../../lib/useJoyCon";
import { useStore } from "../../store";
import { lighten, darken, sameColor, deepenMapColor } from "../../lib/joyconColors";
import { makeDefResolver } from "../../lib/defResolver";
import type { Heatmap } from "../../lib/useHeatmap";
import { USAGE_WINDOWS } from "../../lib/usage";
import { useUsageHeat } from "../../lib/useUsageHeat";
import { useResetUsage } from "../../lib/useResetUsage";
import { BUTTON_KEYS_LEFT, BUTTON_KEYS_RIGHT, buttonLabel } from "../../lib/keyCatalog";
import { shortLabel } from "../../lib/variants";
import { JoyConPad } from "../joycon/JoyConPad";
import { JoyConPadRight } from "../joycon/JoyConPadRight";
import { MapContext } from "../joycon/padParts";

/** The centre stage: one Joy-Con figure (L or R) with an L/R toggle, plus the
 * current layer above. Owns the high-frequency snapshot poll, so live
 * stick/button updates re-render only this subtree — not the whole MainScreen.
 * On connect the shown side follows the connected controller; the toggle lets
 * the user switch to map the other side too. Live input only lights the pad of
 * the actually-connected side. */
export const JoyConStage = memo(function JoyConStage({
  buttons,
  selected,
  onSelect,
  onDeselect,
  onContext,
  inheritedKeys,
  stickMouse,
  stickMouseR,
  heatmap,
  heatControls = true,
}: {
  buttons: Record<string, ButtonAssignment>;
  selected: string | null;
  onSelect: (b: string) => void;
  onDeselect: () => void;
  /** Right-click a button on the figure (opens a context menu at the parent). */
  onContext?: (key: string, e: React.MouseEvent) => void;
  inheritedKeys?: Set<string>;
  /** The layer's stick→mouse flags per side (shows the mouse badge on the pad of
   * the matching side, and hides that stick's digital directions). */
  stickMouse: boolean;
  stickMouseR: boolean;
  /** Usage-heatmap state + controls, shown below the L/R toggle on the figure.
   * Omitted on the key-assignment page (the heatmap lives on the Stats page). */
  heatmap?: Heatmap;
  /** Show the heatmap toggle/window/reset on the figure. Off on the Stats page,
   * where those controls live in the left rail instead. */
  heatControls?: boolean;
}) {
  const { t } = useTranslation();
  const resetHeat = useResetUsage(() => heatmap?.refresh());
  const heatOn = heatmap?.on ?? false;
  const usageWin = heatmap?.win ?? "all";
  const usage = heatmap?.usage ?? {};
  const snapshot = useJoyConSnapshot();
  const stickDeadzone = useStore((s) => s.settings.stickDeadzone);
  const mapColor = useStore((s) => s.settings.mapColor);
  const accentL = useStore((s) => s.settings.accentL);
  const accentR = useStore((s) => s.settings.accentR);
  // Per-operation colours: a button linked to a coloured saved operation is
  // filled with that colour on the figure (resolved from the library by id).
  const definitions = useStore((s) => s.definitions);
  const resolveDefColor = useMemo(
    () => makeDefResolver(definitions).color,
    [definitions],
  );
  const selProfile = useStore((s) => s.selectedProfile);
  const selLayer = useStore((s) => s.selectedLayer);
  const liveSide = snapshot?.side ?? null;
  const [manualSide, setManualSide] = useState<JoyConSide>("l");

  // Follow the connected controller's side automatically; manual switching
  // still works (e.g. to map the other side while disconnected).
  useEffect(() => {
    if (liveSide) setManualSide(liveSide);
  }, [liveSide]);

  const shownSide = manualSide;

  // Switching the shown pad (manually or via auto-follow) hides the other
  // side's buttons — a selection there would keep the editor/stats panel on a
  // button that's no longer on screen, so drop it when the side changes.
  useEffect(() => {
    if (!selected) return;
    const keys = shownSide === "r" ? BUTTON_KEYS_RIGHT : BUTTON_KEYS_LEFT;
    if (!keys.includes(selected)) onDeselect();
  }, [shownSide, selected, onDeselect]);

  const live = shownSide === liveSide;
  const accent = shownSide === "r" ? accentR : accentL;

  // The "assigned/mapped" highlight colours (user setting), provided to both
  // pads — SVG fill attributes can't read CSS vars, so this is resolved in JS.
  // Bright picks (the light accent colours) are deepened so they read as a calm
  // highlight; when the highlight matches the side accent the two blend, so
  // darken it further to stay distinguishable. The softer label tint is derived
  // by lightening.
  const mapColors = useMemo(() => {
    const base = deepenMapColor(mapColor);
    const map = sameColor(mapColor, accent) ? darken(base, 0.28) : base;
    return { map, mapSoft: lighten(map, 0.4) };
  }, [mapColor, accent]);

  // Shared usage→heat (same normalisation as the Stats panel, so equal counts get
  // equal colours). Cheap when off (usage is {}); heatOn just gates the output.
  const { counts, colorOf } = useUsageHeat(usage, usageWin, selProfile, selLayer);
  const heat = useMemo(() => {
    if (!heatOn) return undefined;
    const keys = shownSide === "r" ? BUTTON_KEYS_RIGHT : BUTTON_KEYS_LEFT;
    const m: Record<string, { color: string; count: number }> = {};
    for (const k of keys) {
      const c = counts[k] ?? 0;
      m[k] = { color: colorOf(c), count: c };
    }
    return m;
  }, [heatOn, counts, colorOf, shownSide]);

  const pressed = live ? (snapshot?.buttons ?? null) : null;

  // Live "it's firing" readout: mapped buttons currently held, shown as
  // ZR → B chips so a mapping's effect is visible while setting it up. Only
  // digital buttons (the snapshot's pressed state); appears only while pressed.
  const firing = useMemo(() => {
    if (!pressed) return [];
    const keys = shownSide === "r" ? BUTTON_KEYS_RIGHT : BUTTON_KEYS_LEFT;
    const out: { key: string; name: string; label: string }[] = [];
    for (const k of keys) {
      if (!pressed[k as keyof typeof pressed]) continue;
      const a = buttons[k];
      if (!a || a.press.type === "none") continue;
      out.push({ key: k, name: buttonLabel(k), label: shortLabel(a.press) });
    }
    return out;
  }, [pressed, buttons, shownSide]);

  const padProps = {
    buttons,
    selected,
    onSelect,
    onDeselect,
    onContext,
    inheritedKeys,
    pressed,
    stick: live ? (snapshot?.stick ?? { x: 0, y: 0 }) : { x: 0, y: 0 },
    stickMouse: shownSide === "r" ? stickMouseR : stickMouse,
    stickDeadzone,
    accent,
    heat,
    resolveDefColor,
  };

  return (
    <div className="relative min-h-0 h-full w-full flex items-center justify-center overflow-hidden">
      {/* L/R toggle + heatmap controls, pinned top-right (heatmap stacks below). */}
      <div className="absolute top-0 right-0 z-10 flex flex-col items-end gap-1.5">
        <SideToggle shown={shownSide} onChange={setManualSide} />
        {heatmap && heatControls && (
          <>
            <button
              type="button"
              onClick={() => heatmap.setOn(!heatmap.on)}
              data-tip={t("ボタンの使用回数を色で表示")}
              className={
                "px-2.5 py-0.5 text-label font-medium rounded-full border transition-colors " +
                (heatmap.on
                  ? "bg-accent text-white border-accent"
                  : "bg-bg2 text-text2 border-border hover:bg-bg3")
              }
            >
              {t("ヒートマップ")}
            </button>
            {heatmap.on && (
              <>
                <div className="inline-flex flex-col rounded-row overflow-hidden border border-border text-caption">
                  {USAGE_WINDOWS.map((w) => (
                    <button
                      key={w.key}
                      type="button"
                      onClick={() => heatmap.setWin(w.key)}
                      className={
                        "px-2 py-0.5 text-right transition-colors " +
                        (heatmap.win === w.key
                          ? "bg-accent text-white"
                          : "bg-bg2 text-text2 hover:bg-bg3")
                      }
                    >
                      {t(w.label)}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={resetHeat}
                  data-tip={t("使用回数をリセット")}
                  className="px-2 py-0.5 text-caption rounded-full border border-border bg-bg2 text-text3 hover:bg-bg3"
                >
                  {t("リセット")}
                </button>
              </>
            )}
          </>
        )}
      </div>
      <div className="h-full flex items-center justify-center overflow-hidden">
        <MapContext.Provider value={mapColors}>
          {shownSide === "r" ? (
            <JoyConPadRight {...padProps} />
          ) : (
            <JoyConPad {...padProps} />
          )}
        </MapContext.Provider>
      </div>

      {/* Live-fire readout: only while mapped buttons are held. Click-through. */}
      {firing.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-1 z-10 flex flex-wrap justify-center gap-1 px-2">
          {firing.map((f) => (
            <span
              key={f.key}
              className="inline-flex items-center gap-1 rounded-row border border-accent bg-accent/15 px-1.5 py-0.5 text-caption text-accent shadow-sm"
            >
              <span className="font-mono font-semibold">{f.name}</span>
              <span className="text-text3">→</span>
              <span className="font-mono">{f.label || t("未設定")}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

/** Small L / R segmented control to switch the shown pad. */
function SideToggle({
  shown,
  onChange,
}: {
  shown: JoyConSide;
  onChange: (s: JoyConSide) => void;
}) {
  const { t } = useTranslation();
  const btn = (side: JoyConSide, label: string) => {
    const on = shown === side;
    return (
      <button
        type="button"
        onClick={() => onChange(side)}
        data-tip={t("{{label}} を表示", { label })}
        className={
          "px-2 py-0.5 text-label font-medium transition-colors " +
          (on
            ? "bg-accent text-white"
            : "bg-bg2 text-text2 hover:bg-bg3 ")
        }
      >
        {label}
      </button>
    );
  };
  return (
    <div className="inline-flex rounded-full overflow-hidden border border-border ">
      {btn("l", "L")}
      {btn("r", "R")}
    </div>
  );
}
