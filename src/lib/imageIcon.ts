// Turn a user-supplied image (chosen from a file, or pasted from e.g. CLIP
// Studio) into a small icon data URL for a saved operation. Hard-downscaled so
// it stays tiny inside workspace.json (which is backed up / synced).

import i18n from "./i18n";

/** Longest edge (px) of a stored image icon. Kept small on purpose. */
const MAX_PX = 64;

/** Validate + downscale `file` to a `data:image/png` URL no larger than
 * {@link MAX_PX} on its longest edge, preserving aspect ratio. Rejects anything
 * that isn't a raster image — SVGs are refused (they can carry script; icons
 * must be inert data), matching the "no code execution" security stance. */
export async function fileToIconDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    throw new Error(i18n.t("PNG や JPEG などの画像を選んでください（SVG は不可）。"));
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const longest = Math.max(img.naturalWidth, img.naturalHeight);
    if (longest === 0) throw new Error(i18n.t("画像を読み込めませんでした。"));
    const scale = Math.min(1, MAX_PX / longest);
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error(i18n.t("画像を処理できませんでした。"));
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(i18n.t("画像を読み込めませんでした。")));
    img.src = url;
  });
}
