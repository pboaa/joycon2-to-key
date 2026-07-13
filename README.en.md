# JoyCon2 to Key

*日本語: [README.md](README.md)*

Use a **Nintendo Switch 2 Joy-Con (Joy-Con 2)** as a one-handed shortcut pad on
Windows — map its buttons and stick to keyboard shortcuts, mouse clicks, and
scrolling over Bluetooth LE. Handy as a left-hand device for drawing / creative
apps (Clip Studio, Photoshop, Blender, …).

Built with [Tauri](https://tauri.app/) v2 + React + TypeScript. **Windows only**
(uses the Win32 `SendInput` API).

> **About the Windows warning**: the first time you run the distributed installer
> or app, Windows SmartScreen may show a "Windows protected your PC" prompt. This
> is expected for a personal app that isn't code-signed — click **More info** →
> **Run anyway** to continue.

## Features

- **Direct BLE connection** — connects straight to the Joy-Con 2 (L or R), with
  an always-on reconnect loop that survives the controller's sync/pair button.
- **Key / mouse / scroll** — assign each button a keyboard shortcut, mouse click
  (incl. double-click), or wheel scroll. Modes: **tap**, **hold** (press-and-hold),
  **toggle** (latch on/off), and **repeat** (auto-repeat while held).
- **Layers** — hold a button to switch to another layer for a second set of
  shortcuts, so a few physical buttons cover many actions.
- **Per-application profiles** — mappings switch automatically based on the
  foreground window's process name, with a default profile as fallback.
- **Stick** — use the stick as four directional buttons, or as a mouse cursor
  (per layer).
- **Pie menu** — move the mouse while holding a button to fire an action by
  direction; assign 2–8 directions plus the centre (in place) in a radial menu.
- **Reusable definitions** — save an action once and assign it to many buttons;
  editing the definition updates every button linked to it.
- **Idle auto-disconnect** — after a while with no input, held keys are released
  and the BLE link is dropped to save the Joy-Con's battery (with an optional
  warning buzz just before). Press the sync button to reconnect when you need it.
- **Themes** — light / dark plus color themes (matcha, hatsuyuki); can follow the system.

## Requirements

- **Windows 11** (recommended — the app requests a low-latency BLE connection
  interval that needs Windows 11 build 22000+; it still runs on older versions,
  just with higher input latency).
- A Bluetooth LE adapter.
- A **Nintendo Switch 2 Joy-Con** controller (left or right).

## Getting started

```sh
# install frontend dependencies
npm install

# run in development (hot-reload)
npm run tauri dev

# build a release bundle / installer
npm run tauri build
```

The Rust toolchain and Tauri's platform prerequisites are required — see the
[Tauri prerequisites guide](https://tauri.app/start/prerequisites/).

### Connecting the controller

1. Launch the app.
2. Put the Joy-Con 2 into pairing mode (hold the small **sync** button until the
   lights run).
3. The app scans and connects automatically; the connection indicator turns active.

## Configuration

Everything is edited in the app. State is saved to a `workspace.json` file (app
settings + the saved-action library + all profiles) in the per-user app data
directory; it is written whenever you change something.

Each button carries one assignment. Assignment types:

- **input** — keyboard / mouse / scroll, in `tap` / `hold` / `toggle` mode, with
  an optional `repeatMs` for repeat.
- **pie** — move the mouse while holding the button to fire an action by
  direction (pie menu).
- **layerHold** — hold to switch to another layer (releasing restores the
  previous one), optionally holding modifier keys while active.

You can edit everything from the in-app Settings; hand-editing the JSON is also
supported.

## How it works

- `joycon/` — BLE scan / connect / reconnect and Joy-Con 2 frame parsing
  (buttons + stick): `discovery`, `link`, `protocol`, `telemetry`.
- `input_thread.rs` — a dedicated OS thread owns `SendInput`, isolated from the
  async runtime so a blocking send never stalls the BLE stream.
- `processor/` — the mapping state machine (down / hold / up, profiles, layers,
  pie, repeat, stick→mouse).
- `keyboard.rs` / `keys.rs` / `mouse.rs` — Win32 input emission and key-name →
  virtual-key mapping.
- `config/` — config schema (serde) plus load / save and the built-in default.
- The React frontend (`src/`) provides the main and settings UI.

## Trademark / disclaimer

This is an unofficial, personal project and is **not affiliated with, endorsed
by, sponsored by, or associated with Nintendo Co., Ltd.** "Nintendo Switch",
"Joy-Con", and other names are trademarks of their respective owners, used here
only for compatibility and identification purposes.

Use at your own risk (subject to the no-warranty terms of the
[GNU GPL v3 License](LICENSE)).

## License

[GNU General Public License v3.0 or later](LICENSE) © pboaa
