# Underworld Ink Sanzu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/underworld` as an ink-painted Sanzu. A single ink pass replaces bloom. The page becomes a 250vh scroll-driven ferry crossing, and then an ink-styled Trial and a hanging-scroll reveal.

**Architecture:**
- `components/experience/ink.tsx` takes over `bloom.tsx`'s job as the drawing harness for a drei `<View>`. It renders the scene into a HalfFloat target with a depth texture, then runs one full-screen ink shader to the screen.
- Scroll progress over a pinned track goes into `scene.ferry`. Pure curves in `lib/ferry.ts` turn it into a camera pose and a flood opacity. The Sanzu `Rig` reads them.
- DOM pieces (System slips, Trial, Scroll) are restyled through CSS tokens and classes in `app/globals.css`.

**Tech Stack:**
- Next 16.3.6 (read `node_modules/next/dist/docs/` before touching routing or metadata)
- React 19.2, three 0.186.1, @react-three/fiber 9.8.1, drei 10.7.8, Tailwind 4
- Tests: `node --test` on `lib/**/*.test.ts`

**Spec:** `docs/superpowers/specs/2026-10-01-underworld-ink-sanzu-design.md`. Read it with this plan. Task 0 amends it where planning found gaps.

## Global Constraints

- No new dependencies. No new fonts (League Gothic, Newsreader, JetBrains Mono only).
- Never call `setDpr` or resize the canvas for performance. Cap only the offscreen target, at 1.25 DPR on the backdrop.
- The ferry track is 250vh, with a skip link "Cross ↵" (memory: keep scroll sequences around 200–300vh).
- Colours:
  - `--color-void` #0b0907 is the ground.
  - `--color-bone` #efe6d4 is text and paper.
  - `--color-lily` #c8232c is red fills.
  - `--color-system` becomes #e0483a, the red used for small text on void.
- Small text on paper is ink (void). Red on paper is only ever a seal graphic, never text.
- No System blue `#4aa8ff` and no Monarch violet `#8b5cf6` anywhere after Task 2.
- The obol hunt, the quest store (`lib/quest.ts`), the trial rules (`lib/arena.ts`, `lib/rank.ts`), the sound engine and the music stay unchanged.
- `DESCENT_S` = 5.5, `ASCENT_S` = 3 and `GATE_CUT` = 4.3 stay. The descent must still land on `riverCamera(aspect)`.
- Every tunable number is a named const commented `// calibration knob:` with its range, as in `bloom.tsx`.
- Commits: conventional prefix, plain English. No `Co-Authored-By`, no AI attribution, no `git push`.
- Verify command: `npm run lint && npm test && npm run build`, which must exit 0.
- Screenshots: Orca browser (`orca tab create` from the repo dir, `orca screenshot --json`, base64 to a file), at 1440×900 and 390×844. Seed the quest with `localStorage.setItem('bm.quest.v1', JSON.stringify({obols:["approach","record","footer"],crossed:true,tried:true,best:null,sound:false}))`.
- Frontend tasks load the `emil-design-eng`, `impeccable:impeccable` and `taste-skill` skills.

## Review Focus

1. **The crossing handoff pops.** The descent's last frame and the `/underworld` first frame must match: same pose (`ferryPose(0, a)` equals `riverCamera(a)`) and same ink look. Tested in Task 5; screenshot-checked in Task 6.
2. **Landing mid-track** (reload while scrolled, or a `#trial` / `#status` hash): the camera and flood must match the scroll position on the first frame, not animate in from 0. Task 6 reads progress before the first render.
3. **Reduced motion or no WebGL:** a 250vh empty track must not appear. Content is stacked and the frame is still. Task 6 step 6, Task 10.
4. **The lanterns' orange or the torii's lit gradient leaking through the red key** (hue band too wide or too narrow). Task 1 pins the band and checks the lanterns read paper-white.
5. **ARISE pressed while the flood is up, or before the track finishes:** the shades must be visible. Flood is 0 for `p ≥ 1` (Task 5 test), and `summon()` scrolls to `#status`, which is below the track.

