// Pure layer operations on a ProfileConfig. Each returns a new ProfileConfig
// (or null when invalid). The initial layer is always kept as the first one in
// order. No React here.
import type {
  ButtonAssignment,
  InheritMode,
  LayerConfig,
  ProfileConfig,
} from "../types";
import { reorderRecord } from "../reorder";
import { uniqueName } from "../uniqueName";
import { inheritsUnderModifiers } from "../variants";

/** Normalize the stored inherit value (which may be a legacy boolean) to the
 * tri-state mode. `true`/absent → "all", `false` → "none". */
export function normalizeInherit(
  v: InheritMode | boolean | undefined,
): InheritMode {
  if (v === true || v === undefined) return "all";
  if (v === false) return "none";
  return v;
}

/** The base-layer buttons a layer actually inherits under the given mode:
 * everything (all), only hold/modifier buttons (modifiers), or none. */
export function inheritedFromBase(
  baseButtons: Record<string, ButtonAssignment>,
  mode: InheritMode,
): Record<string, ButtonAssignment> {
  if (mode === "none") return {};
  if (mode === "all") return baseButtons;
  const out: Record<string, ButtonAssignment> = {};
  for (const [btn, a] of Object.entries(baseButtons)) {
    if (inheritsUnderModifiers(a)) out[btn] = a;
  }
  return out;
}

/** Sync `initialLayer` to the first layer in order after any layer mutation
 * (the base layer is pinned first — see reorderLayers). */
export function withInitialLayer(
  profile: ProfileConfig,
  layers: Record<string, LayerConfig>,
): ProfileConfig {
  return { ...profile, layers, initialLayer: Object.keys(layers)[0] ?? "" };
}

/**
 * Reconcile every layer reference inside a profile's assignments against the set
 * of layer names that actually exist (`valid`), optionally renaming one layer
 * (`rename: [old, new]`) first. This is the single source of truth for layer
 * referential integrity, shared by rename, delete, and the save-time sanitizer:
 * - `layerHold.layer`: renamed; if it no longer names a real layer the button's
 *   assignment is dropped (the "hold to switch here" target is gone).
 * Returns the same profile object when nothing changed.
 */
export function reconcileLayerRefs(
  profile: ProfileConfig,
  opts: { valid: Set<string>; rename?: [string, string] },
): ProfileConfig {
  const { valid, rename } = opts;
  const mapName = (n: string) => (rename && n === rename[0] ? rename[1] : n);
  let profileChanged = false;
  const layers: Record<string, LayerConfig> = {};

  for (const [lname, l] of Object.entries(profile.layers)) {
    let layerChanged = false;
    const buttons: Record<string, ButtonAssignment> = {};
    for (const [btn, a] of Object.entries(l.buttons)) {
      if (a.press.type === "layerHold") {
        const target = mapName(a.press.layer);
        if (!valid.has(target)) {
          layerChanged = true; // target layer gone → drop the button
          continue;
        }
        if (target === a.press.layer) buttons[btn] = a;
        else {
          layerChanged = true;
          buttons[btn] = { ...a, press: { ...a.press, layer: target } };
        }
        continue;
      }
      buttons[btn] = a;
    }
    if (layerChanged) {
      layers[lname] = { ...l, buttons };
      profileChanged = true;
    } else {
      layers[lname] = l;
    }
  }

  return profileChanged ? { ...profile, layers } : profile;
}

export function addLayer(profile: ProfileConfig, name: string): ProfileConfig | null {
  if (profile.layers[name]) return null;
  // New layers default to inheriting only the base layer's hold-to-switch
  // (LayerHold) buttons, so layer navigation keeps working while the rest of
  // the layer is a blank slate.
  return withInitialLayer(profile, {
    ...profile.layers,
    [name]: { buttons: {}, inherit: "modifiers" },
  });
}

export function deleteLayer(profile: ProfileConfig, name: string): ProfileConfig | null {
  if (Object.keys(profile.layers).length <= 1) return null;
  const layers = { ...profile.layers };
  delete layers[name];
  // Scrub references to the removed layer (cycleLayer lists / layerHold targets).
  const scrubbed = reconcileLayerRefs(withInitialLayer(profile, layers), {
    valid: new Set(Object.keys(layers)),
  });
  return scrubbed;
}

