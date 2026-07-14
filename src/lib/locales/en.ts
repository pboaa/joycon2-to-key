/**
 * English translations, keyed by the Japanese source text (Japanese-source-key scheme).
 * The app's default language is Japanese, so the `ja` locale needs no dictionary
 * — i18next returns the key (= the Japanese text) as-is. Only English overrides
 * live here. Interpolation uses `{{name}}` placeholders that must match the key.
 *
 * Filled incrementally per UI area. Keys not present here fall back to Japanese
 * even in English mode (safe during the rollout).
 */
export const en: Record<string, string> = {
  // ── Image icon (errors) ──
  "PNG や JPEG などの画像を選んでください（SVG は不可）。":
    "Please choose an image such as PNG or JPEG (SVG is not supported).",
  "画像を読み込めませんでした。": "Couldn't load the image.",
  "画像を処理できませんでした。": "Couldn't process the image.",
  // ── Common ──
  バッテリー未取得: "No battery reading yet",
  切断時の値: "Value at disconnect",
  "入力待ち…（ショートカットも押せます）":
    "Waiting for input… (shortcuts work too)",
  追加: "Add",
  削除: "Delete",
  キャンセル: "Cancel",
  OK: "OK",
  元に戻す: "Undo",
  今後表示しない: "Don't show again",
  このページのヘルプ: "Help for this page",
  使用中のボタン: "Assigned to",
  最近使った操作: "Recently used",
  最近使った: "Recently used",
  このボタンを編集: "Edit this button",
  現在有効なプロファイル: "Active profile",
  文字サイズ: "Text size",
  標準: "default",
  "描画・ペン": "Draw & pens",
  "選択・変形": "Select & transform",
  "パス・図形": "Paths & shapes",
  "表示・ナビ": "View & navigate",
  "編集・履歴": "Edit & history",
  文字: "Text",
  "メディア・再生": "Media & playback",
  "矢印・方向": "Arrows & direction",
  "ツール・記号": "Tools & symbols",
  "ファイル・その他": "File & other",
  "未使用（割り当て済み）": "Unused (assigned)",
  "この期間はすべて使われています。": "Everything was used in this period.",
  スタイルプリセット: "Style presets",
  このプリセットを適用: "Apply this preset",
  "このスタイルを保存（名前）": "Save this style (name)",
  "押したキー・マウス・スクロールをそのまま取り込みます":
    "Captures the key, mouse or scroll you press, as-is",
  "どのボタンにも割り当てられていません。": "Not assigned to any button.",
  "Joy-Con 2 を接続するには": "How to connect your Joy-Con 2",
  "Joy-Con 2 側面の丸い「シンクボタン」を長押しすると接続します。左上が「待機中…」の間は接続を待っています。":
    "Hold the round Sync button on the side of the Joy-Con 2 to connect. While the top-left shows “Waiting…”, it's waiting to pair.",
  "接続していなくても、下の図でボタンに割り当てを設定できます。":
    "You can set up button assignments on the figure below even without a connection.",
  "「{{name}}」を削除しました": "Deleted “{{name}}”",
  "フォルダ「{{name}}」を削除しました": "Deleted folder “{{name}}”",
  "レイヤー「{{name}}」を削除しました": "Deleted layer “{{name}}”",
  "プロファイル「{{name}}」を削除しました": "Deleted profile “{{name}}”",
  割り当てをクリアしました: "Assignment cleared",
  上書きしました: "Overwritten",
  // ── Language ──
  言語: "Language",
  "システムに合わせる": "Follow system",
  日本語: "Japanese",
  英語: "English",

  // ── Title bar / connection state ──
  接続中: "Connected",
  "待機中…": "Waiting…",
  最小化: "Minimize",
  閉じる: "Close",
  開始: "Start",
  停止: "Stop",
  操作: "Action",
  設定: "Settings",
  ヘルプ: "Help",
  情報: "Info",
  このアプリについて: "About this app",
  更新履歴: "Changelog",
  "非公式の個人プロジェクトです。任天堂株式会社とは無関係で、「Nintendo Switch」「Joy-Con」などは各権利者の商標です。":
    "An unofficial personal project, not affiliated with Nintendo Co., Ltd. “Nintendo Switch”, “Joy-Con”, and other names are trademarks of their respective owners.",
  // ── Left-nav category headers ──
  割り当て: "Assign",
  分析: "Analyze",
  その他: "More",
  "使い方をまとめて確認できます。": "A rundown of how to use the app.",
  "バージョン・更新履歴・注意事項など、このアプリについて。":
    "About this app: version, changelog, and notices.",
  使い方ツアーを始める: "Start the guided tour",
  次へ: "Next",
  戻る: "Back",
  完了: "Done",
  スキップ: "Skip",

  // ── Battery ──
  "参考残量: 約{{pct}}%（充電/消費で変動）": "Est. charge: ~{{pct}}% (varies with load)",
  "約{{pct}}%": "~{{pct}}%",
  "前面のアプリごとに、割り当てを自動で切り替えます。":
    "Switches assignments automatically per foreground app.",
  "レイヤー設定": "Layer settings",
  プロファイル設定: "Profile settings",
  充電中: "Charging",
  放電中: "Discharging",
  "温度: {{temp}}℃": "Temp: {{temp}}℃",
  "電流: {{current}}mA": "Current: {{current}}mA",

  // ── Side panel ──
  プロファイル: "Profile",
  レイヤー: "Layer",
  管理: "Manage",
  "{{title}}を管理": "Manage {{title}}",
  初期: "Base",

  // ── Common UI ──
  "ドラッグで並べ替え": "Drag to reorder",
  "{{label}} を表示": "Show {{label}}",

  // ── Settings: tabs / common ──
  一般: "General",
  入力: "Input",
  "デバイス・通知": "Device & alerts",
  "この項目を既定に戻す": "Reset this item to default",
  既定: "Default",
  デフォルト: "Default",

  // ── Settings: theme / colours ──
  "テーマ・色": "Theme & colors",
  テーマ: "Theme",
  "Joy-Con の色（左）": "Joy-Con color (L)",
  "Joy-Con の色（右）": "Joy-Con color (R)",
  "割り当て済みの色": "Assigned color",
  "色を選ぶ": "Pick a color",
  ライト: "Light",
  ダーク: "Dark",
  抹茶猫: "Matcha Cat",
  初雪: "First Snow",

  // ── Settings: input ──
  "移動量(px)": "movement (px)",
  "ボタンを押しながらマウスを動かした方向で発火します。":
    "Fires in the direction you move the mouse while holding the button.",
  スクロール量: "Scroll amount",
  "連打の既定間隔": "Default repeat interval",
  ms: "ms",
  "スティックのデッドゾーン": "Stick deadzone",
  "%・中心の遊び": "%・center play",
  "パイメニューを表示する": "Show the pie menu",
  "パイメニュー共通の見た目と動作。": "Shared look and behaviour of the pie menu.",
  "ボタンを押しながらマウスを動かした方向で発火します。見た目は全パイ共通の既定です。":
    "Fires in the direction you move the mouse while holding the button. The look is the default shared by all pies.",
  "形・サイズ": "Shape & size",
  色: "Color",
  既定の色: "Default color",
  ラベル: "Label",
  実寸でプレビュー: "Preview at actual size",
  プレビューを閉じる: "Close preview",
  "オフにしてもパイメニューは発火します（画面上のパイだけを隠します）。":
    "Pie menus still fire when off — only the on-screen pie is hidden.",
  大きさ: "Size",
  背景色: "Background color",
  背景の透明度: "Background opacity",
  "%（0で完全透過）": "% (0 = fully transparent)",
  プリセット: "Presets",
  "詳細設定（プリセットを微調整）": "Advanced (fine-tune the preset)",
  チップ: "Chips",
  "方向ごとに枠付きラベル（Blender風）": "A framed label per direction (Blender-style)",
  "チップ（Blender風）": "Chips (Blender-style)",
  "パイ（藍）": "Pie (indigo)",
  ネオン: "Neon",
  モノクロ: "Monochrome",
  "文字だけ": "Text only",
  ソフト: "Soft",
  ビビッド: "Vivid",
  ハイライト色: "Highlight color",
  "ハイライトの透明度": "Highlight opacity",
  文字の色: "Text color",
  線: "Lines",
  線の透明度: "Line opacity",
  線のスタイル: "Line style",
  実線: "Solid",
  破線: "Dashed",
  点線: "Dotted",
  "セグメントの境界に線を引きます。": "Draw a line at each segment boundary.",
  閾値の円: "Threshold circle",
  "閾値の円を表示する": "Show the threshold circle",
  "閾値の円の色": "Threshold circle color",
  "中心付近の「その場」判定の目安になる円。オフで消せます。":
    "The circle marking the “in place” zone near the center. Turn it off to hide it.",
  "%（0で非表示）": "% (0 = hidden)",
  "方向の点を表示する": "Show direction dots",
  "未設定や、ラベルの出ていない方向に表示される点。オフにすると点を消せます（指している方向の目印は残ります）。":
    "Dots shown for unassigned or unlabeled directions. Turn them off to hide them (the marker for the direction you're pointing at stays).",
  "操作ラベルを表示する": "Show action labels",
  "現在の方向だけラベル": "Label current direction only",
  "今指している方向だけ文字を表示（他は点）。ラベルの重なりを防げます。":
    "Show text only for the direction you're pointing at (others stay dots) — avoids overlapping labels.",
  "オフのときは方向の点だけを表示します。":
    "When off, only direction dots are shown.",
  "区切り線を表示する": "Show dividers",
  デザイン: "Design",
  リング: "Ring",
  パイ: "Pie",
  ミニマル: "Minimal",
  フェード: "Fade",
  放射: "Radial",
  アクティブ: "Active",
  // ── Pie menu / library ──
  パイメニュー: "Pie menu",
  方向: " dir",
  ヒートマップ: "Heatmap",
  "ボタンの使用回数を色で表示": "Show button usage as colours",
  "使用回数をリセット": "Reset usage counts",
  期間: "Period",
  "使用回数のリセット": "Reset usage counts",
  "記録した使用回数をすべて消去しますか？": "Clear all recorded usage counts?",
  "このボタンの使用回数をリセット": "Reset this button's usage",
  "このボタンの記録した使用回数を消去しますか？": "Clear this button's recorded usage counts?",
  リセット: "Reset",
  回数: "Count",
  使用回数: "Usage",
  中央: "Center",
  発火回数: "Activations",
  方向別の使用回数: "Usage by direction",
  "図のボタンを選ぶと、使用回数が表示されます。":
    "Pick a button on the figure to see its usage.",
  "まだ発火の記録がありません。": "No activations recorded yet.",
  今日: "Today",
  週: "Week",
  月: "Month",
  累計: "All",
  パイの閾値: "Pie threshold",
  "表示言語・テーマ配色・放置時の自動停止など。":
    "Language, theme colours, idle auto-stop, and more.",
  ウインドウ: "Window",
  "ウインドウを見失ったときや大きさが崩れたときに、既定のサイズ（960×660）に戻して中央に配置します。":
    "Restore the default size (960×660) and re-centre the window — handy if it's been lost off-screen or resized awkwardly.",
  "ウインドウサイズを既定に戻す": "Reset window size",
  "キー送出やスクロールなどの既定値。": "Defaults for key output, scrolling, and more.",
  表示言語: "Display language",
  "電池較正・LED・接続時のお知らせ（音・振動）。":
    "Battery calibration, LEDs, and connection alerts (sound and haptics).",
  "バックアップの入出力・統計の保持・初期化。":
    "Backup import / export, stats retention, and reset.",
  "このパイで画面表示する": "Show the overlay for this pie",
  "オフにするとこのパイだけ画面に出さずに発火します（全体設定より優先）。":
    "When off, this pie fires without showing the overlay (overrides the global setting).",
  "専用の見た目を使う": "Use a custom style",
  "オフのときは全体設定（設定→パイ）の見た目を使います。":
    "When off, uses the global style (Settings → Pie).",
  "実寸プレビューを画面に表示中（選択中の方向をハイライト）。":
    "A live actual-size preview is on screen (the selected direction is highlighted).",
  スタイル: "Style",
  範囲外に出したらキャンセル: "Cancel when moved outside",
  "パイの外側までカーソルを動かして離すと、何も発火せずキャンセルします。":
    "Move the cursor past the pie and release to cancel (fires nothing).",
  "パイの外までカーソルを動かして離すとキャンセル。":
    "Release past the pie to cancel.",
  プレビュー: "Preview",
  線の色: "Line color",
  薄灰: "Light gray",
  プレビュー中: "Previewing",
  実寸のパイを画面に表示して確認: "Show the pie at actual size on screen",
  アイコンを選ぶ: "Choose an icon",
  アイコンなし: "No icon",
  "アイコンを検索（英語名・キーワード）": "Search icons (English name or keyword)",
  "一致するアイコンがありません。": "No matching icons.",
  "結果が多すぎます。検索を絞ってください。":
    "Too many results — narrow your search.",
  すべての操作を初期状態に戻す: "Reset all actions to defaults",
  "一番上のアプリのアイコンがプロファイルのアイコンになります。":
    "The top app's icon becomes the profile's icon.",
  中心まで塗る円グラフ型: "Filled to the centre (pie chart)",
  輪と区切り線だけの控えめ表示: "Just a ring and dividers — subtle",
  外に向かって薄くなる放射線: "Spokes that fade outward",
  中心から伸びる放射線のみ: "Spokes from the centre only",
  今指している方向のラベルだけ: "Only the label you're pointing at",
  保存した操作: "Saved actions",
  統計: "Stats",
  "どのボタンをどれだけ使ったかを回数とヒートマップで確認します。":
    "See how much each button is used, by count and heatmap.",
  新規作成: "New",
  入力を追加: "Add input",
  新しいフォルダ: "New group",
  新しい操作: "New action",
  "Joy-Con のボタンに、キー入力や操作を割り当てます。":
    "Bind keys or actions to the Joy-Con's buttons.",
  "一度作った操作を保存して、いろいろなボタンで使い回せます。":
    "Save an action once and reuse it from any button.",
  全体設定を開く: "Open global settings",
  "全体のパイ設定（設定→パイ）を開く": "Open the global pie settings (Settings → Pie)",
  黒: "Black",
  濃紺: "Navy",
  灰: "Gray",
  白: "White",
  方向をすべて削除: "Clear all directions",
  "設定した方向をすべて削除しますか？（増やせば再起動までは元に戻せます）":
    "Clear every direction you've set? (You can restore them until restart by increasing the count again.)",

  // ── Settings: general (auto-stop / sound / vibration) ──
  "放置時の自動停止": "Auto-stop when idle",
  "無操作が続いたら自動で停止する": "Auto-stop after inactivity",
  "一定時間 Joy-Con の入力がないと、押しっぱなしのキーを解放して停止します。":
    "After a period with no Joy-Con input, held keys are released and mapping stops.",
  "停止までの時間": "Time until stop",
  "接続時の音・振動": "Connect sound & vibration",
  "Joy-Con の接続時・放置による自動切断時に音で知らせます（PCから再生）。接続時と、自動切断の少し前（数秒前）には本体を振動させて知らせることもできます。":
    "Notify by sound on connect and idle auto-disconnect (played from the PC). The controller can also vibrate on connect and shortly (a few seconds) before an auto-disconnect.",
  "接続したとき": "On connect",
  "接続したときの振動": "Vibration on connect",
  "自動切断したとき": "On auto-disconnect",
  "自動切断の予告振動": "Pre-disconnect vibration",
  数秒前: "a few sec before",
  試聴: "Preview",
  試す: "Try",
  "3分": "3 min",
  "5分": "5 min",
  "10分": "10 min",
  "15分": "15 min",
  "30分": "30 min",
  "1時間": "1 hour",

  // ── Sound / vibration options ──
  なし: "None",
  "ピッ": "Beep",
  "上昇（ピロッ）": "Rising",
  "下降（ポロッ）": "Falling",
  チャイム: "Chime",
  "ピピッ": "Double beep",

  // ── Settings: battery ──
  "バッテリー残量の目安（電圧）": "Battery estimate (voltage)",
  "残量%は電圧からのおおまかな推定です。満充電の直後と、切れる直前の電圧を実測してここに入れると、この Joy-Con に合った精度になります。":
    "The % is a rough estimate from voltage. Measure the voltage right after a full charge and just before it dies, then enter them here to tune the estimate for this Joy-Con.",
  "現在の電圧": "Current voltage",
  "満充電＝100% の電圧": "Voltage at full (100%)",
  "空＝0% の電圧": "Voltage at empty (0%)",
  未接続: "Not connected",
  mV: "mV",

  // ── Settings: LED ──
  "LED（プレイヤーランプ）": "LED (player lamps)",
  "接続中の Joy-Con のプレイヤーランプ（4つ）の点灯を選べます。":
    "Choose which of the connected Joy-Con's 4 player lamps are lit.",
  "点灯するランプ": "Lit lamps",
  "1〜4": "1–4",

  // ── Settings: management ──
  "バックアップ（すべて）": "Backup (everything)",
  "設定・操作・プロファイル・統計をまとめて1つのファイルに書き出し／読み込みします。":
    "Export / import settings, actions, profiles and stats together as a single file.",
  "統計の保持": "Stats retention",
  "古い使用統計を自動で削除します。既定は無制限。":
    "Auto-delete old usage stats. Unlimited by default.",
  "古い統計を自動削除": "Auto-delete old stats",
  無制限: "Unlimited",
  "30日": "30 days",
  "90日": "90 days",
  "180日": "180 days",
  "1年": "1 year",
  "2年": "2 years",
  エクスポート: "Export",
  インポート: "Import",
  初期化: "Reset",
  "すべて初期状態にリセット": "Reset everything",

  // ── Button editor ──
  右: "Right",
  左: "Left",
  "スティックの動作（このレイヤー・{{side}}）": "Stick behavior (this layer · {{side}})",
  "スティックをマウスにする": "Use stick as mouse",
  速度: "Speed",
  デッドゾーン: "Deadzone",
  全体: "Global",
  コピー: "Copy",
  貼り付け: "Paste",
  クリア: "Clear",
  このボタンの割り当てをコピー: "Copy this button's assignment",
  "コピーした割り当てをこのボタンに貼り付け（上書き）":
    "Paste the copied assignment onto this button (overwrite)",
  "先に「コピー」してください": "Copy something first",
  反応アプリから外す: "Remove from matched apps",
  "Joy-Con 図のボタンを選ぶと、": "Select a button on the Joy-Con figure,",
  "ここに設定が表示されます": "and its settings appear here",

  // ── Confirm / common dialogs ──
  レイヤーの削除: "Delete layer",
  "レイヤー「{{name}}」（割り当て {{count}} 件）を削除します。":
    "Delete layer “{{name}}” ({{count}} assignments).",
  プロファイルの削除: "Delete profile",
  "プロファイル「{{name}}」とその設定を削除します。":
    "Delete profile “{{name}}” and its settings.",
  "(名前なし)": "(unnamed)",

  // ── Layer management ──
  レイヤーを追加: "Add layer",
  "このレイヤーが初期レイヤーからどれだけ引き継ぐかを選びます。":
    "Choose how much this layer inherits from the base layer.",
  "切り替え・修飾キーだけ引き継ぐ": "Inherit only switch & modifier buttons",
  "初期レイヤーからは「レイヤーを切り替えるボタン」と「修飾キー（Ctrl / Shift / Alt など）を押し続けるボタン」だけを引き継ぎ、ほかのボタンは空から始めます。どのレイヤーにいても切り替えと修飾キーが使えるようにするための設定です（新しいレイヤーの既定）。":
    "Inherit only the base layer's “switch layer” buttons and its held-modifier buttons (Ctrl / Shift / Alt, …); every other button starts empty. Keeps layer switching and modifiers available from any layer (the default for new layers).",
  "すべて引き継ぐ": "Inherit everything",
  "初期レイヤーの割り当てをそのまま使い、ここで設定したボタンだけ差し替えます。設定しなかったボタンは初期レイヤーと同じ動きになります。":
    "Use the base layer's assignments as-is; only the buttons you set here are replaced. Buttons you don't set behave like the base layer.",
  "引き継がない（独立）": "Don't inherit (independent)",
  "初期レイヤーから何も引き継ぎません。このレイヤーで設定したボタンだけが動きます（切り替え用ボタンもここで設定が必要です）。":
    "Inherit nothing from the base layer. Only the buttons you set here work (you'll need to set switch buttons here too).",
  名前: "Name",
  継承: "Inheritance",
  "このレイヤー": "This layer",
  すべて割り当てなしにする: "Clear all assignments",
  "このレイヤーの割り当てをすべて削除": "Clear every assignment in this layer",
  "このレイヤーのすべての割り当てを削除しますか？":
    "Clear all assignments in this layer?",
  "初期レイヤー（ベース）です。他のレイヤーの継承元になります。":
    "This is the base layer. Other layers inherit from it.",
  "{{name}}（初期レイヤー）": "{{name}} (base layer)",
  "最後のレイヤーは削除できません": "Can't delete the last layer",

  // ── Profile management ──
  アイコン: "Icon",
  プロファイルを追加: "Add profile",
  "デフォルトは、どのプロファイルにも一致しないアプリで使われます。":
    "Default is used for apps that don't match any profile.",
  "反応するアプリ (exe)": "Matching apps (exe)",
  "未設定（このプロファイルは反応しません）":
    "None set (this profile never matches)",
  "起動中のアプリから": "From a running app",

  // ── Profile creation ──
  "起動中のアプリから追加": "Add from a running app",
  "手動で追加 (exe)": "Add manually (exe)",
  レイヤー名: "Layer name",

  // ── Running-apps list ──
  "取得に失敗: {{error}}": "Failed to fetch: {{error}}",
  "読み込み中…": "Loading…",
  "対象のアプリが見つかりません": "No matching apps found",
  追加済み: "Already added",
  追加済: "Added",

  // ── Operation manager ──
  "{{count}} 件": "{{count}}",
  "まだありません。下の「新しい操作」で作成できます。":
    "Nothing yet. Create one with “New action” below.",
  "下の「新しい操作」で作成してください":
    "Create one with “New action” below",
  "このフォルダ／検索に一致する操作がありません。":
    "No actions match this group / search.",
  "ドラッグで並べ替え／左のフォルダへ移動":
    "Drag to reorder / move to a group",
  "クリックで選択": "Click to select",
  "名前・キーで検索": "Search by name or key",
  動作: "Action",
  操作名: "Action name",
  "操作名（例: 元に戻す）": "Action name (e.g. Undo)",
  操作の色: "Operation color",
  レッド: "Red",
  オレンジ: "Orange",
  イエロー: "Yellow",
  グリーン: "Green",
  ティール: "Teal",
  パープル: "Purple",
  ピンク: "Pink",
  画像: "Image",
  "画像を読み込む（貼り付けも可・クリスタの書き出し画像など）":
    "Load an image (or paste — e.g. exported from CLIP Studio)",
  フォルダ: "Group",
  未分類: "Ungrouped",

  // ── Folder deletion ──
  フォルダの削除: "Delete group",
  "フォルダ「{{name}}」（操作 {{count}} 件）を削除します。":
    "Delete group “{{name}}” ({{count}} actions).",
  "フォルダ「{{name}}」内の {{count}} 件の操作もすべて削除します。よろしいですか？":
    "This will also delete all {{count}} actions in group “{{name}}”. Continue?",
  すべて削除: "Delete all",

  // ── Folder rail / operation picker ──
  すべて: "All",
  フォルダを追加: "Add group",
  操作を選択: "Select an action",
  操作を割り当て: "Assign an action",
  "保存された操作がありません。": "No saved actions.",
  "該当する操作がありません。": "No matching actions.",

  // ── Input-command editor ──
  キー: "Key",
  中: "Middle",
  "{{btn}}クリック": "{{btn}} click",
  "{{btn}}ダブルクリック": "{{btn}} double-click",
  "スクロール↑": "Scroll ↑",
  "スクロール↓": "Scroll ↓",
  振動: "Vibration",
  パターン1: "Pattern 1",
  パターン2: "Pattern 2",
  パターン3: "Pattern 3",
  パターン4: "Pattern 4",
  パターン5: "Pattern 5",
  パターン6: "Pattern 6",
  パターン7: "Pattern 7",
  "保存した操作への参照。操作を編集するとここも変わります。":
    "Reference to a saved action; editing the action updates this.",
  "この操作を開く": "Open this action",
  "（削除済みの操作）": "(deleted action)",
  量: "Amount",
  "スクロール量（空欄なら既定値。押しっぱなしの連続スクロールはキー入力の連打間隔で）":
    "Scroll amount (blank = default; held continuous scroll uses the key-repeat interval).",

  // ── Key picker ──
  "キーを選択（日本語配列）": "Select a key (JIS layout)",
  "入力を選択（日本語配列）": "Select an input (JIS layout)",
  "入力待ち…（キー / クリック / スクロール）": "Waiting… (key / click / scroll)",
  "キー入力待ち…（押してください）": "Waiting for a key… (press one)",
  "キーを押して割り当て": "Press a key to assign",
  "クリックして入力": "Click to input",
  入力を受付: "Capture input",
  キーを押してください: "Press a key",
  修飾キー単体も設定できます: "A lone modifier can be set too",
  "クリック・スクロールでも設定できます": "Click or scroll here to set one too",
  "クリックしてキー・マウス・スクロールを設定":
    "Click to set a key, mouse, or scroll",
  キーボードから選ぶ: "Pick from the keyboard",
  キーボードから追加: "Add from keyboard",
  編集を終了: "Finish editing",
  "特殊キー・マウス・スクロールなどを一覧から追加":
    "Add special keys / mouse / scroll from the list",
  "クリックしてキーを設定": "Click to set a key",
  "クリックしてキー・ショートカットを設定（今の内容を置き換え）":
    "Click to set a key or shortcut (replaces the current input)",
  "キー名で検索": "Search by key name",
  編集: "Edit",
  矢印: "Arrows",
  テンキー: "Numpad",
  "スクロール（量）": "Scroll (amount)",
  マウス: "Mouse",
  ダブルクリック: "Double-click",
  ブラウザ: "Browser",
  メディア: "Media",
  中クリック: "Middle click",
  中ダブル: "Middle double",
  右クリック: "Right click",
  右ダブル: "Right double",
  左クリック: "Left click",
  左ダブル: "Left double",

  // ── Error toasts ──
  "接続に失敗しました: {{error}}": "Connection failed: {{error}}",
  "保存に失敗しました: {{error}}": "Save failed: {{error}}",

  // ── Import risk warning ──
  "このバックアップには次の操作を送るボタンが含まれます:":
    "This backup contains buttons that send the following:",
  "信頼できる提供元のファイルだけを取り込んでください。":
    "Only import files from a source you trust.",

  // ── Workspace I/O ──
  "エクスポート失敗: {{error}}": "Export failed: {{error}}",
  "読み込み失敗: {{error}}": "Load failed: {{error}}",
  初期状態にリセットしました: "Reset to defaults",
  バックアップを書き出しました: "Backup exported",
  バックアップを取り込みました: "Backup imported",
  バックアップから復元しました: "Restored from backup",
  "設定・操作・プロファイル・統計": "settings, actions, profiles and stats",
  バックアップのインポート: "Import backup",
  "現在の{{scope}}をすべて置き換えます。よろしいですか？":
    "This replaces all current {{scope}}. Continue?",
  置き換える: "Replace",
  バックアップから復元: "Restore from backup",
  "自動保存された過去の状態（設定・操作・プロファイル）に戻します。統計はそのまま残ります。":
    "Roll back to an auto-saved earlier state (settings, actions, profiles). Stats are kept.",
  "まだ自動バックアップがありません。": "No auto-backups yet.",
  フォルダを開く: "Open folder",
  "バックアップや設定ファイルの場所を開く": "Open the folder with backups and config files",
  この時点に復元: "Restore this point",
  復元: "Restore",
  復元する: "Restore",
  "復元失敗: {{error}}": "Restore failed: {{error}}",
  "このバックアップの時点に戻します（現在の設定・操作・プロファイルを置き換え）。統計はそのまま残ります。":
    "Roll back to this backup (replaces your current settings, actions and profiles). Stats are kept.",
  "⚠️ 注意が必要な項目（{{n}}件）:": "⚠️ Items to review ({{n}}):",
  "・ほか {{n}} 件": "· and {{n}} more",
  "Windowsキーを含む（スタート／「ファイル名を指定して実行」を開ける）":
    "Contains the Windows key (can open Start / Run).",
  "複数の文字キーを送出（文章を打ち込める）":
    "Sends several character keys (can type text).",
  "文字入力のあとに Enter（入力して確定）":
    "Types characters then Enter (types and submits).",
  "キー入力の送信で注意が必要です": "Sends key input worth reviewing",
  "使用回数（累計）": "Times used (all-time)",
  "インポート失敗: {{error}}": "Import failed: {{error}}",
  初期化の確認: "Confirm reset",
  "すべて（プロファイル・キー割り当て・保存した操作・統計・設定）を初期状態に戻しますか？（言語・テーマ・表示倍率は保持）この操作は取り消せません。":
    "Reset everything (profiles, key mappings, saved actions, stats, and settings) to defaults? (Language, theme, and UI scale are kept.) This can't be undone.",
  未設定: "Unassigned",

  // ── Action editor (press type / input / pie / layer hold) ──
  キー入力: "Keys",
  保存済みの操作を割り当て: "Assign a saved action",
  "保存済みの操作を割り当て（この方向を置き換え）":
    "Assign a saved action (replaces this direction)",
  "クリックで別の操作に変更": "Click to pick a different action",
  "参照できる操作がありません（入力の操作のみ）。":
    "No referenceable actions (input actions only).",
  "キー・マウス・スクロールを割り当て（タップ / 長押し / 固定 / 連打）":
    "Assign a key / mouse / scroll action (tap / hold / toggle / turbo)",
  "押している間だけ別のレイヤーに切り替え（一時的に別の割り当てを使う）":
    "Switch to another layer while held (use a different set of mappings temporarily)",
  "押しながらマウスを動かした方向で発火（上下左右に別々の割り当て）":
    "Fire by moving the mouse in a direction while held (separate mapping per direction)",
  "入力するキー・マウス・スクロール。複数指定すると同時押しになります。":
    "Keys / mouse / scroll to send. Multiple entries are pressed together.",
  "ボタンを押している間ずっと押しっぱなしにします（キーボード/マウス向け）。":
    "Holds the input for as long as the button is held (for keyboard / mouse).",
  押している間: "While held",
  "1回押すと押しっぱなしで固定、もう1回で解除（Shift/Ctrl の固定に便利）。":
    "One press latches it on, another releases it (handy for holding Shift/Ctrl).",
  "固定（トグル）": "Latch (toggle)",
  "押している間くり返し入力します（連打）。間隔はms。":
    "Repeats the input while held (auto-repeat). Interval in ms.",
  連打: "Repeat",
  "方向（パイメニュー）": "Directions (pie menu)",
  角度: "Angle",
  方向数: "Directions",
  減らす: "Decrease",
  増やす: "Increase",
  左に回す: "Rotate left",
  右に回す: "Rotate right",
  "この方向をクリア（割り当てを解除）": "Clear this direction (unassign)",
  "中央（その場）": "Centre (in place)",
  "「方向数」の＋で方向を追加してください。": "Add directions with the “Directions” + button.",
  "ボタンを押している間にマウスを動かした方向で、一番近いスライスの操作が発火します。\n方向数（2〜8）と全体の角度をボタンで設定。中央＝しきい値未満（その場）。":
    "While the button is held, moving the mouse fires the nearest slice's action.\nSet the number of directions (2–8) and the overall angle with the buttons. Centre = below threshold (in place).",
  上: "Up",
  下: "Down",
  右上: "Up-right",
  右下: "Down-right",
  左下: "Down-left",
  左上: "Up-left",
  その場: "In place",
  "押している間のレイヤー": "Layer while held",
  "このボタンを押している間だけ、選んだレイヤーに切り替わります（離すと元のレイヤーに戻ります）。":
    "Switches to the chosen layer only while this button is held (releases back on let-go).",
  "レイヤーを選択…": "Select a layer…",
  "一緒に押しておく修飾キー（任意）": "Modifiers to hold too (optional)",
  "「{{name}}」という名前のレイヤーを作成": "Create a layer named “{{name}}”",
  "操作として保存": "Save as action",
  押し方: "Press style",
  "何も選ばなければ、ボタンを押した瞬間に1回だけ入力します。":
    "With nothing selected, the input fires once when the button is pressed.",
  "この動作を「{{name}}」として操作に保存し、このボタンをその操作に切り替えますか？":
    "Save this action as “{{name}}” and switch this button to that action?",
  保存: "Save",
  解除: "Unlink",
  "操作のリンクを解除（キーはそのまま残り、直接編集できます）":
    "Unlink the action (keeps the keys so you can edit them directly)",
  "操作の表示名（任意）": "Action display name (optional)",
  "Joy-Con 図に表示される名前。操作として保存するときの名前にもなります。":
    "Name shown on the Joy-Con figure; also used when saving as an action.",
  "この動作を操作として保存し、このボタンをその操作にリンクします":
    "Save this action and link this button to it",
  "(削除された操作)": "(deleted action)",
  "フォルダ: {{name}}": "Group: {{name}}",
  "100ms 遅く": "100 ms slower",
  "10ms 遅く": "10 ms slower",
  "10ms 速く": "10 ms faster",
  "100ms 速く": "100 ms faster",
  適用: "Apply",
  "このレイヤーで上書き中": "Overridden in this layer",
  "継承に戻す（上書き削除）": "Revert to inherited (remove override)",
  "ベースレイヤー「{{name}}」から継承中": "Inherited from base layer “{{name}}”",
  "このレイヤーで上書き": "Override in this layer",

  // ── Colour presets ──
  アンバー: "Amber",
  ゴールド: "Gold",
  ブルー: "Blue",
  青: "Blue",
  カスタム: "Custom",
  ディープアンバー: "Deep amber",
  ディープブルー: "Deep blue",
  ディープレッド: "Deep red",
  ライトイエロー: "Light yellow",
  ライトグリーン: "Light green",
  ライトパープル: "Light purple",
  ライトブルー: "Light blue",
  ライトレッド: "Light red",

  // ── Battery (experimental) ──
  "タイトルバー表示（実験的）": "Title-bar display (experimental)",
  "Joy-Con 2 の電池表示は実験的な機能です。":
    "The Joy-Con 2 battery display is an experimental feature.",
  "タイトルバーにバッテリーを表示": "Show battery in the title bar",
  "オンにすると、上部のタイトルバーに電池残量の目安を表示します。電圧からのおおまかな推定です。":
    "When on, shows an estimated battery level in the top title bar — a rough estimate from voltage.",

  // ── Tour / help ──
  使い方ツアー: "Guided tour",
  "主な画面をさっと案内します（スキップ可）。":
    "A quick tour of the main screens (skippable).",
  はじめに: "Getting started",
  メニュー: "Menu",
  安全性: "Safety",
  バックアップ: "Backup",
  "キー割り当て": "Key mapping",
  "このパイ": "This pie",
  実寸プレビュー: "Actual-size preview",
  操作の初期化: "Reset actions",
  メイン: "Main",
  "① 接続": "① Connect",
  "② ボタンを選ぶ": "② Pick a button",
  "③ 割り当てる": "③ Assign it",
  "④ 保存した操作": "④ Saved actions",
  "⑤ 統計": "⑤ Stats",
  "⑥ 設定・バックアップ": "⑥ Settings & backup",
  準備完了: "You're all set",
  "さっそくボタンにキーや操作を割り当ててみましょう。":
    "Go ahead and assign a key or action to a button.",
  "起動後は自動で接続を待ちます。Joy-Con 2 のシンクボタンでつながります（未接続でも割り当ては作れます）。":
    "It waits for a connection automatically on launch; connect with the Joy-Con 2's sync button (you can build assignments even while disconnected).",
  "中央の図でボタンをクリックして選びます。":
    "Click a button on the central figure to select it.",
  "右のパネルでキー入力・操作・パイなどを割り当てます。":
    "Assign a key press, saved action, pie menu and more in the right panel.",
  "左の一覧から操作を選択してください":
    "Select an action from the list on the left",
  "Joy-Con 2 のボタンやスティックを、キーボード／マウスの操作に変換するアプリです。":
    "An app that turns the Joy-Con 2's buttons and stick into keyboard/mouse input.",
  "起動すると自動で接続を待ち受けます（開始を押す必要はありません）。Joy-Con 2 側面の「シンクボタン」を押すとつながり、上部にバッテリー残量が出ます。":
    "It waits for a connection automatically on launch (no need to press Start). Press the “sync button” on the side of the Joy-Con 2 to connect; the battery level appears at the top.",
  "しばらく操作がないと自動で切断して Joy-Con のバッテリーを節約します。切断後もそのまま待機を続け、シンクで再接続できます（待機中は接続を保たないのでバッテリーは消費しません）。":
    "After a while with no input it disconnects automatically to save the Joy-Con's battery. It keeps waiting afterwards and reconnects on sync (it doesn't hold the link while waiting, so no battery is used).",
  "完全に止めるときは左上の「停止」を押します（もう一度押すと待機に戻ります）。":
    "To stop completely, press “Stop” at the top left (press again to go back to waiting).",
  "中央の Joy-Con 図でボタンを選び、右のパネルで操作を割り当てます。":
    "Pick a button on the central Joy-Con figure and assign an action in the right panel.",
  "ショートカット（Ctrl+C など修飾キー付き）は、そのまま押して取り込めます。":
    "Shortcuts (with modifiers, e.g. Ctrl+C) can be captured by just pressing them.",
  "押し方は「通常（タップ）」「長押し」「切替（トグル）」から選べ、連打（リピート）も設定できます。":
    "Choose how it presses — Tap, Hold, or Toggle — and you can set auto-repeat too.",
  "スティックはレイヤーごとにマウス化もできます。":
    "The stick can also act as a mouse, per layer.",
  "プロファイルに反応アプリ（exe）を登録します。起動中のアプリからも追加できます。":
    "Register the apps (exe) a profile responds to. You can also add them from running apps.",
  "どのプロファイルにも一致しないアプリでは「デフォルト」が使われます。":
    "“Default” is used for apps that don't match any profile.",
  "1 つのプロファイルに複数のレイヤーを持てます（例：通常／マウス操作）。":
    "A profile can hold several layers (e.g. Normal / Mouse).",
  "ボタンに「レイヤー（押している間）」を割り当てると、押している間だけ別のレイヤーに切り替わります。":
    "Assign “Layer (while held)” to a button to switch to another layer only while it's held.",
  "継承は「すべて引き継ぐ」「切り替え・修飾キーだけ引き継ぐ」「独立」から選べます。":
    "Inheritance can be “Inherit all”, “Inherit only switches & modifiers”, or “Independent”.",
  "レイヤー名はダブルクリックで変更できます。":
    "Double-click a layer name to rename it.",
  "一度作った操作を保存しておくと、いろいろなボタンから使い回せます（フォルダで整理）。毎回作り直す手間が省けます。":
    "Save an action once and reuse it from any button (organized in folders) — no need to rebuild it each time.",
  "よく使う操作を登録して使い回せます。":
    "Register actions you use often and reuse them.",
  "ボタンに割り当てるとリンクされ、元の操作を編集すると割り当て先すべてに反映されます。":
    "Assigning to a button links it — editing the original action updates every button that uses it.",
  "2〜8 方向＋中央（その場）に操作を割り当てられます。":
    "Assign actions to 2–8 directions plus the center (in place).",
  "ボタンを押しながらマウスを動かした方向で発火する、円形のメニューです。":
    "A radial menu that fires by the direction you move the mouse while holding the button.",
  "見た目（デザイン・色・大きさ）は設定→パイメニュー、またはパイごとに調整できます。":
    "Adjust the look (design, color, size) in Settings → Pie menu, or per pie.",
  "キー割り当てページの「統計」で、ボタンの使用回数をヒートマップ表示します（今日／週／月／累計）。":
    "The “Stats” view on the Key mapping page shows button usage as a heatmap (today / week / month / all-time).",
  "「保存した操作」には累計の使用回数が出ます（0 回＝まだ使っていない目印）。":
    "Saved actions show their all-time use count (0 = a marker that you haven't used it yet).",
  "各操作に累計の使用回数が出るので、使っていない操作を見つけて整理できます。":
    "Each action shows its all-time use count, so you can find and tidy up unused ones.",
  "ボタンの使用回数を確認できます。": "See how often each button is used.",
  "統計は統計ページからリセットでき、保持期間は設定→管理で設定できます。":
    "You can reset stats from the Stats page, and set how long they're kept in Settings → Manage.",
  "設定→管理の「エクスポート／インポート」で、設定・操作・プロファイル・統計を 1 ファイルにまとめて保存・復元できます。":
    "“Export / Import” in Settings → Manage saves and restores your settings, actions, profiles, and stats in a single file.",
  "過去の状態が自動で世代保存されます。設定→管理→「バックアップから復元」で戻せます。":
    "Past states are saved automatically across generations. Restore them from Settings → Manage → “Restore from backup”.",
  "壊れたファイルは削除されず退避されるので、後から救出できます。":
    "A corrupt file is set aside rather than deleted, so it can be recovered later.",
  "バックアップの読み込み・復元は現在の内容を置き換えるため、実行前に確認ダイアログが出ます。":
    "Loading or restoring a backup replaces the current content, so a confirmation dialog appears first.",
  "バックアップは自分用（復元・別 PC への移行）を想定しています。他人との共有は前提としていません。":
    "Backups are meant for your own use (restore, moving to another PC). Sharing with others isn't assumed.",
  "全体の設定とバックアップはここから。": "Global settings and backups are here.",
  "困ったらここへ。ツアーもここから再開できます。":
    "Come here if you get stuck — you can restart the tour from here too.",
  "1 回の操作で送るのは、キー／マウスの「同時押し」だけです。キーを順番に打ち込んだり、コマンドを実行したりはしません。":
    "A single action only sends a key/mouse “chord” (keys pressed together). It never types keys in sequence or runs commands.",
  "扱えるのは、あらかじめ許可されたキーとマウス操作に限られます。":
    "Only pre-allowed keys and mouse actions can be used.",
  "これは早期リリースです。無保証・自己責任でご利用ください。":
    "This is an early release. It's provided without warranty — use it at your own risk.",
  "更新や不具合の修正を約束するものではありません。":
    "It makes no promise of updates or bug fixes.",
  "本ソフトの使用によって生じた損害について、作者は責任を負いません。":
    "The author is not liable for any damage arising from use of this software.",
  "このレイヤーに切り替えている間ずっと押しておく修飾キー（例: Ctrl）。これで押している間レイヤーが組み合わせボタンの役割も兼ねられます。不要ならなしでOK。":
    "A modifier (e.g. Ctrl) held the whole time this layer is active, so a held layer can double as a combination button. Leave it empty if not needed.",
  "操作を初期状態（プリセット）に戻しますか？ボタンに割り当て済みの動作はそのまま残り、操作とのリンクだけ解除されます。":
    "Reset actions to the initial presets? Actions already assigned to buttons stay; only their links to actions are removed.",
  "左のナビでページを切り替えます：キー割り当て／保存した操作／統計／設定（＋ヘルプ）。":
    "Switch pages from the left nav: Key mapping / Saved actions / Stats / Settings (plus Help).",
  // ── In-app updater ──
  更新があります: "Update available",
  更新を確認: "Check for updates",
  "確認中…": "Checking…",
  "お使いのバージョンは最新です。": "You're on the latest version.",
  "更新を確認できませんでした。": "Couldn't check for updates.",
  新しいバージョンがあります: "A new version is available",
  "新しいバージョン v{{version}} があります": "Version v{{version}} is available",
  "更新は任意です。内容を確認してから更新できます。":
    "Updating is optional — review what's new before you update.",
  更新内容を見る: "See what's new",
  現在: "Current",
  更新内容: "What's new",
  更新する: "Update",
  後で: "Later",
  "ダウンロード中…": "Downloading…",
  "ダウンロード中… {{pct}}%": "Downloading… {{pct}}%",
  "再起動しています…": "Restarting…",
  "更新に失敗しました。時間をおいて、もう一度お試しください。":
    "The update failed. Please wait a moment and try again.",
};
