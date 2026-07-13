import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Definition } from "./lib/types";
import type { JoyConHook } from "./lib/useJoyCon";
import { useStore } from "./store";
import { useSelection } from "./lib/useSelection";
import { useConfigActions } from "./lib/useConfigActions";
import { useDefinitionSync } from "./lib/useDefinitionSync";
import { useSettings } from "./lib/useSettings";
import { useTheme } from "./lib/useTheme";
import { useUiScale } from "./lib/useUiScale";
import { useLanguage } from "./lib/i18n";
import { useConfigIO } from "./lib/useConfigIO";
import { useWorkspaceIO } from "./lib/useWorkspaceIO";
import { useHeatmap } from "./lib/useHeatmap";
import { AppNav, type AppPage } from "./components/main/AppNav";
import { ProfileSettingsModal } from "./components/main/ProfileSettingsModal";
import { HelpPage } from "./components/main/HelpPage";
import { InfoPage } from "./components/main/InfoPage";
import { Tour } from "./components/main/Tour";
import { KeysStatsPage } from "./components/main/KeysStatsPage";
import { AdvancedSettingsPage } from "./components/settings/AdvancedSettingsPage";
import { DefinitionsPage } from "./components/settings/DefinitionsPage";
import { DefinitionPicker } from "./components/settings/DefinitionPicker";

interface Props {
  joyCon: JoyConHook;
}

/** Top-level container (reWASD-style): a top bar (profiles / layer / connection)
 * over the Joy-Con figure, with the button editor shown as a popup. */
