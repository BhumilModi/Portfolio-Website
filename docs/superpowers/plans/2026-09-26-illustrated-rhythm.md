# Illustrated Rhythm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single terracotta field with a terracotta / paper / void rhythm. Add dithered public-domain engravings behind content, swap the FAQ for a "Working together" band, and rebuild the footer as an illustrated collage.

**Architecture:** A dev-time script fetches CC0 images from The Met and ordered-dithers them into 1-bit **alpha-mask PNGs** in `public/art/`. A tiny `<Art>` component renders a mask with `background-color: currentColor`, so each image can be inked in any colour with a `text-*` class. Sections become full-bleed wrappers with their own field colour around the existing centred container.

**Tech Stack:** Next 16.3.6, React 19, Tailwind CSS 4.3.3 (CSS-first `@theme` in `app/globals.css`), `sharp` 0.35.4 (a transitive Next dependency, resolvable from `node_modules/sharp`), Node 24 built-in test runner with TS type-stripping.

**Spec:** `docs/superpowers/specs/2026-09-26-illustrated-rhythm-design.md`

## Global Constraints

- Palette: `--color-void #0b0907`, `--color-field #9a2a14`, `--color-bone #efe6d4`, `--color-ash #6b5f52`, `--color-ember #d0643b`; new `--color-paper #efe6d4`, `--color-ink #0b0907`.
- Rhythm: Hero + Engagement = terracotta; Approach, Cases, Record = paper/ink; Work + Together = void/bone; Footer = terracotta.
- Art only from The Met Open Access. The script **throws** if `isPublicDomain !== true`.
- Decorative art is `aria-hidden`, has no pointer events, and sits behind content (`-z-10` inside an `isolate` section).
- No new npm dependencies. No client names, rates, availability dates or contract terms in copy.
- Text contrast ≥ 4.5:1 (body/meta), verified with axe.
- Commits: **NO `Co-Authored-By` trailer, no AI/Claude attribution of any kind.** Never `git push`. Stage only the files your task names (other tasks may be committing in parallel).
- Next docs: this Next version differs from training data. Read `node_modules/next/dist/docs/` before using any Next API. These tasks use none beyond what already exists.
- Dev server is already running at `http://localhost:3000` (hot reload). Do not start another one.
- Browser checks use the **Orca CLI** (`orca status`, `orca tab create --url …`, `orca eval --expression …`, `orca screenshot --format jpeg --json` → base64 in `.result.data`). Playwright only if Orca is unreachable.
- Frontend tasks (2–4) MUST first load skills `emil-design-eng`, `impeccable:impeccable` and `taste-skill:taste-skill`. Design direction is already fixed by this plan and spec, so skip Inspo/TypeUI. No shadcn components are involved. If you add a component the repo lacks, or edit a shadcn component whose API you'd be recalling, fetch it via `mcp__shadcn__*` first. Neither case is expected.

## File map

| File | Task | Responsibility |
|---|---|---|
| `lib/dither.ts` + `lib/dither.test.ts` | 1 | Pure Bayer 8×8 dither → alpha mask |
| `scripts/fetch-art.mjs` | 1 | Met fetch + CC0 guard + sharp → `public/art/*.png`, `manifest.json` |
| `components/sections/art.tsx` | 1 | `<Art name>` mask renderer |
| `app/globals.css` | 1 (`.art`), 2 (tokens, rays, meander, grain, focus, drop `.faq` rule) | Styles |
| hero, engagement, approach, work, cases, record, section-label `.tsx` | 2 | Rhythm + art placement |
| `components/sections/together.tsx`, `app/page.tsx`, `lib/content.ts` (NAV, FAQ→TOGETHER) | 3 | FAQ replacement |
| `components/sections/footer.tsx`, `lib/content.ts` (FOOTER only) | 4 | Footer |
| delete `components/sections/faq.tsx` | 3 | — |

Order: Task 1 → Tasks 2, 3, 4 in parallel → Task 5 (final verification).

---

### Task 1: Art pipeline

**Files:**
- Create: `lib/dither.ts`, `lib/dither.test.ts`, `scripts/fetch-art.mjs`, `components/sections/art.tsx`, `public/art/*.png` (8), `public/art/manifest.json`
- Modify: `app/globals.css` (append `.art`)

