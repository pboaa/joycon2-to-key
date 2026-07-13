import { ICON_SET } from "../../lib/iconSet.generated";

/** Every icon export name the picker offers (e.g. "IconBrush"), sorted. Backed
 * by the static curated set, so this resolves synchronously — the async shape is
 * kept so callers (the picker) don't need to change. */
const NAMES = Object.keys(ICON_SET).sort();
export async function getIconNames(): Promise<string[]> {
  return NAMES;
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
  const Icon = ICON_SET[name];
  if (!Icon) return null;
  return <Icon size={size} className={className} color={color} aria-hidden />;
}
