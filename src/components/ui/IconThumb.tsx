import type { ReactNode } from "react";

/** A small square thumbnail for an app/profile icon: the image is absolutely
 * positioned inside a `relative overflow-hidden` box so it's always clipped to
 * the rounded frame (a plain `object-cover` img could poke past the corners).
 * Falls back to the given node (a Tabler glyph) when there's no image. */
const SIZE_CLS: Record<number, string> = {
  16: "w-4 h-4",
  20: "w-5 h-5",
  24: "w-6 h-6",
};

export function IconThumb({
  src,
  fallback,
  size = 20,
  className = "",
}: {
  src?: string;
  /** Shown centred when there's no `src` (e.g. a Tabler icon at ~13px). */
  fallback: ReactNode;
  /** Box size in px; maps to the matching Tailwind w/h class. */
  size?: 16 | 20 | 24;
  className?: string;
}) {
  return (
    <span
      className={
        `relative ${SIZE_CLS[size]} shrink-0 rounded-row bg-bg overflow-hidden ` +
        `inline-block text-text3 ${className}`
      }
    >
      {src ? (
        <img
          src={src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center">
          {fallback}
        </span>
      )}
    </span>
  );
}
