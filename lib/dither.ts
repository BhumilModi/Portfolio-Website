// Bayer 8×8 ordered dither: grayscale bytes → 1-bit alpha mask (255 = ink). Used by scripts/fetch-art.mjs.
const BAYER8 = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26,
  12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25,
  15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
];

// ink "light": bright pixels become ink (marble on black). "dark": dark pixels become ink (engraving on paper).
// levels: [black point, white point], stretched to 0–1 before dithering so the ground drops out cleanly.
export function ditherMask(
  gray: Uint8Array,
  width: number,
  height: number,
  ink: "light" | "dark",
  levels: [number, number] = [0, 255],
): Uint8Array {
  const [lo, hi] = levels;
  const out = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      let v = Math.min(1, Math.max(0, (gray[i] - lo) / (hi - lo)));
      if (ink === "dark") v = 1 - v;
      out[i] = v > (BAYER8[(y % 8) * 8 + (x % 8)] + 0.5) / 64 ? 255 : 0;
    }
  }
  return out;
}
