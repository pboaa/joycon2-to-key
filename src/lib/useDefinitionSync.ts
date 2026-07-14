// The definition library: CRUD on the store's groups + definitions, plus the
// cascade that keeps every button assignment linked to a definition (which
// caches the definition's press) in sync. One module — the library actions and
// the button-sync wrappers used to live in two files (useDefinitions +
// useDefinitionSync); they're merged here since the former was only ever used
// by the latter.
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { resetDefinitions } from "./tauri";
import { confirmReset } from "./confirms";
import { toast } from "./toast";
import { reorderById } from "./reorder";
import { uniqueName } from "./uniqueName";
import {
  assignmentKey,
  mapLinkedAssignments,
  relinkAssignments,
  unlinkAssignments,
} from "./config/definitions";
import { linkedPress } from "./config/press";
import { useStore } from "../store";
import { useConfirm } from "../components/Confirm";
import type {
  AppConfig,
  ButtonAssignment,
  Definition,
  DefinitionGroup,
  PressConfig,
} from "./types";

let counter = 0;
function newId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

/** Library CRUD actions, reading current state from the store synchronously so
 * batched edits see fresh values. `setLibrary` writes groups + definitions in
 * one update (a single debounced save). */
function makeLibraryActions(
  setLibrary: (groups: DefinitionGroup[], definitions: Definition[]) => void,
) {
  const cur = () => useStore.getState();
  const setDefs = (next: Definition[]) => setLibrary(cur().groups, next);

  const get = (id: string) => cur().definitions.find((d) => d.id === id);
  const replaceAll = (g: DefinitionGroup[], d: Definition[]) => setLibrary(g, d);
  const create = (name: string, press: PressConfig, group?: string) => {
    const id = newId("def");
    setDefs([...cur().definitions, { id, name, group, press }]);
    return id;
  };
  const duplicate = (id: string) => {
    const defs = cur().definitions;
    const src = defs.find((d) => d.id === id);
    const nid = newId("def");
    if (!src) return nid;
    const copy: Definition = {
      id: nid,
      name: src.name ? uniqueName(src.name, defs.map((d) => d.name)) : "コピー",
      group: src.group,
      icon: src.icon,
      iconColor: src.iconColor,
      press: structuredClone(src.press),
    };
    const idx = defs.findIndex((d) => d.id === id);
    const next = defs.slice();
    next.splice(idx + 1, 0, copy);
    setDefs(next);
    return nid;
  };
  const rename = (id: string, name: string) =>
    setDefs(cur().definitions.map((d) => (d.id === id ? { ...d, name } : d)));
  const setGroup = (id: string, group: string | undefined) =>
    setDefs(cur().definitions.map((d) => (d.id === id ? { ...d, group } : d)));
  const setIcon = (id: string, icon: string | undefined) =>
    setDefs(cur().definitions.map((d) => (d.id === id ? { ...d, icon } : d)));
  const setIconColor = (id: string, iconColor: string | undefined) =>
    setDefs(cur().definitions.map((d) => (d.id === id ? { ...d, iconColor } : d)));
  const remove = (id: string) =>
    setDefs(cur().definitions.filter((d) => d.id !== id));
  const reorder = (order: string[]) =>
    setDefs(reorderById(cur().definitions, order, (d) => d.id));

  const addGroup = (name: string) => {
    const id = newId("grp");
    setLibrary([...cur().groups, { id, name }], cur().definitions);
    return id;
  };
  const renameGroup = (id: string, name: string) =>
    setLibrary(
      cur().groups.map((g) => (g.id === id ? { ...g, name } : g)),
      cur().definitions,
    );
  const removeGroup = (id: string) =>
    setLibrary(
      cur().groups.filter((g) => g.id !== id),
      // Orphaned definitions fall back to ungrouped.
      cur().definitions.map((d) =>
        d.group === id ? { ...d, group: undefined } : d,
      ),
    );
  const reorderGroups = (order: string[]) =>
    setLibrary(reorderById(cur().groups, order, (g) => g.id), cur().definitions);

  return {
    get,
    replaceAll,
    create,
    duplicate,
    rename,
    setGroup,
    setIcon,
    setIconColor,
    remove,
    reorder,
    addGroup,
    renameGroup,
    removeGroup,
    reorderGroups,
  };
}

/** The definition library plus edit/rename/remove wrapped so that every button
 * assignment linked to a definition (which caches the definition's press) is
 * kept in sync. See {@link mapLinkedAssignments}. Backup/restore of definitions
 * is done whole-workspace (see useWorkspaceIO), not per-library. */
