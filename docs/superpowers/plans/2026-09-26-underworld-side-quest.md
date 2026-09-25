# Underworld Side Quest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A hidden side quest under the portfolio: find three obols, pay Charon, fall from Olympus to the Styx in a 3D descent, play an aim trial, and claim Ryuma's player card, with a music theme on both sides.

**Architecture:** Pure logic lives in `lib/` with node tests: quest store, arena rules and descent timeline. The existing single fixed R3F canvas moves to the root layout so it survives the route change. The descent and the Styx are drei `View`s on that canvas. A layout-level `Crossing` overlay drives the descent from a time-based timeline and navigates to `/underworld` at the end. Music is a module-level Web Audio engine with per-realm tracks and `GainNode` crossfades.

**Tech Stack:** Next.js 16 App Router, React 19, three.js 0.186 + @react-three/fiber 9 + @react-three/drei 10, Tailwind CSS 4, Lenis, node:test with TypeScript type-stripping.

**Spec:** `docs/superpowers/specs/2026-09-26-underworld-side-quest-design.md`

## Global Constraints

- No new npm dependencies. Everything here uses what `package.json` already has. Dev scripts may use `ffmpeg` (installed at `/opt/homebrew/bin/ffmpeg`) and `sharp` (already used by `scripts/fetch-art.mjs`).
- Next.js 16 differs from training data. Before writing route or navigation code, read `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-router.md`, and heed deprecation notices.
- Underworld palette, verbatim: `--abyss #05080a`, `--styx #0e2626`, `--asphodel #cfd8d3`, `--soulfire #5ef2c2`. Olympus tokens (`--void #0b0907`, `--field #9a2a14`, `--bone #efe6d4`, `--ember #d0643b`) are untouched.
- Fonts stay League Gothic (`font-display`), Newsreader (`font-serif`) and JetBrains Mono (`font-mono`).
- Every `localStorage` read and write is wrapped in try/catch, and the site works when storage throws.
- `prefers-reduced-motion: reduce` gets no glint, no flight, no tilt or sheen, and a 1s crossfade instead of the 3D descent.
- Art: the no-nudity rule applies to the full image and the crop. `isle` (Met 435683) is already audited.
- Music is off by default and starts only on a user gesture. The credit "Music: Kevin MacLeod (incompetech.com), CC BY 3.0" appears on both realms.
- Copy lives in `lib/content.ts`.
- Tests: `npm test` runs `node --test 'lib/**/*.test.ts'`. Test files import siblings with the `.ts` extension (`./quest.ts`), and lib files importing lib files do the same.
- Frontend tasks (6, 7, 8, 9, 10, 11): load the `emil-design-eng`, `impeccable:impeccable` and `taste-skill:taste-skill` skills before writing UI. The project has no component library (`components/ui` and `components.json` don't exist), so don't add shadcn or any other UI library.
- Browser checks use the Orca CLI (`orca status`, then `orca tab create`, `orca snapshot`, …; load the `orca-cli` skill). Playwright is a fallback only. Use `chrome-devtools` for performance traces.
- Git: commit per task. No `Co-Authored-By` trailer, no AI attribution in any message, and never `git push`.
- ESLint: per-frame three.js mutations inside `useFrame` trip `react-hooks/immutability`. Silence each one exactly as the existing code does: `// eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state`.

## File map

| File | Task | Responsibility |
|---|---|---|
| `lib/quest.ts`, `lib/quest.test.ts` | 1 | quest store: obols, crossed, tried, best, sound; guarded storage |
| `components/quest/use-quest.ts` | 1 | `useQuest()`, `useHydrated()` hooks |
| `lib/arena.ts`, `lib/arena.test.ts` | 2 | aim-trial rules: lifespan, spawn, scoring, summary |
| `lib/descent.ts`, `lib/descent.test.ts` | 3 | descent timeline: beats, camera path, curves |
| `lib/scene.ts` | 3 | adds `crossingT`, `CROSS_EVENT`, `cross()` |
| `scripts/fetch-art.mjs`, `public/art/isle.png`, `public/art/manifest.json` | 4 | Isle of the Dead mask |
| `scripts/fetch-audio.mjs`, `public/audio/*` | 4 | music loops + manifest |
| `lib/content.ts` | 4 | all new copy |
| `components/sections/art.tsx` | 4 | `ArtName` gains `"isle"` |
| `components/quest/sound.tsx` | 5 | audio engine, `SoundSync`, `SoundToggle` |
| `app/layout.tsx` | 5, 8, 9 | mounts `SoundSync`, `StageLoader`, `Crossing` |
| `components/sections/nav.tsx` | 5 | sound toggle |
| `components/quest/obol.tsx`, `components/quest/quest-chip.tsx` | 6 | the hunt |
| `components/sections/approach.tsx`, `record.tsx`, `footer.tsx`, `app/page.tsx` | 6 | obol placement, chip mount |
| `app/underworld/page.tsx`, `components/underworld/{realm,gate,arrival}.tsx` | 7 | the realm route |
| `app/globals.css` | 6, 7, 9, 10, 11 | obol, realm, crossing, arena, card styles |
| `components/experience/styx.tsx` | 8 | water, isle, Charon's boat, wisps, backdrop |
| `components/experience/stage.tsx`, `engraving-material.ts` | 8, 9 | `stage` class; ink/ground options; instancing |
| `components/experience/descent-scene.tsx` | 9 | the 3D descent |
| `components/quest/crossing.tsx` | 9 | overlay, timeline driver, navigation |
| `components/underworld/arena.tsx` | 10 | the trial |
| `components/underworld/player-card.tsx` | 11 | the card |

Tasks 1–4 are independent. Task 5 needs 1 and 4. Tasks 6 and 7 need 1, 3, 4 and 5. Task 8 needs 3, 4 and 7. Task 9 needs 3, 5 and 8. Task 10 needs 1, 2, 4, 5 and 7. Task 11 needs 1, 4 and 7. Task 12 comes last.

---

### Task 1: Quest store

**Files:**
- Create: `lib/quest.ts`
- Create: `lib/quest.test.ts`
- Create: `components/quest/use-quest.ts`

**Interfaces:**
- Produces:
  - `type ObolId = "approach" | "record" | "footer"`
  - `OBOLS: readonly ObolId[]`
  - `type Best = { score: number; hits: number; accuracy: number; reactionMs: number }`, where `accuracy` is 0–1
  - `type QuestState = { obols: ObolId[]; crossed: boolean; tried: boolean; best: Best | null; sound: boolean }`
  - `INITIAL: QuestState`
  - `parse(raw: string | null): QuestState`
  - `createQuest(storage: KeyValue | null)`, returning `{ get(): QuestState; subscribe(l: () => void): () => void; pick(id: ObolId): void; cross(): void; record(run: Best): boolean; skipTrial(): void; setSound(on: boolean): void }`
  - `quest` (the browser singleton)
  - `paid(s: QuestState): boolean`
  - From `components/quest/use-quest.ts`: `useQuest(): QuestState` and `useHydrated(): boolean`

- [ ] **Step 1: Write the failing test** — `lib/quest.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { INITIAL, createQuest, paid, parse, type KeyValue } from "./quest.ts";

const memory = (): KeyValue => {
  const data = new Map<string, string>();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
};

test("picking is idempotent, keeps canonical order, and 3/3 pays the fare", () => {
  const q = createQuest(memory());
  q.pick("record");
  q.pick("record");
  assert.deepEqual(q.get().obols, ["record"]);
  assert.equal(paid(q.get()), false);
  q.pick("footer");
  q.pick("approach");
  assert.deepEqual(q.get().obols, ["approach", "record", "footer"]);
  assert.equal(paid(q.get()), true);
});

test("progress survives a reload through storage", () => {
  const s = memory();
  const a = createQuest(s);
  a.pick("approach");
  a.cross();
  a.setSound(true);
  assert.deepEqual(createQuest(s).get(), { ...INITIAL, obols: ["approach"], crossed: true, sound: true });
});

test("record keeps the higher score and marks the trial tried", () => {
  const q = createQuest(memory());
  assert.equal(q.record({ score: 3000, hits: 20, accuracy: 0.8, reactionMs: 420 }), true);
  assert.equal(q.record({ score: 2000, hits: 15, accuracy: 0.7, reactionMs: 500 }), false);
  assert.equal(q.get().best?.score, 3000);
  assert.equal(q.get().tried, true);
});

test("skipTrial unlocks the card without a best", () => {
  const q = createQuest(memory());
  q.skipTrial();
  assert.equal(q.get().tried, true);
  assert.equal(q.get().best, null);
});

test("throwing storage falls back to memory", () => {
  const broken: KeyValue = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("quota"); },
  };
  const q = createQuest(broken);
  q.pick("footer");
  assert.deepEqual(q.get().obols, ["footer"]);
});

test("parse rejects junk, unknown obols and malformed bests", () => {
  assert.deepEqual(parse(null), INITIAL);
  assert.deepEqual(parse("not json"), INITIAL);
  const s = parse(JSON.stringify({ obols: ["footer", "hades"], best: { score: "x" }, crossed: "yes" }));
  assert.deepEqual(s.obols, ["footer"]);
  assert.equal(s.best, null);
  assert.equal(s.crossed, false);
});

test("subscribers hear each change and can unsubscribe", () => {
  const q = createQuest(null);
  let calls = 0;
  const off = q.subscribe(() => calls++);
  q.pick("approach");
  q.pick("approach"); // no-op, no notify
  off();
  q.pick("record");
  assert.equal(calls, 1);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL, `Cannot find module '.../lib/quest.ts'`

- [ ] **Step 3: Implement** — `lib/quest.ts`

```ts
// Side-quest progress (spec §2): obols found, the crossing, the trial, the sound preference.
// Storage is optional — every access is guarded, and a failure leaves a working in-memory store.
export type ObolId = "approach" | "record" | "footer";
export const OBOLS: readonly ObolId[] = ["approach", "record", "footer"];

export type Best = { score: number; hits: number; accuracy: number; reactionMs: number };
export type QuestState = { obols: ObolId[]; crossed: boolean; tried: boolean; best: Best | null; sound: boolean };
export type KeyValue = Pick<Storage, "getItem" | "setItem">;

export const INITIAL: QuestState = { obols: [], crossed: false, tried: false, best: null, sound: false };
const KEY = "bm.quest.v1";

const isBest = (b: unknown): b is Best =>
  typeof b === "object" &&
  b !== null &&
  (["score", "hits", "accuracy", "reactionMs"] as const).every((k) => Number.isFinite((b as Record<string, unknown>)[k]));

export function parse(raw: string | null): QuestState {
  if (!raw) return INITIAL;
  try {
    const v = JSON.parse(raw) as Record<string, unknown>;
    const obols = Array.isArray(v.obols) ? v.obols : [];
    return {
      obols: OBOLS.filter((id) => obols.includes(id)),
      crossed: v.crossed === true,
      tried: v.tried === true,
      best: isBest(v.best) ? v.best : null,
      sound: v.sound === true,
    };
  } catch {
    return INITIAL;
  }
}

export function createQuest(storage: KeyValue | null) {
  let state = INITIAL;
  try {
    state = parse(storage?.getItem(KEY) ?? null);
  } catch {
    // blocked storage: stay in memory
  }
  const listeners = new Set<() => void>();
  const set = (next: QuestState) => {
    state = next;
    try {
      storage?.setItem(KEY, JSON.stringify(state));
    } catch {
      // quota or blocked: memory still holds it
    }
    listeners.forEach((l) => l());
  };
  return {
    get: () => state,
    subscribe(l: () => void) {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    pick(id: ObolId) {
      if (!state.obols.includes(id)) set({ ...state, obols: OBOLS.filter((o) => o === id || state.obols.includes(o)) });
    },
    cross() {
      if (!state.crossed) set({ ...state, crossed: true });
    },
    /** Records a finished run. Returns true when it beats the stored best. */
    record(run: Best): boolean {
      const better = !state.best || run.score > state.best.score;
      set({ ...state, tried: true, best: better ? run : state.best });
      return better;
    },
    skipTrial() {
      if (!state.tried) set({ ...state, tried: true });
    },
    setSound(on: boolean) {
      if (state.sound !== on) set({ ...state, sound: on });
    },
  };
}

export type Quest = ReturnType<typeof createQuest>;
export const paid = (s: QuestState) => s.obols.length === OBOLS.length;

function browserStorage(): KeyValue | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export const quest = createQuest(browserStorage());
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS, with all quest tests green alongside the existing suites

- [ ] **Step 5: Add the hooks** — `components/quest/use-quest.ts`

```ts
"use client";
import { useSyncExternalStore } from "react";
import { INITIAL, quest, type QuestState } from "@/lib/quest";

/** Quest state: INITIAL during SSR and hydration, the stored state right after. */
export function useQuest(): QuestState {
  return useSyncExternalStore(quest.subscribe, quest.get, () => INITIAL);
}

const never = () => () => {};
/** false during SSR and hydration, true once mounted — gates UI that must not flash its empty state. */
export function useHydrated(): boolean {
  return useSyncExternalStore(never, () => true, () => false);
}
```

- [ ] **Step 6: Lint and commit**

Run: `npm run lint`
Expected: no errors

```bash
git add lib/quest.ts lib/quest.test.ts components/quest/use-quest.ts
git commit -m "feat: quest store for the underworld side quest"
```

---

### Task 2: Arena rules

**Files:**
- Create: `lib/arena.ts`
- Create: `lib/arena.test.ts`

**Interfaces:**
- Consumes: `clamp01` from `lib/timeline.ts`
- Produces:
  - Constants: `ROUND_MS = 30000`, `LIFESPAN_START_MS = 1400`, `LIFESPAN_END_MS = 700`, `MIN_TARGET_PX = 48`
  - `lifespanMs(elapsedMs): number`
  - `targetRadius(w, h): number`
  - `type Point = { x: number; y: number }`
  - `spawn(rand: () => number, w, h, r, prev?: Point): Point`
  - `isHit(p: Point, target: Point, r): boolean`
  - `hitScore(reactionMs, lifespan, streak): number`
  - `type Tally = { score; hits; misses; reactionTotalMs }` and `EMPTY_TALLY`
  - `summarize(t: Tally): { score; hits; accuracy; reactionMs }`, which is structurally `Best`
  - `verdict(score, ryuma): "taken" | "held"`

- [ ] **Step 1: Write the failing test** — `lib/arena.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { EMPTY_TALLY, ROUND_MS, hitScore, isHit, lifespanMs, spawn, summarize, targetRadius, verdict } from "./arena.ts";

test("lifespan tightens from 1400ms to 700ms across the round and clamps", () => {
  assert.equal(lifespanMs(0), 1400);
  assert.equal(lifespanMs(ROUND_MS / 2), 1050);
  assert.equal(lifespanMs(ROUND_MS), 700);
  assert.equal(lifespanMs(-500), 1400);
  assert.equal(lifespanMs(ROUND_MS * 2), 700);
});

test("targets never shrink under the 48px touch floor", () => {
  assert.ok(targetRadius(320, 427) * 2 >= 48);
  assert.equal(targetRadius(2000, 1000), 45);
});

test("spawns stay inside the arena", () => {
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const [w, h] = [800, 500];
  const r = targetRadius(w, h);
  let prev;
  for (let i = 0; i < 500; i++) {
    const p = spawn(rand, w, h, r, prev);
    assert.ok(p.x >= r && p.x <= w - r && p.y >= r && p.y <= h - r, `out of bounds: ${p.x},${p.y}`);
    prev = p;
  }
});

test("spawn retries until the next target is a real flick away", () => {
  const seq = [0.5, 0.5, 0.5, 0.5, 0.95, 0.95];
  let i = 0;
  const rand = () => seq[i++];
  const [w, h] = [800, 500];
  const prev = { x: 400, y: 250 };
  const p = spawn(rand, w, h, targetRadius(w, h), prev);
  assert.ok(Math.hypot(p.x - prev.x, p.y - prev.y) >= Math.min(w, h) * 0.25);
  assert.equal(i, 6, "took the third candidate");
});

test("isHit is inclusive at the rim", () => {
  assert.equal(isHit({ x: 10, y: 0 }, { x: 0, y: 0 }, 10), true);
  assert.equal(isHit({ x: 10.01, y: 0 }, { x: 0, y: 0 }, 10), false);
});

test("hit score: base 100, up to +100 for speed, streak multiplier capped at 2x", () => {
  assert.equal(hitScore(0, 1000, 0), 200);
  assert.equal(hitScore(500, 1000, 0), 150);
  assert.equal(hitScore(1000, 1000, 0), 100);
  assert.equal(hitScore(0, 1000, 10), 400);
  assert.equal(hitScore(0, 1000, 50), 400);
});

test("summarize: accuracy counts timeouts and empty clicks as misses", () => {
  assert.deepEqual(summarize({ score: 900, hits: 3, misses: 1, reactionTotalMs: 1200 }), { score: 900, hits: 3, accuracy: 0.75, reactionMs: 400 });
  assert.deepEqual(summarize(EMPTY_TALLY), { score: 0, hits: 0, accuracy: 0, reactionMs: 0 });
});

test("a tie does not take the arena", () => {
  assert.equal(verdict(5300, 5300), "held");
  assert.equal(verdict(5301, 5300), "taken");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL, `Cannot find module '.../lib/arena.ts'`

- [ ] **Step 3: Implement** — `lib/arena.ts`

```ts
// Trial of Ryuma (spec §5): the aim trainer's rules. The canvas component only draws and handles input.
import { clamp01 } from "./timeline.ts";

export const ROUND_MS = 30_000;
export const LIFESPAN_START_MS = 1400;
export const LIFESPAN_END_MS = 700;
export const MIN_TARGET_PX = 48; // diameter floor for touch

/** How long a shade lives before it fades out; tightens linearly across the round. */
export function lifespanMs(elapsedMs: number): number {
  return LIFESPAN_START_MS + (LIFESPAN_END_MS - LIFESPAN_START_MS) * clamp01(elapsedMs / ROUND_MS);
}

/** Target radius for a w×h arena in CSS px: ~4.5% of the short side, never under the touch floor. */
export function targetRadius(w: number, h: number): number {
  return Math.max(MIN_TARGET_PX / 2, Math.min(w, h) * 0.045);
}

export type Point = { x: number; y: number };

/** A spawn point inside the arena, retried (up to 8×) until it is a quarter of the short side from the last one. */
export function spawn(rand: () => number, w: number, h: number, r: number, prev?: Point): Point {
  const pad = r + 8;
  const minGap = Math.min(w, h) * 0.25;
  let p: Point = { x: w / 2, y: h / 2 };
  for (let i = 0; i < 8; i++) {
    p = { x: pad + rand() * Math.max(0, w - 2 * pad), y: pad + rand() * Math.max(0, h - 2 * pad) };
    if (!prev || Math.hypot(p.x - prev.x, p.y - prev.y) >= minGap) break;
  }
  return p;
}

export const isHit = (p: Point, target: Point, r: number) => Math.hypot(p.x - target.x, p.y - target.y) <= r;

/** Points for one hit: 100, plus up to 100 for speed, times 1 + 0.1 per prior streak hit (capped at 2×). */
export function hitScore(reactionMs: number, lifespan: number, streak: number): number {
  const speed = Math.round(100 * (1 - clamp01(reactionMs / lifespan)));
  const multiplier = 1 + Math.min(streak, 10) * 0.1;
  return Math.round((100 + speed) * multiplier);
}

export type Tally = { score: number; hits: number; misses: number; reactionTotalMs: number };
export const EMPTY_TALLY: Tally = { score: 0, hits: 0, misses: 0, reactionTotalMs: 0 };

export function summarize(t: Tally): { score: number; hits: number; accuracy: number; reactionMs: number } {
  const shots = t.hits + t.misses;
  return {
    score: t.score,
    hits: t.hits,
    accuracy: shots ? t.hits / shots : 0,
    reactionMs: t.hits ? Math.round(t.reactionTotalMs / t.hits) : 0,
  };
}

export const verdict = (score: number, ryuma: number): "taken" | "held" => (score > ryuma ? "taken" : "held");
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/arena.ts lib/arena.test.ts
git commit -m "feat: aim trial rules"
```

---

### Task 3: Descent timeline and crossing event

**Files:**
- Create: `lib/descent.ts`
- Create: `lib/descent.test.ts`
- Modify: `lib/scene.ts`

**Interfaces:**
- Consumes: `clamp01`, `easeInOutCubic`, `smoothstep` from `lib/timeline.ts`
- Produces, from `lib/descent.ts`:
  - Timeline: `DESCENT_BEATS`, `type DescentBeat`, `DESCENT_S = 5.5`, `ASCENT_S = 3`, `type Direction = "down" | "up"`, `beatLocal(t, id)`, `timelineAt(elapsed, direction, speed?)`, `isDone(elapsed, direction, speed?)`
  - World and camera: `STYX_Y = -44`, `STYX_CAMERA = { position: [0, 1.2, 6], pitch: -0.06 }`, `DESCENT_FOV = 45`, `cameraAt(t): { pos: [x, y, z]; pitch }`
  - Curves: `coldness(t)`, `streak(t)`, `cloudOpacity(t)`, `olympusOpacity(t)`, `shaftOpacity(t)`, `styxOpacity(t)`, `titleOpacity(t)`, `backdropOpacity(t)`, `obolPose(t): { flip; drop; opacity }`
- Produces, from `lib/scene.ts`: `scene.crossingT: number`, `CROSS_EVENT = "bm:cross"`, `cross(direction: "down" | "up"): void`

- [ ] **Step 1: Write the failing test** — `lib/descent.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ASCENT_S, DESCENT_BEATS, DESCENT_S, STYX_CAMERA, STYX_Y,
  cameraAt, coldness, isDone, obolPose, styxOpacity, timelineAt,
} from "./descent.ts";

const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≉ ${b}`);

test("beats are contiguous and cover the whole descent", () => {
  assert.equal(DESCENT_BEATS[0].start, 0);
  assert.equal(DESCENT_BEATS[DESCENT_BEATS.length - 1].end, DESCENT_S);
  for (let i = 1; i < DESCENT_BEATS.length; i++) assert.equal(DESCENT_BEATS[i].start, DESCENT_BEATS[i - 1].end);
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

test("the camera starts on Olympus, ends on the Styx pose, and only ever falls", () => {
  const start = cameraAt(0);
  assert.deepEqual(start.pos, [0, 1.5, 7]);
  const end = cameraAt(DESCENT_S);
  near(end.pos[1], STYX_Y + STYX_CAMERA.position[1]);
  near(end.pos[2], STYX_CAMERA.position[2]);
  near(end.pitch, STYX_CAMERA.pitch);
  let lastY = Infinity;
  for (let t = 0; t <= DESCENT_S; t += 0.02) {
    const y = cameraAt(t).pos[1];
    assert.ok(y <= lastY + 1e-9, `rose at t=${t}`);
    lastY = y;
  }
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

test("the obol is gone before Olympus and the Styx is fully up at the end", () => {
  assert.equal(obolPose(0).opacity, 1);
  assert.equal(obolPose(0.6).opacity, 0);
  assert.equal(styxOpacity(DESCENT_S), 1);
  assert.equal(styxOpacity(0), 0);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL, `Cannot find module '.../lib/descent.ts'`

- [ ] **Step 3: Implement** — `lib/descent.ts`

```ts
// The crossing (spec §3): a time-driven fall from Olympus to the Styx, in seconds.
// Pure curves; the 3D scene and the DOM overlay both read them — the same split as lib/timeline.ts.
import { clamp01, easeInOutCubic, smoothstep } from "./timeline.ts";

export const DESCENT_BEATS = [
  { id: "fare", start: 0, end: 0.6 },
  { id: "olympus", start: 0.6, end: 1.8 },
  { id: "fall", start: 1.8, end: 3.0 },
  { id: "abyss", start: 3.0, end: 4.2 },
  { id: "styx", start: 4.2, end: 5.5 },
] as const;

export type DescentBeat = (typeof DESCENT_BEATS)[number]["id"];
export type Direction = "down" | "up";
export const DESCENT_S = 5.5;
export const ASCENT_S = 3;

export function beatLocal(t: number, id: DescentBeat): number {
  const b = DESCENT_BEATS.find((x) => x.id === id)!;
  return clamp01((t - b.start) / (b.end - b.start));
}

/** Timeline position (0 = Olympus, DESCENT_S = the Styx) after `elapsed` seconds. Ascent plays it backwards in ASCENT_S. */
export function timelineAt(elapsed: number, direction: Direction, speed = 1): number {
  const e = Math.max(0, elapsed) * speed;
  return direction === "down" ? Math.min(DESCENT_S, e) : Math.max(0, DESCENT_S - e * (DESCENT_S / ASCENT_S));
}

export function isDone(elapsed: number, direction: Direction, speed = 1): boolean {
  return elapsed * speed >= (direction === "down" ? DESCENT_S : ASCENT_S);
}

// World layout: Olympus sits at the origin, the Styx's waterline STYX_Y below it.
export const STYX_Y = -44;
/** Camera pose relative to the water. The Underworld backdrop uses it unchanged, so the handoff is frame-identical. */
export const STYX_CAMERA = { position: [0, 1.2, 6] as [number, number, number], pitch: -0.06 };
export const DESCENT_FOV = 45;

const easeIn = (x: number) => x * x * x;
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
type Key = { t: number; pos: [number, number, number]; pitch: number; ease: (x: number) => number };
// ease: the curve used to arrive at this key from the previous one. Tuned visually in Task 9.
const KEYS: Key[] = [
  { t: 0, pos: [0, 1.5, 7], pitch: 0, ease: easeInOutCubic },
  { t: 0.6, pos: [0, 1.5, 6.5], pitch: 0, ease: easeInOutCubic },
  { t: 1.8, pos: [0, 1, 3], pitch: -0.6, ease: easeInOutCubic },
  { t: 3.0, pos: [0, -14, 0], pitch: -Math.PI / 2, ease: easeIn },
  { t: 4.2, pos: [0, -38, 0], pitch: -1.2, ease: (x) => x },
  { t: DESCENT_S, pos: [STYX_CAMERA.position[0], STYX_Y + STYX_CAMERA.position[1], STYX_CAMERA.position[2]], pitch: STYX_CAMERA.pitch, ease: easeOut },
];

/** Camera position and pitch at timeline t (radians; 0 looks along -z, -π/2 straight down). */
export function cameraAt(t: number): { pos: [number, number, number]; pitch: number } {
  const x = Math.min(DESCENT_S, Math.max(0, t));
  const i = Math.max(1, KEYS.findIndex((k) => k.t >= x));
  const a = KEYS[i - 1];
  const b = KEYS[i];
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
export const shaftOpacity = (t: number) => smoothstep(2.6, 3.2, t) * (1 - smoothstep(4.6, 5.2, t));
export const styxOpacity = (t: number) => smoothstep(3.9, 4.6, t);
/** "You have crossed" (DOM). */
export const titleOpacity = (t: number) => smoothstep(4.6, 5.1, t);
/** Opaque backdrop behind the canvas that hides the page; in over the fare beat. */
export const backdropOpacity = (t: number) => smoothstep(0, 0.5, t);

/** The obol flips and drops out of frame through the fare beat. */
export function obolPose(t: number) {
  const f = beatLocal(t, "fare");
  return { flip: f * Math.PI * 3, drop: -3 * easeIn(f), opacity: 1 - smoothstep(0.7, 1, f) };
}
```

- [ ] **Step 4: Extend** `lib/scene.ts`. Replace the whole file with:

```ts
// Mutable per-frame state. The onboarding scroll reader and the crossing overlay write it; useFrame reads it.
// ponytail: a plain object, not a store — nothing re-renders from it, so nothing needs to subscribe.
export const scene = {
  progress: 0,
  tier: "high" as "high" | "low",
  reducedMotion: false,
  /** Crossing timeline position in seconds (lib/descent.ts), written by components/quest/crossing.tsx each frame. */
  crossingT: 0,
};

/** Browser-only. Detects tier and motion preference, flags missing WebGL on <html>. */
export function initScene(): boolean {
  const matches = (q: string) => window.matchMedia(q).matches;
  scene.reducedMotion = matches("(prefers-reduced-motion: reduce)");
  scene.tier = matches("(max-width: 768px)") || (navigator.hardwareConcurrency ?? 8) <= 4 ? "low" : "high";
  const gl = document.createElement("canvas").getContext("webgl2");
  gl?.getExtension("WEBGL_lose_context")?.loseContext(); // release the probe context, don't hold a GPU context we don't use
  const ok = Boolean(gl);
  if (!ok) document.documentElement.classList.add("no-webgl");
  return ok;
}

export const CROSS_EVENT = "bm:cross";
/** Starts the crossing between realms. components/quest/crossing.tsx listens; nothing happens until it is mounted. */
export function cross(direction: "down" | "up") {
  window.dispatchEvent(new CustomEvent(CROSS_EVENT, { detail: direction }));
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS, including the existing `timeline.test.ts`

- [ ] **Step 6: Commit**

```bash
git add lib/descent.ts lib/descent.test.ts lib/scene.ts
git commit -m "feat: descent timeline and crossing event"
```

---

### Task 4: Assets and copy

**Files:**
- Modify: `scripts/fetch-art.mjs:15-23` (the `ART` array)
- Create: `public/art/isle.png`, and update `public/art/manifest.json` (both generated)
- Create: `scripts/fetch-audio.mjs`
- Create: `public/audio/olympus.mp3`, `public/audio/underworld.mp3`, `public/audio/manifest.json` (all generated)
- Modify: `.gitignore`
- Modify: `components/sections/art.tsx:3`
- Modify: `lib/content.ts` (`FOOTER.meta`, plus new exports appended)

**Interfaces:**
- Produces:
  - Assets: `/art/isle.png`, `/audio/olympus.mp3`, `/audio/underworld.mp3`
  - `ArtName` includes `"isle"`
  - Copy exports: `SOUND`, `QUEST`, `CROSSING`, `UNDERWORLD`, `ARENA` (with `ARENA.ryumaBest: number`), `CARD`

- [ ] **Step 1: Add the Isle entry.** In `scripts/fetch-art.mjs`, add this entry to the `ART` array right after the `krater` line:

```js
  // Böcklin, Island of the Dead (1880). Audited 2026-09-26: one shrouded figure, no nudity.
  // Lit rock and the figure become ink; sky and water fall away. Tune levels until the sky is empty.
  { name: "isle", id: 435683, ink: "light", levels: [40, 150], width: 1000, crop: { left: 0.012, top: 0.02, right: 0.012, bottom: 0.02 } },
```

- [ ] **Step 2: Run the art script.** It re-fetches every piece.

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/fetch-art.mjs`
Expected: `✓ isle  2000×…` among the lines.
Then run `git status --short public/art`. Expected: `?? public/art/isle.png` and ` M public/art/manifest.json` only. If any other PNG or JPG shows as modified, restore it with `git checkout -- public/art/<that file>`.

- [ ] **Step 3: Look at the result.** Open `public/art/isle.png` with the Read tool.
- Pass: the island's lit rock faces, cypress silhouettes, the tomb openings and the small white figure in the boat read as dots, and the sky is empty.
- If the sky is speckled, raise the first `levels` value by 10 and re-run.
- If the island is too sparse, lower the second value by 15.
- Re-confirm there is no nudity anywhere in the image.

- [ ] **Step 4: Extend the `ArtName` type** in `components/sections/art.tsx:3`:

```ts
export type ArtName = "colosseum" | "carceri" | "sant-angelo" | "bust" | "krater" | "isle";
```

- [ ] **Step 5: Write the audio script** — `scripts/fetch-audio.mjs`

```js
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
```

- [ ] **Step 6: Ignore the temp dir and run the script.** Append `/.audio-tmp/` to `.gitignore` under the `# generated at build/asset-fetch time` block, then run:

Run: `node scripts/fetch-audio.mjs && ls -la public/audio && ffprobe -v error -show_entries format=duration -of csv=p=0 public/audio/olympus.mp3 public/audio/underworld.mp3`
Expected: `✓ olympus`, `✓ underworld`, each MP3 under 3,000,000 bytes, and durations of about 150.

- [ ] **Step 7: Add the copy.** In `lib/content.ts`, replace the `meta` line of `FOOTER` with:

```ts
  meta: [SITE.location, "The ferryman takes coin.", "Art: The Met, Open Access (CC0)", "Music: Kevin MacLeod (incompetech.com), CC BY 3.0", "© 2026"] as const,
```

Then append to the end of `lib/content.ts`:

```ts
// ── The Underworld side quest (spec: docs/superpowers/specs/2026-09-26-underworld-side-quest-design.md).
// Not a fact section: the facts-only rule does not apply here.

export const SOUND = { on: "♪ On", off: "♪ Off", label: "Background music" };

export const QUEST = {
  obol: "Obol",
  counter: "◇ Obols",
  pay: "Pay the ferryman →",
  enter: "◆ Underworld",
  console: "ΒΜ — three obols are hidden on this page. The ferryman takes coin.",
};

export const CROSSING = { title: "You have crossed", skip: "Skip ↵" };

export const UNDERWORLD = {
  metaTitle: "Ryuma — The Underworld",
  metaDescription: "Off duty. A side quest beneath the portfolio of Bhumil Modi.",
  brand: "Ryuma",
  ascend: "Ascend ↑",
  eyebrow: "The Underworld",
  name: "Ryuma",
  line: "By day, agents in production. By night —",
  gate: {
    eyebrow: "The Styx",
    title: "No fare, no crossing.",
    body: "The ferryman counts {n} of 3 obols. They are hidden above.",
    back: "← Back to Olympus",
  },
  credit: ["Music: Kevin MacLeod (incompetech.com), CC BY 3.0", "Art: The Met, Open Access (CC0)", "© 2026"],
};

export const ARENA = {
  label: "The Trial",
  title: "Trial of Ryuma",
  lede: "30 seconds. Banish the shades.",
  start: "Start",
  skip: "Skip the trial",
  again: "Run it back",
  claim: "Claim your card →",
  you: "You",
  ryuma: "Ryuma",
  held: "Ryuma still holds the arena.",
  taken: "You took the arena.",
  newBest: "New personal best.",
  yourBest: "Your best",
  stats: { hits: "Hits", accuracy: "Accuracy", reaction: "Avg reaction" },
  canvasLabel: "Arena. Click or tap the shades before they fade.",
  // Bhumil's own best. Placeholder until he plays the trial once (spec §5).
  ryumaBest: 5300,
};

export const CARD = {
  label: "The card",
  name: "Ryuma",
  aka: "a.k.a. Bhumil Modi",
  playsLabel: "Plays",
  plays: ["PvP", "Battle royale", "FPS"],
  onLabel: "On",
  on: ["PC", "Mobile"],
  quote: "I play the same way I ship: drop hot, rotate early.",
  stamp: "Challenger",
  locked: "Face the trial to claim this card.",
  toTrial: "To the trial ↑",
  cta: { label: "Squad up →", href: `mailto:${SITE.email}?subject=${encodeURIComponent("Squad up — from the arena")}` },
};
```

- [ ] **Step 7b: Update the README credits.** In `README.md`'s `## Credits` section, add the line `Music: Kevin MacLeod (incompetech.com), CC BY 3.0 — see public/audio/manifest.json.`

- [ ] **Step 8: Verify and commit**

Run: `npm run lint && npm test`
Expected: both clean

```bash
git add scripts/fetch-art.mjs scripts/fetch-audio.mjs public/art/isle.png public/art/manifest.json public/audio .gitignore components/sections/art.tsx lib/content.ts README.md
git commit -m "feat: isle art, realm music loops and side-quest copy"
```

---

### Task 5: Sound engine and toggle

**Files:**
- Create: `components/quest/sound.tsx`
- Modify: `app/layout.tsx`
- Modify: `components/sections/nav.tsx`

**Interfaces:**
- Consumes: `quest` from `lib/quest.ts` (`get().sound`, `setSound`), `SOUND` from `lib/content.ts`, `/audio/*.mp3` from Task 4
- Produces:
  - `type Realm = "olympus" | "underworld"`
  - Functions: `setSound(on: boolean): void`, `setRealm(next: Realm, seconds?: number): void`, `playHit(): void`
  - Hook: `useSound(): { on: boolean; available: boolean }`
  - Components: `<SoundSync />` and `<SoundToggle className? />`

- [ ] **Step 1: Write** `components/quest/sound.tsx`

```tsx
"use client";
import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { quest } from "@/lib/quest";
import { SOUND } from "@/lib/content";

export type Realm = "olympus" | "underworld";
const SRC: Record<Realm, string> = { olympus: "/audio/olympus.mp3", underworld: "/audio/underworld.mp3" };
const REALMS: Realm[] = ["olympus", "underworld"];
const LEVEL = 0.35; // calibration knob: music level, 0–1
const FADE_IN_S = 1;

// ponytail: one module-level engine, no context provider — there is exactly one soundtrack.
// Fades run through GainNodes because iOS Safari ignores HTMLMediaElement.volume.
type Track = { el: HTMLAudioElement; gain: GainNode };
let engine: { ctx: AudioContext; tracks: Record<Realm, Track> } | null = null;
let realm: Realm = "olympus";
let state = { on: false, available: true };
const listeners = new Set<() => void>();
const emit = (next: Partial<typeof state>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};

function build() {
  const ctx = new AudioContext();
  const make = (r: Realm): Track => {
    const el = new Audio(SRC[r]);
    el.loop = true;
    el.preload = "auto";
    el.addEventListener("error", () => emit({ on: false, available: false }));
    const gain = ctx.createGain();
    gain.gain.value = 0;
    ctx.createMediaElementSource(el).connect(gain).connect(ctx.destination);
    return { el, gain };
  };
  return { ctx, tracks: { olympus: make("olympus"), underworld: make("underworld") } };
}

function ramp(g: GainNode, to: number, seconds: number) {
  const now = g.context.currentTime;
  g.gain.cancelScheduledValues(now);
  g.gain.setValueAtTime(g.gain.value, now);
  g.gain.linearRampToValueAtTime(to, now + seconds);
}

/** Must run inside a user gesture the first time: it creates the AudioContext. */
export function setSound(on: boolean) {
  if (!state.available) return;
  emit({ on });
  quest.setSound(on);
  if (on) {
    engine ??= build();
    void engine.ctx.resume();
    const t = engine.tracks[realm];
    t.el.play().catch(() => emit({ on: false }));
    ramp(t.gain, LEVEL, FADE_IN_S);
  } else if (engine) {
    for (const r of REALMS) {
      const t = engine.tracks[r];
      ramp(t.gain, 0, 0.4);
      setTimeout(() => {
        if (!state.on) t.el.pause();
      }, 450);
    }
  }
}

/** Crossfades to the other realm's track. Always records the realm, so turning sound on later picks the right one. */
export function setRealm(next: Realm, seconds = 2.5) {
  if (next === realm) return;
  const prev = realm;
  realm = next;
  if (!engine || !state.on) return;
  const a = engine.tracks[prev];
  const b = engine.tracks[next];
  b.el.play().catch(() => {});
  ramp(b.gain, LEVEL, seconds);
  ramp(a.gain, 0, seconds);
  setTimeout(() => {
    if (realm !== prev) a.el.pause();
  }, seconds * 1000 + 50);
}

/** A short plucked blip for a trial hit. */
export function playHit() {
  if (!engine || !state.on) return;
  const { ctx } = engine;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(660, now);
  osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);
  g.gain.setValueAtTime(0.15, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  osc.connect(g).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.13);
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const SERVER = { on: false, available: true };
export const useSound = () => useSyncExternalStore(subscribe, () => state, () => SERVER);

/** Matches the track to the route, pauses with the tab, and honours a saved "on" at the visitor's first gesture. */
export function SoundSync() {
  const pathname = usePathname();
  useEffect(() => {
    setRealm(pathname.startsWith("/underworld") ? "underworld" : "olympus", 1.5);
  }, [pathname]);
  useEffect(() => {
    const onVisibility = () => {
      if (!engine) return;
      if (document.hidden) void engine.ctx.suspend();
      else if (state.on) void engine.ctx.resume();
    };
    // Browsers block autoplay, so a saved "on" resumes at the first gesture — unless that gesture is the toggle itself.
    const resume = (e: Event) => {
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
      if ((e.target as Element | null)?.closest?.("[data-sound-toggle]")) return;
      if (quest.get().sound && !state.on) setSound(true);
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointerdown", resume);
    window.addEventListener("keydown", resume);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
    };
  }, []);
  return null;
}

export function SoundToggle({ className = "" }: { className?: string }) {
  const { on, available } = useSound();
  if (!available) return null;
  return (
    <button
      type="button"
      data-sound-toggle
      aria-label={SOUND.label}
      aria-pressed={on}
      onClick={() => setSound(!on)}
      className={`font-mono text-xs uppercase tracking-[0.16em] transition-colors duration-150 active:scale-[0.97] ${className}`}
    >
      {on ? SOUND.on : SOUND.off}
    </button>
  );
}
```

- [ ] **Step 2: Mount `SoundSync`.** In `app/layout.tsx`, add `import { SoundSync } from "@/components/quest/sound";`, and render `<SoundSync />` right after `<SmoothScroll />`.

- [ ] **Step 3: Add the toggle to the nav.** In `components/sections/nav.tsx`, import `{ SoundToggle } from "@/components/quest/sound"`. Wrap the CTA `<a>` like this, moving `justify-self-end` onto the wrapper:

```tsx
      <div className="flex items-center gap-5 justify-self-end">
        <SoundToggle className="text-bone/85 hover:text-bone" />
        <a
          href={NAV.cta.href}
          className="border border-bone px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] transition-transform transition-colors duration-150 hover:bg-bone hover:text-field active:scale-[0.97]"
        >
          {NAV.cta.label}
        </a>
      </div>
```

- [ ] **Step 4: Verify in the browser.**
- Run `npm run lint && npm run build`. Expected: clean.
- Start `npm run dev`. With Orca (`orca status`, `orca tab create http://localhost:3000`), scroll past the onboarding.
- Click `♪ Off`. It should read `♪ On` and Gymnopédie should fade in.
- Click again: it fades out.
- Reload with sound on: it stays silent until the first click anywhere, then resumes.
- Hide and show the tab: playback pauses and resumes.
- Report what you observed.

- [ ] **Step 5: Commit**

```bash
git add components/quest/sound.tsx app/layout.tsx components/sections/nav.tsx
git commit -m "feat: realm music with gain-node crossfades and a sound toggle"
```

---

### Task 6: The hunt on Olympus

Load `emil-design-eng`, `impeccable:impeccable` and `taste-skill:taste-skill` first. The obol and the chip are the only new visuals on Olympus: they must look struck from the same engraving language, not like pasted-on game UI.

**Files:**
- Create: `components/quest/obol.tsx`
- Create: `components/quest/quest-chip.tsx`
- Modify: `components/sections/approach.tsx`, `components/sections/record.tsx`, `components/sections/footer.tsx`, `app/page.tsx`, `app/globals.css`

**Interfaces:**
- Consumes: `quest`, `OBOLS`, `paid`, `type ObolId` (Task 1); `useQuest`, `useHydrated` (Task 1); `cross` (Task 3); `QUEST` (Task 4)
- Produces: `<Obol id className? />`, `<QuestChip />`, and the `#quest-anchor` element

- [ ] **Step 1: Write** `components/quest/obol.tsx`

```tsx
"use client";
import { useRef } from "react";
import { quest, type ObolId } from "@/lib/quest";
import { QUEST } from "@/lib/content";
import { useHydrated, useQuest } from "./use-quest";

/** A hidden coin (spec §2). Renders nothing until hydrated and nothing once picked. */
export default function Obol({ id, className = "" }: { id: ObolId; className?: string }) {
  const hydrated = useHydrated();
  const { obols } = useQuest();
  const ref = useRef<HTMLButtonElement>(null);
  if (!hydrated || obols.includes(id)) return null;

  const pick = () => {
    const el = ref.current;
    if (!el || el.dataset.picked) return;
    el.dataset.picked = "";
    const coin = el.firstElementChild as HTMLElement;
    const from = coin.getBoundingClientRect();
    const to = document.getElementById("quest-anchor")?.getBoundingClientRect();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Fly a fixed-position clone so no overflow-hidden ancestor (the footer) can clip the flight.
    const ghost = coin.cloneNode(true) as HTMLElement;
    Object.assign(ghost.style, { position: "fixed", left: `${from.left}px`, top: `${from.top}px`, margin: "0", zIndex: "50", pointerEvents: "none" });
    document.body.append(ghost);
    el.style.visibility = "hidden";
    const frames: Keyframe[] =
      reduced || !to
        ? [{ opacity: 1 }, { opacity: 0 }]
        : [
            { transform: "translate(0, 0) scale(1)" },
            { transform: "translate(0, -28px) scale(1.35)", offset: 0.25 },
            { transform: `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(0.7)`, opacity: 0.85 },
          ];
    ghost
      .animate(frames, { duration: reduced ? 200 : 700, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "forwards" })
      .finished.finally(() => {
        ghost.remove();
        quest.pick(id);
      });
  };

  return (
    <button ref={ref} type="button" aria-label={QUEST.obol} onClick={pick} className={`-m-2 p-2 ${className}`}>
      <span aria-hidden className="obol block" />
    </button>
  );
}
```

- [ ] **Step 2: Write** `components/quest/quest-chip.tsx`

```tsx
"use client";
import { useEffect } from "react";
import { OBOLS, paid } from "@/lib/quest";
import { cross } from "@/lib/scene";
import { QUEST } from "@/lib/content";
import { useHydrated, useQuest } from "./use-quest";

let greeted = false;

/** Fixed HUD chip, bottom-left (spec §2). #quest-anchor is where picked obols fly; it exists before the chip shows. */
export default function QuestChip() {
  const hydrated = useHydrated();
  const s = useQuest();
  useEffect(() => {
    if (greeted) return;
    greeted = true;
    console.log(`%c${QUEST.console}`, "font: 13px/1.5 ui-monospace, monospace; color: #d0643b");
  }, []);

  const base = "quest-chip font-mono text-xs uppercase tracking-[0.16em]";
  let chip: React.ReactNode = null;
  if (hydrated && s.crossed) {
    chip = <button type="button" onClick={() => cross("down")} className={base}>{QUEST.enter}</button>;
  } else if (hydrated && paid(s)) {
    chip = <button type="button" onClick={() => cross("down")} className={`${base} quest-chip-ready`}>{QUEST.pay}</button>;
  } else if (hydrated && s.obols.length > 0) {
    chip = <span className={base}>{QUEST.counter} {s.obols.length}/{OBOLS.length}</span>;
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 md:bottom-8 md:left-8">
      <span id="quest-anchor" aria-hidden className="absolute bottom-1 left-1 size-7" />
      <div aria-live="polite">{chip}</div>
    </div>
  );
}
```

- [ ] **Step 3: Add the styles** to the end of `app/globals.css`

```css
/* Obol (components/quest/obol.tsx): a small struck coin; an ember glint crosses it every 8s. */
.obol {
  position: relative;
  width: 28px;
  height: 28px;
  border-radius: 9999px;
  overflow: hidden;
  background: radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--color-bone) 85%, var(--color-ember)) 0 22%, var(--color-ember) 62%, color-mix(in srgb, var(--color-ember) 55%, var(--color-void)));
  box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--color-void) 50%, transparent), inset 0 0 0 4px color-mix(in srgb, var(--color-bone) 30%, transparent);
  transition: transform 150ms ease-out;
}
button:hover > .obol { transform: scale(1.12); }
button:active > .obol { transform: scale(0.94); }
.obol::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(115deg, transparent 35%, rgb(255 255 255 / 0.7) 50%, transparent 65%);
  transform: translateX(-120%);
}
@media (prefers-reduced-motion: no-preference) {
  .obol::after { animation: obol-glint 8s ease-in-out infinite; }
}
@keyframes obol-glint { 0%, 88% { transform: translateX(-120%); } 100% { transform: translateX(120%); } }

/* Quest chip (components/quest/quest-chip.tsx). */
.quest-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.6rem 0.9rem;
  background: var(--color-void);
  color: var(--color-bone);
  border: 1px solid color-mix(in srgb, var(--color-bone) 35%, transparent);
  transition: opacity 200ms ease-out, transform 200ms ease-out, background-color 150ms ease-out;
}
@starting-style { .quest-chip { opacity: 0; transform: translateY(8px); } }
button.quest-chip:active { transform: scale(0.97); }
.quest-chip-ready { background: var(--color-ember); color: var(--color-void); border-color: var(--color-ember); }
```

- [ ] **Step 4: Place the three obols.**

In `components/sections/approach.tsx`, import `Obol from "@/components/quest/obol"`. Replace the `<CardArt …/>` line with a wrapper that carries the obol on item 4 (Measure), in the tile's empty bottom-right corner:

```tsx
              <div className="relative">
                <CardArt art={item.art} className="art-slot aspect-[2/1] w-full border border-ink" />
                {item.n === 4 && <Obol id="approach" className="absolute bottom-3 right-3" />}
              </div>
```

In `components/sections/record.tsx`, import `Obol`. Change the toolkit map to `RECORD.toolkit.map((t, i) => (` and put the coin after the last group's last item:

```tsx
                <ul className="flex flex-col gap-1 font-mono text-sm text-ink/70">
                  {t.items.map((item) => <li key={item}>{item}</li>)}
                  {i === RECORD.toolkit.length - 1 && <li><Obol id="record" /></li>}
                </ul>
```

In `components/sections/footer.tsx`, import `Obol`. Add it as the first child inside `<footer>`, after the scrim div. Also change the footer's `pb-6` to `pb-20 md:pb-24` so the meta row clears the fixed chip:

```tsx
      <Obol id="footer" className="absolute right-[14%] top-[36%]" />
```

- [ ] **Step 5: Mount the chip.** In `app/page.tsx`, import `QuestChip from "@/components/quest/quest-chip"` and render `<QuestChip />` after the closing `</div>` of the footer wrapper.

- [ ] **Step 6: Verify in the browser.**
- Run `npm run lint && npm run build`. Expected: clean.
- In Orca at `http://localhost:3000`:
  - No chip on a fresh visit (clear `localStorage` with `orca` devtools, or use a fresh profile).
  - Each obol is findable: the Approach "#4 Measure" tile corner, after "Auth0" in the Record toolkit, and on the footer relief.
  - Clicking one flies it to the bottom-left, and the chip shows `◇ Obols 1/3`.
  - At 3/3 the chip reads `Pay the ferryman →` in ember. Clicking it does nothing yet (Task 9).
  - Reload: progress is kept.
  - The console shows the greeting.
  - The footer meta shows "The ferryman takes coin." and the music credit, and the chip doesn't overlap them.
  - Tab to each obol with the keyboard; Enter picks it.
  - With reduced motion emulated: no glint, and pickup is a fade.
- Take screenshots of the three obol spots and the chip, and check them against `impeccable`'s critique pass.

- [ ] **Step 7: Commit**

```bash
git add components/quest/obol.tsx components/quest/quest-chip.tsx components/sections/approach.tsx components/sections/record.tsx components/sections/footer.tsx app/page.tsx app/globals.css
git commit -m "feat: hidden obols and the quest chip"
```

---

### Task 7: The Underworld route

Load `emil-design-eng`, `impeccable:impeccable` and `taste-skill:taste-skill` first. Read `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-router.md` and the Link docs under `03-api-reference/02-components/` before writing routes.

**Files:**
- Create: `app/underworld/page.tsx`
- Create: `components/underworld/realm.tsx`, `components/underworld/gate.tsx`, `components/underworld/arrival.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `useQuest`, `useHydrated`, `paid`; `cross`; `SoundToggle`; `UNDERWORLD`
- Produces:
  - The route `/underworld`
  - Tailwind colours `abyss`, `styx`, `asphodel`, `soulfire`, and the utility class `.soul-glow`
  - `realm.tsx` renders `<Arrival />` followed by the footer. Tasks 8, 10 and 11 insert `<StyxBackdrop />`, `<Arena />` and `<PlayerCard />` at the anchors named in their steps.

- [ ] **Step 1: Add the tokens.** In `app/globals.css`'s `@theme` block, add:

```css
  --color-abyss: #05080a;
  --color-styx: #0e2626;
  --color-asphodel: #cfd8d3;
  --color-soulfire: #5ef2c2;
```

Then append the realm rules to the end of the file:

```css
/* The Underworld (app/underworld): the cold inverse of Olympus. */
html:has(.realm-underworld), html:has(.realm-underworld) body { background: var(--color-abyss); }
.realm-underworld { color: var(--color-asphodel); }
.realm-underworld ::selection { background: var(--color-soulfire); color: var(--color-abyss); }
.realm-underworld :focus-visible { outline-color: var(--color-soulfire); }
.soul-glow {
  text-shadow: 0 0 2px color-mix(in srgb, var(--color-soulfire) 60%, transparent), 0 0 28px color-mix(in srgb, var(--color-soulfire) 32%, transparent);
}
```

- [ ] **Step 2: Write** `app/underworld/page.tsx`

```tsx
import type { Metadata } from "next";
import Realm from "@/components/underworld/realm";
import { UNDERWORLD } from "@/lib/content";

export const metadata: Metadata = {
  title: UNDERWORLD.metaTitle,
  description: UNDERWORLD.metaDescription,
  robots: { index: false }, // a secret, not a landing page
};

export default function Page() {
  return <Realm />;
}
```

- [ ] **Step 3: Write** `components/underworld/gate.tsx`

```tsx
import Link from "next/link";
import { UNDERWORLD } from "@/lib/content";

export default function Gate({ count }: { count: number }) {
  return (
    <section className="grid min-h-dvh place-items-center px-4 text-center">
      <div className="flex max-w-[40ch] flex-col items-center gap-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-asphodel/70">{UNDERWORLD.gate.eyebrow}</p>
        <h1 className="cap-trim font-display text-[clamp(3rem,10vw,7rem)] uppercase leading-[0.9]">{UNDERWORLD.gate.title}</h1>
        <p className="font-serif text-lg italic text-asphodel/85">{UNDERWORLD.gate.body.replace("{n}", String(count))}</p>
        <Link href="/#hero" className="border border-asphodel/60 px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] transition-colors duration-150 hover:bg-asphodel hover:text-abyss active:scale-[0.97]">
          {UNDERWORLD.gate.back}
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Write** `components/underworld/arrival.tsx`

```tsx
import { UNDERWORLD } from "@/lib/content";

export default function Arrival() {
  return (
    <section aria-labelledby="ryuma" className="mx-auto flex min-h-[80dvh] w-full max-w-[1280px] flex-col justify-end gap-6 px-4 pb-24 md:px-8">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-soulfire">{UNDERWORLD.eyebrow}</p>
      <h1 id="ryuma" className="soul-glow cap-trim font-display text-[clamp(5rem,18vw,16rem)] uppercase leading-[0.85]">{UNDERWORLD.name}</h1>
      <p className="max-w-[40ch] font-serif text-2xl italic text-asphodel/90 md:text-3xl">{UNDERWORLD.line}</p>
    </section>
  );
}
```

- [ ] **Step 5: Write** `components/underworld/realm.tsx`

```tsx
"use client";
import { paid } from "@/lib/quest";
import { cross } from "@/lib/scene";
import { UNDERWORLD } from "@/lib/content";
import { useHydrated, useQuest } from "@/components/quest/use-quest";
import { SoundToggle } from "@/components/quest/sound";
import Gate from "./gate";
import Arrival from "./arrival";

export default function Realm() {
  const hydrated = useHydrated();
  const s = useQuest();
  return (
    <div className="realm-underworld min-h-dvh">
      {/* z-30: the fixed WebGL canvas sits at z-20, and realm content must stay above it. */}
      <main className="relative z-30">
        {!hydrated ? null : !paid(s) ? (
          <Gate count={s.obols.length} />
        ) : (
          <>
            <header className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-4 py-4 md:px-8">
              <span className="font-display text-3xl uppercase leading-none tracking-wide">{UNDERWORLD.brand}</span>
              <div className="flex items-center gap-5">
                <SoundToggle className="text-asphodel/80 hover:text-asphodel" />
                <button
                  type="button"
                  onClick={() => cross("up")}
                  className="border border-asphodel/60 px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] transition-colors duration-150 hover:bg-asphodel hover:text-abyss active:scale-[0.97]"
                >
                  {UNDERWORLD.ascend}
                </button>
              </div>
            </header>
            <Arrival />
            <footer className="mx-auto flex w-full max-w-[1280px] flex-wrap justify-between gap-x-6 gap-y-2 px-4 pb-8 pt-16 font-mono text-xs uppercase tracking-[0.14em] text-asphodel/70 md:px-8">
              {UNDERWORLD.credit.map((c) => <span key={c}>{c}</span>)}
            </footer>
          </>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 6: Verify in the browser.**
- Run `npm run lint && npm run build`. Expected: clean, and the build lists `/underworld`.
- In Orca, a fresh profile at `/underworld` shows the gate with "counts 0 of 3", and its back link goes to `/#hero`.
- After collecting 3 obols on `/` (Task 6), `/underworld` shows the header, RYUMA arrival and credits on abyss.
- It shouldn't flash the gate before the realm.
- The Olympus page is unchanged.
- Check contrast and hierarchy with the `impeccable` critique.

- [ ] **Step 7: Commit**

```bash
git add app/underworld components/underworld app/globals.css
git commit -m "feat: underworld route with charon's gate"
```

---

### Task 8: The Styx and Charon's boat

Load `emil-design-eng` and `impeccable:impeccable` first. The Styx is the Underworld's backdrop and the final frame of the descent.

**Files:**
- Create: `components/experience/styx.tsx`
- Modify: `components/experience/engraving-material.ts` (ink/ground options)
- Modify: `components/experience/stage.tsx` (Canvas `className="stage"`)
- Modify: `app/layout.tsx` and `app/page.tsx` (move `StageLoader`)
- Modify: `components/underworld/realm.tsx` (mount the backdrop)

**Interfaces:**
- Consumes: `STYX_CAMERA`, `DESCENT_FOV` (Task 3); `scene`; `/art/isle.png` (Task 4)
- Produces:
  - `COLD` (the palette constants)
  - `buildWisps(count, width, height): { points: THREE.Points; material: THREE.ShaderMaterial }`, where the material has uniforms `uTime`, `uOpacity`, `uColor`
  - `<Styx fade?: () => number />`, with its local origin on the waterline
  - `<StyxBackdrop />`
  - `createEngravingMaterial({ ink?, ground? })`

- [ ] **Step 1: Add ink/ground colour options to the engraving material.** In `components/experience/engraving-material.ts`, replace the options type and factory with:

```ts
export type EngravingOptions = { spacing?: number; reveal?: number; opacity?: number; ink?: string; ground?: string };

// spacing is the dither cell size in device pixels — calibration knob for dot size.
// ink/ground default to Olympus bone on void; the Underworld passes asphodel on abyss.
export function createEngravingMaterial({ spacing = 3, reveal = 100, opacity = 1, ink = "#efe6d4", ground = "#0b0907" }: EngravingOptions = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uBone: { value: new THREE.Color(ink) },
      uVoid: { value: new THREE.Color(ground) },
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

- [ ] **Step 2: Move the canvas to the layout** so it survives route changes.
- In `app/page.tsx`, delete the `StageLoader` import and `<StageLoader />`.
- In `app/layout.tsx`, add `import StageLoader from "@/components/experience/stage-loader";` and render `<StageLoader />` right after `<SoundSync />`.
- In `components/experience/stage.tsx`, add `className="stage"` to `<Canvas …>`. Task 9's CSS keeps `.stage` visible during the crossing.

- [ ] **Step 3: Write** `components/experience/styx.tsx`

```tsx
"use client";
import { Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, PerspectiveCamera, View, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { DESCENT_FOV, STYX_CAMERA } from "@/lib/descent";
import { scene } from "@/lib/scene";
import { createEngravingMaterial } from "./engraving-material";
import SceneBoundary from "./scene-boundary";

// Mirror the --color-abyss/styx/asphodel/soulfire tokens in app/globals.css.
export const COLD = { abyss: "#05080a", styx: "#0e2626", asphodel: "#cfd8d3", soulfire: "#5ef2c2" };
const ISLE = "/art/isle.png";
const ISLE_ASPECT = 1.63; // calibration knob: width / height of public/art/isle.png

const bayer = /* glsl */ `
float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }
`;

const waterVertex = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

// Dark water that melts into the abyss with distance; soulfire glints dithered onto the swell crests.
const waterFragment = /* glsl */ `
uniform vec3 uAbyss;
uniform vec3 uStyx;
uniform vec3 uGlint;
uniform float uTime;
uniform float uOpacity;
uniform float uSpacing;
varying vec3 vWorld;
${bayer}
void main() {
  float d = length(vWorld.xz - cameraPosition.xz);
  float fog = smoothstep(8.0, 70.0, d);
  float swell = sin(vWorld.x * 0.7 + uTime * 0.6) * sin(vWorld.z * 1.3 - uTime * 0.4) + sin(vWorld.z * 0.35 + uTime * 0.25);
  float glint = smoothstep(1.2, 1.9, swell) * (1.0 - fog);
  float cell = bayer8(floor(gl_FragCoord.xy / uSpacing));
  vec3 col = mix(mix(uStyx, uAbyss, fog), uGlint, step(cell + 0.02, glint * 0.9));
  gl_FragColor = vec4(col, uOpacity);
  #include <colorspace_fragment>
}
`;

const uvVertex = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

// The dithered Isle mask (public/art/isle.png is alpha-only), inked flat.
const isleFragment = /* glsl */ `
uniform sampler2D uMap;
uniform vec3 uInk;
uniform float uOpacity;
varying vec2 vUv;
void main() {
  if (texture2D(uMap, vUv).a < 0.5) discard;
  gl_FragColor = vec4(uInk, uOpacity);
  #include <colorspace_fragment>
}
`;

const glowFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying vec2 vUv;
void main() {
  float d = length(vUv - 0.5) * 2.0;
  gl_FragColor = vec4(uColor, pow(max(0.0, 1.0 - d), 2.5) * uOpacity);
  #include <colorspace_fragment>
}
`;

const wispVertex = /* glsl */ `
uniform float uTime;
uniform float uHeight;
uniform float uSize;
uniform float uPixelRatio;
attribute float aRand;
varying float vAlpha;
void main() {
  vec3 p = position;
  p.y = mod(p.y + uTime * (0.4 + aRand * 0.6), uHeight);
  p.x += sin(uTime * 0.5 + aRand * 20.0) * 0.3;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * uPixelRatio / -mv.z;
  vAlpha = sin(3.14159 * p.y / uHeight);
}
`;

const wispFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  if (dot(c, c) > 0.25) discard;
  gl_FragColor = vec4(uColor, vAlpha * uOpacity * 0.8);
  #include <colorspace_fragment>
}
`;

/** Soul wisps rising through a width×height×width box (x, z centred on 0; y from 0 up). */
export function buildWisps(count: number, width: number, height: number) {
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
      uSize: { value: 5 }, // calibration knob: wisp size
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uColor: { value: new THREE.Color(COLD.soulfire) },
      uOpacity: { value: 1 },
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

const one = () => 1;

/** The Styx: water, the Isle of the Dead, Charon's boat, rising wisps. Local origin is the waterline; STYX_CAMERA frames it. */
export function Styx({ fade = one }: { fade?: () => number }) {
  const isleMap = useTexture(ISLE);
  const low = scene.tier === "low";
  const water = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uAbyss: { value: new THREE.Color(COLD.abyss) },
          uStyx: { value: new THREE.Color(COLD.styx) },
          uGlint: { value: new THREE.Color(COLD.soulfire) },
          uTime: { value: 0 },
          uOpacity: { value: 1 },
          uSpacing: { value: 3 },
        },
        vertexShader: waterVertex,
        fragmentShader: waterFragment,
        transparent: true,
      }),
    [],
  );
  const isle = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uMap: { value: isleMap },
          uInk: { value: new THREE.Color(COLD.asphodel).lerp(new THREE.Color(COLD.abyss), 0.55) },
          uOpacity: { value: 1 },
        },
        vertexShader: uvVertex,
        fragmentShader: isleFragment,
        transparent: true,
        depthWrite: false,
      }),
    [isleMap],
  );
  const hull = useMemo(buildHull, []);
  const wood = useMemo(() => {
    const m = createEngravingMaterial({ ink: COLD.asphodel, ground: COLD.abyss });
    m.side = THREE.DoubleSide;
    return m;
  }, []);
  const glow = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(COLD.soulfire) }, uOpacity: { value: 1 } },
        vertexShader: uvVertex,
        fragmentShader: glowFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  const wisps = useMemo(() => buildWisps(low ? 250 : 600, 30, 12), [low]);
  const boat = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const f = fade();
    const time = scene.reducedMotion ? 0 : clock.elapsedTime;
    water.uniforms.uTime.value = time;
    water.uniforms.uOpacity.value = f;
    isle.uniforms.uOpacity.value = f;
    wood.uniforms.uOpacity.value = f;
    glow.uniforms.uOpacity.value = f * (0.8 + 0.2 * Math.sin(time * 2.3));
    wisps.material.uniforms.uTime.value = time;
    wisps.material.uniforms.uOpacity.value = f;
    if (boat.current) {
      boat.current.position.y = Math.sin(time * 0.8) * 0.04;
      boat.current.rotation.z = Math.sin(time * 0.6) * 0.03;
    }
  });

  const isleW = 60; // calibration knob: how much of the horizon the Isle fills
  const isleH = isleW / ISLE_ASPECT;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={water} renderOrder={-1}>
        <planeGeometry args={[240, 240]} />
      </mesh>
      {/* 0.35: lifts the painting so its own waterline (~15% from the bottom) sits on ours. */}
      <mesh position={[0, isleH * 0.35, -60]} material={isle}>
        <planeGeometry args={[isleW, isleH]} />
      </mesh>
      {/* Charon's boat — position is a calibration knob; it must stay in frame on a portrait phone. */}
      <group position={[0.9, 0.28, 0.5]} rotation={[0, 0.5, 0]}>
        <group ref={boat}>
          <mesh geometry={hull} material={wood} />
          <mesh position={[0, 0.55, 1.05]} material={wood}>
            <coneGeometry args={[0.28, 1.15, 24]} />
          </mesh>
          <mesh position={[0, 1.2, 1.05]} material={wood}>
            <sphereGeometry args={[0.16, 24, 16]} />
          </mesh>
          <mesh position={[0.3, 0.9, 0.9]} rotation={[0.3, 0, -0.35]} material={wood}>
            <cylinderGeometry args={[0.025, 0.025, 2.8, 8]} />
          </mesh>
          <Billboard position={[0, 0.35, -1.55]}>
            <mesh material={glow}>
              <planeGeometry args={[0.7, 0.7]} />
            </mesh>
          </Billboard>
        </group>
      </group>
      <group position={[0, 0, -10]}>
        <primitive object={wisps.points} />
      </group>
    </group>
  );
}

