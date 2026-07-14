import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { listen } from "@tauri-apps/api/event";
import type { InputCommand, PieAppearance } from "./lib/types";
import { DEFAULT_GLOBAL_SETTINGS } from "./lib/types";
import { loadWorkspace } from "./lib/tauri";
import { inputsLabel } from "./lib/variants";
import { hexToRgba } from "./lib/pieGeometry";
import { type PieLookValues, DEFAULT_LOOK, mergeLook, lookFromSettings } from "./lib/pieLook";
import { PieVisual, deadzoneRadius, type PieSlice } from "./components/PieVisual";

interface Menu {
  slices: PieSlice[];
  center: InputCommand[];
  /** Per-pie look override (merged over the global style). */
  appearance?: PieAppearance;
  /** Per-pie threshold (px) for the dead-zone circle. */
  threshold?: number;
  /** True when shown as the settings preview (static, no cursor). */
  preview?: boolean;
}

const DEFAULT_STYLE: PieLookValues = DEFAULT_LOOK;

/** The pie-menu overlay. Drawn in a transparent, click-through, focus-preserving
 * topmost window. From the input thread it receives:
 *  - `pie-open`: each slice's angle + assigned inputs (and the centre)
 *  - `pie-dir`: the currently-pointed slice index (`-1` = centre)
 * and renders them. The look (background colour, opacity, highlight colour, label
 * visibility) and definition names are read from workspace settings, refreshed
 * every time it opens. */
export function PieOverlay() {
  const { t } = useTranslation();
  const [menu, setMenu] = useState<Menu>({ slices: [], center: [] });
  const [current, setCurrent] = useState(-2); // -2 not yet / -1 centre / ≥0 slice
  const [defNames, setDefNames] = useState<Record<string, string>>({});
  const [defIcons, setDefIcons] = useState<Record<string, string>>({});
  const [defColors, setDefColors] = useState<Record<string, string>>({});
  const [style, setStyle] = useState<PieLookValues>(DEFAULT_STYLE);
  const [globalThreshold, setGlobalThreshold] = useState(
    DEFAULT_GLOBAL_SETTINGS.pieThreshold,
  );
  // Cursor offset from the pie start (physical px). Reset on open; updated
  // from pie-pos. Used to place the active label at the mouse.
  const [offset, setOffset] = useState<[number, number] | undefined>();
  // The overlay is full-screen; the pie is drawn at this centre (CSS px, window-
  // relative) = the pie start. `null` until the first `pie-center` arrives, so
  // the very first open doesn't flash at the window's top-left for a frame.
  // `globalSize` is the global pie box size (a pie can override it via its
  // appearance).
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [globalSize, setGlobalSize] = useState(DEFAULT_GLOBAL_SETTINGS.pieOverlaySize);

  const refreshFromWorkspace = () => {
    loadWorkspace()
      .then((ws) => {
        const map: Record<string, string> = {};
        const icons: Record<string, string> = {};
        const colors: Record<string, string> = {};
        for (const d of ws.definitions?.definitions ?? []) {
          map[d.id] = d.name;
          if (d.icon) icons[d.id] = d.icon;
          if (d.iconColor) colors[d.id] = d.iconColor;
        }
        setDefNames(map);
        setDefIcons(icons);
        setDefColors(colors);
        const s = ws.settings;
        if (s) {
          setStyle(lookFromSettings(s));
          setGlobalThreshold(s.pieThreshold);
          setGlobalSize(s.pieOverlaySize);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    refreshFromWorkspace();
    const pending = [
      listen<Menu>("pie-open", (e) => {
        setMenu(e.payload);
        setCurrent(-2);
        setOffset(undefined);
        refreshFromWorkspace();
      }),
      listen<number>("pie-dir", (e) => setCurrent(e.payload)),
      listen<[number, number]>("pie-pos", (e) => setOffset(e.payload)),
      listen<[number, number]>("pie-center", (e) => {
        // physical px (window-relative) → CSS px.
        const dpr = window.devicePixelRatio || 1;
        setCenter([e.payload[0] / dpr, e.payload[1] / dpr]);
      }),
    ];
    return () => {
      for (const p of pending) p.then((off) => off()).catch(() => {});
    };
  }, []);

  const dpr = window.devicePixelRatio || 1;
  // Effective look/size/deadzone: per-pie appearance/threshold over the global.
  const eff = mergeLook(style, menu.appearance);
  const sizeCss = menu.appearance?.size ?? globalSize;
  const deadzone = deadzoneRadius(menu.threshold ?? globalThreshold, sizeCss);

  // Don't draw until we know where the pie starts (avoids the first-open
  // top-left flash). The overlay window itself stays transparent meanwhile.
  if (center === null) {
    return <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }} />;
  }

  // "active": since the window is full-screen, show the label of what will fire
  // (the currently-pointed direction) at the actual mouse position (window-relative
  // CSS px), across the whole monitor. In preview (no cursor), show the selected
  // direction's label at the window centre to reproduce this design's look.
  if (eff.design === "active") {
    const r = (id: string) => defNames[id];
    const activeSlice = current >= 0 ? menu.slices[current] : undefined;
    const isCancel = current === -3;
    let text = isCancel
      ? t("キャンセル")
      : activeSlice
        ? inputsLabel(activeSlice.inputs, r)
        : inputsLabel(menu.center, r);
    // Static preview with an empty/none selection: show a sample so this design
    // is still visible (e.g. previewing a pie whose selected direction is blank).
    if (menu.preview && !text) {
      text =
        menu.slices.map((s) => inputsLabel(s.inputs, r)).find(Boolean) ||
        inputsLabel(menu.center, r) ||
        t("アクティブ");
    }
    const color = isCancel ? "#ff8a8a" : eff.labelColor;
    // Live: at the cursor. Preview: centred in the preview window (no cursor).
    const cx = menu.preview ? center[0] : center[0] + (offset ? offset[0] / dpr : 0);
    const cy = menu.preview ? center[1] : center[1] + (offset ? offset[1] / dpr : 0);
    // The active design has no pie box, so the "size" setting scales the
    // label chip instead (280 = the baseline font size 15).
    const fontSize = Math.max(9, Math.round((sizeCss / 280) * 15));
    return (
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        {text && (
          <div
            style={{
              position: "absolute",
              left: cx,
              top: cy - fontSize * 1.9,
              transform: "translate(-50%, -50%)",
              // Both the chip fill and border follow the opacity settings, so
              // background opacity 0 + line opacity 0 = a plain floating label (text only).
              background: hexToRgba(eff.bg, Math.min(1, eff.opacity / 100)),
              border: `1px ${eff.lineStyle} ${hexToRgba(eff.line, eff.lineOpacity / 100)}`,
              borderRadius: fontSize * 0.6,
              padding: `${fontSize * 0.27}px ${fontSize * 0.8}px`,
              color,
              fontSize,
              fontWeight: 600,
              whiteSpace: "nowrap",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {text}
          </div>
        )}
      </div>
    );
  }

  // Other designs: draw the pie in a size-px box at the start point (cursor).
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: center[0],
          top: center[1],
          width: sizeCss,
          height: sizeCss,
          transform: "translate(-50%, -50%)",
        }}
      >
        <PieVisual
          slices={menu.slices}
          center={menu.center}
          current={current}
          style={eff}
          deadzone={deadzone}
          resolveDefName={(id) => defNames[id]}
          resolveDefIcon={(id) => defIcons[id]}
          resolveDefColor={(id) => defColors[id]}
        />
      </div>
    </div>
  );
}
