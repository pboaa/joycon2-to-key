// In-app update flow (never forced). On startup we silently ask GitHub Releases
// whether a newer signed build exists; if so, a badge appears and the user can
// open a modal to read the notes and choose to update. "Update" downloads and
// installs the signed installer, then relaunches.
//
// State machine:
//   idle → checking → (uptodate | available) ── install ──▶ downloading → installed → (relaunch)
//                                            └────────────────────────────────────▶ error
import { create } from "zustand";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export type UpdaterPhase =
  | "idle"
  | "checking"
  | "uptodate"
  | "available"
  | "downloading"
  | "installed"
  | "error";

interface UpdaterState {
  phase: UpdaterPhase;
  /** The pending update handle (only in `available`/`downloading`/`installed`). */
  update: Update | null;
  /** New version string, e.g. "0.1.1" (once an update is available). */
  version: string | null;
  /** Author-written release notes for the new version (from the release body). */
  notes: string | null;
  /** Download progress 0..1 while downloading; null when unknown length. */
  progress: number | null;
  error: string | null;
  /** Whether the update details modal is open. */
  modalOpen: boolean;

  /** Silent startup check. No-op in dev or when already checked/updating. */
  checkOnStartup: () => Promise<void>;
  openModal: () => void;
  closeModal: () => void;
  /** Download + install the pending update, then relaunch. */
  install: () => Promise<void>;
}

/** True only inside the packaged desktop app. In `vite dev` / tests there's no
 * Tauri IPC, and the updater endpoint is a real GitHub URL — skip entirely. */
function canCheck(): boolean {
  return !import.meta.env.DEV && typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export const useUpdater = create<UpdaterState>((set, get) => ({
  phase: "idle",
  update: null,
  version: null,
  notes: null,
  progress: null,
  error: null,
  modalOpen: false,

  checkOnStartup: async () => {
    if (!canCheck()) return;
    if (get().phase !== "idle") return; // already checked / in flight
    set({ phase: "checking" });
    try {
      const update = await check();
      if (update) {
        set({
          phase: "available",
          update,
          version: update.version,
          notes: update.body?.trim() || null,
        });
      } else {
        set({ phase: "uptodate" });
      }
    } catch (e) {
      // Offline / rate-limited / no release yet: stay quiet, just log.
      console.warn("[updater] check failed:", e);
      set({ phase: "uptodate" });
    }
  },

  openModal: () => set({ modalOpen: true }),
  closeModal: () => set({ modalOpen: false }),

  install: async () => {
    const update = get().update;
    if (!update) return;
    set({ phase: "downloading", progress: null, error: null });
    try {
      let total = 0;
      let downloaded = 0;
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            total = event.data.contentLength ?? 0;
            downloaded = 0;
            set({ progress: total > 0 ? 0 : null });
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            set({ progress: total > 0 ? Math.min(1, downloaded / total) : null });
            break;
          case "Finished":
            set({ progress: 1 });
            break;
        }
      });
      set({ phase: "installed" });
      // On Windows/NSIS the installer runs on exit; relaunch brings the new
      // version back up. If relaunch throws, the install still applied.
      await relaunch();
    } catch (e) {
      console.error("[updater] install failed:", e);
      set({ phase: "error", error: String(e) });
    }
  },
}));

/** True when there's a fresh update the user hasn't installed yet (drives the
 * nav badge). Downloading/installed count too so the badge doesn't flicker. */
export function hasPendingUpdate(s: UpdaterState): boolean {
  return s.phase === "available" || s.phase === "downloading" || s.phase === "installed";
}