/** The Underworld page's live backdrop: the Styx seen from exactly where the descent lands. */
export function StyxBackdrop() {
  return (
    <div aria-hidden className="fixed inset-0 z-0">
      <View className="size-full">
        <PerspectiveCamera makeDefault position={STYX_CAMERA.position} rotation={[STYX_CAMERA.pitch, 0, 0]} fov={DESCENT_FOV} near={0.1} far={200} />
        <SceneBoundary fallback={null}>
          <Suspense fallback={null}>
            <Styx />
          </Suspense>
        </SceneBoundary>
      </View>
    </div>
  );
}

if (typeof window !== "undefined") useTexture.preload(ISLE);
```

- [ ] **Step 4: Mount the backdrop.** In `components/underworld/realm.tsx`, add `import { StyxBackdrop } from "@/components/experience/styx";` and render `<StyxBackdrop />` as the first child of the `.realm-underworld` div, before `<main>`. The gate and the realm both sit on the water.

- [ ] **Step 5: Verify in the browser, and tune.**
- Run `npm run lint && npm run build`. Expected: clean. Add the `react-hooks/immutability` disable comments where lint asks, as the Global Constraints describe.
- In Orca, open `/underworld` (with 3 obols) at 1440×900 and 390×844, and screenshot both.
- What should show:
  - Dark water fading to black, with soulfire glints moving on the crests.
  - The Isle as a faint dotted silhouette on the horizon.
  - Charon's skiff with the hooded ferryman, a pole and a glowing prow, bobbing gently and fully in frame on the phone.
  - Wisps rising.
- Tune the marked calibration knobs until it reads as an etching (`ISLE_ASPECT`, `isleW`, the boat position, wisp size).
- Confirm Olympus still renders its 3D (onboarding bust and card art). The canvas now lives in the layout.
- With reduced motion emulated, the scene is still.

- [ ] **Step 6: Commit**

```bash
git add components/experience/styx.tsx components/experience/engraving-material.ts components/experience/stage.tsx app/layout.tsx app/page.tsx components/underworld/realm.tsx
git commit -m "feat: the styx backdrop with charon's boat"
```

---

### Task 9: The 3D descent and the crossing overlay

Load `emil-design-eng`, `apple-design` (continuous and interruptible motion) and `impeccable:impeccable` first. This is the centrepiece: a single continuous fall from heaven to hell.

**Files:**
- Modify: `components/experience/engraving-material.ts` (instancing in the vertex shader)
- Create: `components/experience/descent-scene.tsx`
- Create: `components/quest/crossing.tsx`
- Modify: `app/layout.tsx`, `app/globals.css`

**Interfaces:**
- Consumes:
  - Task 3: everything from `lib/descent.ts`, plus `scene.crossingT` and `CROSS_EVENT`
  - Task 8: `Styx`, `COLD`, `buildWisps`, and `createEngravingMaterial({ ink, ground })`
  - Task 5: `setRealm`
  - Task 1: `quest.cross()`
  - Task 4: `CROSSING`
- Produces: `<Crossing />`, mounted in the layout, which listens for `cross("down" | "up")`

- [ ] **Step 1: Teach the engraving shader instancing** so the shaft can be one draw call. In `components/experience/engraving-material.ts`, replace `vertexShader` with:

```ts
const vertexShader = /* glsl */ `
varying vec3 vNormal;
varying float vWorldY;
void main() {
  vec3 p = position;
  vec3 n = normal;
  #ifdef USE_INSTANCING
    p = (instanceMatrix * vec4(p, 1.0)).xyz;
    n = mat3(instanceMatrix) * n;
  #endif
  vNormal = normalize(normalMatrix * n);
  vec4 world = modelMatrix * vec4(p, 1.0);
  vWorldY = world.y;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;
```

