import { useTranslation } from "react-i18next";
import { IconDownload, IconSparkles } from "@tabler/icons-react";
import { ModalShell } from "./ui/ModalShell";
import { Button } from "./ui/Button";
import { useUpdater } from "../lib/useUpdater";

/** Update details dialog: shows the new version and its release notes, and lets
 * the user start the download+install (never forced — they can just close it).
 * Mounted once at the app root; renders nothing unless opened. */
export function UpdateModal() {
  const { t } = useTranslation();
  const { modalOpen, phase, version, notes, progress, error, closeModal, install } =
    useUpdater();

  if (!modalOpen) return null;

  const busy = phase === "downloading" || phase === "installed";
  const pct = progress != null ? Math.round(progress * 100) : null;

  return (
    <ModalShell
      title={
        <span className="inline-flex items-center gap-2">
          <IconSparkles size={16} className="text-accent" aria-hidden />
          {t("新しいバージョンがあります")}
        </span>
      }
      onClose={busy ? () => {} : closeModal}
      width="w-[460px]"
      closeOnEscape={!busy}
      hideClose={busy}
      footer={
        <div className="ml-auto flex items-center gap-2">
          {!busy && (
            <Button variant="ghost" onClick={closeModal}>
              {t("後で")}
            </Button>
          )}
          <Button variant="primary" onClick={install} disabled={busy}>
            <IconDownload size={15} className="mr-1.5" aria-hidden />
            {phase === "downloading"
              ? pct != null
                ? t("ダウンロード中… {{pct}}%", { pct })
                : t("ダウンロード中…")
              : phase === "installed"
                ? t("再起動しています…")
                : t("更新する")}
          </Button>
        </div>
      }
    >
      <div className="p-4 space-y-3">
        <div className="flex items-baseline gap-2 text-body">
          <span className="text-text2">{t("現在")}</span>
          <span className="tabular-nums text-text3">v{__APP_VERSION__}</span>
          <span className="text-text3" aria-hidden>
            →
          </span>
          <span className="tabular-nums font-semibold text-accent">v{version}</span>
        </div>

        {notes && (
          <div className="rounded-card border border-border bg-bg2 p-3 max-h-[38vh] overflow-y-auto">
            <div className="text-caption font-semibold uppercase tracking-wider text-text3/70 mb-1.5">
              {t("更新内容")}
            </div>
            <p className="text-body text-text2 leading-relaxed whitespace-pre-wrap">
              {notes}
            </p>
          </div>
        )}

        {phase === "downloading" && pct != null && (
          <div className="h-1.5 w-full rounded-full bg-bg3 overflow-hidden">
            <div
              className="h-full bg-accent transition-[width] duration-150"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}

        {error && (
          <p className="text-label text-danger">
            {t("更新に失敗しました。時間をおいて、もう一度お試しください。")}
          </p>
        )}
      </div>
    </ModalShell>
  );
}
