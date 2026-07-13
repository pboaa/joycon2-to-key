import { useEffect, useRef, useState } from "react";
import type { DragEvent, PointerEvent as ReactPointerEvent } from "react";

/** Shared flag: true while a hold-to-reorder has picked up a row. useDragScroll
 * reads it and yields (so the same gesture reorders instead of scrolling). */
export const reorderState = { active: false };

/**
 * Whole-row press-and-hold to pick up a row for dragging (a quick drag scrolls
 * instead, via useDragScroll which yields while {@link reorderState}.active).
 * Spread the returned handlers on the row element and use `held` for the lift
 * cue; keep the row's `draggable` = `held`. `handle` is `dnd.handleProps(i)`.
 */
export function useHoldReorder(
  handle: { onDragStart: (e: DragEvent) => void; onDragEnd: () => void },
  onHandleDragStart?: (e: DragEvent) => void,
) {
  const [held, setHeld] = useState(false);
  const heldRef = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const detach = useRef<(() => void) | undefined>(undefined);

  const clearHold = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = undefined;
    detach.current?.();
    detach.current = undefined;
  };
  const reset = () => {
    heldRef.current = false;
    setHeld(false);
    reorderState.active = false;
  };
  useEffect(
    () => () => {
      clearHold();
      if (heldRef.current) reorderState.active = false;
    },
    [],
  );

  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.button !== 0 || e.pointerType === "touch") return;
    const el = e.target as HTMLElement;
    // The grip is instant; text controls keep their native drag/selection.
    if (el.closest("[data-reorder-grip], input, select, textarea, [contenteditable]"))
      return;
    const sx = e.clientX;
    const sy = e.clientY;
    const onMove = (me: PointerEvent) => {
      if (heldRef.current) return; // picked up → let the native drag run
      if (Math.abs(me.clientX - sx) > 6 || Math.abs(me.clientY - sy) > 6) clearHold();
    };
    const onUp = () => {
      clearHold();
      reset();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    detach.current = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    timer.current = window.setTimeout(() => {
      heldRef.current = true;
      setHeld(true);
      reorderState.active = true; // useDragScroll yields this gesture
    }, 180);
  };
  const onDragStart = (e: DragEvent) => {
    handle.onDragStart(e);
    onHandleDragStart?.(e);
  };
  const onDragEnd = () => {
    handle.onDragEnd();
    clearHold();
    reset();
  };
  return { held, onPointerDown, onDragStart, onDragEnd };
}

/**
 * Install once (in App). While any HTML5 drag is active, this keeps the whole
 * window a valid drop target so the cursor never flickers to "no-drop" (✕) —
 * over row gaps, scrollbars, ancestor scroll padding, or anywhere outside a row.
 *
 * It must be a permanent listener, not one added when a drag starts: during a
 * native drag the browser runs a nested event loop, so React effects scheduled
 * from within the drag don't run until it ends — a per-drag listener would be
 * installed too late and the ✕ would show for the whole drag.
 */
export function useReorderDropTarget() {
  useEffect(() => {
    const allow = (e: Event) => e.preventDefault();
    document.addEventListener("dragenter", allow);
    document.addEventListener("dragover", allow);
    return () => {
      document.removeEventListener("dragenter", allow);
      document.removeEventListener("dragover", allow);
    };
  }, []);
}

/**
 * Shared HTML5 drag-and-drop reordering for vertical lists (profiles, layers,
 * input commands…). Spread `handleProps(i)` on a drag grip and `rowProps(i)` on
 * the drop target; use `showBefore`/`showAfter`/`isDragging` for the drop line +
 * dimming. Pair with {@link useReorderDropTarget} at the app root.
 */
export interface DragReorder {
  handleProps: (i: number) => {
    draggable: boolean;
    onDragStart: (e: DragEvent) => void;
    onDragEnd: () => void;
  };
  rowProps: (i: number) => {
    onDragOver: (e: DragEvent) => void;
    onDrop: (e: DragEvent) => void;
  };
  /** Spread on the list container so the gaps between rows still accept the
   * drop — otherwise the cursor flickers to "no-drop" (✕) at item boundaries. */
  containerProps: {
    onDragOver: (e: DragEvent) => void;
    onDrop: (e: DragEvent) => void;
  };
  /** Show the drop line above item i. */
  showBefore: (i: number) => boolean;
  /** Show the drop line below item i. */
  showAfter: (i: number) => boolean;
  /** Item i is the one being dragged (dim it). */
  isDragging: (i: number) => boolean;
}

export function useDragReorder(
  onReorder: (from: number, to: number) => void,
): DragReorder {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  // Insertion point (0..n): the item would drop between rows dropIdx-1 and dropIdx.
  const [dropIdx, setDropIdx] = useState<number | null>(null);

  // Insertion index for a pointer over row i, chosen by the row's vertical
  // midpoint. Keying off the midpoint (not the row's edge) adds hysteresis: on
  // the gap between two rows both rows resolve to the same insertion point, so
  // the drop line no longer flickers at item boundaries.
  const insertionFor = (i: number, e: DragEvent): number => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const pastMiddle = e.clientY - rect.top > rect.height / 2;
    return pastMiddle ? i + 1 : i;
  };

  return {
    handleProps: (i) => ({
      draggable: true,
      onDragStart: (e) => {
        setDragIdx(i);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(i));
      },
      onDragEnd: () => {
        setDragIdx(null);
        setDropIdx(null);
      },
    }),
    rowProps: (i) => ({
      onDragOver: (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDropIdx(insertionFor(i, e));
      },
      onDrop: (e) => {
        e.preventDefault();
        e.stopPropagation(); // don't also fire the container's onDrop
        if (dragIdx !== null) {
          const di = insertionFor(i, e);
          // `di` counts slots in the original list; drop `to` is the index in
          // the list after the dragged item is removed.
          const to = dragIdx < di ? di - 1 : di;
          if (to !== dragIdx) onReorder(dragIdx, to);
        }
        setDragIdx(null);
        setDropIdx(null);
      },
    }),
    containerProps: {
      // Keep the whole list a valid drop target (incl. the gaps between rows)
      // so the cursor stays "move" instead of flickering to "no-drop".
      onDragOver: (e) => {
        if (dragIdx === null) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      },
      onDrop: (e) => {
        // Only reached when the drop lands in a gap (rows stop propagation).
        e.preventDefault();
        if (dragIdx !== null && dropIdx !== null) {
          const to = dragIdx < dropIdx ? dropIdx - 1 : dropIdx;
          if (to !== dragIdx) onReorder(dragIdx, to);
        }
        setDragIdx(null);
        setDropIdx(null);
      },
    },
    // Exactly one side lights per gap (never both): the before-line when moving
    // up into a gap, or the previous row's after-line when moving down into it.
    // Positions adjacent to the dragged item are no-ops, so they stay dark.
    showBefore: (i) => dragIdx !== null && dropIdx === i && i < dragIdx,
    showAfter: (i) => dragIdx !== null && dropIdx === i + 1 && i > dragIdx,
    isDragging: (i) => dragIdx === i,
  };
}
