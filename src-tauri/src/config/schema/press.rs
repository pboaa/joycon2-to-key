//! Press types: what a button does when pressed (input / pie / layer-hold) and
//! the individual input commands a press fires.

use serde::{Deserialize, Serialize};

use crate::keys::MouseButton;

use super::*;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum PressConfig {
    Input(InputPress),
    // Boxed: `PiePress` is much larger than the other variants, so keeping it
    // inline made every stored assignment (mostly plain key inputs) that big.
    // serde treats `Box<T>` transparently, so the JSON shape is unchanged.
    Pie(Box<PiePress>),
    LayerHold(LayerHoldPress),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum InputMode {
    #[default]
    Tap,
    Hold,
    /// Press once to latch the keys down, press again to release them. The keys
    /// stay held between presses (unlike Hold, which releases on button-up).
    Toggle,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InputPress {
    #[serde(default)]
    pub mode: InputMode,
    #[serde(default)]
    pub label: Option<String>,
    #[serde(default)]
    pub repeat_ms: Option<u64>,
    #[serde(default)]
    pub inputs: Vec<InputCommand>,
}

/// Hold to switch to `layer`; releasing restores the previously active layer.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LayerHoldPress {
    #[serde(default)]
    pub label: Option<String>,
    #[serde(default)]
    pub layer: String,
    /// Optional keys/modifiers held while the layer is active (lets a momentary
    /// layer double as a combination button, e.g. also hold Ctrl).
    #[serde(default)]
    pub inputs: Vec<InputCommand>,
}

/// User-facing input descriptor (mirrors `InputCommand` in `src/lib/types.ts`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum InputCommand {
    Keyboard {
        value: String,
    },
    MouseButton {
        #[serde(default = "default_mouse_left")]
        value: MouseButtonName,
        /// Fire two rapid clicks (double-click) instead of one.
        #[serde(default)]
        double: bool,
    },
    Scroll {
        value: ScrollDir,
        #[serde(default)]
        amount: Option<i32>,
    },
    /// Reference a saved definition (input type): fires that definition's inputs.
    /// Resolved live from the definitions map so editing the definition updates
    /// every reference. The runtime expands it before firing.
    Def {
        #[serde(default)]
        def: String,
    },
}

fn default_mouse_left() -> MouseButtonName {
    MouseButtonName::Left
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum MouseButtonName {
    Left,
    Right,
    Middle,
}

impl From<MouseButtonName> for MouseButton {
    fn from(v: MouseButtonName) -> Self {
        match v {
            MouseButtonName::Left => MouseButton::Left,
            MouseButtonName::Right => MouseButton::Right,
            MouseButtonName::Middle => MouseButton::Middle,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ScrollDir {
    Up,
    Down,
}
