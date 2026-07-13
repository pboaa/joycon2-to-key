import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconKeyboard } from "@tabler/icons-react";
import { DEFAULT_GLOBAL_SETTINGS, type InputCommand } from "../../lib/types";
import { captureKey } from "../../lib/keyCatalog";
import { ModalShell } from "../ui/ModalShell";

const MODIFIERS = ["Ctrl", "Shift", "Alt", "Win"];

/**
 * A small "press what you want" capture dialog — everything except special keys
 * lives here. Press a key or shortcut (with the held modifiers shown live), or
 * click a mouse / scroll button. Emits the replacement input list. The full
 * on-screen keyboard (special keys / search) stays behind the ⌨ picker.
 */
export function KeyCaptureModal({
  onResult,
  onClose,
  single = false,
}: {
  /** The captured input(s) that replace the field's current value. */
  onResult: (inputs: InputCommand[]) => void;
  onClose: () => void;
  /** Capture exactly one key (including a lone modifier), for editing a single
   * input in the list. Default captures a whole shortcut (Ctrl+Shift+A → 3). */
  single?: boolean;
}) {
  const { t } = useTranslation();
  // Live modifier state, mirrored from the physical keyboard while open.
  const [held, setHeld] = useState({
    ctrl: false,
    shift: false,
    alt: false,
    win: false,
  });

  // Capture keys on window (capture phase) so it works without focusing anything.
  useEffect(() => {
    const sync = (e: KeyboardEvent) =>
      setHeld({ ctrl: e.ctrlKey, shift: e.shiftKey, alt: e.altKey, win: e.metaKey });
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        onClose();
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      sync(e);
      const k = captureKey(e.code);
      if (!k) return;
      if (single) {
        // One key only — a lone modifier is a valid single input (e.g. hold Ctrl).
        onResult([{ type: "keyboard", value: k }]);
        return;
      }
      if (MODIFIERS.includes(k)) return; // wait for a non-modifier key
      const keys: string[] = [];
      if (e.ctrlKey) keys.push("Ctrl");
      if (e.shiftKey) keys.push("Shift");
      if (e.altKey) keys.push("Alt");
      if (e.metaKey) keys.push("Win");
      keys.push(k);
      onResult(keys.map((value) => ({ type: "keyboard", value })));
    };
    const onUp = (e: KeyboardEvent) => sync(e);
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("keyup", onUp, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("keyup", onUp, true);
    };
  }, [onResult, onClose, single]);

  const chip = (on: boolean, label: string) => (
    <span
      className={
        "px-2 py-0.5 rounded-row text-caption font-mono border transition-colors " +
        (on ? "bg-accent text-white border-accent" : "border-border text-text3")
      }
    >
      {label}
    </span>
  );

  return (
    <ModalShell
      title="入力を受付"
      onClose={onClose}
      width="w-[380px]"
      closeOnEscape={false}
    >
      <div className="p-2">
        {/* Press a key / shortcut (held modifiers shown live), or click / scroll
            here for a mouse button / scroll. */}
        <div
          onMouseDown={(e) => {
            // Right button is handled in onContextMenu so the browser menu is
            // suppressed in the same event (closing here would unmount us first).
            if (e.button === 2) return;
            e.preventDefault();
            const value = e.button === 1 ? "middle" : "left";
            onResult([{ type: "mouseButton", value }]);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            onResult([{ type: "mouseButton", value: "right" }]);
          }}
          onWheel={(e) =>
            onResult([
              {
                type: "scroll",
                value: e.deltaY < 0 ? "up" : "down",
                amount: DEFAULT_GLOBAL_SETTINGS.scrollAmount,
              },
            ])
          }
          className="rounded-card border-2 border-dashed border-accent/60 bg-bg px-4 py-6 flex flex-col items-center gap-2 text-center select-none cursor-pointer"
        >
          <IconKeyboard size={22} className="text-accent" aria-hidden />
          <div className="text-label font-medium text-text">
            {t("キーを押してください")}
          </div>
          {single ? (
            <div className="text-caption text-text3">
              {t("修飾キー単体も設定できます")}
            </div>
          ) : (
            <div className="flex gap-1">
              {chip(held.ctrl, "Ctrl")}
              {chip(held.shift, "Shift")}
              {chip(held.alt, "Alt")}
              {chip(held.win, "Win")}
            </div>
          )}
          <div className="text-caption text-text3">
            {t("クリック・スクロールでも設定できます")}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