**Interfaces:**
- Produces: `ditherMask(gray: Uint8Array, width: number, height: number, ink: "light" | "dark", levels?: [number, number]): Uint8Array`
- Produces: `export type ArtName = "apollo" | "carceri" | "sant-angelo" | "hercules" | "amphora" | "bust-man" | "bust-emperor" | "bust-woman"` and `export default function Art({ name, className }: { name: ArtName; className?: string })` in `components/sections/art.tsx`
- Produces: CSS class `.art` in `@layer components`. The mask defaults to `center / contain no-repeat`; override it with arbitrary properties like `[mask-size:cover]` and `[mask-position:bottom]`.

- [ ] **Step 1: Write the failing test** `lib/dither.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { ditherMask } from "./dither.ts";

const fill = (v: number, n = 64) => new Uint8Array(n).fill(v);
const inked = (m: Uint8Array) => m.filter((a) => a === 255).length;

test("solid tones stay solid", () => {
  assert.equal(inked(ditherMask(fill(255), 8, 8, "light")), 64);
  assert.equal(inked(ditherMask(fill(255), 8, 8, "dark")), 0);
  assert.equal(inked(ditherMask(fill(0), 8, 8, "light")), 0);
  assert.equal(inked(ditherMask(fill(0), 8, 8, "dark")), 64);
});

test("mid grey inks half of an 8×8 cell", () => {
  assert.equal(inked(ditherMask(fill(128), 8, 8, "light")), 32);
});

test("levels clip the ground out", () => {
  assert.equal(inked(ditherMask(fill(100), 8, 8, "light", [100, 200])), 0);
  assert.equal(inked(ditherMask(fill(200), 8, 8, "light", [100, 200])), 64);
});

test("output is strictly 0 or 255", () => {
  const gray = Uint8Array.from({ length: 256 }, (_, i) => i);
  assert.ok(ditherMask(gray, 16, 16, "dark").every((a) => a === 0 || a === 255));
});
```

- [ ] **Step 2: Run it, expect failure**

Run: `npm test`
Expected: FAIL — `Cannot find module …/lib/dither.ts`.

- [ ] **Step 3: Implement** `lib/dither.ts`

```ts
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
```

- [ ] **Step 4: Run tests, expect pass**

Run: `npm test`
Expected: all tests PASS (the argus/daedalus/timeline suites plus 4 new).

- [ ] **Step 5: Write** `scripts/fetch-art.mjs`

```js
// Dev-time only: The Met Open Access (CC0) → ordered-dither alpha masks in public/art.
// Run: node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/fetch-art.mjs   (needs network)
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";
import { ditherMask } from "../lib/dither.ts";

// ink: which tone becomes ink — "dark" for engravings/photos on light ground, "light" for marbles on black.
// levels: [black point, white point]; tune until the ground is empty. width: dither resolution
// (the PNG is upscaled 2× nearest-neighbour so every dot is a crisp 2px).
const ART = [
  { name: "apollo", id: 340036, ink: "dark", levels: [40, 215], width: 700 },
  { name: "carceri", id: 362671, ink: "dark", levels: [40, 210], width: 1000 },
  { name: "sant-angelo", id: 360267, ink: "dark", levels: [40, 215], width: 1000 },
  { name: "hercules", id: 343588, ink: "dark", levels: [40, 215], width: 600 },
  { name: "amphora", id: 255154, ink: "dark", levels: [30, 200], width: 300 },
  { name: "bust-man", id: 248118, ink: "light", levels: [45, 235], width: 600 },
  { name: "bust-emperor", id: 248851, ink: "light", levels: [45, 235], width: 600 },
  { name: "bust-woman", id: 248897, ink: "light", levels: [45, 235], width: 600 },
];

await mkdir("public/art", { recursive: true });
const manifest = [];

for (const a of ART) {
  const obj = await (await fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${a.id}`)).json();
  if (obj.isPublicDomain !== true || !obj.primaryImage) {
    throw new Error(`${a.name}: Met object ${a.id} is not public domain or has no image`);
  }
  const src = Buffer.from(await (await fetch(obj.primaryImage)).arrayBuffer());
  const { data, info } = await sharp(src).grayscale().resize({ width: a.width }).raw().toBuffer({ resolveWithObject: true });
  const mask = ditherMask(data, info.width, info.height, a.ink, a.levels);
  const rgba = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < mask.length; i++) rgba[i * 4 + 3] = mask[i];
  await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
    .resize({ width: info.width * 2, kernel: "nearest" })
    .png({ palette: true, colours: 2, compressionLevel: 9 })
    .toFile(`public/art/${a.name}.png`);
  manifest.push({
    name: a.name,
    id: a.id,
    title: obj.title,
    artist: obj.artistDisplayName || null,
    date: obj.objectDate,
    url: obj.objectURL,
    license: "CC0 — The Met Open Access",
  });
  console.log(`✓ ${a.name}  ${info.width * 2}×${info.height * 2}`);
}

