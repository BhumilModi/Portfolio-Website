# Underworld Rebuild — The Ink Sanzu

**Status:** approved in brainstorming, 2026-10-01
**Supersedes:** the look (§3), the Trial's presentation (§5), the Status Window (§6) and the palette (§8) of `2026-09-26-underworld-system-redesign-design.md`. That spec's crossing timeline (§4), quest store, obol hunt, sound engine and music (§7) stand as built.

## 1. Why

Olympus works because it has a signature look and because scrolling tells its story. The engraved, dithered bust is bespoke. The intro is choreographed to scroll: whispers, the bust, the radiance, then the red flood.

The Underworld has neither:

- **A still postcard.** The Sanzu backdrop is fixed, and three blocks (Arrival, Trial, Status Window) scroll over it. Scrolling drives nothing.
- **No signature.** Raw three.js, ACES and bloom: box lanterns, a cylinder torii, a flat glowing disc as the portal, a blown-out moon. It reads as a tech demo, not art direction.
- **A mixed language.** A Japanese river, Greek obols and a generic blue game HUD. The System blue fights the red the brand kept (the Pantone rebrand was declined on 2026-09-30).
- **A thin story.** One tagline, a game, a stats sheet.

The fix:

- **The Underworld becomes an ink painting.** It is woodblock and sumi-e, the Eastern twin of Olympus's Western engraving: a different world at the same level of craft.
- **The page becomes a scroll-driven ferry crossing**, structured like the Olympus intro.

The user put nothing off-limits. What they asked for is that the Underworld feel as good as Olympus.

## 2. What stays, what changes

| Piece | Result |
|---|---|
| Olympus, obol hunt, quest chip, quest store, sound engine, music | unchanged |
| Descent beats `fare`, `olympus`, `fall` (0–3.0s) | unchanged |
| Descent `abyss`, `gate`, `sanzu` (3.0–5.5s) | same timings; ensō portal, ink flash, cut lands on the ink look (§7) |
| Sanzu scene geometry | kept, with silhouettes rebuilt (§3.4) |
| Bloom composer and glow sprites on the Sanzu | replaced by the ink pass (§3) |
| `/underworld` layout | a pinned scroll crossing, then the Trial, then the Scroll (§4) |
| Trial gameplay (`lib/arena.ts`, `lib/rank.ts`) | unchanged; restyled in ink (§5) |
| Status Window | replaced by the Scroll, the hanging-scroll reveal (§6) |
| System windows | same component and API; restyled as ofuda slips (§8) |
| System blue `#4aa8ff` and Monarch violet `#8b5cf6` | removed from the Underworld (§9) |
| ARISE, ranks, Gates | kept as mechanics |

## 3. The look: the ink pass

### 3.1 Pipeline

`Bloom` (`components/experience/bloom.tsx`) on the Sanzu views becomes `Ink`. It is the same harness: it takes over drawing for its drei `<View>`, precompiles programs, and has the `paused`, `onReady` and `maxDpr` props. The passes:

1. **RenderPass** into a HalfFloat target with a `DepthTexture`.
2. **InkPass**, one full-screen `ShaderPass`, in this order:
   - **Value:** scene luminance becomes 3–4 posterized ink washes, with soft steps and noise-broken edges so the bands bleed like wet ink.
   - **Edges:** a Sobel filter on linearized depth draws the brush outlines. Their width is modulated by low-frequency noise, so strokes thicken and thin and occasionally break (dry brush).
   - **Red key:** a pixel whose hue is in the red band, above a saturation floor, keeps its chroma; every other pixel is mapped to the ink ramp. There is no material-ID buffer. Anything red in the scene (lilies, torii lacquer, seals) stays red, and nothing else carries colour.
   - **Paper:** a procedural fibre-and-grain texture multiplied over the result, fixed in screen space.
3. **OutputPass** for sRGB. No ACES on the Sanzu: the ramp is authored directly.

