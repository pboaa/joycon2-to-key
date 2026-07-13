import { useEffect, useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconX } from "@tabler/icons-react";
import { useStore, type AppPage } from "../../store";
import { Button } from "../ui/Button";

/** One page-level tour step. `target` is a `data-tour` value to spotlight (all
 * targets live in the always-present left nav, so they're measurable regardless
 * of the current page). `page` navigates there first; omit both for a centred
 * intro/outro card. */
interface Step {
  page?: AppPage;
  target?: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    title: "使い方ツアー",
    body: "主な画面をさっと案内します（スキップ可）。",
  },
  {
    target: "connect",
    title: "① 接続",
    body: "起動後は自動で接続を待ちます。Joy-Con 2 のシンクボタンでつながります（未接続でも割り当ては作れます）。",
  },
  // The core loop: select a button on the figure, then assign it in the editor.
  {
    page: "keys",
    target: "figure",
    title: "② ボタンを選ぶ",
    body: "中央の図でボタンをクリックして選びます。",
  },
  {
    page: "keys",
    target: "editor",
    title: "③ 割り当てる",
    body: "右のパネルでキー入力・操作・パイなどを割り当てます。",
  },
  {
    page: "defs",
    target: "nav-defs",
    title: "④ 保存した操作",
    body: "よく使う操作を登録して使い回せます。",
  },
  {
    page: "stats",
    target: "nav-stats",
    title: "⑤ 統計",
    body: "ボタンの使用回数を確認できます。",
  },
  {
    page: "settings",
    target: "nav-settings",
    title: "⑥ 設定・バックアップ",
    body: "全体の設定とバックアップはここから。",
  },
  {
    page: "help",
    target: "nav-help",
    title: "ヘルプ",
    body: "困ったらここへ。ツアーもここから再開できます。",
  },
];

const GAP = 12;
const CARD_W = 300;

/** A lightweight, dependency-free product tour: spotlights a nav element and
 * shows a card explaining the current area, with Next / Back / Skip. */
export function Tour({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const navigate = useStore((s) => s.navigate);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  // Navigate to the step's page (nav targets stay put, so no re-measure race).
  useEffect(() => {
    if (step.page) navigate(step.page);
  }, [i, step.page, navigate]);

  // Measure the spotlight target after layout; keep it fresh on resize.
  useLayoutEffect(() => {
    const measure = () => {
      if (!step.target) {
        setRect(null);
        return;
      }
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    const id = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", measure);
    };
  }, [i, step.target]);

  // Escape / arrow keys.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" || e.key === "Enter") setI((n) => Math.min(n + 1, STEPS.length - 1));
      else if (e.key === "ArrowLeft") setI((n) => Math.max(n - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const next = () => (last ? onClose() : setI((n) => n + 1));
  const back = () => setI((n) => Math.max(n - 1, 0));

  // Card position: to the right of the spotlight (nav is on the left), clamped;
  // centred when there's no target.
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let cardStyle: React.CSSProperties;
  if (rect) {
    let left = rect.right + GAP;
    if (left + CARD_W > vw) left = Math.max(GAP, rect.left - CARD_W - GAP);
    const top = Math.min(Math.max(GAP, rect.top), vh - 200);
    cardStyle = { position: "fixed", left, top, width: CARD_W };
  } else {
    cardStyle = {
      position: "fixed",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      width: CARD_W,
    };
  }

  return (
    <div className="fixed inset-0 z-[var(--z-overlay)]">
      {/* Click-blocker: pauses interaction with the app. Doesn't dismiss on its
          own (avoids accidental closes) — use スキップ / ✕ / Esc. */}
      <div className="absolute inset-0" />
      {/* Spotlight (box-shadow makes everything outside it dim); no target =
          a plain dim backdrop. */}
      {rect ? (
        <div
          className="absolute rounded-lg pointer-events-none transition-all"
          style={{
            left: rect.left - 4,
            top: rect.top - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/55" />
      )}

      <div
        style={cardStyle}
        className="rounded-card border border-border bg-bg2 shadow-lg p-3 space-y-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-2">
          <h3 className="flex-1 text-body font-semibold text-text">{t(step.title)}</h3>
          <button
            onClick={onClose}
            className="shrink-0 text-text3 hover:text-text -mt-0.5 -mr-1 p-1"
            data-tip={t("スキップ")}
            aria-label={t("スキップ")}
          >
            <IconX size={14} aria-hidden />
          </button>
        </div>
        <p className="text-label text-text2 leading-relaxed">{t(step.body)}</p>
        <div className="flex items-center gap-2 pt-1">
          <span className="text-caption text-text3 tabular-nums">
            {i + 1} / {STEPS.length}
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            {i > 0 && (
              <Button size="xs" onClick={back}>
                {t("戻る")}
              </Button>
            )}
            <Button size="xs" variant="primary" onClick={next}>
              {last ? t("完了") : t("次へ")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
