# Underworld Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Underworld into a lit, game-like Japanese underworld (the Sanzu River, a vermilion torii with a swirling portal) with a Solo-Leveling-style "System" interface on top: the descent ends through a portal flash, the Trial becomes a ranked Gate clear, ARISE raises seven shadow soldiers, and a Status Window replaces the old card.

**Architecture:** Pure logic stays in `lib/` with node tests: `rank.ts` (new), `quest.ts` (gains `arisen`), `descent.ts` (retimed beats, portal curves, `RIVER_*` renames). The Sanzu is a set of plain three.js builders in `components/experience/sanzu/`, composed by `<Sanzu />` and mounted in two drei `View`s on the shared layout canvas: the `/underworld` backdrop and the descent's final frame. `components/experience/bloom.tsx` takes over drawing for a Sanzu `View` so it can run `EffectComposer` + `UnrealBloomPass` (normal tier) or draw straight to the canvas with additive glow sprites (low tier, or the fallback). The System UI is one DOM component, `SystemWindow`, reused by the arrival notice, the trial's briefing and result, and the Status Window.

**Tech Stack:** Next.js 16 App Router, React 19, three.js 0.186 (+ `three/examples/jsm` postprocessing, `Reflector`, `BufferGeometryUtils`) + @react-three/fiber 9 + @react-three/drei 10, Tailwind CSS 4, Lenis, node:test with TypeScript type-stripping.

**Spec:** `docs/superpowers/specs/2026-09-26-underworld-system-redesign-design.md` (amends `2026-09-26-underworld-side-quest-design.md`). This plan replaces Tasks 11 and 12 of `docs/superpowers/plans/2026-09-26-underworld-side-quest.md` and reworks parts of the output of its Tasks 8, 9 and 10.

## Global Constraints

- No new npm dependencies. Everything uses what `package.json` already has, including `three/examples/jsm/*`. Dev scripts may use `ffmpeg` (`/opt/homebrew/bin/ffmpeg`, `ffprobe` beside it) and `sharp`.
- Next.js 16 differs from training data. Before writing route or navigation code, read `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-router.md` and `use-pathname.md` in the same folder, and heed deprecation notices.
- Underworld palette, verbatim (spec §8): `--abyss #05070d`, `--mist #cfd8e3`, `--system #4aa8ff`, `--monarch #8b5cf6`, `--lily #c8232c`. In `app/globals.css` they live in `@theme` as `--color-abyss`, `--color-mist`, `--color-system`, `--color-monarch`, `--color-lily` (Tailwind 4 naming, as today), so the utilities are `text-mist`, `bg-abyss`, `border-system` and so on. The teal set (`--color-styx`, `--color-asphodel`, `--color-soulfire`) is removed. Olympus tokens (`--void #0b0907`, `--field #9a2a14`, `--bone #efe6d4`, `--ash #6b5f52`, `--ember #d0643b`) are untouched.
- `.soul-glow` becomes `.system-glow`.
- Fonts stay League Gothic (`font-display`), Newsreader (`font-serif`) and JetBrains Mono (`font-mono`). No new fonts. System headers are JetBrains Mono caps in brackets (`[ QUEST ]`), big numbers League Gothic, body Newsreader.
- Copy lives in `lib/content.ts`. IP line (spec §1): no Solo Leveling logo, character names, artwork or exact in-show titles in any copy. Ryuma has his own job and title.
- Every `localStorage` read and write is wrapped in try/catch, and the site works when storage throws. The quest key is `bm.quest.v1`.
- Music is off by default and starts only on a user gesture. The credit "Music: Kevin MacLeod (incompetech.com), CC BY 3.0" appears on both realms.
- Art: the no-nudity rule still applies. No figurative art assets remain on the Underworld. The Met credit stays on Olympus only.
- No dither or engraving shader anywhere in the Sanzu scene. The engraved shaft of the descent is unchanged down to its last ring.
- Descent totals: `DESCENT_S` stays 5.5 and `ASCENT_S` stays 3. Esc/Enter skip and the 2× speed on a repeat crossing stay.
- `prefers-reduced-motion: reduce`: Olympus keeps its rules (no glint, no flight, no tilt or sheen); the crossing is the 1s crossfade with no 3D and the System notice held fully visible for at least 1s; the Sanzu is one still frame (time frozen, no parallax); System windows open with a plain 150ms fade; the ARISE word appears without scale and the soldiers fade in instead of rising.
- Low tier (`scene.tier === "low"`): no reflector, glow sprites instead of bloom, half the lanterns and lilies, one light besides the moon.
- Tests: `npm test` runs `node --test 'lib/**/*.test.ts'`. Test files import siblings with the `.ts` extension (`./rank.ts`), and lib files importing lib files do the same.
- Frontend tasks (4–11) load `emil-design-eng`, `impeccable:impeccable` and `taste-skill:taste-skill` before writing UI; motion tasks (4, 5, 6, 7, 8, 9, 10) also load `apple-design`. The project has no component library (`components/ui` and `components.json` don't exist): don't add shadcn or any UI library, so the shadcn MCP triggers never fire here.
- Browser checks use the Orca CLI first (`orca status`, `orca tab create`, `orca snapshot`, …; load the `orca-cli` skill). Playwright is the fallback: Orca screenshots fail on window focus on this machine, so screenshots go through Playwright and are saved under `/Users/bhumilmodi/.claude/browser-output/`. Reduced-motion emulation is a Playwright-only need (`browser_emulate_media`). `chrome-devtools` is for performance traces and console errors only.
- Git: commit per task. No `Co-Authored-By` trailer, no AI attribution in any message, and never `git push`.
- ESLint: per-frame three.js mutations inside `useFrame` trip `react-hooks/immutability`. Silence each one exactly as the existing code does: `// eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state`.
- Calibration knobs are marked `// calibration knob:` with their bounds. Tune them only within those bounds, and only while looking at screenshots.

### Test fixtures (used by every browser check)

Set quest state in the tab's console before loading `/underworld` (Orca: the `orca-cli` skill's eval command; Playwright: `browser_evaluate`), then reload:

```js
// paid, not yet tried (Trial lobby, Status locked)
localStorage.setItem("bm.quest.v1", JSON.stringify({ obols: ["approach", "record", "footer"], crossed: true, tried: false, best: null, sound: false, arisen: false }));
// cleared with a score, already arisen (soldiers standing, Status unlocked)
localStorage.setItem("bm.quest.v1", JSON.stringify({ obols: ["approach", "record", "footer"], crossed: true, tried: true, best: { score: 4300, hits: 24, accuracy: 0.86, reactionMs: 402 }, sound: false, arisen: true }));
// skipped (Unranked)
localStorage.setItem("bm.quest.v1", JSON.stringify({ obols: ["approach", "record", "footer"], crossed: true, tried: true, best: null, sound: false, arisen: true }));
```

To watch the descent, use the first fixture, open `/`, and click the quest chip ("Pay the ferryman →").

## File map

| File | Task | Responsibility |
|---|---|---|
| `lib/rank.ts`, `lib/rank.test.ts` | 1 | Gate rank S–E from a score and `ARENA.ryumaBest` |
| `lib/quest.ts`, `lib/quest.test.ts` | 1 | `arisen` + `arise()` |
| `lib/descent.ts`, `lib/descent.test.ts` | 2 | retimed beats, `gate`/`sanzu`, portal/flash curves, `RIVER_*`, `riverCamera()` |
| `components/experience/descent-scene.tsx` | 2, 5, 8 | renames; Styx → Sanzu; portal approach, fog, bloom |
| `components/experience/styx.tsx` | 2, 4, 5 | renames; spike; deleted in 5 |
| `app/globals.css` | 3, 7, 8, 9, 10, 11 | palette; System window; crossing flash; ARISE; trial; status |
| `lib/content.ts` | 3 | `SYSTEM`, `ARENA`, `STATUS`, `CROSSING`, `UNDERWORLD` copy; `CARD` removed |
| `scripts/fetch-audio.mjs`, `public/audio/underworld.mp3`, `public/audio/manifest.json`, `README.md` | 3 | new Underworld track, credits |
| `components/quest/crossing.tsx`, `components/underworld/{arena,arrival,gate,realm}.tsx` | 3 | token/class renames, copy key updates |
| `components/experience/bloom.tsx` | 4 | `<Bloom />` render takeover, `bloomOn()`, `<GlowSprite />` fallback |
| `components/experience/wisps.ts` | 5 | `buildWisps()` moved out of `styx.tsx`, with options |
| `components/experience/sanzu/common.ts` | 5 | `INK`, `SANZU`, `FOG_DENSITY`, `NOISE`, `sanzuClock()` |
| `components/experience/sanzu/{torii,portal,water,sky}.ts` | 5 | the Gate, the portal material, the river, sky and moon |
| `components/experience/sanzu/index.tsx` | 5, 6, 9 | `<Sanzu fade? />`, `<SanzuBackdrop />` |
| `components/experience/sanzu/{lanterns,lilies,mist}.ts` | 6 | tōrō nagashi, higanbana bank, mist planes |
| `scripts/fetch-art.mjs`, `public/art/isle.png`, `public/art/manifest.json`, `components/sections/art.tsx` | 5 | isle removed |
| `lib/descent.ts` (`RIVER_CAMERA_PORTRAIT` values) | 6 | portrait reframing |
| `components/underworld/system-window.tsx` | 7 | `SystemWindow` |
| `components/quest/sound.tsx` | 7 | `playChime()` |
| `lib/scene.ts` | 7, 9 | `noticeCarried`, `ariseAt` |
| `components/quest/crossing.tsx` | 8 | flash, scanline, System notice, reduced-motion hold, bloom |
| `components/underworld/arise.tsx`, `components/experience/sanzu/shadows.tsx` | 9 | ARISE flash, `summon()`, shadow soldiers |
| `components/underworld/arena.tsx` | 9, 10 | exits → `summon()`; full reskin |
| `components/underworld/status-window.tsx` | 11 | `section#status` |

Tasks 1, 2 and 3 are independent. Task 4 needs 2. Task 5 needs 2, 3 and 4. Task 6 needs 5. Task 7 needs 3. Task 8 needs 2, 4, 5 and 7. Task 9 needs 1, 3, 6 and 7. Task 10 needs 1, 3, 7 and 9. Task 11 needs 1, 3, 7 and 10. Task 12 comes last.

**Order changes from the brief, with reasons:** the SystemWindow task runs before the descent's bottom half (Task 7 before Task 8), because the crossing's System notice is a `SystemWindow`. ARISE runs before the Trial reskin (Task 9 before Task 10), because the reskinned Trial's ARISE button calls `summon()` from `arise.tsx`. The isle asset removal moves from Task 3 to Task 5, because `styx.tsx` loads `public/art/isle.png` until Task 5 deletes it; removing the PNG first would blank the interim backdrop.

---

### Task 1: Rank and arise logic

**Files:**
- Create: `lib/rank.ts`, `lib/rank.test.ts`
- Modify: `lib/quest.ts`, `lib/quest.test.ts`

**Interfaces:**
- Produces:
  - `type Rank = "S" | "A" | "B" | "C" | "D" | "E"`
  - `rankFor(score: number, ryuma: number): Rank`
  - `QuestState` gains `arisen: boolean`; `INITIAL.arisen === false`
  - `createQuest(...)` gains `arise(): void` (idempotent, persisted)

- [ ] **Step 1: Write the failing rank test** `lib/rank.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { rankFor } from "./rank.ts";

test("S only when the score beats Ryuma outright; a tie is A", () => {
  assert.equal(rankFor(5301, 5300), "S");
  assert.equal(rankFor(5300, 5300), "A");
});

test("every band at and just under its lower boundary (ryuma = 5000)", () => {
  const cases: [number, string][] = [
    [5000, "A"], [4000, "A"], [3999, "B"], [3000, "B"], [2999, "C"],
    [2000, "C"], [1999, "D"], [1000, "D"], [999, "E"], [0, "E"],
  ];
  for (const [score, rank] of cases) assert.equal(rankFor(score, 5000), rank, `score ${score}`);
});

test("boundaries hold for a best that is not a round number (ryuma = 5300)", () => {
  const cases: [number, string][] = [
    [4240, "A"], [4239, "B"], [3180, "B"], [3179, "C"],
    [2120, "C"], [2119, "D"], [1060, "D"], [1059, "E"],
  ];
  for (const [score, rank] of cases) assert.equal(rankFor(score, 5300), rank, `score ${score}`);
});

test("with no best to compare against, any score beats it and zero is E", () => {
  assert.equal(rankFor(1, 0), "S");
  assert.equal(rankFor(0, 0), "E");
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test`
Expected: FAIL — `Cannot find module '…/lib/rank.ts'`.

- [ ] **Step 3: Write** `lib/rank.ts`

```ts
// Gate rank (spec §5): S beats Ryuma's best outright; below that, bands by share of his best.
export type Rank = "S" | "A" | "B" | "C" | "D" | "E";

// Percent of Ryuma's best needed for each band, best first. Integer maths, so 80% of 5300 is exactly 4240.
const BANDS: [Rank, number][] = [["A", 80], ["B", 60], ["C", 40], ["D", 20]];

export function rankFor(score: number, ryuma: number): Rank {
  if (score > ryuma) return "S";
  if (ryuma <= 0) return "E";
  for (const [rank, pct] of BANDS) if (score * 100 >= ryuma * pct) return rank;
  return "E";
}
```

- [ ] **Step 4: Add the failing arise tests** to the end of `lib/quest.test.ts`

```ts
test("arise is once only, notifies once and survives a reload", () => {
  const s = memory();
  const q = createQuest(s);
  let calls = 0;
  q.subscribe(() => calls++);
  assert.equal(q.get().arisen, false);
  q.arise();
  q.arise();
  assert.equal(q.get().arisen, true);
  assert.equal(calls, 1);
  assert.equal(createQuest(s).get().arisen, true);
});

test("arise still works in memory when storage throws", () => {
  const broken: KeyValue = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("quota"); },
  };
  const q = createQuest(broken);
  q.arise();
  assert.equal(q.get().arisen, true);
});

test("parse only accepts a literal true for arisen", () => {
  assert.equal(INITIAL.arisen, false);
  assert.equal(parse(JSON.stringify({ arisen: "yes" })).arisen, false);
  assert.equal(parse(JSON.stringify({ arisen: 1 })).arisen, false);
  assert.equal(parse(JSON.stringify({ arisen: true })).arisen, true);
  assert.equal(parse(JSON.stringify({ obols: ["footer"] })).arisen, false); // a v1 save from before ARISE
});
```

- [ ] **Step 5: Run and watch them fail**

Run: `npm test`
Expected: FAIL — `q.arise is not a function`, and `INITIAL.arisen` is `undefined`.

- [ ] **Step 6: Add `arisen` to** `lib/quest.ts`
- Change the header comment's first line to `// Side-quest progress (spec §2, redesign §6): obols found, the crossing, the trial, ARISE, the sound preference.`
- Replace the `QuestState` type and `INITIAL`:

```ts
export type QuestState = { obols: ObolId[]; crossed: boolean; tried: boolean; best: Best | null; sound: boolean; arisen: boolean };
export type KeyValue = Pick<Storage, "getItem" | "setItem">;

export const INITIAL: QuestState = { obols: [], crossed: false, tried: false, best: null, sound: false, arisen: false };
```

- In `parse`, add `arisen: v.arisen === true,` after `sound: v.sound === true,`.
- In `createQuest`'s returned object, add after `skipTrial()`:

```ts
    /** ARISE (redesign §6): plays once per visitor; later visits find the shadows already standing. */
    arise() {
      if (!state.arisen) set({ ...state, arisen: true });
    },
```

Keep the storage key `bm.quest.v1`: old saves parse with `arisen: false`, so no migration is needed.

- [ ] **Step 7: Run the tests**

Run: `npm test`
Expected: PASS, every suite (rank, quest, arena, descent, timeline, dither, argus, daedalus), 0 failures.

- [ ] **Step 8: Typecheck**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 9: Commit**

```bash
git add lib/rank.ts lib/rank.test.ts lib/quest.ts lib/quest.test.ts
git commit -m "feat: gate ranks and the arise flag"
```

---

### Task 2: Descent retime and renames

**Files:**
- Modify: `lib/descent.ts`, `lib/descent.test.ts`
- Modify (imports and renames only, to keep the build green): `components/experience/descent-scene.tsx`, `components/experience/styx.tsx`, `components/quest/crossing.tsx`

**Interfaces:**
- Consumes: `clamp01`, `easeInOutCubic`, `smoothstep` from `lib/timeline.ts`
- Produces (all from `lib/descent.ts`):
  - `DESCENT_BEATS` with ids `fare | olympus | fall | abyss | gate | sanzu`; `type DescentBeat`, `type Direction`
  - `DESCENT_S = 5.5`, `ASCENT_S = 3`, `beatLocal`, `timelineAt`, `isDone` (unchanged)
  - `PORTAL_Y = -56`, `PORTAL_R = 3.4`, `RIVER_Y = -80`, `GATE_CUT = 4.3`, `NOTICE_AT = 4.7`, `DESCENT_FOV = 45`
  - `type Pose = { position: [number, number, number]; pitch: number }`
  - `RIVER_CAMERA: Pose`, `RIVER_CAMERA_PORTRAIT: Pose`, `PORTRAIT_BELOW = 0.9`, `riverCamera(aspect: number): Pose`
  - `cameraAt(t: number, aspect = 16 / 9): { pos: [number, number, number]; pitch: number }`
  - Curves `(t: number) => number`: `coldness`, `streak`, `cloudOpacity`, `olympusOpacity`, `shaftOpacity`, `sanzuOpacity`, `portalOpacity`, `portalScale`, `flashOpacity`, `scanline`, `backdropOpacity`
  - `bloomBeat(t: number): boolean`, `noticeShown(t: number): boolean`, `obolPose(t)` (unchanged)
  - Removed: `STYX_Y`, `STYX_CAMERA`, `styxOpacity`, `titleOpacity`

- [ ] **Step 1: Replace** `lib/descent.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ASCENT_S, DESCENT_BEATS, DESCENT_S, GATE_CUT, PORTAL_Y, RIVER_CAMERA, RIVER_CAMERA_PORTRAIT, RIVER_Y,
  cameraAt, coldness, flashOpacity, isDone, noticeShown, obolPose, portalOpacity, riverCamera, sanzuOpacity, shaftOpacity, timelineAt,
} from "./descent.ts";

const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≉ ${b}`);
const PORTRAIT = 390 / 844;
const LANDSCAPE = 1440 / 900;

test("beats are contiguous, cover the whole descent, and match the redesign's timing", () => {
  assert.deepEqual(DESCENT_BEATS.map((b) => b.id), ["fare", "olympus", "fall", "abyss", "gate", "sanzu"]);
  assert.equal(DESCENT_BEATS[0].start, 0);
  assert.equal(DESCENT_BEATS[DESCENT_BEATS.length - 1].end, DESCENT_S);
  for (let i = 1; i < DESCENT_BEATS.length; i++) assert.equal(DESCENT_BEATS[i].start, DESCENT_BEATS[i - 1].end);
  const at = Object.fromEntries(DESCENT_BEATS.map((b) => [b.id, [b.start, b.end]]));
  assert.deepEqual(at.fall, [1.8, 3.0]);
  assert.deepEqual(at.abyss, [3.0, 4.2]);
  assert.deepEqual(at.gate, [4.2, 4.45]);
  assert.deepEqual(at.sanzu, [4.45, 5.5]);
});

test("coldness goes 0 → 1 and never warms back up", () => {
  assert.equal(coldness(0), 0);
  assert.equal(coldness(DESCENT_S), 1);
  let last = -1;
  for (let t = 0; t <= DESCENT_S; t += 0.05) {
    assert.ok(coldness(t) >= last);
    last = coldness(t);
  }
});

test("riverCamera picks the portrait pose on tall screens", () => {
  assert.equal(riverCamera(LANDSCAPE), RIVER_CAMERA);
  assert.equal(riverCamera(PORTRAIT), RIVER_CAMERA_PORTRAIT);
});

test("the camera starts on Olympus, passes the portal at the cut, lands on the river pose, and only ever falls", () => {
  for (const aspect of [LANDSCAPE, PORTRAIT]) {
    assert.deepEqual(cameraAt(0, aspect).pos, [0, 1.5, 7]);
    near(cameraAt(GATE_CUT, aspect).pos[1], PORTAL_Y);
    const pose = riverCamera(aspect);
    const end = cameraAt(DESCENT_S, aspect);
    near(end.pos[0], pose.position[0]);
    near(end.pos[1], RIVER_Y + pose.position[1]);
    near(end.pos[2], pose.position[2]);
    near(end.pitch, pose.pitch);
    let lastY = Infinity;
    for (let t = 0; t <= DESCENT_S; t += 0.01) {
      const y = cameraAt(t, aspect).pos[1];
      assert.ok(y <= lastY + 1e-9, `rose at t=${t} (aspect ${aspect})`);
      lastY = y;
    }
  }
});

test("the flash peaks at the cut and the two render styles are never on screen together", () => {
  near(flashOpacity(GATE_CUT), 1);
  assert.equal(flashOpacity(4.2), 0);
  assert.equal(flashOpacity(4.45), 0);
  assert.equal(sanzuOpacity(GATE_CUT - 1e-6), 0);
  assert.equal(sanzuOpacity(GATE_CUT), 1);
  for (let t = 0; t <= DESCENT_S; t += 0.005) {
    assert.ok(shaftOpacity(t) === 0 || sanzuOpacity(t) === 0, `shaft and Sanzu blended at t=${t}`);
    assert.ok(portalOpacity(t) === 0 || sanzuOpacity(t) === 0, `approach disc and Sanzu blended at t=${t}`);
  }
  assert.ok(portalOpacity(3.6) > 0.9);
});

test("descent runs forward, ascent runs the same timeline backwards", () => {
  assert.equal(timelineAt(0, "down"), 0);
  assert.equal(timelineAt(99, "down"), DESCENT_S);
  assert.equal(timelineAt(0, "up"), DESCENT_S);
  near(timelineAt(ASCENT_S, "up"), 0);
  assert.equal(timelineAt(1, "down", 2), 2);
});

test("isDone honours direction and speed", () => {
  assert.equal(isDone(DESCENT_S - 0.01, "down"), false);
  assert.equal(isDone(DESCENT_S, "down"), true);
  assert.equal(isDone(DESCENT_S / 2, "down", 2), true);
  assert.equal(isDone(2.9, "up"), false);
  assert.equal(isDone(3, "up"), true);
});

