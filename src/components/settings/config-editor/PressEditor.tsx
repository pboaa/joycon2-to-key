import type { Definition, DefinitionGroup, PressConfig } from "../../../lib/types";
import { PressTypeEditor } from "./PressTypeEditor";

/** Press editor without the button context (type + body). For definitions. Layer
 * hold is profile-local, so it isn't portable — only key input / pie are offered.
 * An existing layer-hold definition still shows its category so it can be
 * viewed/changed. */
export function PressEditor({
  press,
  onChange,
  cacheKey,
  layerOptions,
  definitions,
  groups,
  onJumpToDefinition,
}: {
  press: PressConfig;
  onChange: (p: PressConfig) => void;
  /** The definition id — identifies this editing slot for the draft cache. */
  cacheKey: string;
  layerOptions: string[];
  /** Saved definitions, offered via a pie direction's "from operation". */
  definitions?: Definition[];
  groups?: DefinitionGroup[];
  /** Jump to a referenced definition (📌 reference chips inside the lists). */
  onJumpToDefinition?: (id: string) => void;
}) {
  return (
    <PressTypeEditor
      press={press}
      onChange={onChange}
      cacheKey={cacheKey}
      layerOptions={layerOptions}
      selectable={["input", "pie"]}
      definitions={definitions}
      groups={groups}
      onJumpToDefinition={onJumpToDefinition}
    />
  );
}
