# Underworld Spirit Broadcast Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/underworld` as a spirit broadcast. The Sanzu is drawn as glowing contour lines on a curved CRT, opening on a gothic halftone RYUMA mark, then a 250vh scroll ride, then a CRT-terminal Trial and Status screen.

**Architecture:**
- One full-screen spirit pass (`components/experience/spirit.tsx` + `spirit-material.ts`) takes over drawing for both Sanzu views: the backdrop, and the crossing after `GATE_CUT`.
- Scroll progress over a pinned track goes into `scene.ferry`. Pure curves in `lib/ferry.ts` turn it into a camera pose plus DOM opacities.
- DOM pieces are restyled through tokens and `.sys-*` / `.seal` classes in `app/globals.css`.

**Tech Stack:**
- Next 16.3.6 (read `node_modules/next/dist/docs/` before touching routing, fonts or metadata)
- React 19.2, three 0.186.1, @react-three/fiber 9.8.1, drei 10.7.8, Tailwind 4
- Tests: `node --test` on `lib/**/*.test.ts`

**Spec:** `docs/superpowers/specs/2026-10-02-underworld-spirit-broadcast-design.md`. Read it with this plan.

## Global Constraints

- Work on `feat/spirit-broadcast`. Commit freely, with no `Co-Authored-By` and no AI attribution. Never `git push`.
- **No new npm dependencies.** One new font only: `Grenze_Gotisch` (weight 800) via `next/font/google`, used inside `ryuma-mark.tsx` only.
- **Palette:**
  - `--color-void` #0b0907 is the ground; the CRT outside is #000.
  - `--color-bone` #efe6d4 is text and mark dots.
  - `--color-spirit` #52f5d6 is System text, borders and world lines.
  - `--color-seal` #b31f27 is the one red chip or button per screen.
  - `--color-ember` #d0643b is for DOM accents only.
  - The shader's red-key line colour #ff5c2e is a knob, not a token.
  - No `#4aa8ff`, no `#8b5cf6`, and no `--color-system`, `--color-monarch`, `--color-abyss` or `--color-mist` after Task 2.
- The ferry track is **250vh**, with a "Cross ↵" skip to `#trial`.
- Never call `setDpr` or resize the canvas for performance. Cap the offscreen target at 1.25 DPR on the backdrop.
- Unchanged: `lib/quest.ts`, `lib/arena.ts`, `lib/rank.ts`, the sound engine and the music. `DESCENT_S` = 5.5, `ASCENT_S` = 3 and `GATE_CUT` = 4.3 stay. The descent lands on `riverCamera(aspect)`.
- Every tunable number is a named const commented `// calibration knob:` with its range.
- **Verify:** `npm run lint && npm test && npm run build` exits 0.
- **Screenshots:** take them with Playwright MCP, because the Orca tab is throttled to 2fps. Save to `~/.claude/browser-output/`. Seed the quest with `localStorage.setItem('bm.quest.v1', JSON.stringify({obols:["approach","record","footer"],crossed:true,tried:true,best:{score:11142,hits:59,accuracy:0.72,reactionMs:392},sound:false,arisen:false}))`.
- **Frontend tasks** load the `emil-design-eng`, `impeccable:impeccable` and `taste-skill` skills.
- **Spike sources to lift, not rewrite:**
  - `git show 0656887:components/experience/ink-material.ts`: the spirit fragment shader
  - `git show 0656887:components/underworld/ryuma-mark.tsx`: the mark
  - `git show 4f8370a`: the ink harness

## Review Focus

1. **The crossing handoff pops.** The descent's last frame and the `/underworld` first frame must match in pose and in pass: `ferryPose(0, a)` equals `riverCamera(a)` (Task 4 test), and both views use the spirit pass (Task 1).
2. **Landing mid-track** (reload, or a `#trial` / `#status` hash): the camera, the card's opacity and the signal-loss state are set from scroll on the first frame. Task 5 reads progress synchronously before the first rAF.
3. **Reduced motion or no WebGL:** no 250vh empty track. The content is stacked and the mark still shows. Task 5 step 7, Task 9.
4. **The mark at 390px:** the thorns stay legible and the counters stay open. Task 5 screenshot.
5. **ARISE fired before the track finishes, or under signal loss:** the shades must be visible. Signal opacity is 0 for `p ≥ 1` (Task 4 test), and `summon()` scrolls to `#status`, which is below the track.

