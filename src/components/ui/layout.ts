// Shared layout widths, so the app's columns line up from one definition.
//
// NOTE: keep the literal Tailwind classes here (not composed at runtime) so the
// JIT still sees `w-[176px]` etc. and generates them.
//
// Both main 3-column pages (key-assignment, saved-operations) share the split:
//   RAIL_W (left) | MID_COL_W (figure / list) | editor (flex-1, fills the rest).

/** Left rail width — the profile/layer/folder side lists all share this. */
export const RAIL_W = "w-[176px]";

/** Settings modal's left tab rail — a touch narrower than the list rails since
 * it only holds short tab labels. */
export const SETTINGS_RAIL_W = "w-[150px]";

/** Middle column width (the Joy-Con figure / the operation list). Fixed so the
 * two pages line up and the figure stays put when switching edit ⇄ stats. */
export const MID_COL_W = "w-[215px]";

/** Full class for the right-hand editor panel (button editor / stats): a
 * full-height flush column that fills the remaining width, with a left border —
 * same feel as the saved-operations editor, not a floating card. Shared by the
 * editor and stats panels so nothing shifts when switching between them. */
export const SIDE_PANEL_CLS =
  "flex-1 min-w-0 min-h-0 flex flex-col border-l border-border bg-bg overflow-hidden";

/** The clickable label area of a selectable list row (icon + label). Shared by
 * every list (profiles / layers / operations) with {@link RowLabel} so rows
 * read the same: same padding, gap and click target. `py-2` matches the folder
 * rows' height so all the side lists feel equally roomy. */
export const LIST_ROW_BTN =
  "flex-1 min-w-0 text-left pr-1 py-2 inline-flex items-center gap-2";

/** Scrollable list-body padding, shared so rows sit the same distance from the
 * column edges across every list. `space-y-1` matches the folder list's gap. */
export const LIST_BODY_CLS = "overflow-y-auto px-2 py-1.5 space-y-1";

/** Padding for the right-hand editor column's scroll body, shared by the
 * key-assignment (EditorPopover) and saved-operations (DefinitionEditorPane)
 * editors so their framed card sits the same distance from the divider. */
export const EDITOR_BODY_PAD = "p-2";

/** The framed card wrapping a single editor's fields (button assignment /
 * saved operation), so both editors read identically — the header row lives
 * inside this frame in each. */
export const EDITOR_CARD_CLS =
  "border rounded-row p-1.5 space-y-1.5 border-border bg-bg";
