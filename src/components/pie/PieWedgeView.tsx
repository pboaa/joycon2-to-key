// Default pie renderer: the ring / pie / minimal / fade / rays designs (wedges,
// spokes, dividers, centre hub, dead-zone and labels). Split out of PieVisual.

import { useId } from "react";
import { useTranslation } from "react-i18next";
import type { InputCommand } from "../../lib/types";
import { inputsLabel } from "../../lib/variants";
import { defRefColor, defRefIcon } from "../../lib/defRef";
import {
  PIE,
  CENTER_WIDTH,
  hexToRgba,
  midPoint,
  pointAt,
  sectorPath,
  sliceBoundaries,
  toScreen,
  wedgeLabelWidth,
  wedgePath,
} from "../../lib/pieGeometry";
import { heatColor } from "../../lib/usage";
import { PieLabel } from "../PieLabel";
import { PieRefIcon } from "./pieShared";
import { CANCEL, GAP, type PieViewProps } from "./pieStyle";

/** Stroked arc along `radius` between two screen angles. */
function arcPath(radius: number, a0: number, a1: number): string {
  const large = (((a1 - a0) % 360) + 360) % 360 > 180 ? 1 : 0;
  const [x0, y0] = pointAt(radius, a0);
  const [x1, y1] = pointAt(radius, a1);
  return `M ${x0} ${y0} A ${radius} ${radius} 0 ${large} 1 ${x1} ${y1}`;
}

