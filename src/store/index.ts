// Unified Zustand store. Centralizes app state (profiles / settings / definition
// library) plus UI selection and JoyCon state. Persistence subscribes to
// profile/settings/definition changes and, debounced by 400ms, writes
// workspace.json once (following the old workspaceStore behaviour).
import { create } from "zustand";
import {
  defaultProfiles,
  getConfigPath,
  loadWorkspace,
  resetDefinitions,
  saveWorkspace,
} from "../lib/tauri";
import type {
  ActiveLayer,
  AppConfig,
  BatteryInfo,
  ButtonAssignment,
  ConnectionState,
  Definition,
  DefinitionGroup,
  GlobalSettings,
  LayerConfig,
  PieMenu,
  WorkspaceFile,
} from "../lib/types";

/** A copied layer (its config + source name), pasteable into any profile.
 * Verbatim: pasted as-is, so hold-switch targets keep their names. */
export interface LayerClipboard {
  name: string;
  layer: LayerConfig;
}
import { DEFAULT_GLOBAL_SETTINGS } from "../lib/types";
import { sanitizeProfiles } from "../lib/config/sanitize";

/** On-disk workspace schema version. Reset to 1 for the public release (earlier
 * pre-1.0 migrations were dropped). The Rust side has its own const and
 * normalizes any file's version on load. */
export const WORKSPACE_VERSION = 1;
const DEBOUNCE_MS = 400;

/** Top-level page shown in the left-nav shell. */
export type AppPage =
  | "keys"
  | "profiles"
  | "defs"
  | "stats"
  | "settings"
  | "help"
  | "info";

export interface StoreState {
  // ── Page navigation (left nav) ──
  page: AppPage;
  /** Requested initial settings sub-tab (e.g. jumping from a pie's style panel
   * to Settings→Pie). Consumed when the settings page mounts. */
  settingsTab: string | null;
  /** Requested help section to scroll to when the help page mounts (set by a
   * page header's ? button). Consumed on mount. */
  helpSection: string | null;
  navigate: (
    page: AppPage,
    opts?: { settingsTab?: string | null; helpSection?: string | null },
  ) => void;

  // ── Persistent data ──
  profiles: AppConfig | null;
  configPath: string;
  loaded: boolean;
  saving: boolean;
  saveError: string | null;
  settings: GlobalSettings;
  groups: DefinitionGroup[];
  definitions: Definition[];
  pieMenus: PieMenu[];

  // ── UI selection ──
  selectedProfile: string;
  selectedLayer: string;
  selectedButton: string | null;
  clipboard: ButtonAssignment | null;
  layerClipboard: LayerClipboard | null;

  // ── JoyCon ──
  connectionState: ConnectionState;
  currentApp: string;
  activeLayer: ActiveLayer | null;
  battery: BatteryInfo | null;
  joyConError: string | null;

  /** True while the guided tour is running (lets onboarding-only UI, e.g. the
   * connection guide, show regardless of its normal conditions). Not persisted. */
  tourActive: boolean;

  // ── Actions ──
  hydrate: (ws: WorkspaceFile, path: string) => void;
  setProfiles: (next: AppConfig) => void;
  setSettings: (next: GlobalSettings) => void;
  setLibrary: (groups: DefinitionGroup[], definitions: Definition[]) => void;
  setPieMenus: (next: PieMenu[]) => void;
  saveNow: () => Promise<void>;
  resetProfilesToDefault: () => Promise<AppConfig>;
  /** Fresh-install reset: profiles, the operation library, AND settings all go
   * back to the bundled defaults in one atomic write — except the display /
   * locale prefs (language, theme, UI scale), which are kept so the UI doesn't
   * jarringly change on reset. (Doesn't touch usage stats — those live in the
   * Rust runtime; the caller resets them separately.) */
  resetAllToDefault: () => Promise<AppConfig>;

  setSelectedProfile: (n: string) => void;
  setSelectedLayer: (n: string) => void;
  setSelectedButton: (n: string | null) => void;
  setClipboard: (v: ButtonAssignment | null) => void;
  setLayerClipboard: (v: LayerClipboard | null) => void;

  setConnectionState: (cs: ConnectionState) => void;
  setCurrentApp: (app: string) => void;
  setActiveLayer: (al: ActiveLayer | null) => void;
  setBattery: (b: BatteryInfo | null) => void;
  setJoyConError: (e: string | null) => void;
  setTourActive: (v: boolean) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  page: "keys",
  settingsTab: null,
  helpSection: null,
  navigate: (page, opts) =>
    set({
      page,
      settingsTab: opts?.settingsTab ?? null,
      helpSection: opts?.helpSection ?? null,
    }),

  profiles: null,
  configPath: "",
  loaded: false,
  saving: false,
  saveError: null,
  settings: DEFAULT_GLOBAL_SETTINGS,
  groups: [],
  definitions: [],
  pieMenus: [],

  selectedProfile: "デフォルト",
  selectedLayer: "",
  selectedButton: null,
  clipboard: null,
  layerClipboard: null,

  connectionState: "disconnected",
  currentApp: "unknown",
  activeLayer: null,
  battery: null,
  joyConError: null,
  tourActive: false,

  hydrate: (ws, path) =>
    set({
      profiles: ws.profiles ?? {},
      // Merge over defaults so settings saved before a new field existed still
      // get that field's default (e.g. connectVibration), instead of undefined.
      settings: { ...DEFAULT_GLOBAL_SETTINGS, ...ws.settings },
      groups: ws.definitions?.groups ?? [],
      definitions: ws.definitions?.definitions ?? [],
      pieMenus: ws.pieMenus ?? [],
      configPath: path,
      loaded: true,
    }),

