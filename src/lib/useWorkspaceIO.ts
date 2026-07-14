import { open, save } from "@tauri-apps/plugin-dialog";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { useTranslation } from "react-i18next";
import {
  applyBackupStats,
  exportBackup,
  importBackup,
  restoreBackup as restoreBackupCmd,
} from "./tauri";
import { useStore, WORKSPACE_VERSION } from "../store";
import { useConfirm } from "../components/Confirm";
import { toast } from "./toast";
import { workspaceRisk } from "./inputRisk";
import type { WorkspaceFile } from "./types";

const JSON_FILTER = [{ name: "JSON", extensions: ["json"] }];

/** Export / import a full backup (settings + operations + profiles + usage
 * stats) as a single JSON file. The backend attaches the current stats on
 * export and applies the bundled stats on import; this hook is just the dialog,
 * the confirm, and the store update. */
export function useWorkspaceIO() {
  const confirm = useConfirm();
  const { t } = useTranslation();

  const exportWorkspace = async () => {
    const s = useStore.getState();
    const ws: WorkspaceFile = {
      version: WORKSPACE_VERSION,
      settings: s.settings,
      definitions: { version: 1, groups: s.groups, definitions: s.definitions },
      pieMenus: s.pieMenus,
      profiles: s.profiles ?? {},
    };
    const path = await save({
      defaultPath: "joycon-backup.json",
      filters: JSON_FILTER,
    });
    if (typeof path !== "string") return;
    try {
      await exportBackup(path, ws);
      toast.success(t("バックアップを書き出しました"));
    } catch (e) {
      toast.error(t("エクスポート失敗: {{error}}", { error: String(e) }));
    }
  };

  const importWorkspace = async () => {
    const path = await open({ multiple: false, filters: JSON_FILTER });
    if (typeof path !== "string") return;

    // Read-only preview first — nothing is applied until the user consents.
    let info;
    try {
      info = await importBackup(path);
    } catch (e) {
      toast.error(t("読み込み失敗: {{error}}", { error: String(e) }));
      return;
    }

    // The imported file's names/definitions are attacker-controlled, so surface
    // the actual risky input primitives it would install (Win chords, typed
    // text, …) in the consent dialog — not just the generic "replace everything".
    let message = t("現在の{{scope}}をすべて置き換えます。よろしいですか？", {
      scope: t("設定・操作・プロファイル・統計"),
    });
    const risk = workspaceRisk(info.workspace);
    if (risk.level !== "none") {
      const reasons = risk.reasons.map((r) => `・${t(r)}`).join("\n");
      message +=
        "\n\n" +
        t("このバックアップには次の操作を送るボタンが含まれます:") +
        "\n" +
        reasons +
        "\n\n" +
        t("信頼できる提供元のファイルだけを取り込んでください。");
    }

    if (
      !(await confirm({
        title: t("バックアップのインポート"),
        message,
        danger: true,
        okLabel: t("置き換える"),
      }))
    )
      return;

    const st = useStore.getState();
    try {
      st.hydrate(info.workspace, st.configPath);
      await st.saveNow();
      // Only now (post-consent) apply the bundled stats.
      if (info.hasStats) await applyBackupStats(path);
      toast.success(t("バックアップを取り込みました"));
    } catch (e) {
      toast.error(t("インポート失敗: {{error}}", { error: String(e) }));
    }
  };

  /** Restore a rotating auto-backup (by filename) into the live workspace, with
   * a confirm. Stats aren't part of these backups, so current usage counts are
   * kept. */
  const restoreBackup = async (name: string) => {
    let ws;
    try {
      ws = await restoreBackupCmd(name);
    } catch (e) {
      toast.error(t("復元失敗: {{error}}", { error: String(e) }));
      return;
    }

    if (
      !(await confirm({
        title: t("バックアップから復元"),
        message: t("このバックアップの時点に戻します（現在の設定・操作・プロファイルを置き換え）。統計はそのまま残ります。"),
        danger: true,
        okLabel: t("復元する"),
      }))
    )
      return;

    const st = useStore.getState();
    try {
      st.hydrate(ws, st.configPath);
      await st.saveNow();
      toast.success(t("バックアップから復元しました"));
    } catch (e) {
      toast.error(t("復元失敗: {{error}}", { error: String(e) }));
    }
  };

  /** Reveal the config folder (workspace.json + the backups/ subfolder + any
   * quarantined files) in the OS file manager — for manual backup access. */
  const openFolder = () => {
    const p = useStore.getState().configPath;
    if (p) revealItemInDir(p).catch(() => {});
  };

  return { exportWorkspace, importWorkspace, restoreBackup, openFolder };
}