export function PieWedgeView({
  slices,
  center,
  current,
  style,
  deadzone,
  heat,
  resolveDefName,
  resolveDefIcon,
  resolveDefColor,
  derived,
}: PieViewProps) {
  const {
    k,
    lineK,
    HAIR,
    HAIR_DIM,
    dash,
    isMinimal,
    isFade,
    isRays,
    isPie,
    isLines,
    showWedges,
    hub,
    spokeInner,
    bgFill,
    centreFill,
    hot,
    assignedFill,
    emptyFill,
  } = derived;
  const { t } = useTranslation();
  const uid = useId();
  const wGrad = `${uid}-w`; // white spokes, fading outward (fade design)

  const bounds = sliceBoundaries(slices.map((s) => s.angle));
  // Inset each wedge by half the gap on both sides (segmented look).
  const seg = (b: { a0: number; a1: number }) => ({ a0: b.a0 + GAP / 2, a1: b.a1 - GAP / 2 });

  // Usage heatmap: max across slices + centre, and a per-slice / centre colour.
  const heatMax = heat
    ? Math.max(1, ...heat.slices, heat.center)
    : 1;
  const sliceHeat = (i: number) =>
    heat ? heatColor(heat.slices[i] ?? 0, heatMax) : undefined;

  const labelOf = (inputs: InputCommand[]) =>
    inputs.length > 0 ? inputsLabel(inputs, resolveDefName) : "";
  const centreHot = current === -1;
  const isCancel = current === -3; // moved beyond the outer ring → will cancel
  const centreLabel = labelOf(center);

  // Radial spoke on a slice boundary (screen angle `a`), inner→outer.
  const spoke = (a: number, stroke: string, w: number, key: string) => {
    const [ix, iy] = pointAt(spokeInner, a);
    const [ox, oy] = pointAt(PIE.ro, a);
    return <line key={key} x1={ix} y1={iy} x2={ox} y2={oy} stroke={stroke} strokeWidth={w} strokeDasharray={dash} />;
  };
  const spokeStroke = isFade ? `url(#${wGrad})` : isRays ? HAIR : HAIR_DIM;

  // Line designs (rays/fade) mark the current direction by colouring its
  // label with the accent — the spokes themselves stay a uniform colour.
  // Non-current labels use the configurable text colour; the current direction
  // stays highlighted (accent on line designs, white otherwise).
  // Line designs have no wedge fill, so a coloured operation tints its label
  // (and icon) instead. Wedge designs keep the plain label colour for contrast
  // against the coloured wedge.
  const labelFill = (isHot: boolean, sliceColor?: string) =>
    isHot
      ? (isLines ? style.accent : "#fff")
      : isLines && sliceColor
        ? sliceColor
        : style.labelColor;

  // "label current direction only": when on, only the pointed direction shows text; the
  // rest fall back to dots. Off = every assigned direction is labelled.
  const currentOnly = style.labelsCurrentOnly ?? false;
  const showLabel = (i: number) => style.labels && (!currentOnly || current === i);
  const showCenterLabel = style.labels && (!currentOnly || centreHot);

  return (
    <svg
      viewBox={PIE.viewBox}
      width="100%"
      height="100%"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {isFade && (
        <defs>
          <radialGradient id={wGrad} gradientUnits="userSpaceOnUse" cx={PIE.cx} cy={PIE.cy} r={PIE.ro}>
            <stop offset="0%" stopColor={style.line} stopOpacity={lineK} />
            <stop offset="100%" stopColor={style.line} stopOpacity={0} />
          </radialGradient>
        </defs>
      )}

      {/* Background disc (all circular designs). The framing ring for wedge
          designs is drawn later — on top of the fills — so the outer edge is a
          single clean line, not the wedge stroke + ring doubled. Minimal has no
          fills, so it draws its ring here. */}
      {!isLines && <circle cx={PIE.cx} cy={PIE.cy} r={PIE.ro} fill={bgFill} />}
      {isMinimal && (
        <circle cx={PIE.cx} cy={PIE.cy} r={PIE.ro - 0.75} fill="none" stroke={HAIR} strokeWidth={1.5} strokeDasharray={dash} />
      )}

      {/* Radial spokes on every boundary (minimal / rays / fade). */}
      {(isMinimal || isLines) &&
        bounds.map((b, i) => spoke(b.a0, spokeStroke, isMinimal ? 1.25 : 1.75, `s${i}`))}
      {/* Minimal highlights the current segment with a thick accent arc. */}
      {isMinimal && current >= 0 && bounds[current] && (
        <path
          d={arcPath(PIE.ro - 0.75, seg(bounds[current]).a0, seg(bounds[current]).a1)}
          fill="none"
          stroke={hot(1)}
          strokeWidth={4}
        />
      )}

      {slices.map((s, i) => {
        // No gaps: wedges touch and are separated by thin dividers (drawn below)
        // instead — clearer than the old gap look, which read as radial spokes.
        // Ring is a donut (annular); pie fills to the centre.
        const b = bounds[i];
        const isHot = current === i;
        const label = labelOf(s.inputs);
        const on = label.length > 0;
        const icon = defRefIcon(s.inputs, resolveDefIcon);
        // A slice linked to a coloured operation tints its wedge with that colour
        // (scaled by the background opacity so it stays consistent with the look).
        const sliceColor = defRefColor(s.inputs, resolveDefColor);
        const [lx, ly] = midPoint(toScreen(s.angle));
        return (
          <g key={i}>
            {showWedges && (
              <path
                d={isPie ? sectorPath(b.a0, b.a1) : wedgePath(b.a0, b.a1)}
                fill={
                  sliceHeat(i) ??
                  (isHot
                    ? hot(0.7)
                    : sliceColor
                      ? hexToRgba(sliceColor, 0.45 * k + 0.1)
                      : on
                        ? assignedFill
                        : emptyFill)
                }
              />
            )}
            {showLabel(i) && on ? (
              icon ? (
                // Icon above, operation name below (both centred on the slice).
                <>
                  <PieRefIcon
                    x={lx}
                    y={ly - 9}
                    size={15}
                    icon={icon}
                    color={labelFill(isHot)}
                    iconColor={isHot ? undefined : defRefColor(s.inputs, resolveDefColor)}
                  />
                  <PieLabel
                    x={lx}
                    y={ly + 9}
                    text={label}
                    maxWidth={wedgeLabelWidth(bounds[i].a0, bounds[i].a1) * (isLines ? 1.15 : 1)}
                    base={11}
                    min={8}
                    fill={labelFill(isHot, sliceColor)}
                  />
                </>
              ) : (
                <PieLabel
                  x={lx}
                  y={ly}
                  text={label}
                  // Line designs have no wedge, so give labels a bit more room.
                  maxWidth={wedgeLabelWidth(bounds[i].a0, bounds[i].a1) * (isLines ? 1.15 : 1)}
                  fill={labelFill(isHot, sliceColor)}
                />
              )
            ) : (isHot || style.dots) ? (
              // Non-labelled directions show a small dot; the current one always
              // shows (as the pointer), the rest only when dots are enabled.
              <circle
                cx={lx}
                cy={ly}
                r={isHot ? 5 : 3.5}
                fill={isHot ? "#fff" : on ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)"}
              />
            ) : null}
          </g>
        );
      })}

      {/* Thin dividers on every boundary so segments are legible without gaps. */}
      {showWedges && style.dividers &&
        bounds.map((b, i) => {
          const [ix, iy] = pointAt(hub, b.a0);
          const [ox, oy] = pointAt(PIE.ro, b.a0);
          return <line key={`d${i}`} x1={ix} y1={iy} x2={ox} y2={oy} stroke={HAIR} strokeWidth={1} strokeDasharray={dash} />;
        })}

      {/* Framing ring drawn over the wedge fills → one clean outer line. */}
      {showWedges && (
        <circle cx={PIE.cx} cy={PIE.cy} r={PIE.ro - 0.75} fill="none" stroke={HAIR} strokeWidth={1.5} strokeDasharray={dash} />
      )}

      {/* 中央＝「その場」。リングは PIE.ri のドーナツ穴、パイは小ハブ。 */}
      {centreHot && !isLines && (
        <circle cx={PIE.cx} cy={PIE.cy} r={hub + 2} fill="none" stroke={hot(0.35)} strokeWidth={4} />
      )}
      {!isLines && (
        <circle
          cx={PIE.cx}
          cy={PIE.cy}
          r={hub}
          fill={
            heat
              ? heatColor(heat.center, heatMax)
              : centreHot
                ? hot(0.7)
                : isMinimal
                  ? "none"
                  : centreFill
          }
          stroke={centreHot ? hot(1) : HAIR}
          strokeWidth={centreHot ? 1.75 : 1.5}
        />
      )}
      {/* Dead-zone (パイの閾値)：ここを超えると方向が確定。専用の色で、表示は任意。 */}
      {!isLines && style.thresholdShow && deadzone != null && (
        <circle
          cx={PIE.cx}
          cy={PIE.cy}
          r={deadzone}
          fill="none"
          stroke={style.thresholdColor}
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      )}
      {showCenterLabel && (isCancel || centreLabel) ? (
        !isCancel && defRefIcon(center, resolveDefIcon) ? (
          // Icon above, operation name below (in-place centre).
          <>
            <PieRefIcon
              x={PIE.cx}
              y={PIE.cy - 7}
              size={13}
              icon={defRefIcon(center, resolveDefIcon)!}
              color={centreHot ? (isLines ? style.accent : "#fff") : "#fff"}
              iconColor={centreHot ? undefined : defRefColor(center, resolveDefColor)}
            />
            <PieLabel
              x={PIE.cx}
              y={PIE.cy + 8}
              text={centreLabel}
              maxWidth={CENTER_WIDTH}
              base={8}
              min={7}
              fill={centreHot ? (isLines ? style.accent : "#fff") : "#fff"}
            />
          </>
        ) : (
          <PieLabel
            x={PIE.cx}
            y={PIE.cy}
            text={isCancel ? `✕ ${t("キャンセル")}` : centreLabel}
            maxWidth={CENTER_WIDTH}
            base={9}
            min={7}
            fill={isCancel ? CANCEL : centreHot ? (isLines ? style.accent : "#fff") : "#fff"}
          />
        )
      ) : (centreHot || style.dots) ? (
        // Empty centre: a small dot (never a persistent "centre" label). Hidden when
        // dots are off, except while pointing at the centre.
        <circle
          cx={PIE.cx}
          cy={PIE.cy}
          r={4}
          fill={centreHot || centreLabel ? "#fff" : "rgba(255,255,255,0.55)"}
        />
      ) : null}
    </svg>
  );
}
