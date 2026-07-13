import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "./cn";

export const INPUT_SKIN =
  "rounded-row border border-border bg-bg2 text-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-50";

const SIZES = { sm: "text-label", md: "text-body" } as const;

export interface TextInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: keyof typeof SIZES;
  mono?: boolean;
  fullWidth?: boolean;
}

/** The one text input skin (border + surface fill + accent focus). */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput(
    { size = "md", mono = false, fullWidth = true, className, ...rest },
    ref,
  ) {
    return (
      <input
        ref={ref}
        className={cn(
          "px-2.5 py-1.5",
          SIZES[size],
          INPUT_SKIN,
          mono && "font-mono",
          fullWidth && "w-full",
          className,
        )}
        {...rest}
      />
    );
  },
);
