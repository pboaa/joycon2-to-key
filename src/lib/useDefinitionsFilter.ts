import { useEffect, useMemo, useState } from "react";
import type { Definition, DefinitionGroup } from "./types";
import { shortLabel } from "./variants";

/** Whether a definition belongs to a group filter value ("all" / "none" / id). */
export function defInGroup(d: Definition, filter: string): boolean {
  if (filter === "all") return true;
  if (filter === "none") return !d.group;
  return d.group === filter;
}

/** Search + group filter + selection state for the definitions library. Owns the
 * query / group / selection, derives the shown list, keeps the selection valid
 * when the library changes, and reports the current view to the caller. Extracted
 * from `DefinitionsPage` so the modal is layout + actions over this state. */
export function useDefinitionsFilter({
  definitions,
  groups,
  initialSelectedId,
  initialGroupFilter,
  onViewChange,
}: {
  definitions: Definition[];
  groups: DefinitionGroup[];
  initialSelectedId?: string;
  initialGroupFilter?: string;
  onViewChange?: (view: { groupFilter: string; selectedId: string | null }) => void;
}) {
  const [query, setQuery] = useState("");
  // Default the view to the top group (not "all"); when opened on a specific
  // definition, show that definition's group instead.
  const firstGroup = groups[0]?.id ?? "all";
  const groupExists = (g: string) =>
    g === "all" || g === "none" || groups.some((x) => x.id === g);
  // Initial group: restore last-viewed, else the opened definition's group,
  // else the top group.
  const openedDef = initialSelectedId
    ? definitions.find((x) => x.id === initialSelectedId)
    : undefined;
  const initialGroup =
    initialGroupFilter && groupExists(initialGroupFilter)
      ? initialGroupFilter
      : openedDef
        ? (openedDef.group ?? "none")
        : firstGroup;
  const [groupFilter, setGroupFilter] = useState<string>(initialGroup);
  // Default to no selection (empty editor) unless opened on a specific operation
  // (e.g. jumping from a linked button).
  const [selectedId, setSelectedId] = useState<string | null>(
    () => initialSelectedId ?? null,
  );
  const q = query.trim().toLowerCase();
  // Search haystack per definition, rebuilt only when the library changes —
  // not stringified again on every keystroke.
  const haystack = useMemo(() => {
    const m = new Map<string, string>();
    for (const d of definitions)
      m.set(
        d.id,
        (
          d.name + " " + shortLabel(d.press) + " " + JSON.stringify(d.press)
        ).toLowerCase(),
      );
    return m;
  }, [definitions]);
  const matchesQuery = (d: Definition) =>
    !q || (haystack.get(d.id) ?? "").includes(q);
  const shown = definitions.filter(
    (d) => defInGroup(d, groupFilter) && matchesQuery(d),
  );

  // If the selected definition was deleted, fall back to the current group's
  // first definition (or clear). An intentional empty selection is kept.
  useEffect(() => {
    if (selectedId && !definitions.some((d) => d.id === selectedId)) {
      const first = definitions.find((d) => defInGroup(d, groupFilter));
      setSelectedId(first?.id ?? null);
    }
  }, [definitions, selectedId, groupFilter]);

  // Report the current view so the caller can restore it on the next open
  // (kept in memory for the app session).
  useEffect(() => {
    onViewChange?.({ groupFilter, selectedId });
  }, [groupFilter, selectedId, onViewChange]);

  // Clicking a group shows it and selects its first (visible) definition —
  // or clears the selection when the group is empty.
  const selectGroup = (g: string) => {
    setGroupFilter(g);
    const first = definitions.find((d) => defInGroup(d, g) && matchesQuery(d));
    setSelectedId(first?.id ?? null);
  };

  return {
    query,
    setQuery,
    q,
    groupFilter,
    setGroupFilter,
    selectedId,
    setSelectedId,
    shown,
    selectGroup,
  };
}
