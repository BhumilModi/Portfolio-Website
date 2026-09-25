# Mythic Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the old portfolio with a scroll-scrubbed 3D Greek-mythic onboarding followed by Hermes-style sections, plus a matching GitHub profile README.

**Architecture:** Next.js 16 App Router. One fixed, transparent, pointer-events-none R3F `<Canvas>` renders every 3D scene through drei `<View>`s that track DOM boxes (the onboarding stage, the hero art, the six Approach cards). A shared engraving `ShaderMaterial` gives every mesh the Nous-style line-hatched look. All text is server-rendered DOM, and all copy lives in `lib/content.ts`. Pure logic (the onboarding timeline and the two case demos) lives in `lib/` with `node --test` tests.

**Tech Stack:** Next.js 16.2.12, React 19.2.4, Tailwind CSS 4, three 0.186.1, @react-three/fiber 9.8.1, @react-three/drei 10.7.8, lenis 1.3.26, TypeScript 5, Node 24 (`node --test` with native type stripping).

**Spec:** `docs/superpowers/specs/2026-09-25-mythic-portfolio-design.md`. Read §3–§8 before starting any task.

## Global Constraints

- **Copy:** every visible string comes from `lib/content.ts` (Task 3). Don't invent or reword copy in components. No client, product or person names; no Linear IDs; no npm package names.
- **Palette tokens:** `--color-void #0b0907`, `--color-field #9a2a14`, `--color-bone #efe6d4`, `--color-ash #6b5f52`, `--color-ember #d0643b`.
- **Contrast:** text on `field` is `text-bone` or `text-bone/85` and never lower. Don't put `ember` or `ash` text on `field`. `ember` text is allowed on `void` only.
- **Fonts:** League Gothic (display), Newsreader (serif body), JetBrains Mono (meta). No Cinzel, no Inter.
- **Dependencies:** exact pins only. Allowed: `three@0.186.1`, `@react-three/fiber@9.8.1`, `@react-three/drei@10.7.8`, `lenis@1.3.26`, dev `@types/three@0.186.0`. Add nothing else. No gsap, no postprocessing, no shadcn components.
- **Next.js 16:** this is not the Next.js you know. Read the relevant guide in `node_modules/next/dist/docs/` before using an API. `next/dynamic` with `ssr: false` is allowed only inside a `"use client"` file.
- **WebGL:** exactly one `<Canvas>` in the app (`components/experience/stage.tsx`). Every 3D render is a drei `<View>`.
- **Reduced motion:** the onboarding is hidden, Lenis is off, and card art doesn't spin.
- **No WebGL:** the onboarding is hidden and art slots show the CSS halftone ground.
- **Lint and R3F:** mutating uniforms, refs or memoized three objects inside `useFrame` is the intended R3F pattern. If `react-hooks/immutability` (or a similar React Compiler rule) flags it, add a targeted `// eslint-disable-next-line <rule> -- per-frame three.js mutation, not React state` on that line. Never disable a rule file-wide.
- **Tests:** `npm test` runs `node --test` over `lib/**/*.test.ts`. Imports between `lib/` files use explicit `.ts` extensions; components import `@/lib/x` without an extension.
- **Gates for every task:** `npx tsc --noEmit`, `npm run lint`, `npm test` (from Task 2 on) and `npm run build` must all pass before the commit.
- **Git:** commit at the end of each task. NEVER `git push`. NEVER add `Co-Authored-By` or any AI or Claude attribution to commit messages.
- **Frontend skills (Tasks 5–10):** the implementer loads `emil-design-eng`, `impeccable:impeccable` and `taste-skill:taste-skill`, plus the TypeUI skills `dithered`, `immersive` and `storytelling`. The implementer may tune spacing, type sizes, easing and hover/press states within the tokens. The implementer may not change copy, section order, file names, exported interfaces or tokens.
- **shadcn MCP triggers:** use `mcp__shadcn__*` only when (1) adding a component the repo lacks, or (2) editing an existing shadcn component. This plan does neither, so don't use it.
- **Browser verification:** use the Orca CLI browser (`orca status`, `orca tab create`, `orca snapshot`, screenshots; load the `orca-cli` skill). Playwright MCP is a fallback only, and you must name the reason when you use it. Check 1440×900 and 390×844.
- **Budget:** about 40 turns per task. If you get close, stop and report partial results plus open questions.

## File Map

```
app/layout.tsx                         fonts, metadata, SmoothScroll mount            (T1)
app/page.tsx                           composes Stage + main sections + footer         (T1)
app/globals.css                        tokens + every shared CSS utility               (T1)
app/icon.svg                           BM monogram favicon                              (T10)
lib/timeline.ts (+ .test.ts)           onboarding beats, easing helpers                 (T2)
lib/scene.ts                           mutable scene state + initScene()                (T2)
lib/argus.ts (+ .test.ts)              case I demo logic                                (T2)
lib/daedalus.ts (+ .test.ts)           case III demo logic                              (T2)
lib/content.ts                         all copy + content types                          (T3)
scripts/fetch-models.mjs               Poly Haven CC0 → geometry-only meshopt GLB        (T4)
public/models/*.glb                    4 models                                          (T4)
components/experience/models.ts        useModelGeometry()                                (T4)
components/experience/engraving-material.ts   createEngravingMaterial()                  (T5)
components/experience/scene-boundary.tsx      error boundary for 3D subtrees             (T5)
components/experience/stage.tsx               the one Canvas + View.Port                 (T5)
components/experience/stage-loader.tsx        dynamic(ssr:false) wrapper                 (T1 stub → T5)
components/experience/card-art.tsx            <CardArt art=…/> View scenes                (T5)
components/experience/onboarding.tsx          400vh track + DOM beats                     (T1 stub → T6)
components/experience/onboarding-scene.tsx    particles, bust, rays, colonnade            (T6)
components/experience/smooth-scroll.tsx       Lenis                                       (T1 stub → T6)
components/sections/section-label.tsx         shared label + h2                           (T1)
components/sections/nav.tsx hero.tsx copy-command.tsx engagement.tsx approach.tsx      (T1 stubs → T7)
components/sections/cases.tsx case-dialog.tsx argus-demo.tsx daedalus-demo.tsx         (T1 stub → T8)
components/sections/work.tsx record.tsx faq.tsx footer.tsx                             (T1 stubs → T9)
github-profile/README.md, github-profile/assets/*.svg                                  (T11)
```

## Execution Order

- T1 runs first, alone.
- Then T2, T3, T4 and T11 run in parallel.
- Then T5, T8 and T9 run in parallel. T8 needs T2 and T3; T9 needs T3.
- Then T6 and T7 run in parallel. T6 needs T2–T5; T7 needs T3 and T5.
- T10 runs last.

The T1 stubs mean parallel tasks never edit the same file.

---

### Task 1: Teardown and foundation

**Files:**
- Delete: `components/os/`, `components/windows/`, `components/cases/`, `components/ui/`, `hooks/`, `lib/content.ts`, `lib/windows.ts`, `lib/geometry.ts`, `lib/geometry.test.ts`, `docs/superpowers/specs/2026-07-29-3d-boarding-design.md`, `docs/superpowers/plans/2026-07-29-3d-boarding.md`, `public/file.svg`, `public/vercel.svg`, `public/next.svg`, `public/globe.svg`, `public/window.svg`
- Move: `docs/Bhumil-Modi-Resume-FDE.pdf` → `public/Bhumil-Modi-Resume-FDE.pdf`
- Modify: `package.json` (deps), `app/layout.tsx`, `app/globals.css`, `app/page.tsx`
- Create: `components/sections/section-label.tsx`, stubs for `components/sections/{nav,hero,engagement,approach,work,cases,record,faq,footer}.tsx` and `components/experience/{stage-loader,onboarding,smooth-scroll}.tsx`

**Interfaces:**
- Produces:
  - `SectionLabel({ children: ReactNode; title?: string })`, the default export of `components/sections/section-label.tsx`.
  - Every stub is a default-export component with no props. Later tasks replace the stub bodies but keep the file name, the default export and the zero-prop signature.
  - CSS classes that later tasks rely on: `.cap-trim`, `.art-slot`, `.reveal`, `.case-dialog`, `.demo-btn`, `.stage-cell[data-state]`, `.slot-fact[data-in]`, `.faq`.

- [ ] **Step 1: Delete the old site and move the resume**

```bash
cd "/Users/bhumilmodi/Personal work/My Portfolio"
git rm -rq components/os components/windows components/cases components/ui hooks \
  lib/content.ts lib/windows.ts lib/geometry.ts lib/geometry.test.ts \
  docs/superpowers/specs/2026-07-29-3d-boarding-design.md docs/superpowers/plans/2026-07-29-3d-boarding.md \
  public/file.svg public/vercel.svg public/next.svg public/globe.svg public/window.svg
mv docs/Bhumil-Modi-Resume-FDE.pdf public/Bhumil-Modi-Resume-FDE.pdf
ls components lib public
```
Expected: `components` is empty or missing, `lib` contains only `utils.ts`, and `public` contains only `Bhumil-Modi-Resume-FDE.pdf`.

- [ ] **Step 2: Swap dependencies**

```bash
npm uninstall radix-ui class-variance-authority tw-animate-css
npm install --save-exact three@0.186.1 @react-three/fiber@9.8.1 @react-three/drei@10.7.8 lenis@1.3.26
npm install --save-exact -D @types/three@0.186.0
grep -E '"(three|@react-three/fiber|@react-three/drei|lenis|@types/three)"' package.json
ls node_modules/lenis/dist/lenis.css
```
Expected: five lines with bare versions (no `^`), and the lenis.css path exists.

- [ ] **Step 3: Write `app/globals.css`**

```css
@import "tailwindcss";

@theme {
  --color-void: #0b0907;
  --color-field: #9a2a14;
  --color-bone: #efe6d4;
  --color-ash: #6b5f52;
  --color-ember: #d0643b;
  --font-display: var(--font-league-gothic), "Arial Narrow", sans-serif;
  --font-serif: var(--font-newsreader), Georgia, serif;
  --font-mono: var(--font-jetbrains-mono), ui-monospace, monospace;
}

html { background: var(--color-field); color-scheme: dark; }
body {
  background: var(--color-field);
  color: var(--color-bone);
  font-family: var(--font-serif);
  -webkit-font-smoothing: antialiased;
}
::selection { background: var(--color-bone); color: var(--color-field); }
:focus-visible { outline: 2px solid var(--color-bone); outline-offset: 3px; }

.cap-trim { text-box: trim-both cap alphabetic; }

/* Engraved-panel ground: shows wherever the 3D doesn't cover, and alone when WebGL is absent. */
.art-slot {
  background-color: var(--color-void);
  background-image: radial-gradient(color-mix(in srgb, var(--color-bone) 28%, transparent) 0.8px, transparent 1.2px);
  background-size: 6px 6px;
}

/* Scroll-driven reveal: native, no JS. Without support the content is simply visible. */
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .reveal {
      animation: reveal linear both;
      animation-timeline: view();
      animation-range: entry 0% entry 60%;
    }
  }
}
@keyframes reveal { from { opacity: 0; transform: translateY(24px); } }

@media (prefers-reduced-motion: reduce) { #onboarding { display: none; } }
.no-webgl #onboarding { display: none; }

.case-dialog {
  margin: auto;
  width: min(1040px, calc(100vw - 32px));
  max-height: calc(100dvh - 32px);
  overflow: auto;
  padding: 0;
  background: var(--color-void);
  color: var(--color-bone);
  border: 1px solid color-mix(in srgb, var(--color-bone) 30%, transparent);
  transition: opacity 200ms ease-out, transform 200ms ease-out, display 200ms allow-discrete, overlay 200ms allow-discrete;
}
.case-dialog:not([open]) { opacity: 0; transform: translateY(12px); }
@starting-style { .case-dialog[open] { opacity: 0; transform: translateY(12px); } }
.case-dialog::backdrop { background: rgb(11 9 7 / 0.72); }

.demo-btn {
  border: 1px solid color-mix(in srgb, var(--color-bone) 45%, transparent);
  padding: 0.5rem 0.9rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  transition: background-color 150ms ease-out, color 150ms ease-out, transform 100ms ease-out;
}
.demo-btn:hover, .demo-btn[aria-pressed="true"] { background: var(--color-bone); color: var(--color-void); }
.demo-btn:active { transform: scale(0.97); }

.stage-cell { transition: background-color 200ms ease-out, color 200ms ease-out; }
.stage-cell[data-state="ok"] { background: var(--color-bone); color: var(--color-void); }
.stage-cell[data-state="fail"] { background: var(--color-ember); color: var(--color-void); }
.slot-fact { opacity: 0.25; transition: opacity 300ms ease-out; }
.slot-fact[data-in="true"] { opacity: 1; }

.faq summary::-webkit-details-marker { display: none; }
```

