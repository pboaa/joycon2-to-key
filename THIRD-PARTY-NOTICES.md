# Third-Party Notices

JoyCon2 to Key (licensed under GPL-3.0-or-later) bundles and links the following
third-party components. They are under permissive licenses (MIT / Apache-2.0 /
BSD / ISC / Zlib / Unicode / etc.), plus a few MPL-2.0 (weak copyleft) crates —
all of which are compatible with GPL-3.0. No GPL-2-only, proprietary, or
network-copyleft (AGPL) dependencies are present.

The Rust list is resolved for the shipped target (`x86_64-pc-windows-msvc`), so the
macOS/Linux BLE backends are excluded. Generated from `cargo metadata` and
`npm ls --omit=dev` (run `node scripts/gen-thirdparty.mjs` to refresh).

Generated: 2026-07-13

## Rust crates (331)

License summary: MIT OR Apache-2.0 (170), MIT (68), Apache-2.0 OR MIT (31), Unicode-3.0 (18), MIT/Apache-2.0 (14), MPL-2.0 (7), Unlicense OR MIT (4), BSD-3-Clause (2), Unlicense/MIT (2), 0BSD OR MIT OR Apache-2.0 (1), BSD-3-Clause AND MIT (1), BSD-3-Clause/MIT (1), MIT/Apache-2.0/BSD-3-Clause (1), Apache-2.0 AND MIT (1), CC0-1.0 OR MIT-0 OR Apache-2.0 (1), Apache-2.0 / MIT (1), Zlib (1), MIT / Apache-2.0 (1), Apache-2.0/MIT (1), MIT OR Zlib OR Apache-2.0 (1), MIT OR Apache-2.0 OR Zlib (1), Apache-2.0 (1), (MIT OR Apache-2.0) AND Unicode-3.0 (1), BSD-2-Clause OR Apache-2.0 OR MIT (1)

