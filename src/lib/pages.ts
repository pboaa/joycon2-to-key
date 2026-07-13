import { IconAppWindow, IconChartBar, IconDeviceGamepad2, IconHelpCircle, IconInfoCircle, IconLibrary, IconSettings, type TablerIcon } from "@tabler/icons-react";
import type { AppPage } from "../store";

/** One source of truth for each top-level page's label, one-line description and
 * icon, so the left nav and the page's own header can't drift apart (they used
 * to declare the icon/label twice — a change to one silently unmatched the
 * other). Strings are i18n source keys. IconSettings' header is tab-driven, so its
 * `desc` here is only the nav entry's (unused) fallback. */
export interface PageMeta {
  label: string;
  desc: string;
  Icon: TablerIcon;
}

export const PAGES: Record<AppPage, PageMeta> = {
  keys: {
    label: "キー割り当て",
    desc: "Joy-Con のボタンに、キー入力や操作を割り当てます。",
    Icon: IconDeviceGamepad2,
  },
  profiles: {
    label: "プロファイル",
    desc: "前面のアプリごとに、割り当てを自動で切り替えます。",
    Icon: IconAppWindow,
  },
  defs: {
    label: "保存した操作",
    desc: "一度作った操作を保存して、いろいろなボタンで使い回せます。",
    Icon: IconLibrary,
  },
  stats: {
    label: "統計",
    desc: "どのボタンをどれだけ使ったかを回数とヒートマップで確認します。",
    Icon: IconChartBar,
  },
  settings: { label: "設定", desc: "", Icon: IconSettings },
  help: {
    label: "ヘルプ",
    desc: "使い方をまとめて確認できます。",
    Icon: IconHelpCircle,
  },
  info: {
    label: "情報",
    desc: "バージョン・更新履歴・注意事項など、このアプリについて。",
    Icon: IconInfoCircle,
  },
};

/** Left-nav groups: a small category header over an ordered set of pages.
 * Settings is pinned last (in the final group). Help / Info live in the nav's
 * bottom footer (see AppNav), not in a group. */
export const NAV_GROUPS: { header: string; pages: AppPage[] }[] = [
  // The profile page was removed; profiles are edited via the rail row's ⚙️ → settings modal.
  { header: "割り当て", pages: ["keys", "defs"] },
  { header: "分析", pages: ["stats"] },
  { header: "その他", pages: ["settings"] },
];

/** Meta destinations pinned to the bottom of the nav (above the version). */
export const NAV_FOOTER_PAGES: AppPage[] = ["help", "info"];
