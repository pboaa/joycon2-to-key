import { useEffect, useMemo } from "react";
import type {
  ActiveLayer,
  AppConfig,
  ButtonAssignment,
  LayerConfig,
  ProfileConfig,
} from "./types";
import { pinDefaultFirst } from "./config/profiles";
import { useFollowActiveLayer } from "./useFollowActiveLayer";
import { useLayerInheritance } from "./useLayerInheritance";
import { useStore, type LayerClipboard } from "../store";

/** Selection state (profile / layer / button / clipboard) plus everything
 * derived from it: the active profile/layer and the layer-inheritance view.
 * Kept in one hook so the config-mutation and presentation layers stay free of
 * this bookkeeping. */
export interface Selection {
  selectedProfile: string;
  setSelectedProfile: (n: string) => void;
  selectedLayer: string;
  setSelectedLayer: (n: string) => void;
  selectedButton: string | null;
  setSelectedButton: (n: string | null) => void;
  clipboard: ButtonAssignment | null;
  setClipboard: (v: ButtonAssignment | null) => void;
  layerClipboard: LayerClipboard | null;
  setLayerClipboard: (v: LayerClipboard | null) => void;

  profileNames: string[];
  /** Per-profile app icon (data URL), for the profile tabs. */
  profileIcons: Record<string, string | undefined>;
  allMatchApps: string[];
  profile: ProfileConfig | null;
  layerNames: string[];
  layer: LayerConfig | null;
  /** The selected button's assignment in the current layer (null if unset). */
  selectedAssignment: ButtonAssignment | null;
  baseLayerName: string;
  /** True when the current layer inherits the base (not base, not inherit:false). */
  inheriting: boolean;
  /** The selected button's base-layer assignment, when inherited (else null). */
  baseAssignment: ButtonAssignment | null;
  effectiveButtons: Record<string, ButtonAssignment>;
  inheritedKeys: Set<string> | undefined;
}

export function useSelection(
  config: AppConfig | null,
  activeLayer: ActiveLayer | null,
  /** Pause runtime-follow (below) while a profile is being edited in a modal —
   * config edits there re-match the foreground app and would otherwise yank the
   * selection out from under the user. */
  suspendFollow = false,
): Selection {
  const selectedProfile = useStore((s) => s.selectedProfile);
  const setSelectedProfile = useStore((s) => s.setSelectedProfile);
  const selectedLayer = useStore((s) => s.selectedLayer);
  const setSelectedLayer = useStore((s) => s.setSelectedLayer);
  const selectedButton = useStore((s) => s.selectedButton);
  const setSelectedButton = useStore((s) => s.setSelectedButton);
  const clipboard = useStore((s) => s.clipboard);
  const setClipboard = useStore((s) => s.setClipboard);
  const layerClipboard = useStore((s) => s.layerClipboard);
  const setLayerClipboard = useStore((s) => s.setLayerClipboard);

  const profileNames = useMemo(
    () => (config ? pinDefaultFirst(Object.keys(config)) : []),
    [config],
  );
  const profileIcons = useMemo(() => {
    const m: Record<string, string | undefined> = {};
    if (config) for (const [n, p] of Object.entries(config)) m[n] = p.icon;
    return m;
  }, [config]);
  const allMatchApps = useMemo(() => {
    const s = new Set<string>();
    if (config)
      for (const p of Object.values(config))
        for (const a of p.matchApps ?? []) s.add(a);
    return [...s];
  }, [config]);
  useEffect(() => {
    if (!config) return;
    if (!profileNames.includes(selectedProfile)) {
      setSelectedProfile(profileNames[0] ?? "デフォルト");
    }
  }, [config, profileNames, selectedProfile]);

  const profile: ProfileConfig | null = config?.[selectedProfile] ?? null;
  // Guard every `layers` access: a hand-edited / imported / older config may
  // have a profile with no `layers`, and crashing the whole screen over it is
  // far worse than degrading to an empty list.
  const layerNames = useMemo(
    () => (profile?.layers ? Object.keys(profile.layers) : []),
    [profile],
  );
  useEffect(() => {
    if (!profile) return;
    if (!layerNames.includes(selectedLayer)) {
      setSelectedLayer(profile.initialLayer || layerNames[0] || "");
    }
  }, [profile, layerNames, selectedLayer]);

  const layer: LayerConfig | null = profile?.layers?.[selectedLayer] ?? null;

  // Follow the runtime's active profile + layer (paused while a profile modal
  // edits the selection). See useFollowActiveLayer.
  useFollowActiveLayer(
    config,
    activeLayer,
    suspendFollow,
    setSelectedProfile,
    setSelectedLayer,
  );

  const selectedAssignment: ButtonAssignment | null =
    (selectedButton && layer ? layer.buttons?.[selectedButton] : undefined) ??
    null;

  // Layer inheritance (base → this layer, per-button). See useLayerInheritance.
  const { baseLayerName, inheriting, baseAssignment, effectiveButtons, inheritedKeys } =
    useLayerInheritance(profile, selectedLayer, selectedButton, layer);

  // A referentially-stable selection object, so memoized consumers (the pad,
  // the editor) only re-render when something they read actually changed.
  return useMemo(
    () => ({
      selectedProfile,
      setSelectedProfile,
      selectedLayer,
      setSelectedLayer,
      selectedButton,
      setSelectedButton,
      clipboard,
      setClipboard,
      layerClipboard,
      setLayerClipboard,
      profileNames,
      profileIcons,
      allMatchApps,
      profile,
      layerNames,
      layer,
      selectedAssignment,
      baseLayerName,
      inheriting,
      baseAssignment,
      effectiveButtons,
      inheritedKeys,
    }),
    [
      selectedProfile,
      selectedLayer,
      selectedButton,
      clipboard,
      layerClipboard,
      profileNames,
      profileIcons,
      allMatchApps,
      profile,
      layerNames,
      layer,
      selectedAssignment,
      baseLayerName,
      inheriting,
      baseAssignment,
      effectiveButtons,
      inheritedKeys,
    ],
  );
}
