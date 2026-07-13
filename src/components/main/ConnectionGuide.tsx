import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IconBluetooth, IconX } from "@tabler/icons-react";
import { useStore } from "../../store";

const DISMISS_KEY = "joycon.connGuideDismissed";

/** First-run connection hint on the key-assignment page: explains how to pair
 * (the sync button) and that mapping works even while disconnected. Shows only
 * while not connected; a ✕ dismisses it for good (localStorage). It's a slim
 * banner — not an overlay — so it never blocks the figure below it. */
export function ConnectionGuide() {
  const { t } = useTranslation();
  const cs = useStore((s) => s.connectionState);
  const [dismissed, setDismissed] = useState(
    () => !!localStorage.getItem(DISMISS_KEY),
  );
  if (cs === "connected" || dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="shrink-0 mx-2 mt-2 flex items-start gap-2.5 rounded-card border border-accent/30 bg-accent/8 px-3 py-2">
      <IconBluetooth size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden />
      <div className="min-w-0 flex-1 space-y-0.5 text-label leading-relaxed">
        <p className="font-semibold text-text">{t("Joy-Con 2 を接続するには")}</p>
        <p className="text-text2">
          {t(
            "Joy-Con 2 側面の丸い「シンクボタン」を長押しすると接続します。左上が「待機中…」の間は接続を待っています。",
          )}
        </p>
        <p className="text-text3">
          {t("接続していなくても、下の図でボタンに割り当てを設定できます。")}
        </p>
      </div>
      <button
        onClick={dismiss}
        aria-label={t("閉じる")}
        data-tip={t("今後表示しない")}
        className="-mr-1 shrink-0 rounded-row p-1 text-text3 transition-colors hover:bg-bg3 hover:text-text"
      >
        <IconX size={14} aria-hidden />
      </button>
    </div>
  );
}
