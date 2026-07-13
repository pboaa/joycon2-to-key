import { createContext, useContext, useMemo, useRef, useState } from "react";
import i18n from "../../lib/i18n";
import type { ButtonAssignment, JoyConButtons } from "../../lib/types";
import { shortLabel } from "../../lib/variants";
import { buttonLabel } from "../../lib/keyCatalog";
import { deepenMapColor, lighten, readableOn } from "../../lib/joyconColors";
import { TOOLTIP_CLASS } from "../TooltipHost";

/* Shared building blocks for the Joy-Con (L) and (R) pads.
   Colours:
   - cyan (#00c3e3): the device's own accent (rail, stick ring) + live-press glow.
   - amber (MAP): "assigned" state — deliberately different from the cyan so
     mapped buttons stand out from the device accent.
   - white: current selection. */

// Default Joy-Con accent — the per-side colours are now user-set (settings) and
// provided via AccentContext; this is only the context fallback.
export const ACCENT = "#66ccf2";
export const MAP = "#d68c45"; // assigned/mapped highlight (muted amber)
export const MAP_SOFT = "#e2b98f"; // mapping labels
export const ARROW = "#c9ced6";
export const ARROW_ON = "#3a2410"; // arrow/glyph on an amber (mapped) button

// Selection ring: a light ring over a slightly wider dark underlay (halo). The
// device body is always dark, so a plain white ring is visible on it — but where
// the ring overhangs onto the page background (shoulders, edges) that bg is light
// in light themes and white vanishes. The dark halo keeps the ring readable on
// any background (same light-fill-over-dark-stroke trick as the button labels).
export const SEL = "#ffffff";
export const SEL_HALO = "#0b0f19";

/** Max deflection (px) of the stick knob's centre from the stick centre. The
 * knob (r≈6) travels within the inner stick face (r=31), so this fills most of
 * it. Both the live knob position AND the deadzone ring use this, so the ring
 * marks exactly where the knob crosses the movement threshold. */
export const STICK_TRAVEL = 24;

/** Device accent colour for the current pad. The (R) pad overrides this with a
 * red via the provider; sub-renderers read it for their live-press glow. */
export const AccentContext = createContext(ACCENT);
export const useAccent = () => useContext(AccentContext);

/** The "assigned/mapped" highlight colours, themeable (SVG fill attributes can't
 * read CSS vars, so the active theme's colours are provided here in JS). Falls
 * back to the amber defaults when no provider is present. */
export interface MapColors {
  map: string;
  mapSoft: string;
}
export const MapContext = createContext<MapColors>({
  map: MAP,
  mapSoft: MAP_SOFT,
});
export const useMap = () => useContext(MapContext);

export interface PadProps {
  buttons: Record<string, ButtonAssignment>;
  pressed: JoyConButtons | null;
  stick: { x: number; y: number };
  selected: string | null;
  onSelect: (key: string) => void;
  onDeselect: () => void;
  /** Buttons whose mapping is inherited from the base layer (shown dimmed). */
  inheritedKeys?: Set<string>;
  /** Stick→mouse is on: the stick moves the cursor, so its digital directions
   * are inactive. The pad shows a mouse badge instead of the direction arrows. */
  stickMouse?: boolean;
  /** Stick centre deadzone (percent, 0–50) — drawn as a dashed ring on the stick. */
  stickDeadzone?: number;
  /** Device accent (side) color for this pad — themeable per side. */
  accent: string;
  /** Heatmap overlay: button key → { fill colour, activation count }. When set,
   * buttons are tinted by usage and the count is shown in the tooltip. */
  heat?: Record<string, { color: string; count: number }>;
  /** id → a saved operation's colour. A button linked to a coloured operation is
   * filled with that colour (instead of the global map highlight). */
  resolveDefColor?: (id: string) => string | undefined;
  /** Right-click a button (identified by its `data-btn` key). Delegated on the
   * pad's <svg>, so individual buttons only need the data attribute. */
  onContext?: (key: string, e: React.MouseEvent) => void;
}

/** Dashed ring on the stick showing the centre deadzone. `r` is the knob's
 * travel radius (STICK_TRAVEL), so the ring sits exactly where the knob crosses
 * the movement threshold. Non-interactive. `pct` is 0–50. */
export function DeadzoneRing({ cx, cy, r, pct }: { cx: number; cy: number; r: number; pct?: number }) {
  if (!pct || pct <= 0) return null;
  const rr = (r * Math.min(pct, 90)) / 100;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={rr}
      fill="none"
      stroke="#ffffff"
      strokeOpacity="0.5"
      strokeWidth="1.2"
      strokeDasharray="3 3"
      style={{ pointerEvents: "none" }}
    />
  );
}

