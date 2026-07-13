import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ALL_KEY_NAMES } from "../../lib/keyCatalog";
import { ModalShell } from "../ui/ModalShell";
import { TextInput } from "../ui/TextInput";
import { PointerPalette } from "./PointerPalette";
import { useKeyCapture } from "./useKeyCapture";
import {
  ARROWS,
  EXTRA,
  F_HI,
  KB,
  NAV,
  UNIT,
  W,
  searchDisp,
} from "./keyPickerLayout";

interface Props {
  value: string;
  onSelect: (key: string) => void;
  onClose: () => void;
  allowEmpty?: boolean;
  /** Also offer mouse buttons and scroll directions. These return sentinel
   * values ("mouse:left" / "scroll:up" …) that the caller maps to a command. */
  pointer?: boolean;
  /** When set, pressing a key captures the whole shortcut — held modifiers plus
   * the main key (Ctrl+Shift+A → ["Ctrl","Shift","A"]) — for the caller to add
   * as separate inputs. Absent = single-key capture (editing one command). */
  onCapture?: (keys: string[]) => void;
  /** Click-only: no auto key capture (quick capture lives in KeyCaptureModal).
   * The physical-key listener and the "waiting for input" toggle are off; you pick by
   * clicking the on-screen keys / mouse / scroll. */
  noCapture?: boolean;
}

