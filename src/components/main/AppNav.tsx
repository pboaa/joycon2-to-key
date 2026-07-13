import { useTranslation } from "react-i18next";
import type { ConnectionState } from "../../lib/types";
import { NAV_FOOTER_PAGES, NAV_GROUPS, PAGES } from "../../lib/pages";
import { type AppPage } from "../../store";
import { ConnectionToggle } from "./ConnectionToggle";

export type { AppPage };

/** Persistent left navigation rail: a slim header (connection toggle, mirroring
 * the right page header's top band) over the page switcher. The app name/logo
 * and battery live in the title bar. */
export function AppNav({
  page,
  onNavigate,
  connectionState,
  onConnect,
  onDisconnect,
}: {
  page: AppPage;
  onNavigate: (p: AppPage) => void;
  connectionState: ConnectionState;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="shrink-0 w-[168px] h-full flex flex-col border-r border-border bg-bg2">
      {/* Slim header: just the connection status / start-stop toggle. Mirrors
          the right page header's top band (border-b), filling the space the app
          name/logo would otherwise occupy (those live in the title bar). */}
      <div
        data-tour="connect"
        className="shrink-0 px-2 py-1.5 border-b border-border/60 flex [&>button]:w-full [&>button]:justify-center"
      >
        <ConnectionToggle
          connectionState={connectionState}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 flex flex-col gap-0.5">
        {NAV_GROUPS.map((g, gi) => (
          <div key={g.header} className={gi > 0 ? "mt-2" : ""}>
            <div className="px-2 pt-0.5 pb-1 text-caption font-semibold uppercase tracking-wider text-text3/70 select-none">
              {t(g.header)}
            </div>
            <div className="flex flex-col gap-0.5">
              {g.pages.map((id) => {
                const meta = PAGES[id];
                return (
                  <button
                    key={id}
                    data-tour={`nav-${id}`}
                    onClick={() => onNavigate(id)}
                    className={
                      "shrink-0 h-9 w-full rounded-row text-body inline-flex items-center text-left gap-2 px-2 transition-colors " +
                      (page === id
                        ? "bg-bg3 text-accent font-medium"
                        : "text-text2 hover:bg-bg3 hover:text-text")
                    }
                  >
                    <meta.Icon size={15} strokeWidth={2} className="shrink-0" aria-hidden />
                    {t(meta.label)}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Meta destinations (ヘルプ・情報) pinned to the bottom of the nav list,
            as full-width tabs like the groups. The version rides on the last
            tab's row (Info) — no divider. */}
        <div className="mt-auto pt-1 flex flex-col gap-0.5">
          {NAV_FOOTER_PAGES.map((id, i) => {
            const meta = PAGES[id];
            const on = page === id;
            const last = i === NAV_FOOTER_PAGES.length - 1;
            const button = (
              <button
                key={id}
                data-tour={`nav-${id}`}
                onClick={() => onNavigate(id)}
                className={
                  "shrink-0 h-9 rounded-row text-body inline-flex items-center text-left gap-2 px-2 transition-colors " +
                  (last ? "flex-1 min-w-0 " : "w-full ") +
                  (on
                    ? "bg-bg3 text-accent font-medium"
                    : "text-text2 hover:bg-bg3 hover:text-text")
                }
              >
                <meta.Icon size={15} strokeWidth={2} className="shrink-0" aria-hidden />
                {t(meta.label)}
              </button>
            );
            return last ? (
              <div key={`${id}-row`} className="flex items-center gap-1.5">
                {button}
                <span className="shrink-0 pr-1 text-caption text-text3/50 select-none tabular-nums">
                  v{__APP_VERSION__}
                </span>
              </div>
            ) : (
              button
            );
          })}
        </div>
      </div>
    </div>
  );
}
