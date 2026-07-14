import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

// Flat config for the React 19 + TS + Vite frontend. Type-aware linting is on
// (projectService) so rules like no-floating-promises — which caught the silent
// auto-save failure — can see types. Rust is linted separately (cargo).
export default tseslint.config(
  {
    ignores: [
      "dist",
      "src-tauri",
      "node_modules",
      "scripts",
      "*.config.js",
      "*.config.ts",
    ],
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        // Type info is enabled so the promise rules below work; the broader
        // type-checked rule set is intentionally left off ("一応" scope).
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // Floating promises are the class of bug this setup exists to catch, but
      // `void expr` stays the sanctioned "I mean to ignore this" escape hatch.
      // (no-misused-promises is intentionally left off: it fires on every
      // idiomatic `onClick={async …}`, which is a repo-wide change beyond scope.)
      "@typescript-eslint/no-floating-promises": "error",
      // Allow underscore-prefixed throwaways (e.g. destructure-to-drop).
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["**/*.test.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-floating-promises": "off",
    },
  },
);