  setProfiles: (next) => set({ profiles: next }),
  setSettings: (next) => set({ settings: next }),
  setLibrary: (groups, definitions) => set({ groups, definitions }),
  setPieMenus: (next) => set({ pieMenus: next }),

  saveNow: async () => {
    set({ saving: true, saveError: null });
    try {
      await flush();
    } catch (e) {
      set({ saveError: String(e) });
    } finally {
      set({ saving: false });
    }
  },

  resetProfilesToDefault: async () => {
    set({ saving: true, saveError: null });
    try {
      const profiles = await defaultProfiles();
      set({ profiles });
      await flush();
      return profiles;
    } catch (e) {
      set({ saveError: String(e) });
      return get().profiles ?? {};
    } finally {
      set({ saving: false });
    }
  },

  resetAllToDefault: async () => {
    set({ saving: true, saveError: null });
    try {
      // Reset profiles + the operation library together and write ONCE. Doing
      // these as two separate steps (reset profiles, then reset defs via a
      // stale-closure setConfig) let the second clobber the first — the reset
      // then appeared to "not take" until repeated. One atomic set avoids that.
      const [profiles, seeded] = await Promise.all([
        defaultProfiles(),
        resetDefinitions(),
      ]);
      const prev = get().settings;
      set({
        profiles,
        groups: seeded.groups,
        definitions: seeded.definitions,
        // Reset settings too, but keep the display / locale prefs so the UI
        // doesn't jump to a different language, theme, or size on reset.
        settings: {
          ...DEFAULT_GLOBAL_SETTINGS,
          language: prev.language,
          theme: prev.theme,
          uiScale: prev.uiScale,
        },
      });
      await flush();
      return profiles;
    } catch (e) {
      set({ saveError: String(e) });
      return get().profiles ?? {};
    } finally {
      set({ saving: false });
    }
  },

  setSelectedProfile: (n) => set({ selectedProfile: n }),
  setSelectedLayer: (n) => set({ selectedLayer: n }),
  setSelectedButton: (n) => set({ selectedButton: n }),
  setClipboard: (v) => set({ clipboard: v }),
  setLayerClipboard: (v) => set({ layerClipboard: v }),

  setConnectionState: (cs) => set({ connectionState: cs }),
  setCurrentApp: (app) => set({ currentApp: app }),
  setActiveLayer: (al) => set({ activeLayer: al }),
  setBattery: (b) => set({ battery: b }),
  setJoyConError: (e) => set({ joyConError: e }),
  setTourActive: (v) => set({ tourActive: v }),
}));

// ─── Persistence (debounced save of profile/settings/definition changes) ─────────
let saveTimer: ReturnType<typeof setTimeout> | null = null;
// Guard so hydrate-triggered changes don't save (avoids a needless write-back right after load).
let suppressSave = false;

/** Save the current snapshot (profiles are sanitized on write). Returns the save path. */
export async function flush(): Promise<string> {
  if (saveTimer !== null) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  const s = useStore.getState();
  const out: WorkspaceFile = {
    version: WORKSPACE_VERSION,
    settings: s.settings,
    definitions: { version: 1, groups: s.groups, definitions: s.definitions },
    pieMenus: s.pieMenus,
    profiles: sanitizeProfiles(s.profiles ?? {}),
  };
  return saveWorkspace(out);
}

function scheduleSave() {
  if (!useStore.getState().loaded) return; // 初期ロード完了前は保存しない
  if (saveTimer !== null) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    // Surface debounced-save failures the same way saveNow() does — otherwise a
    // failed write (disk full, AV lock, APPDATA permission) is silently swallowed
    // and the user keeps editing believing changes persist.
    useStore.setState({ saving: true, saveError: null });
    flush()
      .catch((e) => useStore.setState({ saveError: String(e) }))
      .finally(() => useStore.setState({ saving: false }));
  }, DEBOUNCE_MS);
}

// Debounce-save when any of profiles / settings / definitions (groups/definitions) changes.
// Don't save on selection or JoyCon state changes.
let prev = {
  profiles: useStore.getState().profiles,
  settings: useStore.getState().settings,
  groups: useStore.getState().groups,
  definitions: useStore.getState().definitions,
  pieMenus: useStore.getState().pieMenus,
};
useStore.subscribe((s) => {
  const changed =
    s.profiles !== prev.profiles ||
    s.settings !== prev.settings ||
    s.groups !== prev.groups ||
    s.definitions !== prev.definitions ||
    s.pieMenus !== prev.pieMenus;
  if (!changed) return;
  prev = {
    profiles: s.profiles,
    settings: s.settings,
    groups: s.groups,
    definitions: s.definitions,
    pieMenus: s.pieMenus,
  };
  // Don't save on hydrate (initial load) changes; only save real edits afterward.
  if (suppressSave) return;
  scheduleSave();
});

/** Initial load: fetch workspace + path and hydrate the store. Call once in App. */
let bootstrapped = false;
export async function bootstrapStore(): Promise<void> {
  if (bootstrapped) return;
  bootstrapped = true;
  try {
    const [ws, path] = await Promise.all([
      loadWorkspace().catch(() => emptyWorkspace()),
      getConfigPath().catch(() => ""),
    ]);
    // Don't let subscribe fire a save during hydrate (set is synchronous, so bracket it).
    suppressSave = true;
    useStore.getState().hydrate(ws, path);
    suppressSave = false;
  } catch (e) {
    useStore.setState({ saveError: `load failed: ${String(e)}` });
  }
}

function emptyWorkspace(): WorkspaceFile {
  return {
    version: WORKSPACE_VERSION,
    settings: DEFAULT_GLOBAL_SETTINGS,
    definitions: { version: 1, groups: [], definitions: [] },
    pieMenus: [],
    profiles: {},
  };
}
