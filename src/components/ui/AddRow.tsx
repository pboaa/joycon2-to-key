import { useTranslation } from "react-i18next";
import { IconPlus } from "@tabler/icons-react";

/** A faint "＋ add …" row shown at the bottom of a list — the add affordance
 * lives here now (not a top-right button). Dim until hovered. */
export function AddRow({
  label,
  onClick,
}: {
  /** i18n source key, e.g. "レイヤーを追加". */
  label: string;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      className="w-full inline-flex items-center gap-1.5 px-2 py-1.5 rounded-row text-body text-text3/70 hover:text-accent hover:bg-bg3 transition-colors"
    >
      <IconPlus size={14} aria-hidden />
      {t(label)}
    </button>
  );
}
