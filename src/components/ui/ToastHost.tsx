import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { IconCircleCheck, IconInfoCircle, IconArrowBackUp, IconX, IconCircleX } from "@tabler/icons-react";
import { useToastStore, type ToastItem } from "../../lib/toast";

/** Per-kind leading icon + its accent colour. */
const KIND = {
  info: { Icon: IconInfoCircle, color: "text-accent" },
  success: { Icon: IconCircleCheck, color: "text-ok" },
  error: { Icon: IconCircleX, color: "text-danger" },
} as const;

/** One toast row: auto-dismisses after its duration, paused while hovered so a
 * user reaching for Undo never has it vanish mid-reach. A subtle mount
 * transition keeps it from popping in abruptly. */
function ToastRow({ item }: { item: ToastItem }) {
  const { t } = useTranslation();
  const dismiss = useToastStore((s) => s.dismiss);
  const [shown, setShown] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const arm = () => {
    timer.current = setTimeout(() => dismiss(item.id), item.duration);
  };
  const disarm = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    arm();
    return () => {
      cancelAnimationFrame(raf);
      disarm();
    };
    // Arm once per toast; item.id is stable for the toast's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  const { Icon, color } = KIND[item.kind];

  return (
    <div
      onMouseEnter={disarm}
      onMouseLeave={arm}
      className={
        "pointer-events-auto flex items-center gap-2.5 rounded-card border border-border bg-bg2 " +
        "px-3 py-2 shadow-pop ring-1 ring-edge transition-all duration-150 " +
        (shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1")
      }
    >
      <Icon size={16} className={"shrink-0 " + color} aria-hidden />
      <span className="min-w-0 flex-1 text-body leading-snug text-text">
        {item.message}
      </span>
      {item.action && (
        <button
          onClick={() => {
            item.action!.onClick();
            dismiss(item.id);
          }}
          className="shrink-0 inline-flex items-center gap-1 rounded-row px-1.5 py-0.5 text-body font-medium text-accent hover:bg-bg3 transition-colors"
        >
          <IconArrowBackUp size={13} aria-hidden />
          {item.action.label}
        </button>
      )}
      <button
        onClick={() => dismiss(item.id)}
        aria-label={t("閉じる")}
        className="shrink-0 -mr-1 inline-flex items-center rounded-row p-1 text-text3 hover:text-text hover:bg-bg3 transition-colors"
      >
        <IconX size={14} aria-hidden />
      </button>
    </div>
  );
}

/** Global toast stack (bottom-centre), mounted once in App. Reads the standalone
 * toast store so anything — hooks, actions, non-React code — can raise feedback
 * via `toast.*`. The region is an aria-live announcer for screen readers. */
export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  return createPortal(
    <div
      role="region"
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[var(--z-toast)] flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((item) => (
        <ToastRow key={item.id} item={item} />
      ))}
    </div>,
    document.body,
  );
}
