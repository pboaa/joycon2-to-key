// Centralizes the checks around InputCommand's `def` kind ("a reference to a
// saved operation (Definition)"). This used to be scattered — inline
// `cmd.type === "def"` and re-implementations of "is this a single def reference?"
// across pie drawing, input risk, and command rows.

import type { InputCommand } from "./types";

/** A single input command that references a saved operation. */
export type DefRefCommand = Extract<InputCommand, { type: "def" }>;

/** Type guard: this command is a reference to a saved operation. */
export function isDefRef(cmd: InputCommand): cmd is DefRefCommand {
  return cmd.type === "def";
}

/** When `inputs` is exactly one saved-operation reference, its definition id;
 * otherwise undefined. Used to mark a pie slice / centre (or similar) as "just a
 * link to a saved operation" so it can show that op's icon / a link marker. */
export function defRefId(inputs: InputCommand[] | undefined): string | undefined {
  if (inputs?.length !== 1) return undefined;
  const c = inputs[0];
  return isDefRef(c) ? c.def : undefined;
}

/** The icon of the operation a single-def-reference points at, if any. */
export function defRefIcon(
  inputs: InputCommand[] | undefined,
  resolveIcon?: (id: string) => string | undefined,
): string | undefined {
  const id = defRefId(inputs);
  return id ? resolveIcon?.(id) : undefined;
}

/** The icon tint of the operation a single-def-reference points at, if any. */
export function defRefColor(
  inputs: InputCommand[] | undefined,
  resolveColor?: (id: string) => string | undefined,
): string | undefined {
  const id = defRefId(inputs);
  return id ? resolveColor?.(id) : undefined;
}
