import { useEffect, useRef, useState } from "react";
import type {
  Definition,
  DefinitionGroup,
  PiePress,
  PieSlice,
  InputCommand,
} from "../../../lib/types";
import { useTranslation } from "react-i18next";
import { IconMinus, IconPlus, IconRotate, IconRotateClockwise } from "@tabler/icons-react";
import { HelpText } from "../../HelpText";
import { useConfirm } from "../../Confirm";
import { Button } from "../../ui/Button";
import { InputCommandEditor } from "../InputCommandEditor";
import { PieFigure } from "../../pie/PieFigure";
import { PiePreviewToggle } from "../PiePreviewToggle";
import { PieStylePanel } from "./PieStylePanel";
import { makeDefResolver } from "../../../lib/defResolver";
import { fillFirst } from "../../../lib/config/press";
import {
  closePieOverlayPreview,
  previewPieOverlay,
} from "../../../lib/tauri";

const MAX_SLICES = 8;
const ROTATE_STEP = 15; // degrees per rotate click
const norm = (deg: number) => ((deg % 360) + 360) % 360;

/** The 8 compass directions (data angle: 0 = up, clockwise) with an arrow and
 * name, for labelling the selected slice by direction rather than raw degrees. */
const DIRS = [
  { a: 0, arrow: "↑", name: "上" },
  { a: 45, arrow: "↗", name: "右上" },
  { a: 90, arrow: "→", name: "右" },
  { a: 135, arrow: "↘", name: "右下" },
  { a: 180, arrow: "↓", name: "下" },
  { a: 225, arrow: "↙", name: "左下" },
  { a: 270, arrow: "←", name: "左" },
  { a: 315, arrow: "↖", name: "左上" },
];
/** Nearest compass direction to an (arbitrary, possibly rotated) angle. */
function nearestDir(angle: number) {
  const n = norm(angle);
  let best = DIRS[0];
  let bd = 999;
  for (const d of DIRS) {
    const diff = Math.min(Math.abs(n - d.a), 360 - Math.abs(n - d.a));
    if (diff < bd) {
      bd = diff;
      best = d;
    }
  }
  return best;
}

