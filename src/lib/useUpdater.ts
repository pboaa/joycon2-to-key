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
import { flush, useStore } from "../store";

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
  /** Manual "check now" (from the UI). Re-checks regardless of a prior result
   * and returns the outcome so the caller can give feedback. */
  checkNow: () => Promise<"available" | "uptodate" | "error" | "busy">;
  openModal: () => void;
  closeModal: () => void;
  /** Download + install the pending update, then relaunch. */
  install: () => Promise<void>;
}

/** True only inside the packaged desktop app. In `vite dev` / tests there's no
 * Tauri IPC, and the updater endpoint is a real GitHub URL — skip entirely.
 * Exported so the UI can hide the "check for updates" button where it can't run. */
export function canCheckUpdate(): boolean {
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
    if (!canCheckUpdate()) return;
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

  checkNow: async () => {
    if (!canCheckUpdate()) return "uptodate";
    const cur = get().phase;
    // Don't interrupt an in-flight check or an install already under way.
    if (cur === "checking" || cur === "downloading" || cur === "installed") return "busy";
    set({ phase: "checking", error: null });
    try {
      const update = await check();
      if (update) {
        set({
          phase: "available",
          update,
          version: update.version,
          notes: update.body?.trim() || null,
        });
        return "available";
      }
      set({ phase: "uptodate" });
      return "uptodate";
    } catch (e) {
      // A manual check failing isn't a pending update — settle on uptodate so no
      // badge lingers, and report the error to the caller for a toast.
      console.warn("[updater] manual check failed:", e);
      set({ phase: "uptodate" });
      return "error";
    }
  },

  openModal: () => set({ modalOpen: true }),
  closeModal: () => set({ modalOpen: false }),

  install: async () => {
    const update = get().update;
    if (!update) return;
    set({ phase: "downloading", progress: null, error: null });
    // Flush any debounced edits before the installer takes over — on Windows
    // the install/relaunch terminates this process, which would drop a save
    // still sitting in the 400ms window.
    try {
      if (useStore.getState().loaded) await flush();
    } catch {
      // best-effort; updating must not be blocked by a failed save
    }
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
    } catch (e) {
      // Only download/install failures are real failures the user should retry.
      console.error("[updater] install failed:", e);
      set({ phase: "error", error: String(e) });
      return;
    }
    set({ phase: "installed" });
    // The install applied. Relaunch to boot the new version; if relaunch itself
    // throws (it can on Windows), the update still took — don't show a failure,
    // it'll simply come up new on the next manual start.
    try {
      await relaunch();
    } catch (e) {
      console.error("[updater] relaunch after install failed (update applied):", e);
    }
  },
}));

/** True when there's a fresh update the user hasn't installed yet (drives the
 * nav badge + InfoPage banner). Downloading/installed count so the badge doesn't
 * flicker; `error` counts too so a failed install stays reachable for a retry
 * (otherwise closing the modal would strand the pending update until restart). */
export function hasPendingUpdate(s: UpdaterState): boolean {
  return (
    s.phase === "available" ||
    s.phase === "downloading" ||
    s.phase === "installed" ||
    s.phase === "error"
  );
}