---

### Task 1: The spirit pass

**Files:**
- Cherry-pick `4f8370a`, then `git mv components/experience/ink.tsx components/experience/spirit.tsx` and `git mv components/experience/ink-material.ts components/experience/spirit-material.ts`
- Modify: `components/experience/sanzu/index.tsx`, `components/quest/crossing.tsx`

**Interfaces:**
- Produces:
  - `export default function Spirit(props: { on?: () => boolean; paused?: () => boolean; onReady?: () => void; maxDpr?: number }): null` (the cherry-picked `Ink`, with its `ink` prop renamed `on`)
  - `export function createSpiritMaterial(opts: { low: boolean }): THREE.ShaderMaterial`
  - `export const SPIRIT_KNOBS`
- Removes: `Bloom`, `bloomOn`, `GlowSprite` and `bloomBeat` (already gone in `4f8370a`).

- [ ] **Step 1: Bring the harness in.** `git cherry-pick 4f8370a`, then rename the files and symbols: `Ink` → `Spirit`, `createInkMaterial` → `createSpiritMaterial`, `INK_KNOBS` → `SPIRIT_KNOBS`, `inkFrame` → `spiritFrame`.
- [ ] **Step 2: Replace the fragment shader** with the spike's spirit shader (`git show 0656887:components/experience/ink-material.ts`, `fragment`).
  - Keep the Laplacian depth edges, the luminance Sobel, the radius-3 halo (inside `#ifndef LOW`), the red key to ember, the hot cores, the depth fade, and the CRT (barrel k 0.045, rounded mask, scanlines, grain, vignette).
  - Replace every inline literal in it with uniforms fed from `SPIRIT_KNOBS`, each with a range:
    - `depthEdge: [0.02, 0.06]`, `lumEdge: [1.0, 1.8]`, `lumWeight: 0.6`, `halo: 0.3`
    - `fill: 0.05`, `fade: 0.035`, `barrel: 0.045`, `scan: 0.14`, `grain: 0.05`
    - `spirit: #52f5d6`, `ember: #ff5c2e`
  - Grain animates: feed a `uTime` uniform written each frame, frozen under `scene.reducedMotion`.
  - Delete the ink-only uniforms.
- [ ] **Step 3: Rewire the call sites.**
  - `SanzuBackdrop` uses `<Spirit paused={crossingActive} onReady={backdropReady} maxDpr={BACKDROP_DPR} />`.
  - `crossing.tsx` uses `<Spirit on={() => scene.crossingT >= GATE_CUT} … />`.
- [ ] **Step 4: Run** `npm test`. Expected: PASS (48 or more).
- [ ] **Step 5: Screenshot** `/underworld` at 1440×900 and 390×844. Expected: it matches `~/.claude/browser-output/spirit4.jpg`, with dark water and no teal slab.
- [ ] **Step 6: Run the perf A/B.** Use the rAF frame-time script from the ink plan's Task 1, two 4s runs, against `git stash` of `main`'s bloom, same session. Record the mean and p95 in the commit body.
- [ ] **Step 7: Commit.** `git commit -m "feat: spirit pass replaces bloom on the Sanzu"`

---

### Task 2: Palette and signal-loss flash

**Files:**
- `app/globals.css`
- `components/experience/sanzu/common.ts`, `shadows.tsx`
- `components/experience/descent-scene.tsx`
- `components/underworld/*.tsx`, `components/quest/*.tsx`

**Interfaces:**
- Produces: the tokens `--color-spirit` and `--color-seal`, and `INK = { void: "#0b0907", bone: "#efe6d4", spirit: "#52f5d6", lily: "#c8232c" } as const` in `common.ts` (replacing the old keys).

