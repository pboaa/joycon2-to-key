import { type ReactNode } from "react";
import type {
  Definition,
  DefinitionGroup,
  PressConfig,
  PressType,
} from "../../../lib/types";
import { switchPressType } from "../../../lib/pressDraftCache";
import { PressBody } from "./PressBody";
import { PressTypePicker, type PressCategory } from "./PressTypePicker";

/** Shared editor core: the type picker + the type's body, with type switching
 * that keeps the previous type's data in memory (session-only) so switching
 * back restores it. Used by both the button editor (VariantRow) and the
 * definition editor (PressEditor); callers supply their own surrounding chrome
 * (delete / save-as-definition / linked card) and a `cacheKey` identifying the
 * editing slot. */
export function PressTypeEditor({
  press,
  onChange,
  cacheKey,
  layerOptions,
  btnKey,
  selectable,
  onPickDefinition,
  rightSlot,
  definitions,
  groups,
  onAddLayer,
  onJumpToDefinition,
}: {
  press: PressConfig;
  onChange: (p: PressConfig) => void;
  /** Identifies this editing slot for the draft cache (button or definition). */
  cacheKey: string;
  layerOptions: string[];
  btnKey?: string;
  selectable?: PressCategory[];
  onPickDefinition?: () => void;
  rightSlot?: ReactNode;
  definitions?: Definition[];
  groups?: DefinitionGroup[];
  onAddLayer?: (name: string) => void;
  onJumpToDefinition?: (id: string) => void;
}) {
  const chooseType = (to: PressType) =>
    switchPressType({
      key: cacheKey,
      current: press,
      to,
      createOpts: { btnKey, layerOptions },
      onChange,
    });
  return (
    <div className="space-y-1.5">
      <PressTypePicker
        type={press.type}
        onSelectType={chooseType}
        selectable={selectable}
        onPickDefinition={onPickDefinition}
        rightSlot={rightSlot}
      />
      <PressBody
        press={press}
        onChange={onChange}
        layerOptions={layerOptions}
        definitions={definitions}
        groups={groups}
        btnKey={btnKey}
        onAddLayer={onAddLayer}
        onJumpToDefinition={onJumpToDefinition}
      />
    </div>
  );
}
