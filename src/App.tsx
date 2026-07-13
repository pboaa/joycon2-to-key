import { useEffect } from "react";
import { TitleBar } from "./components/TitleBar";
import { MainScreen } from "./MainScreen";
import { ConfirmProvider } from "./components/Confirm";
import { TooltipHost } from "./components/TooltipHost";
import { ToastHost } from "./components/ui/ToastHost";
import { UpdateModal } from "./components/UpdateModal";
import { useJoyCon } from "./lib/useJoyCon";
import { useDragScroll } from "./lib/useDragScroll";
import { useReorderDropTarget } from "./lib/useDragReorder";
import { useUpdater } from "./lib/useUpdater";
import { bootstrapStore } from "./store";

export default function App() {
  useEffect(() => {
    void bootstrapStore();
  }, []);
  // Silent check for a newer signed build on launch. Surfaces a nav badge if
  // one exists; never interrupts (no auto-open, no auto-install).
  useEffect(() => {
    void useUpdater.getState().checkOnStartup();
  }, []);
  // Desktop-app feel: never show the browser's own right-click menu (Reload /
  // Inspect / …). The app's own context menus open from their onContextMenu
  // handlers, which fire regardless of this preventDefault.
  useEffect(() => {
    const onCtx = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", onCtx);
    return () => document.removeEventListener("contextmenu", onCtx);
  }, []);
  const joyCon = useJoyCon();
  useDragScroll();
  useReorderDropTarget();

  return (
    <ConfirmProvider>
      <div className="h-full w-full flex flex-col bg-bg text-text ">
        <TitleBar />
        <MainScreen joyCon={joyCon} />
      </div>
      <ToastHost />
      <TooltipHost />
      <UpdateModal />
    </ConfirmProvider>
  );
}