- [ ] **Step 1: Replace classes mechanically.** `text-system` → `text-spirit`, `border-system` → `border-spirit`, `bg-system` → `bg-spirit`, `text-mist` → `text-bone`, `border-mist` → `border-bone`, `bg-mist` → `bg-bone`, `text-abyss` / `bg-abyss` → `text-void` / `bg-void`. Keep the opacity suffixes.
- [ ] **Step 2: Update `globals.css`.**
  - Delete the old Underworld tokens; add `--color-spirit` and `--color-seal`.
  - `.realm-underworld` is bone on #000; `::selection` is a spirit background with black text.
  - `.system-glow` becomes `text-shadow: 0 0 8px color-mix(in srgb, var(--color-spirit) 45%, transparent)`.
  - `.crossing-flash` becomes signal loss: a black screen with grain at full opacity and a single 2px bone line across the middle. Drop the blue radial.
  - Every `--color-monarch` use moves to `--color-seal`.
- [ ] **Step 3: Update the 3D colours.**
  - descent shaft engraving: `ink: INK.bone`, `ground: INK.void`
  - descent wisps and `cold`: `INK.spirit`
  - shade eyes: `INK.bone × 5`; shade rim: `INK.spirit`; shade smoke: `INK.spirit` at half intensity
- [ ] **Step 4: Check nothing is left.** `grep -rn "4aa8ff\|8b5cf6\|monarch\|color-system\|text-system\|abyss\|\bmist\b\|INK.system\|INK.mist" app components lib` must find nothing except `SANZU.mist`.
- [ ] **Step 5: Run the verify command, then commit.** `git commit -m "feat: spirit and seal palette; signal-loss crossing flash"`

---

### Task 3: Scene detail for outlines

**Files:** `components/experience/sanzu/sky.ts` (moon), `lanterns.ts`, `torii.ts`, `portal.ts`

**Interfaces:** Keep the exported names and the `TORII` layout constants (shadows and the portal plane depend on them), the instance counts, and the one-draw lanterns.

- [ ] **Step 1: The moon.** It becomes a ring: alpha `smoothstep(0.86, 0.9, r) * (1 - smoothstep(0.96, 1.0, r))`, plus a faint inner fill at 0.15. It lands as a thin hot ring through the pass.
- [ ] **Step 2: The lanterns.** Replace the box with a `CylinderGeometry(0.13, 0.15, 0.32, 12)` body on a `BoxGeometry(0.34, 0.04, 0.34)` base, merged into one instanced geometry. Delete `halos` and its geometry and material (unused since Task 1).
- [ ] **Step 3: The torii.** Add the shimaki (a beam under the kasagi, 0.85× its width) and black footings at each pillar base.
- [ ] **Step 4: The portal.** Halve the core intensity in `createPortalMaterial`, so the swirl reads as lines rather than a white blob.
- [ ] **Step 5: Screenshot at both sizes.** Expected: the moon is a ring, the lanterns read as cylinders, and the torii shows extra beam lines.
- [ ] **Step 6: Run the verify command, then commit.** `git commit -m "feat: moon ring, cylinder lanterns and torii detail for the spirit pass"`

---

### Task 4: Ferry curves (TDD)

**Files:** Create `lib/ferry.ts` and `lib/ferry.test.ts`

**Interfaces:**
- Consumes: `riverCamera` and `type Pose` from `lib/descent.ts`; `clamp01`, `smoothstep`, `fadeInOut` and `easeInOutCubic` from `lib/timeline.ts`.
- Produces:
  - `FERRY_BEATS`, with ids `card` 0–0.15, `reveal` 0.15–0.3, `ride` 0.3–0.7, `approach` 0.7–0.9, `through` 0.9–1
  - `type FerryBeat`
  - `ferryLocal(p: number, id: FerryBeat): number`
  - `FERRY_CUT = 0.95`
  - `REST_CAMERA` and `REST_CAMERA_PORTRAIT: Pose`
  - `ferryPose(p: number, aspect: number): Pose`
  - `cardOpacity(p: number): number`
  - `signalLoss(p: number): number`
  - `whisperOpacity(p: number, i: number, n: number): number`

