//! List of running apps (for adding profiles).
//!
//! Enumerates visible top-level windows, collapses them to one entry per process,
//! and returns each executable's icon as a PNG (base64 data URL).

use std::collections::BTreeMap;
use std::ffi::c_void;

use base64::Engine as _;
use serde::Serialize;
use windows::core::{PCWSTR, PWSTR};
use windows::Win32::Foundation::{CloseHandle, BOOL, HWND, LPARAM, TRUE};
use windows::Win32::Graphics::Gdi::{
    DeleteObject, GetDC, GetDIBits, GetObjectW, ReleaseDC, BITMAP, BITMAPINFO, BITMAPINFOHEADER,
    BI_RGB, DIB_RGB_COLORS, HDC,
};
use windows::Win32::Storage::FileSystem::FILE_FLAGS_AND_ATTRIBUTES;
use windows::Win32::System::Threading::{
    OpenProcess, QueryFullProcessImageNameW, PROCESS_NAME_WIN32, PROCESS_QUERY_LIMITED_INFORMATION,
};
use windows::Win32::UI::Shell::{SHGetFileInfoW, SHFILEINFOW, SHGFI_ICON, SHGFI_LARGEICON};
use windows::Win32::UI::WindowsAndMessaging::{
    DestroyIcon, EnumWindows, GetIconInfo, GetWindowLongPtrW, GetWindowTextLengthW, GetWindowTextW,
    GetWindowThreadProcessId, IsWindowVisible, GWL_EXSTYLE, HICON, ICONINFO, WS_EX_TOOLWINDOW,
};

#[derive(Serialize)]
pub struct RunningApp {
    /// Executable name (e.g. "chrome.exe"). Used as the profile name.
    pub process: String,
    /// Window title, for display.
    pub title: String,
    /// Icon (data URL, PNG). None if it couldn't be obtained.
    pub icon: Option<String>,
}

struct RawWin {
    pid: u32,
    title: String,
}

pub fn list_running_apps() -> Vec<RunningApp> {
    let mut wins: Vec<RawWin> = Vec::new();
    unsafe {
        let _ = EnumWindows(Some(enum_proc), LPARAM(&mut wins as *mut _ as isize));
    }

    // Group by process name (lowercased). Keep the first title/path seen.
    let mut by_proc: BTreeMap<String, (String, String, String)> = BTreeMap::new();
    for w in wins {
        if let Some((path, base)) = process_path(w.pid) {
            by_proc
                .entry(base.to_ascii_lowercase())
                .or_insert((base, path, w.title));
        }
    }

    let mut out: Vec<RunningApp> = by_proc
        .into_values()
        .map(|(base, path, title)| RunningApp {
            icon: icon_data_url(&path),
            process: base,
            title,
        })
        .collect();
    out.sort_by_key(|a| a.process.to_ascii_lowercase());
    out
}

unsafe extern "system" fn enum_proc(hwnd: HWND, lparam: LPARAM) -> BOOL {
    let wins = &mut *(lparam.0 as *mut Vec<RawWin>);

    if !IsWindowVisible(hwnd).as_bool() {
        return TRUE;
    }
    let ex = GetWindowLongPtrW(hwnd, GWL_EXSTYLE) as u32;
    if ex & WS_EX_TOOLWINDOW.0 != 0 {
        return TRUE;
    }
    let len = GetWindowTextLengthW(hwnd);
    if len == 0 {
        return TRUE;
    }
    let mut buf = vec![0u16; (len + 1) as usize];
    let got = GetWindowTextW(hwnd, &mut buf);
    if got == 0 {
        return TRUE;
    }
    let title = String::from_utf16_lossy(&buf[..got as usize]);

    let mut pid = 0u32;
    GetWindowThreadProcessId(hwnd, Some(&mut pid));
    if pid == 0 {
        return TRUE;
    }
    wins.push(RawWin { pid, title });
    TRUE
}

