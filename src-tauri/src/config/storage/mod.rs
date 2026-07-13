//! Persistence for the app: the unified workspace.json (`workspace`), the daily
//! usage stores (`usage`), rotating timestamped backups (`backups`), the portable
//! export/import bundle (`bundle`), and the bundled preset seed (`seed`).
//! Re-exported flat, so consumers keep using `crate::config::X`.

mod backups;
mod bundle;
mod seed;
mod usage;
mod workspace;

pub use backups::*;
pub use bundle::*;
pub use seed::*;
pub use usage::*;
pub use workspace::*;
