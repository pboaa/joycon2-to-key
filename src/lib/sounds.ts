// Small Web Audio cue player for connect / auto-disconnect notifications.
// No audio assets — short tones are synthesized so the choice is a plain id.

/** Selectable cues, shown in the settings selects. */
export const SOUND_OPTIONS: { value: string; label: string }[] = [
  { value: "none", label: "なし" },
  { value: "beep", label: "ピッ" },
  { value: "rising", label: "上昇（ピロッ）" },
  { value: "falling", label: "下降（ポロッ）" },
  { value: "chime", label: "チャイム" },
  { value: "double", label: "ピピッ" },
];

let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
    // Autoplay policies can leave it suspended until a user pie.
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** One short sine "blip" at `freq`, starting `at` seconds from now. */
function blip(a: AudioContext, freq: number, at: number, dur: number) {
  const t0 = a.currentTime + at;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.16, t0 + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/** Play a named cue. Unknown / "none" is silent. */
export function playSound(id: string): void {
  if (!id || id === "none") return;
  const a = audio();
  if (!a) return;
  switch (id) {
    case "beep":
      blip(a, 880, 0, 0.12);
      break;
    case "rising":
      blip(a, 660, 0, 0.08);
      blip(a, 990, 0.09, 0.11);
      break;
    case "falling":
      blip(a, 990, 0, 0.08);
      blip(a, 660, 0.09, 0.12);
      break;
    case "chime":
      blip(a, 880, 0, 0.1);
      blip(a, 1318, 0.1, 0.16);
      break;
    case "double":
      blip(a, 990, 0, 0.07);
      blip(a, 990, 0.11, 0.07);
      break;
  }
}
