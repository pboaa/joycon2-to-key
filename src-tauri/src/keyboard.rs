use std::collections::HashSet;
use std::sync::Mutex;

use once_cell::sync::Lazy;
use windows::Win32::System::Threading::{
    GetCurrentThread, SetThreadPriority, THREAD_PRIORITY_TIME_CRITICAL,
};
use windows::Win32::UI::Input::KeyboardAndMouse::{
    SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, INPUT_MOUSE, KEYBDINPUT, KEYBD_EVENT_FLAGS,
    KEYEVENTF_KEYUP, MOUSEEVENTF_LEFTDOWN, MOUSEEVENTF_LEFTUP,
    MOUSEEVENTF_MIDDLEDOWN, MOUSEEVENTF_MIDDLEUP, MOUSEEVENTF_MOVE, MOUSEEVENTF_RIGHTDOWN,
    MOUSEEVENTF_RIGHTUP, MOUSEEVENTF_WHEEL, MOUSEINPUT, VIRTUAL_KEY, VK_LMENU, VK_MENU,
    VK_NONAME, VK_RMENU,
};


use crate::keys::{is_modifier_vk, InputAction, MouseButton};

pub fn boost_current_thread_priority() {
    unsafe {
        let _ = SetThreadPriority(GetCurrentThread(), THREAD_PRIORITY_TIME_CRITICAL);
    }
}

/// Send a batch of input actions atomically while keeping ambient
/// modifier state isolated:
/// modifiers held by the user (held_state) are temporarily released
/// around the batch unless the batch itself is changing them, so e.g.
/// holding ZL=Ctrl as a layer doesn't poison every other keystroke.
pub fn send_actions(actions: &[InputAction]) {
    if actions.is_empty() {
        return;
    }

    let mut state = HELD_STATE.lock().unwrap();

    let modifier_changes: Vec<(u16, bool)> = actions
        .iter()
        .filter_map(|a| match a {
            InputAction::Key { vk, pressed } if is_modifier_vk(*vk) => Some((*vk, *pressed)),
            _ => None,
        })
        .collect();
    let modifier_codes_in_batch: HashSet<u16> = modifier_changes.iter().map(|&(c, _)| c).collect();

    let mut held_before: Vec<u16> = state.modifiers.iter().copied().collect();
    held_before.sort_unstable();

    for &(code, pressed) in &modifier_changes {
        if pressed {
            state.modifiers.insert(code);
        } else {
            state.modifiers.remove(&code);
        }
    }

    let temp_releases: Vec<u16> = held_before
        .iter()
        .copied()
        .filter(|c| !modifier_codes_in_batch.contains(c))
        .collect();

    let mut inputs: Vec<INPUT> = Vec::with_capacity(actions.len() + temp_releases.len() * 2);

    for &code in &temp_releases {
        inputs.push(make_key(code, false));
    }

    for action in actions {
        match action {
            InputAction::Key { vk, pressed } => inputs.push(make_key(*vk, *pressed)),
            InputAction::Mouse { button, pressed } => {
                inputs.push(make_mouse(*button, *pressed));
                if *pressed {
                    state.mouse.insert(*button);
                } else {
                    state.mouse.remove(button);
                }
            }
            InputAction::Scroll { amount } => {
                if *amount != 0 {
                    inputs.push(make_scroll(*amount));
                }
            }
            InputAction::MouseMove { dx, dy } => {
                if *dx != 0 || *dy != 0 {
                    inputs.push(make_move(*dx, *dy));
                }
            }
        }
    }

    for &code in &temp_releases {
        inputs.push(make_key(code, true));
    }

    if let Some(last) = inputs.last() {
        if is_alt_down(last) {
            inputs.push(make_key(VK_NONAME.0, true));
            inputs.push(make_key(VK_NONAME.0, false));
        }
    }

    unsafe {
        SendInput(&inputs, std::mem::size_of::<INPUT>() as i32);
    }
}

pub fn release_all() {
    let mut state = HELD_STATE.lock().unwrap();
    if state.modifiers.is_empty() && state.mouse.is_empty() {
        return;
    }
    let keys: Vec<u16> = state.modifiers.drain().collect();
    let mice: Vec<MouseButton> = state.mouse.drain().collect();
    drop(state);

    let mut inputs = Vec::with_capacity(keys.len() + mice.len());
    for code in keys {
        inputs.push(make_key(code, false));
    }
    for b in mice {
        inputs.push(make_mouse(b, false));
    }
    unsafe {
        SendInput(&inputs, std::mem::size_of::<INPUT>() as i32);
    }
}

fn make_key(vk: u16, pressed: bool) -> INPUT {
    INPUT {
        r#type: INPUT_KEYBOARD,
        Anonymous: INPUT_0 {
            ki: KEYBDINPUT {
                wVk: VIRTUAL_KEY(vk),
                wScan: 0,
                dwFlags: if pressed {
                    KEYBD_EVENT_FLAGS(0)
                } else {
                    KEYEVENTF_KEYUP
                },
                time: 0,
                dwExtraInfo: 0,
            },
        },
    }
}

fn make_mouse(button: MouseButton, pressed: bool) -> INPUT {
    let flags = match (button, pressed) {
        (MouseButton::Left, true) => MOUSEEVENTF_LEFTDOWN,
        (MouseButton::Left, false) => MOUSEEVENTF_LEFTUP,
        (MouseButton::Right, true) => MOUSEEVENTF_RIGHTDOWN,
        (MouseButton::Right, false) => MOUSEEVENTF_RIGHTUP,
        (MouseButton::Middle, true) => MOUSEEVENTF_MIDDLEDOWN,
        (MouseButton::Middle, false) => MOUSEEVENTF_MIDDLEUP,
    };
    INPUT {
        r#type: INPUT_MOUSE,
        Anonymous: INPUT_0 {
            mi: MOUSEINPUT {
                dx: 0,
                dy: 0,
                mouseData: 0,
                dwFlags: flags,
                time: 0,
                dwExtraInfo: 0,
            },
        },
    }
}

fn make_move(dx: i32, dy: i32) -> INPUT {
    INPUT {
        r#type: INPUT_MOUSE,
        Anonymous: INPUT_0 {
            mi: MOUSEINPUT {
                dx,
                dy,
                mouseData: 0,
                dwFlags: MOUSEEVENTF_MOVE, // 相対移動
                time: 0,
                dwExtraInfo: 0,
            },
        },
    }
}

fn make_scroll(amount: i32) -> INPUT {
    INPUT {
        r#type: INPUT_MOUSE,
        Anonymous: INPUT_0 {
            mi: MOUSEINPUT {
                dx: 0,
                dy: 0,
                mouseData: amount as u32,
                dwFlags: MOUSEEVENTF_WHEEL,
                time: 0,
                dwExtraInfo: 0,
            },
        },
    }
}

fn is_alt_down(input: &INPUT) -> bool {
    if input.r#type != INPUT_KEYBOARD {
        return false;
    }
    let ki = unsafe { input.Anonymous.ki };
    let is_up = (ki.dwFlags & KEYEVENTF_KEYUP) != KEYBD_EVENT_FLAGS(0);
    !is_up && (ki.wVk == VK_LMENU || ki.wVk == VK_RMENU || ki.wVk == VK_MENU)
}

struct HeldState {
    modifiers: HashSet<u16>,
    mouse: HashSet<MouseButton>,
}

static HELD_STATE: Lazy<Mutex<HeldState>> = Lazy::new(|| {
    Mutex::new(HeldState {
        modifiers: HashSet::new(),
        mouse: HashSet::new(),
    })
});

