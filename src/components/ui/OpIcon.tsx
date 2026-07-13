import { IconHelpCircle } from "@tabler/icons-react";
import { ICON_SET } from "../../lib/iconSet.generated";

/** Every icon export name the picker offers (e.g. "IconBrush"), sorted. Backed
 * by the static curated set, so this resolves synchronously — the async shape is
 * kept so callers (the picker) don't need to change. */
const NAMES = Object.keys(ICON_SET).sort();
export async function getIconNames(): Promise<string[]> {
  return NAMES;
}

/** Whether `name` renders to something: a custom image (data URL) or a Tabler
 * name that's in the bundled curated set. Used to drop stale picks (e.g. from
 * 0.1.0's full-barrel search) so they don't show as blank cells / empty slots. */
export function iconExists(name: string): boolean {
  return name.startsWith("data:") || name in ICON_SET;
}

/** Render a saved operation's icon: either a Tabler icon by its export name
 * (e.g. "IconBrush"), or a custom raster image stored as a `data:image/...` URL
 * (e.g. exported from CLIP Studio). Renders nothing when the name is empty or
 * isn't in the curated set. `color` overrides the inherited `currentColor` tint
 * for Tabler icons (ignored for images, which keep their own colours); omit to
 * inherit the surrounding text colour.
 *
 * The Tabler icons come from a static, curated map (src/lib/iconSet.generated.ts)
 * rather than the full ~6000-icon barrel, so only the offered icons ship. */
export function OpIcon({
  name,
  size = 16,
  className,
  color,
}: {
  name?: string;
  size?: number;
  className?: string;
  color?: string;
}) {
  if (!name) return null;
  // A custom image icon (data URL): shown as-is, contained in the icon box.
  if (name.startsWith("data:")) {
    return (
      <img
        src={name}
        alt=""
        width={size}
        height={size}
        className={className}
        style={{ objectFit: "contain", display: "inline-block" }}
        aria-hidden
      />
    );
  }
  // A Tabler name outside the curated set (e.g. a pick saved by 0.1.0's full
  // search) can't be rendered — show a faded generic placeholder instead of a
  // blank slot, so the icon reads as "unavailable" rather than missing.
  const Icon = ICON_SET[name];
  if (!Icon) {
    return (
      <IconHelpCircle
        size={size}
        className={(className ? className + " " : "") + "opacity-40"}
        aria-hidden
      />
    );
  }
  return <Icon size={size} className={className} color={color} aria-hidden />;
}
