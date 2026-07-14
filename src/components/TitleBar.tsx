import { getCurrentWindow } from "@tauri-apps/api/window";
import { useTranslation } from "react-i18next";
import { releaseAllInputs } from "../lib/tauri";
import { flush, useStore } from "../store";
import { BatteryLine } from "./main/BatteryLine";
import { ActiveProfileChip } from "./main/ActiveProfileChip";
import appIcon from "../assets/app-icon.png";

async function closeWindow() {
  try {
    // Save any edits still sitting in the 400ms debounce window — otherwise
    // "change one thing and close" silently loses that change.
    if (useStore.getState().loaded) await flush();
  } catch {
    // best-effort; closing must not be blocked by a failed save
  }
  try {
    await releaseAllInputs();
  } catch {
    // best-effort safety release
  }
  try {
    await getCurrentWindow().destroy();
  } catch (e) {
    console.warn("window destroy failed:", e);
  }
}

/** Custom draggable title bar (window decorations are disabled): window
 * identity + battery readout on the left, window controls on the right. The
 * connection toggle lives in the left nav footer. */
export function TitleBar() {
  const { t } = useTranslation();
  const showBattery = useStore((s) => s.settings.titlebarBattery);
  return (
    <nav
      data-tauri-drag-region
      className="flex items-center justify-between border-b border-border bg-bg2 px-1.5 py-1 shadow-sm shrink-0"
    >
      <div data-tauri-drag-region className="flex items-center gap-2">
        <img
          src={appIcon}
          alt=""
          data-tauri-drag-region
          className="translate-x-0.5 translate-y-px w-4 h-4 rounded-[3px] shrink-0 select-none pointer-events-none"
        />
        <span
          data-tauri-drag-region
          className="text-heading font-semibold leading-none select-none"
        >
          JoyCon2 to Key
        </span>
        {showBattery && <BatteryLine />}
        <ActiveProfileChip />
      </div>
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => getCurrentWindow().minimize().catch(() => { })}
          data-tip={t("最小化")}
          aria-label={t("最小化")}
          className="w-6 h-6 flex items-center justify-center rounded-row hover:bg-bg3 text-text2 "
        >
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <rect x="0" y="4.5" width="10" height="1" fill="currentColor" />
          </svg>
        </button>
        <button
          onClick={closeWindow}
          data-tip={t("閉じる")}
          aria-label={t("閉じる")}
          className="w-6 h-6 flex items-center justify-center rounded-row hover:bg-bg3 text-text2 "
        >
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <g transform="rotate(45 5 5)">
              <rect x="0" y="4.5" width="10" height="1" fill="currentColor" />
              <rect x="4.5" y="0" width="1" height="10" fill="currentColor" />
            </g>
          </svg>
        </button>
      </div>
    </nav>
  );
}
