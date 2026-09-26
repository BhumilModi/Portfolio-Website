// Dev-time only: Wikimedia Commons (Kevin MacLeod, CC BY 3.0) → trimmed, loudness-matched loops in public/audio.
// Run: node scripts/fetch-audio.mjs   (needs network and ffmpeg on PATH)
import { execFileSync } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";

// start/length: the loop window in seconds — calibration knobs; tune by ear so the loop lands on a phrase.
const TRACKS = [
  { name: "olympus", file: "Gymnopedie No. 1 (ISRC USUAN1100787).mp3", title: "Gymnopédie No. 1", composer: "Erik Satie", start: 0, length: 150 },
  { name: "underworld", file: "Danse Macabre (ISRC USUAN1100546).mp3", title: "Danse macabre", composer: "Camille Saint-Saëns", start: 30, length: 150 },
];
const API = "https://commons.wikimedia.org/w/api.php";
const HEADERS = { "User-Agent": "bhumil-portfolio-asset-fetch/1.0 (https://github.com/BhumilModi)" };
const TMP = ".audio-tmp";

await mkdir(TMP, { recursive: true });
await mkdir("public/audio", { recursive: true });
const manifest = [];

for (const t of TRACKS) {
  const q = new URL(API);
  q.search = new URLSearchParams({ action: "query", prop: "imageinfo", iiprop: "url|extmetadata", format: "json", titles: `File:${t.file}` }).toString();
  const res = await fetch(q, { headers: HEADERS });
  if (!res.ok) throw new Error(`${t.name}: Commons API HTTP ${res.status}`);
  const page = Object.values((await res.json()).query.pages)[0];
  const info = page.imageinfo?.[0];
  const license = info?.extmetadata?.LicenseShortName?.value;
  if (license !== "CC BY 3.0") throw new Error(`${t.name}: expected CC BY 3.0, got ${license}`);

  const audio = await fetch(info.url, { headers: HEADERS });
  if (!audio.ok) throw new Error(`${t.name}: HTTP ${audio.status} for ${info.url}`);
  const src = `${TMP}/${t.name}.mp3`;
  await writeFile(src, Buffer.from(await audio.arrayBuffer()));

  // 2s fades at both ends make the loop seam a breath, not a click; loudnorm levels the two realms.
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error",
    "-ss", String(t.start), "-t", String(t.length), "-i", src,
    "-af", `afade=t=in:d=2,afade=t=out:st=${t.length - 2}:d=2,loudnorm=I=-20:TP=-2`,
    "-ac", "2", "-b:a", "96k",
    `public/audio/${t.name}.mp3`,
  ], { stdio: "inherit" });
  console.log(`✓ ${t.name}`);

  manifest.push({
    name: t.name,
    title: t.title,
    composer: t.composer,
    performer: "Kevin MacLeod (incompetech.com)",
    source: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(t.file.replaceAll(" ", "_"))}`,
    license: "CC BY 3.0 — https://creativecommons.org/licenses/by/3.0/",
  });
}

await writeFile("public/audio/manifest.json", JSON.stringify(manifest, null, 2) + "\n");
await rm(TMP, { recursive: true, force: true });
