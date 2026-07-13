import type {
  Definition,
  DefinitionGroup,
  PressConfig,
} from "../../../lib/types";
import { PieBody, InputBody, LayerHoldBody } from "./bodies";
/** Dispatch to the editor body for a press's type. Shared by the button-inline
 * editor (VariantRow) and the definition editor (PressEditor); the button-only
 * extras (`btnKey`, `onAddLayer`) are optional and simply absent for
 * definitions. Renders nothing for the `none` draft type. */
export function PressBody({
  press,
  onChange,
  layerOptions,
  definitions,
  groups,
  btnKey,
  onAddLayer,
  onJumpToDefinition,
}: {
  press: PressConfig;
  onChange: (p: PressConfig) => void;
  layerOptions: string[];
  definitions?: Definition[];
  groups?: DefinitionGroup[];
  /** Button key when editing inline; fixes a modifier's name to the button and
   * remounts the InputBody per button (fresh repeat-default state). */
  btnKey?: string;
  /** Create a layer (for LayerHold's "＋ create layer named after button"). */
  onAddLayer?: (name: string) => void;
  /** Jump to a referenced definition (📌 reference chips inside the lists). */
  onJumpToDefinition?: (id: string) => void;
}) {
  switch (press.type) {
    case "input":
      return (
        <InputBody
          key={btnKey}
          press={press}
          onChange={onChange}
          definitions={definitions}
          groups={groups}
          onJumpToDefinition={onJumpToDefinition}
        />
      );
    case "pie":
      return (
        <PieBody
          press={press}
          onChange={onChange}
          definitions={definitions}
          groups={groups}
          onJumpToDefinition={onJumpToDefinition}
        />
      );
    case "layerHold":
      return (
        <LayerHoldBody
          press={press}
          onChange={onChange}
          layerOptions={layerOptions}
          btnKey={btnKey}
          onAddLayer={onAddLayer}
        />
      );
    default:
      return null;
  }
}
