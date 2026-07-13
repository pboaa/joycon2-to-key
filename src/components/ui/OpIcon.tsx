import { Suspense, lazy, type ComponentType } from "react";

/** Minimal shape we render Tabler icons with (avoids importing the whole
 * package's prop types). */
type IconComponent = ComponentType<{
  size?: number | string;
  className?: string;
  color?: string;
}>;
type IconModule = Record<string, IconComponent>;

// The whole Tabler set is loaded once as a single lazy chunk (not 6000 per-icon
// chunks): this is a local desktop app, so loading one ~all-icons file from disk
// on first render beats shipping thousands of tiny files. Cached across renders.
let modPromise: Promise<IconModule> | null = null;
function loadIconModule(): Promise<IconModule> {
  return (modPromise ??= import("@tabler/icons-react") as unknown as Promise<IconModule>);
}

/** Every icon export name (e.g. "IconBrush"), for the picker. Resolves once the
 * barrel is loaded. */
export async function getIconNames(): Promise<string[]> {
  const mod = await loadIconModule();
  return Object.keys(mod)
    .filter((k) => /^Icon[A-Z]/.test(k))
    .sort();
}

// One lazy component per name, cached at module scope so a rendered icon never
// re-suspends (no flicker on re-render / re-select). All names resolve from the
// single shared barrel promise.
const cache = new Map<string, IconComponent>();
function iconFor(name: string): IconComponent {
  let C = cache.get(name);
  if (!C) {
    C = lazy(async () => {
      const mod = await loadIconModule();
      return { default: mod[name] ?? (() => null) };
    });
    cache.set(name, C);
  }
  return C;
}

/** Render a saved operation's icon: either a Tabler icon by its export name
 * (e.g. "IconBrush"), loaded on demand, or a custom raster image stored as a
 * `data:image/...` URL (e.g. exported from CLIP Studio). Renders nothing when
 * the name is empty; an unknown name resolves to nothing. `color` overrides the
 * inherited `currentColor` tint for Tabler icons (ignored for images, which
 * keep their own colours); omit to inherit the surrounding text colour. */
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
  const Icon = iconFor(name);
  return (
    <Suspense
      fallback={<span aria-hidden style={{ display: "inline-block", width: size, height: size }} />}
    >
      <Icon size={size} className={className} color={color} aria-hidden />
    </Suspense>
  );
}