export function PieBody({
  press,
  onChange,
  definitions,
  groups,
  onJumpToDefinition,
}: {
  press: PiePress;
  onChange: (p: PiePress) => void;
  definitions?: Definition[];
  groups?: DefinitionGroup[];
  onJumpToDefinition?: (id: string) => void;
}) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const defRes = makeDefResolver(definitions);
  const slices = press.slices;
  const count = slices.length;
  // Slices are kept evenly spaced, so the whole-pie rotation is just the first
  // slice's angle.
  const rotation = norm(slices[0]?.angle ?? 0);
  // -1 = centre (in-place), ≥0 = slice index.
  const [selected, setSelected] = useState<number>(count ? 0 : -1);
  const [tab, setTab] = useState<"dir" | "style">("dir");

  // Actual-size preview on the real overlay — opt-in (the "preview" button),
  // so it never pops up unexpectedly. While on, it re-pushes on every edit with
  // the direction being edited highlighted. Hidden when turned off / unmounted.
  const [showPreview, setShowPreview] = useState(false);
  useEffect(() => {
    if (!showPreview) {
      closePieOverlayPreview().catch(() => {});
      return;
    }
    previewPieOverlay(
      {
        slices: press.slices.map((s) => ({ angle: s.angle, inputs: s.inputs })),
        center: press.center ?? [],
        appearance: press.appearance,
        threshold: press.threshold,
        preview: true,
      },
      selected,
    ).catch(() => {});
  }, [press, selected, showPreview]);
  useEffect(() => () => void closePieOverlayPreview().catch(() => {}), []);

  // Remember each slot's inputs by index, so shrinking then growing the count
  // restores what was there (guards against accidentally dropping actions).
  // In-memory only (kept until the app restarts), never written to disk.
  const stash = useRef<InputCommand[][]>([]);
  useEffect(() => {
    slices.forEach((s, k) => {
      stash.current[k] = s.inputs;
    });
  }, [slices]);

  const setSlices = (next: PieSlice[]) => onChange({ ...press, slices: next });
  const setCenter = (next: InputCommand[]) =>
    onChange({ ...press, center: next.length > 0 ? next : undefined });
  const setSliceInputs = (i: number, inputs: InputCommand[]) =>
    setSlices(slices.map((s, k) => (k === i ? { ...s, inputs } : s)));

  /** Rebuild `n` evenly-spaced slices from `rot`.
   *  - Growing / rotating: keep each direction's inputs by index; slots beyond
   *    the current count are restored from the stash.
   *  - Shrinking: keep the directions that have keys and drop empty ones first
   *    (filled inputs are packed into the remaining slots). The full order is
   *    stashed so growing the count back restores what was dropped. */
  const rebuild = (n: number, rot: number) => {
    let kept: InputCommand[][];
    if (n < slices.length) {
      const ordered = fillFirst(slices.map((s) => s.inputs));
      stash.current = ordered.slice();
      kept = ordered.slice(0, n);
    } else {
      kept = Array.from(
        { length: n },
        (_, k) => slices[k]?.inputs ?? stash.current[k] ?? [],
      );
    }
    const next: PieSlice[] = kept.map((inputs, k) => ({
      angle: norm(rot + (k * 360) / n),
      inputs,
    }));
    setSlices(next);
    if (selected >= n) setSelected(n > 0 ? 0 : -1);
  };

  const setCount = async (n: number) => {
    const clamped = Math.max(0, Math.min(MAX_SLICES, n));
    // Skip 1 direction (2–8, or 0 = none) so "−" from 2 clears rather than leaving one.
    const target = clamped === 1 ? (count > 1 ? 0 : 2) : clamped;
    // Clearing every direction is easy to hit by accident — confirm first.
    if (target === 0 && count > 0) {
      const ok = await confirm({
        title: t("方向をすべて削除"),
        message: t("設定した方向をすべて削除しますか？（増やせば再起動までは元に戻せます）"),
        okLabel: t("削除"),
      });
      if (!ok) return;
    }
    rebuild(target, rotation);
    if (target > 0 && selected === -1) setSelected(0);
  };
  const rotate = (delta: number) => {
    if (count > 0) rebuild(count, norm(rotation + delta));
  };

  const editingCenter = selected === -1;
  const cur = editingCenter ? undefined : slices[selected];
  const curDir = cur ? nearestDir(cur.angle) : undefined;
  const headerLabel = editingCenter
    ? t("中央（その場）")
    : curDir
      ? `${curDir.arrow} ${t(curDir.name)}`
      : "";

  return (
    <div className="space-y-1.5">
      {/* Split "what it does" (方向) from "how it looks" (スタイル) — the editor
          column is narrow, so tabs keep each view uncluttered. */}
      <div className="flex items-stretch border-b border-border">
        {(["dir", "style"] as const).map((id) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={
              "flex-1 px-2.5 py-1 text-label rounded-t-md border-b-2 -mb-px transition-colors " +
              (tab === id
                ? "border-accent text-accent font-medium"
                : "border-transparent text-text2 hover:text-text")
            }
          >
            {t(id === "dir" ? "方向" : "スタイル")}
          </button>
        ))}
      </div>

      {tab === "style" ? (
        <>
          {/* Preview lives in the スタイル tab (full-width), like 設定→パイメニュー. */}
          <PiePreviewToggle
            on={showPreview}
            onToggle={() => setShowPreview((v) => !v)}
          />
          {showPreview && (
            <p className="text-caption text-text3">
              {t("実寸プレビューを画面に表示中（選択中の方向をハイライト）。")}
            </p>
          )}
          <PieStylePanel
            press={press}
            onChange={onChange}
            preview={{ on: showPreview, onToggle: () => setShowPreview((v) => !v) }}
          />
        </>
      ) : (
        <>
          <div className="text-caption font-semibold text-text2">
            <HelpText text={"ボタンを押している間にマウスを動かした方向で、一番近いスライスの操作が発火します。\n方向数（2〜8）と全体の角度をボタンで設定。中央＝しきい値未満（その場）。"}>
              方向（パイメニュー）
            </HelpText>
          </div>

      {/* Direction count + whole-pie rotation (buttons, no drag). */}
      <div className="flex items-center justify-center gap-3 text-label">
        <div className="flex items-center gap-1">
          <span className="text-text2">{t("方向数")}</span>
          <Button size="xs" onClick={() => setCount(count - 1)} disabled={count <= 0} aria-label={t("減らす")}>
            <IconMinus size={13} aria-hidden />
          </Button>
          <span className="w-4 text-center tabular-nums">{count}</span>
          <Button size="xs" onClick={() => setCount(count + 1)} disabled={count >= MAX_SLICES} aria-label={t("増やす")}>
            <IconPlus size={13} aria-hidden />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-text2">{t("角度")}</span>
          <Button size="xs" onClick={() => rotate(-ROTATE_STEP)} disabled={count === 0} data-tip={t("左に回す")} aria-label={t("左に回す")}>
            <IconRotate size={13} aria-hidden />
          </Button>
          <span className="w-9 text-center tabular-nums">
            {count > 0 ? `${rotation}°` : "—"}
          </span>
          <Button size="xs" onClick={() => rotate(ROTATE_STEP)} disabled={count === 0} data-tip={t("右に回す")} aria-label={t("右に回す")}>
            <IconRotateClockwise size={13} aria-hidden />
          </Button>
        </div>
      </div>

      <PieFigure
        slices={slices}
        centerInputs={press.center}
        selected={selected}
        onSelect={setSelected}
        resolveDefName={defRes.name}
        resolveDefIcon={defRes.icon}
        resolveDefColor={defRes.color}
      />

      {/* Editor for the selected slice / centre. */}
      <div className="border-t border-border pt-2 space-y-1">
        <span className="text-caption font-medium text-text2">{headerLabel}</span>
        {editingCenter || cur ? (
          <InputCommandEditor
            inputs={(editingCenter ? press.center : cur?.inputs) ?? []}
            onChange={(next) =>
              editingCenter ? setCenter(next) : setSliceInputs(selected, next)
            }
            definitions={definitions}
            groups={groups}
            onJumpToDefinition={onJumpToDefinition}
            assignable
          />
        ) : (
          <p className="text-caption text-text3">
            {t("「方向数」の＋で方向を追加してください。")}
          </p>
        )}
      </div>
        </>
      )}
    </div>
  );
}
