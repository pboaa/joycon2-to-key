use std::ffi::OsString;
use std::os::windows::ffi::OsStringExt;

use windows::Win32::Foundation::CloseHandle;
use windows::Win32::System::ProcessStatus::K32GetModuleBaseNameW;
use windows::Win32::System::Threading::{
    OpenProcess, PROCESS_QUERY_LIMITED_INFORMATION, PROCESS_VM_READ,
};
use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowThreadProcessId};

pub fn foreground_process_name() -> String {
    unsafe {
        let hwnd = GetForegroundWindow();
        if hwnd.0.is_null() {
            return "unknown".to_string();
        }

        let mut pid = 0u32;
        GetWindowThreadProcessId(hwnd, Some(&mut pid));
        if pid == 0 {
            return "unknown".to_string();
        }

        let handle =
            match OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION | PROCESS_VM_READ, false, pid) {
                Ok(h) => h,
                Err(_) => return "unknown".to_string(),
            };

        let mut buf = [0u16; 1024];
        let len = K32GetModuleBaseNameW(handle, None, &mut buf);
        let _ = CloseHandle(handle);

        if len == 0 {
            return "unknown".to_string();
        }

        OsString::from_wide(&buf[..len as usize])
            .to_string_lossy()
            .into_owned()
    }
}