Calibration knobs live at the top of the pass, with ranges, following the style of `BLOOM` in `bloom.tsx`: wash steps, edge threshold, edge width, noise scale, red hue band, saturation floor, grain strength.

### 3.2 Palette in the frame

The Underworld uses the Olympus tokens in inverted proportions:

- **Ground:** mostly ink (`--color-void` #0b0907).
- **Light:** bare paper (`--color-bone` #efe6d4).
- **Accent:** red (`--color-lily` #c8232c and the `--color-field` family).

Light becomes **unpainted paper**. The moon and the lantern cores are the brightest areas, left as paper. There is no bloom: brightness reads as an absence of ink. The ink ramp's darkest value is calibrated against the look test (§11, step 0).

### 3.3 The ensō Gate

The portal plane between the torii pillars stops being a swirling violet disc. It becomes an **ensō**, the Zen single-brushstroke circle, in its own shader:

- a thick, dry-edged brush ring, open at one point
- its wet interior slowly swirling in ink
- a red core glint (a red pixel, so it survives the key)

It is the realm's signature image, the twin of the Olympus bust. Like the old portal, it is the visual focus of the frame.

### 3.4 Silhouettes

In ink the outline carries the image, so these pieces get rebuilt:

- **Torii:** a curved, swept kasagi with upturned ends, a shimaki beneath it, a nuki, and tapered, slightly splayed pillars. Proportions follow a real Itsukushima-style torii. Lacquer red.
- **Lanterns:** paper cylinders or rounded boxes on a small wooden base, instanced as now (one draw). The emissive core is set so it lands as paper white.
- **Boat:** a deeper hull with a raised bow, keeping the ferryman, pole and bow lamp.
- **Shades and ferryman:** keep `wraith.ts`. Their eyes change from System blue to paper white.
- **Lilies, water, mist, sky, hitodama:** keep their geometry. The ink pass restyles them. The moon's reflection streak becomes a paper-white broken stroke.

### 3.5 Tiers

The ink pass is one full-screen pass, so it should cost less than the bloom mip chain. Both tiers get the ink look:

- **Low tier:** keeps the halved counts and the gradient water without a reflector, and drops the edge pass's second sample ring.
- **DPR:** the 1.25 cap stays on the composer only. Never `setDpr` on the canvas: a canvas resize costs ~200ms on the main thread.

## 4. The crossing: `/underworld` as a scroll ride

### 4.1 Track

`/underworld` opens with a pinned track of **250vh**, about 12 wheel notches, matching the Olympus intro. A sticky full-viewport stage holds the Sanzu canvas and the DOM text. A skip link, "Cross ↵", jumps to the Trial, as the intro's Enter ↵ does.

Scroll progress `p` (0–1) is read the way `components/experience/onboarding.tsx` reads it: a rAF loop writes `scene.progress`-style state and CSS custom properties.

### 4.2 Beats

Beats are defined in `lib/crossing-beats.ts`, in the style of `lib/timeline.ts` (`local(p, id)`, `fadeInOut`, `smoothstep`):

| Beat | p | Camera | DOM |
|---|---|---|---|
| `shore` | 0–0.15 | `RIVER_CAMERA`, the descent's landing pose, so the handoff doesn't pop | RYUMA brushed in (an ink-bleed mask reveal), with a small vertical red seal beside it; the [SYSTEM] arrival slip |
| `ride` | 0.15–0.6 | dollies along the river toward the torii at boat height, with lanterns sliding past | whisper lines fade in and out, one at a time (§4.3) |
| `approach` | 0.6–0.85 | rises slightly and centres on the torii; the ensō fills most of the frame | none |
| `through` | 0.85–1 | pushes into the ensō | an **ink flood**: the screen fills with ink from the ensō outward. It mirrors the Olympus `--flood`, and the Trial sits beneath it |

The camera curves are pure functions of `p` that return a `Pose`, like `lib/descent.ts`. The pointer lean (`LEAN`, `LEAN_RATE`) stays on top of the pose. The boat's existing time-based drift is replaced by the scroll pose. The boat sits in the foreground of the `ride` beat.

### 4.3 Whisper copy (draft, user to approve)

- "By day, agents in production."
- "By night —"
- "the one who holds the line."

The last line echoes the title "One Who Holds the Line" from `STATUS.title`. The copy lives in `lib/content.ts`.

### 4.4 After the track

The stage unpins. The Trial (§5) and then the Scroll (§6) follow as normal sections. The Sanzu stays as a fixed backdrop behind them, darkened by the flood's tail so the content reads, until the footer. The camera holds the `through`-end pose with the ink settling.

## 5. The Trial, in ink

The gameplay, timing, scoring, rank and best-score store do not change: `lib/arena.ts`, `lib/rank.ts`, the `quest` store and the `components/underworld/arena.tsx` state machine (`lobby` → `countdown` → `live` → `done`).

Only the presentation changes:

- **Targets:** each sigil is a brush-drawn ensō on the canvas. It has an ink ring with a dry-brush texture and a red core dot. Its life drains as the ring "dries", the stroke fading and greying, instead of an arc draining. The canvas 2D `draw()` is rewritten; the hot path stays allocation-free.
- **Hit:** an ink splash: a few blot particles with an ink spray, over the existing `BURST_MS` (220ms), strong ease-out.
- **Rank:** the result's rank letter is a **red hanko stamp**. It drops in at a slight rotation, scaling 1.15 → 1 in about 160ms with a hard ease-out, like a stamp being pressed. Reduced motion gets no scale.
- **Briefing and result:** these are ofuda slips (§8).
- **LEVEL UP!:** stays as a [SYSTEM] slip.

## 6. The Scroll: reveal and invite

This replaces `components/underworld/status-window.tsx`, keeping the anchor `#status` so `summon()` and existing links still land.

The Scroll is a tall **kakejiku** (hanging scroll). It has a paper panel with a mounted border and wooden rods top and bottom, and it unrolls downward the first time it enters view (clip-path, ~400ms, strong ease-out). On it:

- **RYUMA** in display type with the ink-bleed mask, and a red seal.
- **Job** and **Title** (`STATUS.job`, `STATUS.title`).
- **Level** and the five stats in mono labels with display numerals, set as a vertical column of ink marks rather than a dashboard grid.
- **Skills** and **Equipment** as short brushed lines.
- **Your record:** the visitor's rank as a small red stamp and their score, or "Unranked".
- **The invite:** "[SYSTEM] Ryuma has sent you a party invite." with **[ Accept ]** as a red seal button (`STATUS.invite.href`, unchanged).

**Locked state:** before the Trial is cleared or skipped, the Scroll stays rolled up, showing "Clear the Gate to unlock." and the link to the Trial.

**ARISE:** stays. Pressing it after a clear, or skipping, raises the shades out of the water (`components/experience/sanzu/shadows.tsx`), and the ink pass inks them with no extra work. Their eyes are paper white (§3.4). The full-screen "ARISE" word becomes a brushed red word with an ink-bleed reveal, still about 1.2s, then the page scrolls to the Scroll. It plays once per visitor (`quest.arise()`), as now.

## 7. The descent lands on ink

`components/experience/descent-scene.tsx` switches render styles at `GATE_CUT` under the flash. The lit Sanzu becomes the inked Sanzu: the descent's Sanzu view uses `Ink` where it used `Bloom`. The engraving and the ink are never on screen together, the same rule as today. The descent's portal approach (`abyss`) uses the ensō shader rather than the violet disc, so the Gate you fall toward is the Gate you arrive at.

- **The flash:** changes from System blue to an ink-black burst with a paper-white core.
- **The ascent:** plays the same cut in reverse.
- **Timings:** `DESCENT_S`, `ASCENT_S`, Esc skip and the 2× repeat speed are unchanged. The descent lands on `RIVER_CAMERA`, which is the `shore` beat's pose (§4.2).

## 8. The System layer: ofuda slips

`components/underworld/system-window.tsx` keeps its props, semantics and open-on-view behaviour. Its CSS (`.sys-*` in `app/globals.css`) is rewritten:

- **Surface:** a paper slip (bone, with a faint fibre grain from an inline SVG noise filter), ink text, a thin ink border, and a red seal in one corner in place of the four blue corner brackets. No glow and no backdrop blur.
- **Headings:** `[ QUEST ]` and similar stay in mono caps, in ink, with a red tick.
- **Opening:** the 120ms line-then-unfold becomes a 220ms unroll from the top edge (clip-path inset, strong ease-out). The chime stays. Reduced motion keeps the 150ms fade.
- **Buttons:** `.sys-btn` is ink-outlined on paper; `.sys-btn-primary` is a red seal with paper text.
- **Notices:** `.sys-notice` is a narrow slip; `[SYSTEM]` is in red mono.

## 9. Palette and type

- **Tokens:** remove `--color-system` and `--color-monarch`, and the `--color-abyss` and `--color-mist` Underworld text pairing. The Underworld uses `--color-void` for ground, `--color-bone` for text and paper, and `--color-lily` and `--color-field` for red. `.realm-underworld` sets bone text on void. Its `::selection` and `:focus-visible` use red and bone.
- **Code:** remove the `SYSTEM_BLUE`, `MONARCH` and `MIST` constants in `arena.tsx`, and System blue and Monarch in `components/experience/sanzu/common.ts` (`INK.system`, `INK.monarch`), along with every use.
- **Type families stay shared with Olympus:** League Gothic, Newsreader and JetBrains Mono. No new fonts. The display type (RYUMA, ARISE, rank letters) gets an **ink-bleed treatment**: a CSS `mask-image` with an SVG turbulence noise, so its edges read brushed rather than vector-clean.

## 10. Accessibility and fallbacks

- **Reduced motion:** no scroll-driven camera, no pinned track. The page renders one still inked frame of the `shore` pose behind stacked content: title, whispers as plain lines, Trial, Scroll. There's no unroll motion (fades only) and no ARISE scale. The ink pass still runs, on one still frame.
- **No WebGL** (`html.no-webgl`): a CSS background of void with a paper-grain overlay and a static red ensō drawn in SVG. The content is stacked as for reduced motion.
- **Portrait (390×844):** every beat pose has a portrait variant, chosen by `PORTRAIT_BELOW` as now. The ensō sits in the top half and the text below.
- **The gate page (`components/underworld/gate.tsx`, "No fare, no crossing."):** restyled to ink on void with a static ensō and an ofuda slip. Its copy is unchanged.
- **Contrast:** bone on void and ink on bone both clear WCAG AA. The whisper lines carry the void halo text shadow the Olympus intro uses.
- **Semantics:** unchanged. Notices are `role="status"`, windows are headed sections, the canvas keeps its label, and the skip link is focusable.

## 11. Proof

0. **Look test (throwaway, before anything else is built).** Swap `Bloom` for a first-cut `Ink` pass on today's `/underworld` frame, with no geometry changes. Take screenshots at 1440×900 and 390×844, side by side with the Olympus intro. The user approves the look before step 1. If it doesn't land, revisit §3 here, at the cheapest point.
1. **Unit tests** for `lib/crossing-beats.ts`: beat bounds, `local()` per beat, poses continuous at every beat boundary, and the `shore` start pose equal to `RIVER_CAMERA` (no pop at the handoff). Follow the style of `lib/descent.test.ts`.
2. **Screenshots** of every beat at both sizes, plus the Trial live, the result stamp, the Scroll locked and unrolled, ARISE, the gate page, reduced motion and no WebGL.
3. **Perf:** a same-session A/B of the ink pass against the current bloom chain at 1440×900 and DPR 2, comparing mean frame time. Timings on this machine are noisy, so trust only same-session comparisons.
4. **Verify:** the project's full lint, typecheck, tests and build all exit 0.

## 12. Out of scope

- A new music track (the current Underworld track stays).
- Changes to the trial rules or ranks.
- Olympus changes.
- A brush display font.
