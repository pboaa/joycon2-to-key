import { fitLabel } from "../lib/pieGeometry";

/** A centred SVG label that fits itself into `maxWidth`: the font shrinks, then
 * the text wraps to two lines, then it truncates with an ellipsis. Shared by the
 * pie overlay and the settings pie so both label wedges identically. */
export function PieLabel({
  x,
  y,
  text,
  maxWidth,
  base,
  min,
  fill,
  fillOpacity,
}: {
  x: number;
  y: number;
  text: string;
  maxWidth: number;
  base?: number;
  min?: number;
  fill: string;
  fillOpacity?: number;
}) {
  const { lines, fontSize } = fitLabel(text, maxWidth, base, min);
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={fontSize}
      fill={fill}
      fillOpacity={fillOpacity}
      style={{ pointerEvents: "none" }}
    >
      {lines.length === 1
        ? lines[0]
        : lines.map((ln, i) => (
            <tspan key={i} x={x} dy={i === 0 ? -(fontSize * 0.55) : fontSize * 1.1}>
              {ln}
            </tspan>
          ))}
    </text>
  );
}
