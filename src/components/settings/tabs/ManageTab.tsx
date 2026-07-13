import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IconChevronRight, IconFolderOpen, IconRotate } from "@tabler/icons-react";
import { useStore } from "../../../store";
import { listBackups, type BackupEntry } from "../../../lib/tauri";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { Select } from "../../ui/Select";
import { CTRL_W, SettingRow } from "./shared";

/** Usage-stats retention options (days); 0 = keep everything. */
const RETENTION_OPTIONS = [
  { days: 0, label: "無制限" },
  { days: 30, label: "30日" },
  { days: 90, label: "90日" },
  { days: 180, label: "180日" },
  { days: 365, label: "1年" },
  { days: 730, label: "2年" },
];

export function ManageTab({
  onExport,
  onImport,
  onRestore,
  onOpenFolder,
  onReset,
}: {
  onExport: () => void;
  onImport: () => void;
  onRestore: (name: string) => void;
  onOpenFolder: () => void;
  onReset: () => void;
}) {
  const { t } = useTranslation();
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  // Auto-backups: a rarely-used escape hatch, so it's tucked into a collapsed
  // disclosure at the bottom and only fetched the first time it's opened.
  const [showRestore, setShowRestore] = useState(false);
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const refreshBackups = () => listBackups().then(setBackups).catch(() => {});
  const toggleRestore = () => {
    const next = !showRestore;
    setShowRestore(next);
    if (next) refreshBackups();
  };
  const restore = async (name: string) => {
    await onRestore(name);
    refreshBackups();
  };
  return (
    <>
      <Card
        title="バックアップ（すべて）"
        desc="設定・操作・プロファイル・統計をまとめて1つのファイルに書き出し／読み込みします。"
      >
        <div className="flex flex-wrap gap-1.5">
          <Button size="xs" onClick={onExport}>
            {t("エクスポート")}
          </Button>
          <Button size="xs" onClick={onImport}>
            {t("インポート")}
          </Button>
        </div>
      </Card>

      <Card title="統計の保持" desc="古い使用統計を自動で削除します。既定は無制限。">
        <SettingRow label="古い統計を自動削除">
          <Select
            value={String(settings.usageRetentionDays)}
            onChange={(e) =>
              setSettings({ ...settings, usageRetentionDays: Number(e.target.value) })
            }
            fullWidth={false}
            className={CTRL_W}
          >
            {RETENTION_OPTIONS.map((o) => (
              <option key={o.days} value={o.days}>
                {t(o.label)}
              </option>
            ))}
          </Select>
        </SettingRow>
      </Card>

      <Card title="初期化">
        <div>
          <Button variant="dangerSolid" size="xs" onClick={onReset}>
            {t("すべて初期状態にリセット")}
          </Button>
        </div>
      </Card>

      {/* Rarely needed: a quiet disclosure at the very bottom. */}
      <div className="pt-1">
        <button
          onClick={toggleRestore}
          className="text-caption text-text3 hover:text-text inline-flex items-center gap-1"
        >
          <IconChevronRight
            size={12}
            aria-hidden
            className={"transition-transform " + (showRestore ? "rotate-90" : "")}
          />
          {t("バックアップから復元")}
        </button>
        {showRestore && (
          <div className="mt-1.5 space-y-1.5">
            <p className="text-caption text-text3">
              {t("自動保存された過去の状態（設定・操作・プロファイル）に戻します。統計はそのまま残ります。")}
            </p>
            <div>
              <Button
                size="xs"
                onClick={onOpenFolder}
                className="inline-flex items-center gap-1"
                data-tip={t("バックアップや設定ファイルの場所を開く")}
              >
                <IconFolderOpen size={12} aria-hidden />
                {t("フォルダを開く")}
              </Button>
            </div>
            {backups.length === 0 ? (
              <p className="text-caption text-text3">{t("まだ自動バックアップがありません。")}</p>
            ) : (
              <div className="max-h-40 overflow-y-auto [scrollbar-gutter:stable] rounded-row border border-border divide-y divide-border">
                {backups.map((b) => (
                  <div key={b.name} className="flex items-center gap-2 px-2 py-1 text-label">
                    <span className="flex-1 min-w-0 truncate tabular-nums text-text2">
                      {new Date(b.timestampMs).toLocaleString()}
                    </span>
                    <Button
                      size="xs"
                      onClick={() => restore(b.name)}
                      className="shrink-0 inline-flex items-center gap-1"
                      data-tip={t("この時点に復元")}
                    >
                      <IconRotate size={12} aria-hidden />
                      {t("復元")}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
