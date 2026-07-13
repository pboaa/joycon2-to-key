import { useEffect } from "react";
import { reorderState } from "./useDragReorder";

// Let scrollable areas be scrolled by "grab and drag" (phone-like).
// Text inputs and selects can also be used as a start point.
// Scrolling only kicks in past a threshold, so a click (tap) still works.
// textarea / contenteditable / [data-no-dragscroll] keep their native behaviour.
const THRESHOLD = 6;

/** Collect scrollable ancestors inner→outer (for the scroll chain). */
function scrollableChain(el: HTMLElement | null): HTMLElement[] {
  const list: HTMLElement[] = [];
  let node: HTMLElement | null = el;
  while (node && node !== document.body && node !== document.documentElement) {
    const s = getComputedStyle(node);
    const canY =
      (s.overflowY === "auto" || s.overflowY === "scroll") &&
      node.scrollHeight > node.clientHeight + 1;
    const canX =
      (s.overflowX === "auto" || s.overflowX === "scroll") &&
      node.scrollWidth > node.clientWidth + 1;
    if (canY || canX) list.push(node);
    node = node.parentElement;
  }
  return list;
}

/** The frontmost modal backdrop (if several = a nested modal, the topmost). null if none. */
function topBackdrop(): Element | null {
  const b = document.querySelectorAll("[data-modal-backdrop]");
  return b.length ? b[b.length - 1] : null;
}

/**
 * App-wide grab-to-scroll (mouse/pen). Install once (in App). Panning inside any
 * scrollable area scrolls it (overflow propagating to outer scrollers) and
 * swallows the trailing click; a plain click still works. Text inputs and
 * selects can also start a scroll: for inputs a drag drops focus/selection; for
 * selects the native open is suppressed on mousedown and re-opened on a plain
 * click via showPicker(). A control that already has focus is left fully native
 * so the user can drag to select its text. While a modal is open only its own
 * scrollers pan.
 */
