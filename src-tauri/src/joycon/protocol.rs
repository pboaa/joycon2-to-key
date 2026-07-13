//! Joy-Con 2 wire-format (Input Report 0x05) parsing. All pure functions with no
//! dependency on the BLE connection or runtime state. This is where a frame's raw
//! bytes are turned into the digital representation of buttons / stick / motion.

use serde::Serialize;

use crate::buttons::{ButtonSet, JoyConButtons};

// Joy-Con 2 BLE packet layout (byte offsets into each notification frame).
// Input Report 0x05 is common to every controller. Buttons are 4 bytes from 0x04,
// but we currently read a u32 LE from offset 0x03 and use the bits in
// data[4]/data[5]/data[6].
const PACKET_ID_OFFSET: usize = 0x00;
const BUTTONS_OFFSET: usize = 0x03;
// Left stick at 0x0A, right stick at 0x0D (the unused side holds garbage).
const LEFT_STICK_OFFSET: usize = 0x0a;
const RIGHT_STICK_OFFSET: usize = 0x0d;
pub(super) const REQUIRED_FRAME_LEN: usize = RIGHT_STICK_OFFSET + 3;
// Battery voltage (mV) u16 LE @0x1F, charge-state byte @0x21. Shortest frame that
// includes both is 0x22.
pub(super) const BATTERY_MV_OFFSET: usize = 0x1f;
pub(super) const BATTERY_CHARGE_OFFSET: usize = 0x21;
pub(super) const BATTERY_FRAME_LEN: usize = 0x22;
// Extra telemetry (per Joycon2forMac). Current s16 @0x28 (mA = raw/100),
// temperature s16 @0x2E (°C = 25 + raw/127).
pub(super) const CURRENT_OFFSET: usize = 0x28;
pub(super) const TEMP_OFFSET: usize = 0x2e;
// Minimum length of an extended frame, used to decide whether current/temp exist.
pub(super) const DIAG_FRAME_LEN: usize = TEMP_OFFSET + 2; // 0x30

// Left Joy-Con buttons (data[6] = button field byte2) and the shared byte (data[5]).
const BTN_MINUS: u32 = 0x00010000;
const BTN_STICK_PRESS: u32 = 0x00080000; // L3
const BTN_CAPTURE: u32 = 0x00200000;
const BTN_DOWN: u32 = 0x01000000;
const BTN_UP: u32 = 0x02000000;
const BTN_RIGHT: u32 = 0x04000000;
const BTN_LEFT: u32 = 0x08000000;
const BTN_SR: u32 = 0x10000000;
const BTN_SL: u32 = 0x20000000;
const BTN_L: u32 = 0x40000000;
const BTN_ZL: u32 = 0x80000000;

// Right Joy-Con face buttons (data[4] = button field byte0) and the shared byte (data[5]).
const BTN_Y: u32 = 0x00000100;
const BTN_X: u32 = 0x00000200;
const BTN_B: u32 = 0x00000400;
const BTN_A: u32 = 0x00000800;
const BTN_SR_R: u32 = 0x00001000; // right-side SR
const BTN_SL_R: u32 = 0x00002000; // right-side SL
const BTN_R: u32 = 0x00004000;
const BTN_ZR: u32 = 0x00008000;
const BTN_PLUS: u32 = 0x00020000;
const BTN_R_STICK_PRESS: u32 = 0x00040000; // R3
const BTN_HOME: u32 = 0x00100000;
const BTN_CHAT: u32 = 0x00400000; // C (GameChat) button

const STICK_CENTER: i32 = 2000;
const STICK_RANGE: i32 = 1000;
const STICK_DEADZONE: f32 = 0.15;
const STICK_THRESHOLD: f32 = 0.7;

/// Which side (left/right) the connected Joy-Con is. Determined from the
/// advertised Product ID.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Default)]
pub enum Side {
    #[default]
    #[serde(rename = "l")]
    Left,
    #[serde(rename = "r")]
    Right,
}

#[derive(Debug, Clone, Copy, Default, Serialize)]
pub struct StickXY {
    pub x: f32,
    pub y: f32,
}

#[derive(Debug, Clone, Copy, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct JoyConSnapshot {
    pub packet_id: u32,
    pub buttons: JoyConButtons,
    pub stick: StickXY,
    pub side: Side,
}

pub(super) fn parse_snapshot(data: &[u8], side: Side, stick_deadzone01: f32) -> JoyConSnapshot {
    let packet_id = read_u24_le(data, PACKET_ID_OFFSET);
    let raw = read_u32_le(data, BUTTONS_OFFSET);
    let stick = parse_stick(data, side);
    let mut buttons = parse_buttons(raw);
    apply_stick_directions(&mut buttons, stick, side, stick_deadzone01);
    JoyConSnapshot {
        packet_id,
        buttons,
        stick: StickXY {
            x: stick.0,
            y: stick.1,
        },
        side,
    }
}

