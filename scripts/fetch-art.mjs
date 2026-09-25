// Dev-time only: The Met Open Access (CC0) → ordered-dither alpha masks in public/art.
// Run: node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/fetch-art.mjs   (needs network)
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";
import { ditherMask } from "../lib/dither.ts";

// ink: which tone becomes ink — "dark" for engravings/photos on light ground, "light" for marbles on black.
// levels: [black point, white point]; tune until the ground is empty. width: dither resolution
// (the PNG is upscaled 2× nearest-neighbour so every dot is a crisp 2px).
// crop: optional { left, top, right, bottom } fractions of the source image trimmed from each edge
// before dithering — cuts the plate mark, paper margin and caption text off scanned engravings.
// tone: continuous-tone duotone instead of a dither mask — { ground, ink, strength } where strength (0–1)
// is how far the brightest marble moves from ground toward ink. Baked, softened by `blur`, into a JPEG.
const ART = [
  { name: "apollo", id: 340036, ink: "dark", levels: [40, 215], width: 700 },
  { name: "carceri", id: 362671, ink: "dark", levels: [40, 170], width: 1000, crop: { left: 0.02, top: 0.02, right: 0.02, bottom: 0.06 } },
  { name: "sant-angelo", id: 360267, ink: "dark", levels: [40, 150], width: 1000, crop: { left: 0.01, top: 0.01, right: 0.01, bottom: 0.12 } },
  { name: "hercules", id: 343588, ink: "dark", levels: [40, 215], width: 600, crop: { left: 0.02, top: 0.02, right: 0.02, bottom: 0.15 } },
  { name: "amphora", id: 255154, ink: "dark", levels: [30, 120], width: 300 },
  { name: "relief", id: 248899, levels: [20, 235], width: 1600, blur: 1.2, crop: { left: 0.02, top: 0.28, right: 0.02, bottom: 0.31 }, tone: { ground: "#9a2a14", ink: "#efe6d4", strength: 0.24 } },
];

const hexRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

await mkdir("public/art", { recursive: true });
const manifest = [];

for (const a of ART) {
  const obj = await (await fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${a.id}`)).json();
  if (obj.isPublicDomain !== true || !obj.primaryImage) {
    throw new Error(`${a.name}: Met object ${a.id} is not public domain or has no image`);
  }
  const src = Buffer.from(await (await fetch(obj.primaryImage)).arrayBuffer());
  let pipeline = sharp(src);
  if (a.crop) {
    const { width: srcW, height: srcH } = await sharp(src).metadata();
    const left = Math.round(srcW * a.crop.left);
    const top = Math.round(srcH * a.crop.top);
    const right = Math.round(srcW * a.crop.right);
    const bottom = Math.round(srcH * a.crop.bottom);
    pipeline = pipeline.extract({ left, top, width: srcW - left - right, height: srcH - top - bottom });
  }
  if (a.tone) {
    const { data, info } = await pipeline.grayscale().resize({ width: a.width }).blur(a.blur).raw().toBuffer({ resolveWithObject: true });
    const [lo, hi] = a.levels;
    const ground = hexRgb(a.tone.ground);
    const ink = hexRgb(a.tone.ink);
    const rgb = Buffer.alloc(info.width * info.height * 3);
    for (let i = 0; i < data.length; i++) {
      const t = Math.min(1, Math.max(0, (data[i] - lo) / (hi - lo))) * a.tone.strength;
      for (let c = 0; c < 3; c++) rgb[i * 3 + c] = Math.round(ground[c] + (ink[c] - ground[c]) * t);
    }
    await sharp(rgb, { raw: { width: info.width, height: info.height, channels: 3 } })
      .jpeg({ quality: 70, mozjpeg: true })
      .toFile(`public/art/${a.name}.jpg`);
    console.log(`✓ ${a.name}  ${info.width}×${info.height} (tone)`);
  } else {
    const { data, info } = await pipeline.grayscale().resize({ width: a.width }).raw().toBuffer({ resolveWithObject: true });
    const mask = ditherMask(data, info.width, info.height, a.ink, a.levels);
    const rgba = Buffer.alloc(info.width * info.height * 4);
    for (let i = 0; i < mask.length; i++) rgba[i * 4 + 3] = mask[i];
    await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
      .resize({ width: info.width * 2, kernel: "nearest" })
      .png({ palette: true, colours: 2, compressionLevel: 9 })
      .toFile(`public/art/${a.name}.png`);
    console.log(`✓ ${a.name}  ${info.width * 2}×${info.height * 2}`);
  }
  manifest.push({
    name: a.name,
    id: a.id,
    title: obj.title,
    artist: obj.artistDisplayName || null,
    date: obj.objectDate,
    url: obj.objectURL,
    license: "CC0 — The Met Open Access",
  });
}

await writeFile("public/art/manifest.json", JSON.stringify(manifest, null, 2) + "\n");
