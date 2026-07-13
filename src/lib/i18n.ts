import { useEffect } from "react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import type { Language } from "./types";
import { en } from "./locales/en";
import { ja } from "./locales/ja";

/** Resolve to a concrete locale. "system" is English only when the OS/browser
 * language starts with "en"; otherwise Japanese (the app's default). */
export function resolveLanguage(lang: Language): "ja" | "en" {
  if (lang === "ja" || lang === "en") return lang;
  const nav = typeof navigator !== "undefined" ? navigator.language : "ja";
  return nav.toLowerCase().startsWith("en") ? "en" : "ja";
}

// Japanese-source-key scheme: the key IS the Japanese source text. `ja` has no
// dictionary (the fallback returns the key as-is); only the `en` dictionary holds
// the Japanese→English mapping. keySeparator / nsSeparator are disabled so a "."
// or ":" inside Japanese text isn't mistaken for a key separator.
void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ja: { translation: ja } },
  lng: resolveLanguage("system"),
  fallbackLng: "ja",
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
  returnNull: false,
});

/** Keep i18next's active language in sync with the chosen setting. */
export function useLanguage(lang: Language): void {
  useEffect(() => {
    void i18n.changeLanguage(resolveLanguage(lang));
  }, [lang]);
}

export default i18n;
