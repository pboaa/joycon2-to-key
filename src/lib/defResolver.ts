import type { Definition } from "./types";

/** Look up a saved operation's name/icon/colour by id. The same tiny
 * `definitions.find` resolver was inlined in several components; this is the one
 * place for it. */
export interface DefResolver {
  name: (id: string) => string | undefined;
  icon: (id: string) => string | undefined;
  color: (id: string) => string | undefined;
}

export function makeDefResolver(definitions?: Definition[]): DefResolver {
  return {
    name: (id) => definitions?.find((d) => d.id === id)?.name,
    icon: (id) => definitions?.find((d) => d.id === id)?.icon,
    color: (id) => definitions?.find((d) => d.id === id)?.iconColor,
  };
}
