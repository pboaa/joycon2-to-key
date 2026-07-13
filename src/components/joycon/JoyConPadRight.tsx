import { memo } from "react";
import { BUTTON_KEYS_RIGHT } from "../../lib/keyCatalog";
import {
  AccentContext,
  useAccent,
  ARROW,
  ARROW_ON,
  Label,
  PadShell,
  DeadzoneRing,
  RailBtn,
  SEL,
  SEL_HALO,
  Shoulder,
  SquareBtn,
  StickMouseBadge,
  STICK_TRAVEL,
  Tri,
  useMap,
  usePadStates,
  type PadProps,
  type St,
} from "./padParts";

/* Joy-Con (R): a horizontal mirror of the (L) pad, with a red accent. The
   A/B/X/Y diamond sits where the L stick is (top) and the analog stick where the
   L d-pad is (bottom) — the exact opposite of the (L) layout. Home and the C
   (chat) button are stacked on the lower-left. */

const COL = 142; // main vertical column centre (mirror of the L pad's ~128)

export const JoyConPadRight = memo(function JoyConPadRight(props: PadProps) {
  const { stick, onSelect, onDeselect, onContext, stickMouse, stickDeadzone, accent } =
    props;
  const { map } = useMap();
  const states = usePadStates(BUTTON_KEYS_RIGHT, props);
  const stOf = (key: string) => states[key];
  const hit = (key: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(key);
  };

  const knobDx = Math.max(-1, Math.min(1, stick.x)) * STICK_TRAVEL;
  const knobDy = Math.max(-1, Math.min(1, -stick.y)) * STICK_TRAVEL;
  const sStick = stOf("stickPressR");

  return (
    <PadShell ariaLabel="Joy-Con (R)" viewBox="0 -8 270 624" onDeselect={onDeselect} onContext={onContext}>
      <AccentContext.Provider value={accent}>
        {/* Body + red rail (mirrored so the rail sits on the left) */}
        <g transform="translate(270,0) scale(-1,1)">
          <path d="M104,32 H188 A24,24 0 0 1 212,56 V584 A26,26 0 0 1 186,610 H98 A54,54 0 0 1 44,556 V90 A58,58 0 0 1 104,32 Z" fill="#343841" />
          <rect x="212" y="74" width="16" height="492" rx="4" fill={accent} />
        </g>

        {/* Shoulders (mirror of ZL/L) */}
        <Shoulder d="M258,94 A88,88 0 0 0 171,2 H120" w={16} base="#2b2f36" st={stOf("zr")} onClick={hit("zr")} label="zr" name="ZR" textAt={[146, 2]} nameSize={10} />
        <Shoulder d="M235,90 A67,67 0 0 0 166,23 H120" w={12} base="#4a4e56" st={stOf("r")} onClick={hit("r")} label="r" name="R" textAt={[143, 23]} nameSize={9} />

        {/* Plus */}
        {(() => {
          const s = stOf("plus");
          return (
            <g onClick={hit("plus")} data-btn="plus" style={{ cursor: "pointer" }} role="button" aria-label="plus" data-pad-tip={s.tip}>
              <rect x="78" y="72" width="42" height="30" fill="none" pointerEvents="all" />
              {s.pressed && <circle cx="99" cy="87" r="13" fill={accent} filter="url(#jcGlow)" opacity="0.9" />}
              <rect x="87" y="84" width="24" height="6" rx="3" fill={s.heat ?? (s.mapped ? map : "#c9ced6")} />
              <rect x="96" y="75" width="6" height="24" rx="3" fill={s.heat ?? (s.mapped ? map : "#c9ced6")} />
              {s.selected && (
                <>
                  <circle cx="99" cy="87" r="16" fill="none" stroke={SEL_HALO} strokeWidth="4.5" />
                  <circle cx="99" cy="87" r="16" fill="none" stroke={SEL} strokeWidth="2" />
                </>
              )}
            </g>
          );
        })()}

        {/* Face buttons: A/B/X/Y diamond (X top, A right, B bottom, Y left).
            Same ±40 spacing/geometry as the L d-pad, placed where the L stick
            sits — the exact opposite of the L d-pad. */}
        <FaceBtn cx={COL} cy={152} letter="X" st={stOf("x")} onClick={hit("x")} btnKey="x" />
        <FaceBtn cx={COL + 40} cy={192} letter="A" st={stOf("a")} onClick={hit("a")} btnKey="a" />
        <FaceBtn cx={COL} cy={232} letter="B" st={stOf("b")} onClick={hit("b")} btnKey="b" />
        <FaceBtn cx={COL - 40} cy={192} letter="Y" st={stOf("y")} onClick={hit("y")} btnKey="y" />

        {/* Analog stick — where the L d-pad sits (bottom) */}
        <g onClick={hit("stickPressR")} data-btn="stickPressR" style={{ cursor: "pointer" }} role="button" aria-label="stickPress" data-pad-tip={sStick.tip}>
          {sStick.pressed && <circle cx={COL} cy="372" r="43" fill={accent} filter="url(#jcGlow)" opacity="0.9" />}
          <circle cx={COL} cy="372" r="46" fill="#23262b" />
          <circle cx={COL} cy="372" r="39" fill="none" stroke={accent} strokeWidth="6" />
          <circle cx={COL} cy="372" r="31" fill={sStick.heat ?? (sStick.mapped ? map : "#2b2f36")} />
          <DeadzoneRing cx={COL} cy={372} r={STICK_TRAVEL} pct={stickDeadzone} />
          <circle cx={COL + knobDx} cy={372 + knobDy} r="6" fill={sStick.mapped ? ARROW_ON : "#3a3d43"} />
          {sStick.selected && (
            <>
              <circle cx={COL} cy="372" r="46" fill="none" stroke={SEL_HALO} strokeWidth="5.5" />
              <circle cx={COL} cy="372" r="46" fill="none" stroke={SEL} strokeWidth="3" />
            </>
          )}
        </g>

        {/* Stick directions — hidden while the stick drives the mouse. */}
        {!stickMouse && (
          <>
            <Tri d={`M${COL},310 L${COL - 9},325 L${COL + 9},325 Z`} hit={[COL, 319, 15]} st={stOf("stickUpR")} onClick={hit("stickUpR")} btnKey="stickUpR" />
            <Tri d={`M${COL},434 L${COL - 9},419 L${COL + 9},419 Z`} hit={[COL, 425, 15]} st={stOf("stickDownR")} onClick={hit("stickDownR")} btnKey="stickDownR" />
            <Tri d={`M${COL - 62},372 L${COL - 47},363 L${COL - 47},381 Z`} hit={[COL - 54, 372, 14]} st={stOf("stickLeftR")} onClick={hit("stickLeftR")} btnKey="stickLeftR" />
            <Tri d={`M${COL + 62},372 L${COL + 47},363 L${COL + 47},381 Z`} hit={[COL + 54, 372, 14]} st={stOf("stickRightR")} onClick={hit("stickRightR")} btnKey="stickRightR" />
          </>
        )}
        {stickMouse && <StickMouseBadge cx={COL} cy={319} />}

        {/* Home (lower-left) */}
        {(() => {
          const s = stOf("home");
          return (
            <g onClick={hit("home")} data-btn="home" style={{ cursor: "pointer" }} role="button" aria-label="home" data-pad-tip={s.tip}>
              {s.pressed && <circle cx="96" cy="491" r="24" fill={accent} filter="url(#jcGlow)" opacity="0.9" />}
              <circle cx="96" cy="491" r="20" fill={s.heat ?? (s.mapped ? map : "#2a2d33")} />
              <path d="M88,494 L96,485 L104,494 M90,492 V500 H102 V492" fill="none" stroke={s.mapped ? ARROW_ON : ARROW} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
              {s.selected && (
                <>
                  <circle cx="96" cy="491" r="24" fill="none" stroke={SEL_HALO} strokeWidth="5.5" />
                  <circle cx="96" cy="491" r="24" fill="none" stroke={SEL} strokeWidth="3" />
                </>
              )}
            </g>
          );
        })()}

        {/* C (chat) button — below Home */}
        <SquareBtn x={76} y={524} iconRx={4} st={stOf("chat")} onClick={hit("chat")} label="chat" />


        {/* Rail buttons on the left edge */}
        <RailBtn x={24} y={147} text="SL" st={stOf("slR")} onClick={hit("slR")} btnKey="slR" />
        <RailBtn x={24} y={357} text="SR" st={stOf("srR")} onClick={hit("srR")} btnKey="srR" />

        {/* Mapping labels — drawn last so they sit on top of every button. */}
        <Label st={stOf("zr")} x={114} y={3} anchor="end" />
        <Label st={stOf("r")} x={114} y={24} anchor="end" />
        <Label st={stOf("plus")} x={99} y={62} />
        <Label st={stOf("x")} x={COL} y={122} />
        <Label st={stOf("a")} x={COL + 40} y={223} />
        <Label st={stOf("b")} x={COL} y={263} />
        <Label st={stOf("y")} x={COL - 40} y={223} />
        {!stickMouse && (
          <>
            <Label st={stOf("stickUpR")} x={COL} y={298} />
            <Label st={stOf("stickDownR")} x={COL} y={448} />
            <Label st={stOf("stickLeftR")} x={COL - 54} y={396} />
            <Label st={stOf("stickRightR")} x={COL + 54} y={396} />
          </>
        )}
        <Label st={stOf("home")} x={96} y={463} />
        <Label st={stOf("chat")} x={96} y={580} />
        <Label st={stOf("slR")} x={33} y={138} fill={map} />
        <Label st={stOf("srR")} x={33} y={348} fill={map} />
      </AccentContext.Provider>
    </PadShell>
  );
});

/** Round face button (A/B/X/Y) with a centred letter. */
function FaceBtn({ cx, cy, letter, st, onClick, btnKey }: { cx: number; cy: number; letter: string; st: St; onClick: (e: React.MouseEvent) => void; btnKey: string }) {
  const { map } = useMap();
  const accent = useAccent();
  return (
    <g onClick={onClick} data-btn={btnKey} style={{ cursor: "pointer" }} role="button" aria-label={letter} data-pad-tip={st.tip}>
      {st.pressed && <circle cx={cx} cy={cy} r="23" fill={accent} filter="url(#jcGlow)" opacity="0.9" />}
      <circle cx={cx} cy={cy} r="20" fill={st.mapped ? map : "#2a2d33"} />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="15" fontWeight={700} fill={st.mapped ? ARROW_ON : "#cbd0d8"} style={{ pointerEvents: "none" }}>{letter}</text>
      {st.selected && (
        <>
          <circle cx={cx} cy={cy} r="20" fill="none" stroke={SEL_HALO} strokeWidth="5.5" />
          <circle cx={cx} cy={cy} r="20" fill="none" stroke={SEL} strokeWidth="3" />
        </>
      )}
    </g>
  );
}
