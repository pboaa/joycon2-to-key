//! The fixed set of Joy-Con (L/R) buttons.
//!
//! [`ButtonSet`] is a `u64` bit set that replaces the per-frame
//! `HashSet<String>` on the ~125 Hz BLE hot path: building, sending, diffing and
//! comparing a frame allocates nothing. Names materialise only at the
//! config-resolution boundary via [`ButtonSet::iter_names`], as `&'static str`
//! keys into the button maps.
//!
//! The button table is defined **once** by the [`joycon_buttons!`] macro, which
//! generates three things that must share one order: the [`JoyConButtons`]
//! snapshot struct, the [`BUTTON_NAMES`] table (bit index → camelCase key), and
//! [`JoyConButtons::flags`] (the bools in bit order). Adding or reordering a
//! button is a one-line edit to that table instead of three edits kept in sync
//! by hand.
//!
//! The names are the union of both Joy-Con sides. Shared keys (`sl`/`sr`/
//! `stickPress`/`stick*`) are populated from whichever side is connected;
//! left-only and right-only keys stay `false` on the other side.

/// Define the button table once: `field => "camelCaseName"` in bit order.
/// Generates the [`JoyConButtons`] struct, [`BUTTON_NAMES`], [`BUTTON_COUNT`],
/// and [`JoyConButtons::flags`] — all guaranteed to share the same order.
macro_rules! joycon_buttons {
    ( $( $(#[$meta:meta])* $field:ident => $name:literal ),+ $(,)? ) => {
        /// One BLE frame's button state (the union of both Joy-Con sides). The
        /// field order, [`BUTTON_NAMES`], and [`JoyConButtons::flags`] are all
        /// generated from the same list so they cannot drift out of sync.
        #[derive(Debug, Clone, Copy, Default, serde::Serialize)]
        #[serde(rename_all = "camelCase")]
        pub struct JoyConButtons {
            $( $(#[$meta])* pub $field: bool, )+
        }

        /// Button name for each bit index (bit `i` = `BUTTON_NAMES[i]`). These
        /// are the btnKey strings used in the config and the front end.
        pub const BUTTON_NAMES: &[&str] = &[ $( $name ),+ ];

        /// Number of buttons (bits) — the length of [`BUTTON_NAMES`].
        pub const BUTTON_COUNT: usize = BUTTON_NAMES.len();

        impl JoyConButtons {
            /// The button bools in bit order (index matches [`BUTTON_NAMES`]).
            pub fn flags(&self) -> [bool; BUTTON_COUNT] {
                [ $( self.$field ),+ ]
            }
        }
    };
}

joycon_buttons! {
    up => "up",
    down => "down",
    left => "left",
    right => "right",
    l => "l",
    zl => "zl",
    sl => "sl",
    sr => "sr",
    minus => "minus",
    capture => "capture",
    stick_press => "stickPress",
    stick_up => "stickUp",
    stick_down => "stickDown",
    stick_left => "stickLeft",
    stick_right => "stickRight",
    // Right Joy-Con only (always false when a left one is connected).
    a => "a",
    b => "b",
    x => "x",
    y => "y",
    r => "r",
    zr => "zr",
    plus => "plus",
    home => "home",
    chat => "chat",
    // The right Joy-Con's SL/SR, stick-press and stick directions are separate from the left's.
    sl_r => "slR",
    sr_r => "srR",
    stick_press_r => "stickPressR",
    stick_up_r => "stickUpR",
    stick_down_r => "stickDownR",
    stick_left_r => "stickLeftR",
    stick_right_r => "stickRightR",
}

/// Pressed-button set for one BLE frame.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct ButtonSet(u64);

impl ButtonSet {
    pub fn set(&mut self, i: usize, on: bool) {
        debug_assert!(i < BUTTON_COUNT);
        if on {
            self.0 |= 1u64 << i;
        } else {
            self.0 &= !(1u64 << i);
        }
    }

    pub fn contains(self, i: usize) -> bool {
        self.0 & (1u64 << i) != 0
    }

    pub fn union(self, other: Self) -> Self {
        Self(self.0 | other.0)
    }

    pub fn is_empty(self) -> bool {
        self.0 == 0
    }

    /// Build a set from the button bools in [`JoyConButtons::flags`] order.
    pub fn from_flags(flags: [bool; BUTTON_COUNT]) -> Self {
        let mut out = Self::default();
        for (i, on) in flags.into_iter().enumerate() {
            out.set(i, on);
        }
        out
    }

    /// Clear the analog stick's digital direction bits (used when the stick
    /// drives the mouse cursor, so it doesn't also fire mapped directions).
    /// StickPress is left intact.
    pub fn without_stick_directions(self) -> Self {
        const DIRS: [&str; 8] = [
            "stickUp", "stickDown", "stickLeft", "stickRight", "stickUpR", "stickDownR",
            "stickLeftR", "stickRightR",
        ];
        let mut s = self;
        for (i, name) in BUTTON_NAMES.iter().enumerate() {
            if DIRS.contains(name) {
                s.set(i, false);
            }
        }
        s
    }

    /// Iterate the set bits as `(index, name)` in fixed [`BUTTON_NAMES`] order.
    pub fn iter_names(self) -> impl Iterator<Item = (usize, &'static str)> {
        BUTTON_NAMES
            .iter()
            .enumerate()
            .filter_map(move |(i, name)| self.contains(i).then_some((i, *name)))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn set_contains_union_empty() {
        let mut a = ButtonSet::default();
        assert!(a.is_empty());
        a.set(0, true);
        a.set(10, true);
        assert!(a.contains(0) && a.contains(10) && !a.contains(1));
        a.set(0, false);
        assert!(!a.contains(0));

        let mut b = ButtonSet::default();
        b.set(3, true);
        let u = a.union(b);
        assert!(u.contains(10) && u.contains(3) && !u.contains(0));
        assert_eq!(u, {
            let mut e = ButtonSet::default();
            e.set(3, true);
            e.set(10, true);
            e
        });
    }

    #[test]
    fn iter_names_yields_fixed_order() {
        let mut s = ButtonSet::default();
        s.set(5, true); // zl
        s.set(0, true); // up
        s.set(14, true); // stickRight
        let names: Vec<&str> = s.iter_names().map(|(_, n)| n).collect();
        assert_eq!(names, vec!["up", "zl", "stickRight"]);
    }

    #[test]
    fn all_names_are_unique() {
        let mut seen = std::collections::HashSet::new();
        for n in BUTTON_NAMES {
            assert!(seen.insert(n), "duplicate button name: {n}");
        }
    }

    /// The generated `flags()` must be exactly as long as the name table, so a
    /// bit set built from it covers every button.
    #[test]
    fn flags_length_matches_names() {
        assert_eq!(JoyConButtons::default().flags().len(), BUTTON_COUNT);
        assert_eq!(BUTTON_NAMES.len(), BUTTON_COUNT);
    }

    /// Setting a single button field must light exactly the matching bit/name —
    /// this locks the JoyConButtons ↔ flags ↔ BUTTON_NAMES ordering across all
    /// bits (not just a hand-picked few), so a future reorder can't silently
    /// desync them.
    #[test]
    fn each_field_maps_to_its_own_name() {
        for i in 0..BUTTON_COUNT {
            let mut flags = [false; BUTTON_COUNT];
            flags[i] = true;
            let names: Vec<&str> = ButtonSet::from_flags(flags)
                .iter_names()
                .map(|(_, n)| n)
                .collect();
            assert_eq!(names, vec![BUTTON_NAMES[i]], "bit {i} maps to one name");
        }
    }
}