- [ ] **Step 4: Write `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { JetBrains_Mono, League_Gothic, Newsreader } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import SmoothScroll from "@/components/experience/smooth-scroll";

const display = League_Gothic({ variable: "--font-league-gothic", weight: "400", subsets: ["latin"], display: "swap" });
const serif = Newsreader({ variable: "--font-newsreader", style: ["normal", "italic"], subsets: ["latin"], display: "swap" });
const mono = JetBrains_Mono({ variable: "--font-jetbrains-mono", weight: ["400", "500"], subsets: ["latin", "greek"], display: "swap" });

const description =
  "Forward Deployed AI Engineer. I deploy agentic systems inside the customer — working POC in two weeks, live beta inside five months.";

export const metadata: Metadata = {
  metadataBase: new URL("https://bhumil-modi-portfolio.vercel.app"),
  title: "Bhumil Modi — Forward Deployed AI Engineer",
  description,
  openGraph: { title: "Bhumil Modi — Forward Deployed AI Engineer", description, type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${serif.variable} ${mono.variable}`}>
      <body>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
```

(Task 3 moves the site facts into `lib/content.ts`. `layout.tsx` keeps this literal because it has to render before content exists; Task 10 switches it to `SITE`.)

- [ ] **Step 5: Write `app/page.tsx`**

```tsx
import StageLoader from "@/components/experience/stage-loader";
import Onboarding from "@/components/experience/onboarding";
import Nav from "@/components/sections/nav";
import Hero from "@/components/sections/hero";
import Engagement from "@/components/sections/engagement";
import Approach from "@/components/sections/approach";
import Work from "@/components/sections/work";
import Cases from "@/components/sections/cases";
import Record from "@/components/sections/record";
import Faq from "@/components/sections/faq";
import Footer from "@/components/sections/footer";