- [ ] **Step 2: Write** `components/experience/descent-scene.tsx`

```tsx
"use client";
import { useCallback, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { STYX_Y, cameraAt, cloudOpacity, coldness, obolPose, olympusOpacity, shaftOpacity, streak, styxOpacity } from "@/lib/descent";
import { scene } from "@/lib/scene";
import { createEngravingMaterial } from "./engraving-material";
import { COLD, Styx, buildWisps } from "./styx";

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
  const material = new THREE.LineBasicMaterial({ color: WARM.bone, transparent: true, opacity: 0, depthWrite: false });
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

/** The fall from Olympus to the Styx (spec §3). Reads scene.crossingT; owns the view's camera. */
export default function DescentScene() {
  const low = scene.tier === "low";
  const clouds = useMemo(() => buildClouds(low ? 4000 : 9000), [low]);
  const rays = useMemo(() => buildRays(), []);
  const marble = useMemo(() => createEngravingMaterial({ spacing: 4 }), []);
  const coin = useMemo(() => createEngravingMaterial({ ink: WARM.ember }), []);
  const stone = useMemo(() => createEngravingMaterial({ ink: COLD.asphodel, ground: COLD.abyss }), []);
  const shaft = useMemo(() => buildShaft(low ? 5 : 9, stone), [low, stone]);
  const wisps = useMemo(() => buildWisps(low ? 250 : 600, 6, 36), [low]);
  const warm = useMemo(() => new THREE.Color(WARM.ember), []);
  const cold = useMemo(() => new THREE.Color(COLD.soulfire), []);
  const obol = useRef<THREE.Mesh>(null);
  const styxFade = useCallback(() => styxOpacity(scene.crossingT), []);

  useFrame(({ camera, clock }) => {
    const t = scene.crossingT;
    const { pos, pitch } = cameraAt(t);
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.rotation.set(pitch, 0, 0);

    const o = olympusOpacity(t);
    marble.uniforms.uOpacity.value = o;
    rays.material.opacity = 0.35 * o;

    const cu = clouds.material.uniforms;
    cu.uStretch.value = streak(t);
    cu.uTime.value = clock.elapsedTime;
    cu.uOpacity.value = cloudOpacity(t);
    cu.uColor.value.copy(warm).lerp(cold, coldness(t));

    stone.uniforms.uOpacity.value = shaftOpacity(t);
    wisps.material.uniforms.uOpacity.value = shaftOpacity(t);
    wisps.material.uniforms.uTime.value = clock.elapsedTime;

    const p = obolPose(t);
    coin.uniforms.uOpacity.value = p.opacity;
    if (obol.current) {
      obol.current.visible = p.opacity > 0.001;
      obol.current.rotation.set(Math.PI / 2 + p.flip, 0, 0);
      obol.current.position.y = 1.5 + p.drop;
    }
  });

  return (
    <>
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
      <group position={[0, STYX_Y, 0]}>
        <Styx fade={styxFade} />
      </group>
    </>
  );
}
```

