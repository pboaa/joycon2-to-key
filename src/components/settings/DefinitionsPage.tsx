import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconRotate } from "@tabler/icons-react";
import { makeInputResolver, pressRisk } from "../../lib/inputRisk";
import type {
  Definition,
  DefinitionGroup,
  PressConfig,
} from "../../lib/types";
import { getDefUsage } from "../../lib/tauri";
import { findDefRefsInDefinitions, findDefUsages } from "../../lib/defUsage";
import { useStore } from "../../store";
import { useConfirm } from "../Confirm";
import { useDragReorder } from "../../lib/useDragReorder";
import { useDefinitionsFilter } from "../../lib/useDefinitionsFilter";
import { DefinitionGroupRail } from "./DefinitionGroupRail";
import { DefinitionRow } from "./DefinitionRow";
import { DefinitionEditorPane } from "./DefinitionEditorPane";
import { PageHeader } from "../ui/PageHeader";
import { MID_COL_W } from "../ui/layout";
import { PAGES } from "../../lib/pages";
import { ListPane } from "../ui/ListPane";
import { AddRow } from "../ui/AddRow";
import { Button } from "../ui/Button";
import { SearchInput } from "../ui/SearchInput";
import { EmptyState } from "../ui/EmptyState";
import { useContextMenu, type MenuItem } from "../ui/ContextMenu";

interface Props {
  definitions: Definition[];
  groups: DefinitionGroup[];
  layerOptions: string[];
  onCreate: (name: string, press: PressConfig, group?: string) => string;
  onRename: (id: string, name: string) => void;
  onUpdatePress: (id: string, press: PressConfig) => void;
  onSetGroup: (id: string, group: string | undefined) => void;
  onSetIcon: (id: string, icon: string | undefined) => void;
  onSetIconColor: (id: string, color: string | undefined) => void;
  onDelete: (id: string) => void;
  onReorder: (order: string[]) => void;
  onAddGroup: (name: string) => string;
  onRenameGroup: (id: string, name: string) => void;
  onRemoveGroup: (id: string) => void;
  onRemoveGroupWithDefs: (id: string) => void;
  onReorderGroups: (order: string[]) => void;
  /** Reset the whole library back to the bundled presets. */
  onResetAll: () => void;
  /** Preselect this definition on open (e.g. from a linked button). */
  initialSelectedId?: string;
  /** Preselect this group filter on open (e.g. the last-viewed group). Ignored
   * when `initialSelectedId` is set (which shows that definition's group). */
  initialGroupFilter?: string;
  /** Reports the current group + selection so the caller can restore it next
   * time the manager is opened (kept in memory until the app closes). */
  onViewChange?: (view: { groupFilter: string; selectedId: string | null }) => void;
}

/** Library of saved actions (full page): a group rail, a searchable name list,
 * and the editor for the selected definition. Editing is done in the right pane. */