await writeFile("public/art/manifest.json", JSON.stringify(manifest, null, 2) + "\n");
```

- [ ] **Step 6: Run the script**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/fetch-art.mjs && ls -la public/art`
Expected: 8 `✓` lines, 8 PNGs plus `manifest.json`. If `sharp` fails to resolve, import it as `import sharp from "../node_modules/sharp/dist/index.mjs"` and note that in the file comment.

- [ ] **Step 7: Preview and tune levels**

Save this file in the session scratchpad (not the repo) as `preview.mjs`, then run it from the repo root with `node <scratchpad>/preview.mjs <scratchpad>`:

```js
import sharp from "/Users/bhumilmodi/Personal work/My Portfolio/node_modules/sharp/dist/index.mjs";
const out = process.argv[2];
const R = "/Users/bhumilmodi/Personal work/My Portfolio/public/art/";
// name → [ground, ink] as it will appear on the site
const SHOW = {
  apollo: ["#9a2a14", "#0b0907"], carceri: ["#0b0907", "#efe6d4"], "sant-angelo": ["#9a2a14", "#0b0907"],
  hercules: ["#0b0907", "#efe6d4"], amphora: ["#efe6d4", "#0b0907"],
  "bust-man": ["#9a2a14", "#efe6d4"], "bust-emperor": ["#9a2a14", "#efe6d4"], "bust-woman": ["#9a2a14", "#efe6d4"],
};
for (const [name, [bg, fg]] of Object.entries(SHOW)) {
  const mask = sharp(R + name + ".png");
  const { width, height } = await mask.metadata();
  const ink = await sharp({ create: { width, height, channels: 4, background: fg } })
    .composite([{ input: await mask.toBuffer(), blend: "dest-in" }]).png().toBuffer();
  await sharp({ create: { width, height, channels: 4, background: bg } })
    .composite([{ input: ink }]).resize({ width: 700 }).jpeg().toFile(`${out}/preview-${name}.jpg`);
}
```

Open each `preview-*.jpg` with the Read tool. What you should see:
- The ground (paper around the engravings, black behind the busts) is empty: no haze of stray dots.
- The subject has full tonal range.

If the ground is hazy, raise the black point for `light`, or lower the white point for `dark`, by 10–20 in `ART`. Then re-run Step 6. Each PNG must be ≤ 150 KB and all 8 together ≤ 900 KB.

- [ ] **Step 8: Write** `components/sections/art.tsx`

```tsx
import type { CSSProperties } from "react";

export type ArtName =
  | "apollo" | "carceri" | "sant-angelo" | "hercules" | "amphora"
  | "bust-man" | "bust-emperor" | "bust-woman";

// Decorative dithered engraving (public/art, CC0 — The Met). The PNG is an alpha mask inked in
// currentColor: colour it with text-*, fade with opacity-*, size/place with [mask-size:…]/[mask-position:…].
export default function Art({ name, className = "" }: { name: ArtName; className?: string }) {
  return <div aria-hidden className={`art ${className}`} style={{ "--art": `url(/art/${name}.png)` } as CSSProperties} />;
}
```

- [ ] **Step 9: Append to** `app/globals.css`

```css
/* Dithered engraving mask (components/sections/art.tsx). Layered so Tailwind utilities can override mask-size/position. */
@layer components {
  .art {
    pointer-events: none;
    background-color: currentColor;
    mask: var(--art) center / contain no-repeat;
  }
}
```

- [ ] **Step 10: Verify types and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 11: Commit**

