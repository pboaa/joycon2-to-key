// Static layout data for the KeyPicker: the JIS keyboard grid, side clusters,
// pointer/scroll/move presets, and display-label shortenings. Pure data (no
// React) so the picker component stays focused on rendering + interaction.

/** Mouse click choices (right column, `pointer` mode). */
export const MOUSE_SECTIONS: {
  label: string;
  items: { v: string; label: string }[];
}[] = [
  {
    label: "マウス",
    items: [
      { v: "mouse:left", label: "左クリック" },
      { v: "mouse:right", label: "右クリック" },
      { v: "mouse:middle", label: "中クリック" },
    ],
  },
  {
    label: "ダブルクリック",
    items: [
      { v: "dbl:left", label: "左ダブル" },
      { v: "dbl:right", label: "右ダブル" },
      { v: "dbl:middle", label: "中ダブル" },
    ],
  },
];

// Scroll is chosen from direction × preset amount (the amount is encoded in the sentinel).
export const SCROLL_DIRS: [string, string][] = [["up", "↑"], ["down", "↓"]];
export const SCROLL_AMOUNTS = [120, 240, 360];

// ── Japanese (JIS) layout. Each cell is [key name, main label, kana?]. JIS symbol
// keys map to an existing key name whose VK produces the character actually typed at
// that position (e.g. @=Backquote/VK_OEM_3, ;=Plus/VK_OEM_PLUS, :=Semicolon/VK_OEM_1,
// ^=Quote/VK_OEM_7, ¥=Backslash/VK_OEM_5).
type Cell = [string, string, string?];
export const KB: Cell[][] = [
  [["Esc", "Esc"], ["F1", "F1"], ["F2", "F2"], ["F3", "F3"], ["F4", "F4"], ["F5", "F5"], ["F6", "F6"], ["F7", "F7"], ["F8", "F8"], ["F9", "F9"], ["F10", "F10"], ["F11", "F11"], ["F12", "F12"]],
  [["Hankaku", "半/全"], ["1", "1", "ぬ"], ["2", "2", "ふ"], ["3", "3", "あ"], ["4", "4", "う"], ["5", "5", "え"], ["6", "6", "お"], ["7", "7", "や"], ["8", "8", "ゆ"], ["9", "9", "よ"], ["0", "0", "わ"], ["Minus", "-", "ほ"], ["Quote", "^", "へ"], ["Backslash", "¥", "ー"], ["Backspace", "⌫"]],
  [["Tab", "Tab"], ["Q", "Q", "た"], ["W", "W", "て"], ["E", "E", "い"], ["R", "R", "す"], ["T", "T", "か"], ["Y", "Y", "ん"], ["U", "U", "な"], ["I", "I", "に"], ["O", "O", "ら"], ["P", "P", "せ"], ["Backquote", "@", "゛"], ["LeftBracket", "[", "「"], ["Enter", "⏎"]],
  [["CapsLock", "英数"], ["A", "A", "ち"], ["S", "S", "と"], ["D", "D", "し"], ["F", "F", "は"], ["G", "G", "き"], ["H", "H", "く"], ["J", "J", "ま"], ["K", "K", "の"], ["L", "L", "り"], ["Plus", ";", "れ"], ["Semicolon", ":", "け"], ["RightBracket", "]", "む"]],
  [["Shift", "⇧"], ["Z", "Z", "つ"], ["X", "X", "さ"], ["C", "C", "そ"], ["V", "V", "ひ"], ["B", "B", "こ"], ["N", "N", "み"], ["M", "M", "も"], ["Comma", ",", "ね"], ["Period", ".", "る"], ["Slash", "/", "め"], ["IntlRo", "\\", "ろ"], ["Shift", "⇧"]],
  [["Ctrl", "Ctrl"], ["Win", "⊞"], ["Alt", "Alt"], ["NonConvert", "無変換"], ["Space", ""], ["Convert", "変換"], ["KanaMode", "かな"], ["Alt", "Alt"], ["Apps", "▤"], ["Ctrl", "Ctrl"]],
];

// Width (1u = 1). Defaults to 1u if unspecified.
export const W: Record<string, number> = {
  Backspace: 1.7,
  Tab: 1.5,
  Enter: 1.9,
  CapsLock: 1.8,
  Shift: 2.2,
  Ctrl: 1.3,
  Hankaku: 1.3,
  NonConvert: 1.3,
  Convert: 1.3,
  KanaMode: 1.3,
  Space: 5,
};

// Right-side cluster.
export const NAV: string[][] = [
  ["Insert", "Home", "PageUp"],
  ["Delete", "End", "PageDown"],
  ["PrintScreen", "ScrollLock", "Pause"],
];
export const ARROWS: (string | null)[][] = [
  [null, "ArrowUp", null],
  ["ArrowLeft", "ArrowDown", "ArrowRight"],
];
// Numpad keys are laid out directly in the KeyPicker via a CSS grid (physical
// numpad shape: tall +, wide 0), so no row-array is needed here.
export const F_HI = ["F13", "F14", "F15", "F16", "F17", "F18", "F19", "F20", "F21", "F22", "F23", "F24"];

// Keys with no fixed spot on the keyboard (picked up via search / the bottom list).
export const EXTRA: { label: string; keys: string[] }[] = [
  { label: "メディア", keys: ["VolumeMute", "VolumeDown", "VolumeUp", "MediaPlayPause", "MediaPrevTrack", "MediaNextTrack", "MediaStop"] },
  { label: "ブラウザ", keys: ["BrowserBack", "BrowserForward", "BrowserRefresh", "BrowserStop", "BrowserSearch", "BrowserFavorites", "BrowserHome"] },
];

// Display label (long key names are shortened so they don't overflow the cell).
const SEARCH_DISP: Record<string, string> = {
  ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→",
  Backspace: "⌫", Enter: "⏎", Space: "Space", Win: "⊞", Apps: "メニュー",
  Hankaku: "半角/全角", Convert: "変換", NonConvert: "無変換", KanaMode: "かな",
  IntlRo: "\\ろ", Backquote: "@", LeftBracket: "[「", RightBracket: "]む",
  Plus: ";れ", Semicolon: ":け", Quote: "^へ", Backslash: "¥", Minus: "-ほ",
  // Edit cluster (shorten long names).
  Insert: "Ins", Delete: "Del", PageUp: "PgUp", PageDown: "PgDn",
  PrintScreen: "PrtSc", ScrollLock: "ScrLk", Pause: "Pause",
  // Numpad (shorten NumpadXxx to Num<symbol>).
  NumLock: "NumLk", NumpadDivide: "Num/", NumpadMultiply: "Num×",
  NumpadSubtract: "Num−", NumpadAdd: "Num+", NumpadDecimal: "Num.",
};
export const searchDisp = (k: string) =>
  SEARCH_DISP[k] ?? k.replace(/^Numpad/, "Num").replace(/^(Media|Volume|Browser)/, "$1 ");

export const UNIT = 30; // 1u の幅(px)
