// Pure profile operations on AppConfig. Each returns a new config (or null when
// the change is invalid, so callers can skip selection updates). No React here.
import type { AppConfig, LayerConfig, ProfileConfig } from "../types";
import { reorderRecord } from "../reorder";

const DEFAULT_NAMES = ["デフォルト", "default"];
export const isDefaultProfile = (name: string) => DEFAULT_NAMES.includes(name);

/** Reorder profile names so the default profile stays pinned at the front. The
 * default is the fallback for unmatched apps, so it's fixed at the top and can't
 * be dragged below other profiles. */
export function pinDefaultFirst(names: string[]): string[] {
  return [
    ...names.filter(isDefaultProfile),
    ...names.filter((n) => !isDefaultProfile(n)),
  ];
}

/** The starter layer set for a new/reset profile: just the base "メイン"
 * layer. Extra layers are added by the user as needed (via Add layer). */
function starterLayers(): Record<string, LayerConfig> {
  return { メイン: { buttons: {} } };
}

export function addProfile(
  config: AppConfig,
  name: string,
  matchApps: string[] = [],
  icon?: string,
): AppConfig | null {
  if (config[name]) return null;
  return {
    ...config,
    [name]: {
      matchApps,
      initialLayer: "メイン",
      layers: starterLayers(),
      ...(icon ? { icon } : {}),
    },
  };
}

export function setMatchApps(
  config: AppConfig,
  name: string,
  apps: string[],
): AppConfig | null {
  const p = config[name];
  if (!p) return null;
  return { ...config, [name]: { ...p, matchApps: apps } };
}

/** The profile's avatar icon = the first matched app's icon (from appIcons),
 * else keep whatever was there. */
function withDerivedIcon(p: ProfileConfig): ProfileConfig {
  const top = p.matchApps[0];
  const derived = top ? p.appIcons?.[top] : undefined;
  const next = { ...p };
  if (derived) next.icon = derived;
  else delete next.icon;
  return next;
}

/** Add a matched app (with its icon, if picked from the running list). The
 * profile's avatar becomes the first app's icon. */
export function addMatchApp(
  config: AppConfig,
  name: string,
  exe: string,
  icon?: string,
): AppConfig | null {
  const p = config[name];
  if (!p || p.matchApps.includes(exe)) return null;
  const appIcons = { ...(p.appIcons ?? {}) };
  if (icon) appIcons[exe] = icon;
  return {
    ...config,
    [name]: withDerivedIcon({ ...p, matchApps: [...p.matchApps, exe], appIcons }),
  };
}

/** Remove a matched app (and its stored icon); re-derive the avatar. */
export function removeMatchApp(
  config: AppConfig,
  name: string,
  exe: string,
): AppConfig | null {
  const p = config[name];
  if (!p) return null;
  const appIcons = { ...(p.appIcons ?? {}) };
  delete appIcons[exe];
  return {
    ...config,
    [name]: withDerivedIcon({
      ...p,
      matchApps: p.matchApps.filter((a) => a !== exe),
      appIcons,
    }),
  };
}

/** Reorder matched apps (drag); the first app drives the avatar icon. */
export function reorderMatchApps(
  config: AppConfig,
  name: string,
  apps: string[],
): AppConfig | null {
  const p = config[name];
  if (!p) return null;
  return { ...config, [name]: withDerivedIcon({ ...p, matchApps: apps }) };
}

/** Set (or clear, when `icon` is undefined) a profile's app icon. Pure op with
 * test coverage; kept for reuse even though no UI wires a manual profile-icon
 * picker today. */
export function setIcon(
  config: AppConfig,
  name: string,
  icon: string | undefined,
): AppConfig | null {
  const p = config[name];
  if (!p) return null;
  const next = { ...p };
  if (icon) next.icon = icon;
  else delete next.icon;
  return { ...config, [name]: next };
}

export function deleteProfile(config: AppConfig, name: string): AppConfig | null {
  if (isDefaultProfile(name) || !config[name]) return null;
  const next = { ...config };
  delete next[name];
  return next;
}

export function renameProfile(
  config: AppConfig,
  oldName: string,
  newName: string,
): AppConfig | null {
  if (!config[oldName] || config[newName]) return null;
  const next: AppConfig = {};
  for (const [k, v] of Object.entries(config)) {
    next[k === oldName ? newName : k] = v;
  }
  return next;
}

export function reorderProfiles(config: AppConfig, order: string[]): AppConfig {
  return reorderRecord(config, pinDefaultFirst(order));
}