/// PID → (full executable path, file name).
fn process_path(pid: u32) -> Option<(String, String)> {
    unsafe {
        let handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid).ok()?;
        let mut buf = [0u16; 512];
        let mut size = buf.len() as u32;
        let ok = QueryFullProcessImageNameW(
            handle,
            PROCESS_NAME_WIN32,
            PWSTR(buf.as_mut_ptr()),
            &mut size,
        );
        let _ = CloseHandle(handle);
        if ok.is_err() || size == 0 {
            return None;
        }
        let path = String::from_utf16_lossy(&buf[..size as usize]);
        let base = path
            .rsplit(['\\', '/'])
            .next()
            .unwrap_or(&path)
            .to_string();
        if base.is_empty() {
            return None;
        }
        Some((path, base))
    }
}

/// Turn an executable's icon into a PNG data URL.
fn icon_data_url(path: &str) -> Option<String> {
    unsafe {
        let wide: Vec<u16> = path.encode_utf16().chain(std::iter::once(0)).collect();
        let mut info = SHFILEINFOW::default();
        let r = SHGetFileInfoW(
            PCWSTR(wide.as_ptr()),
            FILE_FLAGS_AND_ATTRIBUTES(0),
            Some(&mut info),
            std::mem::size_of::<SHFILEINFOW>() as u32,
            SHGFI_ICON | SHGFI_LARGEICON,
        );
        if r == 0 || info.hIcon.is_invalid() {
            return None;
        }
        let png = hicon_to_png(info.hIcon);
        let _ = DestroyIcon(info.hIcon);
        let bytes = png?;
        let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
        Some(format!("data:image/png;base64,{b64}"))
    }
}

/// HICON → 32bpp RGBA → PNG bytes.
fn hicon_to_png(hicon: HICON) -> Option<Vec<u8>> {
    unsafe {
        let mut ii = ICONINFO::default();
        if GetIconInfo(hicon, &mut ii).is_err() {
            return None;
        }
        // Bitmaps returned by GetIconInfo must be freed by the caller.
        let color = ii.hbmColor;
        let mask = ii.hbmMask;

        let mut bm = BITMAP::default();
        let got = GetObjectW(
            color,
            std::mem::size_of::<BITMAP>() as i32,
            Some(&mut bm as *mut _ as *mut c_void),
        );
        let w = bm.bmWidth;
        let h = bm.bmHeight;
        if got == 0 || w <= 0 || h <= 0 {
            let _ = DeleteObject(color);
            let _ = DeleteObject(mask);
            return None;
        }

        let mut bmi = BITMAPINFO {
            bmiHeader: BITMAPINFOHEADER {
                biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
                biWidth: w,
                biHeight: -h, // top-down
                biPlanes: 1,
                biBitCount: 32,
                biCompression: BI_RGB.0,
                ..Default::default()
            },
            ..Default::default()
        };

        let mut pixels = vec![0u8; (w * h * 4) as usize];
        let hdc: HDC = GetDC(None);
        let scan = GetDIBits(
            hdc,
            color,
            0,
            h as u32,
            Some(pixels.as_mut_ptr() as *mut c_void),
            &mut bmi,
            DIB_RGB_COLORS,
        );
        ReleaseDC(None, hdc);
        let _ = DeleteObject(color);
        let _ = DeleteObject(mask);
        if scan == 0 {
            return None;
        }

        // BGRA → RGBA. Old icons whose alpha is all 0 are treated as opaque.
        let any_alpha = pixels.chunks_exact(4).any(|p| p[3] != 0);
        for p in pixels.chunks_exact_mut(4) {
            p.swap(0, 2);
            if !any_alpha {
                p[3] = 255;
            }
        }

        let mut out = Vec::new();
        {
            let mut enc = png::Encoder::new(&mut out, w as u32, h as u32);
            enc.set_color(png::ColorType::Rgba);
            enc.set_depth(png::BitDepth::Eight);
            let mut writer = enc.write_header().ok()?;
            writer.write_image_data(&pixels).ok()?;
        }
        Some(out)
    }
}
