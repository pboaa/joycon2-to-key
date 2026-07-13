import { memo } from "react";
import { BUTTON_KEYS_LEFT } from "../../lib/keyCatalog";
import {
  AccentContext,
  ARROW_ON,
  Dpad,
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
} from "./padParts";

/* Joy-Con (L) rendered from the reference design (viewBox 300 x 640). */

export const JoyConPad = memo(function JoyConPad(props: PadProps) {
  const { stick, onSelect, onDeselect, onContext, stickMouse, stickDeadzone, accent } =
    props;
  const { map } = useMap();
  const states = usePadStates(BUTTON_KEYS_LEFT, props);
  const stOf = (key: string) => states[key];
  const hit = (key: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(key);
  };

  const knobDx = Math.max(-1, Math.min(1, stick.x)) * STICK_TRAVEL;
  const knobDy = Math.max(-1, Math.min(1, -stick.y)) * STICK_TRAVEL;
  const sStick = stOf("stickPress");

  return (
    <PadShell ariaLabel="Joy-Con (L)" viewBox="0 -8 270 624" onDeselect={onDeselect} onContext={onContext}>
      <AccentContext.Provider value={accent}>
      {/* Body + accent rail (static) */}
      <path d="M104,32 H188 A24,24 0 0 1 212,56 V584 A26,26 0 0 1 186,610 H98 A54,54 0 0 1 44,556 V90 A58,58 0 0 1 104,32 Z" fill="#343841" />
      <rect x="212" y="74" width="16" height="492" rx="4" fill={accent} />

      {/* Shoulders */}
      <Shoulder d="M12,94 A88,88 0 0 1 99,2 H150" w={16} base="#2b2f36" st={stOf("zl")} onClick={hit("zl")} label="zl" name="ZL" textAt={[124, 2]} nameSize={10} />
      <Shoulder d="M35,90 A67,67 0 0 1 104,23 H150" w={12} base="#4a4e56" st={stOf("l")} onClick={hit("l")} label="l" name="L" textAt={[127, 23]} nameSize={9} />

      {/* Minus */}
      {(() => {
        const s = stOf("minus");
        return (
          <g onClick={hit("minus")} data-btn="minus" style={{ cursor: "pointer" }} role="button" aria-label="minus" data-pad-tip={s.tip}>
            <rect x="150" y="74" width="42" height="26" fill="none" pointerEvents="all" />
            {s.pressed && <rect x="157" y="82" width="28" height="10" rx="5" fill={accent} filter="url(#jcGlow)" opacity="0.9" />}
            <rect x="159" y="84" width="24" height="6" rx="3" fill={s.heat ?? (s.mapped ? map : "#c9ced6")} />
            {s.selected && (
              <>
                <rect x="153" y="79" width="36" height="16" rx="8" fill="none" stroke={SEL_HALO} strokeWidth="4.5" />
                <rect x="153" y="79" width="36" height="16" rx="8" fill="none" stroke={SEL} strokeWidth="2" />
              </>
            )}
          </g>
        );
      })()}

      {/* Analog stick */}
      <g onClick={hit("stickPress")} data-btn="stickPress" style={{ cursor: "pointer" }} role="button" aria-label="stickPress" data-pad-tip={sStick.tip}>
        {sStick.pressed && <circle cx="128" cy="192" r="43" fill={accent} filter="url(#jcGlow)" opacity="0.9" />}
        <circle cx="128" cy="192" r="46" fill="#23262b" />
        <circle cx="128" cy="192" r="39" fill="none" stroke={accent} strokeWidth="6" />
        <circle cx="128" cy="192" r="31" fill={sStick.heat ?? (sStick.mapped ? map : "#2b2f36")} />
        <DeadzoneRing cx={128} cy={192} r={STICK_TRAVEL} pct={stickDeadzone} />
        <circle cx={128 + knobDx} cy={192 + knobDy} r="6" fill={sStick.mapped ? ARROW_ON : "#3a3d43"} />
        {sStick.selected && (
          <>
            <circle cx="128" cy="192" r="46" fill="none" stroke={SEL_HALO} strokeWidth="5.5" />
            <circle cx="128" cy="192" r="46" fill="none" stroke={SEL} strokeWidth="3" />
          </>
        )}
      </g>

      {/* Stick directions — hidden while the stick drives the mouse. */}
      {!stickMouse && (
        <>
          <Tri d="M128,130 L119,145 L137,145 Z" hit={[128, 139, 15]} st={stOf("stickUp")} onClick={hit("stickUp")} btnKey="stickUp" />
          <Tri d="M128,254 L119,239 L137,239 Z" hit={[128, 245, 15]} st={stOf("stickDown")} onClick={hit("stickDown")} btnKey="stickDown" />
          <Tri d="M66,192 L81,183 L81,201 Z" hit={[74, 192, 14]} st={stOf("stickLeft")} onClick={hit("stickLeft")} btnKey="stickLeft" />
          <Tri d="M190,192 L175,183 L175,201 Z" hit={[182, 192, 14]} st={stOf("stickRight")} onClick={hit("stickRight")} btnKey="stickRight" />
        </>
      )}
      {stickMouse && <StickMouseBadge cx={128} cy={139} />}

      {/* Face direction buttons */}
      <Dpad cx={128} cy={332} arrow="M128,324 L120,338 L136,338 Z" st={stOf("up")} onClick={hit("up")} btnKey="up" />
      <Dpad cx={88} cy={372} arrow="M80,372 L94,364 L94,380 Z" st={stOf("left")} onClick={hit("left")} btnKey="left" />
      <Dpad cx={168} cy={372} arrow="M176,372 L162,364 L162,380 Z" st={stOf("right")} onClick={hit("right")} btnKey="right" />
      <Dpad cx={128} cy={412} arrow="M128,420 L120,406 L136,406 Z" st={stOf("down")} onClick={hit("down")} btnKey="down" />

      {/* Capture */}
      <SquareBtn x={150} y={473} iconRx={5} st={stOf("capture")} onClick={hit("capture")} label="capture" />


      {/* Rail buttons */}
      <RailBtn x={228} y={147} text="SL" st={stOf("sl")} onClick={hit("sl")} btnKey="sl" />
      <RailBtn x={228} y={357} text="SR" st={stOf("sr")} onClick={hit("sr")} btnKey="sr" />

      {/* Mapping labels — drawn last so they sit on top of every button. */}
      <Label st={stOf("zl")} x={156} y={3} anchor="start" />
      <Label st={stOf("l")} x={156} y={24} anchor="start" />
      <Label st={stOf("minus")} x={171} y={66} />
      {!stickMouse && (
        <>
          <Label st={stOf("stickUp")} x={128} y={118} />
          <Label st={stOf("stickDown")} x={128} y={268} />
          <Label st={stOf("stickLeft")} x={74} y={216} />
          <Label st={stOf("stickRight")} x={182} y={216} />
        </>
      )}
      <Label st={stOf("up")} x={128} y={304} />
      <Label st={stOf("left")} x={78} y={403} />
      <Label st={stOf("right")} x={178} y={403} />
      <Label st={stOf("down")} x={128} y={443} />
      <Label st={stOf("capture")} x={170} y={524} />
      <Label st={stOf("sl")} x={237} y={138} fill={map} />
      <Label st={stOf("sr")} x={237} y={348} fill={map} />
      </AccentContext.Provider>
    </PadShell>
  );
});
