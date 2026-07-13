import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IconBell, IconFolderCog, IconKeyboard, IconChartPie, IconSettings2, type TablerIcon } from "@tabler/icons-react";
import type { GlobalSettings } from "../../lib/types";
import { useStore } from "../../store";
import { SETTINGS_RAIL_W } from "../ui/layout";
import { PageHeader } from "../ui/PageHeader";
import { RailHeader } from "../ui/RailHeader";
import {
  BatteryTab,
  ConnectionTab,
  GeneralTab,
  PieTab,
  InputTab,
  LedTab,
  ManageTab,
} from "./tabs";

interface Props {
  settings: GlobalSettings;
  onSettingsChange: (s: GlobalSettings) => void;
  onExport: () => void;
  onImport: () => void;
  onRestore: (name: string) => void;
  onOpenFolder: () => void;
  onReset: () => void;
}

type TabId = "general" | "input" | "pie" | "battery" | "manage";
const TABS: { id: TabId; label: string; desc: string }[] = [
  { id: "general", label: "一般", desc: "表示言語・テーマ配色・放置時の自動停止など。" },
  { id: "input", label: "入力", desc: "キー送出やスクロールなどの既定値。" },
  { id: "pie", label: "パイメニュー", desc: "パイメニュー共通の見た目と動作。" },
  { id: "battery", label: "デバイス・通知", desc: "電池較正・LED・接続時のお知らせ（音・振動）。" },
  { id: "manage", label: "管理", desc: "バックアップの入出力・統計の保持・初期化。" },
];

// A distinct icon per tab, shown both in the rail row and the header chip.
const TAB_ICONS: Record<TabId, TablerIcon> = {
  general: IconSettings2,
  input: IconKeyboard,
  pie: IconChartPie,
  battery: IconBell,
  manage: IconFolderCog,
};

export function AdvancedSettingsPage({
  settings,
  onSettingsChange,
  onExport,
  onImport,
  onRestore,
  onOpenFolder,
  onReset,
}: Props) {
  const setG = (patch: Partial<GlobalSettings>) =>
    onSettingsChange({ ...settings, ...patch });
  // Open on the tab a caller requested (e.g. jumping from a pie's style panel),
  // else General. The page remounts per visit, so reading it once is enough.
  const requestedTab = useStore((s) => s.settingsTab);
  const [tab, setTab] = useState<TabId>(
    () =>
      (TABS.some((tb) => tb.id === requestedTab)
        ? (requestedTab as TabId)
        : "general"),
  );
  const { t } = useTranslation();
  const active = TABS.find((tb) => tb.id === tab)!;
  const ActiveIcon = TAB_ICONS[tab];

  // Left side-tab rail (list) — same header + list body as the other pages'
  // rails, so its top and rows line up with them.
  const rail = (
    <div className={`${SETTINGS_RAIL_W} shrink-0 border-r border-border bg-bg2 flex flex-col overflow-hidden`}>
      <RailHeader title="設定" />
      {/* A short nav list (6 tabs), so give the rows more room than the dense
          content lists — bigger text/icon and padding for easy reading. */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-1.5 space-y-1">
        {TABS.map((tb) => {
          const Icon = TAB_ICONS[tb.id];
          const on = tab === tb.id;
          return (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={
                "w-full text-left px-2.5 py-2 rounded-row text-body inline-flex items-center gap-2.5 transition-colors " +
                (on
                  ? "bg-bg3 text-accent font-medium"
                  : "text-text2 hover:bg-bg3 hover:text-text")
              }
            >
              <Icon size={16} className="shrink-0" aria-hidden />
              <span className="truncate">{t(tb.label)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Content for the active tab (the header/description lives in the top bar).
  const content = (
    <div className="flex-1 min-w-0 overflow-y-auto">
      <div className="px-4 py-3 space-y-3">
        {tab === "general" && <GeneralTab settings={settings} setG={setG} />}
        {tab === "input" && <InputTab settings={settings} setG={setG} />}
        {tab === "pie" && <PieTab settings={settings} setG={setG} />}
        {tab === "battery" && (
          <>
            <BatteryTab settings={settings} setG={setG} />
            <LedTab settings={settings} setG={setG} />
            <ConnectionTab settings={settings} setG={setG} />
          </>
        )}
        {tab === "manage" && (
          <ManageTab
            onExport={onExport}
            onImport={onImport}
            onRestore={onRestore}
            onOpenFolder={onOpenFolder}
            onReset={onReset}
          />
        )}
      </div>
    </div>
  );

  // Top bar (full-width title) over the list | content split — matching the
  // other pages' PageHeader layout.
  const shell = (
    <>
      <PageHeader
        title={active.label}
        desc={active.desc}
        icon={<ActiveIcon size={16} aria-hidden />}
      />
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {rail}
        {content}
      </div>
    </>
  );

  return <div className="h-full flex flex-col overflow-hidden">{shell}</div>;
}
