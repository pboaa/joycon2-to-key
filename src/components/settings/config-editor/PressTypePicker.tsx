import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { IconStack, IconLink } from "@tabler/icons-react";
import type { PressType } from "../../../lib/types";

/** Coarse category shown as a tab. Maps 1:1 to a press type. */
export type PressCategory = "input" | "layer" | "pie";

/** Category → its press type. */
const CATEGORY_TYPE: Record<PressCategory, PressType> = {
  input: "input",
  layer: "layerHold",
  pie: "pie",
};

const CATEGORY_ORDER: PressCategory[] = ["input", "layer", "pie"];

const CATEGORY_LABEL: Record<PressCategory, string> = {
  input: "キー入力",
  layer: "レイヤー",
  pie: "パイ",
};

/** Hover explanation for each category, so the choices are self-describing. */
const CATEGORY_TIP: Record<PressCategory, string> = {
  input: "キー・マウス・スクロールを割り当て（タップ / 長押し / 固定 / 連打）",
  layer: "押している間だけ別のレイヤーに切り替え（一時的に別の割り当てを使う）",
  pie: "押しながらマウスを動かした方向で発火（上下左右に別々の割り当て）",
};

/** The category a concrete press type belongs to. */
export function pressCategory(t: PressType): PressCategory {
  for (const c of CATEGORY_ORDER) {
    if (CATEGORY_TYPE[c] === t) return c;
  }
  return "input"; // input / none / layerHold handled above
}

const DEFAULT_SELECTABLE: PressCategory[] = ["input", "layer", "pie"];

/** Press-type selector. key input / pie are the two *outputs* (what the button
 * sends), shown as a segmented pill. layer is a different dimension — a
 * hold-to-switch behaviour — so it sits apart as its own highlighted button.
 * `rightSlot` holds caller actions (Delete …) on its own right-aligned row above.
 * The current type is always shown so an existing mapping stays editable. */
export function PressTypePicker({
  type,
  onSelectType,
  selectable = DEFAULT_SELECTABLE,
  onPickDefinition,
  rightSlot,
}: {
  type: PressType | null;
  onSelectType: (t: PressType) => void;
  selectable?: PressCategory[];
  /** When set, an "operation" button sits in the pill (next to key input / pie): click
   * it to assign a saved operation to this button instead of choosing a type. */
  onPickDefinition?: () => void;
  rightSlot?: ReactNode;
}) {
  const { t: tr } = useTranslation();
  const current = type ? pressCategory(type) : null;
  const outputs = (["input", "pie"] as PressCategory[]).filter(
    (c) => c === current || selectable.includes(c),
  );
  const showLayer = current === "layer" || selectable.includes("layer");
  const layerOn = current === "layer";

  return (
    <div className="space-y-1">
      {rightSlot && (
        <div className="flex items-center justify-end gap-1">{rightSlot}</div>
      )}
      <div className="flex items-stretch gap-1.5">
        {/* Outputs: what the button sends. */}
        <div className="flex-1 flex gap-1 p-0.5 rounded-row bg-bg3">
          {outputs.map((c) => {
            const on = c === current;
            return (
              <button
                key={c}
                onClick={() => c !== current && onSelectType(CATEGORY_TYPE[c])}
                data-tip={tr(CATEGORY_TIP[c])}
                className={
                  "flex-1 text-body font-medium py-1.5 rounded-row transition-colors whitespace-nowrap px-1 " +
                  (on ? "bg-accent text-white" : "text-text2 hover:bg-bg2 ")
                }
              >
                {tr(CATEGORY_LABEL[c])}
              </button>
            );
          })}
          {/* 操作: assign a saved operation — sits next to the output types. */}
          {onPickDefinition && (
            <button
              onClick={onPickDefinition}
              data-tip={tr("保存済みの操作を割り当て")}
              className="flex-1 inline-flex items-center justify-center gap-1 text-body font-medium py-1.5 rounded-row transition-colors whitespace-nowrap px-1 text-accent hover:bg-bg2"
            >
              <IconLink size={13} aria-hidden />
              {tr("操作")}
            </button>
          )}
        </div>
        {/* Layer: a different dimension (hold-to-switch) — set apart & highlighted. */}
        {showLayer && (
          <button
            onClick={() => !layerOn && onSelectType("layerHold")}
            data-tip={tr(CATEGORY_TIP.layer)}
            className={
              "shrink-0 inline-flex items-center gap-1.5 px-3 rounded-row border text-body font-medium transition-colors " +
              (layerOn
                ? "bg-accent text-white border-accent"
                : "border-accent/60 text-accent bg-accent/10 hover:bg-accent/20")
            }
          >
            <IconStack size={14} aria-hidden />
            {tr(CATEGORY_LABEL.layer)}
          </button>
        )}
      </div>
    </div>
  );
}