export interface St {
  mapped: boolean;
  pressed: boolean;
  selected: boolean;
  label: string;
  /** Heatmap fill colour for this button (overrides the normal fill when set). */
  heat?: string;
  /** Per-operation fill colour (the linked op's colour), used instead of the
   * global map highlight. Undefined = use the normal mapped/unmapped fill. */
  color?: string;
  /** Readable glyph/label colour on top of `color` (near-black or white). */
  onColor?: string;
  /** Activation count, shown small under the label. Set only in heatmap mode. */
  count?: number;
  /** Mapping is inherited from the base layer (dim the label). */
  inherited: boolean;
  /** Hover tooltip: button name + assigned key. */
  tip: string;
}

/** Resolve the display state for the given button keys. Runs label/variant
 * resolution only when mapping data changes — not per button per live frame. */
export function usePadStates(
  keys: readonly string[],
  { buttons, pressed, selected, inheritedKeys, heat, resolveDefColor }: PadProps,
): Record<string, St> {
  return useMemo(() => {
    const m: Record<string, St> = {};
    for (const key of keys) {
      // Unset ("none") drafts don't count as a mapping on the pad.
      const a = buttons[key];
      const active = a && a.press.type !== "none" ? a : null;
      const label = active ? shortLabel(active.press) : "";
      const name = buttonLabel(key);
      const h = heat?.[key];
      // A button linked to a coloured operation fills with that colour (deepened
      // like the map highlight so it reads calm), with a contrasting glyph.
      const raw = active?.def ? resolveDefColor?.(active.def) : undefined;
      const color = raw ? deepenMapColor(raw) : undefined;
      m[key] = {
        mapped: active != null,
        pressed: !!pressed?.[key as keyof JoyConButtons],
        selected: selected === key,
        heat: h?.color,
        color,
        onColor: color ? readableOn(color) : undefined,
        count: heat ? (h?.count ?? 0) : undefined,
        inherited: !!inheritedKeys?.has(key),
        label,
        // Line 1 = button name, line 2 = assignment (+ activation count in heat mode).
        tip:
          `${name}\n${label || i18n.t("未設定")}` +
          (heat ? `\n${i18n.t("回数")}: ${h?.count ?? 0}` : ""),
      };
    }
    return m;
  }, [keys, buttons, pressed, selected, inheritedKeys, heat, resolveDefColor]);
}

/** Outer frame shared by both pads: the relative wrapper, the SVG element with
 * the glow filter, and the floating hover tooltip. */
export function PadShell({
  ariaLabel,
  viewBox,
  onDeselect,
  onContext,
  children,
}: {
  ariaLabel: string;
  viewBox: string;
  onDeselect: () => void;
  /** Delegated right-click: resolves the clicked button from its `data-btn`. */
  onContext?: (key: string, e: React.MouseEvent) => void;
  children: React.ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{
    text: string;
    x: number;
    y: number;
    flipX: boolean;
    flipY: boolean;
  } | null>(null);
  const onMove = (e: React.MouseEvent) => {
    const g = (e.target as Element).closest?.("[data-pad-tip]");
    const rect = wrapRef.current?.getBoundingClientRect();
    const text = g?.getAttribute("data-pad-tip");
    if (g && rect && text) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Near the right/bottom edge, grow the tooltip toward the opposite side
      // so it stays inside the pad.
      setTip({ text, x, y, flipX: x > rect.width / 2, flipY: y > rect.height / 2 });
    } else if (tip) {
      setTip(null);
    }
  };

  return (
    <div
      ref={wrapRef}
      className="relative h-full w-full flex items-center justify-center"
      onMouseMove={onMove}
      onMouseLeave={() => setTip(null)}
    >
      <svg
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        className="select-none block h-full w-full"
        role="group"
        aria-label={ariaLabel}
        onClick={onDeselect}
        onContextMenu={(e) => {
          // Always suppress the browser menu on the pad; open ours on a button.
          e.preventDefault();
          const el = (e.target as Element).closest?.("[data-btn]");
          const key = el?.getAttribute("data-btn");
          if (key) onContext?.(key, e);
        }}
      >
        <defs>
          <filter id="jcGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="4.5" />
          </filter>
        </defs>
        {children}
      </svg>
      {tip &&
        (() => {
          const [tipName, ...rest] = tip.text.split("\n");
          const detail = rest.join(" ");
          return (
            <div
              className={
                "pointer-events-none absolute z-50 max-w-[190px] " + TOOLTIP_CLASS
              }
              style={{
                left: tip.flipX ? tip.x - 12 : tip.x + 12,
                top: tip.flipY ? tip.y - 12 : tip.y + 12,
                transform: `translate(${tip.flipX ? "-100%" : "0"}, ${tip.flipY ? "-100%" : "0"
                  })`,
              }}
            >
              <div className="font-medium truncate">{tipName}</div>
              {detail && <div className="truncate text-text3">{detail}</div>}
            </div>
          );
        })()}
    </div>
  );
}