| Package | Version | License |
|---|---|---|
| [adler2](https://github.com/oyvindln/adler2) | 2.0.1 | 0BSD OR MIT OR Apache-2.0 |
| [aho-corasick](https://github.com/BurntSushi/aho-corasick) | 1.1.4 | Unlicense OR MIT |
| [alloc-no-stdlib](https://github.com/dropbox/rust-alloc-no-stdlib) | 2.0.4 | BSD-3-Clause |
| [alloc-stdlib](https://github.com/dropbox/rust-alloc-no-stdlib) | 0.2.2 | BSD-3-Clause |
| [anyhow](https://github.com/dtolnay/anyhow) | 1.0.102 | MIT OR Apache-2.0 |
| [async-trait](https://github.com/dtolnay/async-trait) | 0.1.89 | MIT OR Apache-2.0 |
| [autocfg](https://github.com/cuviper/autocfg) | 1.5.0 | Apache-2.0 OR MIT |
| [base64](https://github.com/marshallpierce/rust-base64) | 0.22.1 | MIT OR Apache-2.0 |
| [bit-set](https://github.com/contain-rs/bit-set) | 0.8.0 | Apache-2.0 OR MIT |
| [bit-vec](https://github.com/contain-rs/bit-vec) | 0.8.0 | Apache-2.0 OR MIT |
| [bitflags](https://github.com/bitflags/bitflags) | 1.3.2 | MIT/Apache-2.0 |
| [bitflags](https://github.com/bitflags/bitflags) | 2.11.1 | MIT OR Apache-2.0 |
| [block-buffer](https://github.com/RustCrypto/utils) | 0.10.4 | MIT OR Apache-2.0 |
| [brotli](https://github.com/dropbox/rust-brotli) | 8.0.2 | BSD-3-Clause AND MIT |
| [brotli-decompressor](https://github.com/dropbox/rust-brotli-decompressor) | 5.0.0 | BSD-3-Clause/MIT |
| [btleplug](https://github.com/deviceplug/btleplug) | 0.12.0 | MIT/Apache-2.0/BSD-3-Clause |
| [byteorder](https://github.com/BurntSushi/byteorder) | 1.5.0 | Unlicense OR MIT |
| [bytes](https://github.com/tokio-rs/bytes) | 1.11.1 | MIT |
| [camino](https://github.com/camino-rs/camino) | 1.2.2 | MIT OR Apache-2.0 |
| [cargo_metadata](https://github.com/oli-obk/cargo_metadata) | 0.19.2 | MIT |
| [cargo_toml](https://gitlab.com/lib.rs/cargo_toml) | 0.22.3 | Apache-2.0 OR MIT |
| [cargo-platform](https://github.com/rust-lang/cargo) | 0.1.9 | MIT OR Apache-2.0 |
| [cc](https://github.com/rust-lang/cc-rs) | 1.2.61 | MIT OR Apache-2.0 |
| [cfb](https://github.com/mdsteele/rust-cfb) | 0.7.3 | MIT |
| [cfg-if](https://github.com/rust-lang/cfg-if) | 1.0.4 | MIT OR Apache-2.0 |
| [chrono](https://github.com/chronotope/chrono) | 0.4.44 | MIT OR Apache-2.0 |
| [convert_case](https://github.com/rutrum/convert-case) | 0.4.0 | MIT |
| [cookie](https://github.com/SergioBenitez/cookie-rs) | 0.18.1 | MIT OR Apache-2.0 |
| [cpufeatures](https://github.com/RustCrypto/utils) | 0.2.17 | MIT OR Apache-2.0 |
| [crc32fast](https://github.com/srijs/rust-crc32fast) | 1.5.0 | MIT OR Apache-2.0 |
| [crossbeam-channel](https://github.com/crossbeam-rs/crossbeam) | 0.5.15 | MIT OR Apache-2.0 |
| [crossbeam-utils](https://github.com/crossbeam-rs/crossbeam) | 0.8.21 | MIT OR Apache-2.0 |
| [crypto-common](https://github.com/RustCrypto/traits) | 0.1.7 | MIT OR Apache-2.0 |
| [cssparser](https://github.com/servo/rust-cssparser) | 0.29.6 | MPL-2.0 |
| [cssparser](https://github.com/servo/rust-cssparser) | 0.36.0 | MPL-2.0 |
| [cssparser-macros](https://github.com/servo/rust-cssparser) | 0.6.1 | MPL-2.0 |
| [ctor](https://github.com/mmastrac/rust-ctor) | 0.8.0 | Apache-2.0 OR MIT |
| [ctor-proc-macro](https://github.com/mmastrac/rust-ctor) | 0.0.7 | Apache-2.0 OR MIT |
| [darling](https://github.com/TedDriggs/darling) | 0.23.0 | MIT |
| [darling_core](https://github.com/TedDriggs/darling) | 0.23.0 | MIT |
| [darling_macro](https://github.com/TedDriggs/darling) | 0.23.0 | MIT |
| [dashmap](https://github.com/xacrimon/dashmap) | 6.1.0 | MIT |
| [deranged](https://github.com/jhpratt/deranged) | 0.5.8 | MIT OR Apache-2.0 |
| [derive_more](https://github.com/JelteF/derive_more) | 0.99.20 | MIT |
| [derive_more](https://github.com/JelteF/derive_more) | 2.1.1 | MIT |
| [derive_more-impl](https://github.com/JelteF/derive_more) | 2.1.1 | MIT |
| [digest](https://github.com/RustCrypto/traits) | 0.10.7 | MIT OR Apache-2.0 |
| [dirs](https://github.com/soc/dirs-rs) | 6.0.0 | MIT OR Apache-2.0 |
| [dirs-sys](https://github.com/dirs-dev/dirs-sys-rs) | 0.5.0 | MIT OR Apache-2.0 |
| [displaydoc](https://github.com/yaahc/displaydoc) | 0.2.5 | MIT OR Apache-2.0 |
| [dom_query](https://github.com/niklak/dom_query) | 0.27.0 | MIT |
| [dpi](https://github.com/rust-windowing/winit) | 0.1.2 | Apache-2.0 AND MIT |
| [dtoa](https://github.com/dtolnay/dtoa) | 1.0.11 | MIT OR Apache-2.0 |
| [dtoa-short](https://github.com/upsuper/dtoa-short) | 0.3.5 | MPL-2.0 |
| [dtor](https://github.com/mmastrac/rust-ctor) | 0.3.0 | Apache-2.0 OR MIT |
| [dtor-proc-macro](https://github.com/mmastrac/rust-ctor) | 0.0.6 | Apache-2.0 OR MIT |
| [dunce](https://gitlab.com/kornelski/dunce) | 1.0.5 | CC0-1.0 OR MIT-0 OR Apache-2.0 |
| [dyn-clone](https://github.com/dtolnay/dyn-clone) | 1.0.20 | MIT OR Apache-2.0 |
| [embed-resource](https://github.com/nabijaczleweli/rust-embed-resource) | 3.0.9 | MIT |
| [equivalent](https://github.com/indexmap-rs/equivalent) | 1.0.2 | Apache-2.0 OR MIT |
| [erased-serde](https://github.com/dtolnay/erased-serde) | 0.4.10 | MIT OR Apache-2.0 |
| [fastrand](https://github.com/smol-rs/fastrand) | 2.4.1 | Apache-2.0 OR MIT |
| [fdeflate](https://github.com/image-rs/fdeflate) | 0.3.7 | MIT OR Apache-2.0 |
| [find-msvc-tools](https://github.com/rust-lang/cc-rs) | 0.1.9 | MIT OR Apache-2.0 |
| [flate2](https://github.com/rust-lang/flate2-rs) | 1.1.9 | MIT OR Apache-2.0 |
| [fnv](https://github.com/servo/rust-fnv) | 1.0.7 | Apache-2.0 / MIT |
| [foldhash](https://github.com/orlp/foldhash) | 0.2.0 | Zlib |
| [form_urlencoded](https://github.com/servo/rust-url) | 1.2.2 | MIT OR Apache-2.0 |
| [futf](https://github.com/servo/futf) | 0.1.5 | MIT / Apache-2.0 |
| [futures](https://github.com/rust-lang/futures-rs) | 0.3.32 | MIT OR Apache-2.0 |
| [futures-channel](https://github.com/rust-lang/futures-rs) | 0.3.32 | MIT OR Apache-2.0 |
| [futures-core](https://github.com/rust-lang/futures-rs) | 0.3.32 | MIT OR Apache-2.0 |
| [futures-executor](https://github.com/rust-lang/futures-rs) | 0.3.32 | MIT OR Apache-2.0 |
| [futures-io](https://github.com/rust-lang/futures-rs) | 0.3.32 | MIT OR Apache-2.0 |
| [futures-macro](https://github.com/rust-lang/futures-rs) | 0.3.32 | MIT OR Apache-2.0 |
| [futures-sink](https://github.com/rust-lang/futures-rs) | 0.3.32 | MIT OR Apache-2.0 |
| [futures-task](https://github.com/rust-lang/futures-rs) | 0.3.32 | MIT OR Apache-2.0 |
| [futures-util](https://github.com/rust-lang/futures-rs) | 0.3.32 | MIT OR Apache-2.0 |
| [fxhash](https://github.com/cbreeden/fxhash) | 0.2.1 | Apache-2.0/MIT |
| [generic-array](https://github.com/fizyk20/generic-array) | 0.14.7 | MIT |
| [getrandom](https://github.com/rust-random/getrandom) | 0.1.16 | MIT OR Apache-2.0 |
| [getrandom](https://github.com/rust-random/getrandom) | 0.2.17 | MIT OR Apache-2.0 |
| [getrandom](https://github.com/rust-random/getrandom) | 0.3.4 | MIT OR Apache-2.0 |
| [getrandom](https://github.com/rust-random/getrandom) | 0.4.2 | MIT OR Apache-2.0 |
| [glob](https://github.com/rust-lang/glob) | 0.3.3 | MIT OR Apache-2.0 |
| [hashbrown](https://github.com/rust-lang/hashbrown) | 0.12.3 | MIT OR Apache-2.0 |
| [hashbrown](https://github.com/rust-lang/hashbrown) | 0.14.5 | MIT OR Apache-2.0 |
| [hashbrown](https://github.com/rust-lang/hashbrown) | 0.17.0 | MIT OR Apache-2.0 |
| [heck](https://github.com/withoutboats/heck) | 0.5.0 | MIT OR Apache-2.0 |
| [hex](https://github.com/KokaKiwi/rust-hex) | 0.4.3 | MIT OR Apache-2.0 |
| [html5ever](https://github.com/servo/html5ever) | 0.29.1 | MIT OR Apache-2.0 |
| [html5ever](https://github.com/servo/html5ever) | 0.38.0 | MIT OR Apache-2.0 |
| [http](https://github.com/hyperium/http) | 1.4.0 | MIT OR Apache-2.0 |
| [ico](https://github.com/mdsteele/rust-ico) | 0.5.0 | MIT |
| [icu_collections](https://github.com/unicode-org/icu4x) | 2.2.0 | Unicode-3.0 |
| [icu_locale_core](https://github.com/unicode-org/icu4x) | 2.2.0 | Unicode-3.0 |
| [icu_normalizer](https://github.com/unicode-org/icu4x) | 2.2.0 | Unicode-3.0 |
| [icu_normalizer_data](https://github.com/unicode-org/icu4x) | 2.2.0 | Unicode-3.0 |
| [icu_properties](https://github.com/unicode-org/icu4x) | 2.2.0 | Unicode-3.0 |
| [icu_properties_data](https://github.com/unicode-org/icu4x) | 2.2.0 | Unicode-3.0 |
| [icu_provider](https://github.com/unicode-org/icu4x) | 2.2.0 | Unicode-3.0 |
| [ident_case](https://github.com/TedDriggs/ident_case) | 1.0.1 | MIT/Apache-2.0 |
| [idna](https://github.com/servo/rust-url/) | 1.1.0 | MIT OR Apache-2.0 |
| [idna_adapter](https://github.com/hsivonen/idna_adapter) | 1.2.1 | Apache-2.0 OR MIT |
| [indexmap](https://github.com/bluss/indexmap) | 1.9.3 | Apache-2.0 OR MIT |
| [indexmap](https://github.com/indexmap-rs/indexmap) | 2.14.0 | Apache-2.0 OR MIT |
| [infer](https://github.com/bojand/infer) | 0.19.0 | MIT |
| [itoa](https://github.com/dtolnay/itoa) | 1.0.18 | MIT OR Apache-2.0 |
| [json-patch](https://github.com/idubrov/json-patch) | 3.0.1 | MIT/Apache-2.0 |
| [jsonptr](https://github.com/chanced/jsonptr) | 0.6.3 | MIT OR Apache-2.0 |
| [keyboard-types](https://github.com/pyfisch/keyboard-types) | 0.7.0 | MIT OR Apache-2.0 |
| [kuchikiki](https://github.com/brave/kuchikiki) | 0.8.8-speedreader | MIT |
| [libc](https://github.com/rust-lang/libc) | 0.2.186 | MIT OR Apache-2.0 |
| [litemap](https://github.com/unicode-org/icu4x) | 0.8.2 | Unicode-3.0 |
| [lock_api](https://github.com/Amanieu/parking_lot) | 0.4.14 | MIT OR Apache-2.0 |
| [log](https://github.com/rust-lang/log) | 0.4.29 | MIT OR Apache-2.0 |
| [mac](https://github.com/reem/rust-mac) | 0.1.1 | MIT/Apache-2.0 |
| [markup5ever](https://github.com/servo/html5ever) | 0.14.1 | MIT OR Apache-2.0 |
| [markup5ever](https://github.com/servo/html5ever) | 0.38.0 | MIT OR Apache-2.0 |
| [match_token](https://github.com/servo/html5ever) | 0.1.0 | MIT OR Apache-2.0 |
| [matches](https://github.com/SimonSapin/rust-std-candidates) | 0.1.10 | MIT |
| [memchr](https://github.com/BurntSushi/memchr) | 2.8.0 | Unlicense OR MIT |
| [mime](https://github.com/hyperium/mime) | 0.3.17 | MIT OR Apache-2.0 |
| [miniz_oxide](https://github.com/Frommi/miniz_oxide/tree/master/miniz_oxide) | 0.8.9 | MIT OR Zlib OR Apache-2.0 |
| [mio](https://github.com/tokio-rs/mio) | 1.2.0 | MIT |
| [muda](https://github.com/tauri-apps/muda) | 0.19.3 | Apache-2.0 OR MIT |
| [new_debug_unreachable](https://github.com/mbrubeck/rust-debug-unreachable) | 1.0.6 | MIT |
| [nodrop](https://github.com/bluss/arrayvec) | 0.1.14 | MIT/Apache-2.0 |
| [num-conv](https://github.com/jhpratt/num-conv) | 0.2.1 | MIT OR Apache-2.0 |
| [num-traits](https://github.com/rust-num/num-traits) | 0.2.19 | MIT OR Apache-2.0 |
| [once_cell](https://github.com/matklad/once_cell) | 1.21.4 | MIT OR Apache-2.0 |
| [open](https://github.com/Byron/open-rs) | 5.3.4 | MIT |
| [option-ext](https://github.com/soc/option-ext) | 0.2.0 | MPL-2.0 |
| [parking_lot](https://github.com/Amanieu/parking_lot) | 0.12.5 | MIT OR Apache-2.0 |
| [parking_lot_core](https://github.com/Amanieu/parking_lot) | 0.9.12 | MIT OR Apache-2.0 |
| [percent-encoding](https://github.com/servo/rust-url/) | 2.3.2 | MIT OR Apache-2.0 |
| [phf](https://github.com/sfackler/rust-phf) | 0.8.0 | MIT |
| [phf](https://github.com/sfackler/rust-phf) | 0.10.1 | MIT |
| [phf](https://github.com/rust-phf/rust-phf) | 0.11.3 | MIT |
| [phf](https://github.com/rust-phf/rust-phf) | 0.13.1 | MIT |
| [phf_codegen](https://github.com/sfackler/rust-phf) | 0.8.0 | MIT |
| [phf_codegen](https://github.com/rust-phf/rust-phf) | 0.11.3 | MIT |
| [phf_codegen](https://github.com/rust-phf/rust-phf) | 0.13.1 | MIT |
| [phf_generator](https://github.com/sfackler/rust-phf) | 0.8.0 | MIT |
| [phf_generator](https://github.com/sfackler/rust-phf) | 0.10.0 | MIT |
| [phf_generator](https://github.com/rust-phf/rust-phf) | 0.11.3 | MIT |
| [phf_generator](https://github.com/rust-phf/rust-phf) | 0.13.1 | MIT |
| [phf_macros](https://github.com/sfackler/rust-phf) | 0.10.0 | MIT |
| [phf_macros](https://github.com/rust-phf/rust-phf) | 0.13.1 | MIT |
| [phf_shared](https://github.com/sfackler/rust-phf) | 0.8.0 | MIT |
| [phf_shared](https://github.com/sfackler/rust-phf) | 0.10.0 | MIT |
| [phf_shared](https://github.com/rust-phf/rust-phf) | 0.11.3 | MIT |
| [phf_shared](https://github.com/rust-phf/rust-phf) | 0.13.1 | MIT |
| [pin-project-lite](https://github.com/taiki-e/pin-project-lite) | 0.2.17 | Apache-2.0 OR MIT |
| [plist](https://github.com/ebarnard/rust-plist/) | 1.8.0 | MIT |
| [png](https://github.com/image-rs/image-png) | 0.17.16 | MIT OR Apache-2.0 |
| [potential_utf](https://github.com/unicode-org/icu4x) | 0.1.5 | Unicode-3.0 |
| [powerfmt](https://github.com/jhpratt/powerfmt) | 0.2.0 | MIT OR Apache-2.0 |
| [ppv-lite86](https://github.com/cryptocorrosion/cryptocorrosion) | 0.2.21 | MIT OR Apache-2.0 |
| [precomputed-hash](https://github.com/emilio/precomputed-hash) | 0.1.1 | MIT |
| [proc-macro-hack](https://github.com/dtolnay/proc-macro-hack) | 0.5.20+deprecated | MIT OR Apache-2.0 |
| [proc-macro2](https://github.com/dtolnay/proc-macro2) | 1.0.106 | MIT OR Apache-2.0 |
| [quick-xml](https://github.com/tafia/quick-xml) | 0.38.4 | MIT |
| [quote](https://github.com/dtolnay/quote) | 1.0.45 | MIT OR Apache-2.0 |
| [rand](https://github.com/rust-random/rand) | 0.7.3 | MIT OR Apache-2.0 |
| [rand](https://github.com/rust-random/rand) | 0.8.6 | MIT OR Apache-2.0 |
| [rand_chacha](https://github.com/rust-random/rand) | 0.2.2 | MIT OR Apache-2.0 |
| [rand_chacha](https://github.com/rust-random/rand) | 0.3.1 | MIT OR Apache-2.0 |
| [rand_core](https://github.com/rust-random/rand) | 0.5.1 | MIT OR Apache-2.0 |
| [rand_core](https://github.com/rust-random/rand) | 0.6.4 | MIT OR Apache-2.0 |
| [rand_pcg](https://github.com/rust-random/rand) | 0.2.1 | MIT OR Apache-2.0 |
| [raw-window-handle](https://github.com/rust-windowing/raw-window-handle) | 0.6.2 | MIT OR Apache-2.0 OR Zlib |
| [ref-cast](https://github.com/dtolnay/ref-cast) | 1.0.25 | MIT OR Apache-2.0 |
| [ref-cast-impl](https://github.com/dtolnay/ref-cast) | 1.0.25 | MIT OR Apache-2.0 |
| [regex](https://github.com/rust-lang/regex) | 1.12.3 | MIT OR Apache-2.0 |
| [regex-automata](https://github.com/rust-lang/regex) | 0.4.14 | MIT OR Apache-2.0 |
| [regex-syntax](https://github.com/rust-lang/regex) | 0.8.10 | MIT OR Apache-2.0 |
| [rfd](https://github.com/PolyMeilex/rfd) | 0.16.0 | MIT |
| [rustc_version](https://github.com/djc/rustc-version-rs) | 0.4.1 | MIT OR Apache-2.0 |
| [rustc-hash](https://github.com/rust-lang/rustc-hash) | 2.1.2 | Apache-2.0 OR MIT |
| [same-file](https://github.com/BurntSushi/same-file) | 1.0.6 | Unlicense/MIT |
| [schemars](https://github.com/GREsau/schemars) | 0.8.22 | MIT |
| [schemars](https://github.com/GREsau/schemars) | 0.9.0 | MIT |
| [schemars](https://github.com/GREsau/schemars) | 1.2.1 | MIT |
| [schemars_derive](https://github.com/GREsau/schemars) | 0.8.22 | MIT |
| [scopeguard](https://github.com/bluss/scopeguard) | 1.2.0 | MIT OR Apache-2.0 |
| [selectors](https://github.com/servo/servo) | 0.24.0 | MPL-2.0 |
| [selectors](https://github.com/servo/stylo) | 0.36.1 | MPL-2.0 |
| [semver](https://github.com/dtolnay/semver) | 1.0.28 | MIT OR Apache-2.0 |
| [serde](https://github.com/serde-rs/serde) | 1.0.228 | MIT OR Apache-2.0 |
| [serde_core](https://github.com/serde-rs/serde) | 1.0.228 | MIT OR Apache-2.0 |
| [serde_derive](https://github.com/serde-rs/serde) | 1.0.228 | MIT OR Apache-2.0 |
| [serde_derive_internals](https://github.com/serde-rs/serde) | 0.29.1 | MIT OR Apache-2.0 |
| [serde_json](https://github.com/serde-rs/json) | 1.0.149 | MIT OR Apache-2.0 |
| [serde_repr](https://github.com/dtolnay/serde-repr) | 0.1.20 | MIT OR Apache-2.0 |
| [serde_spanned](https://github.com/toml-rs/toml) | 1.1.1 | MIT OR Apache-2.0 |
| [serde_with](https://github.com/jonasbb/serde_with/) | 3.18.0 | MIT OR Apache-2.0 |
| [serde_with_macros](https://github.com/jonasbb/serde_with/) | 3.18.0 | MIT OR Apache-2.0 |
| [serde-untagged](https://github.com/dtolnay/serde-untagged) | 0.1.9 | MIT OR Apache-2.0 |
| [serialize-to-javascript](https://github.com/chippers/serialize-to-javascript) | 0.1.2 | MIT OR Apache-2.0 |
| [serialize-to-javascript-impl](https://github.com/chippers/serialize-to-javascript) | 0.1.2 | MIT OR Apache-2.0 |
| [servo_arc](https://github.com/servo/servo) | 0.2.0 | MIT OR Apache-2.0 |
| [servo_arc](https://github.com/servo/stylo) | 0.4.3 | MIT OR Apache-2.0 |
| [sha2](https://github.com/RustCrypto/hashes) | 0.10.9 | MIT OR Apache-2.0 |
| [shlex](https://github.com/comex/rust-shlex) | 1.3.0 | MIT OR Apache-2.0 |
| [simd-adler32](https://github.com/mcountryman/simd-adler32) | 0.3.9 | MIT |
| [siphasher](https://github.com/jedisct1/rust-siphash) | 0.3.11 | MIT/Apache-2.0 |
| [siphasher](https://github.com/jedisct1/rust-siphash) | 1.0.2 | MIT/Apache-2.0 |
| [slab](https://github.com/tokio-rs/slab) | 0.4.12 | MIT |
| [smallvec](https://github.com/servo/rust-smallvec) | 1.15.1 | MIT OR Apache-2.0 |
| [socket2](https://github.com/rust-lang/socket2) | 0.6.3 | MIT OR Apache-2.0 |
| [softbuffer](https://github.com/rust-windowing/softbuffer) | 0.4.8 | MIT OR Apache-2.0 |
| [stable_deref_trait](https://github.com/storyyeller/stable_deref_trait) | 1.2.1 | MIT OR Apache-2.0 |
| [static_assertions](https://github.com/nvzqz/static-assertions-rs) | 1.1.0 | MIT OR Apache-2.0 |
| [string_cache](https://github.com/servo/string-cache) | 0.8.9 | MIT OR Apache-2.0 |
| [string_cache](https://github.com/servo/string-cache) | 0.9.0 | MIT OR Apache-2.0 |
| [string_cache_codegen](https://github.com/servo/string-cache) | 0.5.4 | MIT OR Apache-2.0 |
| [string_cache_codegen](https://github.com/servo/string-cache) | 0.6.1 | MIT OR Apache-2.0 |
| [strsim](https://github.com/rapidfuzz/strsim-rs) | 0.11.1 | MIT |
| [syn](https://github.com/dtolnay/syn) | 1.0.109 | MIT OR Apache-2.0 |
| [syn](https://github.com/dtolnay/syn) | 2.0.117 | MIT OR Apache-2.0 |
| [synstructure](https://github.com/mystor/synstructure) | 0.13.2 | MIT |
| [tao](https://github.com/tauri-apps/tao) | 0.35.3 | Apache-2.0 |
| [tauri](https://github.com/tauri-apps/tauri) | 2.11.1 | Apache-2.0 OR MIT |
| [tauri-build](https://github.com/tauri-apps/tauri) | 2.6.3 | Apache-2.0 OR MIT |
| [tauri-codegen](https://github.com/tauri-apps/tauri) | 2.6.3 | Apache-2.0 OR MIT |
| [tauri-macros](https://github.com/tauri-apps/tauri) | 2.6.3 | Apache-2.0 OR MIT |
| [tauri-plugin](https://github.com/tauri-apps/tauri) | 2.5.4 | Apache-2.0 OR MIT |
| [tauri-plugin-dialog](https://github.com/tauri-apps/plugins-workspace) | 2.7.1 | Apache-2.0 OR MIT |
| [tauri-plugin-fs](https://github.com/tauri-apps/plugins-workspace) | 2.5.1 | Apache-2.0 OR MIT |
| [tauri-plugin-opener](https://github.com/tauri-apps/plugins-workspace) | 2.5.3 | Apache-2.0 OR MIT |
| [tauri-runtime](https://github.com/tauri-apps/tauri) | 2.11.3 | Apache-2.0 OR MIT |
| [tauri-runtime-wry](https://github.com/tauri-apps/tauri) | 2.11.4 | Apache-2.0 OR MIT |
| [tauri-utils](https://github.com/tauri-apps/tauri) | 2.9.3 | Apache-2.0 OR MIT |
| [tauri-winres](https://github.com/tauri-apps/winres) | 0.3.5 | MIT |
| [tendril](https://github.com/servo/tendril) | 0.4.3 | MIT/Apache-2.0 |
| [tendril](https://github.com/servo/html5ever) | 0.5.0 | MIT OR Apache-2.0 |
| [thiserror](https://github.com/dtolnay/thiserror) | 1.0.69 | MIT OR Apache-2.0 |
| [thiserror](https://github.com/dtolnay/thiserror) | 2.0.18 | MIT OR Apache-2.0 |
| [thiserror-impl](https://github.com/dtolnay/thiserror) | 1.0.69 | MIT OR Apache-2.0 |
| [thiserror-impl](https://github.com/dtolnay/thiserror) | 2.0.18 | MIT OR Apache-2.0 |
| [time](https://github.com/time-rs/time) | 0.3.47 | MIT OR Apache-2.0 |
| [time-core](https://github.com/time-rs/time) | 0.1.8 | MIT OR Apache-2.0 |
| [time-macros](https://github.com/time-rs/time) | 0.2.27 | MIT OR Apache-2.0 |
| [tinystr](https://github.com/unicode-org/icu4x) | 0.8.3 | Unicode-3.0 |
| [tokio](https://github.com/tokio-rs/tokio) | 1.52.1 | MIT |
| [tokio-macros](https://github.com/tokio-rs/tokio) | 2.7.0 | MIT |
| [tokio-stream](https://github.com/tokio-rs/tokio) | 0.1.18 | MIT |
| [tokio-util](https://github.com/tokio-rs/tokio) | 0.7.18 | MIT |
| [toml](https://github.com/toml-rs/toml) | 0.9.12+spec-1.1.0 | MIT OR Apache-2.0 |
| [toml](https://github.com/toml-rs/toml) | 1.1.2+spec-1.1.0 | MIT OR Apache-2.0 |
| [toml_datetime](https://github.com/toml-rs/toml) | 0.7.5+spec-1.1.0 | MIT OR Apache-2.0 |
| [toml_datetime](https://github.com/toml-rs/toml) | 1.1.1+spec-1.1.0 | MIT OR Apache-2.0 |
| [toml_parser](https://github.com/toml-rs/toml) | 1.1.2+spec-1.1.0 | MIT OR Apache-2.0 |
| [toml_writer](https://github.com/toml-rs/toml) | 1.1.1+spec-1.1.0 | MIT OR Apache-2.0 |
| [tracing](https://github.com/tokio-rs/tracing) | 0.1.44 | MIT |
| [tracing-attributes](https://github.com/tokio-rs/tracing) | 0.1.31 | MIT |
| [tracing-core](https://github.com/tokio-rs/tracing) | 0.1.36 | MIT |
| [tray-icon](https://github.com/tauri-apps/tray-icon) | 0.23.1 | MIT OR Apache-2.0 |
| [typeid](https://github.com/dtolnay/typeid) | 1.0.3 | MIT OR Apache-2.0 |
| [typenum](https://github.com/paholg/typenum) | 1.20.0 | MIT OR Apache-2.0 |
| [unic-char-property](https://github.com/open-i18n/rust-unic/) | 0.9.0 | MIT/Apache-2.0 |
| [unic-char-range](https://github.com/open-i18n/rust-unic/) | 0.9.0 | MIT/Apache-2.0 |
| [unic-common](https://github.com/open-i18n/rust-unic/) | 0.9.0 | MIT/Apache-2.0 |
| [unic-ucd-ident](https://github.com/open-i18n/rust-unic/) | 0.9.0 | MIT/Apache-2.0 |
| [unic-ucd-version](https://github.com/open-i18n/rust-unic/) | 0.9.0 | MIT/Apache-2.0 |
| [unicode-ident](https://github.com/dtolnay/unicode-ident) | 1.0.24 | (MIT OR Apache-2.0) AND Unicode-3.0 |
| [unicode-segmentation](https://github.com/unicode-rs/unicode-segmentation) | 1.13.2 | MIT OR Apache-2.0 |
| [url](https://github.com/servo/rust-url) | 2.5.8 | MIT OR Apache-2.0 |
| [urlpattern](https://github.com/denoland/rust-urlpattern) | 0.3.0 | MIT |
| [utf-8](https://github.com/SimonSapin/rust-utf8) | 0.7.6 | MIT OR Apache-2.0 |
| [utf8_iter](https://github.com/hsivonen/utf8_iter) | 1.0.4 | Apache-2.0 OR MIT |
| [uuid](https://github.com/uuid-rs/uuid) | 1.23.1 | Apache-2.0 OR MIT |
| [version_check](https://github.com/SergioBenitez/version_check) | 0.9.5 | MIT/Apache-2.0 |
| [vswhom](https://github.com/nabijaczleweli/vswhom.rs) | 0.1.0 | MIT |
| [vswhom-sys](https://github.com/nabijaczleweli/vswhom-sys.rs) | 0.1.3 | MIT |
| [walkdir](https://github.com/BurntSushi/walkdir) | 2.5.0 | Unlicense/MIT |
| [web_atoms](https://github.com/servo/html5ever) | 0.2.4 | MIT OR Apache-2.0 |
| [webview2-com](https://github.com/wravery/webview2-rs) | 0.38.2 | MIT |
| [webview2-com-macros](https://github.com/wravery/webview2-rs) | 0.8.1 | MIT |
| [webview2-com-sys](https://github.com/wravery/webview2-rs) | 0.38.2 | MIT |
| [winapi-util](https://github.com/BurntSushi/winapi-util) | 0.1.11 | Unlicense OR MIT |
| [window-vibrancy](https://github.com/tauri-apps/tauri-plugin-vibrancy) | 0.6.0 | Apache-2.0 OR MIT |
| [windows](https://github.com/microsoft/windows-rs) | 0.58.0 | MIT OR Apache-2.0 |
| [windows](https://github.com/microsoft/windows-rs) | 0.61.3 | MIT OR Apache-2.0 |
| [windows](https://github.com/microsoft/windows-rs) | 0.62.2 | MIT OR Apache-2.0 |
| [windows_x86_64_msvc](https://github.com/microsoft/windows-rs) | 0.52.6 | MIT OR Apache-2.0 |
| [windows_x86_64_msvc](https://github.com/microsoft/windows-rs) | 0.53.1 | MIT OR Apache-2.0 |
| [windows-collections](https://github.com/microsoft/windows-rs) | 0.2.0 | MIT OR Apache-2.0 |
| [windows-collections](https://github.com/microsoft/windows-rs) | 0.3.2 | MIT OR Apache-2.0 |
| [windows-core](https://github.com/microsoft/windows-rs) | 0.58.0 | MIT OR Apache-2.0 |
| [windows-core](https://github.com/microsoft/windows-rs) | 0.61.2 | MIT OR Apache-2.0 |
| [windows-core](https://github.com/microsoft/windows-rs) | 0.62.2 | MIT OR Apache-2.0 |
| [windows-future](https://github.com/microsoft/windows-rs) | 0.2.1 | MIT OR Apache-2.0 |
| [windows-future](https://github.com/microsoft/windows-rs) | 0.3.2 | MIT OR Apache-2.0 |
| [windows-implement](https://github.com/microsoft/windows-rs) | 0.58.0 | MIT OR Apache-2.0 |
| [windows-implement](https://github.com/microsoft/windows-rs) | 0.60.2 | MIT OR Apache-2.0 |
| [windows-interface](https://github.com/microsoft/windows-rs) | 0.58.0 | MIT OR Apache-2.0 |
| [windows-interface](https://github.com/microsoft/windows-rs) | 0.59.3 | MIT OR Apache-2.0 |
| [windows-link](https://github.com/microsoft/windows-rs) | 0.1.3 | MIT OR Apache-2.0 |
| [windows-link](https://github.com/microsoft/windows-rs) | 0.2.1 | MIT OR Apache-2.0 |
| [windows-numerics](https://github.com/microsoft/windows-rs) | 0.2.0 | MIT OR Apache-2.0 |
| [windows-numerics](https://github.com/microsoft/windows-rs) | 0.3.1 | MIT OR Apache-2.0 |
| [windows-result](https://github.com/microsoft/windows-rs) | 0.2.0 | MIT OR Apache-2.0 |
| [windows-result](https://github.com/microsoft/windows-rs) | 0.3.4 | MIT OR Apache-2.0 |
| [windows-result](https://github.com/microsoft/windows-rs) | 0.4.1 | MIT OR Apache-2.0 |
| [windows-strings](https://github.com/microsoft/windows-rs) | 0.1.0 | MIT OR Apache-2.0 |
| [windows-strings](https://github.com/microsoft/windows-rs) | 0.4.2 | MIT OR Apache-2.0 |
| [windows-strings](https://github.com/microsoft/windows-rs) | 0.5.1 | MIT OR Apache-2.0 |
| [windows-sys](https://github.com/microsoft/windows-rs) | 0.59.0 | MIT OR Apache-2.0 |
| [windows-sys](https://github.com/microsoft/windows-rs) | 0.60.2 | MIT OR Apache-2.0 |
| [windows-sys](https://github.com/microsoft/windows-rs) | 0.61.2 | MIT OR Apache-2.0 |
| [windows-targets](https://github.com/microsoft/windows-rs) | 0.52.6 | MIT OR Apache-2.0 |
| [windows-targets](https://github.com/microsoft/windows-rs) | 0.53.5 | MIT OR Apache-2.0 |
| [windows-threading](https://github.com/microsoft/windows-rs) | 0.1.0 | MIT OR Apache-2.0 |
| [windows-threading](https://github.com/microsoft/windows-rs) | 0.2.1 | MIT OR Apache-2.0 |
| [windows-version](https://github.com/microsoft/windows-rs) | 0.1.7 | MIT OR Apache-2.0 |
| [winnow](https://github.com/winnow-rs/winnow) | 0.7.15 | MIT |
| [winnow](https://github.com/winnow-rs/winnow) | 1.0.2 | MIT |
| [winreg](https://github.com/gentoo90/winreg-rs) | 0.55.0 | MIT |
| [writeable](https://github.com/unicode-org/icu4x) | 0.6.3 | Unicode-3.0 |
| [wry](https://github.com/tauri-apps/wry) | 0.55.1 | Apache-2.0 OR MIT |
| [yoke](https://github.com/unicode-org/icu4x) | 0.8.2 | Unicode-3.0 |
| [yoke-derive](https://github.com/unicode-org/icu4x) | 0.8.2 | Unicode-3.0 |
| [zerocopy](https://github.com/google/zerocopy) | 0.8.48 | BSD-2-Clause OR Apache-2.0 OR MIT |
| [zerofrom](https://github.com/unicode-org/icu4x) | 0.1.7 | Unicode-3.0 |
| [zerofrom-derive](https://github.com/unicode-org/icu4x) | 0.1.7 | Unicode-3.0 |
| [zerotrie](https://github.com/unicode-org/icu4x) | 0.2.4 | Unicode-3.0 |
| [zerovec](https://github.com/unicode-org/icu4x) | 0.11.6 | Unicode-3.0 |
| [zerovec-derive](https://github.com/unicode-org/icu4x) | 0.11.3 | Unicode-3.0 |
| [zmij](https://github.com/dtolnay/zmij) | 1.0.21 | MIT |

## npm packages — production (20)

License summary: MIT (16), MIT OR Apache-2.0 (2), Apache-2.0 OR MIT (1), Apache-2.0 (1)

| Package | Version | License |
|---|---|---|
| [@babel/runtime](https://github.com/babel/babel) | 7.29.7 | MIT |
| [@tabler/icons](https://github.com/tabler/tabler-icons) | 3.44.0 | MIT |
| [@tabler/icons-react](https://github.com/tabler/tabler-icons) | 3.44.0 | MIT |
| [@tauri-apps/api](https://github.com/tauri-apps/tauri) | 2.11.1 | Apache-2.0 OR MIT |
| [@tauri-apps/plugin-dialog](https://github.com/tauri-apps/plugins-workspace) | 2.7.1 | MIT OR Apache-2.0 |
| [@tauri-apps/plugin-opener](https://github.com/tauri-apps/plugins-workspace) | 2.5.3 | MIT OR Apache-2.0 |
| [@types/react](https://github.com/DefinitelyTyped/DefinitelyTyped) | 19.2.14 | MIT |
| [clsx](lukeed/clsx) | 2.1.1 | MIT |
| [csstype](https://github.com/frenic/csstype) | 3.2.3 | MIT |
| [html-parse-stringify](https://github.com/henrikjoreteg/html-parse-stringify) | 3.0.1 | MIT |
| [i18next](https://github.com/i18next/i18next) | 26.3.4 | MIT |
| [react](https://github.com/facebook/react) | 19.2.5 | MIT |
| [react-dom](https://github.com/facebook/react) | 19.2.5 | MIT |
| [react-i18next](https://github.com/i18next/react-i18next) | 17.0.8 | MIT |
| [scheduler](https://github.com/facebook/react) | 0.27.0 | MIT |
| [tailwind-merge](https://github.com/dcastil/tailwind-merge) | 3.6.0 | MIT |
| [typescript](https://github.com/microsoft/TypeScript) | 5.8.3 | Apache-2.0 |
| [use-sync-external-store](https://github.com/facebook/react) | 1.6.0 | MIT |
| [void-elements](pugjs/void-elements) | 3.1.0 | MIT |
| [zustand](https://github.com/pmndrs/zustand) | 5.0.14 | MIT |

## Protocol references (facts, not bundled code)

The Joy-Con 2 wire-format handling is an independent reimplementation from
documented byte offsets and command sequences. No third-party code is copied.
The following projects were used as protocol references (facts / interface
data), and are credited here:

- **Joycon2forMac** — battery current/temperature telemetry offsets and formulas.
- **yujimny/Joycon2test** — IMU-enable command byte sequences.
- **ndeadly** — primary Joy-Con 2 protocol reverse-engineering reference.
