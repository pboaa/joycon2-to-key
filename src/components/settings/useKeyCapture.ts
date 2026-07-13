import { useEffect } from "react";
import { captureKey } from "../../lib/keyCatalog";

const MODIFIERS = ["Ctrl", "Shift", "Alt", "Win"];

/** Physical-key capture for {@link KeyPicker}: while `capturing`, swallow the
 * keydown and either emit a full shortcut (held modifiers + main key, via
 * `onCapture`) or a single key (`onSelect`); Escape cancels capture, and a plain
 * Escape while not capturing closes the picker. Extracted from the render so the
 * listener wiring is separate from the on-screen key catalog. */
export function useKeyCapture({
  capturing,
  setCapturing,
  onCapture,
  onSelect,
  onClose,
}: {
  capturing: boolean;
  setCapturing: (v: boolean) => void;
  onCapture?: (keys: string[]) => void;
  onSelect: (key: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (capturing) {
        e.preventDefault();
        e.stopPropagation();
        if (e.code === "Escape") {
          setCapturing(false);
          return;
        }
        const k = captureKey(e.code);
        if (!k) return;
        if (onCapture) {
          // Shortcut capture: ignore lone modifier presses and wait for the main
          // key, then emit held modifiers + that key (Ctrl+Shift+A).
          if (MODIFIERS.includes(k)) return;
          const mods: string[] = [];
          if (e.ctrlKey) mods.push("Ctrl");
          if (e.shiftKey) mods.push("Shift");
          if (e.altKey) mods.push("Alt");
          if (e.metaKey) mods.push("Win");
          onCapture([...mods, k]);
        } else {
          onSelect(k);
        }
      } else if (e.code === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [capturing, onSelect, onClose, onCapture]);
}