export function MainScreen({ joyCon }: Props) {
  // Read the profiles slice straight from the store (persistence lives there).
  const config = useStore((s) => s.profiles);
  const setConfig = useStore((s) => s.setProfiles);
  const resetProfilesToDefault = useStore((s) => s.resetProfilesToDefault);

  // Profile settings (name + matched apps) — a modal now that profiles have no
  // dedicated page. Edits the selected profile. `isNew` marks the ＋-created
  // flow, so an abandoned (no-exe) new profile is discarded on close.
  const [profileSettings, setProfileSettings] = useState<{ isNew: boolean } | null>(
    null,
  );
  // While that modal is open, freeze the runtime-follow: removing the edited
  // profile's matched app re-matches the foreground app to デフォルト, and the
  // follow would otherwise flip the selection (and the open modal) to it.
  const selection = useSelection(config, joyCon.activeLayer, !!profileSettings);
  const actions = useConfigActions(config, setConfig, selection);
  const defs = useDefinitionSync(config, setConfig);
  // "Reset everything" (settings → Manage) means a fresh install: profiles AND
  // the saved-operations library both go back to the bundled defaults.
  const reset = useCallback(async () => {
    await resetProfilesToDefault();
    await defs.resetAllCore();
  }, [resetProfilesToDefault, defs]);
  const { settings, updateSettings } = useSettings();
  useTheme(settings.theme);
  useUiScale(settings.uiScale);
  useLanguage(settings.language);
  const io = useConfigIO({ reset });
  const wio = useWorkspaceIO();
  const heat = useHeatmap();
  const { t } = useTranslation();

  // ── Page navigation (left rail; lives in the store so deep components like
  // the pie-style panel can jump to a settings tab without prop-drilling). ──
  const page = useStore((s) => s.page);
  const navigate = useStore((s) => s.navigate);
  // Stats is a mode of the key page (same layout, so the figure never shifts).
  const statsMode = page === "stats";
  // Stats mode is all about the heatmap: turn it on when entering, off when
  // leaving (stops the background poll). The toggle on the figure still lets the
  // user switch it off while viewing stats.
  const setHeatOn = heat.setOn;
  useEffect(() => {
    setHeatOn(page === "stats");
  }, [page, setHeatOn]);
  // The definition picker (a simple group + list overlay for assigning a saved
  // action to a button) stays a transient modal, overlaying any page.
  const [pickApply, setPickApply] = useState<((def: Definition) => void) | null>(
    null,
  );
  const [defsInitialId, setDefsInitialId] = useState<string | undefined>(
    undefined,
  );
  // Last-viewed group/selection of the definitions manager. Only read when the
  // modal mounts (its useState initializers), so a ref avoids re-rendering the
  // whole screen on every in-modal selection change.
  const defsView = useRef<{
    groupFilter: string;
    selectedId: string | null;
  } | null>(null);
  const onDefsViewChange = useCallback(
    (v: { groupFilter: string; selectedId: string | null }) => {
      defsView.current = v;
    },
    [],
  );
  // Navigate to the definitions page, optionally preselecting a definition
  // (e.g. from a linked button's 📌). Remounts the page so the initial id and
  // last-viewed group apply on each visit.
  const openManage = useCallback(
    (id?: string) => {
      setDefsInitialId(id);
      navigate("defs");
    },
    [navigate],
  );
  const onNavigate = useCallback(
    (p: AppPage) => {
      if (p === "defs") setDefsInitialId(undefined);
      navigate(p);
    },
    [navigate],
  );
  const openInsert = useCallback((apply: (def: Definition) => void) => {
    setPickApply(() => apply);
  }, []);
  const { setSelectedButton } = selection;
  const closeEditor = useCallback(
    () => setSelectedButton(null),
    [setSelectedButton],
  );

  // Guided tour: auto-run once on first launch (flag in localStorage), and any
  // time from the Help page.
  const [tourOpen, setTourOpen] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem("joycon.tourSeen")) {
      localStorage.setItem("joycon.tourSeen", "1");
      setTourOpen(true);
    }
  }, []);

  if (!config) {
    return <div className="flex-1 p-4 text-label text-text2">{t("読み込み中…")}</div>;
  }

  return (
    <div className="flex-1 min-h-0 flex overflow-hidden">
      <AppNav
        page={page}
        onNavigate={onNavigate}
        connectionState={joyCon.connectionState}
        onConnect={joyCon.connect}
        onDisconnect={joyCon.disconnect}
      />

      <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
        {(page === "keys" || page === "stats") && (
          <KeysStatsPage
            selection={selection}
            actions={actions}
            definitions={defs.definitions}
            groups={defs.groups}
            heat={heat}
            statsMode={statsMode}
            onManageProfiles={(isNew) => setProfileSettings({ isNew: !!isNew })}
            onSaveDefinition={defs.create}
            onManageDefinitions={openManage}
            onInsertDefinition={openInsert}
            onCloseEditor={closeEditor}
          />
        )}

        {page === "settings" && (
          <AdvancedSettingsPage
            settings={settings}
            onSettingsChange={updateSettings}
            onExport={wio.exportWorkspace}
            onImport={wio.importWorkspace}
            onRestore={wio.restoreBackup}
            onOpenFolder={wio.openFolder}
            onReset={io.doReset}
          />
        )}

        {page === "defs" && (
          <DefinitionsPage
            definitions={defs.definitions}
            groups={defs.groups}
            layerOptions={selection.layerNames}
            onCreate={defs.create}
            onRename={defs.rename}
            onUpdatePress={defs.updatePress}
            onSetGroup={defs.setGroup}
            onSetIcon={defs.setIcon}
            onSetIconColor={defs.setIconColor}
            onDelete={defs.remove}
            onReorder={defs.reorder}
            onAddGroup={defs.addGroup}
            onRenameGroup={defs.renameGroup}
            onRemoveGroup={defs.removeGroup}
            onRemoveGroupWithDefs={defs.removeGroupWithDefs}
            onReorderGroups={defs.reorderGroups}
            onResetAll={defs.resetAll}
            initialSelectedId={
              // Jump target if any, else restore the last selection from this
              // session (first open in a session = no selection).
              defsInitialId ?? defsView.current?.selectedId ?? undefined
            }
            initialGroupFilter={
              defsInitialId ? undefined : defsView.current?.groupFilter
            }
            onViewChange={onDefsViewChange}
          />
        )}

        {page === "help" && <HelpPage onStartTour={() => setTourOpen(true)} />}

        {page === "info" && <InfoPage />}
      </div>

      {pickApply && (
        <DefinitionPicker
          definitions={defs.definitions}
          groups={defs.groups}
          title="操作を割り当て"
          emptyHint="保存された操作がありません。"
          onPick={pickApply}
          onClose={() => setPickApply(null)}
        />
      )}

      {profileSettings && (
        <ProfileSettingsModal
          selection={selection}
          actions={actions}
          isNew={profileSettings.isNew}
          onClose={() => setProfileSettings(null)}
        />
      )}

      {tourOpen && <Tour onClose={() => setTourOpen(false)} />}
    </div>
  );
}
