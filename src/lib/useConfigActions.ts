import { useMemo } from "react";
import type {
  AppConfig,
  ButtonAssignment,
  InheritMode,
  LayerConfig,
  ProfileConfig,
} from "./types";
import type { Selection } from "./useSelection";
import i18n from "i18next";
import { useStore } from "../store";
import * as profileOps from "./config/profiles";
import * as layerOps from "./config/layers";
import { uniqueName } from "./uniqueName";
import { toast } from "./toast";

export type ConfigActions = ReturnType<typeof useConfigActions>;

/** Auto-generated profile names (see KeysRail's `addProfile`): an untouched
 * one is renamed after its first matched app. */
const AUTO_NAME_RE = /^プロファイル(\s*\d+)?$/;

/** Config-mutation actions bound to the current selection. Each calls a pure
 * op from `lib/config`, then commits via `setConfig` and updates the selection
 * where needed. The returned object is memoized so memoized consumers don't
 * re-render on unrelated parent updates. */
export function useConfigActions(
  config: AppConfig | null,
  setConfig: (next: AppConfig) => void,
  sel: Selection,
) {
  return useMemo(() => makeActions(config, setConfig, sel), [config, setConfig, sel]);
}

function makeActions(
  config: AppConfig | null,
  setConfig: (next: AppConfig) => void,
  sel: Selection,
) {
  const commit = (next: AppConfig | null) => {
    if (next) setConfig(next);
  };
  const commitProfile = (np: ProfileConfig | null) => {
    if (config && np) setConfig({ ...config, [sel.selectedProfile]: np });
  };

  // ── Profiles ──
  const addProfile = (name: string, matchApps: string[] = [], icon?: string) => {
    if (!config) return;
    const next = profileOps.addProfile(config, name, matchApps, icon);
    if (next) {
      setConfig(next);
      sel.setSelectedProfile(name);
    }
  };
  const updateMatchApps = (apps: string[]) => {
    if (config) commit(profileOps.setMatchApps(config, sel.selectedProfile, apps));
  };
  const addMatchApp = (exe: string, icon?: string) => {
    if (!config) return;
    const profile = sel.selectedProfile;
    const added = profileOps.addMatchApp(config, profile, exe, icon);
    if (!added) return;
    // Name an untouched auto-named profile after its first app (chrome.exe →
    // chrome). Skips the passthrough default and any user-renamed profile.
    const base = exe.replace(/\.exe$/i, "").trim();
    const untouched =
      !profileOps.isDefaultProfile(profile) &&
      AUTO_NAME_RE.test(profile) &&
      (config[profile]?.matchApps.length ?? 0) === 0;
    if (base && untouched) {
      const newName = uniqueName(
        base,
        Object.keys(config).filter((n) => n !== profile),
      );
      const renamed = profileOps.renameProfile(added, profile, newName);
      if (renamed) {
        setConfig(renamed);
        if (sel.selectedProfile === profile) sel.setSelectedProfile(newName);
        return;
      }
    }
    commit(added);
  };
  const removeMatchApp = (exe: string) => {
    if (config) commit(profileOps.removeMatchApp(config, sel.selectedProfile, exe));
  };
  const reorderMatchApps = (apps: string[]) => {
    if (config)
      commit(profileOps.reorderMatchApps(config, sel.selectedProfile, apps));
  };
  // `silent` skips the Undo toast — used when discarding an abandoned just-
  // created profile on modal close (never an intentional delete to reverse).
  const deleteProfile = (name: string, silent = false) => {
    if (!config) return;
    const next = profileOps.deleteProfile(config, name);
    if (!next) return;
    const prevConfig = config; // full snapshot keeps profile order on undo
    setConfig(next);
    if (silent) return;
    toast.undo(
      i18n.t("プロファイル「{{name}}」を削除しました", { name }),
      i18n.t("元に戻す"),
      () => setConfig(prevConfig),
    );
  };
  const renameProfile = (oldName: string, newName: string) => {
    if (!config) return;
    const next = profileOps.renameProfile(config, oldName, newName);
    if (next) {
      setConfig(next);
      if (sel.selectedProfile === oldName) sel.setSelectedProfile(newName);
    }
  };
  const reorderProfiles = (order: string[]) => {
    if (config) setConfig(profileOps.reorderProfiles(config, order));
  };

  // ── Layers (on the current profile) ──
  const addLayer = (name: string) => {
    if (!sel.profile) return;
    const np = layerOps.addLayer(sel.profile, name);
    if (np) {
      commitProfile(np);
      sel.setSelectedLayer(name);
    }
  };
  /** Create a layer if missing, without switching the edited layer. Used by the
   * LayerHold editor to make a hold-target named after the button. Reads the
   * *latest* profiles from the store — not the memoized closure — so it composes
   * with the press update fired just before it (each `setProfiles` replaces, so a
   * stale-closure read would clobber that change). */
  const ensureLayer = (name: string) => {
    const cfg = useStore.getState().profiles;
    const p = cfg?.[sel.selectedProfile];
    if (!p || p.layers[name]) return;
    setConfig({ ...cfg, [sel.selectedProfile]: layerOps.addLayer(p, name) ?? p });
  };
  // `silent` skips the Undo toast — used when the caller already confirmed
  // (a layer with assignments is deleted via a confirm dialog, not Undo).
  const deleteLayer = (name: string, silent = false) => {
    if (!sel.profile) return;
    const np = layerOps.deleteLayer(sel.profile, name);
    if (!np) return; // can't delete the last layer
    const prevProfile = sel.profile; // keeps layer order + data on undo
    const prevLayer = sel.selectedLayer;
    commitProfile(np);
    if (silent) return;
    toast.undo(
      i18n.t("レイヤー「{{name}}」を削除しました", { name }),
      i18n.t("元に戻す"),
      () => {
        // Restore just this profile into the *latest* config (surgical: other
        // profiles' intervening edits survive).
        const cfg = useStore.getState().profiles;
        if (cfg) setConfig({ ...cfg, [sel.selectedProfile]: prevProfile });
        sel.setSelectedLayer(prevLayer);
      },
    );
  };
  const reorderLayers = (order: string[]) => {
    if (sel.profile) commitProfile(layerOps.reorderLayers(sel.profile, order));
  };
  const duplicateLayer = (name: string) => {
    if (sel.profile) commitProfile(layerOps.duplicateLayer(sel.profile, name));
  };
  const renameLayer = (oldName: string, newName: string) => {
    if (!sel.profile) return;
    const np = layerOps.renameLayer(sel.profile, oldName, newName);
    if (np) {
      commitProfile(np);
      if (sel.selectedLayer === oldName) sel.setSelectedLayer(newName);
    }
  };
  const clearLayer = (name: string) => {
    if (sel.profile) commitProfile(layerOps.clearLayerButtons(sel.profile, name));
  };
  // Copy a layer to the (cross-profile) layer clipboard; paste adds it to the
  // current profile under a unique name and selects it.
  const copyLayer = (name: string) => {
    const layer = sel.profile?.layers[name];
    if (layer) sel.setLayerClipboard({ name, layer: structuredClone(layer) });
  };
  const pasteLayer = () => {
    const clip = sel.layerClipboard;
    if (!clip || !sel.profile) return;
    const res = layerOps.pasteLayer(sel.profile, clip.name, clip.layer);
    commitProfile(res.profile);
    sel.setSelectedLayer(res.name);
  };
  const setLayerInherit = (name: string, mode: InheritMode) => {
    if (sel.profile)
      commitProfile(layerOps.setLayerInherit(sel.profile, name, mode));
  };
  const setLayerMouse = (
    name: string,
    patch: Partial<
      Pick<
        LayerConfig,
        "stickMouse" | "stickMouseSpeed" | "stickMouseR" | "stickMouseSpeedR"
      >
    >,
  ) => {
    if (sel.profile)
      commitProfile(layerOps.setLayerMouse(sel.profile, name, patch));
  };

  // ── Assignment (current profile/layer/button) ──
  const setAssignment = (next: ButtonAssignment | null) => {
    if (!sel.profile || !sel.layer || !sel.selectedButton) return;
    commitProfile(
      layerOps.setButtonAssignment(
        sel.profile,
        sel.selectedLayer,
        sel.selectedButton,
        next,
      ),
    );
  };
  /** Set a specific button's assignment (not the selected one) — for the pad's
   * right-click menu, which targets the button under the cursor. */
  const setAssignmentAt = (btnKey: string, next: ButtonAssignment | null) => {
    if (!sel.profile) return;
    commitProfile(
      layerOps.setButtonAssignment(sel.profile, sel.selectedLayer, btnKey, next),
    );
  };
  const copyButton = () => {
    if (sel.selectedButton)
      sel.setClipboard(
        sel.selectedAssignment ? structuredClone(sel.selectedAssignment) : null,
      );
  };
  const pasteButton = () => {
    if (sel.selectedButton && sel.clipboard)
      setAssignment(structuredClone(sel.clipboard));
  };

  return {
    addProfile,
    updateMatchApps,
    addMatchApp,
    removeMatchApp,
    reorderMatchApps,
    deleteProfile,
    renameProfile,
    reorderProfiles,
    addLayer,
    ensureLayer,
    deleteLayer,
    reorderLayers,
    duplicateLayer,
    renameLayer,
    clearLayer,
    copyLayer,
    pasteLayer,
    setLayerInherit,
    setLayerMouse,
    setAssignment,
    setAssignmentAt,
    copyButton,
    pasteButton,
  };
}
