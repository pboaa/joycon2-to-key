import type { ReactNode } from "react";
import { cn } from "./cn";

/** A small bordered mono toggle chip (on = accent fill). Shared by the held-
 * modifier picker and any other "pick from a few short options" row so they read
 * identically. For a physical Joy-Con button use {@link KeyCap} instead. */
export function ToggleChip({
  on,
  onClick,
  children,
  className,
  tip,
  disabled,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  /** Hover explanation (shown via the shared data-tip tooltip). */
  tip?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-tip={tip}
      className={cn(
        "text-caption font-mono px-1.5 py-0.5 rounded-row border transition-colors",
        on
          ? "bg-accent text-white border-accent"
          : "bg-bg2 border-border text-text2 hover:bg-bg3",
        disabled && "opacity-40 cursor-not-allowed hover:bg-bg2",
        className,
      )}
    >
      {children}
    </button>
  );
}
