import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "dangerSolid"
  | "dangerOutline";

const VARIANTS: Record<ButtonVariant, string> = {
  // Give depth via surface, border and colour so it clearly reads as clickable.
  primary:
    "bg-accent text-white font-semibold border border-accent hover:bg-accent2 hover:border-accent2",
  secondary: "bg-bg3 text-text border border-border hover:border-text2",
  ghost: "text-text2 hover:bg-bg3 hover:text-text",
  // Delete-type actions use a reddish surface for instant recognition (fills red on hover).
  danger:
    "bg-danger/15 text-danger border border-danger/50 hover:bg-danger hover:text-white hover:border-danger",
  // Irreversible actions (reset / reset-all) warn with a red fill. To avoid being
  // garish it's a desaturated red (semi-transparent to blend in), tightened on hover.
  dangerSolid:
    "bg-danger/80 text-white border border-danger/50 hover:bg-danger",
  dangerOutline:
    "border border-danger/50 text-danger hover:bg-danger/10",
};

const SIZES = {
  xs: "px-1.5 py-0.5 text-body rounded-row",
  sm: "px-2.5 py-1  text-label rounded-row",
  md: "px-3.5 py-1.5 text-body rounded-row",
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: keyof typeof SIZES;
  fullWidth?: boolean;
}

/** The one button. Variants cover every recurring skin in the app; pass
 * `className` for one-off tweaks (e.g. heights in the top bar). */
export function Button({
  variant = "secondary",
  size = "md",
  fullWidth = false,
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap cursor-pointer transition-colors",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    />
  );
}
