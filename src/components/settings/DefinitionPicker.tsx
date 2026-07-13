import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Definition, DefinitionGroup } from "../../lib/types";
import { shortLabel } from "../../lib/variants";
import { getRecentDefIds, pushRecentDef } from "../../lib/recentDefs";
import { ModalShell } from "../ui/ModalShell";
import { SearchInput } from "../ui/SearchInput";
import { EmptyState } from "../ui/EmptyState";

/** A searchable picker overlay for choosing one definition. Like the full
 * definitions manager it has a group rail on the left, but it only selects (no
 * editing), takes an optional `filter` to restrict eligible definitions, and
 * renders above other modals — so it can be opened from inside the manager too. */
export function DefinitionPicker({
  definitions,
  groups = [],
  filter,
  title = "操作を選択",
  emptyHint = "該当する操作がありません。",
  onPick,
  onClose,
}: {
  definitions: Definition[];
  groups?: DefinitionGroup[];
  filter?: (d: Definition) => boolean;
  title?: string;
  emptyHint?: string;
  onPick: (d: Definition) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const q = query.trim().toLowerCase();
  const inGroup = (d: Definition) =>
    groupFilter === "all"
      ? true
      : groupFilter === "none"
        ? !d.group
        : d.group === groupFilter;
  const list = definitions.filter(
    (d) =>
      (!filter || filter(d)) &&
      inGroup(d) &&
      (!q || (d.name + " " + shortLabel(d.press)).toLowerCase().includes(q)),
  );

  // Recently-picked operations, shown as a quick-access section at the top when
  // browsing (no query, no group filter). Skips ids that no longer exist or are
  // filtered out.
  const recents =
    !q && groupFilter === "all"
      ? getRecentDefIds()
          .map((id) => definitions.find((d) => d.id === id))
          .filter((d): d is Definition => !!d && (!filter || filter(d)))
      : [];

  const pick = (d: Definition) => {
    pushRecentDef(d.id);
    onPick(d);
    onClose();
  };

  const row = (d: Definition) => (
    <button
      key={d.id}
      onClick={() => pick(d)}
      className="w-full text-left px-2 py-1.5 rounded-row hover:bg-bg3 "
    >
      <div className="text-label font-medium text-text truncate">
        {d.name || t("(名前なし)")}
      </div>
      <div className="text-caption font-mono text-text3 truncate">
        {shortLabel(d.press)}
      </div>
    </button>
  );

  const groupBtn = (v: string, label: string) => (
    <button
      key={v}
      onClick={() => setGroupFilter(v)}
      data-tip={t(label)}
      className={
        "w-full text-left px-2 py-1 text-label rounded-row truncate " +
        (groupFilter === v
          ? "bg-accent text-white"
          : "text-text hover:bg-bg3 ")
      }
    >
      {t(label)}
    </button>
  );

  return (
    <ModalShell
      title={title}
      onClose={onClose}
      width="w-[540px]"
      height="h-[70vh]"
      z={60}
      bodyClassName="flex"
    >
      {/* Group rail (filter only) */}
      <div className="w-[130px] shrink-0 overflow-y-auto p-1.5 space-y-0.5 border-r border-border ">
        {groupBtn("all", "すべて")}
        {groupBtn("none", "未分類")}
        {groups.length > 0 && (
          <div className="h-px my-1 bg-bg3 " />
        )}
        {groups.map((g) => groupBtn(g.id, g.name || t("(名前なし)")))}
      </div>

      {/* Search + list */}
      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        <div className="p-2 border-b border-border ">
          <SearchInput
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-1.5 space-y-0.5">
          {list.length === 0 && (
            <EmptyState className="p-2">{emptyHint}</EmptyState>
          )}
          {recents.length > 0 && (
            <>
              <div className="px-2 pt-1 pb-0.5 text-caption font-semibold uppercase tracking-wider text-text3">
                {t("最近使った操作")}
              </div>
              {recents.map(row)}
              <div className="h-px my-1.5 bg-bg3" />
              <div className="px-2 pb-0.5 text-caption font-semibold uppercase tracking-wider text-text3">
                {t("すべて")}
              </div>
            </>
          )}
          {list.map(row)}
        </div>
      </div>
    </ModalShell>
  );
}
