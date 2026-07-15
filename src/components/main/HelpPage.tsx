import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconPlayerPlay } from "@tabler/icons-react";
import { PageHeader } from "../ui/PageHeader";
import { Button } from "../ui/Button";
import { PAGES } from "../../lib/pages";
import { useStore } from "../../store";

/** One help topic: a heading and a few plain-language bullet lines. Content is
 * kept as data (JA source strings, translated via i18n like everywhere else) so
 * it's easy to edit and reorder. */
interface HelpSection {
  title: string;
  lines: string[];
}

const SECTIONS: HelpSection[] = [
  {
    title: "はじめに",
    lines: [
      "Joy-Con 2 のボタンやスティックを、キーボード／マウスの操作に変換するアプリです。",
      "起動すると自動で接続を待ち受けます（開始を押す必要はありません）。Joy-Con 2 側面の「シンクボタン」を押すとつながり、上部にバッテリー残量が出ます。",
      "しばらく操作がないと自動で切断して Joy-Con のバッテリーを節約します。切断後もそのまま待機を続け、シンクで再接続できます（待機中は接続を保たないのでバッテリーは消費しません）。",
      "完全に止めるときは左上の「停止」を押します（もう一度押すと待機に戻ります）。",
      "左のナビでページを切り替えます：キー割り当て／保存した操作／統計／設定（＋ヘルプ）。",
    ],
  },
  {
    title: "キー割り当て",
    lines: [
      "中央の Joy-Con 図でボタンを選び、右のパネルで操作を割り当てます。",
      "押し方は「通常（タップ）」「長押し」「切替（トグル）」から選べ、連打（リピート）も設定できます。",
      "ショートカット（Ctrl+C など修飾キー付き）は、そのまま押して取り込めます。",
      "スティックはレイヤーごとにマウス化もできます。",
    ],
  },
  {
    title: "プロファイル",
    lines: [
      "前面のアプリごとに、割り当てを自動で切り替えます。",
      "プロファイルに反応アプリ（exe）を登録します。起動中のアプリからも追加できます。",
      "どのプロファイルにも一致しないアプリでは「デフォルト」が使われます。",
      "プロファイル名は一覧のダブルクリックで変更できます。",
    ],
  },
  {
    title: "レイヤー",
    lines: [
      "1 つのプロファイルに複数のレイヤーを持てます（例：通常／マウス操作）。",
      "ボタンに「レイヤー（押している間）」を割り当てると、押している間だけ別のレイヤーに切り替わります。",
      "継承は「すべて引き継ぐ」「切り替え・修飾キーだけ引き継ぐ」「独立」から選べます。",
      "レイヤー名はダブルクリックで変更できます。",
    ],
  },
  {
    title: "保存した操作",
    lines: [
      "一度作った操作を保存しておくと、いろいろなボタンから使い回せます（フォルダで整理）。毎回作り直す手間が省けます。",
      "ボタンに割り当てるとリンクされ、元の操作を編集すると割り当て先すべてに反映されます。",
      "各操作に累計の使用回数が出るので、使っていない操作を見つけて整理できます。",
    ],
  },
  {
    title: "パイメニュー",
    lines: [
      "ボタンを押しながらマウスを動かした方向で発火する、円形のメニューです。",
      "2〜8 方向＋中央（その場）に操作を割り当てられます。",
      "見た目（デザイン・色・大きさ）は設定→パイメニュー、またはパイごとに調整できます。",
    ],
  },
  {
    title: "統計",
    lines: [
      "キー割り当てページの「統計」で、ボタンの使用回数をヒートマップ表示します（今日／週／月／累計）。",
      "「保存した操作」には累計の使用回数が出ます（0 回＝まだ使っていない目印）。",
      "統計は統計ページからリセットでき、保持期間は設定→管理で設定できます。",
    ],
  },
  {
    title: "バックアップ",
    lines: [
      "バックアップは自分用（復元・別 PC への移行）を想定しています。他人との共有は前提としていません。",
      "過去の状態が自動で世代保存されます。設定→管理→「バックアップから復元」で戻せます。",
      "設定→管理の「エクスポート／インポート」で、設定・操作・プロファイル・統計を 1 ファイルにまとめて保存・復元できます。",
      "壊れたファイルは削除されず退避されるので、後から救出できます。",
    ],
  },
  {
    title: "安全性",
    lines: [
      "1 回の操作で送るのは、キー／マウスの「同時押し」だけです。キーを順番に打ち込んだり、コマンドを実行したりはしません。",
      "扱えるのは、あらかじめ許可されたキーとマウス操作に限られます。",
      "バックアップの読み込み・復元は現在の内容を置き換えるため、実行前に確認ダイアログが出ます。",
    ],
  },
];

/** Full-page usage guide. A plain, scrollable overview of every feature, reached
 * from the left nav. */
export function HelpPage({ onStartTour }: { onStartTour: () => void }) {
  const { t } = useTranslation();
  const meta = PAGES.help;
  // A page's ? button navigates here with a target section — scroll to it and
  // flash it briefly so the jump is obvious.
  const target = useStore((s) => s.helpSection);
  const [flash, setFlash] = useState<string | null>(null);
  useEffect(() => {
    if (!target) return;
    const el = document.querySelector<HTMLElement>(
      `[data-help-section="${CSS.escape(target)}"]`,
    );
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setFlash(target);
    const id = setTimeout(() => setFlash(null), 1600);
    return () => clearTimeout(id);
  }, [target]);
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader
        title={meta.label}
        desc={meta.desc}
        icon={<meta.Icon size={16} aria-hidden />}
      />
      <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-gutter:stable] p-4">
        <div className="max-w-[640px] mx-auto space-y-5">
          <div>
            <Button
              size="sm"
              variant="primary"
              onClick={onStartTour}
              className="inline-flex items-center gap-1.5"
            >
              <IconPlayerPlay size={14} aria-hidden />
              {t("使い方ツアーを始める")}
            </Button>
          </div>
          {SECTIONS.map((s) => (
            <section
              key={s.title}
              data-help-section={s.title}
              className={
                "scroll-mt-2 rounded-card transition-colors " +
                (flash === s.title ? "bg-accent/10 -mx-2 px-2 py-1" : "")
              }
            >
              <h3 className="text-body font-semibold text-accent mb-1">
                {t(s.title)}
              </h3>
              <ul className="space-y-1">
                {s.lines.map((line, i) => (
                  <li
                    key={i}
                    className="text-body text-text2 leading-relaxed flex gap-1.5"
                  >
                    <span aria-hidden className="text-text3 shrink-0">
                      ・
                    </span>
                    <span className="min-w-0">{t(line)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