test("the obol is gone before Olympus, the Sanzu is up at the end, and the notice opens during the glide", () => {
  assert.equal(obolPose(0).opacity, 1);
  assert.equal(obolPose(0.6).opacity, 0);
  assert.equal(sanzuOpacity(DESCENT_S), 1);
  assert.equal(sanzuOpacity(0), 0);
  assert.equal(noticeShown(4.45), false);
  assert.equal(noticeShown(DESCENT_S), true);
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test`
Expected: FAIL — `SyntaxError: The requested module './descent.ts' does not provide an export named 'GATE_CUT'`.

- [ ] **Step 3: Replace** `lib/descent.ts`

```ts
// The crossing (redesign spec §4): a time-driven fall from Olympus, down the engraved shaft, through the portal
// and out over the Sanzu, in seconds. Pure curves; the 3D scene and the DOM overlay both read them.
import { clamp01, easeInOutCubic, smoothstep } from "./timeline.ts";

export const DESCENT_BEATS = [
  { id: "fare", start: 0, end: 0.6 },
  { id: "olympus", start: 0.6, end: 1.8 },
  { id: "fall", start: 1.8, end: 3.0 },
  { id: "abyss", start: 3.0, end: 4.2 },
  { id: "gate", start: 4.2, end: 4.45 },
  { id: "sanzu", start: 4.45, end: 5.5 },
] as const;

export type DescentBeat = (typeof DESCENT_BEATS)[number]["id"];
export type Direction = "down" | "up";
export const DESCENT_S = 5.5;
export const ASCENT_S = 3;

export function beatLocal(t: number, id: DescentBeat): number {
  const b = DESCENT_BEATS.find((x) => x.id === id)!;
  return clamp01((t - b.start) / (b.end - b.start));
}

/** Timeline position (0 = Olympus, DESCENT_S = the Sanzu) after `elapsed` seconds. Ascent plays it backwards in ASCENT_S. */
export function timelineAt(elapsed: number, direction: Direction, speed = 1): number {
  const e = Math.max(0, elapsed) * speed;
  return direction === "down" ? Math.min(DESCENT_S, e) : Math.max(0, DESCENT_S - e * (DESCENT_S / ASCENT_S));
}

export function isDone(elapsed: number, direction: Direction, speed = 1): boolean {
  return elapsed * speed >= (direction === "down" ? DESCENT_S : ASCENT_S);
}

// World layout: Olympus at the origin; the shaft's last ring near y = -42; the portal PORTAL_Y below it;
// the Sanzu's waterline RIVER_Y below that. The Sanzu is hidden until the cut, so the gap is never seen.
export const PORTAL_Y = -56;
export const PORTAL_R = 3.4;
export const RIVER_Y = -80;
/** The camera passes through the portal: the flash peaks and the render style switches under it. */
export const GATE_CUT = 4.3;
/** The [SYSTEM] notice opens here, during the glide. */
export const NOTICE_AT = 4.7;
export const DESCENT_FOV = 45;

export type Pose = { position: [number, number, number]; pitch: number };
// calibration knob: both river poses — tune while comparing /underworld screenshots at 1440×900 and 390×844.
/** Low over the water, pitched slightly up; the torii sits right of centre. The backdrop uses it unchanged. */
export const RIVER_CAMERA: Pose = { position: [0, 1.1, 8], pitch: 0.05 };
/** Tall screens: centred on the torii and pitched down, so the Gate sits in the top half and the text below. */
export const RIVER_CAMERA_PORTRAIT: Pose = { position: [4, 1.2, 10], pitch: -0.1 };
export const PORTRAIT_BELOW = 0.9; // aspect (w / h) under which the portrait pose is used
export const riverCamera = (aspect: number): Pose => (aspect < PORTRAIT_BELOW ? RIVER_CAMERA_PORTRAIT : RIVER_CAMERA);

const easeIn = (x: number) => x * x * x;
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const linear = (x: number) => x;
type Key = { t: number; pos: [number, number, number]; pitch: number; ease: (x: number) => number };
// ease: the curve used to arrive at this key from the previous one.
// calibration knob: the t = 4.45 key (where the camera comes out of the flash above the torii); keep y below PORTAL_Y.
const KEYS: Key[] = [
  { t: 0, pos: [0, 1.5, 7], pitch: 0, ease: easeInOutCubic },
  { t: 0.6, pos: [0, 1.5, 6.5], pitch: 0, ease: easeInOutCubic },
  { t: 1.8, pos: [0, 1, 3], pitch: -0.6, ease: easeInOutCubic },
  { t: 3.0, pos: [0, -14, 0], pitch: -Math.PI / 2, ease: easeIn },
  // Straight down the shaft, through the portal at the flash peak.
  { t: GATE_CUT, pos: [0, PORTAL_Y, 0], pitch: -Math.PI / 2, ease: linear },
  // Out of the flash high above the torii, looking down at it.
  { t: 4.45, pos: [2, RIVER_Y + 15, -2], pitch: -1.0, ease: linear },
];
const land = (p: Pose): Key => ({ t: DESCENT_S, pos: [p.position[0], RIVER_Y + p.position[1], p.position[2]], pitch: p.pitch, ease: easeOut });
const PATHS = { landscape: [...KEYS, land(RIVER_CAMERA)], portrait: [...KEYS, land(RIVER_CAMERA_PORTRAIT)] };

/** Camera position and pitch at timeline t (radians; 0 looks along -z, -π/2 straight down). */
export function cameraAt(t: number, aspect = 16 / 9): { pos: [number, number, number]; pitch: number } {
  const keys = aspect < PORTRAIT_BELOW ? PATHS.portrait : PATHS.landscape;
  const x = Math.min(DESCENT_S, Math.max(0, t));
  const i = Math.max(1, keys.findIndex((k) => k.t >= x));
  const a = keys[i - 1];
  const b = keys[i];
  const u = b.ease(clamp01((x - a.t) / (b.t - a.t)));
  const lerp = (p: number, q: number) => p + (q - p) * u;
  return { pos: [lerp(a.pos[0], b.pos[0]), lerp(a.pos[1], b.pos[1]), lerp(a.pos[2], b.pos[2])], pitch: lerp(a.pitch, b.pitch) };
}

/** 0 = warm Olympus, 1 = cold Underworld. Monotonic. */
export const coldness = (t: number) => smoothstep(1.8, 3.6, t);
/** How far cloud particles stretch into upward speed streaks: peaks through the fall. */
export const streak = (t: number) => smoothstep(1.6, 2.2, t) * (1 - smoothstep(3.6, 4.4, t));
export const cloudOpacity = (t: number) => 1 - smoothstep(3.4, 4.2, t);
export const olympusOpacity = (t: number) => 1 - smoothstep(2.4, 3.2, t);
/** The engraved shaft: in over the fall, gone at the cut. The two styles are never blended. */
export const shaftOpacity = (t: number) => (t < GATE_CUT ? smoothstep(2.6, 3.2, t) : 0);
/** The lit Sanzu: a hard step at the cut, hidden under the flash. */
export const sanzuOpacity = (t: number) => (t >= GATE_CUT ? 1 : 0);
/** The approach disc far below the shaft: in as the fall ends, gone at the cut (the torii's portal takes over). */
export const portalOpacity = (t: number) => (t < GATE_CUT ? smoothstep(3.0, 3.5, t) : 0);
/** The disc swells from a spark as it appears; perspective does the rest of the growing. */
export const portalScale = (t: number) => 0.25 + 0.75 * smoothstep(3.0, 3.9, t);
/** System-blue flash: up to its peak at the cut in 0.1s, then clear by the end of the gate beat. */
export const flashOpacity = (t: number) => smoothstep(4.2, GATE_CUT, t) * (1 - smoothstep(GATE_CUT, 4.45, t));
/** The scanline's sweep down the screen through the gate beat: 0 = top, 1 = bottom. */
export const scanline = (t: number) => beatLocal(t, "gate");
/** Bloom runs from the portal approach on; the Olympus beats never go through the composer. */
export const bloomBeat = (t: number) => t >= 3.0;
export const noticeShown = (t: number) => t >= NOTICE_AT;
/** Opaque backdrop behind the canvas that hides the page; in over the fare beat. */
export const backdropOpacity = (t: number) => smoothstep(0, 0.5, t);

/** The obol flips and drops out of frame through the fare beat. */
export function obolPose(t: number) {
  const f = beatLocal(t, "fare");
  return { flip: f * Math.PI * 3, drop: -3 * easeIn(f), opacity: 1 - smoothstep(0.7, 1, f) };
}
```

- [ ] **Step 4: Run the tests**

Run: `npm test`
Expected: PASS, 0 failures.

- [ ] **Step 5: Update the consumers so the build stays green.** These are renames only; Tasks 5 and 8 rewrite these files properly.
- `components/experience/descent-scene.tsx`: in the `@/lib/descent` import, replace `STYX_Y` with `RIVER_Y` and `styxOpacity` with `sanzuOpacity`. Replace `styxOpacity(scene.crossingT)` with `sanzuOpacity(scene.crossingT)` and `position={[0, STYX_Y, 0]}` with `position={[0, RIVER_Y, 0]}`.
- `components/experience/styx.tsx`: replace the import `import { DESCENT_FOV, STYX_CAMERA } from "@/lib/descent";` with `import { DESCENT_FOV, RIVER_CAMERA } from "@/lib/descent";`, and in `StyxBackdrop` replace both `STYX_CAMERA` with `RIVER_CAMERA`.
- `components/quest/crossing.tsx`: in the `@/lib/descent` import, replace `titleOpacity` with `noticeShown`, and replace `title.current.style.opacity = String(titleOpacity(t));` with `title.current.style.opacity = noticeShown(t) ? "1" : "0";`.

- [ ] **Step 6: Gates**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: no type errors, no lint errors, build succeeds.

- [ ] **Step 7: Commit**

```bash
git add lib/descent.ts lib/descent.test.ts components/experience/descent-scene.tsx components/experience/styx.tsx components/quest/crossing.tsx
git commit -m "feat: retime the descent for the portal, the gate and the sanzu"
```

---

### Task 3: Palette, copy, music and credits

**Files:**
- Modify: `app/globals.css`, `lib/content.ts`, `scripts/fetch-audio.mjs`, `README.md`
- Regenerate: `public/audio/olympus.mp3`, `public/audio/underworld.mp3`, `public/audio/manifest.json`
- Modify (token, class and copy-key renames): `components/quest/crossing.tsx`, `components/underworld/{arena,arrival,gate,realm}.tsx`, `components/experience/styx.tsx`, `components/experience/descent-scene.tsx`

**Interfaces:**
- Produces:
  - Tokens `--color-abyss #05070d`, `--color-mist #cfd8e3`, `--color-system #4aa8ff`, `--color-monarch #8b5cf6`, `--color-lily #c8232c`; class `.system-glow`
  - `SYSTEM = { tag, entered, levelUp, arise }`
  - `CROSSING = { skip }` (no `title`)
  - `UNDERWORLD` without the Met credit; `gate.eyebrow` is "The Sanzu"
  - `ARENA = { label, title, briefing: { heading, lines }, start, skip, again, arise, resultHeading, rank, you, ryuma, held, taken, yourBest, stats, canvasLabel, ryumaBest }`
  - `STATUS = { heading, locked, toGate, name, level, job, title, labels, stats, skills, equipment, recordHeading, rankLabel, unranked, invite }`
  - `CARD` is removed (nothing imports it; Task 11 of the old plan was never built)

- [ ] **Step 1: Replace the teal tokens.** In `app/globals.css`, inside `@theme`, replace these four lines:

```css
  --color-abyss: #05080a;
  --color-styx: #0e2626;
  --color-asphodel: #cfd8d3;
  --color-soulfire: #5ef2c2;
```

with:

```css
  /* The Underworld (redesign spec §8). */
  --color-abyss: #05070d;
  --color-mist: #cfd8e3;
  --color-system: #4aa8ff;
  --color-monarch: #8b5cf6;
  --color-lily: #c8232c;
```

- [ ] **Step 2: Rename the teal usages everywhere.** Run exactly:

```bash
FILES="app/globals.css components/quest/crossing.tsx components/underworld/arena.tsx components/underworld/arrival.tsx components/underworld/gate.tsx components/underworld/realm.tsx"
sed -i '' -e 's/soul-glow/system-glow/g' -e 's/asphodel/mist/g' -e 's/soulfire/system/g' -e 's/bg-styx/bg-abyss/g' $FILES
# Hex literals of the old set, in canvas/three code (Task 5 deletes styx.tsx, Task 10 rewrites arena.tsx):
sed -i '' -e 's/#5ef2c2/#4aa8ff/g' -e 's/94, 242, 194/74, 168, 255/g' -e 's/#cfd8d3/#cfd8e3/g' -e 's/#05080a/#05070d/g' -e 's/#0e2626/#0b1222/g' \
  components/underworld/arena.tsx components/experience/styx.tsx
sed -i '' -e 's/const ABYSS = \[5, 8, 10\];/const ABYSS = [5, 7, 13];/' components/quest/crossing.tsx
```

Then in `app/globals.css` replace the `.system-glow` rule (the sed renamed it) with:

```css
.system-glow {
  text-shadow: 0 0 2px color-mix(in srgb, var(--color-system) 70%, transparent), 0 0 28px color-mix(in srgb, var(--color-system) 38%, transparent);
}
```

Also change the comment above `html:has(.realm-underworld)` to `/* The Underworld (app/underworld): the Sanzu under the System. */`.

- [ ] **Step 3: Verify no teal is left.**

Run: `grep -rnE "asphodel|soulfire|soul-glow|--color-styx|bg-styx|5ef2c2|cfd8d3|05080a" app components lib`
Expected: matches only inside `components/experience/styx.tsx` and `components/experience/descent-scene.tsx` for the `COLD.asphodel` / `COLD.soulfire` object keys (Task 5 removes both), and the comment in `components/experience/engraving-material.ts` (change its "asphodel on abyss" to "mist on abyss" now). Nothing else.

- [ ] **Step 4: Replace the side-quest copy in** `lib/content.ts`. Replace everything from `export const CROSSING = …` to the end of the file with:

```ts
export const CROSSING = { skip: "Skip ↵" };

// The System (redesign spec §5). Evokes the genre only: no logos, names or exact in-show titles.
export const SYSTEM = {
  tag: "[SYSTEM]",
  entered: "You have entered the Gate.",
  levelUp: "LEVEL UP! A new personal best.",
  arise: "ARISE",
};

export const UNDERWORLD = {
  metaTitle: "Ryuma — The Underworld",
  metaDescription: "Off duty. A side quest beneath the portfolio of Bhumil Modi.",
  brand: "Ryuma",
  ascend: "Ascend ↑",
  eyebrow: "The Underworld",
  name: "Ryuma",
  line: "By day, agents in production. By night —",
  gate: {
    eyebrow: "The Sanzu",
    title: "No fare, no crossing.",
    body: "The ferryman counts {n} of 3 obols. They are hidden above.",
    back: "← Back to Olympus",
  },
  // No art credit: no figurative art remains on the Underworld (the Met credit stays on Olympus's footer).
  credit: ["Music: Kevin MacLeod (incompetech.com), CC BY 3.0", "© 2026"],
};

export const ARENA = {
  label: "The Gate",
  title: "Trial of Ryuma",
  briefing: { heading: "QUEST", lines: ["Clear the Gate.", "Banish the shades.", "Time limit: 30s."] },
  start: "Enter",
  skip: "Skip the trial",
  again: "Run it back",
  arise: "ARISE",
  resultHeading: "GATE CLEARED",
  rank: "Rank",
  you: "You",
  ryuma: "Ryuma",
  held: "Ryuma still holds the Gate.",
  taken: "You took the Gate.",
  yourBest: "Your best",
  stats: { hits: "Hits", accuracy: "Accuracy", reaction: "Avg reaction" },
  canvasLabel: "The Gate. Click or tap the sigils before they fade.",
  // Bhumil's own best. Placeholder until he plays the trial once (spec §5).
  ryumaBest: 5300,
};

// The Status Window (redesign spec §6). Replaces the old CARD.
export const STATUS = {
  heading: "STATUS",
  locked: "Clear the Gate to unlock.",
  toGate: "To the Gate ↑",
  name: "Ryuma",
  // Placeholders for Bhumil to fill (spec §6), like ARENA.ryumaBest: level, job and the five stats.
  level: 27,
  job: "Entry Fragger",
  title: "One Who Drops Hot",
  labels: { name: "Name", level: "Level", job: "Job", title: "Title" },
  stats: [
    { k: "STR", v: 41 },
    { k: "AGI", v: 88 },
    { k: "PER", v: 92 },
    { k: "VIT", v: 47 },
    { k: "INT", v: 76 },
  ],
  // From the old card's quote ("drop hot, rotate early") and its PvP / Battle royale / FPS list.
  skills: {
    heading: "SKILLS",
    list: [
      { kind: "Active", name: "Drop Hot" },
      { kind: "Passive", name: "Rotate Early" },
      { kind: "PvP", name: "Battle royale · FPS" },
    ],
  },
  equipment: { heading: "EQUIPMENT", list: ["PC", "Mobile"] },
  recordHeading: "YOUR RECORD",
  rankLabel: "Rank",
  unranked: "Unranked",
  invite: {
    text: "Ryuma has sent you a party invite.",
    accept: "[ Accept ]",
    href: `mailto:${SITE.email}?subject=${encodeURIComponent("Squad up — from the arena")}`,
  },
};
```

- [ ] **Step 5: Point the two old copy consumers at the new keys** (Tasks 8 and 10 rewrite them):
- `components/quest/crossing.tsx`: change the content import to `import { CROSSING, SYSTEM } from "@/lib/content";` and replace `{CROSSING.title}` with `{SYSTEM.entered}`.
- `components/underworld/arena.tsx`: change the content import to `import { ARENA, SYSTEM } from "@/lib/content";`, replace `{ARENA.lede}` with `{ARENA.briefing.lines.join(" ")}`, `{ARENA.newBest}` with `{SYSTEM.levelUp}`, and `{ARENA.claim}` with `{ARENA.arise}`.

- [ ] **Step 6: Swap the Underworld track.** In `scripts/fetch-audio.mjs`, replace the `underworld` entry of `TRACKS` with:

```js
  // Verified 2026-09-26 on Commons: LicenseShortName "CC BY 3.0", 199.4s, Soundtrack music from Incompetech.
  { name: "underworld", file: "Oppressive Gloom (ISRC USUAN1100885).mp3", title: "Oppressive Gloom", composer: "Kevin MacLeod", start: 8, length: 150 },
```

The script already resolves `File:<file>` through the Commons API, refuses anything whose `LicenseShortName` isn't `CC BY 3.0`, downloads `imageinfo.url` (for this file, `https://upload.wikimedia.org/wikipedia/commons/3/30/Oppressive_Gloom_%28ISRC_USUAN1100885%29.mp3`), trims `start`/`length`, applies the 2s fades and `loudnorm`, and writes the manifest with `source: https://commons.wikimedia.org/wiki/File:Oppressive_Gloom_(ISRC_USUAN1100885).mp3`.

- [ ] **Step 7: Fetch.**

Run: `node scripts/fetch-audio.mjs && ffprobe -v error -show_entries format=duration -of csv=p=0 public/audio/underworld.mp3`
Expected: `✓ olympus`, `✓ underworld`, then a duration of `150.0…`. `public/audio/manifest.json` now names "Oppressive Gloom", composer "Kevin MacLeod", and the Commons source above. Listen to the loop seam once (`afplay public/audio/underworld.mp3`); if it cuts mid-phrase, move `start` (calibration knob: 0–45) and rerun.

- [ ] **Step 8: Update the credits in** `README.md`. Replace the `## Credits` body with:

```markdown
3D models: [Poly Haven](https://polyhaven.com), CC0.
Art (Olympus only): The Met Open Access, CC0 — see public/art/manifest.json.
Music: Kevin MacLeod (incompetech.com), CC BY 3.0 — "Gymnopédie No. 1" (Erik Satie) on Olympus and "Oppressive Gloom" on the Underworld; see public/audio/manifest.json.
```

- [ ] **Step 9: Gates**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: all green.

- [ ] **Step 10: Browser check.** `npm run dev`, then in Orca (Playwright fallback for screenshots): `/underworld` with the first fixture shows mist-coloured text, System-blue eyebrow and glow, no teal anywhere; the footer reads "Music: Kevin MacLeod (incompetech.com), CC BY 3.0 · © 2026". `/` is unchanged (its footer still carries the Met credit). Turn sound on in `/underworld`: the new track plays.

- [ ] **Step 11: Commit**

```bash
git add app/globals.css lib/content.ts scripts/fetch-audio.mjs public/audio README.md components/quest/crossing.tsx components/underworld components/experience/styx.tsx components/experience/descent-scene.tsx components/experience/engraving-material.ts
git commit -m "feat: system palette, copy and a darker underworld track"
```

---
### Task 4: Bloom spike on the shared canvas

Load `emil-design-eng`, `impeccable:impeccable`, `taste-skill:taste-skill` and `apple-design` first.

The site draws one fixed canvas split into drei `View` scissor regions (`components/experience/stage.tsx` → `<View.Port />`). Each `View`'s container renders its portalled scene in a `useFrame` at priority `index` (1) with `gl.render(state.scene, state.camera)` straight to the canvas, so a composer can't be slotted in after it. The approach: mount the Sanzu `View`s with `visible={false}` (drei then never draws them, but their children and frame callbacks still run) and let a `<Bloom />` child do the drawing, either through `EffectComposer` → `RenderPass` → `UnrealBloomPass` → `OutputPass`, or directly with `gl.render`. Both Sanzu views are `fixed inset-0`, so drawing the whole canvas is correct. Tone mapping is handled there too: `OutputPass` applies `renderer.toneMapping`, so ACES is switched on only while the lit Sanzu is on screen and the engraved Olympus and shaft keep their flat colours.

**Files:**
- Create: `components/experience/bloom.tsx`
- Modify (spike only; Task 5 deletes the file): `components/experience/styx.tsx`

**Interfaces:**
- Consumes: `scene.tier` (`lib/scene.ts`)
- Produces:
  - `export default function Bloom(props: { bloom?: () => boolean; aces?: () => boolean; paused?: () => boolean }): null` — owns drawing for its `View`; defaults `bloom = () => true`, `aces = () => true`, `paused = () => false`
  - `bloomOn(): boolean` — `COMPOSER_OK && scene.tier === "high"`
  - `createGlowMaterial(color: THREE.ColorRepresentation, intensity: number): THREE.ShaderMaterial` (uniforms `uColor`, `uIntensity`, `uOpacity`)
  - `<GlowSprite position: [number, number, number]; size: number; color: string; intensity?: number />` — renders only when `!bloomOn()`

- [ ] **Step 1: Write** `components/experience/bloom.tsx`

```tsx
"use client";
import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { scene } from "@/lib/scene";

// Decision knob (Task 4, Step 5): false sends every tier down the glow-sprite fallback.
const COMPOSER_OK = true;
// calibration knob: strength 0.5–1.4, radius 0.3–0.8, threshold 0.7–1.0 (linear HDR luminance, before tone mapping).
// The threshold must sit above every lit surface (torii, boat, lilies) so only emissives bloom.
const BLOOM = { strength: 0.85, radius: 0.55, threshold: 0.82 };
const EXPOSURE = 1.1; // calibration knob: ACES exposure for the Sanzu, 0.8–1.4

/** Real bloom this session? Normal tier only, and only if the composer passed Task 4's check. Call inside the canvas. */
export const bloomOn = () => COMPOSER_OK && scene.tier === "high";

type Props = {
  /** Run the bloom pass this frame (it also needs bloomOn()); otherwise draw straight to the canvas. */
  bloom?: () => boolean;
  /** ACES tone mapping this frame. False keeps the engraving's flat colours exact (Olympus, the shaft). */
  aces?: () => boolean;
  /** Draw nothing this frame, e.g. while the page sits hidden under the crossing. */
  paused?: () => boolean;
};
const yes = () => true;
const no = () => false;

/**
 * Takes over drawing for the drei <View> it sits in. Mount that View with visible={false} so drei doesn't draw it too.
 * ponytail: draws the whole canvas, not the View's rect — right for the two Sanzu views, which are fixed inset-0.
 * Make it rect-aware if a Sanzu view ever becomes a partial panel.
 */
export default function Bloom({ bloom = yes, aces = yes, paused = no }: Props) {
  const renderer = useThree((s) => s.gl);
  const post = useMemo(() => {
    if (!bloomOn()) return null;
    const composer = new EffectComposer(renderer); // HalfFloat targets keep emissives above 1.0 for the threshold
    const render = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
    const pass = new UnrealBloomPass(new THREE.Vector2(256, 256), BLOOM.strength, BLOOM.radius, BLOOM.threshold);
    composer.addPass(render);
    composer.addPass(pass);
    composer.addPass(new OutputPass()); // tone mapping + sRGB, read from the renderer on every render
    return { composer, render, pass, size: new THREE.Vector2(), dpr: 0 };
  }, [renderer]);
  const size = useMemo(() => new THREE.Vector2(), []);
  useEffect(
    () => () => {
      post?.pass.dispose();
      post?.composer.dispose();
    },
    [post],
  );

  useFrame((state, delta) => {
    if (paused()) return;
    const { gl, scene: world, camera } = state;
    gl.getSize(size);
    const cam = camera as THREE.PerspectiveCamera;
    if (cam.aspect !== size.x / size.y) {
      cam.aspect = size.x / size.y; // drei would do this in its scissor setup, which we skip
      cam.updateProjectionMatrix();
    }
    const tone = gl.toneMapping;
    const exposure = gl.toneMappingExposure;
    gl.toneMapping = aces() ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
    gl.toneMappingExposure = EXPOSURE;
    gl.setViewport(0, 0, size.x, size.y); // another View may have left its scissored viewport behind
    if (post && bloom()) {
      const dpr = gl.getPixelRatio(); // the full ratio: the engraved shaft's dither must stay pixel-exact
      if (!post.size.equals(size) || post.dpr !== dpr) {
        post.size.copy(size);
        // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
        post.dpr = dpr;
        post.composer.setPixelRatio(dpr);
        post.composer.setSize(size.x, size.y);
      }
      // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
      post.render.scene = world;
      post.render.camera = camera;
      post.composer.render(delta);
    } else {
      const autoClear = gl.autoClear;
      gl.autoClear = false; // draw over whatever other views drew this frame, as drei does
      gl.clearDepth();
      gl.render(world, camera);
      gl.autoClear = autoClear;
    }
    gl.toneMapping = tone;
    gl.toneMappingExposure = exposure;
  }, 1);
  return null;
}

const glowVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const glowFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
uniform float uOpacity;
varying vec2 vUv;
void main() {
  float d = length(vUv - 0.5) * 2.0;
  gl_FragColor = vec4(uColor * uIntensity, pow(max(0.0, 1.0 - d), 2.2) * uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/** An additive radial halo: the glow the bloom pass would have added, painted on. */
export function createGlowMaterial(color: THREE.ColorRepresentation, intensity: number) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uIntensity: { value: intensity }, uOpacity: { value: 1 } },
    vertexShader: glowVertex,
    fragmentShader: glowFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/** The bloom fallback (low tier, or COMPOSER_OK = false): a camera-facing halo. Renders nothing when real bloom is on. */
export function GlowSprite({ position, size, color, intensity = 1 }: { position: [number, number, number]; size: number; color: string; intensity?: number }) {
  const material = useMemo(() => createGlowMaterial(color, intensity), [color, intensity]);
  useEffect(() => () => material.dispose(), [material]);
  if (bloomOn()) return null;
  return (
    <Billboard position={position}>
      <mesh material={material} renderOrder={3}>
        <planeGeometry args={[size, size]} />
      </mesh>
    </Billboard>
  );
}
```

The disable comments sit exactly where `react-hooks/immutability` reports (the first write to each hook-owned value). This plan's code was checked with `npx tsc --noEmit` and `npx eslint` in a scratch worktree: both are clean. If a later edit moves a write, move the comment with it.

- [ ] **Step 2: Wire the spike into the existing Styx backdrop.** In `components/experience/styx.tsx`:
- Add `import Bloom from "./bloom";`.
- Add `const flat = () => false; // the Styx is dithered: keep its colours exact`.
- In `StyxBackdrop`, change `<View className="size-full">` to `<View className="size-full" visible={false}>` and add `<Bloom aces={flat} />` right after the `PerspectiveCamera`.
- Add a temporary HDR test emitter right after `<Styx />` (removed in Step 6):

```tsx
            {/* SPIKE: an HDR emitter (linear 6, 3, 12) — it must grow a soft violet halo; nothing else may change. */}
            <mesh position={[1.5, 1.6, -4]}>
              <sphereGeometry args={[0.35, 32, 16]} />
              <meshBasicMaterial color={[6, 3, 12]} />
            </mesh>
```

- [ ] **Step 3: Gates**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: all green.

- [ ] **Step 4: Verify the composer.** `npm run dev`, first fixture, `/underworld` at 1440×900 (Playwright screenshots under `/Users/bhumilmodi/.claude/browser-output/`).
- Screenshot A: as wired. Then set `COMPOSER_OK = false`, reload, screenshot B, and set it back to `true`.
- Pass criteria, all of them:
  - A: the test sphere has a soft violet halo reaching at least one sphere radius beyond its edge; B: no halo.
  - Crop the boat and the water glints in A and B at 100%: the dither dots are the same size, the same crispness and the same colours. Nothing but the halo differs.
  - No black or blank frame, no transparent hole over the page; the RYUMA title and the trial sit over the backdrop as before.
  - Resize the window to 1100×800 and back: the image re-fits, with no stretching and no stale edge.
  - `chrome-devtools` `list_console_messages`: no WebGL errors or warnings (`GL_INVALID_*`, `Framebuffer incomplete`).
  - `/` (Olympus) is unchanged, and the descent (still drawn by drei) is unchanged.
  - Low tier: reload at 390×844 (tier is picked at load, so the phone width lands on low). The sphere has no halo, and nothing else changes.
  - Performance: a 5s `chrome-devtools` trace on `/underworld` at 1440×900 with A, then with B. A's mean frame time is ≤ 16.7ms, and A costs at most 6ms per frame more than B.

- [ ] **Step 5: Decide.** If every criterion in Step 4 passes, keep `COMPOSER_OK = true`. If any fails (blank or black canvas, a hole over the page, a colour shift in the dither, WebGL errors, a mean frame time over 20ms, or more than 6ms added), set `COMPOSER_OK = false`. Every tier then uses `<GlowSprite />` and the lantern halo points from Task 6. Either way, put the outcome on the line above the constant:

```ts
// Task 4 spike (2026-09-DD): composer <passed | failed: the reason>, 1440×900 mean frame <A> ms vs <B> ms without.
```

- [ ] **Step 6: Remove the test emitter** from `styx.tsx`. Keep the `Bloom` wiring; Task 5 replaces the whole file.

- [ ] **Step 7: Gates, then commit**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: all green.

```bash
git add components/experience/bloom.tsx components/experience/styx.tsx
git commit -m "feat: bloom for the underworld with a glow-sprite fallback"
```

---

### Task 5: The Sanzu I — torii, portal, water, sky, moon

Load `emil-design-eng`, `impeccable:impeccable`, `taste-skill:taste-skill` and `apple-design` first. The bar is a Ghost-of-Tsushima night: lighting, materials, fog, bloom and strong silhouettes carry it, not mesh detail. No dither or engraving shader anywhere in this scene.

**Files:**
- Create: `components/experience/wisps.ts` (moved out of `styx.tsx`, with options)
- Create: `components/experience/sanzu/common.ts`, `torii.ts`, `portal.ts`, `water.ts`, `sky.ts`, `index.tsx`
- Modify: `components/underworld/realm.tsx`, `components/experience/descent-scene.tsx`
- Delete: `components/experience/styx.tsx`, `public/art/isle.png`
- Modify (isle removal, moved here from Task 3): `scripts/fetch-art.mjs`, `public/art/manifest.json`, `components/sections/art.tsx`

**Interfaces:**
- Consumes: `DESCENT_FOV`, `riverCamera`, `RIVER_Y` (Task 2); `Bloom`, `GlowSprite` (Task 4); `scene`
- Produces:
  - `common.ts`: `INK`, `SANZU` (tone constants), `FOG_DENSITY`, `NOISE` (GLSL `hash21`, `noise2`, `fbm`), `sanzuClock(elapsed: number): number`
  - `wisps.ts`: `buildWisps(count: number, width: number, height: number, options: { color: string; size?: number; maxSize?: number; speed?: number; intensity?: number }): { points: THREE.Points; material: THREE.ShaderMaterial }` (uniforms `uTime`, `uOpacity`, …)
  - `torii.ts`: `TORII = { x, z, portalY, portalW, portalH }`, `buildTorii(): { group: THREE.Group; dispose(): void }`
  - `portal.ts`: `createPortalMaterial(intensity?: number): THREE.ShaderMaterial` (uniforms `uTime`, `uOpacity`, `uIntensity`, `uCore`, `uRim`)
  - `water.ts`: `buildWater(low: boolean): { mesh: THREE.Mesh; uniforms: Record<string, THREE.IUniform>; dispose(): void }`
  - `sky.ts`: `MOON_POS`, `buildSky()` and `buildMoon()`, each `{ mesh; material: THREE.ShaderMaterial; dispose() }`
  - `index.tsx`: `<Sanzu fade?: () => number />` (local origin on the waterline; `fade() === 0` hides it) and `<SanzuBackdrop />`

- [ ] **Step 1: Write** `components/experience/sanzu/common.ts`

```ts
import { scene } from "@/lib/scene";

// Mirror the --color-abyss/mist/system/monarch/lily tokens in app/globals.css (redesign spec §8).
export const INK = { abyss: "#05070d", mist: "#cfd8e3", system: "#4aa8ff", monarch: "#8b5cf6", lily: "#c8232c" } as const;

// Scene-only tones, not UI tokens: night-blue moonlight, amber paper, ink water.
export const SANZU = {
  fog: "#070a12",
  water: "#020308",
  horizon: "#141c30",
  zenith: "#03050a",
  skyGlow: "#5a6f99",
  skyFill: "#1c2540",
  moon: "#e6ecf7",
  moonlight: "#9fb4d8",
  lantern: "#ffa84a",
  wood: "#4a3526",
  cloth: "#0b0d12",
  stone: "#15171c",
  stem: "#1d2a16",
  mist: "#7d8fb0",
  hitodama: "#cfe6ff",
  shadow: "#06070b",
} as const;

export const FOG_DENSITY = 0.018; // calibration knob: 0.012–0.03 — higher swallows the torii, lower flattens the depth

/** Value noise and fbm for the portal, mist, sky and moon shaders. */
export const NOISE = /* glsl */ `
float hash21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise2(p);
    p = p * 2.03 + 17.0;
    a *= 0.5;
  }
  return v;
}
`;

let epoch = -1;
/**
 * Sanzu time in seconds, counted from the first Sanzu frame this session, so the descent's Sanzu and the backdrop's
 * agree at the handoff (the boat is where it was). Frozen at 0 under reduced motion: one still frame.
 */
export function sanzuClock(elapsed: number): number {
  if (scene.reducedMotion) return 0;
  if (epoch < 0) epoch = elapsed;
  return elapsed - epoch;
}
```

