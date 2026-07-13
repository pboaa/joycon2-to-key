// Key names accepted by the Rust `name_to_vk` mapper.

export interface KeyGroup {
  label: string;
  keys: readonly string[];
}

export const KEY_GROUPS: readonly KeyGroup[] = [
  {
    label: "Modifier",
    keys: [
      "Ctrl",
      "LCtrl",
      "RCtrl",
      "Alt",
      "LAlt",
      "RAlt",
      "Shift",
      "LShift",
      "RShift",
      "Win",
      "RWin",
    ],
  },
  {
    label: "Editing",
    keys: [
      "Enter",
      "Space",
      "Esc",
      "Tab",
      "Backspace",
      "Delete",
      "Insert",
      "Home",
      "End",
      "PageUp",
      "PageDown",
      "CapsLock",
      "NumLock",
      "ScrollLock",
      "PrintScreen",
      "Pause",
    ],
  },
  {
    label: "Arrows",
    keys: ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"],
  },
  {
    label: "Function",
    keys: [
      "F1", "F2", "F3", "F4", "F5", "F6",
      "F7", "F8", "F9", "F10", "F11", "F12",
      "F13", "F14", "F15", "F16", "F17", "F18",
      "F19", "F20", "F21", "F22", "F23", "F24",
    ],
  },
  {
    label: "Japanese",
    keys: ["Hankaku", "Convert", "NonConvert", "KanaMode", "IntlRo", "Apps"],
  },
  {
    label: "Number row",
    keys: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
  },
  {
    label: "Letters",
    keys: [
      "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
      "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
    ],
  },
  {
    label: "Numpad",
    keys: [
      "Numpad0", "Numpad1", "Numpad2", "Numpad3", "Numpad4",
      "Numpad5", "Numpad6", "Numpad7", "Numpad8", "Numpad9",
      "NumpadMultiply", "NumpadAdd", "NumpadSubtract",
      "NumpadDivide", "NumpadDecimal",
    ],
  },
  {
    label: "Punctuation",
    keys: [
      "Minus", "Plus", "Comma", "Period", "Semicolon",
      "Slash", "Backquote", "LeftBracket", "Backslash",
      "RightBracket", "Quote",
    ],
  },
  {
    label: "Media",
    keys: [
      "VolumeMute", "VolumeDown", "VolumeUp",
      "MediaNextTrack", "MediaPrevTrack", "MediaStop", "MediaPlayPause",
    ],
  },
  {
    label: "Browser",
    keys: [
      "BrowserBack", "BrowserForward", "BrowserRefresh",
      "BrowserStop", "BrowserSearch", "BrowserFavorites", "BrowserHome",
    ],
  },
] as const;

export const ALL_KEY_NAMES: readonly string[] = KEY_GROUPS.flatMap(
  (g) => g.keys,
);

/** Non-letter/digit `KeyboardEvent.code` → app key name. */
const CODE_TO_KEY: Record<string, string> = {
  ControlLeft: "Ctrl",
  ControlRight: "Ctrl",
  ShiftLeft: "Shift",
  ShiftRight: "Shift",
  AltLeft: "Alt",
  AltRight: "Alt",
  MetaLeft: "Win",
  MetaRight: "Win",
  Enter: "Enter",
  NumpadEnter: "Enter",
  Space: "Space",
  Escape: "Esc",
  Tab: "Tab",
  Backspace: "Backspace",
  Delete: "Delete",
  Insert: "Insert",
  Home: "Home",
  End: "End",
  PageUp: "PageUp",
  PageDown: "PageDown",
  CapsLock: "CapsLock",
  NumLock: "NumLock",
  ScrollLock: "ScrollLock",
  PrintScreen: "PrintScreen",
  Pause: "Pause",
  ArrowUp: "ArrowUp",
  ArrowDown: "ArrowDown",
  ArrowLeft: "ArrowLeft",
  ArrowRight: "ArrowRight",
  Minus: "Minus",
  Equal: "Plus",
  Comma: "Comma",
  Period: "Period",
  Semicolon: "Semicolon",
  Slash: "Slash",
  Backquote: "Backquote",
  BracketLeft: "LeftBracket",
  Backslash: "Backslash",
  BracketRight: "RightBracket",
  Quote: "Quote",
  NumpadMultiply: "NumpadMultiply",
  NumpadAdd: "NumpadAdd",
  NumpadSubtract: "NumpadSubtract",
  NumpadDivide: "NumpadDivide",
  NumpadDecimal: "NumpadDecimal",
  AudioVolumeMute: "VolumeMute",
  AudioVolumeUp: "VolumeUp",
  AudioVolumeDown: "VolumeDown",
  MediaTrackNext: "MediaNextTrack",
  MediaTrackPrevious: "MediaPrevTrack",
  MediaStop: "MediaStop",
  MediaPlayPause: "MediaPlayPause",
  // Japanese IME / JIS-layout keys
  Convert: "Convert",
  NonConvert: "NonConvert",
  KanaMode: "KanaMode",
  IntlRo: "IntlRo",
  ContextMenu: "Apps",
};