export function reorderLayers(profile: ProfileConfig, order: string[]): ProfileConfig {
  // The first layer is the base (initial) layer (withInitialLayer treats the
  // first key as the base), so reordering freely can change which layer is the
  // base — the top row is the base. Only profiles have a pinned/fixed entry.
  return withInitialLayer(profile, reorderRecord(profile.layers, order));
}

/** Add `layer` (a pasted copy, possibly from another profile) under a unique
 * name derived from `name`. Verbatim — hold-switch targets keep their names, so
 * a target that the pasted-into profile lacks is dropped by the save-time
 * reconcile. Returns the new profile and the added layer's name. */
export function pasteLayer(
  profile: ProfileConfig,
  name: string,
  layer: LayerConfig,
): { profile: ProfileConfig; name: string } {
  const finalName = uniqueName(name, Object.keys(profile.layers));
  return {
    profile: withInitialLayer(profile, {
      ...profile.layers,
      [finalName]: structuredClone(layer),
    }),
    name: finalName,
  };
}

export function duplicateLayer(
  profile: ProfileConfig,
  name: string,
): ProfileConfig | null {
  if (!profile.layers[name]) return null;
  const candidate = uniqueName(name, Object.keys(profile.layers));
  return withInitialLayer(profile, {
    ...profile.layers,
    [candidate]: structuredClone(profile.layers[name]),
  });
}

/** Clear every button assignment in `name` (keeps the layer and its inherit
 * mode). Null when the layer doesn't exist. */
export function clearLayerButtons(
  profile: ProfileConfig,
  name: string,
): ProfileConfig | null {
  const layer = profile.layers[name];
  if (!layer) return null;
  return {
    ...profile,
    layers: { ...profile.layers, [name]: { ...layer, buttons: {} } },
  };
}

export function renameLayer(
  profile: ProfileConfig,
  oldName: string,
  newName: string,
): ProfileConfig | null {
  if (!profile.layers[oldName] || profile.layers[newName]) return null;
  // Preserve order while renaming the key.
  const layers: Record<string, LayerConfig> = {};
  for (const [k, v] of Object.entries(profile.layers)) {
    layers[k === oldName ? newName : k] = v;
  }
  // Retarget any cycleLayer / layerHold references to the renamed layer.
  return reconcileLayerRefs(withInitialLayer(profile, layers), {
    valid: new Set(Object.keys(layers)),
    rename: [oldName, newName],
  });
}

/** Set how a layer inherits the base (initial) layer. */
export function setLayerInherit(
  profile: ProfileConfig,
  layerName: string,
  inherit: InheritMode,
): ProfileConfig {
  const layer = profile.layers[layerName];
  if (!layer) return profile;
  return {
    ...profile,
    layers: { ...profile.layers, [layerName]: { ...layer, inherit } },
  };
}

/** Patch a layer's stick/gyro→mouse settings (per-layer). */
export function setLayerMouse(
  profile: ProfileConfig,
  layerName: string,
  patch: Partial<
    Pick<
      LayerConfig,
      "stickMouse" | "stickMouseSpeed" | "stickMouseR" | "stickMouseSpeedR"
    >
  >,
): ProfileConfig {
  const layer = profile.layers[layerName];
  if (!layer) return profile;
  return {
    ...profile,
    layers: { ...profile.layers, [layerName]: { ...layer, ...patch } },
  };
}

/** Set a button's assignment in one layer (null removes the entry). */
export function setButtonAssignment(
  profile: ProfileConfig,
  layerName: string,
  btnKey: string,
  assignment: ButtonAssignment | null,
): ProfileConfig {
  const layer = profile.layers[layerName];
  if (!layer) return profile;
  const buttons = { ...layer.buttons };
  if (assignment === null) delete buttons[btnKey];
  else buttons[btnKey] = assignment;
  return {
    ...profile,
    layers: { ...profile.layers, [layerName]: { ...layer, buttons } },
  };
}
