import { IconLink } from "@tabler/icons-react";
import { OpIcon } from "../ui/OpIcon";

/** A saved-operation reference drawn inside an SVG pie at (x, y), via a
 * foreignObject (SVG can't host Tabler icons directly). Two callers share it:
 *  - the live overlay (PieVisual): just the operation's icon, coloured/sized to
 *    match the label it sits with (`link` off);
 *  - the editor figure (PieFigure): a leading link marker so it always reads as a
 *    reference (`link` on), plus the operation's icon when it has one.
 * Non-interactive; horizontally centred on (x, y). */
export function PieRefIcon({
  x,
  y,
  icon,
  size = 16,
  color = "currentColor",
  iconColor,
  link = false,
}: {
  x: number;
  y: number;
  /** Operation icon name (Tabler); omit to show just the link marker. */
  icon?: string;
  size?: number;
  /** CSS colour applied to marker + icon (via currentColor). */
  color?: string;
  /** Overrides just the icon's tint (the operation's saved colour); the link
   * marker keeps `color`. Omit to let the icon inherit `color`. */
  iconColor?: string;
  /** Show the leading link marker (editor figure). */
  link?: boolean;
}) {
  const markW = link ? 10 : 0;
  const gap = link && icon ? 2 : 0;
  const w = markW + gap + (icon ? size : 0) || size;
  const h = Math.max(size, markW);
  return (
    <foreignObject
      x={x - w / 2}
      y={y - h / 2}
      width={w}
      height={h}
      style={{ overflow: "visible", pointerEvents: "none" }}
    >
      <div
        style={{
          width: w,
          height: h,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap,
          color,
        }}
      >
        {link && <IconLink size={10} style={{ flexShrink: 0, opacity: 0.7 }} aria-hidden />}
        {icon && <OpIcon name={icon} size={size} color={iconColor} />}
      </div>
    </foreignObject>
  );
}