- [ ] **Step 3: Write** `components/quest/crossing.tsx`

```tsx
"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PerspectiveCamera, View } from "@react-three/drei";
import { CROSSING } from "@/lib/content";
import { DESCENT_FOV, DESCENT_S, backdropOpacity, coldness, isDone, timelineAt, titleOpacity, type Direction } from "@/lib/descent";
import { quest } from "@/lib/quest";
import { CROSS_EVENT, scene } from "@/lib/scene";
import { smoothstep } from "@/lib/timeline";
import DescentScene from "@/components/experience/descent-scene";
import SceneBoundary from "@/components/experience/scene-boundary";
import { setRealm } from "./sound";

// Mirror --color-field and --color-abyss: the backdrop behind the canvas cools as the camera falls.
const FIELD = [154, 42, 20];
const ABYSS = [5, 8, 10];
const FALLBACK_S = 1;
let crossings = 0; // this session; a repeat crossing runs at 2×

type Run = { direction: Direction; speed: number; fallback: boolean };
const destination = (d: Direction) => (d === "down" ? { path: "/underworld", href: "/underworld" } : { path: "/", href: "/#hero" });

/** The crossing between realms (spec §3). Listens for cross() from lib/scene.ts. */
export default function Crossing() {
  const router = useRouter();
  const pathname = usePathname();
  const [run, setRun] = useState<Run | null>(null);
  const [pushedTo, setPushedTo] = useState<string | null>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLParagraphElement>(null);
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
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = skip.current ? Infinity : (now - t0) / 1000;
      let t: number;
      let done: boolean;
      let cover: number;
      if (fallback) {
        const f = Math.min(1, elapsed / FALLBACK_S);
        t = direction === "down" ? f * DESCENT_S : (1 - f) * DESCENT_S;
        done = f >= 1;
        cover = direction === "down" ? smoothstep(0, 0.4, f) : 1;
      } else {
        t = timelineAt(elapsed, direction, speed);
        done = isDone(elapsed, direction, speed);
        cover = direction === "down" ? backdropOpacity(t) : 1;
      }
      scene.crossingT = t;

      const c = coldness(t);
      if (backdrop.current) {
        backdrop.current.style.backgroundColor = `rgb(${FIELD.map((v, i) => Math.round(v + (ABYSS[i] - v) * c)).join(",")})`;
        backdrop.current.style.opacity = String(cover);
      }
      if (title.current) title.current.style.opacity = String(titleOpacity(t));
      // Once the backdrop is opaque, take the page out of layout so its own 3D views stop drawing over the descent.
      if (cover >= 0.999) root.dataset.crossing = "";
      if (!switched && (direction === "down" ? t >= 1.8 : t <= 3)) {
        switched = true;
        setRealm(direction === "down" ? "underworld" : "olympus");
      }
      if (done) {
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
    const id = setTimeout(() => {
      setRun(null);
      setPushedTo(null);
    }, 600);
    return () => clearTimeout(id);
  }, [leaving]);

  if (!run) return null;
  return (
    <div id="crossing" data-leaving={leaving ? "" : undefined}>
      <div ref={backdrop} className="crossing-backdrop" onClick={() => (skip.current = true)} />
      {!run.fallback && !leaving && (
        <View className="crossing-view">
          <PerspectiveCamera makeDefault fov={DESCENT_FOV} near={0.1} far={200} />
          <SceneBoundary fallback={null}>
            <Suspense fallback={null}>
              <DescentScene />
            </Suspense>
          </SceneBoundary>
        </View>
      )}
      <div className="crossing-hud">
        {run.direction === "down" && (
          <p ref={title} aria-live="polite" className="soul-glow cap-trim font-display text-[clamp(3rem,10vw,8rem)] uppercase leading-[0.9]" style={{ opacity: 0 }}>
            {CROSSING.title}
          </p>
        )}
        <button type="button" className="crossing-skip font-mono text-xs uppercase tracking-[0.2em]" onClick={() => (skip.current = true)}>
          {CROSSING.skip}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add the styles** to the end of `app/globals.css`

```css
/* The crossing (components/quest/crossing.tsx). #crossing is display:contents so the backdrop can sit under the
   canvas (z-15 < z-20) while the title sits over it (z-40). Once the backdrop is opaque, the page is taken out of
   layout, which also stops the page's other 3D views from drawing over the descent. */
