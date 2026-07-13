import { useEffect } from "react";
import { TitleBar } from "./components/TitleBar";
import { MainScreen } from "./MainScreen";
import { ConfirmProvider } from "./components/Confirm";
import { TooltipHost } from "./components/TooltipHost";
import { ToastHost } from "./components/ui/ToastHost";
import { useJoyCon } from "./lib/useJoyCon";
import { useDragScroll } from "./lib/useDragScroll";
import { useReorderDropTarget } from "./lib/useDragReorder";
import { bootstrapStore } from "./store";

export default function App() {
  useEffect(() => {
    void bootstrapStore();
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
    </ConfirmProvider>
  );
}