- [ ] **Step 2: Write** `components/experience/wisps.ts` (the old `buildWisps` from `styx.tsx`, with options; soft-edged and tone-mapped so it matches on both tiers)

```ts
import * as THREE from "three";

const wispVertex = /* glsl */ `
uniform float uTime;
uniform float uHeight;
uniform float uSize;
uniform float uMaxSize;
uniform float uSpeed;
uniform float uPixelRatio;
attribute float aRand;
varying float vAlpha;
void main() {
  vec3 p = position;
  p.y = mod(p.y + uTime * uSpeed * (0.4 + aRand * 0.6), uHeight);
  p.x += sin(uTime * 0.5 + aRand * 20.0) * 0.3;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  // Capped, so a mote drifting past the lens stays a mote, not a blob over the footer.
  gl_PointSize = min(uSize * uPixelRatio / -mv.z, uMaxSize * uPixelRatio);
  vAlpha = sin(3.14159 * p.y / uHeight);
}
`;

const wispFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uIntensity;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  gl_FragColor = vec4(uColor * uIntensity, vAlpha * uOpacity * 0.8 * pow(1.0 - d, 1.5));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export type WispOptions = { color: string; size?: number; maxSize?: number; speed?: number; intensity?: number };

/** Motes rising through a width×height×width box (x, z centred on 0; y from 0 up): shaft wisps, hitodama, shadow smoke. */
export function buildWisps(count: number, width: number, height: number, { color, size = 28, maxSize = 4, speed = 1, intensity = 1 }: WispOptions) {
  const pos = new Float32Array(count * 3);
  const rand = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos.set([(Math.random() - 0.5) * width, Math.random() * height, (Math.random() - 0.5) * width], i * 3);
    rand[i] = Math.random();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uHeight: { value: height },
      uSize: { value: size },
      uMaxSize: { value: maxSize },
      uSpeed: { value: speed },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: 1 },
      uIntensity: { value: intensity },
    },
    vertexShader: wispVertex,
    fragmentShader: wispFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(g, material);
  points.frustumCulled = false;
  return { points, material };
}
```

- [ ] **Step 3: Write** `components/experience/sanzu/torii.ts`

```ts
import * as THREE from "three";
import { INK } from "./common";

// calibration knob: x/z place the Gate right of centre from RIVER_CAMERA (x 3–6, z -13 to -20). The portal fills
// the opening under the nuki: its size follows the pillar spacing below, so change them together.
export const TORII = { x: 4, z: -16, portalY: 2.76, portalW: 4.5, portalH: 5.3 } as const;

/** A beam whose ends sweep upward, the torii's signature curve: y += lift · (x / half)^4. */
function sweptBeam(length: number, height: number, depth: number, lift: number) {
  const g = new THREE.BoxGeometry(length, height, depth, 32, 1, 1);
  const p = g.attributes.position as THREE.BufferAttribute;
  const half = length / 2;
  for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + lift * (p.getX(i) / half) ** 4);
  g.computeVertexNormals();
  return g;
}

/** A vermilion lacquered torii standing a metre deep in the river. Few pieces, strong silhouette. */
export function buildTorii() {
  const lacquer = new THREE.MeshPhysicalMaterial({ color: INK.lily, roughness: 0.42, clearcoat: 1, clearcoatRoughness: 0.18 });
  const black = new THREE.MeshStandardMaterial({ color: "#0c0d10", roughness: 0.55 });
  const group = new THREE.Group();
  group.position.set(TORII.x, 0, TORII.z);
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number) => {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(x, y, 0);
    group.add(m);
  };
  const pillar = new THREE.CylinderGeometry(0.3, 0.36, 8.2, 32); // hashira: a touch thicker at the foot
  const collar = new THREE.CylinderGeometry(0.44, 0.44, 0.7, 32); // nemaki: the black sleeve at the waterline
  for (const s of [-1, 1]) {
    add(pillar, lacquer, s * 2.6, 3.1); // y -1.0 … 7.2
    add(collar, black, s * 2.6, -0.05);
  }
  add(new THREE.BoxGeometry(6.6, 0.34, 0.36), lacquer, 0, 5.6); // nuki: the tie beam through both pillars
  add(new THREE.BoxGeometry(0.4, 1.0, 0.3), lacquer, 0, 6.3); // gakuzuka: the strut to the lintel
  add(sweptBeam(7.6, 0.34, 0.5, 0.2), lacquer, 0, 6.95); // shimaki
  add(sweptBeam(8.8, 0.3, 0.62, 0.45), black, 0, 7.35); // kasagi, capped black
  return {
    group,
    dispose() {
      group.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
      lacquer.dispose();
      black.dispose();
    },
  };
}
```

- [ ] **Step 4: Write** `components/experience/sanzu/portal.ts`

```ts
import * as THREE from "three";
import { INK, NOISE } from "./common";

const vertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragment = /* glsl */ `
uniform float uTime;
uniform float uOpacity;
uniform float uIntensity;
uniform vec3 uCore;
uniform vec3 uRim;
varying vec2 vUv;
${NOISE}
void main() {
  vec2 c = (vUv - 0.5) * 2.0; // the plane's own aspect makes it an ellipse between the pillars
  float r = length(c);
  if (r > 1.0) discard;
  // Arms that wind tighter toward the centre and turn slowly: rotate the noise lookup by an angle that grows inward.
  float twist = uTime * 0.35 + 2.4 / (r + 0.35);
  vec2 q = mat2(cos(twist), -sin(twist), sin(twist), cos(twist)) * c;
  float arms = smoothstep(0.42, 0.85, fbm(q * 2.6 + vec2(0.0, -uTime * 0.12)));
  float core = pow(1.0 - r, 2.4);
  float rim = smoothstep(0.62, 0.93, r) * (1.0 - smoothstep(0.93, 1.0, r));
  vec3 col = mix(uRim, uCore, clamp(core * 1.6 + arms * (1.0 - r) * 0.5, 0.0, 1.0));
  float glow = core * 1.6 + arms * (0.35 + 0.65 * (1.0 - r)) + rim * 0.8;
  float edge = 1.0 - smoothstep(0.88, 1.0, r);
  gl_FragColor = vec4(col * glow * uIntensity, edge * uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/**
 * The Gate's portal: a swirling System-blue core with a Monarch-violet rim — the brightest thing in the frame.
 * HDR (values above 1) so it blooms; additive. Used on the torii and as the descent's approach disc.
 */
export function createPortalMaterial(intensity = 2.6) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uIntensity: { value: intensity }, // calibration knob: 1.8–3.5
      uCore: { value: new THREE.Color(INK.system) },
      uRim: { value: new THREE.Color(INK.monarch) },
    },
    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}
```

- [ ] **Step 5: Write** `components/experience/sanzu/sky.ts`

```ts
import * as THREE from "three";
import { NOISE, SANZU } from "./common";

// calibration knob: just above the torii's kasagi as seen from RIVER_CAMERA; stay inside the dome (radius 180).
export const MOON_POS: [number, number, number] = [20, 17, -120];

const skyVertex = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const skyFragment = /* glsl */ `
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uGlow;
uniform vec3 uMoonDir;
uniform float uTime;
varying vec3 vDir;
${NOISE}
void main() {
  vec3 d = normalize(vDir);
  vec3 col = mix(uHorizon, uZenith, smoothstep(-0.02, 0.5, d.y));
  float m = max(dot(d, uMoonDir), 0.0);
  col += uGlow * (pow(m, 40.0) * 0.5 + pow(m, 8.0) * 0.12);
  // Faint stars: about one cell in 1200, gone toward the horizon haze, each twinkling at its own rate.
  vec2 cell = floor(vec2(atan(d.z, d.x), asin(clamp(d.y, -1.0, 1.0))) * 700.0);
  float s = hash21(cell);
  float star = step(0.99915, s) * smoothstep(0.05, 0.4, d.y) * (0.55 + 0.45 * sin(uTime * (0.8 + s * 2.0) + s * 60.0));
  col += vec3(0.78, 0.84, 1.0) * star * 0.8;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const moonVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const moonFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
varying vec2 vUv;
${NOISE}
void main() {
  vec2 c = (vUv - 0.5) * 2.0;
  float r = length(c);
  if (r > 1.0) discard;
  float limb = 0.72 + 0.28 * sqrt(1.0 - r * r);
  float maria = noise2(c * 3.0 + 1.7) * 0.2 + noise2(c * 7.0) * 0.08;
  gl_FragColor = vec4(uColor * uIntensity * limb * (1.0 - maria), 1.0 - smoothstep(0.96, 1.0, r));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/** Ink sky with a moon-glow and faint stars. Unfogged; drawn first, behind everything. */
export function buildSky() {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uZenith: { value: new THREE.Color(SANZU.zenith) },
      uHorizon: { value: new THREE.Color(SANZU.horizon) },
      uGlow: { value: new THREE.Color(SANZU.skyGlow) },
      uMoonDir: { value: new THREE.Vector3(...MOON_POS).normalize() },
      uTime: { value: 0 },
    },
    vertexShader: skyVertex,
    fragmentShader: skyFragment,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(180, 48, 24), material);
  mesh.renderOrder = -10;
  return { mesh, material, dispose: () => (mesh.geometry.dispose(), material.dispose()) };
}

/** A pale low moon, HDR so it blooms. Faces +z, toward the river camera. */
export function buildMoon() {
  const material = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(SANZU.moon) }, uIntensity: { value: 1.9 } }, // calibration knob: 1.2–2.5
    vertexShader: moonVertex,
    fragmentShader: moonFragment,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(4.2, 64), material);
  mesh.position.set(...MOON_POS);
  mesh.renderOrder = -9;
  return { mesh, material, dispose: () => (mesh.geometry.dispose(), material.dispose()) };
}
```

- [ ] **Step 6: Write** `components/experience/sanzu/water.ts`

