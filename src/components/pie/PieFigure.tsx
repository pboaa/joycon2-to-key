import { useState, type CSSProperties } from "react";
import type { PieSlice, InputCommand } from "../../lib/types";
import { inputsLabel } from "../../lib/variants";
import {
  PIE,
  CENTER_WIDTH,
  midPoint,
  sliceBoundaries,
  toScreen,
  wedgeLabelWidth,
  wedgePath,
} from "../../lib/pieGeometry";
import { PieLabel } from "../PieLabel";
import { defRefId } from "../../lib/defRef";
import { PieRefIcon } from "./pieShared";

/** Small usage count drawn under a wedge/centre label (Stats mode). */
function HeatCountText({
  x,
  y,
  fill,
  count,
}: {
  x: number;
  y: number;
  fill: string;
  count: number;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={8.5}
      fontWeight={600}
      fill={fill}
      fillOpacity={0.85}
      className="tabular-nums"
      style={{ pointerEvents: "none" }}
    >
      {count}
    </text>
  );
}

/** Label colour over a wedge: white on a solid heat fill (dark text is
 * unreadable there), else the themed currentColor. */
const labelFillFor = (heat?: string) => (heat ? "#ffffff" : "currentColor");

/** Radial preview/selector for pie slices. Slices are evenly spaced (the
 * whole pie is rotated with the buttons in PieBody); clicking a wedge or the
 * centre selects it for editing. Each wedge shows its assigned action label
 * (definition references resolved to their name via `resolveDefName`); assigned
 * slices read brighter and the selected one is accent-outlined. In Stats mode
 * `heatFill`/`heatCount` paint wedges by usage and draw the count under each. */
