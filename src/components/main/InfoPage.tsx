import { useTranslation } from "react-i18next";
import {
  IconAlertTriangle,
  IconDeviceGamepad2,
  IconSparkles,
} from "@tabler/icons-react";
import { PageHeader } from "../ui/PageHeader";
import { Button } from "../ui/Button";
import { PAGES } from "../../lib/pages";
import { canCheckUpdate, hasPendingUpdate, useUpdater } from "../../lib/useUpdater";
import { toast } from "../../lib/toast";
import changelogData from "../../lib/changelog.json";

/** Up-front disclaimer: this is a trial build, provided as-is. */
const DISCLAIMER = [
  "これはテスト・試用版です。コードに悪意はありませんが、無保証・自己責任でご利用ください。",
  "本ソフトの使用によって生じた損害について、作者は責任を負いません。",
  "更新や不具合の修正を約束するものではありません。",
];

/** Update history — edited in `src/lib/changelog.json` (newest version first).
 * Notes are author-written per release and kept per language (ja / en); the UI
 * shows the current language, falling back to Japanese. */
type ChangelogEntry = {
  version: string;
  date?: string;
  notes: { ja: string[]; en?: string[] };
};
const CHANGELOG = changelogData as ChangelogEntry[];

/** About page: app identity, version, disclaimer, and the update history. Split
 * from Help so Help stays focused on how-to and this holds the "what / caveats /
 * what changed" story. */
export function InfoPage() {
  const { t, i18n } = useTranslation();
  const lang: "ja" | "en" = i18n.language.startsWith("en") ? "en" : "ja";
  const meta = PAGES.info;
  const updatePending = useUpdater(hasPendingUpdate);
  const newVersion = useUpdater((s) => s.version);
  const openUpdate = useUpdater((s) => s.openModal);
  const checking = useUpdater((s) => s.phase === "checking");
  const onCheck = async () => {
    const r = await useUpdater.getState().checkNow();
    if (r === "available") useUpdater.getState().openModal();
    else if (r === "uptodate") toast.success(t("お使いのバージョンは最新です。"));
    else if (r === "error") toast.error(t("更新を確認できませんでした。"));
  };
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader
        title={meta.label}
        desc={meta.desc}
        icon={<meta.Icon size={16} aria-hidden />}
      />
      <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-gutter:stable] p-4">
        <div className="max-w-[640px] mx-auto space-y-5">
          {/* An available update, surfaced (not forced): read the notes / update
              from the modal. */}
          {updatePending && (
            <section className="rounded-card border border-accent/40 bg-accent/10 p-3 flex items-center gap-3">
              <IconSparkles size={18} className="shrink-0 text-accent" aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="text-body font-semibold text-text">
                  {t("新しいバージョン v{{version}} があります", {
                    version: newVersion ?? "",
                  })}
                </div>
                <div className="text-caption text-text3">
                  {t("更新は任意です。内容を確認してから更新できます。")}
                </div>
              </div>
              <Button variant="primary" size="sm" onClick={openUpdate}>
                {t("更新内容を見る")}
              </Button>
            </section>
          )}

          {/* Identity + version, then the up-front disclaimer. */}
          <section className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="shrink-0 w-9 h-9 rounded-card bg-bg3 text-accent inline-flex items-center justify-center">
                <IconDeviceGamepad2 size={20} aria-hidden />
              </span>
              <div className="min-w-0">
                <div className="text-body font-semibold text-text">JoyCon2 to Key</div>
                <div className="text-caption text-text3 tabular-nums">
                  v{__APP_VERSION__}
                </div>
              </div>
              {canCheckUpdate() && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="ml-auto shrink-0"
                  onClick={onCheck}
                  disabled={checking}
                >
                  {checking ? t("確認中…") : t("更新を確認")}
                </Button>
              )}
            </div>
            <div className="rounded-card border border-amber-500/40 bg-amber-500/10 p-3 flex gap-2">
              <IconAlertTriangle
                size={15}
                className="shrink-0 text-amber-500 mt-0.5"
                aria-hidden
              />
              <div className="space-y-1 text-label text-text2 leading-relaxed">
                {DISCLAIMER.map((line, i) => (
                  <p key={i}>{t(line)}</p>
                ))}
              </div>
            </div>
          </section>

          {/* Update history. */}
          <section className="space-y-2">
            <h3 className="text-body font-semibold text-accent mb-1">
              {t("更新履歴")}
            </h3>
            <ul className="space-y-3">
              {CHANGELOG.map((e) => (
                <li key={e.version}>
                  <div className="flex items-baseline gap-2">
                    <span className="text-label font-semibold text-text tabular-nums">
                      v{e.version}
                    </span>
                    {e.date && (
                      <span className="text-caption text-text3 tabular-nums">
                        {e.date}
                      </span>
                    )}
                  </div>
                  <ul className="mt-0.5 space-y-0.5">
                    {(e.notes[lang] ?? e.notes.ja).map((n, i) => (
                      <li
                        key={i}
                        className="text-body text-text2 leading-relaxed flex gap-1.5"
                      >
                        <span aria-hidden className="text-text3 shrink-0">
                          ・
                        </span>
                        <span className="min-w-0">{n}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>

          {/* Trademark / non-affiliation notice (also in the README). */}
          <p className="text-caption text-text3 leading-relaxed border-t border-border pt-3">
            {t(
              "非公式の個人プロジェクトです。任天堂株式会社とは無関係で、「Nintendo Switch」「Joy-Con」などは各権利者の商標です。",
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