html[data-crossing] body > :not(#crossing, .stage) { display: none; }
#crossing { display: contents; }
.crossing-backdrop { position: fixed; inset: 0; z-index: 15; opacity: 0; cursor: pointer; }
.crossing-view { position: fixed; inset: 0; z-index: 15; pointer-events: none; }
.crossing-hud { position: fixed; inset: 0; z-index: 40; display: grid; place-items: center; padding: 1rem; color: var(--color-asphodel); text-align: center; pointer-events: none; }
.crossing-skip { position: absolute; right: 1rem; bottom: 1rem; pointer-events: auto; color: color-mix(in srgb, var(--color-asphodel) 80%, transparent); }
.crossing-skip:hover { color: var(--color-asphodel); }
#crossing[data-leaving] .crossing-backdrop, #crossing[data-leaving] .crossing-hud { opacity: 0 !important; transition: opacity 600ms ease-out; }
```

- [ ] **Step 5: Mount the overlay.** In `app/layout.tsx`, add `import Crossing from "@/components/quest/crossing";` and render `<Crossing />` after `{children}`.

- [ ] **Step 6: Verify in the browser, and tune.**
- Run `npm run lint && npm run build && npm test`. Expected: clean. Add the `react-hooks/immutability` disable comments where lint asks.
- In Orca, collect 3 obols and click `Pay the ferryman →`. Record a screen capture or take screenshots at roughly t = 0.3, 1.2, 2.4, 3.6, 4.8 and 5.5s. Check each beat against the spec §3 table:
  1. The coin flips and drops.
  2. The warm colonnade tips down.
  3. Streaks rush upward while the colour cools.
  4. The spiral shaft rushes past with rising wisps.
  5. The camera brakes over the water beside Charon's boat, and `YOU HAVE CROSSED` appears.
- The handoff to `/underworld` must be invisible: no flash, jump or pop, and the water keeps moving.
- Music (if on) crossfades to *Danse macabre*.
- `Ascend ↑` rises back in about 3s and lands on `/#hero` without clouds lingering over the hero.
- A second crossing runs at 2×.
- Esc, Enter, a click, or `Skip ↵` all jump to the end.
- With reduced motion emulated: a 1s colour crossfade with the title, and no 3D.
- Tune the `KEYS` in `lib/descent.ts` and the curve bounds if a beat reads badly. Keep `npm test` green.
- Screenshot the phone viewport (390×844) too.

- [ ] **Step 7: Commit**

```bash
git add components/experience/engraving-material.ts components/experience/descent-scene.tsx components/quest/crossing.tsx app/layout.tsx app/globals.css lib/descent.ts
git commit -m "feat: 3d descent from olympus to the styx"
```

---

### Task 10: The Trial

Load `emil-design-eng`, `impeccable:impeccable` and `taste-skill:taste-skill` first. It has to feel like an FPS flick trainer: instant hit feedback, no input lag.

**Files:**
- Create: `components/underworld/arena.tsx`
- Modify: `components/underworld/realm.tsx`, `app/globals.css`

**Interfaces:**
- Consumes:
  - Task 2: everything from `lib/arena.ts`
  - Task 1: `quest.record`, `quest.skipTrial`, `type Best`, `useQuest`
  - Task 5: `playHit`
  - Task 4: `ARENA`
- Produces:
  - `<Arena />`, rendering `section#trial`
  - `.arena-btn` and `.arena-btn-primary` classes (Task 11 uses them)
  - A link to `#card`

- [ ] **Step 1: Write** `components/underworld/arena.tsx`

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { ARENA } from "@/lib/content";
import { EMPTY_TALLY, ROUND_MS, hitScore, isHit, lifespanMs, spawn, summarize, targetRadius, verdict, type Point, type Tally } from "@/lib/arena";
import { quest, type Best } from "@/lib/quest";
import { useQuest } from "@/components/quest/use-quest";
import { playHit } from "@/components/quest/sound";

type Screen = "lobby" | "countdown" | "live" | "done";
type Target = Point & { born: number; life: number };
type Burst = Point & { born: number };
const SOULFIRE = "#5ef2c2";
const ASPHODEL = "#cfd8d3";
const ABYSS = "#05080a";

/** A shade: a pale mask with hollow eyes in a soulfire haze, fading and ringed by its remaining life. */
function draw(ctx: CanvasRenderingContext2D, w: number, h: number, target: Target, clock: number, bursts: Burst[], r: number) {
  ctx.clearRect(0, 0, w, h);
  const life = Math.max(0, 1 - (clock - target.born) / target.life);
  const { x, y } = target;
  ctx.save();
  ctx.globalAlpha = 0.25 + 0.75 * life;
  const haze = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 1.6);
  haze.addColorStop(0, "rgba(94, 242, 194, 0.5)");
  haze.addColorStop(1, "rgba(94, 242, 194, 0)");
  ctx.fillStyle = haze;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = ASPHODEL;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.78, r, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = ABYSS;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(x + s * r * 0.32, y - r * 0.18, r * 0.17, r * 0.24, s * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.42, r * 0.14, r * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = SOULFIRE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.15, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * life);
  ctx.stroke();
  ctx.restore();
  // Banished: an expanding soulfire ring over 250ms.
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i];
    const k = (clock - b.born) / 250;
    if (k >= 1) {
      bursts.splice(i, 1);
      continue;
    }
    ctx.globalAlpha = 1 - k;
    ctx.strokeStyle = SOULFIRE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(b.x, b.y, r * (1 + k * 1.5), 0, Math.PI * 2);
    ctx.stroke();
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

  return (
    <section id="trial" aria-labelledby="trial-title" className="mx-auto w-full max-w-[1280px] px-4 py-24 md:px-8">
      <div className="flex flex-col gap-4">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-soulfire">{ARENA.label}</p>
        <h2 id="trial-title" className="cap-trim font-display text-[clamp(3rem,7vw,6rem)] uppercase leading-[0.9]">{ARENA.title}</h2>
      </div>
      <div className="relative mt-10 aspect-[3/4] w-full overflow-hidden border border-asphodel/25 bg-styx/80 sm:aspect-[16/10]">
        <canvas
          ref={canvas}
          aria-label={ARENA.canvasLabel}
          className="absolute inset-0 size-full"
          style={{ touchAction: screen === "live" ? "none" : "auto", cursor: screen === "live" ? "crosshair" : "default" }}
        />

        {screen === "live" && (
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 flex justify-between p-4 font-mono text-xs uppercase tracking-[0.16em]">
            <span>{hud.timeLeft}s</span>
            <span>{hud.score.toLocaleString()}</span>
            <span>×{hud.streak}</span>
          </div>
        )}

        {screen === "lobby" && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <div className="flex flex-col items-center gap-6">
              <p className="font-serif text-2xl italic">{ARENA.lede}</p>
              <div className="flex flex-wrap justify-center gap-3">
                <button type="button" className="arena-btn arena-btn-primary" onClick={start}>{ARENA.start}</button>
                <a href="#card" className="arena-btn" onClick={() => quest.skipTrial()}>{ARENA.skip}</a>
              </div>
              {best && (
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-asphodel/70">
                  {ARENA.yourBest} {best.score.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}

        {screen === "countdown" && (
          <div aria-live="assertive" className="soul-glow absolute inset-0 grid place-items-center font-display text-[clamp(6rem,20vw,14rem)]">
            {count}
          </div>
        )}

        {screen === "done" && result && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <div aria-live="polite" className="flex flex-col items-center gap-6">
              <p className="font-display text-[clamp(2.5rem,7vw,5rem)] uppercase leading-none">
                {ARENA.you} {result.score.toLocaleString()} <span className="text-asphodel/40">·</span> {ARENA.ryuma} {ARENA.ryumaBest.toLocaleString()}
              </p>
              <p className="font-serif text-xl italic">{verdict(result.score, ARENA.ryumaBest) === "taken" ? ARENA.taken : ARENA.held}</p>
              <dl className="grid grid-cols-3 gap-6 font-mono text-xs uppercase tracking-[0.14em]">
                <div>
                  <dt className="text-asphodel/60">{ARENA.stats.hits}</dt>
                  <dd className="mt-1 text-base">{result.hits}</dd>
                </div>
                <div>
                  <dt className="text-asphodel/60">{ARENA.stats.accuracy}</dt>
                  <dd className="mt-1 text-base">{Math.round(result.accuracy * 100)}%</dd>
                </div>
                <div>
                  <dt className="text-asphodel/60">{ARENA.stats.reaction}</dt>
                  <dd className="mt-1 text-base">{result.reactionMs} ms</dd>
                </div>
              </dl>
              {result.newBest && <p className="font-mono text-xs uppercase tracking-[0.16em] text-soulfire">{ARENA.newBest}</p>}
              <div className="flex flex-wrap justify-center gap-3">
                <button type="button" className="arena-btn" onClick={start}>{ARENA.again}</button>
                <a href="#card" className="arena-btn arena-btn-primary">{ARENA.claim}</a>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add the styles** to the end of `app/globals.css`

```css
/* Underworld buttons (arena, card). */
.arena-btn {
  display: inline-block;
  border: 1px solid color-mix(in srgb, var(--color-asphodel) 50%, transparent);
  padding: 0.75rem 1.25rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  transition: background-color 150ms ease-out, color 150ms ease-out, border-color 150ms ease-out, transform 100ms ease-out;
}
.arena-btn:hover { background: var(--color-asphodel); color: var(--color-abyss); }
.arena-btn:active { transform: scale(0.97); }
.arena-btn-primary { background: var(--color-soulfire); border-color: var(--color-soulfire); color: var(--color-abyss); }
.arena-btn-primary:hover { background: var(--color-asphodel); border-color: var(--color-asphodel); }
```

- [ ] **Step 3: Mount the trial.** In `components/underworld/realm.tsx`, import `Arena from "./arena"` and render `<Arena />` directly after `<Arrival />`.

- [ ] **Step 4: Verify in the browser.**
- Run `npm run lint && npm run build`. Expected: clean.
- In Orca on `/underworld`:
  - Start runs a 3-2-1 countdown, then 30s of shades.
  - Each hit plays a ring burst (and a blip if sound is on) and a new shade spawns far away.
  - Shades fade and their ring drains; an expired shade breaks the streak.
  - The HUD counts down.
  - The end screen shows YOU vs RYUMA, the verdict, hits, accuracy and average reaction. `Run it back` works, and `Claim your card →` scrolls to `#card` (the card comes in Task 11; the link target may not exist yet).
  - Reload: "Your best" shows in the lobby.
  - Esc mid-round returns to the lobby.
  - Hiding the tab mid-round pauses the clock.
  - At 390×844, the arena is portrait, shades are at least 48px, and tapping works without scrolling the page.
  - `Skip the trial` scrolls to `#card`.
- Play a full round yourself and report the score.

- [ ] **Step 5: Commit**

```bash
git add components/underworld/arena.tsx components/underworld/realm.tsx app/globals.css
git commit -m "feat: trial of ryuma aim trainer"
```

---

### Task 11: Ryuma's card

Load `emil-design-eng`, `apple-design` (tilt and springs) and `impeccable:impeccable` first.

**Files:**
- Create: `components/underworld/player-card.tsx`
- Modify: `components/underworld/realm.tsx`, `app/globals.css`

**Interfaces:**
- Consumes: `useQuest` (`tried`, `best`); `CARD`; `Art` with `name="bust"`; the `.arena-btn` classes (Task 10)
- Produces: `<PlayerCard />`, rendering `section#card`

- [ ] **Step 1: Write** `components/underworld/player-card.tsx`

```tsx
"use client";
import { useRef } from "react";
import Art from "@/components/sections/art";
import { CARD } from "@/lib/content";
import { useQuest } from "@/components/quest/use-quest";

export default function PlayerCard() {
  const { tried, best } = useQuest();
  const card = useRef<HTMLDivElement>(null);

  // Tilt toward the pointer; transforms only, driven by CSS custom properties. Mouse only — touch just scrolls.
  const onMove = (e: React.PointerEvent) => {
    const el = card.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - y) * 14}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 18}deg`);
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
  };
  const onLeave = () => {
    card.current?.style.setProperty("--rx", "0deg");
    card.current?.style.setProperty("--ry", "0deg");
  };

  return (
    <section id="card" aria-labelledby="card-title" className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-10 px-4 py-24 md:px-8">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-soulfire">{CARD.label}</p>
      {!tried ? (
        <div className="flex w-[min(360px,100%)] flex-col items-center gap-6 border border-dashed border-asphodel/30 px-6 py-16 text-center">
          <p className="font-serif text-xl italic">{CARD.locked}</p>
          <a href="#trial" className="arena-btn">{CARD.toTrial}</a>
        </div>
      ) : (
        <div className="player-card-stage">
          <div ref={card} className="player-card" onPointerMove={onMove} onPointerLeave={onLeave}>
            <div className="player-card-portrait">
              <Art name="bust" className="size-full text-asphodel [mask-size:cover]" />
            </div>
            <div className="flex flex-col gap-5 p-6">
              <div>
                <h2 id="card-title" className="soul-glow cap-trim font-display text-7xl uppercase leading-[0.85]">{CARD.name}</h2>
                <p className="mt-3 font-mono text-xs uppercase tracking-[0.16em] text-asphodel/70">{CARD.aka}</p>
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 font-mono text-xs uppercase tracking-[0.14em]">
                <dt className="text-soulfire">{CARD.playsLabel}</dt>
                <dd>{CARD.plays.join(" · ")}</dd>
                <dt className="text-soulfire">{CARD.onLabel}</dt>
                <dd>{CARD.on.join(" · ")}</dd>
              </dl>
              <blockquote className="font-serif text-lg italic leading-snug">“{CARD.quote}”</blockquote>
              {best && (
                <p className="player-card-stamp">
                  {CARD.stamp} · {best.score.toLocaleString()} · {Math.round(best.accuracy * 100)}% acc
                </p>
              )}
            </div>
            <div aria-hidden className="player-card-sheen" />
          </div>
          <a href={CARD.cta.href} className="arena-btn arena-btn-primary mt-10">{CARD.cta.label}</a>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Add the styles** to the end of `app/globals.css`

```css
/* Ryuma's card (components/underworld/player-card.tsx). */
.player-card-stage { display: flex; flex-direction: column; align-items: center; perspective: 900px; }
.player-card {
  position: relative;
  width: min(360px, 100%);
  overflow: hidden;
  background: var(--color-styx);
  color: var(--color-asphodel);
  border: 1px solid color-mix(in srgb, var(--color-soulfire) 55%, transparent);
  box-shadow: 0 0 0 4px var(--color-abyss), 0 0 0 5px color-mix(in srgb, var(--color-soulfire) 30%, transparent), 0 30px 60px -20px rgb(0 0 0 / 0.8);
  transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
  transition: transform 450ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
.player-card:hover { transition-duration: 90ms; }
.player-card-portrait { aspect-ratio: 4 / 3; background: var(--color-abyss); border-bottom: 1px solid color-mix(in srgb, var(--color-soulfire) 30%, transparent); }
.player-card-sheen {
  pointer-events: none;
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at var(--mx, 50%) var(--my, 50%), color-mix(in srgb, var(--color-soulfire) 22%, transparent), transparent 45%);
  mix-blend-mode: screen;
  opacity: 0;
  transition: opacity 200ms ease-out;
}
.player-card:hover .player-card-sheen { opacity: 1; }
.player-card-stamp {
  align-self: flex-start;
  border: 1px solid var(--color-soulfire);
  color: var(--color-soulfire);
  padding: 0.35rem 0.6rem;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  transform: rotate(-2deg);
}
/* Springs in when claimed. backwards fill: after the animation, the tilt transform owns the property again. */
@media (prefers-reduced-motion: no-preference) {
  .player-card { animation: card-in 700ms cubic-bezier(0.34, 1.56, 0.64, 1) backwards; }
}
@keyframes card-in { from { opacity: 0; transform: translateY(40px) rotateX(18deg) scale(0.92); } }
@media (prefers-reduced-motion: reduce) {
  .player-card { transform: none; transition: none; animation: card-fade 300ms ease-out backwards; }
  .player-card-sheen { display: none; }
}
@keyframes card-fade { from { opacity: 0; } }
```

- [ ] **Step 3: Mount the card.** In `components/underworld/realm.tsx`, import `PlayerCard from "./player-card"` and render `<PlayerCard />` directly after `<Arena />`.

- [ ] **Step 4: Verify in the browser.**
- Run `npm run lint && npm run build`. Expected: clean.
- In Orca:
  - Before any run, the card shows its locked state with a link to the trial.
  - After `Skip the trial`, the card appears with no stamp.
  - After a real run, the stamp shows the best score and accuracy.
  - The card springs in, tilts toward the mouse with a soulfire sheen, and settles on leave.
  - `Squad up →` is a `mailto:` with the subject "Squad up — from the arena".
  - At 390×844 it fits with no horizontal scroll.
  - Reduced motion: static, with a fade.
- Run the `impeccable` critique on a screenshot.

- [ ] **Step 5: Commit**

```bash
git add components/underworld/player-card.tsx components/underworld/realm.tsx app/globals.css
git commit -m "feat: ryuma's player card"
```

---

### Task 12: End-to-end verification

**Files:** none, unless a fix is needed. Each fix gets its own commit.

- [ ] **Step 1: Run the checks.** Use `superpowers:verification-before-completion`, then run:

Run: `npm test && npm run lint && npm run build`
Expected: all pass. Paste the tail of each output into the report.

- [ ] **Step 2: Do the full run in Orca** on a fresh profile at 1440×900, then at 390×844:
  1. Olympus shows no chip. Find all three obols; the chip counts up.
  2. Pay the ferryman, and watch the full descent (no skip).
  3. Land on the Underworld with an invisible handoff.
  4. Play the trial.
  5. Claim the card.
  6. Ascend, and land on the hero.
  7. `◆ Underworld` re-enters at 2×.
  8. A direct `/underworld` visit in a fresh profile shows the gate.
  9. Keyboard only: tab to each obol, the chip, `Skip ↵`, `Ascend ↑`, `Skip the trial` and `Squad up`.
  10. Emulated reduced motion: the whole flow still works, with no 3D descent.
  11. Sound on: Gymnopédie on Olympus, crossfading to *Danse macabre* during the fall, hit blips in the trial, crossfading back on Ascend.

- [ ] **Step 3: Take a performance trace.** Use `chrome-devtools` `performance_start_trace` and `performance_stop_trace` around one descent with 4× CPU throttling. Report long frames around the handoff to `/underworld`. If any frame is over 50ms at the handoff, fix it or report it with the trace insight.

- [ ] **Step 4: Report.** List what passed and what failed (with evidence), plus any calibration knobs that are still worth tuning. Remind Bhumil to play one round and replace `ARENA.ryumaBest` in `lib/content.ts` with his real score.
