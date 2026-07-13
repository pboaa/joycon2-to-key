// "chips" (Blender-style) design: draws no pie chart; places a bordered label
// (icon + text) radially per direction. Split out of PieVisual.

import type { InputCommand } from "../../lib/types";
import { inputsLabel } from "../../lib/variants";
import { defRefColor, defRefIcon } from "../../lib/defRef";
import { PIE, hexToRgba, pointAt, toScreen } from "../../lib/pieGeometry";
import { OpIcon } from "../ui/OpIcon";
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
  // text) radially per direction. The centre is the in-place chip, or a ring if none.
  const chipR = 82;
  const hasCenter = centreLabel.length > 0;
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
    const W = 118;
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
        <div style={{ width: W, height: H, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              maxWidth: W,
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
        </div>
      </foreignObject>
    );
  };
  return (
    <svg viewBox={PIE.viewBox} width="100%" height="100%">
      {hasCenter ? (
        chip(
          -1,
          PIE.cx,
          PIE.cy,
          centreLabel,
          defRefIcon(center, resolveDefIcon),
          true,
          centreHot,
          defRefColor(center, resolveDefColor),
        )
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