export default function Page() {
  return (
    <>
      <StageLoader />
      <main className="relative z-10 bg-field">
        <Onboarding />
        <Nav />
        <Hero />
        <Engagement />
        <Approach />
        <Work />
        <Cases />
        <Record />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 6: Create `components/sections/section-label.tsx`**

```tsx
export default function SectionLabel({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-bone/85">
        <span aria-hidden className="inline-block size-2 bg-bone" />
        {children}
      </p>
      {title && (
        <h2 className="cap-trim font-display text-[clamp(3rem,7vw,6rem)] uppercase leading-[0.9]">{title}</h2>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Create the stubs**

Write each file with exactly this shape, replacing `<id>` with the file's section id and `<Name>` with its PascalCase name. The section files are `nav`, `hero`, `engagement`, `approach`, `work`, `cases`, `record`, `faq` and `footer`. For `nav` and `footer`, use `<header>` and `<footer>` instead of `<section>`.

```tsx
// components/sections/<id>.tsx — stub, replaced by a later task
export default function <Name>() {
  return <section id="<id>" />;
}
```

```tsx
// components/experience/onboarding.tsx — stub, replaced by Task 6
export default function Onboarding() {
  return <section id="onboarding" />;
}
```

```tsx
// components/experience/stage-loader.tsx — stub, replaced by Task 5
export default function StageLoader() {
  return null;
}
```

```tsx
// components/experience/smooth-scroll.tsx — stub, replaced by Task 6
export default function SmoothScroll() {
  return null;
}
```

- [ ] **Step 8: Run the gates**

```bash
npx tsc --noEmit && npm run lint && npm run build
```
Expected: all three pass. The build prints route `/` as static. Skip `npm test` for now, because no test files exist until Task 2.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: tear down old portfolio, add 3d deps, tokens and page skeleton"
```

---

### Task 2: Pure logic — timeline, scene state, Argus and Daedalus

**Files:**
- Create: `lib/timeline.ts`, `lib/timeline.test.ts`, `lib/scene.ts`, `lib/argus.ts`, `lib/argus.test.ts`, `lib/daedalus.ts`, `lib/daedalus.test.ts`

**Interfaces:**
- Produces (`lib/timeline.ts`): `BEATS`, `type BeatId = "void" | "coalesce" | "radiance" | "name" | "descent"`, `clamp01(x)`, `local(p, id): number`, `beatAt(p): { id: BeatId; local: number }`, `smoothstep(a, b, x)`, `easeOutCubic(t)`, `easeInOutCubic(t)`, `fadeInOut(t, edge = 0.25)`.
- Produces (`lib/scene.ts`): `scene: { progress: number; tier: "high" | "low"; reducedMotion: boolean }` and `initScene(): boolean`, which returns whether WebGL2 is available.
- Produces (`lib/argus.ts`):
  - `ARGUS_FACTS` (6 strings) and `ARGUS_SLOTS` (3 strings)
  - `type ArgusStage = "fact" | "plan" | "write" | "verify" | "repair" | "ship"`
  - `type ArgusStep = { stage: ArgusStage; log: string; ok: boolean }`
  - `partition(factCount, slotCount): number[][]`
  - `checkCoverage(factCount, draft): { missing: number[]; repeated: number[] }`
  - `runArgus(mode: "clean" | "drift"): ArgusStep[]`
- Produces (`lib/daedalus.ts`):
  - `type Edge = { id; x1; y1; x2; y2; measured: boolean }` and `PLAN_EDGES`
  - `type RenderMode = "geometry" | "model"` and `PROMPT_VERSION`
  - `contentKey(scan, mode): string` (8 hex characters)
  - `createRenderCache(): { render(scan, mode): { key: string; hit: boolean } }`

- [ ] **Step 1: Write the failing timeline test** — `lib/timeline.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { BEATS, beatAt, clamp01, easeInOutCubic, easeOutCubic, fadeInOut, local, smoothstep } from "./timeline.ts";

const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≉ ${b}`);

test("beats tile 0..1 with no gaps", () => {
  assert.equal(BEATS[0].start, 0);
  assert.equal(BEATS[BEATS.length - 1].end, 1);
  for (let i = 1; i < BEATS.length; i++) assert.equal(BEATS[i].start, BEATS[i - 1].end);
});

test("beatAt maps progress to a beat and its local progress", () => {
  assert.deepEqual(beatAt(0), { id: "void", local: 0 });
  assert.deepEqual(beatAt(0.1), { id: "coalesce", local: 0 });
  const mid = beatAt(0.45);
  assert.equal(mid.id, "radiance");
  near(mid.local, 0.5);
  assert.deepEqual(beatAt(1), { id: "descent", local: 1 });
  assert.deepEqual(beatAt(-3), { id: "void", local: 0 });
  assert.deepEqual(beatAt(9), { id: "descent", local: 1 });
});

test("local clamps outside its beat", () => {
  assert.equal(local(0, "descent"), 0);
  assert.equal(local(1, "void"), 1);
  near(local(0.225, "coalesce"), 0.5);
});

test("easing helpers hit their endpoints", () => {
  assert.equal(clamp01(-1), 0);
  assert.equal(clamp01(2), 1);
  assert.equal(smoothstep(0, 1, 0.5), 0.5);
  assert.equal(smoothstep(0.2, 0.4, 0.1), 0);
  assert.equal(smoothstep(0.2, 0.4, 0.9), 1);
  assert.equal(easeOutCubic(0), 0);
  assert.equal(easeOutCubic(1), 1);
  assert.equal(easeInOutCubic(0), 0);
  assert.equal(easeInOutCubic(0.5), 0.5);
  assert.equal(easeInOutCubic(1), 1);
});

test("fadeInOut ramps up, holds, ramps down", () => {
  assert.equal(fadeInOut(0), 0);
  near(fadeInOut(0.125), 0.5);
  assert.equal(fadeInOut(0.5), 1);
  assert.equal(fadeInOut(1), 0);
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test`
Expected: FAIL with `Cannot find module` pointing at `./timeline.ts`.

- [ ] **Step 3: Implement `lib/timeline.ts`**

```ts
// Onboarding beats. Progress ranges are starting points, tuned visually in Task 6.
export const BEATS = [
  { id: "void", start: 0, end: 0.1 },
  { id: "coalesce", start: 0.1, end: 0.35 },
  { id: "radiance", start: 0.35, end: 0.55 },
  { id: "name", start: 0.55, end: 0.75 },
  { id: "descent", start: 0.75, end: 1 },
] as const;

export type BeatId = (typeof BEATS)[number]["id"];

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export function local(p: number, id: BeatId): number {
  const beat = BEATS.find((b) => b.id === id)!;
  return clamp01((p - beat.start) / (beat.end - beat.start));
}

export function beatAt(p: number): { id: BeatId; local: number } {
  const q = clamp01(p);
  const beat = BEATS.find((b) => q < b.end) ?? BEATS[BEATS.length - 1];
  return { id: beat.id, local: local(q, beat.id) };
}

export function smoothstep(a: number, b: number, x: number): number {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);

export function easeInOutCubic(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/** 0 → 1 over the first `edge` of t, hold at 1, then 1 → 0 over the last `edge`. */
export const fadeInOut = (t: number, edge = 0.25) => clamp01(Math.min(t, 1 - t) / edge);
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test`
Expected: PASS, 5 tests.

- [ ] **Step 5: Write `lib/scene.ts`** (no test; it's browser-only glue)

```ts
// Mutable per-frame state. The onboarding scroll reader writes it; useFrame reads it.
// ponytail: a plain object, not a store — nothing re-renders from it, so nothing needs to subscribe.
export const scene = {
  progress: 0,
  tier: "high" as "high" | "low",
  reducedMotion: false,
};

/** Browser-only. Detects tier and motion preference, flags missing WebGL on <html>. */
export function initScene(): boolean {
  const matches = (q: string) => window.matchMedia(q).matches;
  scene.reducedMotion = matches("(prefers-reduced-motion: reduce)");
  scene.tier = matches("(max-width: 768px)") || (navigator.hardwareConcurrency ?? 8) <= 4 ? "low" : "high";
  const ok = Boolean(document.createElement("canvas").getContext("webgl2"));
  if (!ok) document.documentElement.classList.add("no-webgl");
  return ok;
}
```

- [ ] **Step 6: Write the failing Argus test** — `lib/argus.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { ARGUS_FACTS, ARGUS_SLOTS, checkCoverage, partition, runArgus } from "./argus.ts";

test("partition puts every fact in exactly one slot", () => {
  for (const [n, k] of [[6, 3], [7, 3], [1, 4], [10, 1]] as const) {
    const slots = partition(n, k);
    assert.equal(slots.length, k);
    const all = slots.flat().sort((a, b) => a - b);
    assert.deepEqual(all, Array.from({ length: n }, (_, i) => i));
  }
});

test("checkCoverage reports missing and repeated facts", () => {
  assert.deepEqual(checkCoverage(4, [0, 1, 2, 3]), { missing: [], repeated: [] });
  assert.deepEqual(checkCoverage(4, [0, 1, 1, 2]), { missing: [3], repeated: [1] });
});

test("clean run passes every gate and ships once", () => {
  const steps = runArgus("clean");
  assert.deepEqual(steps.map((s) => s.stage), ["fact", "plan", "write", "verify", "ship"]);
  assert.ok(steps.every((s) => s.ok));
});

test("drift run fails verify, repairs once, then ships", () => {
  const steps = runArgus("drift");
  assert.deepEqual(steps.map((s) => s.stage), ["fact", "plan", "write", "verify", "repair", "verify", "ship"]);
  assert.equal(steps[3].ok, false);
  assert.equal(steps.filter((s) => s.stage === "repair").length, 1);
  assert.equal(steps.filter((s) => s.stage === "ship").length, 1);
  assert.equal(steps[steps.length - 2].stage, "verify");
  assert.equal(steps[steps.length - 2].ok, true, "ship must follow a passing verify");
});

test("demo data is the size the UI expects", () => {
  assert.equal(ARGUS_FACTS.length, 6);
  assert.equal(ARGUS_SLOTS.length, 3);
});
```

- [ ] **Step 7: Run it and confirm it fails**

Run: `npm test`
Expected: FAIL, cannot find `./argus.ts`.

- [ ] **Step 8: Implement `lib/argus.ts`**

```ts
// Case I demo — illustration, not client data.
export const ARGUS_FACTS = [
  "Nothing to eat after midnight",
  "Bring your medication list",
  "Arrive 30 minutes early",
  "No driving for 24 hours",
  "Call if your fever passes 38 °C",
  "Resume your usual diet next morning",
] as const;

export const ARGUS_SLOTS = ["Day before", "Morning of", "After"] as const;

export type ArgusStage = "fact" | "plan" | "write" | "verify" | "repair" | "ship";
export type ArgusStep = { stage: ArgusStage; log: string; ok: boolean };

/** Round-robin: each fact index lands in exactly one slot. */
export function partition(factCount: number, slotCount: number): number[][] {
  const slots = Array.from({ length: slotCount }, () => [] as number[]);
  for (let i = 0; i < factCount; i++) slots[i % slotCount].push(i);
  return slots;
}

export function checkCoverage(factCount: number, draft: readonly number[]) {
  const seen = new Map<number, number>();
  for (const f of draft) seen.set(f, (seen.get(f) ?? 0) + 1);
  const missing: number[] = [];
  const repeated: number[] = [];
  for (let i = 0; i < factCount; i++) {
    const n = seen.get(i) ?? 0;
    if (n === 0) missing.push(i);
    if (n > 1) repeated.push(i);
  }
  return { missing, repeated };
}

const ids = (xs: number[]) => xs.map((i) => `#${i + 1}`).join(", ");

export function runArgus(mode: "clean" | "drift"): ArgusStep[] {
  const n = ARGUS_FACTS.length;
  const slots = partition(n, ARGUS_SLOTS.length);
  const planned = slots.flat();
  // drift: the writer drops one fact and repeats another
  const draft = mode === "clean" ? planned : [...planned.filter((f) => f !== 3), 1];

  const steps: ArgusStep[] = [
    { stage: "fact", log: `${n} facts extracted`, ok: true },
    { stage: "plan", log: `${n} facts → ${slots.length} slots, each used once`, ok: true },
    { stage: "write", log: `${draft.length} lines drafted`, ok: true },
  ];

  const first = checkCoverage(n, draft);
  if (first.missing.length || first.repeated.length) {
    steps.push({ stage: "verify", log: `coverage failed — missing ${ids(first.missing)}, repeated ${ids(first.repeated)}`, ok: false });
    steps.push({ stage: "repair", log: "one bounded repair against the plan", ok: true });
  }

  const final = checkCoverage(n, planned);
  steps.push({ stage: "verify", log: "coverage passed — every fact exactly once", ok: !final.missing.length && !final.repeated.length });
  steps.push({ stage: "ship", log: "shipped", ok: true });
  return steps;
}
```

- [ ] **Step 9: Run the tests and confirm they pass**

Run: `npm test`
Expected: PASS, 10 tests.

- [ ] **Step 10: Write the failing Daedalus test** — `lib/daedalus.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { PLAN_EDGES, contentKey, createRenderCache } from "./daedalus.ts";

test("plan has both measured and assumed edges", () => {
  assert.ok(PLAN_EDGES.some((e) => e.measured));
  assert.ok(PLAN_EDGES.some((e) => !e.measured));
  assert.equal(new Set(PLAN_EDGES.map((e) => e.id)).size, PLAN_EDGES.length);
});

test("contentKey is deterministic 8-hex and sensitive to scan and mode", () => {
  const k = contentKey("scan-1", "model");
  assert.match(k, /^[0-9a-f]{8}$/);
  assert.equal(contentKey("scan-1", "model"), k);
  assert.notEqual(contentKey("scan-2", "model"), k);
  assert.notEqual(contentKey("scan-1", "geometry"), k);
});

test("cache: first render misses, repeat hits, rescan misses", () => {
  const cache = createRenderCache();
  assert.equal(cache.render("scan-1", "model").hit, false);
  assert.equal(cache.render("scan-1", "model").hit, true);
  assert.equal(cache.render("scan-2", "model").hit, false);
});
```

- [ ] **Step 11: Run it and confirm it fails**

Run: `npm test`
Expected: FAIL, cannot find `./daedalus.ts`.

- [ ] **Step 12: Implement `lib/daedalus.ts`**

```ts
// Case III demo — illustration, not client data.
export type Edge = { id: string; x1: number; y1: number; x2: number; y2: number; measured: boolean };

/** An L-shaped kitchen in a 100 × 70 plan space. Solid = measured, dashed = assumed. */
export const PLAN_EDGES: readonly Edge[] = [
  { id: "north", x1: 5, y1: 5, x2: 95, y2: 5, measured: true },
  { id: "east", x1: 95, y1: 5, x2: 95, y2: 40, measured: true },
  { id: "east-return", x1: 95, y1: 40, x2: 60, y2: 40, measured: false },
  { id: "inner", x1: 60, y1: 40, x2: 60, y2: 65, measured: false },
  { id: "south", x1: 60, y1: 65, x2: 5, y2: 65, measured: true },
  { id: "west", x1: 5, y1: 65, x2: 5, y2: 5, measured: true },
  { id: "counter", x1: 15, y1: 12, x2: 80, y2: 12, measured: true },
  { id: "island", x1: 25, y1: 35, x2: 45, y2: 35, measured: false },
];

export type RenderMode = "geometry" | "model";
export const PROMPT_VERSION = "v3";

/** FNV-1a 32-bit. Stands in for the real content hash in this illustration. */
export function contentKey(scan: string, mode: RenderMode): string {
  const s = `${scan}|${mode}|${PROMPT_VERSION}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

export function createRenderCache() {
  const seen = new Set<string>();
  return {
    render(scan: string, mode: RenderMode) {
      const key = contentKey(scan, mode);
      const hit = seen.has(key);
      seen.add(key);
      return { key, hit };
    },
  };
}
```

- [ ] **Step 13: Run the gates**

```bash
npm test && npx tsc --noEmit && npm run lint && npm run build
```
Expected: 13 tests pass, and tsc, lint and build are clean.

- [ ] **Step 14: Commit**

```bash
git add lib
git commit -m "feat: onboarding timeline, scene state, and case demo logic"
```

---

### Task 3: Content module

**Files:**
- Create: `lib/content.ts`

**Interfaces:**
- Produces:
  - `SITE`, `ONBOARDING`, `NAV`, `HERO`, `ENGAGEMENT`, `APPROACH`, `WORK`, `CASES`, `RECORD`, `FAQ`, `FOOTER`
  - `type ArtId = "horse" | "orb" | "eye" | "vase" | "lion" | "bust"`
  - `type CaseItem = { numeral; figure; meta; title; situation; decision; result; demo?: "argus" | "daedalus" }`
  - `type Link = { label: string; href: string; external?: boolean }`
  - `type Platform = { name; meta; body; role; href?: string }`

- [ ] **Step 1: Write `lib/content.ts`**

The copy is transcribed from spec §4, apart from the section titles, which are new here. Don't edit wording.

```ts
// All site copy. Facts only — sources: resume, Linear, work repos (spec §4). No client names.

export type ArtId = "horse" | "orb" | "eye" | "vase" | "lion" | "bust";
export type Link = { label: string; href: string; external?: boolean };
export type Platform = { name: string; meta: string; body: string; role: string; href?: string };
export type CaseItem = {
  numeral: string;
  figure: string;
  meta: string;
  title: string;
  situation: string;
  decision: string;
  result: string;
  demo?: "argus" | "daedalus";
};

export const SITE = {
  name: "Bhumil Modi",
  role: "Forward Deployed AI Engineer",
  url: "https://bhumil-modi-portfolio.vercel.app",
  email: "bhumilmodi2002@gmail.com",
  location: "Ankleshwar, Gujarat, India",
  resume: "/Bhumil-Modi-Resume-FDE.pdf",
  linkedin: "https://www.linkedin.com/in/bhumil-modi-430148190",
  github: "https://github.com/BhumilModi",
  description:
    "Forward Deployed AI Engineer. I deploy agentic systems inside the customer — working POC in two weeks, live beta inside five months.",
};

export const ONBOARDING = {
  mark: "ΒΜ",
  whisperIn: "From the customer's first call —",
  name: "Bhumil Modi",
  role: "Forward Deployed AI Engineer",
  whisperOut: "— to agents in production.",
  skip: "Enter ↵",
};

export const NAV = {
  brand: "BM",
  links: [
    { label: "Approach", href: "#approach" },
    { label: "Work", href: "#work" },
    { label: "Cases", href: "#cases" },
    { label: "Record", href: "#record" },
    { label: "FAQ", href: "#faq" },
  ] as Link[],
  cta: { label: "Get in touch", href: `mailto:${SITE.email}` } as Link,
};

export const HERO = {
  eyebrow: "Forward Deployed AI Engineer · Agentic systems",
  title: "I deploy agentic systems inside the customer.",
  lede:
    "On the weekly call with your stakeholders, then building the agent pipelines, services and frontends myself — working POC in two weeks, live beta inside five months.",
  actions: [
    { label: "See the cases", href: "#cases" },
    { label: "Resume ↓", href: SITE.resume, external: true },
  ] as Link[],
  command: `mail ${SITE.email}`,
  copyText: SITE.email,
};

export const ENGAGEMENT = {
  label: "How an engagement runs",
  phases: [
    { name: "Embed", when: "Kickoff", body: "Weekly calls with the stakeholders and the product manager. Ambiguity becomes an agent design." },
    { name: "Prototype", when: "Week 2", body: "A working proof of concept on the customer's real inputs." },
    { name: "Build", when: "Month 2–2.5", body: "A functional application: the agent, its guardrails, the product around it." },
    { name: "Beta", when: "Month 4–5", body: "Live with users the customer chooses." },
  ],
  stats: [
    { value: "20+", label: "client products" },
    { value: "10+", label: "from empty repository to live beta" },
    { value: "10", label: "domains" },
    { value: "6", label: "products as project lead" },
    { value: "3,792", label: "commits since Feb 2025" },
  ],
};

export const APPROACH = {
  label: "Approach",
  title: "How the agent gets built",
  items: [
    { n: 1, label: "Embed", title: "Start on the call", body: "Requirements arrive ambiguous. I sit with the people who own the problem and turn it into an agent design.", art: "horse" },
    { n: 2, label: "Design", title: "Structure first, model second", body: "Planners, tools and staged pipelines give the agent a shape. The model works inside it, not instead of it.", art: "orb" },
    { n: 3, label: "Guard", title: "Gates before output", body: "Verification gates, bounded repair and fail-closed steps. A bad draft stops at the gate, not at the user.", art: "eye" },
    { n: 4, label: "Measure", title: "Evals, not vibes", body: "Deterministic checks plus model judges, run against fixed datasets, so a prompt change is measured rather than eyeballed.", art: "vase" },
    { n: 5, label: "Integrate", title: "Into their stack", body: "Auth, tenancy, provider abstraction, rate limits and concurrency — what an agent needs to survive a real customer.", art: "lion" },
    { n: 6, label: "Ship", title: "Past the demo", body: "Beta with real users, release pipelines, and an SDK so other teams can embed the agent.", art: "bust" },
  ] as { n: number; label: string; title: string; body: string; art: ArtId }[],
};

export const WORK = {
  label: "Work",
  title: "Agents in the field",
  intro: "A selection of what I've deployed. Clients stay unnamed.",
  agents: [
    { title: "Clinical content agent", body: "Turns protocol documents into patient-facing scripts, speech and video." },
    { title: "Listing-video planner", body: "Plans, narrates and renders property videos from listing photos." },
    { title: "Kitchen vision pipeline", body: "Reads photos of a room and draws plan, elevation and axonometric sheets." },
    { title: "Embeddable avatar assistant", body: "An AI video-avatar SDK other products drop into their app." },
    { title: "Sales-outreach agents", body: "Campaigns, lead handling and automated appointment setting." },
    { title: "Meeting intelligence", body: "Pre-call briefs and live-call analysis." },
    { title: "Grant discovery", body: "Search, match and apply." },
    { title: "Biopharma agent fleet", body: "Regulatory gap analysis ahead of a submission." },
  ],
  platformsLabel: "TheAgentic's own platforms",
  platforms: [
    { name: "CortexON", meta: "★ 450+ · open source", body: "Open-source generalised agent for everyday task automation.", role: "Frontend contributor", href: "https://github.com/TheAgenticAI/CortexON" },
    { name: "TheAgenticBench", meta: "★ 50+ · open source", body: "Open-source digital-worker framework for agent-driven research and process automation.", role: "Frontend contributor", href: "https://github.com/TheAgenticAI/TheAgenticBench" },
    { name: "TheAgentic Console", meta: "in-house", body: "Developer console for TheAgentic's AI infrastructure.", role: "Built the entire UI" },
  ] as Platform[],
};

export const CASES = {
  label: "Cases",
  title: "Four decisions",
  intro: "Four decisions from client work.",
  items: [
    {
      numeral: "I", figure: "Argus", meta: "clinical · content agent",
      title: "Coverage by construction",
      situation: "Generated content had to reach patients without a reviewer reading every word.",
      decision: "A fact → plan → write → verify pipeline. The planner guarantees each fact is used exactly once; a deterministic gate checks coverage; the model only judges faithfulness.",
      result: "Engineered to need no manual review.",
      demo: "argus",
    },
    {
      numeral: "II", figure: "Ariadne", meta: "generative video · planning agent",
      title: "Same brief, same cut",
      situation: "A model-written video plan could invent assets and quietly drop scenes.",
      decision: "A deterministic planner owns the plan; the model may only patch it, and invented references are rejected.",
      result: "The same brief now produces the same video.",
    },
    {
      numeral: "III", figure: "Daedalus", meta: "vision · drawing pipeline",
      title: "The pipeline I built, then retired",
      situation: "Turn photographs of a room into dimensioned drawing sheets.",
      decision: "I built a measured geometry pipeline — then, when image-model rendering beat it, replaced it with a model call per view behind a content-addressed cache.",
      result: "Keep what wins, even when you built the loser.",
      demo: "daedalus",
    },
    {
      numeral: "IV", figure: "Hermes", meta: "agent SDK · release",
      title: "An agent other teams can embed",
      situation: "An AI avatar assistant had to live inside other companies' products.",
      decision: "A framework-free SDK core with a React-free transport, shipped through a gated CI pipeline with dev and stable channels.",
      result: "v1.0 to public release.",
    },
  ] as CaseItem[],
};

export const RECORD = {
  label: "Record",
  title: "Record",
  roles: [
    { when: "May 2025 – now", where: "TheAgentic", role: "Forward Deployed AI Engineer", line: "20+ client products across ten domains; project lead on six." },
    { when: "Nov 2024 – May 2025", where: "TheAgentic", role: "Software Engineer", line: "Built the entire UI for TheAgentic Console; frontends across seven concurrent engagements." },
    { when: "Feb – Oct 2024", where: "ScaleGenAI", role: "Senior Software Engineer", line: "Sole owner of the flagship product's frontend architecture." },
    { when: "Oct 2023 – Jan 2024", where: "Tally Group", role: "Software Engineer", line: "Billing-simulation app for Australian utility clients." },
    { when: "Mar – Aug 2023", where: "SleevesUp", role: "Software Engineer Intern", line: "Full-stack on two products." },
    { when: "2019 – 2023", where: "Vellore Institute of Technology", role: "B.Tech CSE, AI & ML", line: "GPA 9.08 / 10" },
  ],
  toolkit: [
    { group: "Agentic", items: ["Workflow design", "LLM orchestration", "Provider abstraction", "Verification & repair loops", "Evals"] },
    { group: "Languages", items: ["Python", "TypeScript", "Go", "SQL"] },
    { group: "Backend", items: ["FastAPI", "Node.js"] },
    { group: "Frontend", items: ["React", "Next.js", "Tailwind CSS"] },
    { group: "Platform", items: ["PostgreSQL", "Redis", "Docker", "AWS", "Auth0"] },
  ],
};

export const FAQ = {
  label: "FAQ",
  title: "Questions",
  items: [
    { q: "What does a forward deployed engineer do?", a: "Sits with the customer. I'm on the weekly call with the stakeholders, then I build the agent and the product around it, from an empty repository to beta." },
    { q: "Where does the model go in your designs?", a: "Inside a structure. Planners, gates and deterministic checks carry what must be exact; the model does the part only a model can." },
    { q: "How do you know an agent works?", a: "Evals: deterministic checks plus model judges on fixed datasets, run whenever a prompt or model changes." },
    { q: "How fast is a first version?", a: "A working POC within two weeks; a functional application by month 2–2.5; a beta with users you choose by month 4–5." },
    { q: "Which domains?", a: "Ten, including clinical communications, insurance, generative media, CAD and manufacturing, sales, grants, equity research and biopharma." },
    { q: "Can I see the client work?", a: "The cases describe decisions, not clients. Names stay out." },
    { q: "Where are you based?", a: `Ankleshwar, Gujarat, India. Reach me at ${SITE.email}.` },
  ],
};

export const FOOTER = {
  wordmark: "Bhumil Modi",
  line: "Send word.",
  links: [
    { label: SITE.email, href: `mailto:${SITE.email}` },
    { label: "LinkedIn", href: SITE.linkedin, external: true },
    { label: "GitHub", href: SITE.github, external: true },
    { label: "Resume (PDF)", href: SITE.resume, external: true },
  ] as Link[],
  meta: [SITE.location, "© 2026"] as const,
};
```

- [ ] **Step 2: Run the gates**

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```
Expected: all pass. Nothing imports content yet.

- [ ] **Step 3: Commit**

```bash
git add lib/content.ts
git commit -m "feat: portfolio copy module"
```

---

### Task 4: Models pipeline

**Files:**
- Create: `scripts/fetch-models.mjs`, `public/models/{marble_bust_01,horse_head,lion_head,antique_ceramic_vase_01}.glb`, `components/experience/models.ts`

**Interfaces:**
- Produces:
  - `type ModelId = "bust" | "horse" | "lion" | "vase"`
  - `MODELS: Record<ModelId, { file: string; rotation: [number, number, number] }>`
  - `useModelGeometry(id: ModelId): THREE.BufferGeometry`. The result is Float32 position and normal only, centred, and scaled to a height of 2 (y from −1 to 1). Call it only inside a `<Canvas>`/`<View>` subtree under `<Suspense>`.

- [ ] **Step 1: Write `scripts/fetch-models.mjs`**

```js
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
```

- [ ] **Step 2: Run it and check the size budget**

```bash
node scripts/fetch-models.mjs
ls -la public/models && du -ch public/models/*.glb | tail -1
```
Expected: 4 `.glb` files. The total must be under 1.5 MB (spec §8; the bust alone was about 110 KB when this was prototyped). If the total is over budget, rerun the lion alone with `npx -y @gltf-transform/cli@4 simplify --ratio 0.5` before the meshopt step, and report back.

- [ ] **Step 3: Write `components/experience/models.ts`**

```ts
"use client";
import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export type ModelId = "bust" | "horse" | "lion" | "vase";

// rotation: per-model calibration knob (radians), applied after node transforms are baked in.
export const MODELS: Record<ModelId, { file: string; rotation: [number, number, number] }> = {
  bust: { file: "/models/marble_bust_01.glb", rotation: [0, 0, 0] },
  horse: { file: "/models/horse_head.glb", rotation: [0, 0, 0] },
  lion: { file: "/models/lion_head.glb", rotation: [0, 0, 0] },
  vase: { file: "/models/antique_ceramic_vase_01.glb", rotation: [0, 0, 0] },
};

// meshopt output is quantized (normalized ints) and may be interleaved; bake to plain Float32
// so node transforms and MeshSurfaceSampler work.
function toFloat(attr: THREE.BufferAttribute | THREE.InterleavedBufferAttribute): THREE.BufferAttribute {
  const out = new Float32Array(attr.count * attr.itemSize);
  for (let i = 0; i < attr.count; i++) {
    out[i * attr.itemSize] = attr.getX(i);
    if (attr.itemSize > 1) out[i * attr.itemSize + 1] = attr.getY(i);
    if (attr.itemSize > 2) out[i * attr.itemSize + 2] = attr.getZ(i);
  }
  return new THREE.BufferAttribute(out, attr.itemSize);
}

export function useModelGeometry(id: ModelId): THREE.BufferGeometry {
  const gltf = useGLTF(MODELS[id].file);
  return useMemo(() => {
    let mesh: THREE.Mesh | undefined;
    gltf.scene.traverse((o) => {
      if (!mesh && (o as THREE.Mesh).isMesh) mesh = o as THREE.Mesh;
    });
    if (!mesh) throw new Error(`model ${id} has no mesh`);
    mesh.updateWorldMatrix(true, false);

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", toFloat(mesh.geometry.getAttribute("position")));
    g.setAttribute("normal", toFloat(mesh.geometry.getAttribute("normal")));
    if (mesh.geometry.index) g.setIndex(mesh.geometry.index.clone());
    g.applyMatrix4(mesh.matrixWorld);

    const [rx, ry, rz] = MODELS[id].rotation;
    g.rotateX(rx).rotateY(ry).rotateZ(rz);
    g.computeBoundingBox();
    const box = g.boundingBox!;
    const centre = box.getCenter(new THREE.Vector3());
    g.translate(-centre.x, -centre.y, -centre.z);
    const s = 2 / (box.max.y - box.min.y);
    g.scale(s, s, s);
    g.computeBoundingSphere();
    return g;
  }, [gltf, id]);
}

if (typeof window !== "undefined") {
  for (const m of Object.values(MODELS)) useGLTF.preload(m.file);
}
```

If `getAttribute("normal")` is undefined for a model, replace that line with `g.computeVertexNormals()` after `setIndex`. Report which model needed this.

- [ ] **Step 4: Run the gates**

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```
Expected: all pass. Nothing renders models yet, so the visual check happens in Task 5.

- [ ] **Step 5: Commit**

```bash
git add scripts/fetch-models.mjs public/models components/experience/models.ts
git commit -m "feat: CC0 model pipeline and normalized geometry hook"
```

---

### Task 5: 3D core — engraving material, stage, card art

**Files:**
- Create: `components/experience/engraving-material.ts`, `components/experience/scene-boundary.tsx`, `components/experience/stage.tsx`, `components/experience/card-art.tsx`
- Modify: `components/experience/stage-loader.tsx` (replace stub)
- Temporarily modify, then revert: `components/sections/hero.tsx`

**Interfaces:**
- Consumes: `scene` and `initScene()` from `@/lib/scene` (T2); `ArtId` from `@/lib/content` (T3); `useModelGeometry` and `ModelId` from `./models` (T4).
- Produces:
  - `createEngravingMaterial(opts?: { spacing?: number; reveal?: number; opacity?: number }): THREE.ShaderMaterial`, with uniforms `uBone`, `uVoid`, `uLight`, `uSpacing`, `uReveal` (world-space y cut-off; fragments above it are discarded) and `uOpacity`.
  - `SceneBoundary({ fallback: ReactNode; children: ReactNode })`.
  - `CardArt({ art: ArtId; className?: string })`, a DOM-side component that renders an `aria-hidden` box with a drei `<View>` inside.
  - `StageLoader`, which mounts the single Canvas client-side only.

- [ ] **Step 1: Read the docs first**

Read `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md` (the `ssr: false` rules). Then read drei's `View` source: `node_modules/@react-three/drei/core/View.js`. Confirm that `<View>` rendered outside the Canvas outputs a tracking `<div>` and tunnels its children into `<View.Port />`, and note the props it forwards to the div.

- [ ] **Step 2: Write `components/experience/engraving-material.ts`**

```ts
import * as THREE from "three";

const vertexShader = /* glsl */ `
varying vec3 vNormal;
varying float vWorldY;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorldY = world.y;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

// Screen-space line hatching: brighter surfaces pick up more hatch layers, then solid highlights.
const fragmentShader = /* glsl */ `
uniform vec3 uBone;
uniform vec3 uVoid;
uniform vec3 uLight;
uniform float uSpacing;
uniform float uReveal;
uniform float uOpacity;
varying vec3 vNormal;
varying float vWorldY;

float lines(vec2 p, float angle, float spacing, float width) {
  vec2 n = vec2(-sin(angle), cos(angle));
  float d = abs(fract(dot(p, n) / spacing) - 0.5) * spacing;
  return 1.0 - smoothstep(width * 0.5 - 0.5, width * 0.5 + 0.5, d);
}

void main() {
  if (vWorldY > uReveal) discard;
  vec3 n = normalize(vNormal);
  float diffuse = max(dot(n, normalize(uLight)), 0.0);
  float rim = pow(1.0 - abs(n.z), 3.0);
  float l = clamp(diffuse * 0.85 + rim * 0.45, 0.0, 1.0);
  vec2 p = gl_FragCoord.xy;
  float ink = lines(p, 0.785, uSpacing, 0.8 + 2.2 * l) * step(0.1, l);
  ink = max(ink, lines(p, -0.785, uSpacing, 0.6 + 1.8 * l) * step(0.38, l));
  ink = max(ink, lines(p, 0.0, uSpacing * 0.7, 0.6 + 1.4 * l) * step(0.66, l));
  ink = max(ink, step(0.9, l));
  float scan = 0.86 + 0.14 * step(0.5, fract(p.y * 0.5));
  gl_FragColor = vec4(mix(uVoid, uBone, ink * scan), uOpacity);
  #include <colorspace_fragment>
}
`;

export type EngravingOptions = { spacing?: number; reveal?: number; opacity?: number };

// spacing is in device pixels — calibration knob for line density.
export function createEngravingMaterial({ spacing = 5, reveal = 100, opacity = 1 }: EngravingOptions = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uBone: { value: new THREE.Color("#efe6d4") },
      uVoid: { value: new THREE.Color("#0b0907") },
      uLight: { value: new THREE.Vector3(0.55, 0.65, 0.8) },
      uSpacing: { value: spacing },
      uReveal: { value: reveal },
      uOpacity: { value: opacity },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
  });
}
```

- [ ] **Step 3: Write `components/experience/scene-boundary.tsx`**

```tsx
"use client";
import { Component, type ReactNode } from "react";

// A model that fails to load must not take the whole canvas down (spec §8).
export default class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
```

- [ ] **Step 4: Write `components/experience/stage.tsx`**

```tsx
"use client";
import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { initScene, scene } from "@/lib/scene";

// Runs once, client-only (this module is loaded with ssr:false).
const WEBGL = initScene();

export default function Stage() {
  if (!WEBGL) return null;
  return (
    <Canvas
      flat
      gl={{ alpha: true, antialias: true }}
      dpr={[1, scene.tier === "low" ? 1.5 : 2]}
      style={{ position: "fixed", inset: 0, zIndex: 20, pointerEvents: "none" }}
    >
      <View.Port />
    </Canvas>
  );
}
```

- [ ] **Step 5: Replace `components/experience/stage-loader.tsx`**

```tsx
"use client";
import dynamic from "next/dynamic";

const Stage = dynamic(() => import("./stage"), { ssr: false });

export default function StageLoader() {
  return <Stage />;
}
```

- [ ] **Step 6: Write `components/experience/card-art.tsx`**

```tsx
"use client";
import { Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera, View } from "@react-three/drei";
import type * as THREE from "three";
import type { ArtId } from "@/lib/content";
import { scene } from "@/lib/scene";
import { createEngravingMaterial } from "./engraving-material";
import { useModelGeometry, type ModelId } from "./models";
import SceneBoundary from "./scene-boundary";

const MODEL_FOR: Partial<Record<ArtId, ModelId>> = { bust: "bust", horse: "horse", lion: "lion", vase: "vase" };

function Motion({ children, sway = false, speed = 0.18 }: { children: React.ReactNode; sway?: boolean; speed?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }, dt) => {
    if (!ref.current || scene.reducedMotion) return;
    if (sway) ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.5) * 0.4;
    else ref.current.rotation.y += dt * speed;
  });
  return <group ref={ref}>{children}</group>;
}

function ModelArt({ id }: { id: ModelId }) {
  const geometry = useModelGeometry(id);
  const material = useMemo(() => createEngravingMaterial(), []);
  return <mesh geometry={geometry} material={material} />;
}

function Orb() {
  const material = useMemo(() => createEngravingMaterial(), []);
  return (
    <group>
      <mesh material={material}>
        <sphereGeometry args={[0.75, 64, 64]} />
      </mesh>
      <mesh material={material} rotation={[1.2, 0, 0.3]}>
        <torusGeometry args={[1.1, 0.02, 12, 128]} />
      </mesh>
      <mesh material={material} rotation={[0.4, 0.9, 0]}>
        <torusGeometry args={[1.25, 0.015, 12, 128]} />
      </mesh>
    </group>
  );
}

function Eye() {
  const material = useMemo(() => createEngravingMaterial({ spacing: 4 }), []);
  return (
    <group>
      <mesh material={material}>
        <sphereGeometry args={[0.9, 64, 64]} />
      </mesh>
      <mesh material={material} position={[0, 0, 0.86]}>
        <torusGeometry args={[0.32, 0.05, 16, 64]} />
      </mesh>
      <mesh position={[0, 0, 0.88]}>
        <circleGeometry args={[0.2, 48]} />
        <meshBasicMaterial color="#0b0907" />
      </mesh>
    </group>
  );
}

function Art({ art }: { art: ArtId }) {
  const model = MODEL_FOR[art];
  if (model) return <Motion><ModelArt id={model} /></Motion>;
  if (art === "orb") return <Motion speed={0.3}><Orb /></Motion>;
  return <Motion sway><Eye /></Motion>;
}

export default function CardArt({ art, className }: { art: ArtId; className?: string }) {
  return (
    <div aria-hidden className={className}>
      <View className="size-full">
        <PerspectiveCamera makeDefault position={[0, 0, 4.4]} fov={32} />
        <SceneBoundary fallback={null}>
          <Suspense fallback={null}>
            <Art art={art} />
          </Suspense>
        </SceneBoundary>
      </View>
    </div>
  );
}
```

- [ ] **Step 7: Temporary visual check**

Temporarily replace the body of `components/sections/hero.tsx` so all six art pieces show up:

```tsx
import CardArt from "@/components/experience/card-art";
export default function Hero() {
  const arts = ["bust", "horse", "lion", "vase", "orb", "eye"] as const;
  return (
    <section id="hero" className="grid grid-cols-3 gap-4 p-8">
      {arts.map((a) => <CardArt key={a} art={a} className="art-slot aspect-square" />)}
    </section>
  );
}
```

Then run `npm run dev` and open `http://localhost:3000/#hero` in the Orca browser (`orca status`, then `orca tab create`, then take a screenshot).

Expected:
- all six panels show white line-hatched forms on black over the halftone ground
- the models sit upright and fill most of the panel
- they rotate slowly
- the eye sways
- there are no console errors

If a model is sideways, set its `MODELS[id].rotation` in `models.ts`; that's the calibration knob. If lines are too dense or too sparse, change `spacing`. Report the values you chose.

- [ ] **Step 8: Revert the temporary hero**

```bash
git checkout components/sections/hero.tsx
```

- [ ] **Step 9: Run the gates**

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```

- [ ] **Step 10: Commit**

```bash
git add components/experience
git commit -m "feat: single-canvas stage, engraving material, and card art views"
```

---

### Task 6: Onboarding experience

**Files:**
- Create: `components/experience/onboarding-scene.tsx`
- Modify (replace stubs): `components/experience/onboarding.tsx`, `components/experience/smooth-scroll.tsx`

**Interfaces:**
- Consumes:
  - `scene` from `@/lib/scene`
  - `local`, `smoothstep`, `easeOutCubic`, `easeInOutCubic`, `fadeInOut`, `clamp01` from `@/lib/timeline`
  - `ONBOARDING` from `@/lib/content`
  - `createEngravingMaterial` from `./engraving-material`
  - `useModelGeometry` from `./models`
  - `SceneBoundary` from `./scene-boundary`
- Produces:
  - `Onboarding`, which renders `section#onboarding`. It writes `scene.progress` in [0, 1] every frame.
  - `SmoothScroll`, which runs Lenis with anchors (disabled under reduced motion).
  - `OnboardingScene({ geometry })`, `BustOnboarding` and `FALLBACK_SPHERE`.

- [ ] **Step 1: Write `components/experience/onboarding-scene.tsx`**

```tsx
"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import { scene } from "@/lib/scene";
import { easeInOutCubic, easeOutCubic, local, smoothstep } from "@/lib/timeline";
import { createEngravingMaterial } from "./engraving-material";
import { useModelGeometry } from "./models";

export const FALLBACK_SPHERE = new THREE.SphereGeometry(1, 96, 64);

const particleVertex = /* glsl */ `
uniform float uMorph;
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
attribute vec3 aTarget;
attribute float aRand;
varying float vAlpha;
void main() {
  float t = clamp((uMorph - aRand * 0.35) / 0.65, 0.0, 1.0);
  t = t * t * (3.0 - 2.0 * t);
  vec3 drift = vec3(sin(uTime * 0.3 + aRand * 40.0), cos(uTime * 0.25 + aRand * 30.0), sin(uTime * 0.2 + aRand * 20.0)) * 0.15 * (1.0 - t);
  vec4 mv = modelViewMatrix * vec4(mix(position + drift, aTarget, t), 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * uPixelRatio / -mv.z;
  vAlpha = 0.35 + 0.65 * t;
}
`;

const particleFragment = /* glsl */ `
uniform vec3 uEmber;
uniform float uOpacity;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  if (dot(c, c) > 0.25) discard;
  gl_FragColor = vec4(uEmber, vAlpha * uOpacity);
  #include <colorspace_fragment>
}
`;

function buildParticles(geometry: THREE.BufferGeometry, count: number) {
  const sampler = new MeshSurfaceSampler(new THREE.Mesh(geometry)).build();
  const start = new Float32Array(count * 3);
  const target = new Float32Array(count * 3);
  const rand = new Float32Array(count);
  const v = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    sampler.sample(v);
    target.set([v.x, v.y, v.z], i * 3);
    const r = 3 + Math.random() * 4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    start.set([r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)], i * 3);
    rand[i] = Math.random();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(start, 3));
  g.setAttribute("aTarget", new THREE.BufferAttribute(target, 3));
  g.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uMorph: { value: 0 },
      uTime: { value: 0 },
      uSize: { value: 6 }, // calibration knob: particle size
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uEmber: { value: new THREE.Color("#d0643b") },
      uOpacity: { value: 1 },
    },
    vertexShader: particleVertex,
    fragmentShader: particleFragment,
    transparent: true,
    depthWrite: false,
  });
  const points = new THREE.Points(g, material);
  points.frustumCulled = false;
  return { points, material };
}

function buildRays(count = 260) {
  const pos = new Float32Array(count * 6);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.02;
    const r0 = 1.05 + Math.random() * 0.1;
    const r1 = r0 + 0.6 + Math.random() * 2.6;
    pos.set([Math.cos(a) * r0, Math.sin(a) * r0, 0, Math.cos(a) * r1, Math.sin(a) * r1, 0], i * 6);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const material = new THREE.LineBasicMaterial({ color: "#efe6d4", transparent: true, opacity: 0, depthWrite: false });
  return new THREE.LineSegments(g, material);
}

export function BustOnboarding() {
  return <OnboardingScene geometry={useModelGeometry("bust")} />;
}

export default function OnboardingScene({ geometry }: { geometry: THREE.BufferGeometry }) {
  const particles = useMemo(() => buildParticles(geometry, scene.tier === "low" ? 12000 : 30000), [geometry]);
  const rays = useMemo(() => buildRays(), []);
  const bust = useMemo(() => createEngravingMaterial({ reveal: -1.2 }), []);
  const columns = useMemo(() => createEngravingMaterial({ spacing: 6, opacity: 0 }), []);
  const root = useRef<THREE.Group>(null);
  const dir = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera, clock }) => {
    const p = scene.progress;
    const c = local(p, "coalesce");
    const r = local(p, "radiance");
    const d = local(p, "descent");
    const fade = 1 - smoothstep(0.55, 1, d); // the DOM field flood takes over at the end
    if (root.current) root.current.visible = fade > 0.001;

    const u = particles.material.uniforms;
    u.uMorph.value = c;
    u.uTime.value = clock.elapsedTime;
    u.uOpacity.value = (1 - 0.8 * smoothstep(0.7, 1, c)) * fade;

    bust.uniforms.uReveal.value = THREE.MathUtils.lerp(-1.2, 1.2, smoothstep(0.5, 1, c));
    bust.uniforms.uOpacity.value = fade;
    columns.uniforms.uOpacity.value = smoothstep(0, 0.3, d) * fade;

    const grow = easeOutCubic(r);
    rays.scale.setScalar(Math.max(grow, 0.001));
    (rays.material as THREE.LineBasicMaterial).opacity = 0.55 * grow * fade;

    const angle = (Math.PI / 2) * easeInOutCubic(r);
    const radius = THREE.MathUtils.lerp(THREE.MathUtils.lerp(6, 4.2, easeInOutCubic(c)), 14, easeInOutCubic(d));
    camera.position.set(Math.sin(angle) * radius, THREE.MathUtils.lerp(0, 2.2, easeInOutCubic(d)), Math.cos(angle) * radius);
    camera.lookAt(0, THREE.MathUtils.lerp(0, 0.6, d), 0);

    camera.getWorldDirection(dir);
    rays.position.copy(dir).multiplyScalar(0.9); // just behind the head, always facing the camera
    rays.quaternion.copy(camera.quaternion);
  });

  return (
    <group ref={root}>
      <primitive object={particles.points} />
      <primitive object={rays} />
      <mesh geometry={geometry} material={bust} />
      {Array.from({ length: 7 }, (_, i) =>
        [-2.4, 2.4].map((z) => (
          <mesh key={`${i}:${z}`} position={[2.6 + i * 2.2, 0, z]} material={columns}>
            <cylinderGeometry args={[0.28, 0.32, 5, 24]} />
          </mesh>
        )),
      )}
    </group>
  );
}
```

- [ ] **Step 2: Replace `components/experience/onboarding.tsx`**

```tsx
"use client";
import { Suspense, useEffect, useRef } from "react";
import { PerspectiveCamera, View, useProgress } from "@react-three/drei";
import { ONBOARDING } from "@/lib/content";
import { scene } from "@/lib/scene";
import { clamp01, fadeInOut, local, smoothstep } from "@/lib/timeline";
import OnboardingScene, { BustOnboarding, FALLBACK_SPHERE } from "./onboarding-scene";
import SceneBoundary from "./scene-boundary";

export default function Onboarding() {
  const track = useRef<HTMLElement>(null);
  const loaded = Math.round(useProgress((s) => s.progress));

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let raf = 0;
    const set = (k: string, v: number) => el.style.setProperty(k, v.toFixed(3));
    const tick = () => {
      const rect = el.getBoundingClientRect();
      const p = clamp01(-rect.top / Math.max(1, rect.height - window.innerHeight));
      scene.progress = p;
      set("--counter", 1 - smoothstep(0, 0.4, local(p, "coalesce")));
      set("--whisper-in", fadeInOut(local(p, "radiance")));
      set("--name", smoothstep(0, 0.5, local(p, "name")) * (1 - smoothstep(0.2, 0.6, local(p, "descent"))));
      set("--whisper-out", fadeInOut(local(p, "descent")));
      set("--flood", smoothstep(0.55, 1, local(p, "descent")));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && document.activeElement === document.body && scene.progress < 1) {
        el.querySelector<HTMLAnchorElement>('a[href="#hero"]')?.click();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <section
      id="onboarding"
      ref={track}
      aria-label="Introduction"
      className="relative h-[400vh] bg-void text-bone"
      style={{ "--counter": 1, "--whisper-in": 0, "--name": 0, "--whisper-out": 0, "--flood": 0 } as React.CSSProperties}
    >
      <div className="sticky top-0 h-dvh overflow-hidden">
        <div aria-hidden className="absolute inset-0">
          <View className="size-full">
            <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={35} />
            <SceneBoundary fallback={<OnboardingScene geometry={FALLBACK_SPHERE} />}>
              <Suspense fallback={null}>
                <BustOnboarding />
              </Suspense>
            </SceneBoundary>
          </View>
        </div>

        <p className="absolute left-4 top-4 font-mono text-xs uppercase tracking-[0.2em] md:left-8 md:top-8" style={{ opacity: "var(--counter)" }}>
          {ONBOARDING.mark} · {String(loaded).padStart(3, "0")}%
        </p>
        <p className="absolute inset-x-4 top-[18%] text-center font-serif text-2xl italic md:text-4xl" style={{ opacity: "var(--whisper-in)" }}>
          {ONBOARDING.whisperIn}
        </p>
        <div className="absolute inset-x-0 bottom-[12%] flex flex-col items-center gap-3 px-4 text-center">
          <p
            className="cap-trim font-display text-[clamp(4rem,14vw,13rem)] uppercase leading-[0.85]"
            style={{ clipPath: "inset(0 calc((1 - var(--name)) * 100%) 0 0)" }}
          >
            {ONBOARDING.name}
          </p>
          <p className="font-mono text-xs uppercase tracking-[0.24em]" style={{ opacity: "var(--name)" }}>
            {ONBOARDING.role}
          </p>
        </div>
        <p className="absolute inset-x-4 top-[18%] text-center font-serif text-2xl italic md:text-4xl" style={{ opacity: "var(--whisper-out)" }}>
          {ONBOARDING.whisperOut}
        </p>
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-field" style={{ opacity: "var(--flood)" }} />
        <a href="#hero" className="absolute bottom-4 right-4 font-mono text-xs uppercase tracking-[0.2em] text-bone/85 hover:text-bone md:bottom-8 md:right-8">
          {ONBOARDING.skip}
        </a>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Replace `components/experience/smooth-scroll.tsx`**

```tsx
"use client";
import { useEffect } from "react";
import Lenis from "lenis";

export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ autoRaf: true, anchors: true });
    return () => lenis.destroy();
  }, []);
  return null;
}
```

- [ ] **Step 4: Visual check in the browser**

Run `npm run dev` and use Orca at 1440×900. Scroll slowly through the onboarding and take a screenshot at progress ≈ 0.05, 0.3, 0.45, 0.65 and 0.9. To jump to a given progress, run `window.scrollTo(0, p * (4 * innerHeight - innerHeight))` via Orca eval, or scroll by hand.

Expected at each point:
- 0.05: ember particles drift on black, and the counter reads `ΒΜ · 100%`.
- 0.3: particles have converged on a bust, with the white hatching sweeping up from the base.
- 0.45: rays burst behind the head, the camera is orbiting, and "From the customer's first call —" is visible.
- 0.65: side profile, with BHUMIL MODI wiping in from the left and the role line under it.
- 0.9: the camera pulls back between the columns, "— to agents in production." shows, and the field colour floods in.
- The seam into the hero section has no hard cut.
- "Enter ↵" (clicking it, or pressing Enter) scrolls to the hero.

Tune the ranges in `lib/timeline.ts` `BEATS` and the constants in `onboarding-scene.tsx` until the beats read clearly. The timeline tests must still pass: they check that the beats tile [0, 1] and they pin `beatAt(0.45)` to radiance. If you move that boundary, update the test value to match and say so in your report.

Check it again at 390×844. Then emulate `prefers-reduced-motion: reduce` (chrome-devtools `emulate`) and confirm that the page starts at the nav and hero and the onboarding is gone.

- [ ] **Step 5: Run the gates**

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add components/experience lib/timeline.ts lib/timeline.test.ts
git commit -m "feat: scroll-scrubbed 3D onboarding with engraved bust, rays and colonnade"
```