```bash
git add lib/dither.ts lib/dither.test.ts scripts/fetch-art.mjs components/sections/art.tsx public/art app/globals.css
git commit -m "feat: dithered CC0 art pipeline and Art mask component"
```

---

### Task 2: Section rhythm and art placement

**Files:**
- Modify: `app/globals.css`, `components/sections/section-label.tsx`, `hero.tsx`, `engagement.tsx`, `approach.tsx`, `work.tsx`, `cases.tsx`, `record.tsx` (all in `components/sections/`)

**Interfaces:**
- Consumes: `Art` and `ArtName` from `components/sections/art.tsx` (Task 1). `.art` class.
- Produces: tokens `paper` and `ink` (`bg-paper`, `text-ink`, `border-ink/25` …). CSS classes `.hero-rays`, `.meander`, `.paper-grain`. `SectionLabel` becomes colour-agnostic, which Task 3 relies on.

- [ ] **Step 1: Tokens and utilities** in `app/globals.css`

In `@theme` add, after `--color-ember`:

```css
  --color-paper: #efe6d4;
  --color-ink: #0b0907;
```

Replace the `:focus-visible` rule with this, so the ring shows on paper as well as terracotta:

```css
:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
```

Delete the line `.faq summary::-webkit-details-marker { display: none; }`, since Task 3 removes the FAQ.

After the `::selection` rule add:

```css
.bg-paper ::selection { background: var(--color-ink); color: var(--color-paper); }
```

Append:

```css
/* Hero sunburst: fine rays fanning from behind the bust, faded out radially. Inked in currentColor. */
.hero-rays {
  pointer-events: none;
  background: repeating-conic-gradient(from 0deg at 72% 42%, currentColor 0deg 0.5deg, transparent 0.5deg 5deg);
  mask: radial-gradient(circle at 72% 42%, #000 0 8%, transparent 62%);
}

/* Greek key band: one 24px meander tile repeated along x, inked in currentColor. */
.meander {
  pointer-events: none;
  background-color: currentColor;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M0 22H22V2H4V18H18V6H8V14H14' fill='none' stroke='black' stroke-width='2' stroke-linecap='square'/%3E%3C/svg%3E") left center / 24px 24px repeat-x;
}

/* Paper tooth: a faint ink dot screen over bg-paper. */
.paper-grain {
  background-image: radial-gradient(color-mix(in srgb, var(--color-ink) 7%, transparent) 0.7px, transparent 1.1px);
  background-size: 5px 5px;
}
```

- [ ] **Step 2: `section-label.tsx`**: make it colour-agnostic

Replace `text-bone/85` on the `<p>` with `opacity-80`. Nothing else changes, so the label now inherits the section's text colour.

- [ ] **Step 3: `hero.tsx`** (terracotta, with art behind)

Replace the file's return with the following. The inner grid classes are the existing ones, minus `id`/`scroll-mt-4`, which move to the section. Buttons are unchanged.

```tsx
    <section id="hero" className="relative isolate scroll-mt-4 overflow-hidden">
      <div aria-hidden className="hero-rays absolute inset-0 -z-10 text-void opacity-25" />
      <Art name="apollo" className="absolute inset-y-0 left-[28%] -z-10 w-[60%] text-void opacity-30 [mask-position:center]" />
      <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-4 pb-24 pt-10 md:grid-cols-[1.1fr_0.9fr] md:items-center md:px-8 md:pt-16">
        {/* …existing left column and <CardArt art="bust" …/> exactly as before… */}
      </div>
    </section>
```

Add `import Art from "./art";`. Keep the existing inner children verbatim; the comment above is only a marker for where they go. On mobile (`<md`), give the Apollo layer `max-md:left-0 max-md:w-full` so it sits behind the stacked text.

- [ ] **Step 4: `engagement.tsx`** (terracotta, meander seam)

Wrap it: the outer `<section id="engagement" className="relative">` holds an inner `<div className="mx-auto w-full max-w-[1280px] px-4 py-24 md:px-8">` containing everything that's there now. After the inner div, add:

```tsx
      <div aria-hidden className="meander h-6 text-bone/50" />
```

- [ ] **Step 5: `approach.tsx`** (paper)

```tsx
    <section id="approach" className="paper-grain bg-paper text-ink">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-24 md:px-8">
        {/* existing SectionLabel + <ul> */}
      </div>
    </section>
```

