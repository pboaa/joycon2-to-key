import { defineConfig } from "vitest/config";

// pure ロジック（lib/config, reorder, variants, uniqueName, batteryPercent 等）
// 専用の最小構成。UI/DOM は対象外なので node 環境で走らせ、tauri 向けの
// vite.config（react/tailwind プラグイン）は読み込まない。
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