---

### Task 7: Sections A — nav, hero, engagement, approach

**Files:**
- Modify (replace stubs): `components/sections/nav.tsx`, `components/sections/hero.tsx`, `components/sections/engagement.tsx`, `components/sections/approach.tsx`
- Create: `components/sections/copy-command.tsx`

**Interfaces:**
- Consumes: `NAV`, `HERO`, `ENGAGEMENT` and `APPROACH` from `@/lib/content`; `CardArt` from `@/components/experience/card-art`; `SectionLabel` from `./section-label`.
- Produces: `CopyCommand({ command: string; copyText: string })`.

- [ ] **Step 1: Replace `components/sections/nav.tsx`**

```tsx
import { NAV } from "@/lib/content";

export default function Nav() {
  return (
    <header className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-4 py-4 md:grid md:grid-cols-[1fr_auto_1fr] md:px-8">
      <a href="#hero" className="font-display text-3xl leading-none tracking-wide">{NAV.brand}</a>
      <nav aria-label="Sections" className="hidden gap-6 font-mono text-xs uppercase tracking-[0.16em] md:flex">
        {NAV.links.map((l) => (
          <a key={l.href} href={l.href} className="text-bone/85 transition-colors hover:text-bone">{l.label}</a>
        ))}
      </nav>
      <a href={NAV.cta.href} className="justify-self-end border border-bone px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] transition-colors hover:bg-bone hover:text-field">
        {NAV.cta.label}
      </a>
    </header>
  );
}
```