export function useDefinitionSync(
  config: AppConfig | null,
  setConfig: (next: AppConfig) => void,
) {
  const definitions = useStore((s) => s.definitions);
  const groups = useStore((s) => s.groups);
  const setLibrary = useStore((s) => s.setLibrary);
  const lib = useMemo(() => makeLibraryActions(setLibrary), [setLibrary]);
  const confirm = useConfirm();
  const { t } = useTranslation();

  // Reset the library back to the bundled presets (the fresh-install state).
  // Buttons keep the keys they already have — only the (now-dangling) link to a
  // definition is dropped, exactly as when a single definition is deleted.
  // The actual seed-and-relink, without the confirm. Shared by the definitions
  // page's own "初期化" and the settings "reset everything" (which resets
  // profiles too and confirms once, up front).
  const resetAllCore = async () => {
    const seeded = await resetDefinitions();
    // Unlink every button that referenced an old definition, keeping its last
    // cached keys so it still works.
    if (config) {
      const ids = new Set(definitions.map((d) => d.id));
      const cv = unlinkAssignments(config, ids);
      if (cv) setConfig(cv);
    }
    lib.replaceAll(seeded.groups, seeded.definitions);
  };

  const resetAll = async () => {
    if (
      !(await confirmReset(confirm, t, {
        title: "操作の初期化",
        message:
          "操作を初期状態（プリセット）に戻しますか？ボタンに割り当て済みの動作はそのまま残り、操作とのリンクだけ解除されます。",
        okLabel: "初期化",
      }))
    )
      return;
    await resetAllCore();
  };

  const sync = (defId: string, map: (a: ButtonAssignment) => ButtonAssignment) => {
    if (!config) return;
    const next = mapLinkedAssignments(config, defId, map);
    if (next) setConfig(next);
  };

  /** Re-cache every button assignment linked to `d` (id) with `d`'s current
   * press. Returns the possibly-updated config. */
  const recacheAssignments = (cfg: AppConfig, d: Definition | undefined): AppConfig => {
    if (!d) return cfg;
    const next = mapLinkedAssignments(cfg, d.id, (a) => ({
      ...a,
      press: linkedPress(d),
    }));
    return next ?? cfg;
  };

  const updatePress = (id: string, press: PressConfig) => {
    const edited = definitions.map((d) => (d.id === id ? { ...d, press } : d));
    lib.replaceAll(groups, edited);
    if (!config) return;
    // Re-cache every button assignment linked to the edited definition. Pie
    // directions and def-references inside inputs are resolved live at runtime,
    // so they need no cascade here.
    const cfg = recacheAssignments(config, edited.find((d) => d.id === id));
    if (cfg !== config) setConfig(cfg);
  };
  const rename = (id: string, name: string) => {
    lib.rename(id, name);
    sync(id, (a) => ({
      ...a,
      press: { ...a.press, label: name || undefined } as PressConfig,
    }));
  };
  const remove = (id: string) => {
    // No confirm dialog for a single operation — Undo is the safety net.
    const target = definitions.find((d) => d.id === id);
    const targetIndex = definitions.findIndex((d) => d.id === id);
    // Capture exactly which buttons link to this def, so Undo can re-link just
    // those (in the latest config) rather than restoring a stale whole-config
    // snapshot — which would wipe any edits made while the toast was up.
    const linkedLocs = new Set<string>();
    if (config) {
      for (const [pn, p] of Object.entries(config))
        for (const [ln, l] of Object.entries(p.layers))
          for (const [btn, a] of Object.entries(l.buttons))
            if (a.def === id) linkedLocs.add(assignmentKey(pn, ln, btn));
    }
    lib.replaceAll(groups, definitions.filter((d) => d.id !== id));
    if (config) {
      // Drop the link but keep the last cached keys so buttons still work.
      const cv = mapLinkedAssignments(config, id, (a) => ({ ...a, def: undefined }));
      if (cv) setConfig(cv);
    }
    toast.undo(
      t("「{{name}}」を削除しました", { name: target?.name || t("(名前なし)") }),
      t("元に戻す"),
      () => {
        if (!target) return;
        // Restore into the LATEST state (surgical), so intervening edits survive.
        const st = useStore.getState();
        if (!st.definitions.some((d) => d.id === id)) {
          const defs = st.definitions.slice();
          const at = targetIndex < 0 ? defs.length : Math.min(targetIndex, defs.length);
          defs.splice(at, 0, target);
          st.setLibrary(st.groups, defs);
        }
        const cfg = useStore.getState().profiles;
        if (cfg) {
          const relinked = relinkAssignments(cfg, linkedLocs, id, linkedPress(target));
          if (relinked) setConfig(relinked);
        }
      },
    );
  };
  // Delete an (empty) folder with an Undo toast instead of a confirm. The
  // with-contents path (removeGroupWithDefs) keeps its confirm — that's chained
  // destruction. Snapshot restores the folder and any definition group-links.
  const removeGroup = (id: string) => {
    const target = groups.find((g) => g.id === id);
    const prevGroups = groups;
    const prevDefs = definitions;
    lib.removeGroup(id);
    toast.undo(
      t("フォルダ「{{name}}」を削除しました", {
        name: target?.name || t("(名前なし)"),
      }),
      t("元に戻す"),
      () => lib.replaceAll(prevGroups, prevDefs),
    );
  };
  const removeGroupWithDefs = (id: string) => {
    // Delete the group + its definitions atomically.
    const ids = new Set(
      definitions.filter((d) => d.group === id).map((d) => d.id),
    );
    const nextGroups = groups.filter((gr) => gr.id !== id);
    const remaining = definitions.filter((d) => d.group !== id);
    lib.replaceAll(nextGroups, remaining);

    if (config && ids.size) {
      const cv = unlinkAssignments(config, ids);
      if (cv) setConfig(cv);
    }
  };

  return {
    definitions,
    groups,
    get: lib.get,
    create: lib.create,
    duplicate: lib.duplicate,
    reorder: lib.reorder,
    setGroup: lib.setGroup,
    setIcon: lib.setIcon,
    setIconColor: lib.setIconColor,
    addGroup: lib.addGroup,
    renameGroup: lib.renameGroup,
    removeGroup,
    removeGroupWithDefs,
    reorderGroups: lib.reorderGroups,
    resetAll,
    resetAllCore,
    updatePress,
    rename,
    remove,
  };
}