/** Pick a key: press a physical key, click a key on the JIS keyboard, or search. */
export function KeyPicker({
  value,
  onSelect,
  onClose,
  allowEmpty,
  pointer,
  onCapture,
  noCapture,
}: Props) {
  const { t } = useTranslation();
  const [capturing, setCapturing] = useState(!noCapture);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  useKeyCapture({ capturing, setCapturing, onCapture, onSelect, onClose });

  // Match search against main label / kana / key name.
  const hit = (k: string) =>
    !q ||
    k.toLowerCase().includes(q) ||
    searchDisp(k).toLowerCase().includes(q);

  // `grow`: size by flex-grow so the row fills its container width (used for the
  // main keyboard, so it never overflows/scrolls and both edges line up). Off →
  // fixed pixel width (used by the side clusters).
  const key = (
    k: string,
    main: string,
    kana?: string,
    w = 1,
    rk?: string,
    grow = false,
  ) => {
    const known = ALL_KEY_NAMES.includes(k);
    return (
      <button
        key={rk ?? k}
        onClick={() => known && onSelect(k)}
        disabled={!known}
        data-tip={known ? k : undefined}
        style={grow ? { flexGrow: w, flexBasis: 0 } : { width: w * UNIT }}
        className={
          "h-[34px] px-0.5 rounded-row border transition-colors overflow-hidden flex flex-col items-center justify-center leading-none gap-px " +
          (grow ? "min-w-0 " : "shrink-0 ") +
          (!known
            ? "opacity-30 border-border text-text3 cursor-default"
            : k === value
              ? "bg-accent text-white border-accent"
              : "bg-bg2 border-border text-text hover:border-accent")
        }
      >
        <span className="text-caption font-mono truncate max-w-full">{main}</span>
        {kana && <span className="text-[7px] text-text3 leading-none">{kana}</span>}
      </button>
    );
  };

  // Search/list button (auto-sized to label width, wrappable).
  const flatKey = (k: string) => {
    const known = ALL_KEY_NAMES.includes(k);
    return (
      <button
        key={k}
        onClick={() => known && onSelect(k)}
        disabled={!known}
        data-tip={known ? k : undefined}
        className={
          "h-[34px] px-2 rounded-row border text-caption font-mono whitespace-nowrap transition-colors " +
          (!known
            ? "opacity-30 border-border text-text3 cursor-default"
            : k === value
              ? "bg-accent text-white border-accent"
              : "bg-bg2 border-border text-text hover:border-accent")
        }
      >
        {searchDisp(k)}
      </button>
    );
  };

  // Clusters (edit/arrows/numpad) are fixed-width to align columns; sized to fit the label.
  const CW = 1.5; // クラスタキーの幅(u)
  const cluster = (rows: (string | null)[][], label: string) => (
    <div>
      <div className="text-caption font-semibold text-text3 mb-0.5">{t(label)}</div>
      <div className="flex flex-col gap-1">
        {rows.map((r, i) => (
          <div key={i} className="flex gap-1">
            {r.map((k, j) =>
              k === null ? (
                <span key={j} style={{ width: CW * UNIT }} className="shrink-0" />
              ) : (
                key(k, searchDisp(k), undefined, CW, `${i}-${j}`)
              ),
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // One keyboard row: width-filling keys (grow), so both edges line up with the
  // rows above and below (no horizontal scroll).
  const kbRow = (cells: [string, string, string?][], rk: string) => (
    <div className="flex gap-1">
      {cells.map((c, j) => key(c[0], c[1], c[2], W[c[0]] ?? 1, `${rk}-${j}`, true))}
    </div>
  );

  // One numpad key, filling its CSS-grid cell so `+` can be tall and `0` wide —
  // the recognisable physical numpad shape, instead of a grid whose short lower
  // rows leave a ragged right edge.
  const npKey = (k: string, gridColumn: string, gridRow: string) => {
    const known = ALL_KEY_NAMES.includes(k);
    return (
      <button
        key={k}
        onClick={() => known && onSelect(k)}
        disabled={!known}
        data-tip={known ? k : undefined}
        style={{ gridColumn, gridRow }}
        className={
          "rounded-row border text-caption font-mono transition-colors flex items-center justify-center " +
          (!known
            ? "opacity-30 border-border text-text3 cursor-default"
            : k === value
              ? "bg-accent text-white border-accent"
              : "bg-bg2 border-border text-text hover:border-accent")
        }
      >
        {searchDisp(k)}
      </button>
    );
  };

  // Physical numpad grid (4 cols). Operators top/right, digits in a 3-wide
  // block, `+` spanning two rows and `0` two columns. The empty bottom-right
  // cell is the Enter slot (Numpad Enter maps to the plain Enter key, so it is
  // not a separate assignable key here).
  const numpad = (
    <div>
      <div className="text-caption font-semibold text-text3 mb-0.5">
        {t("テンキー")}
      </div>
      <div
        className="grid gap-1 w-max"
        style={{
          gridTemplateColumns: `repeat(4, ${CW * UNIT}px)`,
          gridAutoRows: "34px",
        }}
      >
        {npKey("NumLock", "1", "1")}
        {npKey("NumpadDivide", "2", "1")}
        {npKey("NumpadMultiply", "3", "1")}
        {npKey("NumpadSubtract", "4", "1")}
        {npKey("Numpad7", "1", "2")}
        {npKey("Numpad8", "2", "2")}
        {npKey("Numpad9", "3", "2")}
        {npKey("NumpadAdd", "4", "2 / span 2")}
        {npKey("Numpad4", "1", "3")}
        {npKey("Numpad5", "2", "3")}
        {npKey("Numpad6", "3", "3")}
        {npKey("Numpad1", "1", "4")}
        {npKey("Numpad2", "2", "4")}
        {npKey("Numpad3", "3", "4")}
        {npKey("Numpad0", "1 / span 2", "5")}
        {npKey("NumpadDecimal", "3", "5")}
      </div>
    </div>
  );

  return (
    <ModalShell
      title={pointer ? "入力を選択（日本語配列）" : "キーを選択（日本語配列）"}
      onClose={onClose}
      width="w-[min(96vw,940px)]"
      closeOnEscape={false}
      bodyClassName="overflow-auto p-3"
    >
      <div className="space-y-2">
        {/* 入力待ち / なし / 検索 */}
        <div className="flex items-center gap-2">
          {!noCapture && (
            <button
              onMouseDown={(e) => {
                if (!capturing) {
                  setCapturing(true);
                  return;
                }
                if (pointer) {
                  e.preventDefault();
                  const btn =
                    e.button === 2 ? "right" : e.button === 1 ? "middle" : "left";
                  onSelect("mouse:" + btn);
                } else {
                  setCapturing(false);
                }
              }}
              onContextMenu={pointer ? (e) => e.preventDefault() : undefined}
              onWheel={
                pointer
                  ? (e) => {
                      if (!capturing) return;
                      onSelect("scroll:" + (e.deltaY < 0 ? "up" : "down"));
                    }
                  : undefined
              }
              className={
                "text-label px-2 py-1 rounded-row border shrink-0 select-none inline-flex items-center gap-1.5 " +
                (capturing
                  ? "bg-accent text-white border-accent"
                  : "border-border text-text2 hover:bg-bg3 ")
              }
            >
              {/* Live "listening" dot: makes the capturing state obvious, so when
                  it silently turns off (search focus / clicking a key) the dot
                  vanishing signals that keys are no longer being captured. */}
              {capturing && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"
                  aria-hidden
                />
              )}
              {capturing
                ? onCapture
                  ? t("入力待ち…（ショートカットも押せます）")
                  : pointer
                    ? t("入力待ち…（キー / クリック / スクロール）")
                    : t("キー入力待ち…（押してください）")
                : t("キーを押して割り当て")}
            </button>
          )}
          {allowEmpty && (
            <button
              onClick={() => onSelect("")}
              className="text-label px-2 py-1 rounded-row border border-border text-text2 hover:bg-bg3 shrink-0"
            >
              {t("なし")}
            </button>
          )}
          <TextInput
            size="sm"
            value={query}
            onFocus={() => setCapturing(false)}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("キー名で検索")}
            fullWidth={false}
            className="ml-auto w-44 shrink-0"
          />
        </div>

        <div onMouseDown={() => setCapturing(false)}>
          {q ? (
            // While searching, list results full-width.
            <div className="flex flex-wrap gap-1">
              {ALL_KEY_NAMES.filter(hit).map((k) => flatKey(k))}
            </div>
          ) : (
            // 2 columns. Left = the physical keyboard (main grid + edit/arrows/
            // numpad). Right = mouse/scroll/vibration (pointer mode) plus the
            // "special" keys (F13–24, media, browser). Splitting the specials to
            // the right balances the two columns' heights so the tall left grid
            // no longer leaves the short right palette floating over dead space.
            <div className="flex gap-4 items-start">
              {/* 左カラム: 物理キーボード */}
              <div className="space-y-3 min-w-0">
                {/* JIS キーボード本体（編集/矢印は分離して下のカテゴリへ）。
                    各行を幅いっぱいに広げて左右の端を揃える（横スクロールなし）。 */}
                <div className="rounded-card border border-border bg-bg p-3 max-w-[620px]">
                  <div className="flex flex-col gap-1">
                    {kbRow(KB[0], "r0")}
                    {kbRow(KB[1], "r1")}
                    {/* Rows 2–3 share a tall Enter on the right (like a real JIS
                        keyboard): the two rows sit in a left sub-column, Enter
                        stretches to span both. flex-grow weights keep it ~1.9u. */}
                    <div className="flex gap-1 items-stretch">
                      <div
                        className="min-w-0 flex flex-col gap-1"
                        style={{ flexGrow: 13.5, flexBasis: 0 }}
                      >
                        {kbRow(KB[2].slice(0, -1), "r2")}
                        {kbRow(KB[3], "r3")}
                      </div>
                      <button
                        onClick={() => onSelect("Enter")}
                        data-tip="Enter"
                        style={{ flexGrow: 1.9, flexBasis: 0 }}
                        className={
                          "self-stretch min-w-0 rounded-row border transition-colors flex items-center justify-center text-caption font-mono " +
                          ("Enter" === value
                            ? "bg-accent text-white border-accent"
                            : "bg-bg2 border-border text-text hover:border-accent")
                        }
                      >
                        ⏎
                      </button>
                    </div>
                    {kbRow(KB[4], "r4")}
                    {kbRow(KB[5], "r5")}
                  </div>
                </div>

                {/* 編集・矢印・テンキーを横並びのカテゴリに */}
                <div className="flex flex-wrap gap-4 items-start">
                  {cluster(NAV, "編集")}
                  {cluster(ARROWS, "矢印")}
                  {numpad}
                </div>
              </div>

              {/* 右カラム: ポインタ（マウス/スクロール/振動）＋特殊キー。左の物理
                  キーボードと高さを揃え、右下のデッドスペースを埋める。 */}
              <div className="w-[240px] shrink-0 space-y-3 border-l border-border pl-4">
                {pointer && <PointerPalette value={value} onSelect={onSelect} />}

                <div>
                  <div className="text-caption font-semibold text-text3 mb-0.5">
                    F13–F24
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {F_HI.map((k) => key(k, k, undefined, 1.3))}
                  </div>
                </div>

                {EXTRA.map((sec) => (
                  <div key={sec.label}>
                    <div className="text-caption font-semibold text-text3 mb-0.5">
                      {t(sec.label)}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {sec.keys
                        .filter((k) => ALL_KEY_NAMES.includes(k))
                        .map((k) => flatKey(k))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