---

### Task 0: Amend the spec

**Files:** Modify `docs/superpowers/specs/2026-10-01-underworld-ink-sanzu-design.md`

- [ ] **Step 0: Branch.** `git switch -c feat/ink-sanzu` (all tasks land here; main stays clean).
- [ ] **Step 1: Apply these amendments in place.**
  - §4.2 `through`: the flood rises to 1 by `p = 0.95`. Under the full flood the camera cuts to a wide `rest` pose. The flood drains to 0 by `p = 1`. After the track, the camera holds `rest` and the flood stays 0, so the ARISE shades are visible.
  - §4.4: replace "darkened by the flood's tail" with "the content panels are opaque paper, so the backdrop needs no darkening; titles over the backdrop use the void halo".
  - §5: the Trial field is a **sheet of paper** (bone with grain). The ensō targets are black ink on it, the splash is ink, and the HUD text is ink.
  - §9: keep the `--color-system` token, set to #e0483a (AA on void for small text). Remove `--color-monarch`, `--color-mist` and `--color-abyss`; uses move to `bone` / `void`.
  - §9 ink-bleed: an inline SVG filter (`feTurbulence` + `feDisplacementMap`) applied with `filter: url(#ink-bleed)`. A `mask-image` noise only punches holes; it doesn't roughen edges.
  - §4.2: the beats live in `lib/ferry.ts`, not `lib/crossing-beats.ts`. "Crossing" already names the realm transition (`components/quest/crossing.tsx`).
- [ ] **Step 2: Commit.** `git commit -m "docs: amend the ink Sanzu spec after planning"`

---

### Task 1: The ink pass, and the look test (CHECKPOINT)

**Files:**
- Rename: `components/experience/bloom.tsx` → `components/experience/ink.tsx` (`git mv`)
- Create: `components/experience/ink-material.ts`
- Modify: `components/experience/sanzu/index.tsx`, `components/quest/crossing.tsx`, `components/experience/sanzu/common.ts` (`SANZU.lantern`), `lib/descent.ts` and `lib/descent.test.ts` (remove `bloomBeat`)