export function useDragScroll(): void {
  useEffect(() => {
    // Without showPicker we can't re-open a select, so leave selects fully native.
    const canSelectDrag =
      typeof HTMLSelectElement !== "undefined" &&
      "showPicker" in HTMLSelectElement.prototype;
    const NO_DRAG = canSelectDrag
      ? "textarea,[contenteditable],[data-no-dragscroll]"
      : "textarea,select,[contenteditable],[data-no-dragscroll]";

    // Remember a form control the drag started on: on mousedown we suppress the
    // native focus / open (so it isn't briefly focused when a drag begins), and
    // on a plain press (not a drag) we restore focus / showPicker on click.
    // Number inputs (type=number) are excluded to keep their spinners, and only
    // blur on an actual drag.
    let armedControl: HTMLInputElement | HTMLSelectElement | null = null;

    const activate = (el: HTMLInputElement | HTMLSelectElement) => {
      el.focus();
      if (el instanceof HTMLSelectElement) {
        const fn = (el as unknown as { showPicker?: () => void }).showPicker;
        if (typeof fn === "function") {
          try {
            fn.call(el);
          } catch {
            // Throws outside a user gesture. It's already focused, so it opens via keyboard.
          }
        }
      }
    };

    // Suppress native focus / open when the gesture starts on a control.
    function onMouseDown(me: MouseEvent) {
      if (armedControl) me.preventDefault();
    }
    // A non-drag click restores the intended action here (focus / open the select).
    // A click after a drag is swallowed first by up()'s temporary suppressor (armedControl is already cleared).
    function onClick() {
      const el = armedControl;
      armedControl = null;
      if (el) activate(el);
    }

    function onDown(e: PointerEvent) {
      armedControl = null;
      if (e.button !== 0 || e.pointerType === "touch") return; // leave touch to the standard behaviour
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[draggable="true"]')) return; // a reorder grip takes priority
      if (target.closest(NO_DRAG)) return;
      // A drag inside an already-focused input/select prioritizes text drag-select
      // and cursor placement, so grab-scroll doesn't start (once focused you can
      // drag to select natively).
      const focusedCtrl = target.closest("input, select");
      if (focusedCtrl && focusedCtrl === document.activeElement) return;
      const scrollers = scrollableChain(target);
      if (scrollers.length === 0) return;
      // While a modal is open, only scroll inside it (within the frontmost
      // backdrop). Don't move what's behind, or the underside of a nested modal.
      const bd = topBackdrop();
      if (bd && !bd.contains(scrollers[0])) return;

      // Suppress focus/open on text inputs and selects (number inputs excluded to keep spinners).
      const ctrl = target.closest("input, select");
      if (ctrl instanceof HTMLSelectElement) armedControl = ctrl; // only reached when canSelectDrag
      else if (ctrl instanceof HTMLInputElement && ctrl.type !== "number")
        armedControl = ctrl;

      const startX = e.clientX;
      const startY = e.clientY;
      let lastX = e.clientX;
      let lastY = e.clientY;
      let dragging = false;

      function move(me: PointerEvent) {
        // A hold-to-reorder picked up a row on this gesture → let it drag,
        // don't scroll (and don't preventDefault, so the native drag can start).
        if (reorderState.active) return;
        if (!dragging) {
          if (
            Math.abs(me.clientX - startX) < THRESHOLD &&
            Math.abs(me.clientY - startY) < THRESHOLD
          )
            return;
          dragging = true;
          armedControl = null; // dragged, so don't focus/open on click
          document.body.classList.add("dragscroll-active");
          document.body.style.userSelect = "none";
          // Number inputs are still natively focused, so blur when the drag
          // begins to clear the text selection (text inputs/selects weren't
          // focused on mousedown).
          const ae = document.activeElement as HTMLElement | null;
          if (ae && ae.tagName === "INPUT") ae.blur();
          window.getSelection?.()?.removeAllRanges?.();
        }
        // Apply the delta since the previous frame from the innermost scroller
        // out, propagating the remainder the edges can't absorb to outer ones.
        let remY = lastY - me.clientY;
        let remX = lastX - me.clientX;
        lastY = me.clientY;
        lastX = me.clientX;
        for (const s of scrollers) {
          if (Math.abs(remY) >= 0.5) {
            const before = s.scrollTop;
            s.scrollTop = before + remY;
            remY -= s.scrollTop - before;
          }
          if (Math.abs(remX) >= 0.5) {
            const before = s.scrollLeft;
            s.scrollLeft = before + remX;
            remX -= s.scrollLeft - before;
          }
          if (Math.abs(remY) < 0.5 && Math.abs(remX) < 0.5) break;
        }
        me.preventDefault();
      }
      // End of gesture. Called on pointercancel as well as pointerup: when a
      // hold-to-reorder enters an HTML5 native drag, the browser sends this
      // pointer a pointercancel instead of pointerup. Without cleanup here the
      // move/up listeners linger and fire at the next release point, slipping
      // into grab-scroll (= releasing a reorder turns into a scroll).
      function finish() {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", finish, true);
        window.removeEventListener("pointercancel", finish, true);
        window.removeEventListener("dragstart", finish, true);
        if (!dragging) return;
        document.body.classList.remove("dragscroll-active");
        document.body.style.userSelect = "";
        // Invalidate the click right after a drag exactly once (avoid a stray click).
        const supp = (ce: Event) => {
          ce.stopPropagation();
          ce.preventDefault();
        };
        window.addEventListener("click", supp, true);
        setTimeout(() => window.removeEventListener("click", supp, true), 0);
      }
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", finish, true);
      window.addEventListener("pointercancel", finish, true);
      // Insurance to always clean up once a native drag (hold-to-reorder) starts.
      window.addEventListener("dragstart", finish, true);
    }

    // While a modal is open, suppress wheel scrolling behind it (outside the backdrop).
    function onWheel(e: WheelEvent) {
      const bd = topBackdrop();
      if (!bd) return;
      const inner = scrollableChain(e.target as HTMLElement)[0];
      if (!inner || !bd.contains(inner)) e.preventDefault();
    }

    window.addEventListener("pointerdown", onDown);
    window.addEventListener("mousedown", onMouseDown, true);
    window.addEventListener("click", onClick, true);
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("mousedown", onMouseDown, true);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("wheel", onWheel);
    };
  }, []);
}
