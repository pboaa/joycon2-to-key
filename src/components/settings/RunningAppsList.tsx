import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { RunningApp } from "../../lib/types";
import { listRunningApps } from "../../lib/tauri";
import { EmptyState } from "../ui/EmptyState";

interface Props {
  /** Lowercased process names already added — shown disabled. */
  disabled: Set<string>;
  onPick: (process: string, app: RunningApp) => void;
}

/** Fetches and lists currently-running apps (with icons). Shared by the
 * "add profile from app" picker and the per-profile settings modal. */
export function RunningAppsList({ disabled, onPick }: Props) {
  const { t } = useTranslation();
  const [apps, setApps] = useState<RunningApp[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    listRunningApps()
      .then((list) => alive && setApps(list))
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="space-y-0.5">
      {error && <p className="text-label text-danger p-1">{t("取得に失敗: {{error}}", { error })}</p>}
      {!apps && !error && <EmptyState>{t("読み込み中…")}</EmptyState>}
      {apps && apps.length === 0 && (
        <EmptyState>{t("対象のアプリが見つかりません")}</EmptyState>
      )}
      {apps?.map((a) => {
        const isAdded = disabled.has(a.process.toLowerCase());
        return (
          <button
            key={a.process}
            onClick={() => onPick(a.process, a)}
            disabled={isAdded}
            data-tip={isAdded ? t("追加済み") : a.title}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-row hover:bg-bg3 text-left disabled:opacity-40 disabled:hover:bg-transparent"
          >
            {a.icon ? (
              <img src={a.icon} alt="" className="w-6 h-6 shrink-0" />
            ) : (
              <span className="w-6 h-6 shrink-0 rounded-row bg-bg3 " />
            )}
            <span className="min-w-0 flex-1">
              <span className="block text-label font-mono truncate">{a.process}</span>
              <span className="block text-caption text-text3 truncate">
                {a.title}
              </span>
            </span>
            {isAdded && (
              <span className="text-caption text-text3 shrink-0">{t("追加済")}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