// ── Sub-renderers ───────────────────────────────────────────────────────────

export function Shoulder({ d, w, base, st, onClick, label, name, textAt, nameSize }: { d: string; w: number; base: string; st: St; onClick: (e: React.MouseEvent) => void; label: string; name: string; textAt: [number, number]; nameSize: number }) {
  const accent = useAccent();
  const { map } = useMap();
  return (
    <g onClick={onClick} data-btn={label} style={{ cursor: "pointer" }} role="button" aria-label={label} data-pad-tip={st.tip}>
      {st.pressed && <path d={d} fill="none" stroke={accent} strokeWidth={w} strokeLinecap="round" filter="url(#jcGlow)" opacity="0.9" />}
      {st.selected && (
        <>
          <path d={d} fill="none" stroke={SEL_HALO} strokeWidth={w + 9} strokeLinecap="round" />
          <path d={d} fill="none" stroke={SEL} strokeWidth={w + 6} strokeLinecap="round" />
        </>
      )}
      <path d={d} fill="none" stroke={st.heat ?? st.color ?? (st.mapped ? map : base)} strokeWidth={w} strokeLinecap="round" />
      <text x={textAt[0]} y={textAt[1]} textAnchor="middle" dominantBaseline="central" fontSize={nameSize} fontWeight={700} fill={st.color ? st.onColor : st.mapped ? ARROW_ON : "#cbd0d8"} style={{ pointerEvents: "none" }}>{name}</text>
    </g>
  );
}

export function Dpad({ cx, cy, arrow, st, onClick, btnKey }: { cx: number; cy: number; arrow: string; st: St; onClick: (e: React.MouseEvent) => void; btnKey: string }) {
  const accent = useAccent();
  const { map } = useMap();
  return (
    <g onClick={onClick} data-btn={btnKey} style={{ cursor: "pointer" }} role="button" aria-label={st.tip} data-pad-tip={st.tip}>
      {st.pressed && <circle cx={cx} cy={cy} r="21" fill={accent} filter="url(#jcGlow)" opacity="0.9" />}
      <circle cx={cx} cy={cy} r="20" fill={st.heat ?? st.color ?? (st.mapped ? map : "#2a2d33")} />
      <path d={arrow} fill={st.color ? st.onColor : st.mapped ? ARROW_ON : ARROW} />
      {st.selected && (
        <>
          <circle cx={cx} cy={cy} r="20" fill="none" stroke={SEL_HALO} strokeWidth="5.5" />
          <circle cx={cx} cy={cy} r="20" fill="none" stroke={SEL} strokeWidth="3" />
        </>
      )}
    </g>
  );
}

export function Tri({ d, hit, st, onClick, btnKey }: { d: string; hit: [number, number, number]; st: St; onClick: (e: React.MouseEvent) => void; btnKey: string }) {
  const accent = useAccent();
  const { map } = useMap();
  return (
    <g onClick={onClick} data-btn={btnKey} style={{ cursor: "pointer" }} role="button" aria-label={st.tip} data-pad-tip={st.tip}>
      <circle cx={hit[0]} cy={hit[1]} r={hit[2]} fill="transparent" />
      {st.pressed && <path d={d} fill={accent} filter="url(#jcGlow)" opacity="0.9" />}
      <path d={d} fill={st.heat ?? st.color ?? (st.mapped ? map : "#9aa0a8")} />
      {st.selected && (
        <>
          <circle cx={hit[0]} cy={hit[1]} r={hit[2]} fill="none" stroke={SEL_HALO} strokeWidth="5" />
          <circle cx={hit[0]} cy={hit[1]} r={hit[2]} fill="none" stroke={SEL} strokeWidth="2.5" />
        </>
      )}
    </g>
  );
}

/** Rounded-square button with a small square glyph inside (capture / chat).
 * The 40×40 body sits at (x,y); the glyph and selection ring are derived from
 * it. `iconRx` tunes the inner square's corner radius per button. */
