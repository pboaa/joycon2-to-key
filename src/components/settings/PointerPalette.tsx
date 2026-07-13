import { useTranslation } from "react-i18next";
import {
  MOUSE_SECTIONS,
  SCROLL_AMOUNTS,
  SCROLL_DIRS,
} from "./keyPickerLayout";

/** The pointer (mouse / scroll) palette shown in {@link KeyPicker}'s right
 * column when `pointer` is on. Each control returns a sentinel value
 * ("mouse:left" / "scroll:up:120") the caller maps to a command. */
export function PointerPalette({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (v: string) => void;
}) {
  const { t } = useTranslation();
  return (
    // Plain content block: the width / left divider now belong to the picker's
    // right column (which also holds F13–24 and the media/browser keys).
    <div className="space-y-3">
      {MOUSE_SECTIONS.map((sec) => (
        <div key={sec.label}>
          <div className="text-caption font-semibold text-text3 mb-0.5">
            {sec.label}
          </div>
          <div className="flex flex-wrap gap-1">
            {sec.items.map((it) => (
              <button
                key={it.v}
                onClick={() => onSelect(it.v)}
                className={
                  "h-8 px-2 text-caption rounded-row border transition-colors " +
                  (it.v === value
                    ? "bg-accent text-white border-accent"
                    : "bg-bg2 border-border text-text hover:border-accent")
                }
              >
                {t(it.label)}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* スクロール: 方向×量プリセット */}
      <div>
        <div className="text-caption font-semibold text-text3 mb-0.5">
          {t("スクロール（量）")}
        </div>
        <div className="space-y-1">
          {SCROLL_DIRS.map(([dir, arrow]) => (
            <div key={dir} className="flex gap-1">
              {SCROLL_AMOUNTS.map((amt) => {
                const v = `scroll:${dir}:${amt}`;
                return (
                  <button
                    key={amt}
                    onClick={() => onSelect(v)}
                    className={
                      "h-8 px-2 text-caption font-mono rounded-row border transition-colors " +
                      (v === value
                        ? "bg-accent text-white border-accent"
                        : "bg-bg2 border-border text-text hover:border-accent")
                    }
                  >
                    {arrow}
                    {amt}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
