// "active" design: show only the label of what will fire (the currently-pointed
// direction) at that direction's position. Split out of PieVisual.

import { useTranslation } from "react-i18next";
import type { InputCommand } from "../../lib/types";
import { inputsLabel } from "../../lib/variants";
import { PIE, hexToRgba, pointAt, toScreen } from "../../lib/pieGeometry";
import { PieLabel } from "../PieLabel";
import { CANCEL, type PieViewProps } from "./pieStyle";

export function PieActiveView({
  slices,
  center,
  current,
  style,
  cursor,
  resolveDefName,
  derived,
}: PieViewProps) {
  const { t } = useTranslation();
  const { HAIR, dash } = derived;
  const labelOf = (inputs: InputCommand[]) =>
    inputs.length > 0 ? inputsLabel(inputs, resolveDefName) : "";
  const isCancel = current === -3; // moved beyond the outer ring → will cancel
  const centreLabel = labelOf(center);

  // "active": show only the label of what will fire (= the currently-pointed
  // direction) at that direction's label position. Start/centre shows the in-place
  // label centred. Shows nothing if unassigned.
  const activeSlice = current >= 0 ? slices[current] : undefined;
  const text = isCancel
    ? `✕ ${t("キャンセル")}`
    : activeSlice
      ? labelOf(activeSlice.inputs)
      : centreLabel;
  // Place the chip a little above the mouse position (if any). Directly under the
  // cursor it would overlap and be hidden, so offset 30 up and clamp within the viewBox.
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const [lx, ly] = cursor
    ? [clamp(cursor[0], 62, 218), clamp(cursor[1] - 30, 20, 260)]
    : activeSlice
      ? pointAt(72, toScreen(activeSlice.angle))
      : [PIE.cx, PIE.cy];
  // Honour opacity 0 (fully transparent chip = label only).
  const chipFill = hexToRgba(style.bg, Math.min(1, style.opacity / 100));
  return (
    <svg viewBox={PIE.viewBox} width="100%" height="100%">
      {text && (
        <>
          <rect
            x={lx - 60}
            y={ly - 18}
            width={120}
            height={36}
            rx={9}
            fill={chipFill}
            stroke={HAIR}
            strokeWidth={1}
            strokeDasharray={dash}
          />
          <PieLabel
            x={lx}
            y={ly}
            text={text}
            maxWidth={110}
            base={14}
            min={9}
            fill={isCancel ? CANCEL : style.labelColor}
          />
        </>
      )}
    </svg>
  );
}
