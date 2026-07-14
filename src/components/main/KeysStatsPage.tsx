import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import type { Definition, DefinitionGroup, PressConfig } from "../../lib/types";
import { toast } from "../../lib/toast";
import type { Selection } from "../../lib/useSelection";
import type { ConfigActions } from "../../lib/useConfigActions";
import type { Heatmap } from "../../lib/useHeatmap";
import { PAGES } from "../../lib/pages";
import { useUsageHeat } from "../../lib/useUsageHeat";
import { buttonLabel } from "../../lib/keyCatalog";
import { useContextMenu } from "../ui/ContextMenu";
import { MID_COL_W } from "../ui/layout";
import { PageHeader } from "../ui/PageHeader";
import { ConnectionGuide } from "./ConnectionGuide";
import { KeysRail } from "./KeysRail";
import { StatsRailSection } from "./StatsRailSection";
import { JoyConStage } from "./JoyConStage";
import { EditorPopover } from "./EditorPopover";
import { StatsPanel } from "./StatsPanel";

/** The key-assignment page and the Stats page share one layout — same left rail
 * and same centre figure — so switching between them never moves the figure.
 * `statsMode` swaps the header, the heatmap, and the right column (editor ⇄
 * stats), and makes the rail view-only with a period picker. */
export function KeysStatsPage({
  selection: sel,
  actions,
  definitions,
  groups,
  heat,
  statsMode,
  onManageProfiles,
  onSaveDefinition,
  onManageDefinitions,
  onInsertDefinition,
  onCloseEditor,
}: {
  selection: Selection;
  actions: ConfigActions;
  definitions: Definition[];
  groups?: DefinitionGroup[];
  heat: Heatmap;
  statsMode: boolean;
  onManageProfiles: (isNew?: boolean) => void;
  onSaveDefinition: (name: string, press: PressConfig) => string;
  onManageDefinitions: (defId?: string) => void;
  onInsertDefinition: (apply: (def: Definition) => void) => void;
  onCloseEditor: () => void;
}) {
  const { t } = useTranslation();
  const { label, desc, Icon } = PAGES[statsMode ? "stats" : "keys"];
  const btn = sel.selectedButton;
  const assignment = btn ? sel.effectiveButtons[btn] : undefined;

  // Stats mode: the list of buttons "assigned but unused (0 times)" in this window.
  // Directly serves the main goal of stats = surfacing the unused. Click to select and review.
  const { counts } = useUsageHeat(
    heat.usage,
    heat.win,
    sel.selectedProfile,
    sel.selectedLayer,
  );
  const unusedMapped = statsMode
    ? Object.entries(sel.effectiveButtons)
        .filter(
          ([k, a]) => a.press.type !== "none" && (counts[k] ?? 0) === 0,
        )
        .map(([k]) => k)
    : [];

  const ctx = useContextMenu();

  // Copy / paste / clear the assignment at an explicit button `key`, for the
  // right-click menu. `setAssignmentAt` targets the key directly (not the
  // selection), so it's correct even before a select re-render settles.
  const copyAssignment = (key: string) => {
    const a = sel.effectiveButtons[key];
    sel.setClipboard(a ? structuredClone(a) : null);
  };
  const pasteAssignment = (key: string) => {
    if (!sel.clipboard) return;
    // If paste replaces an existing mapping, offer Undo (pasting onto an empty
    // button loses nothing, so no toast there).
    const prevDirect = sel.layer?.buttons[key];
    actions.setAssignmentAt(key, structuredClone(sel.clipboard));
    if (prevDirect && prevDirect.press.type !== "none") {
      toast.undo(t("「{{name}}」を上書きしました", { name: buttonLabel(key) }), t("元に戻す"), () =>
        actions.setAssignmentAt(key, structuredClone(prevDirect)),
      );
    }
  };
  const clearAssignment = (key: string) => {
    // Snapshot the button's *direct* value (not the inherited/effective one) so
    // Undo restores exactly — including "was inherited" (undefined → no override).
    const prevDirect = sel.layer?.buttons[key];
    actions.setAssignmentAt(key, null);
    toast.undo(t("「{{name}}」の割り当てを削除しました", { name: buttonLabel(key) }), t("元に戻す"), () =>
      actions.setAssignmentAt(key, prevDirect ? structuredClone(prevDirect) : null),
    );
  };

  // Right-click a button on the figure: select it, then copy / paste / clear.
  const onContextButton = (key: string, e: MouseEvent) => {
    sel.setSelectedButton(key);
    const a = sel.effectiveButtons[key];
    const mapped = !!a && a.press.type !== "none";
    ctx.open(e, [
      { label: "コピー", disabled: !mapped, onClick: () => copyAssignment(key) },
      { label: "貼り付け", disabled: !sel.clipboard, onClick: () => pasteAssignment(key) },
      {
        label: "削除",
        danger: true,
        separated: true,
        disabled: !mapped,
        onClick: () => clearAssignment(key),
      },
    ]);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {ctx.node}
      <PageHeader
        title={label}
        desc={desc}
        icon={<Icon size={16} aria-hidden />}
        helpSection={statsMode ? "統計" : "キー割り当て"}
      />
      {/* First-run connection hint (key-assignment mode only; hidden once
          connected or dismissed). */}
      {!statsMode && <ConnectionGuide />}
      {/* 3 columns (rail | figure | editor), like the saved-operations page. */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        <KeysRail
          selection={sel}
          actions={actions}
          onManageProfiles={onManageProfiles}
          readOnly={statsMode}
          footer={
            statsMode ? (
              <StatsRailSection
                heatmap={heat}
                unused={unusedMapped}
                onSelect={sel.setSelectedButton}
              />
            ) : undefined
          }
        />

        <div
          data-tour="figure"
          className={`${MID_COL_W} shrink-0 relative overflow-hidden p-1`}
        >
          <JoyConStage
            buttons={sel.effectiveButtons}
            selected={sel.selectedButton}
            onSelect={sel.setSelectedButton}
            onDeselect={onCloseEditor}
            onContext={statsMode ? undefined : onContextButton}
            inheritedKeys={sel.inheritedKeys}
            stickMouse={!!sel.layer?.stickMouse}
            stickMouseR={!!sel.layer?.stickMouseR}
            heatmap={statsMode ? heat : undefined}
            heatControls={false}
          />
        </div>

        {statsMode ? (
          <StatsPanel
            btnKey={btn}
            press={assignment?.press ?? null}
            defId={assignment?.def}
            definitions={definitions}
            heatmap={heat}
          />
        ) : (
          <EditorPopover
            selection={sel}
            actions={actions}
            definitions={definitions}
            groups={groups}
            onSaveDefinition={onSaveDefinition}
            onManageDefinitions={onManageDefinitions}
            onInsertDefinition={onInsertDefinition}
          />
        )}
      </div>
    </div>
  );
}