- [ ] **Step 2: Create `components/sections/copy-command.tsx`**

```tsx
"use client";
import { useState } from "react";

export default function CopyCommand({ command, copyText }: { command: string; copyText: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard blocked: the command stays selectable
    }
  }
  return (
    <div className="flex max-w-xl items-center justify-between gap-4 border border-bone/40 bg-void px-4 py-3 font-mono text-sm">
      <code className="truncate select-all"><span className="text-ember">$</span> {command}</code>
      <button type="button" onClick={copy} aria-live="polite" className="shrink-0 text-xs uppercase tracking-[0.16em] text-bone/85 hover:text-bone">
        {copied ? "copied" : "copy"}
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Replace `components/sections/hero.tsx`**

```tsx
import { HERO } from "@/lib/content";
import CardArt from "@/components/experience/card-art";
import CopyCommand from "./copy-command";

export default function Hero() {
  return (
    <section id="hero" className="mx-auto grid w-full max-w-[1280px] scroll-mt-4 gap-10 px-4 pb-24 pt-10 md:grid-cols-[1.1fr_0.9fr] md:items-center md:px-8 md:pt-16">
      <div className="flex flex-col gap-8">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-bone/85">{HERO.eyebrow}</p>
        <h1 className="cap-trim font-display text-[clamp(3.5rem,9vw,8.5rem)] uppercase leading-[0.9]">{HERO.title}</h1>
        <p className="max-w-[46ch] text-lg leading-relaxed text-bone/90 md:text-xl">{HERO.lede}</p>
        <div className="flex flex-wrap gap-3">
          {HERO.actions.map((a, i) => (
            <a
              key={a.href}
              href={a.href}
              {...(a.external ? { target: "_blank", rel: "noreferrer" } : {})}
              className={
                i === 0
                  ? "bg-bone px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] text-field transition-transform active:scale-[0.97]"
                  : "border border-bone px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] transition-colors hover:bg-bone hover:text-field active:scale-[0.97]"
              }
            >
              {a.label}
            </a>
          ))}
        </div>
        <CopyCommand command={HERO.command} copyText={HERO.copyText} />
      </div>
      <CardArt art="bust" className="art-slot aspect-[4/5] w-full" />
    </section>
  );
}
```

- [ ] **Step 4: Replace `components/sections/engagement.tsx`**

```tsx
import { ENGAGEMENT } from "@/lib/content";
import SectionLabel from "./section-label";