fn parse_buttons(raw: u32) -> JoyConButtons {
    // SL/SR and stick-press use different bits per side, so split them into
    // separate fields. Stick direction is set later by `apply_stick_directions`,
    // only for the connected side.
    JoyConButtons {
        up: raw & BTN_UP != 0,
        down: raw & BTN_DOWN != 0,
        left: raw & BTN_LEFT != 0,
        right: raw & BTN_RIGHT != 0,
        l: raw & BTN_L != 0,
        zl: raw & BTN_ZL != 0,
        sl: raw & BTN_SL != 0,
        sr: raw & BTN_SR != 0,
        minus: raw & BTN_MINUS != 0,
        capture: raw & BTN_CAPTURE != 0,
        stick_press: raw & BTN_STICK_PRESS != 0,
        a: raw & BTN_A != 0,
        b: raw & BTN_B != 0,
        x: raw & BTN_X != 0,
        y: raw & BTN_Y != 0,
        r: raw & BTN_R != 0,
        zr: raw & BTN_ZR != 0,
        plus: raw & BTN_PLUS != 0,
        home: raw & BTN_HOME != 0,
        chat: raw & BTN_CHAT != 0,
        sl_r: raw & BTN_SL_R != 0,
        sr_r: raw & BTN_SR_R != 0,
        stick_press_r: raw & BTN_R_STICK_PRESS != 0,
        ..Default::default()
    }
}

/// The 4 stick direction flags (up, down, left, right). `deadzone01` is the
/// radial centre cutoff (0..1); outside it, per-axis threshold decides each
/// cardinal (two may be true at once on a diagonal).
fn stick_directions(x: f32, y: f32, deadzone01: f32) -> [bool; 4] {
    let mag = (x * x + y * y).sqrt();
    if mag < deadzone01 {
        return [false; 4];
    }
    [
        y > STICK_THRESHOLD,
        y < -STICK_THRESHOLD,
        x < -STICK_THRESHOLD,
        x > STICK_THRESHOLD,
    ]
}

/// Fill the connected side's stick direction flags on `b` from the stick.
fn apply_stick_directions(b: &mut JoyConButtons, stick: (f32, f32), side: Side, deadzone01: f32) {
    let [u, d, l, r] = stick_directions(stick.0, stick.1, deadzone01);
    if matches!(side, Side::Left) {
        b.stick_up = u;
        b.stick_down = d;
        b.stick_left = l;
        b.stick_right = r;
    } else {
        b.stick_up_r = u;
        b.stick_down_r = d;
        b.stick_left_r = l;
        b.stick_right_r = r;
    }
}

/// Pressed buttons as a bit set (zero allocation, sent every BLE frame). The
/// bit order comes from [`JoyConButtons::flags`], which is generated from the
/// same table as [`crate::buttons::BUTTON_NAMES`], so they can't drift apart.
pub(super) fn pressed_set(snap: &JoyConSnapshot) -> ButtonSet {
    ButtonSet::from_flags(snap.buttons.flags())
}

fn parse_stick(data: &[u8], side: Side) -> (f32, f32) {
    let offset = match side {
        Side::Left => LEFT_STICK_OFFSET,
        Side::Right => RIGHT_STICK_OFFSET,
    };
    if data.len() < offset + 3 {
        return (0.0, 0.0);
    }
    let raw = (data[offset] as u32)
        | ((data[offset + 1] as u32) << 8)
        | ((data[offset + 2] as u32) << 16);
    let raw_x = (raw & 0x0fff) as i32;
    let raw_y = ((raw >> 12) & 0x0fff) as i32;
    let x = normalize_axis(raw_x);
    let y = normalize_axis(raw_y);
    apply_deadzone(x, y)
}

fn normalize_axis(v: i32) -> f32 {
    let diff = (v - STICK_CENTER) as f32;
    let n = diff / STICK_RANGE as f32;
    n.clamp(-1.0, 1.0)
}

fn apply_deadzone(x: f32, y: f32) -> (f32, f32) {
    let mag = (x * x + y * y).sqrt();
    if mag < STICK_DEADZONE {
        return (0.0, 0.0);
    }
    let scale = (mag - STICK_DEADZONE) / (1.0 - STICK_DEADZONE);
    ((x / mag) * scale, (y / mag) * scale)
}

fn read_u24_le(data: &[u8], offset: usize) -> u32 {
    if data.len() < offset + 3 {
        return 0;
    }
    (data[offset] as u32) | ((data[offset + 1] as u32) << 8) | ((data[offset + 2] as u32) << 16)
}

fn read_u32_le(data: &[u8], offset: usize) -> u32 {
    if data.len() < offset + 4 {
        return 0;
    }
    u32::from_le_bytes([
        data[offset],
        data[offset + 1],
        data[offset + 2],
        data[offset + 3],
    ])
}

/// Build a WRITE-characteristic command frame (subcommand envelope). Used by the
/// link module's LED / vibration / IMU-enable helpers.
pub(super) fn build_command(cmd_id: u8, sub_cmd_id: u8, data: &[u8]) -> Vec<u8> {
    let padded_len = data.len().max(8);
    let mut padded = vec![0u8; padded_len];
    padded[..data.len()].copy_from_slice(data);

    let mut cmd = Vec::with_capacity(8 + padded.len());
    cmd.extend_from_slice(&[
        cmd_id,
        0x91,
        0x01,
        sub_cmd_id,
        0x00,
        padded.len() as u8,
        0x00,
        0x00,
    ]);
    cmd.extend_from_slice(&padded);
    cmd
}

#[cfg(test)]
mod pressed_set_tests {
    use super::*;

    /// `pressed_set` must yield the same names the old HashSet<String>
    /// implementation produced for each flag.
    #[test]
    fn bit_order_matches_button_names() {
        let mut snap = JoyConSnapshot::default();
        snap.buttons.zl = true;
        snap.buttons.stick_up = true;
        snap.buttons.minus = true;
        let names: Vec<&str> = pressed_set(&snap).iter_names().map(|(_, n)| n).collect();
        assert_eq!(names, vec!["zl", "minus", "stickUp"]);
    }
}