export function SquareBtn({ x, y, iconRx = 5, st, onClick, label }: { x: number; y: number; iconRx?: number; st: St; onClick: (e: React.MouseEvent) => void; label: string }) {
  const accent = useAccent();
  const { map } = useMap();
  return (
    <g onClick={onClick} data-btn={label} style={{ cursor: "pointer" }} role="button" aria-label={label} data-pad-tip={st.tip}>
      {st.pressed && <rect x={x} y={y} width="40" height="40" rx="12" fill={accent} filter="url(#jcGlow)" opacity="0.9" />}
      <rect x={x} y={y} width="40" height="40" rx="12" fill={st.heat ?? st.color ?? (st.mapped ? map : "#2a2d33")} />
      <rect x={x + 12} y={y + 12} width="16" height="16" rx={iconRx} fill="none" stroke={st.color ? st.onColor : st.mapped ? ARROW_ON : ARROW} strokeWidth="2" />
      {st.selected && (
        <>
          <rect x={x - 3} y={y - 3} width="46" height="46" rx="14" fill="none" stroke={SEL_HALO} strokeWidth="5.5" />
          <rect x={x - 3} y={y - 3} width="46" height="46" rx="14" fill="none" stroke={SEL} strokeWidth="3" />
        </>
      )}
    </g>
  );
}

export function RailBtn({ x, y, text, st, onClick, btnKey }: { x: number; y: number; text: string; st: St; onClick: (e: React.MouseEvent) => void; btnKey: string }) {
  const accent = useAccent();
  const { map } = useMap();
  return (
    <g onClick={onClick} data-btn={btnKey} style={{ cursor: "pointer" }} role="button" aria-label={text} data-pad-tip={st.tip}>
      {st.pressed && <rect x={x} y={y} width="18" height="90" rx="9" fill={accent} filter="url(#jcGlow)" opacity="0.9" />}
      <rect x={x} y={y} width="18" height="90" rx="9" fill={st.heat ?? st.color ?? (st.mapped ? map : "#2b2f36")} />
      <text x={x + 9} y={y + 49} textAnchor="middle" fontSize="10" fontWeight="700" fill={st.color ? st.onColor : st.mapped ? ARROW_ON : "#9aa0a8"}>{text}</text>
      {st.selected && (
        <>
          <rect x={x - 3} y={y - 3} width="24" height="96" rx="12" fill="none" stroke={SEL_HALO} strokeWidth="5" />
          <rect x={x - 3} y={y - 3} width="24" height="96" rx="12" fill="none" stroke={SEL} strokeWidth="2.5" />
        </>
      )}
    </g>
  );
}

/** Small "mouse" badge drawn where the stick's up-arrow would be, marking that
 * the stick now drives the cursor (its digital directions are inactive). */
export function StickMouseBadge({ cx, cy }: { cx: number; cy: number }) {
  const { map, mapSoft } = useMap();
  return (
    <g style={{ pointerEvents: "none" }} aria-hidden="true">
      <rect x={cx - 26} y={cy - 11} width="52" height="22" rx="11" fill={map} opacity="0.18" />
      {/* simple mouse glyph */}
      <rect x={cx - 20} y={cy - 8} width="10" height="16" rx="5" fill="none" stroke={map} strokeWidth="1.6" />
      <line x1={cx - 15} y1={cy - 8} x2={cx - 15} y2={cy - 2} stroke={map} strokeWidth="1.6" />
      <text x={cx - 4} y={cy} textAnchor="start" dominantBaseline="central" fontSize="10.5" fontWeight="700" fill={mapSoft}>
        {i18n.t("マウス")}
      </text>
    </g>
  );
}

export function Label({
  st,
  x,
  y,
  anchor = "middle",
  fill,
}: {
  st: St;
  x: number;
  y: number;
  anchor?: "start" | "middle" | "end";
  fill?: string;
}) {
  const { mapSoft } = useMap();
  const heatMode = st.count != null;
  if (!st.label && !heatMode) return null;
  const text = st.label
    ? st.label.length > 11
      ? st.label.slice(0, 10) + "…"
      : st.label
    : "";
  return (
    <>
      {text && (
        <text x={x} y={y} textAnchor={anchor} dominantBaseline="central" fontSize="10.5" fontWeight="600" fontStyle={st.inherited ? "italic" : "normal"} fill={st.selected ? "#fff" : st.inherited ? "#94a3b8" : st.color ? lighten(st.color, 0.5) : fill ?? mapSoft} stroke="#0b0f19" strokeWidth="2.6" strokeLinejoin="round" style={{ pointerEvents: "none", paintOrder: "stroke" }}>
          {text}
        </text>
      )}
      {heatMode && (
        <CountBadge x={x} y={y + (text ? 12 : 0)} anchor={anchor} count={st.count!} />
      )}
    </>
  );
}

/** Small usage count under a button's label (Stats mode). */
function CountBadge({
  x,
  y,
  anchor,
  count,
}: {
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
  count: number;
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} dominantBaseline="central" fontSize="8" fontWeight="700" fill="#ffffff" fillOpacity={count > 0 ? 0.95 : 0.5} stroke="#0b0f19" strokeWidth="2" strokeLinejoin="round" className="tabular-nums" style={{ pointerEvents: "none", paintOrder: "stroke" }}>
      {count}
    </text>
  );
}
