use windows::Win32::UI::Input::KeyboardAndMouse::*;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum MouseButton {
    Left,
    Right,
    Middle,
}

/// Low-level action handed to SendInput. Distinct from `config::InputCommand`,
/// which is the user-facing JSON form.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum InputAction {
    Key { vk: u16, pressed: bool },
    Mouse { button: MouseButton, pressed: bool },
    Scroll { amount: i32 },
    /// Relative cursor move (pixels). Used by stick/gyro→mouse.
    MouseMove { dx: i32, dy: i32 },
}

/// Map a key name to a Win32 virtual-key code. Names are case-sensitive and
/// several aliases are accepted (e.g. "Ctrl"/"Control", "Esc"/"Escape").
pub fn name_to_vk(name: &str) -> Option<u16> {
    let code = match name {
        "Ctrl" | "Control" => VK_CONTROL.0,
        "LCtrl" | "LeftCtrl" => VK_LCONTROL.0,
        "RCtrl" | "RightCtrl" => VK_RCONTROL.0,
        "Alt" => VK_MENU.0,
        "LAlt" | "LeftAlt" => VK_LMENU.0,
        "RAlt" | "RightAlt" => VK_RMENU.0,
        "Shift" => VK_SHIFT.0,
        "LShift" | "LeftShift" => VK_LSHIFT.0,
        "RShift" | "RightShift" => VK_RSHIFT.0,
        "Win" | "Windows" | "LWin" | "LeftWin" => VK_LWIN.0,
        "RWin" | "RightWin" => VK_RWIN.0,
        "Enter" | "Return" => VK_RETURN.0,
        "Space" => VK_SPACE.0,
        "Esc" | "Escape" => VK_ESCAPE.0,
        "Tab" => VK_TAB.0,
        "Backspace" | "Back" => VK_BACK.0,
        "Delete" | "Del" => VK_DELETE.0,
        "Insert" | "Ins" => VK_INSERT.0,
        "Home" => VK_HOME.0,
        "End" => VK_END.0,
        "PageUp" | "PgUp" => VK_PRIOR.0,
        "PageDown" | "PgDn" => VK_NEXT.0,
        "CapsLock" | "Caps" => VK_CAPITAL.0,
        "NumLock" => VK_NUMLOCK.0,
        "ScrollLock" => VK_SCROLL.0,
        "PrintScreen" | "PrtSc" => VK_SNAPSHOT.0,
        "Pause" => VK_PAUSE.0,
        "Left" | "ArrowLeft" => VK_LEFT.0,
        "Right" | "ArrowRight" => VK_RIGHT.0,
        "Up" | "ArrowUp" => VK_UP.0,
        "Down" | "ArrowDown" => VK_DOWN.0,
        "F1" => VK_F1.0,
        "F2" => VK_F2.0,
        "F3" => VK_F3.0,
        "F4" => VK_F4.0,
        "F5" => VK_F5.0,
        "F6" => VK_F6.0,
        "F7" => VK_F7.0,
        "F8" => VK_F8.0,
        "F9" => VK_F9.0,
        "F10" => VK_F10.0,
        "F11" => VK_F11.0,
        "F12" => VK_F12.0,
        "F13" => VK_F13.0,
        "F14" => VK_F14.0,
        "F15" => VK_F15.0,
        "F16" => VK_F16.0,
        "F17" => VK_F17.0,
        "F18" => VK_F18.0,
        "F19" => VK_F19.0,
        "F20" => VK_F20.0,
        "F21" => VK_F21.0,
        "F22" => VK_F22.0,
        "F23" => VK_F23.0,
        "F24" => VK_F24.0,
        // Japanese IME / JIS-layout keys
        "Convert" => VK_CONVERT.0,
        "NonConvert" => VK_NONCONVERT.0,
        "KanaMode" | "Kana" => VK_KANA.0,
        "Hankaku" | "Zenkaku" | "Kanji" => VK_KANJI.0,
        // JIS "\ろ" (left of right Shift). ¥ reuses Backslash (VK_OEM_5).
        "IntlRo" => VK_OEM_102.0,
        // Application (menu) key.
        "Apps" | "Menu" | "ContextMenu" => VK_APPS.0,
        "0" => 0x30,
        "1" => 0x31,
        "2" => 0x32,
        "3" => 0x33,
        "4" => 0x34,
        "5" => 0x35,
        "6" => 0x36,
        "7" => 0x37,
        "8" => 0x38,
        "9" => 0x39,
        "Numpad0" | "Num0" => VK_NUMPAD0.0,
        "Numpad1" | "Num1" => VK_NUMPAD1.0,
        "Numpad2" | "Num2" => VK_NUMPAD2.0,
        "Numpad3" | "Num3" => VK_NUMPAD3.0,
        "Numpad4" | "Num4" => VK_NUMPAD4.0,
        "Numpad5" | "Num5" => VK_NUMPAD5.0,
        "Numpad6" | "Num6" => VK_NUMPAD6.0,
        "Numpad7" | "Num7" => VK_NUMPAD7.0,
        "Numpad8" | "Num8" => VK_NUMPAD8.0,
        "Numpad9" | "Num9" => VK_NUMPAD9.0,
        "NumpadMultiply" | "Num*" => VK_MULTIPLY.0,
        "NumpadAdd" | "Num+" => VK_ADD.0,
        "NumpadSubtract" | "Num-" => VK_SUBTRACT.0,
        "NumpadDivide" | "Num/" => VK_DIVIDE.0,
        "NumpadDecimal" | "Num." => VK_DECIMAL.0,
        "Minus" | "-" => VK_OEM_MINUS.0,
        "Plus" | "=" => VK_OEM_PLUS.0,
        "Comma" | "," => VK_OEM_COMMA.0,
        "Period" | "." => VK_OEM_PERIOD.0,
        "Semicolon" | ";" => VK_OEM_1.0,
        "Slash" | "/" => VK_OEM_2.0,
        "Backquote" | "`" => VK_OEM_3.0,
        "LeftBracket" | "[" => VK_OEM_4.0,
        "Backslash" | "\\" => VK_OEM_5.0,
        "RightBracket" | "]" => VK_OEM_6.0,
        "Quote" | "'" => VK_OEM_7.0,
        "VolumeMute" => VK_VOLUME_MUTE.0,
        "VolumeDown" => VK_VOLUME_DOWN.0,
        "VolumeUp" => VK_VOLUME_UP.0,
        "MediaNextTrack" => VK_MEDIA_NEXT_TRACK.0,
        "MediaPrevTrack" => VK_MEDIA_PREV_TRACK.0,
        "MediaStop" => VK_MEDIA_STOP.0,
        "MediaPlayPause" => VK_MEDIA_PLAY_PAUSE.0,
        "BrowserBack" => VK_BROWSER_BACK.0,
        "BrowserForward" => VK_BROWSER_FORWARD.0,
        "BrowserRefresh" => VK_BROWSER_REFRESH.0,
        "BrowserStop" => VK_BROWSER_STOP.0,
        "BrowserSearch" => VK_BROWSER_SEARCH.0,
        "BrowserFavorites" => VK_BROWSER_FAVORITES.0,
        "BrowserHome" => VK_BROWSER_HOME.0,
        s if s.len() == 1 => {
            let c = s.chars().next()?.to_ascii_uppercase();
            if c.is_ascii_alphabetic() {
                c as u16
            } else {
                return None;
            }
        }
        _ => return None,
    };
    Some(code)
}

pub fn is_modifier_vk(vk: u16) -> bool {
    matches!(
        vk,
        0x10 | 0x11 | 0x12 | 0xA0 | 0xA1 | 0xA2 | 0xA3 | 0xA4 | 0xA5 | 0x5B | 0x5C
    )
}
