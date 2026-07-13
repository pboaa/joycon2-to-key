import {
  Children,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "./cn";
import { useEscapeKey } from "../../lib/useEscapeKey";

/** Same authoring API as a native `<select>` — pass `<option>` children — but
 * rendered as a themed, portalled dropdown so the option list is styled (padding,
 * hover highlight, a ✓ on the current value) instead of the bare OS popup, and
 * the trigger's focus ring only shows for keyboard use (no lingering border after
 * a click). Selection fires `onChange({ target: { value } })` to match callers. */
export interface SelectProps {
  value?: string | number;
  onChange?: (e: { target: { value: string } }) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  fullWidth?: boolean;
  className?: string;
  children?: ReactNode;
  "data-tip"?: string;
  id?: string;
}

interface Item {
  value: string;
  label: ReactNode;
  disabled: boolean;
}

interface Pos {
  left: number;
  minW: number;
  maxW: number;
  top?: number;
  bottom?: number;
  maxH: number;
}

/** Pull the `<option>` children into a flat item list (arrays/fragments are
 * flattened by React.Children). */
function readOptions(children: ReactNode): Item[] {
  const items: Item[] = [];
  Children.forEach(children, (ch) => {
    if (isValidElement(ch) && ch.type === "option") {
      const p = ch.props as {
        value?: string | number;
        disabled?: boolean;
        children?: ReactNode;
      };
      items.push({
        value: String(p.value ?? ""),
        label: p.children,
        disabled: !!p.disabled,
      });
    }
  });
  return items;
}

export function Select({
  value,
  onChange,
  disabled,
  size = "md",
  fullWidth = true,
  className,
  children,
  ...rest
}: SelectProps) {
  const items = readOptions(children);
  const cur = String(value ?? "");
  const selected = items.find((i) => i.value === cur);

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);
  const [active, setActive] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Close the dropdown (not the surrounding modal) on Escape, via the shared
  // stack so it's the topmost consumer while open.
  useEscapeKey(() => setOpen(false), open);

  const place = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const below = window.innerHeight - r.bottom;
    const above = r.top;
    const up = below < 240 && above > below;
    setPos({
      left: r.left,
      // At least the trigger's width, but free to grow to the option text (so a
      // narrow content-sized trigger doesn't clip long labels), capped to the
      // space left of the right edge.
      minW: r.width,
      maxW: Math.max(r.width, window.innerWidth - r.left - 8),
      top: up ? undefined : r.bottom + 4,
      bottom: up ? window.innerHeight - r.top + 4 : undefined,
      maxH: Math.min(280, (up ? above : below) - 12),
    });
  };

  const openNow = () => {
    if (disabled) return;
    place();
    setActive(Math.max(0, items.findIndex((i) => i.value === cur)));
    setOpen(true);
  };
  const choose = (v: string) => {
    onChange?.({ target: { value: v } });
    setOpen(false);
  };

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const reclose = () => setOpen(false);
    // Capture so scrolling an ancestor (e.g. a modal body) also dismisses it.
    window.addEventListener("scroll", reclose, true);
    window.addEventListener("resize", reclose);
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || listRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("scroll", reclose, true);
      window.removeEventListener("resize", reclose);
      document.removeEventListener("mousedown", onDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Keep the keyboard-highlighted row in view.
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-idx="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const move = (d: number) => {
    if (!items.length) return;
    let i = active;
    for (let n = 0; n < items.length; n++) {
      i = (i + d + items.length) % items.length;
      if (!items[i].disabled) {
        setActive(i);
        break;
      }
    }
  };
  const onKey = (e: ReactKeyboardEvent) => {
    if (disabled) return;
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openNow();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const it = items[active];
      if (it && !it.disabled) choose(it.value);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openNow())}
        onKeyDown={onKey}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "inline-flex items-center justify-between gap-1.5 rounded-row border bg-bg2 text-left text-text",
          size === "sm" ? "text-label px-2.5 py-1.5" : "text-body px-2.5 py-1.5",
          open ? "border-accent ring-1 ring-accent" : "border-border hover:border-text2",
          "focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          fullWidth && "w-full",
          className,
        )}
        {...rest}
      >
        <span className={cn("truncate", !selected && "text-text3")}>
          {selected ? selected.label : ""}
        </span>
        <span
          className={cn(
            "shrink-0 text-caption text-text3 transition-transform",
            open && "rotate-180",
          )}
        >
          ▾
        </span>
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={listRef}
            role="listbox"
            className="fixed z-[var(--z-overlay)] overflow-y-auto rounded-card border border-border bg-bg2 py-1 shadow-pop animate-pop-in"
            style={{
              left: pos.left,
              minWidth: pos.minW,
              maxWidth: pos.maxW,
              top: pos.top,
              bottom: pos.bottom,
              maxHeight: pos.maxH,
            }}
          >
            {items.map((it, i) => {
              const on = it.value === cur;
              const hot = i === active;
              return (
                <button
                  key={it.value + i}
                  type="button"
                  data-idx={i}
                  disabled={it.disabled}
                  role="option"
                  aria-selected={on}
                  onMouseEnter={() => !it.disabled && setActive(i)}
                  onClick={() => !it.disabled && choose(it.value)}
                  className={cn(
                    "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-body",
                    it.disabled
                      ? "cursor-not-allowed text-text3"
                      : hot
                        ? "bg-accent/10 text-text"
                        : "text-text2",
                    on && !it.disabled && "font-medium text-text",
                  )}
                >
                  <span className="w-3.5 shrink-0 text-label text-accent">
                    {on ? "✓" : ""}
                  </span>
                  <span className="truncate">{it.label}</span>
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
