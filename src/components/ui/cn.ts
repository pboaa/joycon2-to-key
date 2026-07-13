// Class-name join helper. Combines conditionally with clsx and resolves
// conflicting Tailwind utilities last-wins via tailwind-merge (needed for token overrides).
import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// This app's custom tokens (font sizes like `text-body`, corner radii like
// `rounded-row`) aren't known to the default tailwind-merge, so it can mis-classify
// `text-body` as a "text colour" and drop `text-white`. Register the custom tokens
// in their respective class groups so colour and size don't collide.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["caption", "label", "body", "title"] }],
      rounded: [{ rounded: ["row", "card"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
