import { useTranslation } from "react-i18next";
import { IconPlayerPlay, IconSquare } from "@tabler/icons-react";
import { type ConnectionState } from "../../lib/types";

/** One control that *is* the connection status: colour + label show the state,
 * clicking toggles connect / disconnect. Pairs with the title bar's LED. */
export function ConnectionToggle({
  connectionState: cs,
  onConnect,
  onDisconnect,
}: {
  connectionState: ConnectionState;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const { t } = useTranslation();
  const base =
    "h-7 inline-flex items-center gap-1.5 px-3 rounded-row text-body transition-colors border shrink-0";

  if (cs === "disconnected") {
    return (
      <button
        onClick={onConnect}
        className={`${base} font-semibold bg-accent text-white border-accent hover:bg-accent2 hover:border-accent2`}
      >
        <IconPlayerPlay size={13} aria-hidden />
        {t("開始")}
      </button>
    );
  }
  if (cs === "reconnecting") {
    return (
      <button
        onClick={onDisconnect}
        data-tip={t("停止")}
        className={`${base} font-medium bg-amber-500/15 text-warn border-amber-500/40 hover:bg-amber-500/25`}
      >
        <span className="w-2 h-2 rounded-full bg-amber-500" aria-hidden="true" />
        {t("待機中…")}
      </button>
    );
  }
  // Connected: green status; hover morphs into a red "Stop" so the action is
  // unambiguous without a second button.
  return (
    <button
      onClick={onDisconnect}
      className={`group ${base} font-medium bg-emerald-500/15 text-ok border-emerald-500/40 hover:bg-danger hover:text-white hover:border-danger`}
    >
      <span className="inline-flex items-center gap-1.5 group-hover:hidden">
        <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
        {t("接続中")}
      </span>
      <span className="hidden items-center gap-1.5 group-hover:inline-flex">
        <IconSquare size={11} aria-hidden />
        {t("停止")}
      </span>
    </button>
  );
}
