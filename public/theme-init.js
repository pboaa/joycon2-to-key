// Apply the theme before first paint to avoid a flash. The source of truth is
// workspace.json (loaded async); localStorage caches the last choice (id +
// resolved dark flag) so it paints instantly on launch. useTheme reconciles
// both once settings load. Theme-agnostic: no theme names are hard-coded here
// except the built-in system → light/dark.
//
// Kept as an external file (not inline) so the CSP can use a strict
// `script-src 'self'` without allowing inline scripts.
(function () {
  try {
    var el = document.documentElement;
    var t = localStorage.getItem("theme");
    var dark;
    if (t && t !== "system") {
      el.dataset.theme = t;
      dark = localStorage.getItem("theme-dark") === "1";
    } else {
      dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      el.dataset.theme = dark ? "dark" : "light";
    }
    el.classList.toggle("dark", dark);
    // Pre-paint an approximate background so the window doesn't flash white
    // before index.css loads (in dev it's a late JS module; in prod a linked
    // sheet, but this still removes the last sliver of flash). Matches the
    // default dark/light --bg; index.css reconciles the exact per-theme colour.
    // The pie-overlay window overrides this to transparent in main.tsx, and it
    // stays hidden until then, so the opaque paint is never visible there.
    el.style.background = dark ? "#16161c" : "#f5f5f8";
    // Pre-paint UI text scale (typography tokens multiply by --ui-scale).
    var us = parseFloat(localStorage.getItem("uiScale"));
    if (us > 0 && us !== 1) el.style.setProperty("--ui-scale", String(us));
  } catch (e) {}
})();