export function DefinitionsPage({
  definitions,
  groups,
  layerOptions,
  onCreate,
  onRename,
  onUpdatePress,
  onSetGroup,
  onSetIcon,
  onSetIconColor,
  onDelete,
  onReorder,
  onAddGroup,
  onRenameGroup,
  onRemoveGroup,
  onRemoveGroupWithDefs,
  onReorderGroups,
  onResetAll,
  initialSelectedId,
  initialGroupFilter,
  onViewChange,
}: Props) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const ctx = useContextMenu();
  // Bumped to re-focus the name field (right-click → Rename).
  const [focusNameNonce, setFocusNameNonce] = useState(0);
  // Copy/paste clipboard for operations (session-local to this manager).
  const [defClip, setDefClip] = useState<{
    name: string;
    press: PressConfig;
    icon?: string;
    iconColor?: string;
  } | null>(null);
  // Resolver so a definition's risk badge accounts for nested `def` references.
  const riskResolver = useMemo(() => makeInputResolver(definitions), [definitions]);
  // Per-operation usage totals (all-time), so each row shows how much it's used —
  // 0 surfaces operations you've set up but never trigger. Fetched on open.
  const [defUses, setDefUses] = useState<Record<string, number>>({});
  useEffect(() => {
    getDefUsage()
      .then((days) => {
        const totals: Record<string, number> = {};
        for (const day of Object.values(days))
          for (const [id, n] of Object.entries(day)) totals[id] = (totals[id] ?? 0) + n;
        setDefUses(totals);
      })
      .catch(() => {});
  }, []);
  // Search + group filter + selection state (owns query / group / selection and
  // derives the shown list; see the hook for the selection-validity effects).
  const {
    query,
    setQuery,
    q,
    groupFilter,
    setGroupFilter,
    selectedId,
    setSelectedId,
    shown,
    selectGroup,
  } = useDefinitionsFilter({
    definitions,
    groups,
    initialSelectedId,
    initialGroupFilter,
    onViewChange,
  });
  const dnd = useDragReorder((from, to) => {
    // Reorder within the currently shown (filtered) list; definitions outside
    // the filter keep their positions in the underlying order.
    const shownIds = shown.map((d) => d.id);
    const [m] = shownIds.splice(from, 1);
    shownIds.splice(to, 0, m);
    const shownSet = new Set(shown.map((d) => d.id));
    let k = 0;
    const fullOrder = definitions.map((d) =>
      shownSet.has(d.id) ? shownIds[k++] : d.id,
    );
    onReorder(fullOrder);
  });

  const selected = definitions.find((d) => d.id === selectedId) ?? null;
  // Reordering works within the shown list (any group); a search narrows the
  // list to matches, so reordering is disabled while searching.
  const canReorder = !q;

  const add = () => {
    const group =
      groupFilter === "all" || groupFilter === "none" ? undefined : groupFilter;
    const id = onCreate("新しい操作", { type: "input", mode: "tap", inputs: [] }, group);
    setSelectedId(id);
    setQuery("");
  };
  const copyDef = (d: Definition) =>
    setDefClip({
      name: d.name,
      press: structuredClone(d.press),
      icon: d.icon,
      iconColor: d.iconColor,
    });
  const pasteDef = () => {
    if (!defClip) return;
    const group =
      groupFilter === "all" || groupFilter === "none" ? undefined : groupFilter;
    const id = onCreate(defClip.name, structuredClone(defClip.press), group);
    if (defClip.icon) onSetIcon(id, defClip.icon);
    if (defClip.iconColor) onSetIconColor(id, defClip.iconColor);
    setSelectedId(id);
    setQuery("");
  };
  const del = async (d: Definition) => {
    // An operation used somewhere (a button assignment, or referenced by a pie
    // slice / another operation) gets a confirm first — deleting it unlinks
    // those buttons and leaves any {def} references dead. An unused operation
    // deletes instantly, with the Undo toast as the safety net.
    const uses = findDefUsages(useStore.getState().profiles, d.id).length;
    const refs = findDefRefsInDefinitions(definitions, d.id).length;
    if (uses + refs > 0) {
      const ok = await confirm({
        title: t("操作の削除"),
        message: t(
          "「{{name}}」は{{count}}箇所で使われています。削除するとボタンのリンクが外れ、パイや他の操作からの参照は無効になります。削除しますか？",
          { name: d.name || t("(名前なし)"), count: uses + refs },
        ),
        danger: true,
        okLabel: t("削除"),
      });
      if (!ok) return;
    }
    // After deleting, select the neighbouring item (in the visible list).
    if (d.id === selectedId) {
      const idx = shown.findIndex((x) => x.id === d.id);
      setSelectedId(shown[idx + 1]?.id ?? shown[idx - 1]?.id ?? null);
    }
    onDelete(d.id);
  };
  // Focus the editor's name field to rename `d` (double-click a row).
  const startRename = (d: Definition) => {
    setSelectedId(d.id);
    setFocusNameNonce((n) => n + 1);
  };
  // Row menu items, shared by right-click and the row's ⋮ button. Double-click a
  // row also renames (focuses the editor's name field).
  // Rename is on double-clicking the row (and the name field is right there in the
  // editor), so it isn't repeated in the menu.
  const defMenu = (d: Definition): MenuItem[] => [
    { label: "コピー", onClick: () => copyDef(d) },
    { label: "貼り付け", disabled: !defClip, onClick: pasteDef },
    { label: "削除", danger: true, separated: true, onClick: () => void del(d) },
  ];

  // Page layout: gather the reset action at the bottom of column 1 (the folder
  // rail), so its footer line matches the other pages' left-column footers. The
  // count rides along on the left; the backup hint lives in the button tooltip.
  const railFooter = (
    <>
      <span className="text-caption text-text3">
        {t("{{count}} 件", { count: definitions.length })}
      </span>
      <Button
        variant="dangerOutline"
        size="sm"
        onClick={onResetAll}
        className="ml-auto inline-flex items-center gap-1 h-7"
        data-tip={t("すべての操作を初期状態に戻す")}
      >
        <IconRotate size={13} aria-hidden />
        {t("初期化")}
      </Button>
    </>
  );

  // Delete a folder: empty ones go straight away; a folder with operations is
  // deleted *with its contents* after one confirm (no "leave in Uncategorized" option).
  const deleteGroup = async (id: string) => {
    const inGroup = definitions.filter((d) => d.group === id).length;
    if (inGroup > 0) {
      const name = groups.find((g) => g.id === id)?.name || t("(名前なし)");
      const ok = await confirm({
        title: t("フォルダの削除"),
        message: t("フォルダ「{{name}}」（操作 {{count}} 件）を削除します。", {
          name,
          count: inGroup,
        }),
        danger: true,
        okLabel: t("削除"),
      });
      if (!ok) return;
      onRemoveGroupWithDefs(id);
    } else {
      onRemoveGroup(id);
    }
    // Keep the position: move off the deleted group to a neighbour (not All).
    if (groupFilter === id) {
      const idx = groups.findIndex((g) => g.id === id);
      const rest = groups.filter((g) => g.id !== id);
      selectGroup(rest[idx]?.id ?? rest[idx - 1]?.id ?? "none");
    }
  };

  const body = (
    <>
      <DefinitionGroupRail
        groups={groups}
        value={groupFilter}
        onChange={selectGroup}
        onAdd={onAddGroup}
        onRename={onRenameGroup}
        onRequestDelete={(id) => void deleteGroup(id)}
        onReorder={onReorderGroups}
        onMoveDefinitionToGroup={onSetGroup}
        footer={railFooter}
      />

      {/* Middle: search + name list (fixed width, like the key page's figure) */}
      <ListPane
        width={MID_COL_W}
        dnd={canReorder ? dnd : undefined}
        onBodyContextMenu={(e) =>
          ctx.open(e, [
            { label: "新規作成", onClick: add },
            { label: "貼り付け", disabled: !defClip, onClick: pasteDef },
          ])
        }
        header={
          <div className="border-b border-border">
            <div className="px-3 pt-2 pb-1">
              <span className="text-label font-semibold text-text2">
                {t("操作")}
              </span>
            </div>
            <div className="px-2 pb-2">
              <SearchInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        }
      >
        {shown.length === 0 && (
          <EmptyState>
            {definitions.length === 0
              ? "まだありません。下の「新しい操作」で作成できます。"
              : "このフォルダ／検索に一致する操作がありません。"}
          </EmptyState>
        )}
        {shown.map((d, i) => (
          <div key={d.id} onContextMenu={(e) => ctx.open(e, defMenu(d))}>
            <DefinitionRow
              def={d}
              index={i}
              selected={d.id === selectedId}
              dnd={dnd}
              canReorder={canReorder}
              risk={pressRisk(d.press, riskResolver)}
              uses={defUses[d.id] ?? 0}
              onSelect={setSelectedId}
              onStartRename={() => startRename(d)}
              onMenu={(e) => ctx.open(e, defMenu(d))}
            />
          </div>
        ))}
        <AddRow label="新しい操作" onClick={add} />
      </ListPane>

      {ctx.node}

      {/* Right: editor for the selected definition */}
      <DefinitionEditorPane
        selected={selected}
        definitions={definitions}
        groups={groups}
        layerOptions={layerOptions}
        focusNameSignal={focusNameNonce}
        onRename={onRename}
        onSetIcon={onSetIcon}
        onSetIconColor={onSetIconColor}
        onUpdatePress={onUpdatePress}
        onDelete={del}
        onJumpToDefinition={(id) => {
          // Jump to the referenced definition within this manager, switching to
          // its group (not "all") when it has one.
          const d = definitions.find((x) => x.id === id);
          setQuery("");
          setGroupFilter(d ? (d.group ?? "none") : "all");
          setSelectedId(id);
        }}
      />
    </>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader
        title={PAGES.defs.label}
        desc={PAGES.defs.desc}
        icon={<PAGES.defs.Icon size={16} aria-hidden />}
        helpSection="保存した操作"
      />
      <div className="flex-1 min-h-0 flex overflow-hidden">{body}</div>
    </div>
  );
}
