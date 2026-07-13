import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";

/** Shared bubble styling so every tooltip in the app looks the same (the global
 * host below and the Joy-Con pad's own cursor-following tip both use it). */
export const TOOLTIP_CLASS =
  "rounded-row bg-bg3 text-text text-caption font-normal normal-case tracking-normal leading-snug px-2 py-1 shadow-xl border border-border";

/** A global custom tooltip. Hovering an element with a `data-tip` attribute shows
 * a bubble in the app's shared style (a replacement for the native title). Place
 * it once in App. It only reads attributes, so it doesn't affect layout.
 *
 * Placement is two-stage: "measure the real size after render, then pin it to the
 * trigger". It used to assume a max width and clamp the left position, which sent
 * chips on the right-edge buttons (minimize / close) far to the left. Measuring the
 * real size lets even short chips sit directly under their element. */
export function TooltipHost() {
  // The hovered trigger's rect + text. The actual left/top is decided after measuring.
  const [target, setTarget] = useState<{ text: string; rect: DOMRect } | null>(
    null,
  );
  const bubbleRef = useRef<HTMLDivElement>(null);
  // Keep it invisible until measured, then show it once positioned (avoids a flash at a wrong spot).
  const [style, setStyle] = useState<CSSProperties>({ visibility: "hidden" });

  useEffect(() => {
    let current: Element | null = null;

    const onOver = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("[data-tip]") ?? null;
      if (el === current) return;
      current = el;
      const text = el?.getAttribute("data-tip");
      if (el && text) {
        setStyle({ visibility: "hidden" }); // 実寸測定まで隠す
        setTarget({ text, rect: el.getBoundingClientRect() });
      } else {
        setTarget(null);
      }
    };
    const clear = () => {
      current = null;
      setTarget(null);
    };

    document.addEventListener("mouseover", onOver);
    document.addEventListener("mousedown", clear);
    window.addEventListener("scroll", clear, true);
    window.addEventListener("blur", clear);
    return () => {
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mousedown", clear);
      window.removeEventListener("scroll", clear, true);
      window.removeEventListener("blur", clear);
    };
  }, []);

  // After render, measure the bubble's real size and place it directly below the
  // trigger (above if it doesn't fit), horizontally centred and clamped to the viewport.
  useLayoutEffect(() => {
    const bubble = bubbleRef.current;
    if (!target || !bubble) return;
    const b = bubble.getBoundingClientRect();
    const r = target.rect;
    const gap = 6;
    const pad = 8;
    // Horizontal: align the bubble centre to the trigger centre, kept on screen.
    let left = r.left + r.width / 2 - b.width / 2;
    left = Math.max(pad, Math.min(left, window.innerWidth - b.width - pad));
    // Vertical: show below; flip above if it doesn't fit.
    let top = r.bottom + gap;
    if (top + b.height + pad > window.innerHeight) top = r.top - b.height - gap;
    top = Math.max(pad, top);
    setStyle({ left, top, visibility: "visible" });
  }, [target]);

  if (!target) return null;
  return createPortal(
    <div
      ref={bubbleRef}
      role="tooltip"
      className={
        "pointer-events-none fixed z-[var(--z-tooltip)] max-w-[244px] whitespace-pre-line " +
        TOOLTIP_CLASS
      }
      style={style}
    >
      {target.text}
    </div>,
    document.body,
  );
}
