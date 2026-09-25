// Dev-time only: Poly Haven CC0 glTF → geometry-only, meshopt-compressed GLB in public/models.
// Run: node scripts/fetch-models.mjs   (needs network; uses npx @gltf-transform/cli@4)
import { execFileSync } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";

const IDS = ["marble_bust_01", "horse_head", "lion_head", "antique_ceramic_vase_01"];
const TMP = ".models-tmp";

await mkdir(TMP, { recursive: true });
await mkdir("public/models", { recursive: true });

for (const id of IDS) {
  const base = `https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/${id}`;
  const gltf = await (await fetch(`${base}/${id}_1k.gltf`)).json();
  for (const buffer of gltf.buffers) {
    const bytes = Buffer.from(await (await fetch(`${base}/${buffer.uri}`)).arrayBuffer());
    await writeFile(`${TMP}/${buffer.uri}`, bytes);
  }
  // Geometry only: the engraving shader ignores textures.
  delete gltf.images;
  delete gltf.textures;
  delete gltf.samplers;
  for (const material of gltf.materials ?? []) {
    for (const key of Object.keys(material)) if (key.endsWith("Texture")) delete material[key];
    const pbr = material.pbrMetallicRoughness ?? {};
    for (const key of Object.keys(pbr)) if (key.endsWith("Texture")) delete pbr[key];
  }
  await writeFile(`${TMP}/${id}.gltf`, JSON.stringify(gltf));
  execFileSync("npx", ["-y", "@gltf-transform/cli@4", "meshopt", `${TMP}/${id}.gltf`, `public/models/${id}.glb`], { stdio: "inherit" });
}

await rm(TMP, { recursive: true, force: true });