export function PieFigure({
  slices,
  centerInputs,
  selected,
  onSelect,
  resolveDefName,
  resolveDefIcon,
  resolveDefColor,
  heatFill,
  heatCount,
}: {
  slices: PieSlice[];
  centerInputs?: InputCommand[];
  /** -1 = centre, ≥0 = slice index. */
  selected: number;
  onSelect: (i: number) => void;
  resolveDefName?: (id: string) => string | undefined;
  /** id → the referenced operation's icon name (to draw it in the wedge). */
  resolveDefIcon?: (id: string) => string | undefined;
  /** id → the referenced operation's icon tint (hex); the link marker stays
   * accent, only the icon takes this colour. */
  resolveDefColor?: (id: string) => string | undefined;
  /** Usage-heatmap fill per wedge (i, -1 = centre). When set, wedges are painted
   * with the returned colour (the Stats heatmap) instead of the assign accent. */
  heatFill?: (i: number) => string | undefined;
  /** Usage count per wedge (i, -1 = centre); when set, drawn under each label. */
  heatCount?: (i: number) => number;
}) {
  // -1 = centre, ≥0 = slice; hover previews which wedge a click would select.
  const [hover, setHover] = useState<number | null>(null);
  const labelOf = (inputs: InputCommand[]) =>
    inputs.length > 0 ? inputsLabel(inputs, resolveDefName) : "";
  const bounds = sliceBoundaries(slices.map((s) => s.angle));
  const hasCenter = (centerInputs?.length ?? 0) > 0;

  const wedgeStyle = (
    sel: boolean,
    on: boolean,
    hov: boolean,
    fill?: string,
  ): CSSProperties => {
    // Heatmap paint: solid usage colour, accent outline only for select/hover.
    if (fill)
      return {
        fill,
        fillOpacity: 0.92,
        stroke: sel || hov ? "var(--color-accent)" : "#ffffff",
        strokeOpacity: sel || hov ? 1 : 0.25,
        strokeWidth: sel ? 2 : hov ? 1.5 : 1,
        cursor: "pointer",
      };
    return sel
      ? {
          fill: "var(--color-accent)",
          fillOpacity: 0.22,
          stroke: "var(--color-accent)",
          strokeWidth: 2,
          cursor: "pointer",
        }
      : hov
        ? {
            fill: "var(--color-accent)",
            fillOpacity: on ? 0.18 : 0.12,
            stroke: "var(--color-accent)",
            strokeOpacity: 0.6,
            strokeWidth: 1.5,
            cursor: "pointer",
          }
        : on
          ? {
              fill: "var(--color-accent)",
              fillOpacity: 0.12,
              stroke: "currentColor",
              strokeOpacity: 0.25,
              strokeWidth: 1,
              cursor: "pointer",
            }
          : {
              fill: "currentColor",
              fillOpacity: 0.06,
              stroke: "currentColor",
              strokeOpacity: 0.2,
              strokeWidth: 1,
              cursor: "pointer",
            };
  };

  return (
    <div className="text-text2">
      <svg viewBox={PIE.viewBox} width={208} height={208} className="block mx-auto">
        {slices.map((s, i) => {
          const b = bounds[i];
          const sel = selected === i;
          const label = labelOf(s.inputs);
          const on = label.length > 0;
          const link = defRefId(s.inputs);
          const icon = link ? resolveDefIcon?.(link) : undefined;
          const [mx, my] = midPoint(toScreen(s.angle));
          const hc = heatFill?.(i);
          // Colour a slice by its linked operation's colour (heatmap wins in Stats
          // mode). Painted the same way as the heat fill.
          const opColor = link ? resolveDefColor?.(link) : undefined;
          const wedgeFill = hc ?? opColor;
          const labelFill = labelFillFor(wedgeFill);
          return (
            <g
              key={i}
              onClick={() => onSelect(i)}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover((h) => (h === i ? null : h))}
            >
              <path d={wedgePath(b.a0, b.a1)} style={wedgeStyle(sel, on, hover === i, wedgeFill)} />
              {link ? (
                <>
                  <PieRefIcon
                    x={mx}
                    y={my - 6}
                    icon={icon}
                    link
                    color="var(--accent)"
                    iconColor={link ? resolveDefColor?.(link) : undefined}
                  />
                  <PieLabel
                    x={mx}
                    y={my + 10}
                    text={label}
                    maxWidth={wedgeLabelWidth(b.a0, b.a1)}
                    base={9}
                    min={7}
                    fill={labelFill}
                    fillOpacity={hc ? 0.95 : sel ? 0.95 : 0.8}
                  />
                </>
              ) : on ? (
                <PieLabel
                  x={mx}
                  y={my}
                  text={label}
                  maxWidth={wedgeLabelWidth(b.a0, b.a1)}
                  fill={labelFill}
                  fillOpacity={hc ? 0.95 : sel ? 0.95 : 0.8}
                />
              ) : (
                <text
                  x={mx}
                  y={my}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={13}
                  fill="currentColor"
                  fillOpacity={0.3}
                  style={{ pointerEvents: "none" }}
                >
                  ＋
                </text>
              )}
              {heatCount && (
                <HeatCountText
                  x={mx}
                  y={my + (icon ? 22 : 12)}
                  fill={labelFill}
                  count={heatCount(i)}
                />
              )}
            </g>
          );
        })}
        {/* 中央＝「その場」 */}
        {(() => {
          const centerLink = defRefId(centerInputs);
          const hc = heatFill?.(-1);
          const centerColor = centerLink ? resolveDefColor?.(centerLink) : undefined;
          const centerFill = hc ?? centerColor;
          return (
            <circle
              cx={PIE.cx}
              cy={PIE.cy}
              r={PIE.ri}
              onClick={() => onSelect(-1)}
              onMouseEnter={() => setHover(-1)}
              onMouseLeave={() => setHover((h) => (h === -1 ? null : h))}
              style={wedgeStyle(selected === -1, hasCenter, hover === -1, centerFill)}
            />
          );
        })()}
        {(() => {
          const centerLink = defRefId(centerInputs);
          const hc = heatFill?.(-1);
          const centerFill = hc ?? (centerLink ? resolveDefColor?.(centerLink) : undefined);
          if (centerLink)
            return (
              <>
                <PieRefIcon
                  x={PIE.cx}
                  y={PIE.cy - 6}
                  icon={resolveDefIcon?.(centerLink)}
                  link
                  color="var(--accent)"
                  iconColor={resolveDefColor?.(centerLink)}
                />
                <PieLabel
                  x={PIE.cx}
                  y={PIE.cy + 9}
                  text={labelOf(centerInputs ?? [])}
                  maxWidth={CENTER_WIDTH}
                  base={9}
                  min={7}
                  fill={labelFillFor(centerFill)}
                  fillOpacity={centerFill ? 0.95 : 0.9}
                />
              </>
            );
          // Empty centre shows the same dim ＋ as empty slices (rather than a
          // persistent "centre" label); an assigned centre shows its action.
          if (!hasCenter)
            return (
              <text
                x={PIE.cx}
                y={PIE.cy}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={13}
                fill="currentColor"
                fillOpacity={0.3}
                style={{ pointerEvents: "none" }}
              >
                ＋
              </text>
            );
          return (
            <PieLabel
              x={PIE.cx}
              y={PIE.cy}
              text={labelOf(centerInputs ?? [])}
              maxWidth={CENTER_WIDTH}
              base={9}
              min={7}
              fill={labelFillFor(hc)}
              fillOpacity={hc ? 0.95 : 0.9}
            />
          );
        })()}
        {heatCount && (
          <HeatCountText
            x={PIE.cx}
            y={PIE.cy + 13}
            fill={labelFillFor(heatFill?.(-1))}
            count={heatCount(-1)}
          />
        )}
      </svg>
    </div>
  );
}