export default function Engagement() {
  return (
    <section id="engagement" className="mx-auto w-full max-w-[1280px] px-4 py-24 md:px-8">
      <SectionLabel>{ENGAGEMENT.label}</SectionLabel>
      <ol className="mt-10 grid gap-px bg-bone/25 md:grid-cols-4">
        {ENGAGEMENT.phases.map((p, i) => (
          <li key={p.name} className="reveal flex flex-col gap-4 bg-field p-6">
            <span className="font-mono text-xs uppercase tracking-[0.16em] text-bone/85">
              {String(i + 1).padStart(2, "0")} · {p.when}
            </span>
            <h3 className="cap-trim font-display text-5xl uppercase">{p.name}</h3>
            <p className="text-bone/90">{p.body}</p>
          </li>
        ))}
      </ol>
      <dl className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-5">
        {ENGAGEMENT.stats.map((s) => (
          <div key={s.label} className="reveal flex flex-col-reverse gap-2 border-t border-bone/40 pt-4">
            <dt className="font-mono text-xs uppercase tracking-[0.12em] text-bone/85">{s.label}</dt>
            <dd className="font-display text-6xl leading-none">{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
```

- [ ] **Step 5: Replace `components/sections/approach.tsx`**

```tsx
import { APPROACH } from "@/lib/content";
import CardArt from "@/components/experience/card-art";
import SectionLabel from "./section-label";

export default function Approach() {
  return (
    <section id="approach" className="mx-auto w-full max-w-[1280px] px-4 py-24 md:px-8">
      <SectionLabel title={APPROACH.title}>{APPROACH.label}</SectionLabel>
      <ul className="mt-12 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {APPROACH.items.map((item) => (
          <li key={item.n} className="reveal flex flex-col gap-5">
            <CardArt art={item.art} className="art-slot aspect-[4/3] w-full" />
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-bone/85">#{item.n} {item.label}</p>
            <h3 className="cap-trim font-display text-4xl uppercase">{item.title}</h3>
            <p className="text-bone/90">{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 6: Visual check in the browser**

Using Orca at 1440×900 and 390×844, open `http://localhost:3000/#hero`. Expected:
- The nav row sits above the hero.
- The hero headline is large condensed uppercase with no overflow at 390px.
- The bust sits in the hero art slot.
- Copy writes the email to the clipboard, and the label flips to "copied".
- The four engagement phases are joined by a hairline grid, and the five stats show.
- The six approach cards each show their engraved art.
- Sections fade up on scroll (Chrome).
- There is no horizontal scroll at 390px.

- [ ] **Step 7: Run the gates**

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```

- [ ] **Step 8: Commit**

```bash
git add components/sections
git commit -m "feat: nav, hero, engagement and approach sections"
```

---

### Task 8: Cases, dialog and the two demos

**Files:**
- Modify (replace stub): `components/sections/cases.tsx`
- Create: `components/sections/case-dialog.tsx`, `components/sections/argus-demo.tsx`, `components/sections/daedalus-demo.tsx`

**Interfaces:**
- Consumes:
  - `CASES` and `type CaseItem` from `@/lib/content`
  - `ARGUS_FACTS`, `ARGUS_SLOTS`, `partition`, `runArgus` and `type ArgusStep` from `@/lib/argus`
  - `PLAN_EDGES`, `createRenderCache` and `type RenderMode` from `@/lib/daedalus`
  - `SectionLabel`
- Produces: `CaseDialog({ item: CaseItem })`, `ArgusDemo()`, `DaedalusDemo()`.

- [ ] **Step 1: Replace `components/sections/cases.tsx`**

```tsx
import { CASES } from "@/lib/content";
import CaseDialog from "./case-dialog";
import SectionLabel from "./section-label";

export default function Cases() {
  return (
    <section id="cases" className="mx-auto w-full max-w-[1280px] px-4 py-24 md:px-8">
      <SectionLabel title={CASES.title}>{CASES.label}</SectionLabel>
      <p className="mt-6 max-w-[60ch] text-lg text-bone/90">{CASES.intro}</p>
      <ol className="mt-12 grid gap-px bg-bone/25 md:grid-cols-2 lg:grid-cols-4">
        {CASES.items.map((c) => (
          <li key={c.numeral} className="reveal flex flex-col gap-5 bg-field p-6">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-7xl leading-none">{c.numeral}</span>
              <span className="font-mono text-xs uppercase tracking-[0.16em] text-bone/85">{c.figure}</span>
            </div>
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-bone/85">{c.meta}</p>
            <h3 className="cap-trim font-display text-4xl uppercase leading-[0.95]">{c.title}</h3>
            <p className="text-bone/90">{c.situation}</p>
            <div className="mt-auto pt-4">
              <CaseDialog item={c} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
```

- [ ] **Step 2: Create `components/sections/case-dialog.tsx`**

```tsx
"use client";
import { useRef } from "react";
import type { CaseItem } from "@/lib/content";
import ArgusDemo from "./argus-demo";
import DaedalusDemo from "./daedalus-demo";

export default function CaseDialog({ item }: { item: CaseItem }) {
  const ref = useRef<HTMLDialogElement>(null);
  const headingId = `case-${item.numeral}`;
  const rows = [
    ["Situation", item.situation],
    ["Decision", item.decision],
    ["Result", item.result],
  ] as const;
  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className="font-mono text-xs uppercase tracking-[0.16em] underline underline-offset-4 hover:no-underline">
        Open case {item.numeral} →
      </button>
      <dialog
        ref={ref}
        aria-labelledby={headingId}
        className="case-dialog"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close(); // backdrop click
        }}
      >
        <div className="flex flex-col gap-6 p-6 md:p-10">
          <div className="flex items-start justify-between gap-6">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-bone/85">
              Case {item.numeral} · {item.figure} · {item.meta}
            </p>
            <button type="button" onClick={() => ref.current?.close()} className="font-mono text-xs uppercase tracking-[0.16em]">
              Close ✕
            </button>
          </div>
          <h3 id={headingId} className="cap-trim font-display text-5xl uppercase md:text-6xl">{item.title}</h3>
          <dl className="grid gap-6 md:grid-cols-3">
            {rows.map(([k, v]) => (
              <div key={k} className="flex flex-col gap-2">
                <dt className="font-mono text-xs uppercase tracking-[0.16em] text-ember">{k}</dt>
                <dd className="text-bone/90">{v}</dd>
              </div>
            ))}
          </dl>
          {item.demo === "argus" && <ArgusDemo />}
          {item.demo === "daedalus" && <DaedalusDemo />}
        </div>
      </dialog>
    </>
  );
}
```

- [ ] **Step 3: Create `components/sections/argus-demo.tsx`**

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { ARGUS_FACTS, ARGUS_SLOTS, partition, runArgus, type ArgusStep } from "@/lib/argus";

const STAGES = ["fact", "plan", "write", "verify"] as const;
const SLOTS = partition(ARGUS_FACTS.length, ARGUS_SLOTS.length);

export default function ArgusDemo() {
  const [steps, setSteps] = useState<ArgusStep[]>([]);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function play(mode: "clean" | "drift") {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setSteps([]);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    runArgus(mode).forEach((s, i) => {
      timers.current.push(window.setTimeout(() => setSteps((prev) => [...prev, s]), reduce ? 0 : 450 * (i + 1)));
    });
  }

  const planned = steps.some((s) => s.stage === "plan");
  const shipped = steps.at(-1)?.stage === "ship";
  const caught = steps.some((s) => !s.ok);

  return (
    <div className="flex flex-col gap-5 border border-bone/30 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-bone/85">Run the pipeline · illustration — not client data</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => play("clean")} className="demo-btn">▶ clean</button>
          <button type="button" onClick={() => play("drift")} className="demo-btn">▶ drift</button>
        </div>
      </div>
      <ol className="grid grid-cols-4 gap-px bg-bone/25 font-mono text-xs uppercase tracking-[0.12em]">
        {STAGES.map((st) => {
          const last = steps.filter((s) => s.stage === st).at(-1);
          return (
            <li key={st} data-state={!last ? "idle" : last.ok ? "ok" : "fail"} className="stage-cell bg-void p-3 text-center">
              {st}
            </li>
          );
        })}
      </ol>
      <div className="grid gap-3 md:grid-cols-3">
        {ARGUS_SLOTS.map((name, si) => (
          <div key={name} className="flex flex-col gap-2 border border-bone/20 p-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-bone/85">{name}</p>
            <ul className="flex flex-col gap-1 text-sm">
              {SLOTS[si].map((f) => (
                <li key={f} data-in={planned} className="slot-fact">#{f + 1} {ARGUS_FACTS[f]}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <ol aria-live="polite" className="flex min-h-[8rem] flex-col gap-1 bg-void p-4 font-mono text-xs">
        {steps.length === 0 && <li className="text-bone/70">› idle — pick a run</li>}
        {steps.map((s, i) => (
          <li key={i} className={s.ok ? "text-bone" : "text-ember"}>
            {s.ok ? "›" : "✗"} {s.stage} — {s.log}
          </li>
        ))}
        {shipped && caught && <li className="text-bone">✓ the failing draft never shipped</li>}
      </ol>
    </div>
  );
}
```

- [ ] **Step 4: Create `components/sections/daedalus-demo.tsx`**

```tsx
"use client";
import { useMemo, useState } from "react";
import { PLAN_EDGES, createRenderCache, type RenderMode } from "@/lib/daedalus";

type Highlight = "all" | "measured" | "assumed";

export default function DaedalusDemo() {
  const cache = useMemo(() => createRenderCache(), []);
  const [highlight, setHighlight] = useState<Highlight>("all");
  const [mode, setMode] = useState<RenderMode>("geometry");
  const [scan, setScan] = useState(1);
  const [last, setLast] = useState<{ key: string; hit: boolean } | null>(null);

  const label = mode === "geometry" ? "geometry stack" : "image model";
  const message = !last
    ? `scan ${scan} · ${label}`
    : mode === "geometry"
      ? "measured from depth · recomputed every time"
      : last.hit
        ? `cache hit · key ${last.key}`
        : `rendered · cached as ${last.key}`;

  return (
    <div className="flex flex-col gap-5 border border-bone/30 p-5">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-bone/85">Draw a room · illustration — not client data</p>
      <svg viewBox="0 0 100 70" role="img" aria-label="Floor plan: solid edges are measured, dashed edges are assumed" className="w-full bg-void">
        {PLAN_EDGES.map((e) => {
          const dim = highlight !== "all" && (highlight === "measured") !== e.measured;
          return (
            <line
              key={e.id}
              x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
              stroke={mode === "model" ? "var(--color-ember)" : "var(--color-bone)"}
              strokeWidth={0.8}
              strokeDasharray={e.measured ? undefined : "2 1.5"}
              opacity={dim ? 0.15 : 1}
              className="transition-opacity duration-300"
            />
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-2">
        {(["all", "measured", "assumed"] as const).map((h) => (
          <button key={h} type="button" aria-pressed={highlight === h} onClick={() => setHighlight(h)} className="demo-btn">{h}</button>
        ))}
        <span aria-hidden className="mx-1 w-px bg-bone/30" />
        {(["geometry", "model"] as const).map((m) => (
          <button key={m} type="button" aria-pressed={mode === m} onClick={() => { setMode(m); setLast(null); }} className="demo-btn">
            {m === "geometry" ? "geometry stack" : "image model"}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setLast(mode === "model" ? cache.render(`scan-${scan}`, mode) : { key: "", hit: false })} className="demo-btn">▶ render</button>
        <button type="button" onClick={() => { setScan((s) => s + 1); setLast(null); }} className="demo-btn">↻ rescan</button>
        <p aria-live="polite" className="font-mono text-xs text-bone/85">{message}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Visual and behaviour check in the browser**

Using Orca at 1440×900 and 390×844, go to `#cases`. Expected:
- 4 columns (2 on tablet, 1 on phone).
- "Open case I →" opens the dialog with a fade and lift. Esc, the backdrop and "Close ✕" all close it, and focus returns to the button.
- Case I: `▶ clean` lights all four stages bone. `▶ drift` turns verify ember, logs the repair, then verify passes and "✓ the failing draft never shipped" appears.
- Case III: the measured/assumed toggles dim the other set. In `image model` mode, the first render logs "rendered · cached as …", the second "cache hit · key …", and after `↻ rescan` a new key.
- Cases II and IV open with text only.

- [ ] **Step 6: Run the gates**

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```

- [ ] **Step 7: Commit**

```bash
git add components/sections
git commit -m "feat: cases section with dialogs and Argus/Daedalus demos"
```

---

### Task 9: Sections B — work, record, FAQ, footer

**Files:**
- Modify (replace stubs): `components/sections/work.tsx`, `components/sections/record.tsx`, `components/sections/faq.tsx`, `components/sections/footer.tsx`

**Interfaces:**
- Consumes: `WORK`, `RECORD`, `FAQ` and `FOOTER` from `@/lib/content`; `SectionLabel`.
- Produces: nothing new.

- [ ] **Step 1: Replace `components/sections/work.tsx`**

```tsx
import { WORK } from "@/lib/content";
import SectionLabel from "./section-label";

export default function Work() {
  return (
    <section id="work" className="mx-auto w-full max-w-[1280px] px-4 py-24 md:px-8">
      <SectionLabel title={WORK.title}>{WORK.label}</SectionLabel>
      <p className="mt-6 max-w-[60ch] text-lg text-bone/90">{WORK.intro}</p>
      <ul className="mt-12 grid gap-px bg-bone/25 sm:grid-cols-2 lg:grid-cols-4">
        {WORK.agents.map((a, i) => (
          <li key={a.title} className="reveal flex flex-col gap-3 bg-field p-6">
            <span className="font-mono text-xs text-bone/85">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="font-display text-3xl uppercase leading-none">{a.title}</h3>
            <p className="text-sm text-bone/90">{a.body}</p>
          </li>
        ))}
      </ul>
      <h3 className="mt-20 font-mono text-xs uppercase tracking-[0.18em] text-bone/85">{WORK.platformsLabel}</h3>
      <ul className="mt-6 grid gap-6 md:grid-cols-3">
        {WORK.platforms.map((p) => (
          <li key={p.name} className="reveal flex flex-col gap-4 border border-bone/40 bg-void p-6">
            <div className="flex items-baseline justify-between gap-4">
              <h4 className="font-display text-4xl uppercase leading-none">{p.name}</h4>
              <span className="shrink-0 font-mono text-xs text-ember">{p.meta}</span>
            </div>
            <p className="text-bone/90">{p.body}</p>
            <p className="mt-auto font-mono text-xs uppercase tracking-[0.14em] text-bone/85">{p.role}</p>
            {p.href && (
              <a href={p.href} target="_blank" rel="noreferrer" className="font-mono text-xs uppercase tracking-[0.16em] underline underline-offset-4 hover:no-underline">
                View on GitHub ↗
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 2: Replace `components/sections/record.tsx`**

```tsx
import { RECORD } from "@/lib/content";
import SectionLabel from "./section-label";

export default function Record() {
  return (
    <section id="record" className="mx-auto w-full max-w-[1280px] px-4 py-24 md:px-8">
      <SectionLabel title={RECORD.title}>{RECORD.label}</SectionLabel>
      <ol className="mt-12 flex flex-col font-mono text-sm">
        {RECORD.roles.map((r) => (
          <li key={`${r.when}-${r.where}`} className="reveal grid gap-2 border-t border-bone/30 py-5 md:grid-cols-[180px_240px_1fr] md:gap-6">
            <span className="text-bone/85">{r.when}</span>
            <span>
              <span className="block uppercase tracking-[0.12em]">{r.where}</span>
              <span className="block text-bone/85">{r.role}</span>
            </span>
            <span className="font-serif text-base text-bone/90">{r.line}</span>
          </li>
        ))}
      </ol>
      <dl className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-5">
        {RECORD.toolkit.map((t) => (
          <div key={t.group} className="flex flex-col gap-3">
            <dt className="font-mono text-xs uppercase tracking-[0.16em]">{t.group}</dt>
            <dd>
              <ul className="flex flex-col gap-1 font-mono text-sm text-bone/85">
                {t.items.map((i) => <li key={i}>{i}</li>)}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
```

- [ ] **Step 3: Replace `components/sections/faq.tsx`**

```tsx
import { FAQ } from "@/lib/content";
import SectionLabel from "./section-label";

export default function Faq() {
  return (
    <section id="faq" className="mx-auto w-full max-w-[1280px] px-4 py-24 md:px-8">
      <SectionLabel title={FAQ.title}>{FAQ.label}</SectionLabel>
      <div className="mt-12 border-b border-bone/30">
        {FAQ.items.map((item) => (
          <details key={item.q} className="faq group border-t border-bone/30">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-xl underline decoration-bone/40 underline-offset-[6px] md:text-2xl">
              {item.q}
              <span aria-hidden className="font-mono text-base transition-transform duration-200 group-open:rotate-45">+</span>
            </summary>
            <p className="max-w-[70ch] pb-6 text-lg text-bone/90">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Replace `components/sections/footer.tsx`**

This uses sticky reveal. The footer sits after `<main>` in normal flow (so its tab order stays sane), is pinned to the bottom, and is revealed as `main` (z-10) scrolls off.

```tsx
import { FOOTER } from "@/lib/content";

export default function Footer() {
  return (
    <footer className="sticky bottom-0 z-0 flex h-dvh flex-col justify-between bg-void px-4 pb-6 pt-24 text-bone md:px-8">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-10">
        <p className="font-serif text-3xl italic md:text-5xl">{FOOTER.line}</p>
        <ul className="grid gap-4 font-mono text-sm uppercase tracking-[0.14em] md:grid-cols-4">
          {FOOTER.links.map((l) => (
            <li key={l.href}>
              <a href={l.href} {...(l.external ? { target: "_blank", rel: "noreferrer" } : {})} className="underline underline-offset-4 hover:no-underline">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="mx-auto w-full max-w-[1280px]">
        <p aria-hidden className="cap-trim select-none font-display text-[clamp(4rem,19vw,20rem)] uppercase leading-[0.8]">{FOOTER.wordmark}</p>
        <div className="mt-6 flex justify-between font-mono text-xs uppercase tracking-[0.14em] text-bone/70">
          <span>{FOOTER.meta[0]}</span>
          <span>{FOOTER.meta[1]}</span>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 5: Visual check in the browser**

Using Orca at 1440×900 and 390×844, check:
- 8 agent cards in a hairline grid, plus 3 platform cards, and the GitHub links open in a new tab.
- Record rows line up in 3 columns on desktop and stack on mobile, with 5 toolkit groups.
- The FAQ `+` rotates to `×` on open, and the native keyboard toggle works.
- Scrolling to the end reveals the footer from under the content, and the wordmark doesn't overflow at 390px.
- The resume link opens the PDF.

- [ ] **Step 6: Run the gates**

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```

- [ ] **Step 7: Commit**

```bash
git add components/sections
git commit -m "feat: work, record, faq and reveal footer"
```

---

### Task 10: Hardening and full verification

**Files:**
- Create: `app/icon.svg`
- Delete: `app/favicon.ico`
- Modify: `app/layout.tsx` (read the metadata strings from `SITE`)
- Fix-only: any file that verification shows is broken. Report every change you make.

**Interfaces:**
- Consumes: `SITE` from `@/lib/content`; everything else.

- [ ] **Step 1: Favicon**

```bash
git rm -q app/favicon.ico
```

```svg
<!-- app/icon.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#0b0907"/>
  <text x="32" y="46" text-anchor="middle" font-family="Arial Narrow, sans-serif" font-weight="700" font-size="34" fill="#efe6d4">BM</text>
  <rect x="10" y="52" width="44" height="3" fill="#9a2a14"/>
</svg>
```

- [ ] **Step 2: Read the metadata strings from `SITE`**

In `app/layout.tsx`, add `import { SITE } from "@/lib/content";`, delete the local `description` const, and set:

```ts
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: `${SITE.name} — ${SITE.role}`,
  description: SITE.description,
  openGraph: { title: `${SITE.name} — ${SITE.role}`, description: SITE.description, type: "website" },
};
```

- [ ] **Step 3: Full-page verification with the production build**

```bash
npm run build && npm run start
```

In the Orca browser at 1440×900, scroll the whole page from the top and screenshot every section. Then do the same at 390×844. Check:
- All five onboarding beats (Task 6 expectations).
- The hero, and every section from Tasks 7–9.
- Both demos.
- The footer reveal.
- No console errors or warnings (chrome-devtools `list_console_messages`).

- [ ] **Step 4: Fallback checks**

1. **Reduced motion.** Set `prefers-reduced-motion: reduce` via chrome-devtools `emulate`, then reload. The onboarding should be gone, the page should start at the nav, the art shouldn't spin, and the Argus demo should post its steps instantly.
2. **No WebGL.** Use Playwright MCP as the fallback here, because Orca can't disable WebGL: launch it with `--disable-webgl --disable-webgl2`. Or evaluate `HTMLCanvasElement.prototype.getContext = () => null` before the page loads. Expected: `<html class="no-webgl">`, the onboarding is hidden, the art slots show the halftone ground, and every section is readable.
3. **Model failure.** Temporarily rename `public/models/marble_bust_01.glb` and reload. The onboarding should run on the sphere fallback, and the other cards should still render. Rename the file back afterwards.

- [ ] **Step 5: Lighthouse**

Run chrome-devtools `lighthouse_audit` on `http://localhost:3000`, desktop and mobile. Accessibility must be ≥ 95; fix anything that fails. Record the performance score in your report; it's not a gate. Also record the JS transfer size from `list_network_requests`.

- [ ] **Step 6: Run the gates**

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: favicon, metadata from content, verification fixes"
```

---

### Task 11: GitHub profile README (independent — can run any time after Task 1)

**Files:**
- Create: `github-profile/README.md`, `github-profile/assets/banner.svg`, `github-profile/assets/divider.svg`, `github-profile/assets/engagement.svg`, `scripts/build-profile-font.mjs`

**Interfaces:**
- Consumes: the copy in spec §4, reproduced below. It doesn't import `lib/content.ts`, because the profile repo is standalone.
- Produces: a folder Bhumil copies into the root of the `BhumilModi/BhumilModi` repo. Paths in the README are relative (`./assets/...`) so they resolve there.

**Constraints:**
- GitHub strips `<style>`, `<script>` and most inline styles from markdown. All theme work lives inside the SVGs, which are referenced as `<img>`.
- SVGs are self-contained: no external fonts or images and no `<script>`. The only animation allowed is CSS inside the SVG, and it must be wrapped in `@media (prefers-reduced-motion: no-preference)`.
- Every panel paints its own `#0b0907` background, so it reads the same in GitHub light and dark mode.
- Facts only, and no client names.

- [ ] **Step 1: Build the embedded wordmark font**

Write `scripts/build-profile-font.mjs`. It fetches a League Gothic subset that covers only the glyphs the SVGs use, and prints it as a base64 `@font-face` block.

```js
// Dev-time: prints an @font-face with a base64 League Gothic subset for the profile SVGs.
// Run: node scripts/build-profile-font.mjs > .profile-font.css
const TEXT = "BHUMILODFRWAEPYNTGCKSV·—0123456789+";
const css = await (
  await fetch(`https://fonts.googleapis.com/css2?family=League+Gothic&text=${encodeURIComponent(TEXT)}`, {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/128 Safari/537.36" },
  })
).text();
const url = css.match(/url\(([^)]+)\)/)[1];
const bytes = Buffer.from(await (await fetch(url)).arrayBuffer());
console.log(`@font-face{font-family:"LG";src:url(data:font/woff2;base64,${bytes.toString("base64")}) format("woff2");}`);
```

```bash
node scripts/build-profile-font.mjs > .profile-font.css && wc -c .profile-font.css
```
Expected: a single line under about 20 KB. Delete `.profile-font.css` once it's been pasted into the SVGs, and don't commit it.

- [ ] **Step 2: Create `github-profile/assets/banner.svg`** (1200×420)

The banner layers, from back to front:
- a `#0b0907` rect
- 180 radiating rays from the point (900, 210), as `<line>`s in `#efe6d4` at 0.35 opacity. Generate them with a short throwaway node script and paste them in.
- a 6px halftone dot `<pattern>` over the right half
- `BHUMIL MODI` in `font-family:"LG"`, size 150, `#efe6d4`, at x=60 y=235, uppercase
- a mono subtitle `FORWARD DEPLOYED AI ENGINEER · AGENTIC SYSTEMS` in `ui-monospace, monospace`, size 20, letter-spacing 4, at y=290
- a `#9a2a14` bar, 8px tall, across the bottom

Put the Step 1 `@font-face` inside `<defs><style>`. Add one CSS animation: the rays' opacity breathing 0.25 → 0.45 over 6s, and only under `prefers-reduced-motion: no-preference`. Keep the file under 60 KB.

- [ ] **Step 3: Create `github-profile/assets/divider.svg`** (1200×24)

A `#0b0907` strip with a centred meander (Greek key) pattern `<path>` in `#9a2a14` repeated across the width, plus a 1px `#efe6d4` hairline at 30% opacity above and below.

- [ ] **Step 4: Create `github-profile/assets/engagement.svg`** (1200×260)

Four equal columns on `#0b0907`, joined by 1px `#efe6d4` 25% hairlines. Each column holds:
- a mono label `01 · KICKOFF`, `02 · WEEK 2`, `03 · MONTH 2–2.5` or `04 · MONTH 4–5`
- the phase name in `"LG"`, size 64: EMBED, PROTOTYPE, BUILD, BETA
- one short line in `Georgia, serif`, size 18, split across two lines with `<tspan>`:
  - Embed: "Weekly calls with stakeholders. / Ambiguity becomes an agent design."
  - Prototype: "A working proof of concept / on the customer's real inputs."
  - Build: "The agent, its guardrails, / the product around it."
  - Beta: "Live with users the / customer chooses."

The embedded font subset from Step 1 must cover these glyphs. If you add characters, rebuild the subset with them in `TEXT`.

- [ ] **Step 5: Write `github-profile/README.md`**

```markdown
<p align="center">
  <img src="./assets/banner.svg" alt="Bhumil Modi — Forward Deployed AI Engineer, agentic systems" width="100%" />
</p>

### I deploy agentic systems inside the customer.

On the weekly call with your stakeholders, then building the agent pipelines, services and frontends myself — **working POC in two weeks, live beta inside five months.**

<img src="./assets/divider.svg" alt="" width="100%" />

### How an engagement runs

<img src="./assets/engagement.svg" alt="Embed at kickoff, prototype by week 2, build by month 2–2.5, beta with real users by month 4–5" width="100%" />

**20+** client products · **10+** from empty repository to live beta · **10** domains · **6** as project lead · **3,792** commits since Feb 2025

<img src="./assets/divider.svg" alt="" width="100%" />

### Approach

| | |
|---|---|
| **#1 Embed** | Start on the call. Requirements arrive ambiguous; I turn them into an agent design. |
| **#2 Design** | Structure first, model second. Planners, tools and staged pipelines give the agent a shape. |
| **#3 Guard** | Gates before output. Verification gates, bounded repair, fail-closed steps. |
| **#4 Measure** | Evals, not vibes. Deterministic checks plus model judges on fixed datasets. |
| **#5 Integrate** | Into their stack. Auth, tenancy, provider abstraction, rate limits, concurrency. |
| **#6 Ship** | Past the demo. Beta with real users, release pipelines, embeddable SDKs. |

<img src="./assets/divider.svg" alt="" width="100%" />

### Built at TheAgentic

- **[CortexON](https://github.com/TheAgenticAI/CortexON)** — open-source generalised agent for everyday task automation · ★ 450+ · frontend contributor
- **[TheAgenticBench](https://github.com/TheAgenticAI/TheAgenticBench)** — open-source digital-worker framework for agent-driven research · ★ 50+ · frontend contributor
- **TheAgentic Console** — developer console for TheAgentic's AI infrastructure · built the entire UI

### Stack

`Python` `TypeScript` `Go` `SQL` · `FastAPI` `Node.js` · `React` `Next.js` `Tailwind CSS` · `PostgreSQL` `Redis` `Docker` `AWS` `Auth0`

<img src="./assets/divider.svg" alt="" width="100%" />

<p align="center">
  <a href="https://bhumil-modi-portfolio.vercel.app"><b>Portfolio</b></a> ·
  <a href="https://www.linkedin.com/in/bhumil-modi-430148190">LinkedIn</a> ·
  <a href="mailto:bhumilmodi2002@gmail.com">bhumilmodi2002@gmail.com</a> ·
  <a href="https://bhumil-modi-portfolio.vercel.app/Bhumil-Modi-Resume-FDE.pdf">Resume</a>
</p>
```

- [ ] **Step 6: Check it renders**

Serve the folder locally and open it in the Orca browser. Each SVG should render with the embedded font (no fallback shapes), and the rays should breathe.

```bash
npx -y serve github-profile -l 4173
```

Open `http://localhost:4173/assets/banner.svg`, `divider.svg` and `engagement.svg` directly.

For the markdown, render it with GitHub's own renderer and open the result in Orca:
```bash
gh api markdown -f mode=gfm -f text="$(cat github-profile/README.md)" > /tmp/profile-preview.html
```
Confirm the headings, the table and the links render. The file must contain no raw HTML beyond `<p align>`, `<img>`, `<a>` and `<b>`. The images won't resolve in this preview; that's expected, since they were checked above.

Check that `ls -la github-profile/assets` shows every SVG under 60 KB.

- [ ] **Step 7: Commit**

```bash
git add github-profile scripts/build-profile-font.mjs
git commit -m "feat: themed GitHub profile README"
```

Tell Bhumil: copy `github-profile/README.md` and `github-profile/assets/` into the root of the `BhumilModi/BhumilModi` repo and push from there. No push happens from here.

---

## Self-review notes (resolved)

- **Spec coverage.** Every spec section has a task:
  - §2 deletion: T1
  - §3 tokens and type: T1; engraving: T5
  - §4 copy: T3 and T11
  - §5 onboarding: T6
  - §6 sections: T7, T8, T9
  - §7 architecture: T1–T9
  - §8 fallbacks: T5, T6, T10
  - §9 verification: every task plus T10
  - §10 README: T11
- **Deviations from the spec, with the spec already updated:**
  - The engraving is a material, not a post-pass.
  - GSAP and postprocessing are dropped.
  - The stage lives in `stage.tsx` and `stage-loader.tsx`.
- **Type consistency:**
  - `ArtId` is defined in T3 and used in T5 and T7.
  - `ModelId` and `useModelGeometry` are defined in T4 and used in T5 and T6.
  - `createEngravingMaterial` is defined in T5 and used in T6.
  - `CaseItem.demo` values are `"argus"` and `"daedalus"` in both T3 and T8.
  - `ArgusStep` is defined in T2 and used in T8.
  - `RenderMode` is defined in T2 and used in T8.
