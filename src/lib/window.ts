import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";

/** Default main-window size — keep in sync with `src-tauri/tauri.conf.json`. */
export const DEFAULT_WINDOW_SIZE = { width: 960, height: 660 };

/** Reset the current window to the default size and re-centre it (a rescue for
 * when the window has been dragged/resized somewhere awkward). */
export async function resetWindowSize(): Promise<void> {
  const w = getCurrentWindow();
  await w.setSize(
    new LogicalSize(DEFAULT_WINDOW_SIZE.width, DEFAULT_WINDOW_SIZE.height),
  );
  await w.center();
}