**Interfaces:**
- Produces:
  - `export default function Ink(props: { ink?: () => boolean; paused?: () => boolean; onReady?: () => void; maxDpr?: number }): null`. `ink` defaults to always true.
  - `export function createInkMaterial(opts: { low: boolean }): THREE.ShaderMaterial`. Uniforms: `tColor`, `tDepth`, `uResolution` (vec2, px), `uNear`, `uFar`, `uInk` (vec3, #0b0907), `uPaper` (vec3, #efe6d4) — read from `INK.void`/`INK.bone` once Task 2 lands.
  - `export const INK_KNOBS`.
- Removes: `Bloom`, `bloomOn`, `GlowSprite`, `createGlowMaterial`, `bloomBeat`, the `aces` prop, and `lanterns.halos` from the render tree. Keep `buildLanterns` returning halos only if something else still uses them; otherwise delete them.

- [ ] **Step 1: Write `ink-material.ts`.** One fragment shader, in this order:
  1. Read the HDR colour and its luminance `L`.
  2. **Wash:** `v = posterize(L^gamma, steps)`, with soft band edges whose offset is jittered by `fbm(uv * noiseScale)`.
  3. **Edge:** Sobel on linearized depth from `tDepth`. The 3×3 kernel at `edgeWidth` px is scaled by `0.6 + 0.8 * fbm(uv * 1.7)` for brush pressure. The second sample ring is skipped when `opts.low` (a `#define LOW`). Draw ink where the gradient is greater than `edge`.
  4. **Ink colour:** `ink = mix(uInk, uPaper, v)`, darkened by the edge.
  5. **Red key:** `hue` and `sat` from the HDR colour. `redMask = smoothstep` over the band where hue is within ±`redHalfWidth` of 0°, times `smoothstep(satFloor, satFloor + 0.15, sat)`. Output `mix(ink, redTone, redMask)`, where `redTone` keeps the red hue at the band-posterized value.
  6. **Paper:** multiply by `1 - grain * hash/fbm` in screen pixels (static).
  7. `#include <colorspace_fragment>`.

  Starting `INK_KNOBS`, each with a `// calibration knob:` range:
  - `steps: 4` (3–5), `gamma: 0.8` (0.6–1.2), `softness: 0.06` (0.02–0.15), `noiseScale: 3` (1–6)
  - `edge: 0.015` (0.005–0.05, linear-depth delta), `edgeWidth: 1.5` (1–3 px)
  - `redHalfWidth: 14` (8–22 degrees), `satFloor: 0.35` (0.2–0.5), `grain: 0.07` (0.03–0.12)
- [ ] **Step 2: Rework the harness (`ink.tsx`).** Keep the existing compile and warm flow: `precompile`, then `warm`, then `onReady`.
  - Replace the composer with one `WebGLRenderTarget` (`HalfFloatType`, `depthTexture: new THREE.DepthTexture(1, 1)`) and a `FullScreenQuad` from `three/examples/jsm/postprocessing/Pass.js` carrying the ink material.
  - Size the target to `canvas size × min(gl.getPixelRatio(), maxDpr)` only when the size changes. Never touch the canvas.
  - Per frame, when `ink()` is true: render the world to the target with `NoToneMapping`, set `uNear` / `uFar` from the camera, then quad-render to screen.
  - Otherwise use today's plain `gl.render` path.
  - Warm-up renders once through both paths.
- [ ] **Step 3: Rewire the call sites.**
  - `SanzuBackdrop`: `<Ink paused={crossingActive} onReady={backdropReady} maxDpr={BACKDROP_DPR} />`.
  - `crossing.tsx`: `<Ink ink={() => scene.crossingT >= GATE_CUT} onReady={...} />`.
  - Delete the two `GlowSprite`s and the halos line from `Sanzu`.
  - Set `SANZU.lantern` to `#fff1d6` (warm paper, outside the red band).
  - Delete `bloomBeat` and its test cases.
- [ ] **Step 4: Run `npm test`.** Expected: PASS, with the `bloomBeat` tests gone.
- [ ] **Step 5: Look test.**
  1. With the dev server on :3000, take screenshots of `/underworld` (top of the page) at 1440×900 and 390×844.
  2. Take the Olympus intro at `scrollTo(0, innerHeight * 0.6)`.
  3. Check these by eye:
     - lanterns and moon read as paper white
     - only the lilies and torii are red
     - the outlines read as brushed, not as CAD lines
     - the frame doesn't look like a filtered photo
  4. Tune `INK_KNOBS` until it reads.
  5. Run a same-session perf A/B against `git stash` of the bloom version: mean frame time at 1440×900 with Chrome DevTools `performance_start_trace`, two runs each.
- [ ] **Step 6: Commit.** `git commit -m "feat: ink pass replaces bloom on the Sanzu"`
- [ ] **Step 7: CHECKPOINT.** Show the user the three screenshots and the perf numbers, and stop. Nothing after this task starts until the user approves the look. If they reject it, return to spec §3 with them.

---

### Task 2: Palette swap

**Files:**
- `app/globals.css`
- `components/experience/sanzu/common.ts`, `shadows.tsx`, `torii.ts`, `lilies.ts`
- `components/experience/descent-scene.tsx`
- `components/underworld/*.tsx`
- `components/quest/crossing.tsx`

**Interfaces:**
- Produces: `INK = { void: "#0b0907", bone: "#efe6d4", lily: "#c8232c", seal: "#e0483a", ash: "#6b5f52" } as const` in `common.ts`, replacing the old keys. The tokens `--color-system: #e0483a`. `--color-abyss`, `--color-mist` and `--color-monarch` are deleted.

- [ ] **Step 1: Replace classes mechanically.** In `components/underworld/*` and `components/quest/*`: `text-mist` → `text-bone`, `border-mist` → `border-bone`, `bg-mist` → `bg-bone`, `text-abyss` → `text-void`, `bg-abyss` → `bg-void`. Keep the opacity suffixes.
- [ ] **Step 2: Update `globals.css`.**
  - `.realm-underworld` is bone on void.
  - `::selection` is a system background with void text.
  - Every `--color-monarch` use becomes `--color-system`.
  - `.system-glow` becomes the void halo used in Olympus `TEXT_SHADOW` (no coloured glow).
  - `.crossing-flash` is a void burst with a radial bone core. The scan line is bone.
- [ ] **Step 3: Update the 3D colours.**
  - descent shaft: engraving `ink: INK.bone`, `ground: INK.void`
  - descent wisps and `cold`: `INK.bone`
  - shade eyes: `INK.bone × 5`
  - shade rim: `INK.bone`
  - shade smoke: `INK.ash`
  - torii and lilies: `INK.lily`
- [ ] **Step 4: Check nothing is left.** `grep -rn "4aa8ff\|8b5cf6\|monarch\|mist\b\|abyss\|INK.system" app components lib` must find nothing except in the `SANZU` scene-tone names (`SANZU.mist` stays).
- [ ] **Step 5: Run the verify command, then commit.** `git commit -m "feat: retire System blue and violet for the ink and seal palette"`

---

### Task 3: The ensō Gate

**Files:**
- Rename: `components/experience/sanzu/portal.ts` → `enso.ts`
- Modify: `sanzu/index.tsx`, `descent-scene.tsx`

**Interfaces:**
- Produces: `export function createEnsoMaterial(): THREE.ShaderMaterial`, with uniforms `uTime`, `uInk`, `uPaper`, `uRed`. It replaces `createPortalMaterial` at both call sites.

- [ ] **Step 1: Write the shader.** On the portal plane, in polar coordinates around the centre:
  - **The ring:** a brush ring of radius ~0.38 (uv units) whose width varies 0.06–0.11 along the angle. It is open over ~25° near the upper right. Its outer edge is dry-brush: fbm-broken into streaks along the stroke direction.
  - **Inside:** a slow fbm swirl of ink washes (`uTime × 0.05`).
  - **The glint:** a small red core (`uRed`, saturated, so it survives the red key).
  - **Outside the ring:** alpha 0.

  Write it to look like ink even with no post pass, because the descent shows it before `GATE_CUT`.
- [ ] **Step 2: Swap the call sites.** Swap both, drop the descent's `createPortalMaterial(3.2)` intensity argument, and point the portal point light at `INK.bone` with its intensity knob halved.
- [ ] **Step 3: Screenshot** `/underworld` and the descent at `crossingT ≈ 3.8`. Trigger it with `cross("down")` from the console on `/` with the quest seeded. The ensō must be the focal point in both.
- [ ] **Step 4: Run the verify command, then commit.** `git commit -m "feat: the Gate becomes an ensō"`

---

### Task 4: Silhouettes

**Files:** `components/experience/sanzu/torii.ts`, `lanterns.ts`, `sanzu/index.tsx` (`buildHull`, `Boat`)

**Interfaces:** Keep the exported names and the `TORII` layout constants (`x`, `z`, `portalY`, `portalW`, `portalH`). Shadows and the ensō plane depend on them. Keep the instance counts and the one-draw lanterns.

- [ ] **Step 1: Rebuild the torii.**
  - **Kasagi:** a lofted, curved beam whose ends sweep up (an `ExtrudeGeometry` along a curve, or a bent box with its vertices offset by `y += k·x⁴`), with the shimaki under it.
  - **Nuki:** passes through the pillars and sticks out past them.
  - **Pillars:** tapered (top radius 0.85 × bottom) and splayed inward 2–3°.
  - **Base:** black kamebara footings.
- [ ] **Step 2: Rebuild the lanterns.** Each is a paper body (a rounded box, about 0.22 × 0.26) on a dark wooden base slab. The emissive body is tuned so it lands as paper white through the ink pass.
- [ ] **Step 3: Rebuild the boat hull.** A deeper hull with a raised, pointed bow (the pinch extended plus a bow sweep of `y += 0.35·max(0, −z)²`).
- [ ] **Step 4: Screenshot at both sizes.** Check that the torii reads as a torii in pure silhouette: temporarily set `INK_KNOBS.steps` to 2 for the check.
- [ ] **Step 5: Run the verify command, then commit.** `git commit -m "feat: torii, lanterns and boat drawn for ink"`

---

### Task 5: Ferry curves (TDD)

**Files:** Create `lib/ferry.ts` and `lib/ferry.test.ts`

**Interfaces:**
- Consumes: `riverCamera`, `PORTRAIT_BELOW` and `type Pose` from `lib/descent.ts`; `clamp01`, `smoothstep` and `fadeInOut` from `lib/timeline.ts`.
- Produces:
  - `FERRY_BEATS`, with ids `shore` 0–0.15, `ride` 0.15–0.6, `approach` 0.6–0.85, `through` 0.85–1
  - `type FerryBeat`
  - `ferryLocal(p: number, id: FerryBeat): number`
  - `FERRY_CUT = 0.95`
  - `ferryPose(p: number, aspect: number): Pose`
  - `floodOpacity(p: number): number`
  - `whisperOpacity(p: number, i: number, n: number): number` (whisper i of n spread across `ride`)
  - `REST_CAMERA` and `REST_CAMERA_PORTRAIT: Pose`

- [ ] **Step 1: Write the failing tests** in `lib/ferry.test.ts`, in the style of `lib/descent.test.ts`:
  - `ferryLocal(0.15, "shore") === 1`, and `ferryLocal(0.15, "ride") === 0`
  - for aspect 1.6 and 0.46: `ferryPose(0, a)` deep-equals `riverCamera(a)` (no handoff pop)
  - continuity: for every p in [0, 1) step 0.001, excluding the window `[FERRY_CUT, FERRY_CUT + 0.001)`, the position delta between p and p + 0.001 is less than 0.5 world units
  - `ferryPose(1, a)` deep-equals the rest pose for that aspect; so does `ferryPose(FERRY_CUT, a)`
  - `floodOpacity(0) === 0`, `floodOpacity(0.84) === 0`, `floodOpacity(FERRY_CUT) === 1`, `floodOpacity(1) === 0`, `floodOpacity(1.5) === 0`
  - `whisperOpacity` is 0 outside `ride`, peaks at 1 inside each slot, and two whispers are never both above 0.5 at the same p (sampled at step 0.005)
- [ ] **Step 2: Run** `npm test`. Expected: FAIL, because `lib/ferry.ts` doesn't exist yet.
- [ ] **Step 3: Implement `lib/ferry.ts`.**
  - Keys per beat: shore = `riverCamera(a)`; end of ride = boat height, about 60% of the way to the torii; end of approach = centred on the torii with the ensō filling about 70% of the frame height; `FERRY_CUT` = pushed into the ensō plane.
  - Interpolate with `easeInOutCubic`.
  - At `p ≥ FERRY_CUT`, return the rest pose.
  - `floodOpacity`: `smoothstep(0.85, 0.95, p)` up to the cut, then `1 − smoothstep(0.95, 1, p)`.
  - Every key is a calibration knob, tuned against screenshots in Task 6.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat: ferry crossing curves"`

---

### Task 6: The ferry track

**Files:**
- Create: `components/underworld/ferry.tsx`
- Modify: `components/underworld/realm.tsx`, `components/experience/sanzu/index.tsx` (`Rig`, `Boat` drift), `lib/scene.ts`, `lib/content.ts`, `app/globals.css`, `app/layout.tsx` (the ink-bleed SVG filter)
- Delete: `components/underworld/arrival.tsx` (its content moves into the shore beat)

**Interfaces:**
- Consumes: Task 5's exports; `SystemWindow` with `notice` / `instant`; `scene.noticeCarried`.
- Produces: `scene.ferry: number` (0–1); `.ink-type` CSS (`filter: url(#ink-bleed)`); `UNDERWORLD.whispers: string[]`; `UNDERWORLD.cross: "Cross ↵"`.

- [ ] **Step 1: Add the content.** `UNDERWORLD.whispers = ["By day, agents in production.", "By night —", "the one who holds the line."]` and `UNDERWORLD.cross = "Cross ↵"`. Drop `UNDERWORLD.line`.
- [ ] **Step 2: Add the ink-bleed filter.** A hidden `<svg>` in `app/layout.tsx` with `<filter id="ink-bleed">`: `feTurbulence` (fractalNoise, baseFrequency 0.035, 2 octaves) feeding `feDisplacementMap` (scale 4). Both values are calibration knobs. `.ink-type { filter: url(#ink-bleed) }`.
- [ ] **Step 3: Build `ferry.tsx`.** It follows `onboarding.tsx`'s pattern.
  - A `section#ferry` of `h-[250vh]` with a `sticky top-0 h-dvh` stage.
  - A rAF loop reads `p` from `getBoundingClientRect`, writes `scene.ferry`, and sets the CSS vars `--flood` and `--w0…--w2`.
  - Read `p` once synchronously in the effect before the first rAF (Review Focus 2).
  - **Shore content:** the eyebrow, RYUMA (`.ink-type`) with a left-to-right `clip-path` brush reveal of 700ms ease-out on mount, a small vertical red seal, and the `[SYSTEM]` slip (`instant` when carried, as `arrival.tsx` did). All of it fades out over `ride` 0–0.2.
  - **Whispers:** stacked, each at `opacity: var(--wN)`, with the void halo.
  - **Flood:** a `fixed inset-0 bg-void` div at `opacity: var(--flood)`, `pointer-events-none`, z above the canvas and below the header.
  - **Skip link:** `<a href="#trial">{UNDERWORLD.cross}</a>` bottom right. Enter on `body` focus clicks it while `p < 1`, as the intro does.
- [ ] **Step 4: Drive the camera from `scene.ferry`.** In `Rig`, `ferryPose(scene.ferry, aspect)` replaces `riverCamera(aspect)`; the lean is still added on top. In `Boat`, replace the time drift with a position derived from `scene.ferry` so it slides past the camera during `ride`. The calibration knob is the boat's world z per p.
- [ ] **Step 5: Wire up `realm.tsx`.** Order: header, `<Ferry />`, `<Arena />`, `<StatusWindow />` (until Task 9), footer, `<AriseFlash />`.
- [ ] **Step 6: Static mode.** When `scene.reducedMotion` or `html.no-webgl`: no 250vh. The section is auto-height with shore content, then the whispers as plain stacked lines, and the flood is never shown. `scene.ferry` stays 0.
- [ ] **Step 7: Screenshots and tuning.**
  1. Take screenshots at p = 0, 0.3, 0.55, 0.75, 0.9, 0.97 and 1, plus `#trial`, at both sizes.
  2. Tune the Task 5 keys until each beat is composed.
  3. Count the wheel notches through the track (target about 12).
  4. Reload mid-track and confirm there's no animate-in.
  5. Cross down from `/` and confirm the landing doesn't pop.
- [ ] **Step 8: Run the verify command, then commit.** `git commit -m "feat: the underworld as a scroll-driven ferry crossing"`

---

### Task 7: Ofuda slips and hanko

**Files:** `components/underworld/system-window.tsx`, `app/globals.css`

**Interfaces:**
- Produces:
  - `export function useOpenOnView(ref: RefObject<HTMLElement | null>, opts: { instant?: boolean; threshold?: number; onOpen?: () => void }): "shut" | "open" | "still"`. This is extracted from `SystemWindow`'s IntersectionObserver logic. `SystemWindow` uses it with `onOpen: playChime`.
  - The `.hanko` class: a red square seal with a paper glyph, `rotate(-6deg)`.
  - The `.hanko[data-stamp]` animation, `stamp`: scale 1.15 → 1 and opacity 0 → 1 in 160ms, `cubic-bezier(0.2, 0, 0, 1)`. No scale under reduced motion.
  - The `.paper` class: a bone background with an SVG-noise grain data-URI and void text.

- [ ] **Step 1: Extract `useOpenOnView`.** `SystemWindow` behaves exactly as before: same props and semantics, still observing the unclipped wrapper.
- [ ] **Step 2: Rewrite `.sys-*`.**
  - `.sys-window` = `.paper` with a 1px void/40% border, no glow, no blur, and a `::before` red seal square (14px) top right instead of the bracket gradients.
  - `.sys-head`: void mono caps with a 6px red tick before it.
  - `.sys-tag`: void mono.
  - Open: `clip-path: inset(0 0 100% 0)` → `inset(0)` in 220ms `cubic-bezier(0.2, 0, 0, 1)`. Delete the line animation.
  - Reduced motion keeps the 150ms fade.
  - `.sys-btn`: void outline on paper. `.sys-btn-primary`: `--color-lily` fill with bone text. Hover darkens 8%; active keeps `scale(0.97)`.
- [ ] **Step 3: Screenshot** the arrival slip, the Trial lobby and the result. Check contrast: void on bone and bone on lily each give at least 4.5:1 (compute with a node one-liner and paste the numbers into the commit body).
- [ ] **Step 4: Run the verify command, then commit.** `git commit -m "feat: System windows become ofuda slips"`

---

### Task 8: The Trial in ink

**Files:** `components/underworld/arena.tsx`, `app/globals.css` (`.arena-field`, `.rank-letter`)

**Interfaces:** Unchanged: the `Screen` states, `start`, `skip`, `summon`, the scoring calls into `lib/arena.ts`, `ROUND_MS` and `BURST_MS`. Consumes `.paper` and `.hanko` from Task 7.

- [ ] **Step 1: Make the field paper.** `.arena-field` gets the `.paper` treatment, and the HUD text is void.
- [ ] **Step 2: Rewrite `draw()`. It must stay allocation-free per frame**: precompute the stroke jitter table once per target in `next()`, with no gradients created per frame (cache them per target).
  - The target is an ensō: a ring of radius `r` stroked as ~48 segments whose width follows the precomputed jitter (`lineWidth` 0.12r–0.22r), open over ~25°.
  - Life = dryness: the stroke alpha goes 1 → 0.35 and the colour goes void → ash as `life` falls. A red core dot of 0.12r is drawn in `--color-lily`.
  - Remove the `SYSTEM_BLUE`, `MONARCH` and `MIST` constants.
- [ ] **Step 3: Rewrite the burst.** 6–9 ink blots (filled circles 0.08r–0.2r) thrown outward with a strong ease-out, plus 1 large blot fading at the hit point, all within `BURST_MS`.
- [ ] **Step 4: Stamp the rank.** On the result, the rank renders as `<span className="hanko" data-stamp>`, and the countdown digits use `.ink-type` in void.
- [ ] **Step 5: Play it.** Play three rounds: check that the frame rate holds (no long frames in a DevTools trace during `live`), that misses and hits register, and that the best score saves.
- [ ] **Step 6: Run the verify command, then commit.** `git commit -m "feat: the Trial in ink"`

---

### Task 9: The Scroll and ARISE

**Files:**
- Create: `components/underworld/scroll.tsx`
- Delete: `components/underworld/status-window.tsx`
- Modify: `realm.tsx`, `arise.tsx` (styling only), `app/globals.css`

**Interfaces:** Consumes `useOpenOnView`, `.paper`, `.hanko`, and `STATUS` / `ARENA` / `SYSTEM` content as they are. The outer element keeps `id="status"` and `scroll-mt-8`, so `summon()`'s `toStatus()` still lands.

- [ ] **Step 1: Build the Scroll.**
  - **Structure:** `scroll.tsx` is a centered kakejiku, `max-w-[34rem]`. It has a top wooden rod (a void bar, 14px, with end knobs), a mounted border (a lily/20 band, 18px), the `.paper` panel and a bottom rod.
  - **Unroll:** with `useOpenOnView` opening it, the panel goes `clip-path: inset(0 0 100% 0)` → `inset(0)` over 400ms `cubic-bezier(0.2, 0, 0, 1)`, and the bottom rod translates with it. Reduced motion: a fade.
  - **Content, top to bottom:**
    - RYUMA (`.ink-type`, display) with a `.hanko` seal
    - Job and Title
    - Level and the five stats as a single column: mono label left, display numeral right, a thin void/15 rule between rows
    - Skills and Equipment as short lines
    - Record: `.hanko` rank and score, or `STATUS.unranked`
    - the invite line and a `[ Accept ]` `.sys-btn-primary`
  - **Locked:** only the rods and a short paper band showing `STATUS.locked` and `STATUS.toGate`.
- [ ] **Step 2: Restyle ARISE.** In `.arise-flash` / `.arise-word`: a void/60 backdrop with the word in `--color-lily` and `.ink-type`, revealed by a left-to-right `clip-path` over 300ms. The timing (1.2s) and behaviour are unchanged.
- [ ] **Step 3: Wire it in.** `realm.tsx` uses `<Scroll />`.
- [ ] **Step 4: Screenshot** the Scroll locked and unrolled at both sizes, and ARISE mid-flash with the shades rising (clear `arisen` from the seeded quest first).
- [ ] **Step 5: Run the verify command, then commit.** `git commit -m "feat: the Status Window becomes a hanging scroll"`

---

### Task 10: The gate page and the no-WebGL fallback

**Files:**
- Create: `components/underworld/enso-mark.tsx`
- Modify: `components/underworld/gate.tsx`, `app/globals.css`

**Interfaces:** Produces `export default function EnsoMark({ className }: { className?: string })`, an inline, `aria-hidden` SVG. It's one open circular path, stroke width 9% of the diameter, `stroke-linecap: round`, with `filter: url(#ink-bleed)`, in bone, plus a lily core dot.

- [ ] **Step 1: Restyle the gate page.** `gate.tsx` puts `EnsoMark` above the title; the copy is unchanged. Its body text sits in an ofuda notice slip.
- [ ] **Step 2: Add the no-WebGL fallback.** `html.no-webgl .realm-underworld` gets void plus a paper-grain overlay at 4% and a large `EnsoMark` (rendered from `realm.tsx` only when `html.no-webgl`, top right, opacity 0.5). Confirm Task 6's static mode applies.
- [ ] **Step 3: Screenshot** the gate page (quest seeded with 2 obols), and `/underworld` with WebGL forced off: run `document.documentElement.classList.add('no-webgl')` before hydration, or block WebGL in the Orca tab.
- [ ] **Step 4: Run the verify command, then commit.** `git commit -m "feat: ink gate page and no-WebGL fallback"`

---

### Task 11: Final verification

- [ ] **Step 1: Take the full screenshot set** from spec §11 step 2 at both sizes. Show it to the user.
- [ ] **Step 2: Run the perf A/B** (spec §11 step 3) against `a66b7d8`, same session, and report the mean frame times.
- [ ] **Step 3: Run the verify command.** Expected: exit 0.
- [ ] **Step 4: Run** `superpowers:requesting-code-review` on the branch, then `superpowers:finishing-a-development-branch`. Don't push.
- [ ] **Step 5: Update the memory** `underworld-side-quest-pending.md` with the new state and any calibrated knob values worth keeping.
