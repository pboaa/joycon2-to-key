import React from "react";
import ReactDOM from "react-dom/client";
import { getCurrentWindow } from "@tauri-apps/api/window";
import App from "./App";
import { PieOverlay } from "./PieOverlay";
import "./lib/i18n";
import "./index.css";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

// The pie-menu overlay runs in its own window (same bundle). Branch on
// the window label so it renders only the transparent overlay — none of the
// main app's store/polling/hooks — and force the body background transparent
// (index.css paints an opaque bg for the main window).
let label = "main";
try {
  label = getCurrentWindow().label;
} catch {
  // Not running under Tauri (e.g. plain vite) — treat as the main window.
}

if (label === "pie-overlay") {
  document.documentElement.style.background = "transparent";
  document.body.style.background = "transparent";
  root.render(<PieOverlay />);
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
