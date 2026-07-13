// Toast foundation for action feedback. Separate from the confirm dialog
// (Confirm): it briefly reports "what just happened", adding an "undo" to
// destructive actions.
//
// So it can be fired from outside React (hooks / actions / non-React code), it's
// an independent, lightweight zustand store (separate from the main useStore).
// ToastHost subscribes and renders; callers just invoke `toast.*` below. i18n is
// the caller's responsibility (this only receives already-translated strings),
// the same convention as confirms.ts.
import { create } from "zustand";

export type ToastKind = "info" | "success" | "error";

/** Optional inline action (e.g. Undo). Clicking runs `onClick`, then the host
 * dismisses the toast. */
export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
  action?: ToastAction;
  /** Auto-dismiss delay in ms (paused while hovered). */
  duration: number;
}

interface ToastStore {
  toasts: ToastItem[];
  dismiss: (id: number) => void;
  /** Internal: append a toast (capped), returns its id. Use `toast.*` instead. */
  _push: (t: Omit<ToastItem, "id">) => number;
}

/** At most this many toasts stack at once; older ones drop off the top. */
const MAX_TOASTS = 3;
const DEFAULT_DURATION = 4000;
const LONG_DURATION = 6000; // errors + undo prompts stay a bit longer

let seq = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
  _push: (t) => {
    const id = ++seq;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }].slice(-MAX_TOASTS) }));
    return id;
  },
}));

interface ToastOpts {
  action?: ToastAction;
  /** Override the auto-dismiss delay (ms). */
  duration?: number;
}

function push(message: string, kind: ToastKind, opts: ToastOpts): number {
  return useToastStore.getState()._push({
    message,
    kind,
    action: opts.action,
    duration: opts.duration ?? (kind === "error" ? LONG_DURATION : DEFAULT_DURATION),
  });
}

/** Fire-and-forget toast API, callable from anywhere. Pass already-translated
 * strings (the caller holds `t`). */
export const toast = {
  info: (message: string, opts: ToastOpts = {}) => push(message, "info", opts),
  success: (message: string, opts: ToastOpts = {}) =>
    push(message, "success", opts),
  error: (message: string, opts: ToastOpts = {}) => push(message, "error", opts),
  /** Destructive-action feedback with an Undo affordance. `actionLabel` is the
   * (translated) button text, `onUndo` reverses the action. */
  undo: (message: string, actionLabel: string, onUndo: () => void): number =>
    push(message, "info", {
      action: { label: actionLabel, onClick: onUndo },
      duration: LONG_DURATION,
    }),
  dismiss: (id: number) => useToastStore.getState().dismiss(id),
};