Inside, swap `border-bone/40` → `border-ink` on the CardArt slot, `text-bone/85` → `text-ink/70` and `text-bone/90` → `text-ink/85`. The black `art-slot` cards stay as they are; they're the contrast on paper.

- [ ] **Step 6: `work.tsx`** (void, Carceri behind)

```tsx
    <section id="work" className="relative isolate overflow-hidden bg-void text-bone">
      <Art name="carceri" className="absolute inset-0 -z-10 text-bone opacity-[0.14] [mask-size:cover]" />
      <div className="mx-auto w-full max-w-[1280px] px-4 py-24 md:px-8">
        {/* existing content */}
      </div>
    </section>
```

Inside, the agent cells change from `bg-field` to `bg-void` so the grid reads as opaque cards over the engraving. Platform cards keep `bg-void`. `text-ember` meta on void stays.

- [ ] **Step 7: `cases.tsx`** (paper, wide illustration band)

```tsx
    <section id="cases" className="bg-paper text-ink">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-24 md:px-8">
        <SectionLabel title={CASES.title}>{CASES.label}</SectionLabel>
        <p className="mt-6 max-w-[60ch] text-lg text-ink/85">{CASES.intro}</p>
        <div className="relative mt-12 aspect-[16/9] overflow-hidden bg-field md:aspect-[3/1]">
          <Art name="sant-angelo" className="absolute inset-0 text-void [mask-size:cover]" />
        </div>
        <ol className="grid gap-px border-x border-b border-ink/20 bg-ink/20 md:grid-cols-2 lg:grid-cols-4">
          {/* existing <li> items; each li: bg-field → bg-paper, text-bone/85 → text-ink/70, text-bone/90 → text-ink/85 */}
        </ol>
      </div>
    </section>
```

`CaseDialog` needs no changes: its trigger inherits `currentColor`, and the `<dialog>` sets its own void/bone.

- [ ] **Step 8: `record.tsx`** (paper, amphora ornament)

Outer `<section id="record" className="bg-paper text-ink">` with the usual inner container. Replace the lone `<SectionLabel …/>` with:

```tsx
        <div className="flex items-end justify-between gap-6">
          <SectionLabel title={RECORD.title}>{RECORD.label}</SectionLabel>
          <Art name="amphora" className="hidden h-44 w-36 shrink-0 text-ink md:block" />
        </div>
```

Swap `border-bone/30` → `border-ink/25`, `text-bone/85` → `text-ink/70` and `text-bone/90` → `text-ink/85`.

- [ ] **Step 9: Verify visually**

Take screenshots at 1280 px width with Orca. The page has an onboarding, so scroll to each section with `orca eval --expression "document.getElementById('approach').scrollIntoView()"`. Check:
- the art sits behind the text, never over it
- the hero headline stays fully legible over Apollo and the rays
- the meander is continuous, with no gaps between tiles
- the paper sections read as ink on paper
- the Work engraving is visible around the cards but faint