/** Map a physical `KeyboardEvent.code` to an app key name, or null if unknown. */
export function captureKey(code: string): string | null {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit[0-9]$/.test(code)) return code.slice(5);
  if (/^Numpad[0-9]$/.test(code)) return code;
  if (/^F([1-9]|1[0-9]|2[0-4])$/.test(code)) return code;
  const mapped = CODE_TO_KEY[code];
  return mapped && ALL_KEY_NAMES.includes(mapped) ? mapped : null;
}

/** Joy-Con (L) physical buttons + derived stick directions. */
export const BUTTON_KEYS_LEFT: readonly string[] = [
  "up",
  "right",
  "down",
  "left",
  "stickUp",
  "stickRight",
  "stickDown",
  "stickLeft",
  "l",
  "zl",
  "sl",
  "sr",
  "minus",
  "capture",
  "stickPress",
] as const;

/** Joy-Con (R) physical buttons + derived stick directions. R-side SL/SR,
 * stick press and stick directions are their own keys, distinct from the L
 * pad's. */
export const BUTTON_KEYS_RIGHT: readonly string[] = [
  "stickUpR",
  "stickRightR",
  "stickDownR",
  "stickLeftR",
  "a",
  "b",
  "x",
  "y",
  "r",
  "zr",
  "slR",
  "srR",
  "plus",
  "home",
  "chat",
  "stickPressR",
] as const;

/** Display labels for Joy-Con button keys (ZL / Up / StickDown …). */
export const BUTTON_LABEL: Record<string, string> = {
  up: "Up",
  down: "Down",
  left: "Left",
  right: "Right",
  stickUp: "StickUp",
  stickDown: "StickDown",
  stickLeft: "StickLeft",
  stickRight: "StickRight",
  l: "L",
  zl: "ZL",
  sl: "SL",
  sr: "SR",
  minus: "Minus",
  capture: "Capture",
  stickPress: "StickPress",
  a: "A",
  b: "B",
  x: "X",
  y: "Y",
  r: "R",
  zr: "ZR",
  plus: "Plus",
  home: "Home",
  chat: "C",
  slR: "SL",
  srR: "SR",
  stickPressR: "StickPress",
  stickUpR: "StickUp",
  stickDownR: "StickDown",
  stickLeftR: "StickLeft",
  stickRightR: "StickRight",
};
export const buttonLabel = (key: string) => BUTTON_LABEL[key] ?? key;

/** JIS symbol/OEM keys → the glyph actually typed at that position, so a display
 * label reads as the symbol (`Semicolon` → `:`) instead of a confusing English
 * name. The JIS mapping is non-obvious (Semicolon = ":", Plus = ";"), so surfacing
 * the glyph is what makes these keys recognisable. Only symbol keys are listed;
 * everything else (letters, F-keys, named keys) already reads fine as its name. */
const KEY_GLYPH: Record<string, string> = {
  Minus: "-",
  Plus: ";",
  Semicolon: ":",
  Backquote: "@",
  LeftBracket: "[",
  Backslash: "¥",
  RightBracket: "]",
  Quote: "^",
  IntlRo: "\\",
  Comma: ",",
  Period: ".",
  Slash: "/",
};

/** The glyph for a symbol key (`Semicolon` → `:`), or undefined for keys that
 * already read clearly as their name. */
export const keyGlyph = (name: string): string | undefined => KEY_GLYPH[name];
