import type { GlobalSettings } from "../../../lib/types";
import { PieLookCard } from "./PieLookCard";
import { type SetGlobal } from "./shared";

/** Pie settings: detection threshold + pie-menu appearance, split into sections
 * (behaviour / shape-size / colour / label) by PieLookCard. Kept in its own tab so the pie
 * has room and its tuning lives together rather than mixed into the input tab. */
export function PieTab({
  settings,
  setG,
}: {
  settings: GlobalSettings;
  setG: SetGlobal;
}) {
  return <PieLookCard settings={settings} setG={setG} />;
}
