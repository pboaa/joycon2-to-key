import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { cn } from "./cn";
import { useEscapeKey } from "../../lib/useEscapeKey";

export interface MenuItem {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  /** Draw a separator above this item. */
  separated?: boolean;
}

/** A right-click menu anchored at (x, y). Portalled so it escapes overflow;
 * closes on select, outside click, scroll, or Escape. Use via {@link useContextMenu}. */
function ContextMenu({
  x,
  y,
  items,
  onClose,
}: {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });

  // Keep the menu on-screen (flip/clamp against the viewport once measured).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const left = Math.min(x, window.innerWidth - width - 8);
    const top = Math.min(y, window.innerHeight - height - 8);
    setPos({ left: Math.max(8, left), top: Math.max(8, top) });
  }, [x, y]);

  useEscapeKey(onClose, true);
  useEffect(() => {
    const close = () => onClose();
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onDown, true);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("mousedown", onDown, true);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={ref}
      role="menu"
      className="fixed z-[var(--z-menu)] min-w-[160px] rounded-card border border-border bg-bg2 py-1 shadow-pop animate-pop-in"
      style={{ left: pos.left, top: pos.top }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((it, i) => (
        <div key={i}>
          {it.separated && <div className="my-1 h-px bg-border" />}
          <button
            type="button"
            role="menuitem"
            disabled={it.disabled}
            onClick={() => {
              onClose();
              it.onClick();
            }}
            className={cn(
              "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-body transition-colors",
              it.disabled
                ? "cursor-not-allowed text-text3"
                : it.danger
                  ? "text-danger hover:bg-danger/10"
                  : "text-text2 hover:bg-accent/10 hover:text-text",
            )}
          >
            {it.icon && <span className="shrink-0 inline-flex">{it.icon}</span>}
            <span className="truncate">{t(it.label)}</span>
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}

/** Manage one right-click menu. Call `open(e, items)` from an element's
 * `onContextMenu`, and render `node` once in the component. */
export function useContextMenu() {
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(
    null,
  );
  const open = (e: React.MouseEvent, items: MenuItem[]) => {
    if (items.length === 0) return;
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, items });
  };
  const node = menu && (
    <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={() => setMenu(null)} />
  );
  return { open, node };
}