- [ ] **Step 1: Write the failing tests** in `lib/ferry.test.ts`, in the style of `lib/descent.test.ts`:
  - `ferryLocal(0.15, "card") === 1` and `ferryLocal(0.15, "reveal") === 0`
  - for aspects 1.6 and 0.46: `ferryPose(0, a)` deep-equals `riverCamera(a)`, and `ferryPose(0.3, a)` deep-equals `riverCamera(a)` (the card and reveal beats hold the pose)
  - continuity: for p in [0, 1) step 0.001, excluding `[FERRY_CUT, FERRY_CUT + 0.001)`, consecutive positions differ by less than 0.5
  - `ferryPose(FERRY_CUT, a)` and `ferryPose(1, a)` deep-equal the rest pose for that aspect
  - `cardOpacity(0) === 1`, `cardOpacity(0.15) === 1`, `cardOpacity(0.3) === 0`, `cardOpacity(1) === 0`
  - `signalLoss(0) === 0`, `signalLoss(0.89) === 0`, `signalLoss(FERRY_CUT) === 1`, `signalLoss(1) === 0`, `signalLoss(1.5) === 0`
  - `whisperOpacity` is 0 outside `ride`, peaks at 1 in each slot, and two whispers are never both above 0.5 (sampled at step 0.005)
- [ ] **Step 2: Run** `npm test`. Expected: FAIL, because the module is missing.
- [ ] **Step 3: Implement `lib/ferry.ts`.**
  - Ride keys: from `riverCamera` to boat height about 60% of the way to the torii (end of `ride`), then centred on the torii with the portal at about 70% of frame height (end of `approach`), then pushed into the portal plane at `FERRY_CUT`.
  - Interpolate with `easeInOutCubic`. At `p ≥ FERRY_CUT`, return rest.
  - `signalLoss`: `smoothstep(0.9, 0.95, p)` up to the cut, then `1 − smoothstep(0.95, 1, p)`, and 0 for `p ≥ 1`.
  - `cardOpacity`: `1 − smoothstep(0.15, 0.3, p)`.
  - Every key is a calibration knob.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat: ferry broadcast curves"`

---

### Task 5: The broadcast track and the mark

**Files:**
- Create: `components/underworld/ferry.tsx`, `components/underworld/ryuma-mark.tsx` (from the spike)
- Modify: `components/underworld/realm.tsx`, `components/experience/sanzu/index.tsx` (`Rig`, `Boat` drift), `lib/scene.ts`, `lib/content.ts`, `app/globals.css`
- Delete: `components/underworld/arrival.tsx`

**Interfaces:**
- Consumes: Task 4's exports; `SystemWindow` (`notice`, `instant`); `scene.noticeCarried`.
- Produces:
  - `scene.ferry: number`
  - `export default function RyumaMark({ className }: { className?: string })`, and `export const gothic` (the `Grenze_Gotisch` font object, reused by Tasks 7 and 8)
  - the `.seal` chip class
  - `UNDERWORLD.whispers: string[]`, `UNDERWORLD.cross = "Cross ↵"`, `UNDERWORLD.enter = "Scroll to cross ↓"`

- [ ] **Step 1: Add the content.**
  - Set `UNDERWORLD.whispers` to `["By day, agents in production.", "By night —", "the one who holds the line."]`.
  - Add `UNDERWORLD.cross` and `UNDERWORLD.enter`.
  - Remove `UNDERWORLD.line`.
- [ ] **Step 2: Bring the mark in** from `git show 0656887:components/underworld/ryuma-mark.tsx`.
  - Give the pattern and mask ids `useId()` suffixes (the mark appears twice: on the card, and smaller on Status).
  - Refine the thorns by eye at 1440×900 and 390×844:
    - symmetric silhouette
    - each thorn tapers to a point
    - no thorn crosses a letter counter
  - Every thorn row is a calibration knob.
