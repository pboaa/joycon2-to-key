//! Discovering a Joy-Con 2 by BLE scan and determining its side. Uses the
//! advertisement's manufacturer data (Nintendo company id 0x0553) to decide
//! whether it's a Joy-Con 2 and which side.

use std::time::Duration;

use btleplug::api::{Central, CentralEvent, Peripheral as _, ScanFilter};
use btleplug::platform::{Adapter, Peripheral};
use futures::stream::StreamExt;

use super::protocol::Side;

const NINTENDO_COMPANY_ID: u16 = 0x0553;

// Low byte of the advertised Product ID (index 5 of the company data).
// 0x2066 = Joy-Con 2 (R), 0x2067 = Joy-Con 2 (L). High byte 0x20 is common to the Switch2 family.
const PID_LOW_RIGHT: u8 = 0x66;
const PID_LOW_LEFT: u8 = 0x67;

pub(super) async fn find_joycon(adapter: &Adapter) -> Result<(Peripheral, Side), String> {
    adapter
        .start_scan(ScanFilter::default())
        .await
        .map_err(|e| e.to_string())?;

    let mut events = adapter.events().await.map_err(|e| e.to_string())?;
    let deadline = tokio::time::Instant::now() + Duration::from_secs(15);

    loop {
        let timeout = deadline.saturating_duration_since(tokio::time::Instant::now());
        if timeout.is_zero() {
            let _ = adapter.stop_scan().await;
            return Err("JoyCon2 not found (timeout)".to_string());
        }

        let evt = match tokio::time::timeout(timeout, events.next()).await {
            Ok(Some(evt)) => evt,
            Ok(None) => {
                let _ = adapter.stop_scan().await;
                return Err("BLE event stream closed".to_string());
            }
            Err(_) => {
                let _ = adapter.stop_scan().await;
                return Err("JoyCon2 not found (timeout)".to_string());
            }
        };

        match evt {
            // Fast path: the advertisement already carries the company data, so
            // we match on the first JoyCon2 packet — no per-device properties()
            // round-trip (which may lag by several advertisement cycles).
            CentralEvent::ManufacturerDataAdvertisement {
                id,
                manufacturer_data,
            } => {
                if is_joycon2(&manufacturer_data) {
                    if let Ok(p) = adapter.peripheral(&id).await {
                        let _ = adapter.stop_scan().await;
                        let side = joycon_side(&manufacturer_data).unwrap_or(Side::Left);
                        return Ok((p, side));
                    }
                }
            }
            // Fallback for events without inline manufacturer data.
            CentralEvent::DeviceDiscovered(id) | CentralEvent::DeviceUpdated(id) => {
                let Ok(peripheral) = adapter.peripheral(&id).await else {
                    continue;
                };
                let Ok(Some(props)) = peripheral.properties().await else {
                    continue;
                };
                if is_joycon2(&props.manufacturer_data) {
                    let _ = adapter.stop_scan().await;
                    let side = joycon_side(&props.manufacturer_data).unwrap_or(Side::Left);
                    return Ok((peripheral, side));
                }
            }
            _ => {}
        }
    }
}

/// A Nintendo (0x0553) advertisement whose product byte marks a Joy-Con 2.
fn is_joycon2(manufacturer_data: &std::collections::HashMap<u16, Vec<u8>>) -> bool {
    manufacturer_data
        .get(&NINTENDO_COMPANY_ID)
        .and_then(|d| d.get(6))
        .copied()
        == Some(0x20)
}

/// Determine the side from the low byte of the advertised Product ID (index 5 of
/// the company data). None when it can't be determined (e.g. a Pro Controller).
fn joycon_side(manufacturer_data: &std::collections::HashMap<u16, Vec<u8>>) -> Option<Side> {
    match manufacturer_data
        .get(&NINTENDO_COMPANY_ID)
        .and_then(|d| d.get(5))
        .copied()?
    {
        PID_LOW_LEFT => Some(Side::Left),
        PID_LOW_RIGHT => Some(Side::Right),
        _ => None,
    }
}
