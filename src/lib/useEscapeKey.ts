import { useEffect, useRef } from "react";

// One shared stack so nested overlays (a create dialog over a manager, the
// definition picker over the definitions modal) close top-first: each Escape
// press fires only the most recently mounted handler.
const stack: Array<() => void> = [];
let installed = false;

function onKeyDown(e: KeyboardEvent) {
  if (e.key !== "Escape" || stack.length === 0) return;
  e.preventDefault();
  stack[stack.length - 1]();
}

/** Close-on-Escape for overlays. Stack-aware: only the topmost mounted
 * consumer receives the key, so nested modals unwind one per press. */
export function useEscapeKey(onEscape: () => void, enabled = true) {
  const ref = useRef(onEscape);
  ref.current = onEscape;
  useEffect(() => {
    if (!enabled) return;
    const handler = () => ref.current();
    stack.push(handler);
    if (!installed) {
      window.addEventListener("keydown", onKeyDown);
      installed = true;
    }
    return () => {
      const i = stack.indexOf(handler);
      if (i >= 0) stack.splice(i, 1);
    };
  }, [enabled]);
}
