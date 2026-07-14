// "chips" (Blender-style) design: draws no pie chart; places a bordered label
// (icon + text) radially per direction. Split out of PieVisual.

import type { InputCommand } from "../../lib/types";
import { inputsLabel } from "../../lib/variants";
import { defRefColor, defRefIcon } from "../../lib/defRef";
import { PIE, hexToRgba, pointAt, toScreen } from "../../lib/pieGeometry";
import { OpIcon } from "../ui/OpIcon";
import { PieLabel } from "../PieLabel";
import { PieRefIcon } from "./pieShared";
import { CANCEL, type PieViewProps } from "./pieStyle";

export function PieChipsView({
  slices,
  center,
  current,
  style,
  resolveDefName,
  resolveDefIcon,
  resolveDefColor,
  derived,
}: PieViewProps) {
  const { k, HAIR, hot, centreFill, accentK, dash } = derived;
  const labelOf = (inputs: InputCommand[]) =>
    inputs.length > 0 ? inputsLabel(inputs, resolveDefName) : "";
  const centreHot = current === -1;
  const isCancel = current === -3; // moved beyond the outer ring → will cancel
  const centreLabel = labelOf(center);

  // "chip" (Blender-style): draws no pie chart; places a bordered label (icon +
  // text) radially per direction. The centre is a compact hub (not a full-size
  // chip) so a long in-place label doesn't overlap the surrounding direction
  // chips — matching how the other pie designs keep the centre small.
  const chipR = 82;
  const hasCenter = centreLabel.length > 0;
  const centreIcon = defRefIcon(center, resolveDefIcon);
  const centreColor = defRefColor(center, resolveDefColor);
  // Compact centre box (~half a direction chip's width), auto-shrinking label.
  // Narrow enough that the left/right direction chips (radius 82) clear it.
  const CTR_W = 50;
  const CTR_H = 28;
  const ctrBg = centreHot
    ? hexToRgba(style.accent, Math.min(1, 0.85 * accentK))
    : hexToRgba(style.bg, Math.min(1, k + 0.35));
  const ctrBorder = centreHot
    ? hexToRgba(style.accent, Math.min(1, accentK))
    : centreColor ?? HAIR;
  const ctrCol = centreHot ? "#fff" : style.labelColor;
  const chip = (
    key: number | string,
    cx: number,
    cy: number,
    label: string,
    icon: string | undefined,
    on: boolean,
    isHot: boolean,
    iconColor?: string,
  ) => {
    // Fixed size for every direction chip so the layout stays a tidy, uniform
    // grid regardless of label length (content-sizing made short/long labels
    // different widths, which read as messy). Overflow ellipsizes. 106 fits the
    // left/right chips inside the 280 viewBox at radius 82 while leaving a gap to
    // the (smaller) centre hub so they never overlap.
    const W = 106;
    const H = 30;
    const bg = isHot
      ? hexToRgba(style.accent, Math.min(1, 0.85 * accentK))
      : hexToRgba(style.bg, Math.min(1, k + 0.35));
    // A coloured operation tints the chip's frame (keeps the label readable on the
    // dark chip, unlike filling the whole background). Current slice keeps accent.
    const border = isHot
      ? hexToRgba(style.accent, Math.min(1, accentK))
      : iconColor ?? HAIR;
    const col = isHot ? "#fff" : on ? style.labelColor : "rgba(255,255,255,0.4)";
    return (
      <foreignObject
        key={key}
        x={cx - W / 2}
        y={cy - H / 2}
        width={W}
        height={H}
        style={{ overflow: "visible", pointerEvents: "none" }}
      >
        <div
          style={{
            boxSizing: "border-box",
            width: W,
            height: H,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            padding: "4px 9px",
            borderRadius: 7,
            background: bg,
            border: `1px ${style.lineStyle} ${border}`,
            color: col,
            fontSize: 12.5,
            fontWeight: 600,
            whiteSpace: "nowrap",
            overflow: "hidden",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {icon && (
            <span style={{ display: "inline-flex", flexShrink: 0 }}>
              {/* Current slice keeps the highlight `col` for legibility on the
                  accent fill; others take the operation's saved tint if any. */}
              <OpIcon name={icon} size={13} color={isHot ? undefined : iconColor} />
            </span>
          )}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{label || "—"}</span>
        </div>
      </foreignObject>
    );
  };
  return (
    <svg viewBox={PIE.viewBox} width="100%" height="100%">
      {hasCenter ? (
        <>
          <rect
            x={PIE.cx - CTR_W / 2}
            y={PIE.cy - CTR_H / 2}
            width={CTR_W}
            height={CTR_H}
            rx={7}
            fill={ctrBg}
            stroke={ctrBorder}
            strokeWidth={1}
            strokeDasharray={dash}
          />
          {centreIcon ? (
            <>
              <PieRefIcon
                x={PIE.cx}
                y={PIE.cy - 6}
                size={12}
                color={ctrCol}
                iconColor={centreHot ? undefined : centreColor}
                icon={centreIcon}
              />
              <PieLabel
                x={PIE.cx}
                y={PIE.cy + 7}
                text={centreLabel}
                maxWidth={CTR_W - 12}
                base={8}
                min={7}
                fill={ctrCol}
              />
            </>
          ) : (
            <PieLabel
              x={PIE.cx}
              y={PIE.cy}
              text={centreLabel}
              maxWidth={CTR_W - 12}
              base={9}
              min={7}
              fill={ctrCol}
            />
          )}
        </>
      ) : (
        <circle
          cx={PIE.cx}
          cy={PIE.cy}
          r={17}
          fill={centreHot ? hot(0.5) : centreFill}
          stroke={isCancel ? CANCEL : centreHot ? hot(1) : HAIR}
          strokeWidth={centreHot || isCancel ? 2 : 1.5}
          strokeDasharray={dash}
        />
      )}
      {slices.map((s, i) => {
        const label = labelOf(s.inputs);
        const icon = defRefIcon(s.inputs, resolveDefIcon);
        const [cx, cy] = pointAt(chipR, toScreen(s.angle));
        return chip(
          i,
          cx,
          cy,
          label,
          icon,
          label.length > 0,
          current === i,
          defRefColor(s.inputs, resolveDefColor),
        );
      })}
    </svg>
  );
}
