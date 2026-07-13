//! Configuration: serde schema (`schema`), lock-free runtime settings view
//! (`runtime`), workspace.json load/save and bundled presets (`storage`), and
//! the builtin starter profile (`defaults`).
//!
//! Everything is re-exported flat, so consumers keep using `crate::config::X`.

mod defaults;
mod runtime;
mod schema;
mod storage;

pub use defaults::*;
pub use runtime::*;
pub use schema::*;
pub use storage::*;
