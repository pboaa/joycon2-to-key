/** Number of player-indicator lamps (Joy-Con has 4). */
export const LAMP_COUNT = 4;

/** The controller LED byte lights lamp `i` (0–3) via bit `i`. (The high nibble
 * can flash a lamp, but Joy-Con 2 only blinks it once, so we only use solid on
 * here.) These helpers toggle a lamp on/off in that byte. */
export function lampOn(byte: number, i: number): boolean {
  return ((byte >> i) & 1) !== 0;
}

/** Return `byte` with lamp `i` toggled (also clearing any legacy flash bit). */
export function toggleLamp(byte: number, i: number): number {
  const flash = 1 << (i + 4);
  return (byte & ~flash) ^ (1 << i);
}