Then repeat hero and Work at 375 px (`orca eval --expression "…"` can't resize the viewport, so use a narrow Orca tab or the Playwright fallback with `browser_resize`, and name the reason). Tune opacities and positions only; don't change structure.

- [ ] **Step 10: Contrast check**

Run axe in the page:

```bash
orca eval --expression "(async()=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/axe-core@4/axe.min.js';document.head.append(s);await new Promise(r=>s.onload=r);const r=await axe.run(document,{runOnly:['color-contrast']});return JSON.stringify(r.violations.map(v=>v.nodes.map(n=>n.target)))})()" --json
```

Expected: `[]`. Fix any violation by raising the text opacity (e.g. `/70` → `/80`).

- [ ] **Step 11: Lint, types, commit**

```bash
npx tsc --noEmit && npm run lint
git add app/globals.css components/sections/section-label.tsx components/sections/hero.tsx components/sections/engagement.tsx components/sections/approach.tsx components/sections/work.tsx components/sections/cases.tsx components/sections/record.tsx
git commit -m "feat: terracotta/paper/void section rhythm with engraved art behind content"
```

---

### Task 3: Working together (replaces FAQ)

**Files:**
- Create: `components/sections/together.tsx`
- Modify: `lib/content.ts` (NAV links, replace `FAQ` export with `TOGETHER`), `app/page.tsx`
- Delete: `components/sections/faq.tsx`. (Do **not** touch `app/globals.css`. Task 2 owns it and removes the `.faq` rule.)

**Interfaces:**
- Consumes: `Art` (Task 1), `SectionLabel`, `CopyCommand`, `HERO.command`, `HERO.copyText`, `SITE`, `Link` from `lib/content.ts`.
- Produces: `TOGETHER` export; section `id="together"`; NAV link `{ label: "Hire", href: "#together" }`. Task 4's footer reads `NAV.links`.

- [ ] **Step 1: Content**: in `lib/content.ts` change the NAV FAQ entry to:

```ts
    { label: "Hire", href: "#together" },
```

Replace the entire `export const FAQ = { … };` block with:

```ts
export const TOGETHER = {
  label: "Working together",
  title: "Bring me in on the first call.",
  facts: [
    { k: "Role", v: SITE.role },
    { k: "Based", v: "Ankleshwar, India · IST (UTC+5:30)" },
    { k: "Works", v: "Remote, alongside your stakeholders" },
    { k: "First version", v: "A working POC within two weeks" },
    { k: "Domains", v: "Ten so far, from clinical to CAD" },
  ],
  actions: [
    { label: "Get in touch", href: `mailto:${SITE.email}` },
    { label: "Resume ↓", href: SITE.resume, external: true },
  ] as Link[],
};
```

- [ ] **Step 2: Component** `components/sections/together.tsx`

```tsx
import { HERO, TOGETHER } from "@/lib/content";
import Art from "./art";
import CopyCommand from "./copy-command";
import SectionLabel from "./section-label";

export default function Together() {
  return (
    <section id="together" className="relative isolate overflow-hidden bg-void text-bone">
      <div className="mx-auto grid w-full max-w-[1280px] gap-12 px-4 py-24 md:grid-cols-[0.9fr_1.1fr] md:items-center md:px-8">
        <Art name="hercules" className="aspect-[4/5] w-full text-bone opacity-70 max-md:max-h-[60svh]" />
        <div className="flex flex-col gap-10">
          <SectionLabel title={TOGETHER.title}>{TOGETHER.label}</SectionLabel>
          <dl className="border-b border-bone/30">
            {TOGETHER.facts.map((f) => (
              <div key={f.k} className="reveal grid gap-1 border-t border-bone/30 py-4 md:grid-cols-[160px_1fr] md:gap-6">
                <dt className="font-mono text-xs uppercase tracking-[0.16em] text-bone/75">{f.k}</dt>
                <dd className="text-lg">{f.v}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap gap-3">
            {TOGETHER.actions.map((a, i) => (
              <a
                key={a.href}
                href={a.href}
                {...(a.external ? { target: "_blank", rel: "noreferrer" } : {})}
                className={
                  i === 0
                    ? "bg-bone px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] text-void transition-transform active:scale-[0.97]"
                    : "border border-bone px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] transition-transform transition-colors duration-150 hover:bg-bone hover:text-void active:scale-[0.97]"
                }
              >
                {a.label}
              </a>
            ))}
          </div>
          <CopyCommand command={HERO.command} copyText={HERO.copyText} />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Page**: in `app/page.tsx`, replace `import Faq from "@/components/sections/faq";` with `import Together from "@/components/sections/together";` and `<Faq />` with `<Together />`. Then `git rm components/sections/faq.tsx`.

- [ ] **Step 4: Verify**

Run: `grep -rn "FAQ\|faq\|Faq" app components lib`
Expected: no matches.

Run: `npx tsc --noEmit && npm run lint`
Expected: clean.

Take an Orca screenshot of `#together` at 1280 px and at 375 px. Hercules should read clearly as bone line-work on void. The facts table should be aligned, and the nav should show `Hire`.

- [ ] **Step 5: Commit**

```bash
git add lib/content.ts app/page.tsx components/sections/together.tsx
git commit -m "feat: replace FAQ with a working-together band"
```

(`git rm` already staged the deletion.)

---

### Task 4: Illustrated footer

**Files:**
- Modify: `components/sections/footer.tsx`, `lib/content.ts` (**`FOOTER` block only**. Task 3 edits NAV/FAQ in the same file in parallel, so use the Edit tool scoped to the FOOTER block.)

**Interfaces:**
- Consumes: `Art` (Task 1), `NAV.links`, `SITE`, `Link`.
- Produces: nothing downstream.

- [ ] **Step 1: Content**: replace the `export const FOOTER = { … };` block with:

```ts
export const FOOTER = {
  wordmark: "Bhumil Modi",
  line: "Send word.",
  columns: [
    { title: "Contact", links: [{ label: SITE.email, href: `mailto:${SITE.email}` }] },
    { title: "Elsewhere", links: [{ label: "LinkedIn", href: SITE.linkedin, external: true }, { label: "GitHub", href: SITE.github, external: true }] },
    { title: "Site", links: NAV.links },
    { title: "Resume", links: [{ label: "Resume (PDF)", href: SITE.resume, external: true }] },
  ] as { title: string; links: Link[] }[],
  meta: [SITE.location, "Art: The Met, Open Access (CC0)", "© 2026"] as const,
};
```

- [ ] **Step 2: Component**: replace `components/sections/footer.tsx`

```tsx
import { FOOTER } from "@/lib/content";
import Art from "./art";

export default function Footer() {
  return (
    <footer className="sticky bottom-0 z-0 isolate flex h-dvh flex-col justify-between overflow-hidden bg-field px-4 pb-6 pt-24 text-bone md:px-8">
      {/* Collage: marble busts inked in bone, scrimmed to solid field at top (links) and bottom (meta). */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <Art name="bust-man" className="absolute bottom-0 left-[-6%] hidden h-[78%] w-[42%] opacity-55 [mask-position:bottom] md:block" />
        <Art name="bust-emperor" className="absolute bottom-[-4%] left-1/2 h-[92%] w-[90%] -translate-x-1/2 opacity-80 [mask-position:bottom] md:w-[40%]" />
        <Art name="bust-woman" className="absolute bottom-0 right-[-6%] hidden h-[72%] w-[38%] opacity-55 [mask-position:bottom] md:block" />
        <div className="absolute inset-0 bg-linear-to-b from-field from-20% via-field/20 via-55% to-field to-95%" />
      </div>

      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-10">
        <p className="font-serif text-3xl italic leading-[1.15] md:text-5xl">{FOOTER.line}</p>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {FOOTER.columns.map((c) => (
            <div key={c.title} className="flex flex-col gap-3">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-bone/75">{c.title}</p>
              <ul className="flex flex-col gap-2 font-mono text-sm uppercase tracking-[0.12em]">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} {...(l.external ? { target: "_blank", rel: "noreferrer" } : {})} className="break-all underline underline-offset-4 transition-colors duration-150 hover:no-underline active:scale-[0.97]">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1280px]">
        <p aria-hidden className="cap-trim select-none font-display text-[clamp(4rem,19vw,20rem)] uppercase leading-[0.8] text-transparent [-webkit-text-stroke:1.5px_var(--color-bone)]">
          {FOOTER.wordmark}
        </p>
        <div className="mt-6 flex flex-wrap justify-between gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-[0.14em] text-bone/80">
          {FOOTER.meta.map((m) => <span key={m}>{m}</span>)}
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean.

Scroll to the bottom with Orca (`window.scrollTo(0, document.body.scrollHeight)`) and take screenshots at 1280 px and 375 px. Check:
- the busts form a collage behind the outlined wordmark
- the link columns and meta row are fully legible on solid field
- nothing overlaps
- the footer still reveals from under `main`

Run the axe contrast snippet from Task 2 Step 10 while the page is scrolled to the footer. Expected: no footer violations.

- [ ] **Step 4: Commit**

```bash
git add components/sections/footer.tsx lib/content.ts
git commit -m "feat: illustrated footer with bust collage, ghost wordmark and link columns"
```

---

### Task 5: Final verification (main thread)

- [ ] `npm test && npx tsc --noEmit && npm run lint && npm run build`: all pass.
- [ ] `du -ch public/art/*.png | tail -1` ≤ 900K.
- [ ] Full-page screenshot contact sheet at 1280 px. It should show the rhythm terracotta → terracotta → paper → void → paper → paper → void → terracotta.
- [ ] axe `color-contrast` returns `[]` on the whole page.
- [ ] Read `git log -6 --format=%B` by eye: no co-author trailer, no AI attribution.
