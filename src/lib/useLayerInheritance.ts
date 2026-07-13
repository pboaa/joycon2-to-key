import { useMemo } from "react";
import type {
  ButtonAssignment,
  InheritMode,
  LayerConfig,
  ProfileConfig,
} from "./types";
import { inheritedFromBase, normalizeInherit } from "./config/layers";

/** The layer-inheritance view for the selected layer/button. The base (initial)
 * layer inherits nothing; other layers draw from it per their mode — all /
 * modifiers-only / none. Inheritance is per-button: under "modifiers" only the
 * base's LayerHold buttons carry in. Split out of useSelection to keep that hook
 * focused on selection state. */
export function useLayerInheritance(
  profile: ProfileConfig | null,
  selectedLayer: string,
  selectedButton: string | null,
  layer: LayerConfig | null,
) {
  const baseLayerName = profile?.initialLayer ?? "";
  const baseLayer = profile?.layers?.[baseLayerName];
  const isBaseLayer = selectedLayer === baseLayerName;
  const inheritMode: InheritMode = isBaseLayer
    ? "none"
    : normalizeInherit(layer?.inherit);
  const inheritedBase = useMemo(
    () => inheritedFromBase(baseLayer?.buttons ?? {}, inheritMode),
    [baseLayer, inheritMode],
  );
  // The selected button inherits only when it's part of the inherited set.
  const inheriting =
    selectedButton != null &&
    Object.prototype.hasOwnProperty.call(inheritedBase, selectedButton);
  const baseAssignment: ButtonAssignment | null =
    (inheriting && selectedButton ? baseLayer?.buttons?.[selectedButton] : undefined) ??
    null;
  const effectiveButtons = useMemo(
    () => ({ ...inheritedBase, ...(layer?.buttons ?? {}) }),
    [inheritedBase, layer],
  );
  const inheritedKeys = useMemo(
    () => new Set(Object.keys(inheritedBase).filter((k) => !layer?.buttons?.[k])),
    [inheritedBase, layer],
  );

  return { baseLayerName, inheriting, baseAssignment, effectiveButtons, inheritedKeys };
}