- [ ] **Step 3: Add `.seal`.** `background: var(--color-seal); color: var(--color-bone)`, 11px mono caps, tracking 0.2em, padding 6px 12px, `active` → `scale(0.97)`. Assert contrast at least 4.5 with a node one-liner and paste the ratio into the commit body.
- [ ] **Step 4: Build `ferry.tsx`.** It follows `onboarding.tsx`'s pattern.
  - A `section#ferry` of `h-[250vh]` with a `sticky top-0 h-dvh` stage.
  - A rAF loop reads `p`, writes `scene.ferry`, and sets the CSS vars `--card`, `--signal` and `--w0…--w2`. Read `p` once synchronously before the first rAF.
  - **Card:** the eyebrow, the mark inside an `h1` (`w-[min(90vw,860px)]`, a black radial field behind it via `::before`), the tagline in mono caps, a `.seal` link to `#trial`, and the `[SYSTEM]` slip (`instant` when carried). All at `opacity: var(--card)`.
  - **Reveal:** as `--card` falls, the mark's dot pattern scatters. Animate the `<pattern>` circle `r` from 2.3 to 0, and offset alternate dots outward through a CSS var fed into a `transform` on a second pattern layer. Keep it simple; the visual target is the dots dissolving.
  - **Whispers:** stacked mono-caps lines at `opacity: var(--wN)`.
  - **Signal loss:** a fixed full-screen layer at `opacity: var(--signal)` with an SVG `feTurbulence` grain and a 2px bone line, `pointer-events-none`, above the canvas and below the header.
  - **Skip:** "Cross ↵" bottom right. Enter on `body` focus clicks it while `p < 1`.