```ts
import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { SANZU } from "./common";
import { MOON_POS } from "./sky";

const vertex = /* glsl */ `
#ifdef REFLECT
uniform mat4 textureMatrix;
varying vec4 vUv;
#endif
varying vec3 vWorld;
#include <common>
#include <fog_pars_vertex>
void main() {
  #ifdef REFLECT
  vUv = textureMatrix * vec4(position, 1.0);
  #endif
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  vec4 mvPosition = viewMatrix * w;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

// Mirror-black water. Normal tier: the Reflector's texture, bent by two travelling ripple fields, weighted by
// Fresnel. Low tier: a glossy gradient toward the horizon instead. Both: a moon path and a dark foreground.
const fragment = /* glsl */ `
uniform vec3 color;
uniform float uTime;
uniform vec3 uMoon;
uniform vec3 uMoonColor;
uniform float uStreak;
uniform float uNear;
#ifdef REFLECT
uniform sampler2D tDiffuse;
uniform float uDistort;
uniform float uReflect;
varying vec4 vUv;
#else
uniform vec3 uHorizon;
#endif
varying vec3 vWorld;
#include <common>
#include <fog_pars_fragment>
void main() {
  vec2 p = vWorld.xz;
  vec2 ripple = vec2(
    sin(p.x * 0.9 + uTime * 0.7) + sin(p.y * 1.7 - uTime * 0.5),
    cos(p.y * 1.1 + uTime * 0.6) + sin(p.x * 1.3 - uTime * 0.45)
  ) * 0.5;
  vec3 toFrag = vWorld - cameraPosition;
  float d = length(toFrag.xz);
  float fres = 0.04 + 0.96 * pow(1.0 - clamp(normalize(-toFrag).y, 0.0, 1.0), 5.0);
  vec3 col = color;
  #ifdef REFLECT
  vec4 uv = vUv;
  uv.xy += ripple * uDistort * uv.w;
  col += texture2DProj(tDiffuse, uv).rgb * fres * uReflect;
  #else
  col = mix(col, uHorizon, fres * 0.9);
  #endif
  // The moon's path: a band straight below the moon (x/z only, so the descent's y offset doesn't matter).
  float a = atan(toFrag.x, -toFrag.z);
  float m = atan(uMoon.x - cameraPosition.x, -(uMoon.z - cameraPosition.z));
  float band = exp(-pow((a - m) * 24.0, 2.0));
  float glitter = smoothstep(0.2, 1.0, ripple.x * 0.6 + ripple.y * 0.4 + 0.3);
  col += uMoonColor * band * glitter * uStreak * smoothstep(4.0, 24.0, d);
  // Foreground stays dark, so the footer credit reads over it (the lesson from Task 8 of the first plan).
  col *= mix(uNear, 1.0, smoothstep(2.0, 12.0, d));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`;

const SIZE = 400;

function uniforms(): Record<string, THREE.IUniform> {
  return THREE.UniformsUtils.merge([
    THREE.UniformsLib.fog,
    {
      uTime: { value: 0 },
      uMoon: { value: new THREE.Vector3(...MOON_POS) },
      uMoonColor: { value: new THREE.Color(SANZU.moon) },
      uStreak: { value: 0.35 }, // calibration knob: moon path brightness, 0.15–0.6
      uNear: { value: 0.15 }, // calibration knob: foreground brightness under the footer, 0–0.3
    },
  ]);
}

/** The river. The normal tier reflects the scene (torii, portal, lanterns, moon); the low tier fakes it. */
export function buildWater(low: boolean) {
  const geometry = new THREE.PlaneGeometry(SIZE, SIZE);
  if (low) {
    const material = new THREE.ShaderMaterial({
      uniforms: { ...uniforms(), color: { value: new THREE.Color(SANZU.water) }, uHorizon: { value: new THREE.Color(SANZU.horizon) } },
      vertexShader: vertex,
      fragmentShader: fragment,
      fog: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    return { mesh, uniforms: material.uniforms, dispose: () => (geometry.dispose(), material.dispose()) };
  }
  const dpr = Math.min(window.devicePixelRatio, 2);
  const scale = 0.5; // calibration knob: reflection resolution vs the screen, 0.35–0.75 (the ripples soften it anyway)
  const mesh = new Reflector(geometry, {
    textureWidth: Math.round(window.innerWidth * dpr * scale),
    textureHeight: Math.round(window.innerHeight * dpr * scale),
    clipBias: 0.003,
    multisample: 0,
    color: SANZU.water,
    shader: {
      name: "SanzuWater",
      uniforms: {
        ...uniforms(),
        color: { value: null },
        tDiffuse: { value: null },
        textureMatrix: { value: null },
        uDistort: { value: 0.012 }, // calibration knob: ripple bend of the reflection, 0.005–0.03
        uReflect: { value: 0.9 },
      },
      vertexShader: "#define REFLECT\n" + vertex,
      fragmentShader: "#define REFLECT\n" + fragment,
    },
  });
  const material = mesh.material as THREE.ShaderMaterial;
  material.fog = true;
  mesh.rotation.x = -Math.PI / 2;
  return { mesh, uniforms: material.uniforms, dispose: () => (mesh.dispose(), geometry.dispose()) };
}
```

- [ ] **Step 7: Write** `components/experience/sanzu/index.tsx`

```tsx
"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera, View } from "@react-three/drei";
import * as THREE from "three";
import { DESCENT_FOV, riverCamera } from "@/lib/descent";
import { scene } from "@/lib/scene";
import Bloom, { GlowSprite } from "../bloom";
import SceneBoundary from "../scene-boundary";
import { FOG_DENSITY, INK, SANZU, sanzuClock } from "./common";
import { createPortalMaterial } from "./portal";
import { MOON_POS, buildMoon, buildSky } from "./sky";
import { TORII, buildTorii } from "./torii";
import { buildWater } from "./water";

const one = () => 1;

/** The Sanzu (redesign spec §3). Local origin on the waterline; riverCamera() frames it. fade() === 0 hides it (the descent's cut). */
export function Sanzu({ fade = one }: { fade?: () => number }) {
  const low = scene.tier === "low";
  const sky = useMemo(() => buildSky(), []);
  const moon = useMemo(() => buildMoon(), []);
  const water = useMemo(() => buildWater(low), [low]);
  const torii = useMemo(() => buildTorii(), []);
  const portal = useMemo(() => createPortalMaterial(), []);
  const moonTarget = useMemo(() => new THREE.Object3D(), []);
  const root = useRef<THREE.Group>(null);
  useEffect(
    () => () => {
      sky.dispose();
      moon.dispose();
      water.dispose();
      torii.dispose();
      portal.dispose();
    },
    [sky, moon, water, torii, portal],
  );

  // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
  useFrame(({ clock }) => {
    const shown = fade() > 0;
    if (root.current) root.current.visible = shown;
    if (!shown) return;
    const time = sanzuClock(clock.elapsedTime);
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    sky.material.uniforms.uTime.value = time;
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    water.uniforms.uTime.value = time;
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    portal.uniforms.uTime.value = time;
  });

  return (
    <group ref={root}>
      <primitive object={sky.mesh} />
      <primitive object={moon.mesh} />
      <primitive object={water.mesh} />
      <primitive object={torii.group} />
      <mesh position={[TORII.x, TORII.portalY, TORII.z]} material={portal} renderOrder={2}>
        <planeGeometry args={[TORII.portalW, TORII.portalH]} />
      </mesh>
      {/* The light's target lives in this group, so the moonlight keeps its angle when the descent offsets the Sanzu. */}
      <primitive object={moonTarget} />
      {/* calibration knob: light intensities — moon 0.6–1.2, fill 0.2–0.6, portal 15–45. */}
      {/* Moonlight from behind the torii: the Gate reads as a silhouette with a lit rim. */}
      <directionalLight position={MOON_POS} target={moonTarget} color={SANZU.moonlight} intensity={0.9} />
      {!low && <hemisphereLight args={[SANZU.skyFill, INK.abyss, 0.4]} />}
      {/* The portal's violet spill on the pillars: the one light the low tier keeps besides the moon. */}
      <pointLight position={[TORII.x, TORII.portalY, TORII.z + 0.8]} color={INK.monarch} intensity={30} distance={34} decay={2} />
      <GlowSprite position={[TORII.x, TORII.portalY, TORII.z + 0.05]} size={11} color={INK.system} intensity={0.55} />
      <GlowSprite position={MOON_POS} size={30} color={SANZU.moon} intensity={0.3} />
    </group>
  );
}

/** Holds the backdrop camera on the river pose for this screen's shape: the descent lands on the same pose. */
function Rig() {
  useFrame(({ camera }) => {
    const pose = riverCamera(window.innerWidth / window.innerHeight);
    camera.position.set(...pose.position);
    camera.rotation.set(pose.pitch, 0, 0, "YXZ");
  });
  return null;
}

/** While the crossing covers the page, the crossing's own view draws; the backdrop sits out. */
const crossingActive = () => "crossing" in document.documentElement.dataset;

/** The /underworld backdrop: the Sanzu from exactly where the descent lands. */
export function SanzuBackdrop() {
  return (
    <div aria-hidden className="fixed inset-0 z-0">
      <View className="size-full" visible={false}>
        <PerspectiveCamera makeDefault fov={DESCENT_FOV} near={0.1} far={400} />
        <Rig />
        <fogExp2 attach="fog" args={[SANZU.fog, FOG_DENSITY]} />
        <Bloom paused={crossingActive} />
        <SceneBoundary fallback={null}>
          <Sanzu />
        </SceneBoundary>
      </View>
    </div>
  );
}
```

- [ ] **Step 8: Switch the realm and the descent to the Sanzu, and delete the Styx.**
- `components/underworld/realm.tsx`: replace `import { StyxBackdrop } from "@/components/experience/styx";` with `import { SanzuBackdrop } from "@/components/experience/sanzu";`, and `<StyxBackdrop />` with `<SanzuBackdrop />`.
- `components/experience/descent-scene.tsx`:
  - Replace `import { COLD, Styx, buildWisps } from "./styx";` with:

```tsx
import { buildWisps } from "./wisps";
import { Sanzu } from "./sanzu";
import { INK } from "./sanzu/common";
```

  - Replace `COLD.asphodel` with `INK.mist`, `COLD.abyss` with `INK.abyss`, and `COLD.soulfire` with `INK.system`.
  - Replace `buildWisps(low ? 250 : 600, 6, 36)` with `buildWisps(low ? 250 : 600, 6, 36, { color: INK.system })`.
  - Rename `styxFade` to `sanzuFade` (both places), and replace `<Styx fade={styxFade} />` with `<Sanzu fade={sanzuFade} />`.
- `git rm components/experience/styx.tsx`

- [ ] **Step 9: Remove the isle** (moved here from Task 3; see the order note at the top).
- `scripts/fetch-art.mjs`: delete the two `// Böcklin, Island of the Dead …` / `// Lit rock and the figure …` comment lines and the `{ name: "isle", … }` entry.
- `public/art/manifest.json`: delete the `"name": "isle"` object (and the comma before it).
- `components/sections/art.tsx`: change the type to `export type ArtName = "colosseum" | "carceri" | "sant-angelo" | "bust" | "krater";`.
- `git rm public/art/isle.png`

Run: `grep -rn "isle" app components lib scripts public/art/manifest.json`
Expected: no output.

- [ ] **Step 10: Gates**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: all green.

- [ ] **Step 11: Browser check.** `npm run dev`, first fixture, `/underworld`, Playwright screenshots at 1440×900 (normal tier) and 390×844 (reload at that size: low tier).
- 1440×900 passes when:
  - The torii is vermilion, its centre between 55% and 75% of the width, the kasagi below the top edge, and the pillars standing in the water with their reflections visible.
  - The portal is the brightest element: a blue core, a violet rim, slowly turning (two screenshots 2s apart differ in the portal only).
  - The moon sits behind or just above the torii, with a broken light path on the water below it.
  - The bottom ~15% of the frame (under the footer) is near-black water; scroll to the footer and the credit reads cleanly.
  - The RYUMA title sits over the darker left half.
  - The torii has a violet sheen on its inner pillar faces and a crisp edge; only emissives glow.
  - There are no dither dots anywhere in the Sanzu, and no console errors.
- 390×844 (low tier) passes when there is no reflector (gradient water with a moon streak), the portal and moon have soft halos, and the torii is fully in frame (Task 6 finishes the portrait framing).
- `/` is unchanged. The descent still ends on the Sanzu (it isn't tone-mapped until Task 8, which is expected).
- Tune only the knobs marked in this task, within their bounds, against these screenshots.

- [ ] **Step 12: Commit**

```bash
git add components/experience/sanzu components/experience/wisps.ts components/experience/descent-scene.tsx components/underworld/realm.tsx scripts/fetch-art.mjs public/art/manifest.json components/sections/art.tsx
git add -u components/experience/styx.tsx public/art/isle.png
git commit -m "feat: the sanzu gate — torii, portal, water and moon"
```

---
### Task 6: The Sanzu II — lanterns, lilies, boat, hitodama, mist, parallax, portrait

Load `emil-design-eng`, `impeccable:impeccable`, `taste-skill:taste-skill` and `apple-design` first.

**Files:**
- Create: `components/experience/sanzu/lanterns.ts`, `lilies.ts`, `mist.ts`
- Replace: `components/experience/sanzu/index.tsx`
- Modify (calibration only): `lib/descent.ts` (`RIVER_CAMERA_PORTRAIT` values)

**Interfaces:**
- Consumes: Task 5's `common.ts`, `torii.ts`, `portal.ts`, `water.ts`, `sky.ts`, `wisps.ts`; `bloomOn`, `GlowSprite`, `Bloom` (Task 4); `riverCamera` (Task 2)
- Produces:
  - `lanterns.ts`: `LANTERN`, `type Lanterns = { mesh: THREE.Mesh; halos: THREE.Points; offsets: Float32Array; seeds: Float32Array; uniforms: { uTime: THREE.IUniform<number> }; dispose(): void }`, `buildLanterns(count: number): Lanterns`, `lanternCenter(l: Lanterns, i: number, time: number, out: THREE.Vector3): number` (returns the 0–1 wrap scale)
  - `lilies.ts`: `BANK`, `bankHeight(x: number, z: number): number`, `buildLilies(count: number): { group: THREE.Group; uniforms: Record<string, THREE.IUniform>; dispose(): void }`
  - `mist.ts`: `buildMist(layers: number): { group: THREE.Group; uniforms: { uTime: THREE.IUniform<number> }; dispose(): void }`
  - `index.tsx`: `<Sanzu fade? />` and `<SanzuBackdrop />`, with the same signatures as Task 5

- [ ] **Step 1: Write** `components/experience/sanzu/lanterns.ts`

```ts
import * as THREE from "three";
import { SANZU } from "./common";

// calibration knob: the drift band (x span centred on centerX; z from near to far) and the flow speed in units/s (0.05–0.25).
export const LANTERN = { span: 36, centerX: 2, near: -3, far: -38, y: 0.02, speed: 0.12 } as const;

// Shared by the lanterns and their halos, and mirrored by lanternCenter() below for the two point lights.
const drift = /* glsl */ `
uniform float uTime;
uniform float uSpan;
uniform float uCenterX;
uniform float uSpeed;
// xyz: the lantern's base on the water; w: 0–1 scale, shrinking to nothing where the band wraps round.
vec4 lanternCenter(vec3 offset, float seed) {
  float left = uCenterX - uSpan * 0.5;
  float x = left + mod(offset.x - left + uTime * uSpeed * (1.0 + seed * 0.7), uSpan);
  float edge = smoothstep(0.0, 2.5, min(x - left, left + uSpan - x));
  return vec4(x, offset.y + sin(uTime * 1.3 + seed * 40.0) * 0.03, offset.z, edge);
}
`;

const bodyVertex = /* glsl */ `
attribute vec3 aOffset;
attribute float aSeed;
varying vec2 vUv;
varying float vFlicker;
${drift}
#include <common>
#include <fog_pars_vertex>
void main() {
  vec4 c = lanternCenter(aOffset, aSeed);
  float tilt = sin(uTime * 0.9 + aSeed * 17.0) * 0.07;
  float yaw = aSeed * 6.2831;
  vec3 p = position * c.w;
  p.xy = mat2(cos(tilt), sin(tilt), -sin(tilt), cos(tilt)) * p.xy;
  p.xz = mat2(cos(yaw), sin(yaw), -sin(yaw), cos(yaw)) * p.xz;
  vec4 mvPosition = modelViewMatrix * vec4(p + c.xyz, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  vUv = uv;
  vFlicker = 0.88 + 0.12 * sin(uTime * 7.0 + aSeed * 90.0) * sin(uTime * 3.1 + aSeed * 13.0);
  #include <fog_vertex>
}
`;

// Paper faces lit from inside, hottest at the centre where the candle is, with a dark wooden frame round each face.
const bodyFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
varying vec2 vUv;
varying float vFlicker;
#include <common>
#include <fog_pars_fragment>
void main() {
  vec2 e = min(vUv, 1.0 - vUv);
  float frame = 1.0 - smoothstep(0.03, 0.08, min(e.x, e.y));
  float hot = 1.0 - length(vUv - 0.5) * 1.2;
  vec3 paper = uColor * uIntensity * vFlicker * (0.55 + 0.45 * hot);
  gl_FragColor = vec4(mix(paper, vec3(0.04, 0.025, 0.015), frame), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`;

// The bloom fallback: a soft amber halo per lantern, drawn only when real bloom is off.
const haloVertex = /* glsl */ `
attribute vec3 aOffset;
attribute float aSeed;
uniform float uSize;
uniform float uPixelRatio;
${drift}
void main() {
  vec4 c = lanternCenter(aOffset, aSeed);
  vec4 mv = modelViewMatrix * vec4(c.xyz + vec3(0.0, 0.18, 0.0), 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * uPixelRatio * c.w / -mv.z;
}
`;

const haloFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  gl_FragColor = vec4(uColor * uIntensity, pow(max(0.0, 1.0 - d), 2.0));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export type Lanterns = {
  mesh: THREE.Mesh;
  halos: THREE.Points;
  offsets: Float32Array;
  seeds: Float32Array;
  uniforms: { uTime: THREE.IUniform<number> };
  dispose(): void;
};

/** Tōrō nagashi: paper lanterns drifting downstream and bobbing, all in one instanced draw. Motion is in the shader. */
export function buildLanterns(count: number): Lanterns {
  const offsets = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    offsets.set([LANTERN.centerX + (Math.random() - 0.5) * LANTERN.span, LANTERN.y, LANTERN.near + Math.random() * (LANTERN.far - LANTERN.near)], i * 3);
    seeds[i] = Math.random();
  }
  // Slots 0 and 1 carry the two real point lights: start them near, where their light lands on water in frame.
  offsets.set([-1, LANTERN.y, -6], 0);
  offsets.set([7, LANTERN.y, -9], 3);

  // Shared uniform objects: one write per frame moves the lanterns and their halos together.
  const drifting = { uTime: { value: 0 }, uSpan: { value: LANTERN.span }, uCenterX: { value: LANTERN.centerX }, uSpeed: { value: LANTERN.speed } };

  const box = new THREE.BoxGeometry(0.3, 0.36, 0.3).translate(0, 0.18, 0);
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setIndex(box.index);
  for (const [name, attr] of Object.entries(box.attributes)) geometry.setAttribute(name, attr);
  geometry.setAttribute("aOffset", new THREE.InstancedBufferAttribute(offsets, 3));
  geometry.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 1));
  geometry.instanceCount = count;
  const material = new THREE.ShaderMaterial({
    uniforms: {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      ...drifting,
      uColor: { value: new THREE.Color(SANZU.lantern) },
      uIntensity: { value: 2.4 }, // calibration knob: 1.5–3.5 (HDR: above the bloom threshold)
    },
    vertexShader: bodyVertex,
    fragmentShader: bodyFragment,
    fog: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false; // positions come from the shader

  const haloGeometry = new THREE.BufferGeometry();
  haloGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  haloGeometry.setAttribute("aOffset", new THREE.BufferAttribute(offsets, 3));
  haloGeometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  const haloMaterial = new THREE.ShaderMaterial({
    uniforms: {
      ...drifting,
      uColor: { value: new THREE.Color(SANZU.lantern) },
      uIntensity: { value: 0.9 },
      uSize: { value: 650 }, // calibration knob: halo size, 400–900
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    },
    vertexShader: haloVertex,
    fragmentShader: haloFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const halos = new THREE.Points(haloGeometry, haloMaterial);
  halos.frustumCulled = false;

  return {
    mesh,
    halos,
    offsets,
    seeds,
    uniforms: drifting,
    dispose() {
      box.dispose();
      geometry.dispose();
      material.dispose();
      haloGeometry.dispose();
      haloMaterial.dispose();
    },
  };
}

const smooth = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

/** The JS twin of the shader's lanternCenter(): writes lantern i's base into `out` and returns its 0–1 scale. */
export function lanternCenter(l: Lanterns, i: number, time: number, out: THREE.Vector3): number {
  const left = LANTERN.centerX - LANTERN.span / 2;
  const seed = l.seeds[i];
  const raw = l.offsets[i * 3] - left + time * LANTERN.speed * (1 + seed * 0.7);
  const x = left + (((raw % LANTERN.span) + LANTERN.span) % LANTERN.span);
  out.set(x, l.offsets[i * 3 + 1] + Math.sin(time * 1.3 + seed * 40) * 0.03, l.offsets[i * 3 + 2]);
  return smooth(Math.min(x - left, left + LANTERN.span - x) / 2.5);
}
```

- [ ] **Step 2: Write** `components/experience/sanzu/lilies.ts`

```ts
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { INK, SANZU } from "./common";
import { MOON_POS } from "./sky";

// calibration knob: the bank's footprint in the lower-left foreground. Keep lilies out of the bottom ~15% of the
// frame at 1440×900, where the footer sits (maxZ ≤ 3.5 from RIVER_CAMERA).
export const BANK = { minX: -9, maxX: -1.2, minZ: -5, maxZ: 3 } as const;

/** The bank's height above the water at (x, z): it rises gently to the left and slips under at its edge. */
export function bankHeight(x: number, z: number): number {
  return Math.min(0.55, Math.max(-0.3, (-x - 1.0) * 0.14)) + Math.sin(x * 1.7) * Math.cos(z * 1.3) * 0.05;
}

/** One higanbana: a bare stem, six thin petals that arc out and curl back, and six long stamens. About 0.6 tall. */
function lilyGeometry() {
  const parts: THREE.BufferGeometry[] = [new THREE.CylinderGeometry(0.008, 0.012, 0.5, 5, 1, true).translate(0, 0.25, 0)];
  for (let i = 0; i < 6; i++) {
    const petal = new THREE.PlaneGeometry(0.03, 0.17, 1, 5).translate(0, 0.085, 0);
    const p = petal.attributes.position as THREE.BufferAttribute;
    for (let k = 0; k < p.count; k++) {
      const t = p.getY(k) / 0.17;
      p.setZ(k, t * t * 0.07); // the curl back at the tip
    }
    petal.computeVertexNormals();
    parts.push(petal.rotateX(-1.05).rotateY((i / 6) * Math.PI * 2).translate(0, 0.5, 0));
    parts.push(
      new THREE.CylinderGeometry(0.0025, 0.0025, 0.22, 3, 1, true)
        .translate(0, 0.11, 0)
        .rotateX(-0.55)
        .rotateY(((i + 0.5) / 6) * Math.PI * 2)
        .translate(0, 0.5, 0),
    );
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((g) => g.dispose());
  return merged;
}

const vertex = /* glsl */ `
uniform float uTime;
attribute vec3 aOffset;
attribute float aSeed;
attribute float aScale;
varying vec3 vNormalW;
varying vec3 vWorld;
varying float vHeight;
#include <common>
#include <fog_pars_vertex>
void main() {
  float yaw = aSeed * 6.2831;
  mat2 r = mat2(cos(yaw), sin(yaw), -sin(yaw), cos(yaw));
  vec3 p = position * aScale;
  p.xz = r * p.xz;
  vec3 n = normal;
  n.xz = r * n.xz;
  // Sway grows with the square of height: the root stays planted and the flower head moves.
  float h = position.y / 0.55;
  float sway = sin(uTime * 1.1 + aSeed * 30.0 + aOffset.x * 0.8) * 0.06 + sin(uTime * 2.3 + aSeed * 11.0) * 0.02;
  p.x += sway * h * h;
  p.z += sway * 0.5 * h * h;
  vec4 w = modelMatrix * vec4(p + aOffset, 1.0);
  vWorld = w.xyz;
  vNormalW = normalize(mat3(modelMatrix) * n);
  vHeight = position.y;
  vec4 mvPosition = viewMatrix * w;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

const fragment = /* glsl */ `
uniform vec3 uPetal;
uniform vec3 uStem;
uniform vec3 uMoonDir;
uniform vec3 uMoonColor;
varying vec3 vNormalW;
varying vec3 vWorld;
varying float vHeight;
#include <common>
#include <fog_pars_fragment>
void main() {
  vec3 n = normalize(vNormalW);
  if (!gl_FrontFacing) n = -n;
  bool flower = vHeight > 0.46;
  vec3 base = flower ? uPetal : uStem;
  float diff = max(dot(n, uMoonDir), 0.0);
  float rim = pow(1.0 - max(dot(n, normalize(cameraPosition - vWorld)), 0.0), 3.0);
  // A little self-light so the red reads at night; the moon behind the bank gives each flower a cold rim.
  vec3 col = base * (0.22 + diff * uMoonColor * 0.9) + uMoonColor * rim * (flower ? 0.35 : 0.1);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`;

/** A bank of red spider lilies on dark wet stone, lower-left foreground. One instanced draw; sway in the vertex shader. */
export function buildLilies(count: number) {
  const offsets = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const scales = new Float32Array(count);
  // Clumps, not a carpet: each lily picks one of 28 clump centres and scatters round it.
  const clumps = Array.from({ length: 28 }, () => [BANK.minX + Math.random() * (BANK.maxX - BANK.minX), BANK.minZ + Math.random() * (BANK.maxZ - BANK.minZ)]);
  for (let i = 0; i < count; i++) {
    let x = 0;
    let z = 0;
    for (let k = 0; k < 8; k++) {
      const [cx, cz] = clumps[Math.floor(Math.random() * clumps.length)];
      x = Math.min(BANK.maxX, Math.max(BANK.minX, cx + (Math.random() - 0.5) * 1.2));
      z = Math.min(BANK.maxZ, Math.max(BANK.minZ, cz + (Math.random() - 0.5) * 1.2));
      if (bankHeight(x, z) > 0.03) break; // retry until it lands on dry bank
    }
    offsets.set([x, Math.max(0, bankHeight(x, z)), z], i * 3);
    seeds[i] = Math.random();
    scales[i] = 0.8 + Math.random() * 0.45;
  }

  const lily = lilyGeometry();
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setIndex(lily.index);
  for (const [name, attr] of Object.entries(lily.attributes)) geometry.setAttribute(name, attr);
  geometry.setAttribute("aOffset", new THREE.InstancedBufferAttribute(offsets, 3));
  geometry.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 1));
  geometry.setAttribute("aScale", new THREE.InstancedBufferAttribute(scales, 1));
  geometry.instanceCount = count;
  const material = new THREE.ShaderMaterial({
    uniforms: {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      uTime: { value: 0 },
      uPetal: { value: new THREE.Color(INK.lily) },
      uStem: { value: new THREE.Color(SANZU.stem) },
      uMoonDir: { value: new THREE.Vector3(...MOON_POS).normalize() },
      uMoonColor: { value: new THREE.Color(SANZU.moonlight) },
    },
    vertexShader: vertex,
    fragmentShader: fragment,
    side: THREE.DoubleSide,
    fog: true,
  });
  const flowers = new THREE.Mesh(geometry, material);
  flowers.frustumCulled = false;

  // The bank: dark wet stone, glossy enough to catch the moon.
  const ground = new THREE.PlaneGeometry(16, 16, 48, 48).rotateX(-Math.PI / 2).translate(-8.2, 0, -1);
  const gp = ground.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < gp.count; i++) gp.setY(i, bankHeight(gp.getX(i), gp.getZ(i)));
  ground.computeVertexNormals();
  const stone = new THREE.MeshStandardMaterial({ color: SANZU.stone, roughness: 0.32 });
  const bank = new THREE.Mesh(ground, stone);

  const group = new THREE.Group();
  group.add(bank, flowers);
  return {
    group,
    uniforms: material.uniforms,
    dispose() {
      lily.dispose();
      geometry.dispose();
      material.dispose();
      ground.dispose();
      stone.dispose();
    },
  };
}
```

- [ ] **Step 3: Write** `components/experience/sanzu/mist.ts`

```ts
import * as THREE from "three";
import { NOISE, SANZU } from "./common";

// calibration knob: depth, width, height and opacity per bank (opacity 0.08–0.3). The low tier keeps every other one.
const LAYERS = [
  { z: -7, w: 44, h: 2.2, opacity: 0.12 },
  { z: -15, w: 64, h: 3.2, opacity: 0.16 },
  { z: -26, w: 96, h: 4.6, opacity: 0.18 },
  { z: -44, w: 150, h: 7, opacity: 0.22 },
];

const vertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragment = /* glsl */ `
uniform float uTime;
uniform float uOpacity;
uniform float uSeed;
uniform vec3 uColor;
varying vec2 vUv;
${NOISE}
void main() {
  float n = fbm(vec2(vUv.x * 6.0 + uTime * 0.03 + uSeed, vUv.y * 2.0 - uTime * 0.01));
  float sides = smoothstep(0.0, 0.08, vUv.x) * (1.0 - smoothstep(0.92, 1.0, vUv.x));
  float a = smoothstep(0.35, 0.8, n) * pow(1.0 - vUv.y, 1.6) * sides;
  gl_FragColor = vec4(uColor, a * uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/** Mist banks drifting over the water: soft vertical planes, densest at the waterline. */
export function buildMist(layers: number) {
  const uTime = { value: 0 };
  const group = new THREE.Group();
  const picked = layers >= LAYERS.length ? LAYERS : LAYERS.filter((_, i) => i % 2 === 1);
  const owned: { dispose(): void }[] = [];
  picked.forEach((l, i) => {
    const material = new THREE.ShaderMaterial({
      uniforms: { uTime, uOpacity: { value: l.opacity }, uSeed: { value: i * 3.7 }, uColor: { value: new THREE.Color(SANZU.mist) } },
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
    });
    const geometry = new THREE.PlaneGeometry(l.w, l.h);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(2, l.h / 2 - 0.3, l.z);
    group.add(mesh);
    owned.push(material, geometry);
  });
  return { group, uniforms: { uTime }, dispose: () => owned.forEach((o) => o.dispose()) };
}
```

- [ ] **Step 4: Replace** `components/experience/sanzu/index.tsx`

```tsx
"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera, View } from "@react-three/drei";
import * as THREE from "three";
import { DESCENT_FOV, riverCamera } from "@/lib/descent";
import { scene } from "@/lib/scene";
import Bloom, { GlowSprite, bloomOn } from "../bloom";
import SceneBoundary from "../scene-boundary";
import { buildWisps } from "../wisps";
import { FOG_DENSITY, INK, SANZU, sanzuClock } from "./common";
import { buildLanterns, lanternCenter, type Lanterns } from "./lanterns";
import { buildLilies } from "./lilies";
import { buildMist } from "./mist";
import { createPortalMaterial } from "./portal";
import { MOON_POS, buildMoon, buildSky } from "./sky";
import { TORII, buildTorii } from "./torii";
import { buildWater } from "./water";

const one = () => 1;
const LEAN = 0.1; // calibration knob: pointer lean in radians, 0.03–0.15 (spec §3 caps it at ±0.15)
const LEAN_RATE = 3; // calibration knob: how fast the lean eases toward the pointer, 1.5–6 per second
// calibration knob: the boat's drift toward the Gate, left of the shadows' formation; tau is the approach time constant (30–120s).
const BOAT = { from: new THREE.Vector3(-5, 0, -6.5), to: new THREE.Vector3(-1.4, 0, -11.2), tau: 60 };
const LANTERN_LIGHT = 2.2; // calibration knob: candela for each of the two lit lanterns, 1–4

/** Half a cylinder, open side up, stretched along z and pinched to a point at bow and stern: a skiff. */
function buildHull(): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(0.42, 0.42, 3.2, 24, 16, true, -Math.PI / 2, Math.PI);
  g.rotateX(Math.PI / 2); // axis along z, the open half facing up
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const z = p.getZ(i) / 1.6; // -1 … 1 along the hull
    const pinch = 1 - z * z * 0.92;
    p.setX(i, p.getX(i) * pinch);
    p.setY(i, p.getY(i) * (0.55 + 0.45 * pinch) + z * z * 0.25); // shallower and swept up at the ends
  }
  g.computeVertexNormals();
  return g;
}

/** The ferryman's boat: lit wood, a hooded figure with a pole at the stern, a paper lamp at the bow. */
function Boat() {
  const hull = useMemo(() => buildHull(), []);
  const wood = useMemo(() => new THREE.MeshStandardMaterial({ color: SANZU.wood, roughness: 0.78, side: THREE.DoubleSide }), []);
  const cloth = useMemo(() => new THREE.MeshStandardMaterial({ color: SANZU.cloth, roughness: 0.95 }), []);
  const lamp = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(SANZU.lantern).multiplyScalar(3) }), []);
  const drift = useRef<THREE.Group>(null);
  const rock = useRef<THREE.Group>(null);
  useEffect(
    () => () => {
      hull.dispose();
      wood.dispose();
      cloth.dispose();
      lamp.dispose();
    },
    [hull, wood, cloth, lamp],
  );
  const yaw = Math.atan2(-(BOAT.to.x - BOAT.from.x), -(BOAT.to.z - BOAT.from.z)); // bow (-z) along the drift

  useFrame(({ clock }) => {
    const time = sanzuClock(clock.elapsedTime);
    // Eases toward the Gate and comes to rest before it: no loop, so no jump.
    drift.current?.position.lerpVectors(BOAT.from, BOAT.to, 1 - Math.exp(-time / BOAT.tau));
    if (rock.current) {
      rock.current.position.y = Math.sin(time * 0.8) * 0.04;
      rock.current.rotation.z = Math.sin(time * 0.6) * 0.03;
    }
  });

  return (
    <group ref={drift} position={BOAT.from.toArray()} rotation={[0, yaw, 0]}>
      <group ref={rock}>
        <mesh geometry={hull} material={wood} position={[0, 0.28, 0]} />
        <mesh position={[0, 0.83, 1.05]} material={cloth}>
          <coneGeometry args={[0.3, 1.2, 24]} />
        </mesh>
        <mesh position={[0, 1.48, 1.02]} material={cloth}>
          <sphereGeometry args={[0.17, 24, 16]} />
        </mesh>
        <mesh position={[0, 1.68, 1.08]} rotation={[-0.35, 0, 0]} material={cloth}>
          <coneGeometry args={[0.2, 0.46, 24]} />
        </mesh>
        <mesh position={[0.3, 1.18, 0.9]} rotation={[0.3, 0, -0.35]} material={wood}>
          <cylinderGeometry args={[0.025, 0.025, 2.8, 8]} />
        </mesh>
        <mesh position={[0, 0.9, -1.45]} material={wood}>
          <cylinderGeometry args={[0.02, 0.02, 0.9, 6]} />
        </mesh>
        <mesh position={[0, 1.4, -1.45]} material={lamp}>
          <boxGeometry args={[0.16, 0.2, 0.16]} />
        </mesh>
      </group>
    </group>
  );
}

/** The two real lantern lights (spec §3: at most two), riding lanterns 0 and 1. Normal tier only. */
function LanternLights({ lanterns }: { lanterns: Lanterns }) {
  const a = useRef<THREE.PointLight>(null);
  const b = useRef<THREE.PointLight>(null);
  const at = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }) => {
    const time = sanzuClock(clock.elapsedTime);
    [a.current, b.current].forEach((light, i) => {
      if (!light) return;
      const scale = lanternCenter(lanterns, i, time, at);
      light.position.set(at.x, at.y + 0.3, at.z);
      light.intensity = LANTERN_LIGHT * scale;
    });
  });
  return (
    <>
      <pointLight ref={a} color={SANZU.lantern} distance={7} decay={2} />
      <pointLight ref={b} color={SANZU.lantern} distance={7} decay={2} />
    </>
  );
}

/** The Sanzu (redesign spec §3). Local origin on the waterline; riverCamera() frames it. fade() === 0 hides it (the descent's cut). */
export function Sanzu({ fade = one }: { fade?: () => number }) {
  const low = scene.tier === "low";
  const sky = useMemo(() => buildSky(), []);
  const moon = useMemo(() => buildMoon(), []);
  const water = useMemo(() => buildWater(low), [low]);
  const torii = useMemo(() => buildTorii(), []);
  const portal = useMemo(() => createPortalMaterial(), []);
  // calibration knob: counts — the low tier halves each (spec §3: ~40 lanterns, ~600 lilies).
  const lanterns = useMemo(() => buildLanterns(low ? 20 : 40), [low]);
  const lilies = useMemo(() => buildLilies(low ? 300 : 600), [low]);
  const mist = useMemo(() => buildMist(low ? 2 : 4), [low]);
  const hitodama = useMemo(
    () => buildWisps(low ? 12 : 24, 24, 5, { color: SANZU.hitodama, size: 70, maxSize: 12, speed: 0.25, intensity: 2.2 }),
    [low],
  );
  const moonTarget = useMemo(() => new THREE.Object3D(), []);
  const root = useRef<THREE.Group>(null);
  useEffect(
    () => () => {
      sky.dispose();
      moon.dispose();
      water.dispose();
      torii.dispose();
      portal.dispose();
      lanterns.dispose();
      lilies.dispose();
      mist.dispose();
      hitodama.points.geometry.dispose();
      hitodama.material.dispose();
    },
    [sky, moon, water, torii, portal, lanterns, lilies, mist, hitodama],
  );

  // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
  useFrame(({ clock }) => {
    const shown = fade() > 0;
    if (root.current) root.current.visible = shown;
    if (!shown) return;
    const time = sanzuClock(clock.elapsedTime);
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    sky.material.uniforms.uTime.value = time;
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    water.uniforms.uTime.value = time;
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    portal.uniforms.uTime.value = time;
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    lanterns.uniforms.uTime.value = time;
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    lilies.uniforms.uTime.value = time;
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    mist.uniforms.uTime.value = time;
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    hitodama.material.uniforms.uTime.value = time;
  });

  return (
    <group ref={root}>
      <primitive object={sky.mesh} />
      <primitive object={moon.mesh} />
      <primitive object={water.mesh} />
      <primitive object={torii.group} />
      <mesh position={[TORII.x, TORII.portalY, TORII.z]} material={portal} renderOrder={2}>
        <planeGeometry args={[TORII.portalW, TORII.portalH]} />
      </mesh>
      <primitive object={lanterns.mesh} />
      {!bloomOn() && <primitive object={lanterns.halos} />}
      <primitive object={lilies.group} />
      <primitive object={mist.group} />
      <group position={[1, 0.4, -12]}>
        <primitive object={hitodama.points} />
      </group>
      <Boat />
      {/* The light's target lives in this group, so the moonlight keeps its angle when the descent offsets the Sanzu. */}
      <primitive object={moonTarget} />
      {/* calibration knob: light intensities — moon 0.6–1.2, fill 0.2–0.6, portal 15–45. */}
      {/* Moonlight from behind the torii: the Gate reads as a silhouette with a lit rim. */}
      <directionalLight position={MOON_POS} target={moonTarget} color={SANZU.moonlight} intensity={0.9} />
      {!low && <hemisphereLight args={[SANZU.skyFill, INK.abyss, 0.4]} />}
      {/* The portal's violet spill on the pillars: the one light the low tier keeps besides the moon. */}
      <pointLight position={[TORII.x, TORII.portalY, TORII.z + 0.8]} color={INK.monarch} intensity={30} distance={34} decay={2} />
      {!low && <LanternLights lanterns={lanterns} />}
      <GlowSprite position={[TORII.x, TORII.portalY, TORII.z + 0.05]} size={11} color={INK.system} intensity={0.55} />
      <GlowSprite position={MOON_POS} size={30} color={SANZU.moon} intensity={0.3} />
    </group>
  );
}

/**
 * The backdrop camera: the river pose for this screen's shape (the descent lands on the same pose), leaning
 * toward the pointer within ±LEAN, eased. The lean starts at zero, so the handoff doesn't pop. Reduced motion: no lean.
 */
function Rig() {
  const aim = useRef({ yaw: 0, pitch: 0 });
  const lean = useRef({ yaw: 0, pitch: 0 });
  useEffect(() => {
    if (scene.reducedMotion) return;
    const onMove = (e: PointerEvent) => {
      aim.current.yaw = -((e.clientX / window.innerWidth) * 2 - 1) * LEAN;
      aim.current.pitch = -((e.clientY / window.innerHeight) * 2 - 1) * LEAN;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  useFrame(({ camera }, delta) => {
    const k = 1 - Math.exp(-Math.min(delta, 0.1) * LEAN_RATE); // frame-rate independent
    lean.current.yaw += (aim.current.yaw - lean.current.yaw) * k;
    lean.current.pitch += (aim.current.pitch - lean.current.pitch) * k;
    const pose = riverCamera(window.innerWidth / window.innerHeight);
    camera.position.set(...pose.position);
    camera.rotation.set(pose.pitch + lean.current.pitch, lean.current.yaw, 0, "YXZ");
  });
  return null;
}

/** While the crossing covers the page, the crossing's own view draws; the backdrop sits out. */
const crossingActive = () => "crossing" in document.documentElement.dataset;

/** The /underworld backdrop: the Sanzu from exactly where the descent lands. */
export function SanzuBackdrop() {
  return (
    <div aria-hidden className="fixed inset-0 z-0">
      <View className="size-full" visible={false}>
        <PerspectiveCamera makeDefault fov={DESCENT_FOV} near={0.1} far={400} />
        <Rig />
        <fogExp2 attach="fog" args={[SANZU.fog, FOG_DENSITY]} />
        <Bloom paused={crossingActive} />
        <SceneBoundary fallback={null}>
          <Sanzu />
        </SceneBoundary>
      </View>
    </div>
  );
}
```

- [ ] **Step 5: Gates**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: all green.

- [ ] **Step 6: Frame the portrait pose.** `npm run dev`, first fixture, Playwright at 390×844, `/underworld`. Tune `RIVER_CAMERA_PORTRAIT` in `lib/descent.ts` (calibration knob: x 2–6, y 0.8–2, z 7–14, pitch -0.2 to 0.05) until:
- the whole torii (kasagi to the waterline) sits in the top half of the viewport, horizontally centred ±10%;
- the portal and moon are both in frame;
- the RYUMA title, tagline and notice sit below the torii over water, with no overlap with the portal.

Run `npm test` after tuning; the descent tests take the pose from `riverCamera()`, so they must still pass.

- [ ] **Step 7: Browser check.** Playwright screenshots at 1440×900 and 390×844 (under `/Users/bhumilmodi/.claude/browser-output/`), plus a 5s screen recording or three screenshots 1.5s apart at 1440×900.
- Lanterns: about 40 (20 on the phone) amber lanterns drift slowly left to right and bob. They glow (bloom on desktop, halos on the phone) and reflect in the water on desktop. None pops in or out at the edges; they shrink away at the wrap.
- Two lanterns cast a warm pool of light on the water near them (desktop only).
- Lilies: a red bank in the lower-left foreground. Each flower sways gently from the head and the stems stay planted. The bank stays above the bottom ~15% of the frame.
- Boat: wooden, lit by the moon's rim and the portal's violet, with the hooded ferryman and his pole, drifting slowly toward the Gate and left of where the soldiers will stand (Task 9).
- Hitodama: a few blue-white orbs rising slowly and fading, blooming on desktop.
- Mist: soft banks over the water, denser near the waterline, drifting.
- Parallax: moving the pointer from corner to corner leans the view smoothly, never more than about 8.6°, and it settles when the pointer stops.
- Reduced motion (Playwright `browser_emulate_media` with `reducedMotion: "reduce"`, reload): three screenshots 1.5s apart are identical, and the pointer does nothing.
- The footer credit is legible over dark water on both sizes.
- Tune only the marked knobs, within their bounds, against these screenshots.

- [ ] **Step 8: Performance spot check.** A 5s `chrome-devtools` trace at 1440×900 on `/underworld`: the mean frame time is ≤ 16.7ms. If it's over, reduce in this order, re-tracing after each: the reflection `scale` in `water.ts` (to 0.35), the mist layers (to 3), the lily count (to 450). Record the final numbers in the commit body.

- [ ] **Step 9: Commit**

```bash
git add components/experience/sanzu lib/descent.ts
git commit -m "feat: lanterns, spider lilies, the ferryman and mist on the sanzu"
```

---

### Task 7: The System window, the arrival notice and the chime

Load `emil-design-eng`, `impeccable:impeccable`, `taste-skill:taste-skill` and `apple-design` first. The window has to feel like a game UI booting: a crisp line, a fast unfold, nothing floaty.

**Files:**
- Create: `components/underworld/system-window.tsx`
- Modify: `components/quest/sound.tsx`, `components/underworld/arrival.tsx`, `components/underworld/realm.tsx`, `lib/scene.ts`, `app/globals.css`

**Interfaces:**
- Consumes: `SYSTEM` (Task 3); the audio `engine` and `state` inside `sound.tsx`
- Produces:
  - `export default function SystemWindow(props: { heading?: string; level?: 2 | 3; notice?: boolean; instant?: boolean; id?: string; className?: string; children: ReactNode })`
    - A window: `<section id aria-labelledby>` with an `h2`/`h3` rendering `[ HEADING ]`.
    - A notice: `<div role="status" aria-live="polite">` with the `[SYSTEM]` tag.
    - `data-phase="shut" | "open" | "still"` drives the CSS.
  - `playChime(): void` (from `components/quest/sound.tsx`; silent unless sound is on)
  - `scene.noticeCarried: boolean`
  - CSS classes `.sys-window`, `.sys-notice`, `.sys-head`, `.sys-tag`, `.sys-body`, `.sys-btn`, `.sys-btn-primary`

- [ ] **Step 1: Add** `playChime()` to `components/quest/sound.tsx`, right after `playHit()`

```ts
/** A short synthesized System chime: two sine partials a sixth apart, the upper one entering 60ms late. No audio file. */
export function playChime() {
  if (!engine || !state.on) return;
  const { ctx } = engine;
  const now = ctx.currentTime;
  const out = ctx.createGain();
  out.gain.setValueAtTime(0.0001, now);
  out.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
  out.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
  out.connect(ctx.destination);
  for (const [freq, delay] of [[880, 0], [1480, 0.06]] as const) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + delay);
    osc.connect(out);
    osc.start(now + delay);
    osc.stop(now + 0.65);
  }
}
```

- [ ] **Step 2: Add** `noticeCarried` to `scene` in `lib/scene.ts`, after `crossingT`

```ts
  /** The crossing's [SYSTEM] notice was on screen at the handoff, so the Arrival shows its own in place without re-opening it. */
  noticeCarried: false,
```

- [ ] **Step 3: Write** `components/underworld/system-window.tsx`

```tsx
"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { SYSTEM } from "@/lib/content";
import { playChime } from "@/components/quest/sound";

type Props = {
  /** Bracketed header: "QUEST" renders "[ QUEST ]" as the window's heading. Ignored for a notice. */
  heading?: string;
  /** Heading level: 2 on its own (the Status Window), 3 inside another section (the Trial). */
  level?: 2 | 3;
  /** A one-line System notice: "[SYSTEM] …", role="status", a polite live region, no heading. */
  notice?: boolean;
  /** Already open: no line, no unfold, no chime (the notice carried over from the crossing). */
  instant?: boolean;
  id?: string;
  className?: string;
  children: ReactNode;
};

/**
 * The System window (redesign spec §5): a translucent deep-navy panel, a 1px System-blue border with a soft glow,
 * and corner brackets. It opens the first time it scrolls into view — a 120ms line, then a 180ms unfold, strong
 * ease-out — and chimes if sound is on. Reduced motion gets a plain 150ms fade (app/globals.css).
 */
export default function SystemWindow({ heading, level = 2, notice = false, instant = false, id, className = "", children }: Props) {
  const body = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const [phase, setPhase] = useState<"shut" | "open" | "still">(instant ? "still" : "shut");

  useEffect(() => {
    const el = body.current;
    if (instant || !el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        setPhase("open");
        playChime();
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [instant]);

  if (notice) {
    return (
      <div role="status" aria-live="polite" data-phase={phase} className={`sys-window sys-notice ${className}`}>
        <div ref={body} className="sys-body">
          <span className="sys-tag">{SYSTEM.tag}</span> {children}
        </div>
      </div>
    );
  }
  const Heading = level === 3 ? "h3" : "h2";
  return (
    <section id={id} aria-labelledby={heading ? headingId : undefined} data-phase={phase} className={`sys-window ${className}`}>
      {heading && (
        <Heading id={headingId} className="sys-head">
          <span aria-hidden>[ </span>
          {heading}
          <span aria-hidden> ]</span>
        </Heading>
      )}
      <div ref={body} className="sys-body">
        {children}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Add the System styles** to the end of `app/globals.css`

```css
/* System windows (components/underworld/system-window.tsx): translucent navy, 1px System-blue edge + glow, corner brackets. */
.sys-window {
  position: relative;
  padding: 1.25rem 1.5rem;
  color: var(--color-mist);
  background: linear-gradient(180deg, rgb(10 22 48 / 0.8), rgb(6 12 28 / 0.74));
  -webkit-backdrop-filter: blur(12px) saturate(1.2);
  backdrop-filter: blur(12px) saturate(1.2);
  border: 1px solid color-mix(in srgb, var(--color-system) 75%, transparent);
  box-shadow: 0 0 18px color-mix(in srgb, var(--color-system) 30%, transparent), inset 0 0 28px color-mix(in srgb, var(--color-system) 12%, transparent);
}
/* Corner brackets: eight 2px bars just outside the border. */
.sys-window::before {
  content: "";
  position: absolute;
  inset: -5px;
  pointer-events: none;
  background:
    linear-gradient(var(--color-system) 0 0) left top / 16px 2px,
    linear-gradient(var(--color-system) 0 0) left top / 2px 16px,
    linear-gradient(var(--color-system) 0 0) right top / 16px 2px,
    linear-gradient(var(--color-system) 0 0) right top / 2px 16px,
    linear-gradient(var(--color-system) 0 0) left bottom / 16px 2px,
    linear-gradient(var(--color-system) 0 0) left bottom / 2px 16px,
    linear-gradient(var(--color-system) 0 0) right bottom / 16px 2px,
    linear-gradient(var(--color-system) 0 0) right bottom / 2px 16px;
  background-repeat: no-repeat;
  filter: drop-shadow(0 0 4px var(--color-system));
}
/* The opening line: a 1px System-blue rule across the middle. */
.sys-window::after {
  content: "";
  position: absolute;
  inset-inline: 0;
  top: 50%;
  height: 1px;
  background: var(--color-system);
  box-shadow: 0 0 8px var(--color-system);
  opacity: 0;
  pointer-events: none;
}
.sys-head {
  margin-bottom: 1rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--color-system);
  text-shadow: 0 0 10px color-mix(in srgb, var(--color-system) 60%, transparent);
}
.sys-notice { padding: 0.85rem 1.1rem; font-family: var(--font-serif); font-size: 1.125rem; line-height: 1.4; }
.sys-tag { margin-right: 0.35rem; font-family: var(--font-mono); font-size: 0.75rem; letter-spacing: 0.18em; color: var(--color-system); }
.sys-window[data-phase="shut"] { clip-path: inset(50% 50% 50% 50%); }
@media (prefers-reduced-motion: no-preference) {
  /* 0–40% (120ms): the line draws out; 40–100% (180ms): the panel unfolds. Strong ease-out on both. */
  .sys-window[data-phase="open"] { animation: sys-open 300ms both; }
  .sys-window[data-phase="open"]::after { animation: sys-line 300ms both; }
  .sys-window[data-phase="open"] .sys-body { animation: sys-fade 160ms 200ms ease-out both; }
}
@media (prefers-reduced-motion: reduce) {
  .sys-window[data-phase="shut"] { clip-path: none; opacity: 0; }
  .sys-window[data-phase="open"] { animation: sys-fade 150ms ease-out both; }
}
@keyframes sys-open {
  0% { clip-path: inset(calc(50% - 1px) 50% calc(50% - 1px) 50%); animation-timing-function: cubic-bezier(0.23, 1, 0.32, 1); }
  40% { clip-path: inset(calc(50% - 1px) -24px calc(50% - 1px) -24px); animation-timing-function: cubic-bezier(0.23, 1, 0.32, 1); }
  100% { clip-path: inset(-24px); }
}
@keyframes sys-line {
  0% { opacity: 1; transform: scaleX(0); animation-timing-function: cubic-bezier(0.23, 1, 0.32, 1); }
  40% { opacity: 1; transform: scaleX(1); }
  100% { opacity: 0; transform: scaleX(1); }
}
@keyframes sys-fade { from { opacity: 0; } }

/* System buttons (trial, status, ARISE). 44px minimum hit area. */
.sys-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0.7rem 1.2rem;
  border: 1px solid color-mix(in srgb, var(--color-system) 60%, transparent);
  background: color-mix(in srgb, var(--color-system) 8%, transparent);
  color: var(--color-mist);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  transition: background-color 150ms ease-out, border-color 150ms ease-out, box-shadow 150ms ease-out, transform 100ms ease-out;
}
.sys-btn:active { transform: scale(0.97); }
.sys-btn-primary {
  background: var(--color-system);
  border-color: var(--color-system);
  color: var(--color-abyss);
  box-shadow: 0 0 18px color-mix(in srgb, var(--color-system) 45%, transparent);
}
@media (hover: hover) {
  .sys-btn:hover { background: color-mix(in srgb, var(--color-system) 20%, transparent); border-color: var(--color-system); box-shadow: 0 0 16px color-mix(in srgb, var(--color-system) 35%, transparent); }
  .sys-btn-primary:hover { background: color-mix(in srgb, var(--color-system) 80%, white); color: var(--color-abyss); }
}
```

- [ ] **Step 5: Replace** `components/underworld/arrival.tsx`. The notice is the last element of a full-height section with `pb-24`, so its bottom edge sits exactly 6rem above the viewport's bottom. Task 8's crossing overlay puts its own notice at `bottom: 6rem` in the same container, so the handoff lines up.

```tsx
"use client";
import { useEffect, useState } from "react";
import { SYSTEM, UNDERWORLD } from "@/lib/content";
import { scene } from "@/lib/scene";
import SystemWindow from "./system-window";

export default function Arrival() {
  // Arriving from the crossing, its notice is already on screen: show ours in place, without a second opening.
  const [carried] = useState(() => scene.noticeCarried);
  useEffect(() => {
    scene.noticeCarried = false;
  }, []);
  return (
    <section aria-labelledby="ryuma" className="mx-auto flex min-h-dvh w-full max-w-[1280px] flex-col justify-end gap-6 px-4 pb-24 md:px-8">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-system">{UNDERWORLD.eyebrow}</p>
      <h1 id="ryuma" className="system-glow cap-trim font-display text-[clamp(5rem,18vw,16rem)] uppercase leading-[0.85]">{UNDERWORLD.name}</h1>
      <p className="max-w-[40ch] font-serif text-2xl italic text-mist/90 md:text-3xl">{UNDERWORLD.line}</p>
      <SystemWindow notice instant={carried} className="w-fit max-w-[34rem]">
        {SYSTEM.entered}
      </SystemWindow>
    </section>
  );
}
```

- [ ] **Step 6: Take the realm header out of the flow,** so the Arrival fills the viewport exactly. In `components/underworld/realm.tsx`, change the header's `className` from `"mx-auto flex w-full max-w-[1280px] items-center justify-between px-4 py-4 md:px-8"` to `"absolute inset-x-0 top-0 z-10 mx-auto flex w-full max-w-[1280px] items-center justify-between px-4 py-4 md:px-8"`.

- [ ] **Step 7: Gates**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: all green.

- [ ] **Step 8: Browser check.** `npm run dev`, first fixture, `/underworld`, 1440×900 and 390×844.
- Load: the notice below the tagline opens as a thin System-blue line drawing out from the centre (~120ms), then unfolds vertically (~180ms), and its text fades in. It must feel instant, not floaty. Take Playwright screenshots mid-animation with `browser_run_code_unsafe` pausing CSS animations at 60ms and 200ms (`document.getAnimations().forEach(a => { a.pause(); a.currentTime = 60; })`) to confirm the line, then the half-unfolded panel.
- At rest: a translucent navy panel with the page's Sanzu blurred behind it, a 1px System-blue border with a soft glow, four corner brackets, `[SYSTEM]` in mono System-blue, and the body in Newsreader.
- The notice's bottom edge is 96px above the viewport's bottom, and the header floats over the top of the Arrival.
- The accessibility tree (Orca `snapshot` or Playwright `browser_snapshot`) shows the notice as `status`.
- Reduced motion (Playwright `browser_emulate_media`): a plain fade, with no line and no unfold.
- The chime is checked in Task 10 (it needs sound switched on by a gesture before a window opens).

- [ ] **Step 9: Commit**

```bash
git add components/underworld/system-window.tsx components/underworld/arrival.tsx components/underworld/realm.tsx components/quest/sound.tsx lib/scene.ts app/globals.css
git commit -m "feat: system windows, the arrival notice and a synthesized chime"
```

---
### Task 8: The descent's bottom half — portal, flash, glide

Load `emil-design-eng`, `impeccable:impeccable`, `taste-skill:taste-skill` and `apple-design` first. Read `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-router.md` before touching the navigation code (the calls don't change, but confirm them).

**Files:**
- Replace: `components/experience/descent-scene.tsx`, `components/quest/crossing.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes:
  - Task 2: `PORTAL_R`, `PORTAL_Y`, `RIVER_Y`, `GATE_CUT`, `cameraAt(t, aspect)`, `portalOpacity`, `portalScale`, `sanzuOpacity`, `shaftOpacity`, `flashOpacity`, `scanline`, `bloomBeat`, `noticeShown`
  - Task 4: `Bloom`
  - Task 5: `Sanzu`, `INK`, `SANZU`, `FOG_DENSITY`, `sanzuClock`, `createPortalMaterial`, `buildWisps`
  - Task 7: `SystemWindow`, `scene.noticeCarried`
- Produces: `<DescentScene />` (unchanged signature); `<Crossing />` (unchanged); CSS `.crossing-flash`, `.crossing-scan`, `.crossing-notice`

- [ ] **Step 1: Replace** `components/experience/descent-scene.tsx`. The Olympus half (obol, colonnade, floor, rays, clouds, shaft, wisps) is the same as today. What's new: fog at the view root, the rays material opted out of fog, the approach disc below the shaft, the aspect-aware camera path, and the Sanzu from Task 5.

```tsx
"use client";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  PORTAL_R, PORTAL_Y, RIVER_Y,
  cameraAt, cloudOpacity, coldness, obolPose, olympusOpacity, portalOpacity, portalScale, sanzuOpacity, shaftOpacity, streak,
} from "@/lib/descent";
import { scene } from "@/lib/scene";
import { createEngravingMaterial } from "./engraving-material";
import { buildWisps } from "./wisps";
import { Sanzu } from "./sanzu";
import { FOG_DENSITY, INK, SANZU, sanzuClock } from "./sanzu/common";
import { createPortalMaterial } from "./sanzu/portal";

const WARM = { ember: "#d0643b", bone: "#efe6d4" };

// Each cloud particle is a two-vertex segment: at rest a speck, during the fall a streak trailing upward.
const cloudVertex = /* glsl */ `
uniform float uStretch;
uniform float uTime;
attribute float aEnd;
attribute float aRand;
varying float vHead;
void main() {
  vec3 p = position;
  p.x += sin(uTime * 0.2 + aRand * 30.0) * 0.3 * (1.0 - uStretch);
  p.y += aEnd * (0.04 + uStretch * 3.0);
  vHead = 1.0 - aEnd;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;
const cloudFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying float vHead;
void main() {
  gl_FragColor = vec4(uColor, uOpacity * (0.25 + 0.75 * vHead));
  #include <colorspace_fragment>
}
`;

function buildClouds(count: number) {
  const pos = new Float32Array(count * 6);
  const end = new Float32Array(count * 2);
  const rand = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 1.5 + Math.random() * 10; // keep a clear column around the fall axis
    const [x, y, z] = [Math.cos(a) * r, -30 + Math.random() * 36, Math.sin(a) * r];
    pos.set([x, y, z, x, y, z], i * 6);
    end.set([0, 1], i * 2);
    const q = Math.random();
    rand.set([q, q], i * 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aEnd", new THREE.BufferAttribute(end, 1));
  g.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { uStretch: { value: 0 }, uTime: { value: 0 }, uColor: { value: new THREE.Color(WARM.ember) }, uOpacity: { value: 1 } },
    vertexShader: cloudVertex,
    fragmentShader: cloudFragment,
    transparent: true,
    depthWrite: false,
  });
  const lines = new THREE.LineSegments(g, material);
  lines.frustumCulled = false;
  return { lines, material };
}

/** God-rays falling from above onto the Olympus floor. */
function buildRays(count = 120) {
  const pos = new Float32Array(count * 6);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r0 = Math.random() * 1.5;
    const r1 = 2 + Math.random() * 6;
    pos.set([Math.cos(a) * r0, 18, Math.sin(a) * r0, Math.cos(a) * r1, -2.5, Math.sin(a) * r1], i * 6);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  // fog: false — the view now carries the Sanzu's fog, and Olympus must look exactly as before.
  const material = new THREE.LineBasicMaterial({ color: WARM.bone, transparent: true, opacity: 0, depthWrite: false, fog: false });
  return { lines: new THREE.LineSegments(g, material), material };
}

/** A descending shaft of columns and arches, each level turned a little: a Carceri spiral. */
function buildShaft(levels: number, material: THREE.Material) {
  const perLevel = 8;
  const radius = 3.2;
  const half = Math.PI / perLevel;
  const cols = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.24, 3.6, 16), material, levels * perLevel);
  const arches = new THREE.InstancedMesh(new THREE.TorusGeometry(radius * Math.sin(half), 0.1, 8, 24, Math.PI), material, levels * perLevel);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const v = new THREE.Vector3();
  const s = new THREE.Vector3(1, 1, 1);
  for (let l = 0; l < levels; l++) {
    const y = -8 - l * 4;
    for (let i = 0; i < perLevel; i++) {
      const k = l * perLevel + i;
      const a = (i / perLevel) * Math.PI * 2 + l * 0.35;
      cols.setMatrixAt(k, m.compose(v.set(Math.cos(a) * radius, y, Math.sin(a) * radius), q.identity(), s));
      // The arch spans to the next column: centred on the chord at capital height, its plane facing the axis.
      const mid = a + half;
      const chord = radius * Math.cos(half);
      q.setFromEuler(e.set(0, Math.PI / 2 - mid, 0));
      arches.setMatrixAt(k, m.compose(v.set(Math.cos(mid) * chord, y + 1.8, Math.sin(mid) * chord), q, s));
    }
  }
  cols.frustumCulled = false;
  arches.frustumCulled = false;
  return { cols, arches };
}

// Olympus colonnade: a ring of columns, open toward the camera.
const COLONNADE = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2)
  .map((a) => [Math.sin(a) * 5, Math.cos(a) * 5] as const)
  .filter(([, z]) => z < 3);

/**
 * The fall from Olympus, down the engraved shaft, through the portal and out over the Sanzu (redesign spec §4).
 * Reads scene.crossingT; owns the view's camera. The engraving and the lit Sanzu are never on screen together:
 * the switch happens at GATE_CUT, under the flash (components/quest/crossing.tsx).
 */
export default function DescentScene() {
  const low = scene.tier === "low";
  const clouds = useMemo(() => buildClouds(low ? 4000 : 9000), [low]);
  const rays = useMemo(() => buildRays(), []);
  const marble = useMemo(() => createEngravingMaterial({ spacing: 4 }), []);
  const coin = useMemo(() => createEngravingMaterial({ ink: WARM.ember }), []);
  const stone = useMemo(() => createEngravingMaterial({ ink: INK.mist, ground: INK.abyss }), []);
  // Every tier gets the full shaft: it is two instanced draw calls.
  const shaft = useMemo(() => buildShaft(9, stone), [stone]);
  const wisps = useMemo(() => buildWisps(low ? 250 : 600, 6, 36, { color: INK.system }), [low]);
  const portal = useMemo(() => createPortalMaterial(3.2), []); // calibration knob: approach-disc intensity, 2.4–4
  const warm = useMemo(() => new THREE.Color(WARM.ember), []);
  const cold = useMemo(() => new THREE.Color(INK.system), []);
  const obol = useRef<THREE.Mesh>(null);
  const disc = useRef<THREE.Mesh>(null);
  const sanzuFade = useCallback(() => sanzuOpacity(scene.crossingT), []);
  const { gl, scene: world, camera: viewCamera } = useThree();

  // Compile the Sanzu's shaders at mount, not at the cut: a first-use compile at GATE_CUT would stall the flash.
  // renderer.compile() skips invisible objects, and this effect runs before the Sanzu's first frame hides itself.
  // Both variants: render-target programs (the composer path) and on-screen ACES programs (the direct path).
  useEffect(() => {
    const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
    const previous = gl.getRenderTarget();
    const tone = gl.toneMapping;
    gl.setRenderTarget(target);
    gl.compile(world, viewCamera);
    gl.setRenderTarget(previous);
    // eslint-disable-next-line react-hooks/immutability -- a one-off renderer setting for the pre-compile, restored below
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.compile(world, viewCamera);
    gl.toneMapping = tone;
    target.dispose();
  }, [gl, world, viewCamera]);

  // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
  useFrame(({ camera, clock }) => {
    const t = scene.crossingT;
    const { pos, pitch } = cameraAt(t, window.innerWidth / window.innerHeight);
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.rotation.set(pitch, 0, 0);

    const o = olympusOpacity(t);
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    marble.uniforms.uOpacity.value = o;
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    rays.material.opacity = 0.35 * o;

    const cu = clouds.material.uniforms;
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    cu.uStretch.value = streak(t);
    cu.uTime.value = clock.elapsedTime;
    cu.uOpacity.value = cloudOpacity(t);
    cu.uColor.value.copy(warm).lerp(cold, coldness(t));

    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    stone.uniforms.uOpacity.value = shaftOpacity(t);
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    wisps.material.uniforms.uOpacity.value = shaftOpacity(t);
    wisps.material.uniforms.uTime.value = clock.elapsedTime;

    // The portal far below the shaft: it swells from a spark and the fall does the rest.
    const po = portalOpacity(t);
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    portal.uniforms.uOpacity.value = po;
    portal.uniforms.uTime.value = sanzuClock(clock.elapsedTime);
    if (disc.current) {
      disc.current.visible = po > 0.001;
      disc.current.scale.setScalar(portalScale(t));
    }

    const p = obolPose(t);
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    coin.uniforms.uOpacity.value = p.opacity;
    if (obol.current) {
      obol.current.visible = p.opacity > 0.001;
      obol.current.rotation.set(Math.PI / 2 + p.flip, 0, 0);
      obol.current.position.y = 1.5 + p.drop;
    }
  });

  return (
    <>
      {/* Fog attaches to this view's scene. The engraving, clouds, wisps and portal are ShaderMaterials with fog off. */}
      <fogExp2 attach="fog" args={[SANZU.fog, FOG_DENSITY]} />
      <mesh ref={obol} position={[0, 1.5, 5]} material={coin}>
        <cylinderGeometry args={[0.35, 0.35, 0.06, 64]} />
      </mesh>
      {COLONNADE.map(([x, z]) => (
        <mesh key={`${x}:${z}`} position={[x, 0, z]} material={marble}>
          <cylinderGeometry args={[0.28, 0.32, 5, 24]} />
        </mesh>
      ))}
      {/* The floor of Olympus, with an oculus the camera falls through. */}
      <mesh position={[0, -2.5, 0]} rotation={[-Math.PI / 2, 0, 0]} material={marble}>
        <ringGeometry args={[1.8, 6.5, 64]} />
      </mesh>
      <primitive object={rays.lines} />
      <primitive object={clouds.lines} />
      <primitive object={shaft.cols} />
      <primitive object={shaft.arches} />
      <group position={[0, -40, 0]}>
        <primitive object={wisps.points} />
      </group>
      <mesh ref={disc} position={[0, PORTAL_Y, 0]} rotation={[-Math.PI / 2, 0, 0]} material={portal}>
        <planeGeometry args={[PORTAL_R * 2, PORTAL_R * 2]} />
      </mesh>
      <group position={[0, RIVER_Y, 0]}>
        <Sanzu fade={sanzuFade} />
      </group>
    </>
  );
}
```

- [ ] **Step 2: Replace** `components/quest/crossing.tsx`

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PerspectiveCamera, View } from "@react-three/drei";
import { CROSSING, SYSTEM } from "@/lib/content";
import {
  DESCENT_FOV, DESCENT_S, GATE_CUT,
  backdropOpacity, bloomBeat, coldness, flashOpacity, isDone, noticeShown, scanline, timelineAt, type Direction,
} from "@/lib/descent";
import { quest } from "@/lib/quest";
import { CROSS_EVENT, scene } from "@/lib/scene";
import { smoothstep } from "@/lib/timeline";
import Bloom from "@/components/experience/bloom";
import DescentScene from "@/components/experience/descent-scene";
import SceneBoundary from "@/components/experience/scene-boundary";
import SystemWindow from "@/components/underworld/system-window";
import { setRealm } from "./sound";

// Mirror --color-field and --color-abyss: the backdrop behind the canvas cools as the camera falls.
const FIELD = [154, 42, 20];
const ABYSS = [5, 7, 13];
const FALLBACK_S = 1;
/** Reduced motion: the notice opens halfway through the crossfade and is held this long before the page swaps in. */
const NOTICE_HOLD_S = 1.1;
let crossings = 0; // this session; a repeat crossing runs at 2×

type Run = { direction: Direction; speed: number; fallback: boolean };
const destination = (d: Direction) => (d === "down" ? { path: "/underworld", href: "/underworld" } : { path: "/", href: "/#hero" });
// Bloom from the portal approach on; ACES only once the lit Sanzu is on screen, so the engraving keeps its flat colours.
const bloomNow = () => bloomBeat(scene.crossingT);
const acesNow = () => scene.crossingT >= GATE_CUT;

/** The crossing between realms (redesign spec §4). Listens for cross() from lib/scene.ts. */
export default function Crossing() {
  const router = useRouter();
  const pathname = usePathname();
  const [run, setRun] = useState<Run | null>(null);
  const [pushedTo, setPushedTo] = useState<string | null>(null);
  const [notice, setNotice] = useState(false);
  const backdrop = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const scan = useRef<HTMLDivElement>(null);
  const skip = useRef(false);
  const leaving = run !== null && pushedTo === pathname;

  useEffect(() => {
    const onCross = (e: Event) => {
      const direction = (e as CustomEvent<Direction>).detail;
      const fallback = scene.reducedMotion || document.documentElement.classList.contains("no-webgl");
      setRun((current) => current ?? { direction, speed: crossings > 0 ? 2 : 1, fallback });
    };
    window.addEventListener(CROSS_EVENT, onCross);
    return () => window.removeEventListener(CROSS_EVENT, onCross);
  }, []);

  // Drive the timeline, paint the DOM layers, switch the music, and navigate at the end.
  useEffect(() => {
    if (!run) return;
    const { direction, speed, fallback } = run;
    const { path, href } = destination(direction);
    crossings += 1;
    skip.current = false;
    if (direction === "down") quest.cross();
    router.prefetch(path);
    const root = document.documentElement;
    const t0 = performance.now();
    let switched = false;
    let noticeOn = false;
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = skip.current ? Infinity : (now - t0) / 1000;
      let t: number;
      let done: boolean;
      let cover: number;
      let showNotice: boolean;
      if (fallback) {
        const f = Math.min(1, elapsed / FALLBACK_S);
        t = direction === "down" ? f * DESCENT_S : (1 - f) * DESCENT_S;
        cover = direction === "down" ? smoothstep(0, 0.4, f) : 1;
        showNotice = direction === "down" && f >= 0.5;
        done = direction === "down" ? elapsed >= FALLBACK_S / 2 + NOTICE_HOLD_S : f >= 1;
      } else {
        t = timelineAt(elapsed, direction, speed);
        done = isDone(elapsed, direction, speed);
        cover = direction === "down" ? backdropOpacity(t) : 1;
        showNotice = direction === "down" && noticeShown(t);
      }
      scene.crossingT = t;

      const c = coldness(t);
      if (backdrop.current) {
        backdrop.current.style.backgroundColor = `rgb(${FIELD.map((v, i) => Math.round(v + (ABYSS[i] - v) * c)).join(",")})`;
        backdrop.current.style.opacity = String(cover);
      }
      // The System boots: a blue flash peaking at the cut, with a scanline sweeping down under it.
      const f = flashOpacity(t);
      if (flash.current) flash.current.style.opacity = String(f);
      if (scan.current) {
        scan.current.style.opacity = f > 0.02 ? "1" : "0";
        scan.current.style.transform = `translateY(${scanline(t) * window.innerHeight}px)`;
      }
      if (showNotice && !noticeOn) {
        noticeOn = true;
        setNotice(true);
      }
      // Once the backdrop is opaque, take the page out of layout so its own 3D views stop drawing over the descent.
      if (cover >= 0.999) root.dataset.crossing = "";
      if (!switched && (direction === "down" ? t >= 1.8 : t <= 3)) {
        switched = true;
        setRealm(direction === "down" ? "underworld" : "olympus");
      }
      if (done) {
        // The overlay's notice sits exactly where the Arrival's will; tell the Arrival not to open a second one.
        if (direction === "down") scene.noticeCarried = noticeOn;
        setPushedTo(path);
        router.push(href);
        return; // ponytail: no timeout if navigation never lands; add one if that is ever seen in the wild
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") skip.current = true;
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
    };
  }, [run, router]);

  // The destination has mounted under the overlay: reveal it, fade the overlay, then unmount.
  useEffect(() => {
    if (!leaving) return;
    delete document.documentElement.dataset.crossing;
    // The router's hash scroll ran while the page was display:none; redo it now that it has layout.
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
    const id = setTimeout(() => {
      setRun(null);
      setPushedTo(null);
      setNotice(false);
    }, 600);
    return () => clearTimeout(id);
  }, [leaving]);

  if (!run) return null;
  return (
    <div id="crossing" data-leaving={leaving ? "" : undefined}>
      <div ref={backdrop} className="crossing-backdrop" onClick={() => (skip.current = true)} />
      {!run.fallback && !leaving && (
        <View className="crossing-view" visible={false}>
          <PerspectiveCamera makeDefault fov={DESCENT_FOV} near={0.1} far={400} />
          <Bloom bloom={bloomNow} aces={acesNow} />
          <SceneBoundary fallback={null}>
            <DescentScene />
          </SceneBoundary>
        </View>
      )}
      <div className="crossing-hud">
        {!run.fallback && (
          <>
            <div ref={flash} aria-hidden className="crossing-flash" />
            <div ref={scan} aria-hidden className="crossing-scan" />
          </>
        )}
        {notice && (
          <div className="crossing-notice">
            <div className="mx-auto w-full max-w-[1280px] px-4 md:px-8">
              <SystemWindow notice className="w-fit max-w-[34rem]">
                {SYSTEM.entered}
              </SystemWindow>
            </div>
          </div>
        )}
        <button type="button" className="crossing-skip font-mono text-xs uppercase tracking-[0.2em]" onClick={() => (skip.current = true)}>
          {CROSSING.skip}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add the flash styles** after the existing crossing rules in `app/globals.css` (after `#crossing[data-leaving] …`)

```css
/* The System booting at the cut: a full-screen blue flash with a faint scan texture, and one bright line sweeping down. */
.crossing-flash {
  position: fixed;
  inset: 0;
  opacity: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at 50% 50%, #eaf4ff 0%, var(--color-system) 42%, color-mix(in srgb, var(--color-system) 55%, var(--color-abyss)) 100%);
}
.crossing-flash::after {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(0deg, rgb(255 255 255 / 0.07) 0 1px, transparent 1px 3px);
}
.crossing-scan {
  position: fixed;
  inset-inline: 0;
  top: 0;
  height: 2px;
  opacity: 0;
  pointer-events: none;
  background: #eaf4ff;
  box-shadow: 0 0 14px 3px color-mix(in srgb, var(--color-system) 80%, transparent);
  will-change: transform;
}
/* Same container and bottom offset as the Arrival's notice (components/underworld/arrival.tsx), so the handoff lines up. */
.crossing-notice { position: fixed; inset-inline: 0; bottom: 6rem; text-align: left; pointer-events: none; }
```

- [ ] **Step 4: Gates**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: all green.

- [ ] **Step 5: Browser check, frame by frame.** `npm run dev`, first fixture, `/`, 1440×900. Playwright is the driver here (timed screenshots are a Playwright-only need). In `browser_run_code_unsafe`, click the quest chip, then take screenshots at 2.9, 3.3, 3.9, 4.25, 4.3, 4.35, 4.45, 4.8 and 5.5s after the click, by awaiting `page.waitForTimeout` for each gap. Save them to `/Users/bhumilmodi/.claude/browser-output/descent-<t>.png`. Timing jitter of ±30ms is fine. Run it twice if a flash frame is missed.
- 2.9–3.9: the engraved shaft exactly as before, with a violet-blue swirling disc far below that grows. The disc blooms on desktop.
- 4.25: the disc fills the screen and the flash is rising. At 4.3 the flash is full: System blue with a white core and faint scan lines, and the scanline mid-sweep. There is no frame anywhere with both the dither shaft and the lit Sanzu visible.
- 4.35–4.45: the flash clears to the Sanzu seen from above the torii.
- 4.8: gliding down; the `[SYSTEM] You have entered the Gate.` notice has opened (line → unfold) bottom-left.
- 5.5 → `/underworld`: the overlay fades and the page's notice is in exactly the same place (overlay the last overlay frame on the first page frame: the notice moves 0px). The backdrop doesn't pop, including the boat and lantern positions.
- Repeat at 390×844: it lands on the portrait pose, with the Gate in the top half.
- A repeat crossing (Ascend, then pay again) runs at 2×. Esc skips.
- Ascend from `/underworld`: the camera rises from the river, the flash hits, then the engraved shaft and Olympus. There's no notice going up.
- Reduced motion (Playwright `browser_emulate_media`): the 1s crossfade with no 3D and no flash. The notice opens at ~0.5s and stays fully visible for at least 1s in the overlay (time it from the recording), then it's on the page in the same spot.
- Olympus beats (0–3.0s): compare against a recording from before this task. There is no colour change (ACES stays off until the cut).
- Record a `chrome-devtools` trace of one full descent at 1440×900. No long frames over 50ms after the first second (shader compile at mount is allowed).

- [ ] **Step 6: Commit**

```bash
git add components/experience/descent-scene.tsx components/quest/crossing.tsx app/globals.css
git commit -m "feat: through the portal — flash, system notice and the glide to the sanzu"
```

---

### Task 9: ARISE and the shadow soldiers

Load `emil-design-eng`, `impeccable:impeccable`, `taste-skill:taste-skill` and `apple-design` first. It plays once, so it has to land: a hard, huge word, and seven silhouettes rising out of black water.

**Files:**
- Create: `components/underworld/arise.tsx`, `components/experience/sanzu/shadows.tsx`
- Modify: `components/experience/sanzu/index.tsx`, `components/underworld/realm.tsx`, `components/underworld/arena.tsx` (its two exits only; Task 10 rewrites the file), `lib/scene.ts`, `app/globals.css`

**Interfaces:**
- Consumes: `quest.arise`, `quest.get().arisen` (Task 1); `SYSTEM.arise` (Task 3); `playChime` (Task 7); `buildWisps`, `INK`, `SANZU`, `sanzuClock`, `TORII` (Task 5); `clamp01`, `easeOutCubic` (`lib/timeline.ts`)
- Produces:
  - `summon(): void` (from `components/underworld/arise.tsx`) — the only ARISE trigger; once per visitor, later calls just scroll to `#status`
  - `export default function AriseFlash()` — the ~1.2s word overlay; scrolls to `#status` when it ends
  - `export default function Shadows()` (from `sanzu/shadows.tsx`) — hidden until `arisen`, standing on later visits
  - `scene.ariseAt: number` (`performance.now()` of this session's ARISE; 0 if none)

- [ ] **Step 1: Add** `ariseAt` to `scene` in `lib/scene.ts`, after `noticeCarried`

```ts
  /** performance.now() when ARISE was pressed this session; 0 = not this session (the shadows are then already standing). */
  ariseAt: 0,
```

- [ ] **Step 2: Write** `components/experience/sanzu/shadows.tsx`

```tsx
"use client";
import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { quest } from "@/lib/quest";
import { scene } from "@/lib/scene";
import { clamp01, easeOutCubic } from "@/lib/timeline";
import { buildWisps } from "../wisps";
import { INK, SANZU, sanzuClock } from "./common";
import { TORII } from "./torii";

const RISE_DELAY_S = 0.35; // the word lands first
const RISE_S = 1.5;
const STAGGER_S = 0.08; // centre first, then outward
const FADE_S = 0.8; // reduced motion: fade in, don't rise
const DEPTH = 2.4; // how far under the water they start

// calibration knob: the formation — a shallow V opening away from the camera, in front of the torii, right of the boat.
const FORMATION = [-3, -2, -1, 0, 1, 2, 3].map((k) => ({
  x: TORII.x + k * 1.15,
  z: TORII.z + 3.6 - Math.abs(k) * 0.45,
  scale: k === 0 ? 1.25 : 1 - Math.abs(k) * 0.03,
  order: Math.abs(k),
}));

const vertex = /* glsl */ `
varying vec3 vNormalW;
varying vec3 vWorld;
#include <common>
#include <fog_pars_vertex>
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 mvPosition = viewMatrix * w;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

// Near-black bodies with a Monarch-violet rim where the surface turns away: shadows, not statues.
const fragment = /* glsl */ `
uniform vec3 uBody;
uniform vec3 uRim;
uniform float uOpacity;
varying vec3 vNormalW;
varying vec3 vWorld;
#include <common>
#include <fog_pars_fragment>
void main() {
  float facing = clamp(dot(normalize(vNormalW), normalize(cameraPosition - vWorld)), 0.0, 1.0);
  vec3 col = uBody + uRim * pow(1.0 - facing, 2.5) * 1.8;
  gl_FragColor = vec4(col, uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`;

/** Seven soldiers from primitives (legs, tapered torso, pauldrons, arms, head under a pointed hood, cloak), System-blue eyes. */
function buildArmy(low: boolean) {
  const body = new THREE.ShaderMaterial({
    uniforms: {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      uBody: { value: new THREE.Color(SANZU.shadow) },
      uRim: { value: new THREE.Color(INK.monarch) },
      uOpacity: { value: 1 },
    },
    vertexShader: vertex,
    fragmentShader: fragment,
    fog: true,
    transparent: true,
  });
  // HDR System blue: the eyes are the only part of a soldier that blooms.
  const eye = new THREE.MeshBasicMaterial({ color: new THREE.Color(INK.system).multiplyScalar(5), transparent: true });
  const geo = {
    leg: new THREE.CapsuleGeometry(0.11, 0.7, 4, 8),
    torso: new THREE.CylinderGeometry(0.34, 0.2, 0.8, 10),
    pauldron: new THREE.SphereGeometry(0.17, 12, 8),
    arm: new THREE.CapsuleGeometry(0.08, 0.62, 4, 8),
    head: new THREE.SphereGeometry(0.17, 16, 12),
    hood: new THREE.ConeGeometry(0.2, 0.36, 10),
    cloak: new THREE.ConeGeometry(0.5, 1.55, 12, 1, true),
    eye: new THREE.SphereGeometry(0.03, 8, 6),
    blade: new THREE.BoxGeometry(0.05, 1.3, 0.02),
  };
  const group = new THREE.Group();
  const soldiers = FORMATION.map((f, i) => {
    const s = new THREE.Group();
    const put = (g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, rz = 0, sy = 1) => {
      const mesh = new THREE.Mesh(g, m);
      mesh.position.set(x, y, z);
      mesh.rotation.z = rz;
      mesh.scale.y = sy;
      s.add(mesh);
    };
    for (const side of [-1, 1]) {
      put(geo.leg, body, side * 0.14, 0.46, 0);
      put(geo.pauldron, body, side * 0.38, 1.56, 0, 0, 0.7);
      put(geo.arm, body, side * 0.43, 1.13, 0.02, side * 0.12);
      put(geo.eye, eye, side * 0.06, 1.84, 0.16);
    }
    put(geo.torso, body, 0, 1.22, 0);
    put(geo.head, body, 0, 1.82, 0);
    put(geo.hood, body, 0, 2.06, -0.02);
    put(geo.cloak, body, 0, 0.98, -0.12);
    if (i === 3) put(geo.blade, body, 0.62, 0.95, 0.12, 0.08); // the knight in the centre carries a blade
    s.scale.setScalar(f.scale);
    s.position.set(f.x, -DEPTH, f.z);
    group.add(s);
    return s;
  });
  // Violet smoke curling up round their feet.
  const smoke = buildWisps(low ? 110 : 220, 9, 2.4, { color: INK.monarch, size: 40, maxSize: 8, speed: 0.35, intensity: 1.6 });
  smoke.points.position.set(TORII.x, 0, TORII.z + 3.2);
  group.add(smoke.points);
  // Left visible on purpose: the descent pre-compiles visible objects at mount, and the first frame hides it if not arisen.
  return {
    group,
    soldiers,
    body,
    eye,
    smoke,
    dispose() {
      Object.values(geo).forEach((g) => g.dispose());
      body.dispose();
      eye.dispose();
      smoke.points.geometry.dispose();
      smoke.material.dispose();
    },
  };
}

/** The shadow army (redesign spec §6): hidden until ARISE, rises once, then stands and sways; already standing on later visits. */
export default function Shadows() {
  const low = scene.tier === "low";
  const army = useMemo(() => buildArmy(low), [low]);
  useEffect(() => () => army.dispose(), [army]);

  // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
  useFrame(({ clock }) => {
    const { arisen } = quest.get();
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    army.group.visible = arisen;
    if (!arisen) return;
    // Seconds since ARISE this session. A visitor who arose on an earlier visit finds them standing (Infinity → done).
    const since = scene.ariseAt ? (performance.now() - scene.ariseAt) / 1000 : Infinity;
    const time = sanzuClock(clock.elapsedTime);
    const still = scene.reducedMotion;
    const fade = still ? clamp01(since / FADE_S) : 1;
    army.body.uniforms.uOpacity.value = fade;
    army.eye.opacity = fade;
    army.smoke.material.uniforms.uOpacity.value = still ? fade : clamp01((since - RISE_DELAY_S) / RISE_S);
    army.smoke.material.uniforms.uTime.value = time;
    army.soldiers.forEach((s, i) => {
      const k = still ? 1 : easeOutCubic((since - RISE_DELAY_S - FORMATION[i].order * STAGGER_S) / RISE_S);
      s.position.y = -DEPTH * (1 - k);
      s.rotation.z = Math.sin(time * 0.7 + i * 1.3) * 0.015 * k;
      s.rotation.x = Math.sin(time * 0.5 + i * 2.1) * 0.01 * k;
    });
  });

  return <primitive object={army.group} />;
}
```

(`easeOutCubic` in `lib/timeline.ts` clamps its input, and `Infinity` clamps to 1.)

- [ ] **Step 3: Mount the soldiers in the Sanzu.** In `components/experience/sanzu/index.tsx`, add `import Shadows from "./shadows";` and render `<Shadows />` right after `<Boat />`.

- [ ] **Step 4: Write** `components/underworld/arise.tsx`

```tsx
"use client";
import { useEffect, useState } from "react";
import { SYSTEM } from "@/lib/content";
import { quest } from "@/lib/quest";
import { scene } from "@/lib/scene";
import { playChime } from "@/components/quest/sound";

const ARISE_EVENT = "bm:arise";
const FLASH_MS = 1200;
const toStatus = () => document.getElementById("status")?.scrollIntoView({ behavior: scene.reducedMotion ? "auto" : "smooth", block: "start" });

/** ARISE (redesign spec §6): the ARISE button after a clear, or skipping the trial. Once per visitor; later it just goes to the Status Window. */
export function summon() {
  if (quest.get().arisen) {
    toStatus();
    return;
  }
  scene.ariseAt = performance.now(); // before arise(), so the soldiers' first visible frame is the start of the rise
  quest.arise();
  playChime();
  window.dispatchEvent(new Event(ARISE_EVENT));
}

/** The word: "ARISE" huge in League Gothic with a Monarch-violet glow for ~1.2s, then on to the Status Window. */
export default function AriseFlash() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let id = 0;
    const onArise = () => {
      setOn(true);
      window.clearTimeout(id);
      id = window.setTimeout(() => {
        setOn(false);
        toStatus();
      }, FLASH_MS);
    };
    window.addEventListener(ARISE_EVENT, onArise);
    return () => {
      window.removeEventListener(ARISE_EVENT, onArise);
      window.clearTimeout(id);
    };
  }, []);
  if (!on) return null;
  return (
    <div className="arise-flash" role="status" aria-live="assertive">
      <span className="arise-word font-display">{SYSTEM.arise}</span>
    </div>
  );
}
```

- [ ] **Step 5: Add the ARISE styles** to the end of `app/globals.css`

```css
/* ARISE (components/underworld/arise.tsx): a violet veil and the word, ~1.2s. Reduced motion: the word fades, no scale. */
.arise-flash {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  pointer-events: none;
  background: radial-gradient(ellipse at center, color-mix(in srgb, var(--color-monarch) 26%, transparent), transparent 70%);
  animation: arise-veil 1200ms ease-out both;
}
.arise-word {
  font-size: clamp(7rem, 28vw, 22rem);
  line-height: 0.85;
  text-transform: uppercase;
  color: var(--color-mist);
  text-shadow: 0 0 2px var(--color-monarch), 0 0 36px color-mix(in srgb, var(--color-monarch) 80%, transparent), 0 0 90px color-mix(in srgb, var(--color-monarch) 50%, transparent);
  animation: arise-word 1200ms both;
}
@keyframes arise-veil { 0% { opacity: 0; } 12% { opacity: 1; } 70% { opacity: 1; } 100% { opacity: 0; } }
@keyframes arise-word {
  0% { opacity: 0; transform: scale(1.18); animation-timing-function: cubic-bezier(0.23, 1, 0.32, 1); }
  22% { opacity: 1; transform: scale(1); }
  72% { opacity: 1; transform: scale(1.02); animation-timing-function: ease-in; }
  100% { opacity: 0; transform: scale(1.04); }
}
@media (prefers-reduced-motion: reduce) { .arise-word { animation-name: arise-veil; } }
```

- [ ] **Step 6: Mount the flash and wire the trial's exits.**
- `components/underworld/realm.tsx`: add `import AriseFlash from "./arise";` and render `<AriseFlash />` directly after the realm `<footer>` (inside the paid fragment).
- `components/underworld/arena.tsx`: add `import { summon } from "./arise";`. Replace the lobby's skip link `<a href="#card" className="arena-btn" onClick={() => quest.skipTrial()}>{ARENA.skip}</a>` with:

```tsx
                <button type="button" className="arena-btn" onClick={() => { quest.skipTrial(); summon(); }}>{ARENA.skip}</button>
```

  and replace the result's `<a href="#card" className="arena-btn arena-btn-primary">{ARENA.arise}</a>` with:

```tsx
                <button type="button" className="arena-btn arena-btn-primary" onClick={summon}>{ARENA.arise}</button>
```

- [ ] **Step 7: Gates**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: all green.

- [ ] **Step 8: Browser check.** `npm run dev`, first fixture, `/underworld`, 1440×900 and 390×844.
- Before: no soldiers anywhere.
- Press "Skip the trial":
  - "ARISE" slams in huge (it settles from 1.18× in ~260ms), glows violet, and is gone at ~1.2s.
  - From ~0.35s, seven dark silhouettes rise out of the water in front of the torii, centre first. Each takes ~1.5s, then stands and sways very slightly.
  - Their eyes are two System-blue points that bloom on desktop. They have a violet rim, violet smoke round their feet, and they reflect in the water on desktop.
  - The centre soldier is larger and carries a blade.
  - None of them overlaps the boat.
  - Capture stills at 0.2s, 0.6s, 1.2s, 2.5s.
- The page then scrolls toward `#status`. The target doesn't exist until Task 11, so nothing moves yet; that's expected.
- Reload: the soldiers are already standing. Press skip again: no word, no rise.
- Reduced motion (Playwright `browser_emulate_media`, with the first fixture again): the word fades in and out without scale, and the soldiers fade in where they stand.
- Descent with `arisen: true`: the Sanzu at the end of the fall already has the soldiers standing, and the handoff doesn't pop.

- [ ] **Step 9: Commit**

```bash
git add components/underworld/arise.tsx components/experience/sanzu/shadows.tsx components/experience/sanzu/index.tsx components/underworld/realm.tsx components/underworld/arena.tsx lib/scene.ts app/globals.css
git commit -m "feat: arise — seven shadows rise from the sanzu"
```

---
### Task 10: The Trial, reskinned as a Gate clear

Load `emil-design-eng`, `impeccable:impeccable`, `taste-skill:taste-skill` and `apple-design` first. The gameplay from the first plan's Task 10 is untouched: the input handler, the frame loop, scoring, timing, spawn and the pause-on-hidden clock are copied verbatim below. Only `draw()`, the colours and the JSX change.

**Files:**
- Replace: `components/underworld/arena.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: everything from `lib/arena.ts`; `rankFor` (Task 1); `quest.record`, `quest.skipTrial`, `type Best`, `useQuest` (first plan); `playHit` (first plan); `SystemWindow` (Task 7); `summon` (Task 9); `ARENA`, `SYSTEM` (Task 3)
- Produces: `<Arena />` rendering `section#trial`; CSS `.arena-field`, `.rank-letter`. The `.arena-btn` classes are removed.

- [ ] **Step 1: Replace** `components/underworld/arena.tsx`

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { ARENA, SYSTEM } from "@/lib/content";
import { EMPTY_TALLY, ROUND_MS, hitScore, isHit, lifespanMs, spawn, summarize, targetRadius, verdict, type Point, type Tally } from "@/lib/arena";
import { rankFor } from "@/lib/rank";
import { quest, type Best } from "@/lib/quest";
import { useQuest } from "@/components/quest/use-quest";
import { playHit } from "@/components/quest/sound";
import SystemWindow from "./system-window";
import { summon } from "./arise";

type Screen = "lobby" | "countdown" | "live" | "done";
type Target = Point & { born: number; life: number };
type Burst = Point & { born: number };
// Mirror --color-system, --color-monarch and --color-mist.
const SYSTEM_BLUE = "#4aa8ff";
const MONARCH = "#8b5cf6";
const MIST = "#cfd8e3";
const TAU = Math.PI * 2;
const BURST_MS = 220;

/** A sigil: a violet haze, a System-blue ring with turning ticks, a counter-turning violet hexagram, a mist core; the outer arc drains with its life. */
function draw(ctx: CanvasRenderingContext2D, w: number, h: number, target: Target, clock: number, bursts: Burst[], r: number) {
  ctx.clearRect(0, 0, w, h);
  const life = Math.max(0, 1 - (clock - target.born) / target.life);
  const { x, y } = target;
  const spin = clock * 0.0015;
  ctx.save();
  ctx.globalAlpha = 0.3 + 0.7 * life;
  const haze = ctx.createRadialGradient(x, y, r * 0.1, x, y, r * 1.7);
  haze.addColorStop(0, "rgba(139, 92, 246, 0.55)");
  haze.addColorStop(0.5, "rgba(74, 168, 255, 0.18)");
  haze.addColorStop(1, "rgba(74, 168, 255, 0)");
  ctx.fillStyle = haze;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.7, 0, TAU);
  ctx.fill();
  ctx.shadowColor = SYSTEM_BLUE;
  ctx.shadowBlur = 12;
  ctx.strokeStyle = SYSTEM_BLUE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = spin + (i * TAU) / 8;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.78);
    ctx.lineTo(x + Math.cos(a) * r * 0.92, y + Math.sin(a) * r * 0.92);
    ctx.stroke();
  }
  ctx.strokeStyle = MONARCH;
  ctx.shadowColor = MONARCH;
  ctx.lineWidth = 1.5;
  for (const off of [0, Math.PI]) {
    ctx.beginPath();
    for (let k = 0; k < 3; k++) {
      const a = -spin * 0.6 + off + (k * TAU) / 3 - Math.PI / 2;
      const px = x + Math.cos(a) * r * 0.62;
      const py = y + Math.sin(a) * r * 0.62;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  }
  ctx.fillStyle = MIST;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.12, 0, TAU);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = MIST;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.18, -Math.PI / 2, -Math.PI / 2 + TAU * life);
  ctx.stroke();
  ctx.restore();
  // Banished: a white-hot core, a sharp ring and eight shards flying out, all in BURST_MS with a strong ease-out.
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i];
    const k = (clock - b.born) / BURST_MS;
    if (k >= 1) {
      bursts.splice(i, 1);
      continue;
    }
    const e = 1 - Math.pow(1 - k, 3);
    ctx.globalAlpha = 1 - k;
    ctx.strokeStyle = SYSTEM_BLUE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(b.x, b.y, r * (0.9 + e * 1.1), 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = MIST;
    for (let s = 0; s < 8; s++) {
      const a = (s * TAU) / 8 + 0.2;
      const r0 = r * (0.4 + e * 1.2);
      const r1 = r0 + r * 0.45 * (1 - k);
      ctx.beginPath();
      ctx.moveTo(b.x + Math.cos(a) * r0, b.y + Math.sin(a) * r0);
      ctx.lineTo(b.x + Math.cos(a) * r1, b.y + Math.sin(a) * r1);
      ctx.stroke();
    }
    if (k < 0.35) {
      ctx.globalAlpha = 1 - k / 0.35;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(b.x, b.y, r * 0.5 * (1 - k), 0, TAU);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

export default function Arena() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [screen, setScreen] = useState<Screen>("lobby");
  const [count, setCount] = useState(3);
  const [hud, setHud] = useState({ timeLeft: ROUND_MS / 1000, score: 0, streak: 0 });
  const [result, setResult] = useState<(Best & { newBest: boolean }) | null>(null);
  const { best } = useQuest();

  const start = () => {
    setResult(null);
    setHud({ timeLeft: ROUND_MS / 1000, score: 0, streak: 0 });
    setCount(3);
    setScreen("countdown");
  };
  const skip = () => {
    quest.skipTrial();
    summon();
  };

  useEffect(() => {
    if (screen !== "countdown") return;
    let n = 3;
    const id = setInterval(() => {
      n -= 1;
      if (n > 0) setCount(n);
      else {
        clearInterval(id);
        setScreen("live");
      }
    }, 700);
    return () => clearInterval(id);
  }, [screen]);

  useEffect(() => {
    if (screen !== "live") return;
    const el = canvas.current!;
    const ctx = el.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio, 2);
    let w = 0;
    let h = 0;
    const resize = () => {
      const r = el.getBoundingClientRect();
      w = r.width;
      h = r.height;
      el.width = Math.round(w * dpr);
      el.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    let clock = 0; // round time in ms; stops while the tab is hidden
    let last = performance.now();
    let tally: Tally = EMPTY_TALLY;
    let streak = 0;
    let shown = { timeLeft: -1, score: -1, streak: -1 };
    const bursts: Burst[] = [];
    const next = (prev?: Point): Target => ({ ...spawn(Math.random, w, h, targetRadius(w, h), prev), born: clock, life: lifespanMs(clock) });
    let target = next();
    let raf = 0;

    const onDown = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const p = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      if (isHit(p, target, targetRadius(w, h))) {
        const reaction = clock - target.born;
        tally = { ...tally, score: tally.score + hitScore(reaction, target.life, streak), hits: tally.hits + 1, reactionTotalMs: tally.reactionTotalMs + reaction };
        streak += 1;
        bursts.push({ x: target.x, y: target.y, born: clock });
        playHit();
        target = next(target);
      } else {
        tally = { ...tally, misses: tally.misses + 1 };
        streak = 0;
      }
    };
    el.addEventListener("pointerdown", onDown);

    const frame = (now: number) => {
      if (!document.hidden) clock += Math.min(now - last, 100); // a stalled or hidden frame doesn't eat the round
      last = now;
      if (clock >= ROUND_MS) {
        const run = summarize(tally);
        setResult({ ...run, newBest: quest.record(run) });
        setScreen("done");
        return;
      }
      if (clock - target.born >= target.life) {
        tally = { ...tally, misses: tally.misses + 1 };
        streak = 0;
        target = next(target);
      }
      draw(ctx, w, h, target, clock, bursts, targetRadius(w, h));
      const timeLeft = Math.ceil((ROUND_MS - clock) / 1000);
      if (timeLeft !== shown.timeLeft || tally.score !== shown.score || streak !== shown.streak) {
        shown = { timeLeft, score: tally.score, streak };
        setHud(shown);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setScreen("lobby");
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
      ctx.clearRect(0, 0, w, h);
    };
  }, [screen]);

  const rank = result ? rankFor(result.score, ARENA.ryumaBest) : null;

  return (
    <section id="trial" aria-labelledby="trial-title" className="mx-auto w-full max-w-[1280px] px-4 py-24 md:px-8">
      <div className="flex flex-col gap-4">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-system">{ARENA.label}</p>
        <h2 id="trial-title" className="cap-trim font-display text-[clamp(3rem,7vw,6rem)] uppercase leading-[0.9]">{ARENA.title}</h2>
      </div>
      <div className="arena-field relative mt-10 aspect-[3/4] w-full overflow-hidden sm:aspect-[16/10]">
        <canvas
          ref={canvas}
          aria-label={ARENA.canvasLabel}
          className="absolute inset-0 size-full"
          style={{ touchAction: screen === "live" ? "none" : "auto", cursor: screen === "live" ? "crosshair" : "default" }}
        />

        {screen === "live" && (
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 flex justify-between p-4 font-mono text-xs uppercase tracking-[0.16em] text-mist">
            <span>{hud.timeLeft}s</span>
            <span className="tabular-nums">{hud.score.toLocaleString()}</span>
            <span>×{hud.streak}</span>
          </div>
        )}

        {screen === "lobby" && (
          <div className="absolute inset-0 grid place-items-center p-4 sm:p-6">
            <SystemWindow heading={ARENA.briefing.heading} level={3} className="w-full max-w-[26rem]">
              <ul className="flex flex-col gap-1.5 font-serif text-xl">
                {ARENA.briefing.lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" className="sys-btn sys-btn-primary" onClick={start}>
                  {ARENA.start}
                </button>
                <button type="button" className="sys-btn" onClick={skip}>
                  {ARENA.skip}
                </button>
              </div>
              {best && (
                <p className="mt-5 font-mono text-xs uppercase tracking-[0.16em] text-mist/70">
                  {ARENA.yourBest} · {ARENA.rank} {rankFor(best.score, ARENA.ryumaBest)} · <span className="tabular-nums">{best.score.toLocaleString()}</span>
                </p>
              )}
            </SystemWindow>
          </div>
        )}

        {screen === "countdown" && (
          <div aria-live="assertive" className="system-glow absolute inset-0 grid place-items-center font-display text-[clamp(6rem,20vw,14rem)]">
            {count}
          </div>
        )}

        {screen === "done" && result && rank && (
          <div className="absolute inset-0 grid place-items-center overflow-y-auto p-4 sm:p-6">
            <div aria-live="polite" className="flex w-full max-w-[30rem] flex-col gap-3">
              {result.newBest && <SystemWindow notice>{SYSTEM.levelUp}</SystemWindow>}
              <SystemWindow heading={ARENA.resultHeading} level={3}>
                <div className="flex items-end justify-between gap-6">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-mist/70">{ARENA.rank}</p>
                    <p className="rank-letter font-display" data-rank={rank}>
                      {rank}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-5xl leading-none tabular-nums">
                      <span className="sr-only">{ARENA.you} </span>
                      {result.score.toLocaleString()}
                    </p>
                    <p className="mt-2 font-mono text-xs uppercase tracking-[0.14em] text-mist/70">
                      {ARENA.ryuma} <span className="tabular-nums">{ARENA.ryumaBest.toLocaleString()}</span>
                    </p>
                  </div>
                </div>
                <p className="mt-4 font-serif text-lg italic">{verdict(result.score, ARENA.ryumaBest) === "taken" ? ARENA.taken : ARENA.held}</p>
                <dl className="mt-4 grid grid-cols-3 gap-4 border-t border-system/25 pt-4 font-mono text-xs uppercase tracking-[0.14em]">
                  <div>
                    <dt className="text-mist/60">{ARENA.stats.hits}</dt>
                    <dd className="mt-1 text-base tabular-nums">{result.hits}</dd>
                  </div>
                  <div>
                    <dt className="text-mist/60">{ARENA.stats.accuracy}</dt>
                    <dd className="mt-1 text-base tabular-nums">{Math.round(result.accuracy * 100)}%</dd>
                  </div>
                  <div>
                    <dt className="text-mist/60">{ARENA.stats.reaction}</dt>
                    <dd className="mt-1 text-base tabular-nums">{result.reactionMs} ms</dd>
                  </div>
                </dl>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" className="sys-btn" onClick={start}>
                    {ARENA.again}
                  </button>
                  <button type="button" className="sys-btn sys-btn-primary" onClick={summon}>
                    {ARENA.arise}
                  </button>
                </div>
              </SystemWindow>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Swap the button styles.** In `app/globals.css`, delete the whole `/* Underworld buttons (arena, card). */` block (`.arena-btn` through `.arena-btn-primary:hover`), and add at the end:

```css
/* The Trial (components/underworld/arena.tsx): a dark field for the sigils, and the rank letter. */
.arena-field {
  border: 1px solid color-mix(in srgb, var(--color-system) 30%, transparent);
  background: radial-gradient(ellipse at center, rgb(10 22 48 / 0.55), rgb(5 7 13 / 0.82));
  box-shadow: inset 0 0 60px color-mix(in srgb, var(--color-system) 8%, transparent);
}
.rank-letter {
  font-size: clamp(5rem, 16vw, 8rem);
  line-height: 0.8;
  color: var(--color-system);
  text-shadow: 0 0 2px var(--color-system), 0 0 30px color-mix(in srgb, var(--color-system) 55%, transparent);
}
.rank-letter[data-rank="S"] {
  color: var(--color-mist);
  text-shadow: 0 0 2px var(--color-monarch), 0 0 36px color-mix(in srgb, var(--color-monarch) 80%, transparent);
}
```

Run: `grep -rn "arena-btn" app components`
Expected: no output.

- [ ] **Step 3: Gates**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: all green.

- [ ] **Step 4: Browser check.** `npm run dev`, first fixture, `/underworld`, 1440×900 and 390×844.
- Switch sound on in the header first. Scroll to the Trial: the `[ QUEST ]` briefing window opens (line → unfold) and chimes once. It reads "Clear the Gate. / Banish the shades. / Time limit: 30s." in Newsreader, with Enter (primary) and Skip.
- Enter gives a 3-2-1 countdown, then 30s of sigils: a System-blue ring with turning ticks, a counter-turning violet hexagram, a violet haze, and a draining mist arc.
- A hit gives an instant white core flash, a ring and eight shards within ~220ms, plus the blip; the next sigil spawns far away. There is no input lag (hit feedback lands in the same frame as the click).
- An expired sigil breaks the streak. The HUD counts down. Esc returns to the briefing. Hiding the tab pauses the clock.
- The end: the `[ GATE CLEARED ]` window shows the rank letter, score, Ryuma's best, the verdict, and hits, accuracy and average reaction.
  - A first run shows the `[SYSTEM] LEVEL UP! A new personal best.` notice popping above it.
  - Check the rank against `rankFor(score, 5300)` by hand.
  - An S renders in mist with a violet glow.
- "Run it back" restarts. ARISE triggers Task 9's flash and soldiers. A second ARISE just scrolls.
- Reload: the briefing shows "Your best · Rank X · score".
- At 390×844 the field is portrait, sigils are at least 48px, tapping works without scrolling the page, and the result window fits (it scrolls inside the field if needed).
- Reduced motion: the windows fade (150ms) and the game still plays.
- Play one full round yourself and report the score and rank.

- [ ] **Step 5: Commit**

```bash
git add components/underworld/arena.tsx app/globals.css
git commit -m "feat: the trial as a ranked gate clear"
```

---

### Task 11: The Status Window

Load `emil-design-eng`, `impeccable:impeccable` and `taste-skill:taste-skill` first. It is Ryuma's character sheet, set in the System's own type: mono labels, League Gothic numbers, Newsreader values.

**Files:**
- Create: `components/underworld/status-window.tsx`
- Modify: `components/underworld/realm.tsx`

**Interfaces:**
- Consumes: `STATUS`, `ARENA.ryumaBest`, `SYSTEM.tag` (Task 3); `rankFor` (Task 1); `useQuest` (first plan); `SystemWindow` (Task 7); `.sys-btn` (Task 7)
- Produces: `<StatusWindow />` rendering `section#status` (the target of `summon()`'s scroll)

- [ ] **Step 1: Write** `components/underworld/status-window.tsx`

```tsx
"use client";
import type { ReactNode } from "react";
import { ARENA, STATUS, SYSTEM } from "@/lib/content";
import { rankFor } from "@/lib/rank";
import { useQuest } from "@/components/quest/use-quest";
import SystemWindow from "./system-window";

function Row({ label, value, big = false }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-system/15 pb-2">
      <dt className="font-mono text-xs uppercase tracking-[0.18em] text-system">{label}</dt>
      <dd className={big ? "font-display text-4xl leading-none tabular-nums" : "text-right font-serif text-xl"}>{value}</dd>
    </div>
  );
}

function Block({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-6">
      <h3 className="w-44 shrink-0 font-mono text-xs uppercase tracking-[0.22em] text-system">
        <span aria-hidden>[ </span>
        {heading}
        <span aria-hidden> ]</span>
      </h3>
      {children}
    </div>
  );
}

/** The Status Window (redesign spec §6): Ryuma's sheet, the visitor's record and a party invite. Locked until the Gate is cleared or skipped. */
export default function StatusWindow() {
  const { tried, best } = useQuest();
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-24 md:px-8">
      <SystemWindow id="status" heading={STATUS.heading} className="mx-auto max-w-[56rem] scroll-mt-8">
        {!tried ? (
          <div className="flex flex-col items-start gap-5 py-4">
            <p className="font-serif text-2xl italic text-mist/85">{STATUS.locked}</p>
            <a href="#trial" className="sys-btn">
              {STATUS.toGate}
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <dl className="grid grid-cols-1 gap-x-10 gap-y-3 sm:grid-cols-2">
              <Row label={STATUS.labels.name} value={STATUS.name} />
              <Row label={STATUS.labels.level} value={String(STATUS.level)} big />
              <Row label={STATUS.labels.job} value={STATUS.job} />
              <Row label={STATUS.labels.title} value={STATUS.title} />
            </dl>
            <dl className="grid grid-cols-5 gap-2 border-y border-system/20 py-4">
              {STATUS.stats.map((s) => (
                <div key={s.k} className="flex flex-col items-center gap-1">
                  <dt className="font-mono text-xs tracking-[0.18em] text-system">{s.k}</dt>
                  <dd className="font-display text-4xl leading-none tabular-nums md:text-5xl">{s.v}</dd>
                </div>
              ))}
            </dl>
            <Block heading={STATUS.skills.heading}>
              <ul className="flex flex-wrap gap-x-8 gap-y-2 font-serif text-lg">
                {STATUS.skills.list.map((s) => (
                  <li key={s.kind}>
                    <span className="font-mono text-xs uppercase tracking-[0.16em] text-mist/60">{s.kind}</span> · {s.name}
                  </li>
                ))}
              </ul>
            </Block>
            <Block heading={STATUS.equipment.heading}>
              <p className="font-serif text-lg">{STATUS.equipment.list.join(" · ")}</p>
            </Block>
            <Block heading={STATUS.recordHeading}>
              <p className="font-serif text-lg">
                {best ? (
                  <>
                    {STATUS.rankLabel} <span className="font-display text-3xl leading-none text-system">{rankFor(best.score, ARENA.ryumaBest)}</span> ·{" "}
                    <span className="tabular-nums">{best.score.toLocaleString()}</span>
                  </>
                ) : (
                  STATUS.unranked
                )}
              </p>
            </Block>
            <div className="flex flex-col items-start gap-4 border-t border-system/20 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-serif text-lg">
                <span className="sys-tag">{SYSTEM.tag}</span> {STATUS.invite.text}
              </p>
              <a href={STATUS.invite.href} className="sys-btn sys-btn-primary">
                {STATUS.invite.accept}
              </a>
            </div>
          </div>
        )}
      </SystemWindow>
    </div>
  );
}
```

Tailwind utilities can't override the unlayered `.sys-*` rules in `app/globals.css`, so don't pass margin or padding utilities to `SystemWindow`. Width, max-width and scroll-margin are fine, as used here.

- [ ] **Step 2: Mount it.** In `components/underworld/realm.tsx`, add `import StatusWindow from "./status-window";` and render `<StatusWindow />` directly after `<Arena />`.

- [ ] **Step 3: Gates**

Run: `npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: all green.

- [ ] **Step 4: Browser check.** `npm run dev`, 1440×900 and 390×844.
- First fixture (locked): `[ STATUS ]` opens when scrolled to and reads "Clear the Gate to unlock." with "To the Gate ↑", which scrolls to the Trial.
- Second fixture (4300 → rank A): the full sheet.
  - Name Ryuma, Level 27 in League Gothic.
  - Job Entry Fragger, title "One Who Drops Hot".
  - STR 41 · AGI 88 · PER 92 · VIT 47 · INT 76, big and in one row on both sizes.
  - Skills: Active · Drop Hot, Passive · Rotate Early, PvP · Battle royale · FPS.
  - Equipment: PC · Mobile.
  - Your Record: "Rank A · 4,300".
  - The party invite, with `[ Accept ]` opening a mail compose to Bhumil with the subject "Squad up — from the arena" (check the `href`).
- Third fixture: "Unranked".
- End to end from the first fixture: skip the trial → the ARISE word → the soldiers rise → the page smooth-scrolls so `#status` sits at the top, unlocked. If Lenis swallows the programmatic scroll, replace `toStatus` in `arise.tsx` with the version below and re-check:

```ts
const toStatus = () => {
  const el = document.getElementById("status");
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 32, behavior: scene.reducedMotion ? "auto" : "smooth" });
};
```

- The accessibility tree shows a region named "STATUS" with h3 sub-headings; brackets are not announced.
- Reduced motion: it fades in.

- [ ] **Step 5: Commit**

```bash
git add components/underworld/status-window.tsx components/underworld/realm.tsx components/underworld/arise.tsx
git commit -m "feat: the status window and a party invite"
```

---

### Task 12: End-to-end verification

Load `emil-design-eng` and `impeccable:impeccable` for the visual review. Fix only regressions you find, each in its own `fix: …` commit. Don't add features.

**Files:** none planned. Fixes touch whatever the regression is in.

- [ ] **Step 1: Gates on a clean tree**

Run: `git status --short && npm test && npx tsc --noEmit && npm run lint && npm run build`
Expected: an empty status, then all green.

- [ ] **Step 2: A "before" Olympus for the regression check.**

```bash
git worktree add /private/tmp/claude-501/-Users-bhumilmodi-Personal-work-My-Portfolio/olympus-before 1926f42
cd /private/tmp/claude-501/-Users-bhumilmodi-Personal-work-My-Portfolio/olympus-before && npm ci --prefer-offline && npx next dev -p 3100
```

Run it in the background. Commit `1926f42` is the last one before this plan. Don't symlink `node_modules` instead of installing: Turbopack rejects a symlink that points outside the project root.

- [ ] **Step 3: Screenshots per spec §12.** Playwright, saved under `/Users/bhumilmodi/.claude/browser-output/redesign/`, each at 1440×900 and 390×844:
- `/underworld` landing (first fixture): RYUMA, tagline, the `[SYSTEM]` notice, the Sanzu behind.
- The Trial briefing; a result (play a round); the ARISE word mid-flash, and the soldiers standing at 3s.
- The Status Window, unlocked (second fixture), locked (first fixture) and Unranked (third fixture).
- The footer credit on `/underworld` and on `/`, both legible (mono text reads cleanly over its ground at 100% zoom).
- `/` against `localhost:3100/` at the same scroll positions (hero, approach, record, footer): Olympus must match. Any visible difference is a regression.

- [ ] **Step 4: The descent and the ascend.** Repeat Task 8's timed stills (2.9 → 5.5s), including the frames at 4.25, 4.3 and 4.35: the style cut is never blended. Then record the ascend: river → flash → shaft → Olympus. Both at 1440×900 and 390×844.

- [ ] **Step 5: Reduced motion** (Playwright `browser_emulate_media`): the crossing is a 1s crossfade with the notice held for at least 1s; the Sanzu is a still frame with no parallax; the windows fade; the ARISE word appears without scale and the soldiers fade in.

- [ ] **Step 6: Performance.** Take `chrome-devtools` traces of 5s idle on `/underworld` at 1440×900 (normal tier), and of the same at 390×844 with 4× CPU throttling (low tier).
- Normal tier: a mean frame of about 16.7ms (≈60fps), with no long tasks over 50ms after load.
- Low tier: a steady frame rate with no stutter over 33ms.
- Record both numbers in the final report. If the desktop is over budget, apply Task 6 Step 8's reductions in that order.

- [ ] **Step 7: Console and storage.** `chrome-devtools` `list_console_messages` on `/`, `/underworld` and through a descent shows no errors. Block site data (Chrome DevTools → Application → Storage, or run with `localStorage` throwing by overriding `Storage.prototype.getItem` in the console before load): the site still works end to end in memory.

- [ ] **Step 8: Close out.** Remove the worktree (`git worktree remove /private/tmp/claude-501/-Users-bhumilmodi-Personal-work-My-Portfolio/olympus-before`). Commit any fixes (`fix: <what>`). Report the screenshots folder, the trace numbers and any calibration knobs moved.

---

## Spec coverage

| Spec | Where |
|---|---|
| §1 two worlds; IP line | Global Constraints; copy in Task 3 |
| §2 what stays/changes; removals (teal, isle, styx.tsx, Met credit on the Underworld) | Tasks 3, 5 |
| §3 composition: torii, portal, moon + reflection, lanterns (~40, one draw), lilies (~600, vertex sway), boat, hitodama, mist, ink sky with stars | Tasks 5, 6 |
| §3 look: PBR materials, ACES, exp fog, moon/portal/lantern lights (≤2 lantern lights), bloom on emissives only, ±0.15 rad parallax, no dither | Tasks 4, 5, 6 |
| §3 tiers, portrait 390×844, reduced-motion still frame, dark foreground under the footer | Tasks 5, 6 (`uNear`, `RIVER_CAMERA_PORTRAIT`) |
| §4 beats, flash at 4.3 with scanline, style switch under the flash, glide to `RIVER_CAMERA`, notice carried over, totals/skip/2×, ascend, reduced-motion hold, renames | Tasks 2, 8 |
| §5 SystemWindow look/type/opening/chime/semantics; arrival; briefing; sigils; result; rank bands; LEVEL UP; ARISE button | Tasks 1, 7, 10 |
| §6 ARISE flash, 7 soldiers, once only (`quest.arise()`), later visits standing, reduced motion, scroll to Status; Status layout, Accept, locked, placeholders, Unranked | Tasks 1, 9, 11 |
| §7 music | Task 3 |
| §8 palette, `.system-glow` | Task 3 |
| §9 units | File map |
| §10 bloom risk with fallback; procedural quality | Task 4; Tasks 5, 6 |
| §11 constraints | Global Constraints |
| §12 testing | Tasks 1, 2 (unit), 12 (browser, performance, regression, gates) |

## Open items and risks

- **Music, verified 2026-09-26.** "Oppressive Gloom" by Kevin MacLeod.
  - Commons file page: `https://commons.wikimedia.org/wiki/File:Oppressive_Gloom_(ISRC_USUAN1100885).mp3`.
  - The Commons API returns `LicenseShortName: CC BY 3.0`, category "Soundtrack music from Incompetech", 199.4s.
  - Direct upload: `https://upload.wikimedia.org/wikipedia/commons/3/30/Oppressive_Gloom_%28ISRC_USUAN1100885%29.mp3`.
  - It was chosen for its dark, ominous dungeon mood from its title and category; it has not been auditioned. If Bhumil prefers an Eastern flavour, the verified alternative is "Ishikari Lore" (`File:Ishikari Lore (ISRC USUAN1100192).mp3`, CC BY 3.0, "a new piece derived from Eastern folk music", 164s, `https://upload.wikimedia.org/wikipedia/commons/0/09/Ishikari_Lore_%28ISRC_USUAN1100192%29.mp3`). It is calmer than ominous. Swapping means changing one line in `scripts/fetch-audio.mjs` and rerunning it.
- **Bloom on the shared canvas.** Task 4 decides by screenshot and trace. The glow-sprite fallback is complete either way.
- **Placeholders.** `STATUS.level`, `STATUS.job`, `STATUS.stats` and `ARENA.ryumaBest` are for Bhumil to fill.
- **Lenis and programmatic scroll.** `summon()` scrolls with `scrollIntoView`; Task 11 Step 4 gives the fallback if Lenis swallows it.
- **Shader compile at the cut.** Task 8 pre-compiles the Sanzu at mount. If Task 8's trace still shows a long frame at 4.3s, record it in the report and ask before adding another mechanism.
