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
    if (t && t !== "system") {
      el.dataset.theme = t;
      el.classList.toggle("dark", localStorage.getItem("theme-dark") === "1");
    } else {
      var dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      el.dataset.theme = dark ? "dark" : "light";
      el.classList.toggle("dark", dark);
    }
    // Pre-paint UI text scale (typography tokens multiply by --ui-scale).
    var us = parseFloat(localStorage.getItem("uiScale"));
    if (us > 0 && us !== 1) el.style.setProperty("--ui-scale", String(us));
  } catch (e) {}
})();
