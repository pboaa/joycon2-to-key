import { useTranslation } from "react-i18next";

/** The "actual-size preview" toggle button, shared by Settings→Pie, the per-pie
 * style tab and the detail modal so the wording and skin never drift. The
 * preview state itself lives in the caller (it owns the overlay push effect). */
export function PiePreviewToggle({
  on,
  onToggle,
}: {
  on: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  return (
    <button
      onClick={onToggle}
      data-tip={t("実寸のパイを画面に表示して確認")}
      className={
        "w-full py-2 rounded-row border text-body font-semibold transition-colors " +
        (on
          ? "bg-accent text-white border-accent"
          : "bg-accent/10 text-accent border-accent hover:bg-accent hover:text-white")
      }
    >
      {on ? t("プレビューを閉じる") : t("実寸プレビュー")}
    </button>
  );
}