- [ ] **Step 5: Drive the camera.** In `Rig`, `ferryPose(scene.ferry, aspect)` replaces `riverCamera(aspect)`, with the lean still on top. In `Boat`, the position derives from `scene.ferry` so it slides past during `ride` (the boat's z per p is a calibration knob).
- [ ] **Step 6: Wire `realm.tsx`.** Order: header, `<Ferry />`, `<Arena />`, `<StatusWindow />`, footer, `<AriseFlash />`.
- [ ] **Step 7: Static mode.** Under `scene.reducedMotion` or `html.no-webgl`: no 250vh, the card is shown, the whispers are plain lines, there's no signal loss, and `scene.ferry` stays 0.
- [ ] **Step 8: Screenshots and tuning.**
  1. Take p = 0, 0.22, 0.45, 0.65, 0.8, 0.93, 0.97 and 1, plus `#trial`, at both sizes.
  2. Tune the Task 4 keys.
  3. Count the wheel notches (target about 12).
  4. Reload mid-track and confirm there's no animate-in.
  5. Cross down from `/` and confirm there's no pop.
- [ ] **Step 9: Run the verify command, then commit.** `git commit -m "feat: the underworld as a scroll-driven spirit broadcast"`

---

### Task 6: The System as a CRT terminal

**Files:** `app/globals.css` (`.sys-*`), `components/underworld/system-window.tsx` (styling hooks only)

**Interfaces:** The `SystemWindow` props and semantics are unchanged.

- [ ] **Step 1: Rewrite `.sys-*`.**
  - `.sys-window`: `background: rgb(0 0 0 / 0.85)`, a `1px solid color-mix(in srgb, var(--color-spirit) 50%, transparent)` border, no corner brackets, no blur, and a 2px scanline `repeating-linear-gradient` overlay at 6% via `::after`.
  - `.sys-head` and body text: mono, in spirit teal.
  - `.sys-tag`: bone.
  - `.sys-btn`: spirit outline. `.sys-btn-primary` = `.seal`.
- [ ] **Step 2: The opening.** `transform: scaleY(0.02)` plus `filter: brightness(2.5)` goes to `scaleY(1) brightness(1)` over 160ms, `cubic-bezier(0.23, 1, 0.32, 1)`, with origin at the centre. Delete the old line and unfold keyframes. Reduced motion keeps the 150ms fade.
- [ ] **Step 3: Screenshot** the card slip, the Trial lobby and the result.
- [ ] **Step 4: Run the verify command, then commit.** `git commit -m "feat: System windows become CRT terminal readouts"`

---

### Task 7: The Trial in spirit

**Files:** `components/underworld/arena.tsx`, `app/globals.css` (`.arena-field`, `.rank-letter`)

**Interfaces:** Unchanged: the `Screen` states, `start`, `skip`, `summon`, the scoring calls, `ROUND_MS` and `BURST_MS`.

- [ ] **Step 1: The field.** `.arena-field` is a black panel with the same scanline overlay and a 1px spirit border at 30%.
- [ ] **Step 2: Rewrite `draw()`.** Allocation-free: no per-frame gradients, and anything per target is cached in `next()`.
  - Two concentric teal rings plus 8 ticks, stroked, with `shadowColor` set to spirit and `shadowBlur` 10.
  - Life drains as the stroke alpha falls 1 → 0.3 with a flicker of `0.85 + 0.15·sin(clock·0.05 + seed)`.
  - A bone core dot.
  - Remove `SYSTEM_BLUE`, `MONARCH` and `MIST`.
- [ ] **Step 3: The burst.** 8 line shards flying outward, plus one white ring expanding, within `BURST_MS`, strong ease-out.
- [ ] **Step 4: The rank.** A halftone gothic letter: an SVG `text` in Grenze Gotisch (import the font object from `ryuma-mark.tsx`) masked by the same dot pattern, inside a `.seal` frame.
- [ ] **Step 5: Play three rounds.** Check that there are no long frames during `live` (DevTools trace), that hits and misses register, and that the best score saves.
- [ ] **Step 6: Run the verify command, then commit.** `git commit -m "feat: the Trial in spirit"`

---

### Task 8: The Status dossier and ARISE

**Files:** `components/underworld/status-window.tsx`, `components/underworld/arise.tsx` (styling only), `app/globals.css`, `lib/content.ts` (`STATUS.locked`)

**Interfaces:** The outer element keeps `id="status"` and `scroll-mt-8`. Consumes `RyumaMark`, `.seal` and `.sys-*`.

- [ ] **Step 1: Build the dossier.** Inside the `SystemWindow`:
  - a small `RyumaMark` (`w-48`) at the top
  - name, job and title rows
  - the five stats as meters: a mono label plus a 20-cell row of halftone dots, `round(v / 5)` lit in spirit and the rest at 15%
  - skills and equipment lines
  - the record: the rank in a `.seal` with the score, or `STATUS.unranked`
  - the invite with a `.seal` `[ Accept ]`
- [ ] **Step 2: The locked state.** `STATUS.locked = "No signal. Clear the Gate to tune in."`, plus the link to the Trial.
- [ ] **Step 3: Restyle ARISE.** The word becomes a halftone gothic SVG word, the same technique as the rank letter. Reveal it with a signal glitch: three 60ms steps of `clip-path` slices at random insets, then the full word. The timing (1.2s total) and the behaviour are unchanged.
- [ ] **Step 4: Screenshot** the Status locked and unlocked, and ARISE mid-flash with the shades rising (clear `arisen` first).
- [ ] **Step 5: Run the verify command, then commit.** `git commit -m "feat: Status as a spirit dossier; halftone ARISE"`

---

### Task 9: The gate page and the no-WebGL fallback

**Files:** `components/underworld/gate.tsx`, `components/underworld/realm.tsx`, `app/globals.css`

- [ ] **Step 1: The gate page.** A black CRT panel: `RyumaMark` at 40% opacity, the title and body as a terminal slip, and the back link as `.sys-btn`. The copy is unchanged.
- [ ] **Step 2: No WebGL.** `html.no-webgl .realm-underworld` is #000 with a static CSS scanline-and-grain overlay. Confirm Task 5's static mode applies.
- [ ] **Step 3: Screenshot** the gate page (seed 2 obols) and `/underworld` with WebGL forced off (add the `no-webgl` class before hydration via an init script).
- [ ] **Step 4: Run the verify command, then commit.** `git commit -m "feat: spirit gate page and no-WebGL fallback"`

---

### Task 10: Final verification

- [ ] **Step 1: Take the full screenshot set** from spec §11 step 2 at both sizes. Show it to the user.
- [ ] **Step 2: Run the perf A/B** against `main` (spec §11 step 3) and report the mean and p95.
- [ ] **Step 3: Run the verify command.** Expected: exit 0.
- [ ] **Step 4: Final whole-branch review** (`superpowers:requesting-code-review`), then `superpowers:finishing-a-development-branch`. Don't push.
- [ ] **Step 5: Update the memory** `underworld-side-quest-pending.md`: the spirit broadcast state, the knob values worth keeping, and the follow-up (the Olympus footer bas-relief).
