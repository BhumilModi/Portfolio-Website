# Underworld Rebuild — The Spirit Broadcast

**Status:** approved in brainstorming, 2026-10-02
**Supersedes:** `2026-10-01-underworld-ink-sanzu-design.md`, whose ink look was rejected at its look test. Ideas carried over from it are named where they are used.
**Amends:** `2026-09-26-underworld-system-redesign-design.md`. Its quest store, obol hunt, trial rules, sound engine, music and crossing timings stand as built.

## 1. Why, and how we got here

Olympus works because it has a signature look (the engraved, dithered bust) and because scrolling tells its story. The Underworld had neither.

We tried six directions. The user's reactions, in order:

| Direction | Verdict |
|---|---|
| Ink and sumi-e pass over the lit Sanzu | still underwhelming |
| Hades: ember dither on a real scan | good, but it reuses Olympus's dither; wanted a different technique to show range |
| Obsidian and magma PBR | asked for a different direction |
| Photoreal Gaussian splat | "no real image like theme" |
| Game-style references (Hades, Tunic, voxels) | asked to look beyond games |
| **S (spirit-vision edges) + O (KVS gothic mark on a CRT)** | **"theme looks good… yes better, go ahead"** |

The look the user approved is the spike on `spike/hades-negative` at `0656887`. Its screenshot is at `~/.claude/browser-output/spirit6.jpg`.

**The direction:** the Underworld is a *spirit broadcast*, the world of the dead seen on a haunted CRT.

- **The world (S, after jordan-breton.com):** every object is drawn as glowing contour lines on black. There are no surfaces, only edges and light.
- **The mark and the screen (O, after kvs.services):** a gothic RYUMA with symmetric thorns, horns and drips, filled with halftone dots. The whole view sits behind a curved CRT glass with scanlines and grain.

As a technique this contrasts with Olympus: Olympus is a printed plate (dithered fills, bone on red); the Underworld is a live signal (luminous edges, light on black).

## 2. Decisions taken by default (the user can overrule)

- **Setting:** keep the Sanzu content (torii, spider lilies, floating lanterns, the ferryman, the hooded shades), because that is what the approved spike shows. The obol and rokumonsen bridge from the 2026-09-26 spec stands.
- **Mark colour:** bone-white dots. **Case:** mixed, "Ryuma". Both are as approved on screen.
- **Display face:** Grenze Gotisch 800, from Google Fonts via `next/font`, used inside the mark's SVG only. This is the one new font, and the user approved the look built with it.

## 3. The look

### 3.1 The spirit pass

This is the full-screen pass from the spike. It reuses the ink harness: `components/experience/ink.tsx` from `4f8370a`, renamed `spirit.tsx`. That harness renders the scene into a HalfFloat target with a `DepthTexture`, then draws one full-screen shader to the canvas. It replaces the bloom composer and the glow sprites on both tiers.

The shader does four things:

1. **Edges.** Depth edges come from a **Laplacian** of linear depth, relative to depth. A Sobel filter fires across flat planes seen at a grazing angle, such as the water; a Laplacian does not. Luminance edges come from a Sobel on log luminance, at a higher threshold and lower weight. A second sample ring at radius 3 adds a soft halo; the low tier drops it.
2. **Colour.** Lines are spirit teal `#52f5d6`. Any pixel whose source hue falls in the red band becomes ember `#ff5c2e`, so the lilies and the torii lacquer burn instead of glowing teal. This reuses the red key from the ink spec, §3.1. Bright sources (moon, lantern cores, hitodama) become hot near-white cores. Surfaces get only a faint fill, about 5% of the line colour.
3. **Depth fade.** Lines dim with distance, `0.25 + 0.75·exp(−0.035·z)`.
4. **The CRT.** Barrel curvature (k ≈ 0.045), a rounded-rect screen mask, scanlines, animated grain and a vignette. Outside the screen is pure black.

Every number is a `// calibration knob:` const at the top of `spirit-material.ts`, with its range.

### 3.2 Scene changes for the look

Outlines reward silhouettes and detail.

- **Moon:** replace the grey disc with a thin ring and a faint halo; currently it reads as a flat grey coin.
- **Lanterns:** paper-cylinder bodies on a base, so they read as lanterns in outline rather than boxes. This is the ink spec's Task 4.
- **Torii:** already reads well in outline. Keep it, and add the shimaki and footings for extra line detail.
- **Portal:** keep the swirl. Reduce the bright core so it doesn't turn into a white blob.
- **Shades and ferryman:** keep. Their eyes become hot cores.

### 3.3 The mark (`components/underworld/ryuma-mark.tsx`)

- **Construction:** an SVG in a 1000×400 viewBox. The word "Ryuma" is set in Grenze Gotisch 800, with tapered, bent thorns mirrored about x = 500: a crown spike, horns, side sweeps and four drips. The whole shape is a mask over a 6px halftone dot `<pattern>` filled with `currentColor`.
- **Accessibility:** the `<h1>` wraps it, and the SVG carries `role="img"` and `aria-label="Ryuma"`.
- **Craft:** refine the thorn curves and weights by eye, using the spike as the starting point. Keep the silhouette symmetric and the counters open at mobile width (390px), so it doesn't turn into a blob.

### 3.4 The red accent

As at KVS, there is exactly one hot UI accent per screen: a small red chip. The opening chip reads "Scroll to cross ↓".

Contrast: the chip uses `#b31f27` with bone text, not `--color-lily`. Bone on lily red is only about 4.5:1, which is too tight for 11px caps.

## 4. Palette

| Token | Hex | Use |
|---|---|---|
| `--color-void` | `#0b0907` | page ground (CRT outside is `#000`) |
| `--color-bone` | `#efe6d4` | text, mark dots |
| `--color-spirit` (new) | `#52f5d6` | world lines, System text and borders |
| `--color-ember` | `#d0643b` (existing) | DOM ember accents only; the pass's red-key line colour `#ff5c2e` is a shader knob, not a token |
| `--color-seal` (new) | `#b31f27` | the one red chip or button per screen |

Remove `--color-system`, `--color-monarch`, `--color-abyss` and `--color-mist`, and move their uses to the tokens above. System blue `#4aa8ff` and Monarch violet `#8b5cf6` must not appear anywhere.

## 5. The page: a scroll-driven broadcast

The Ferry track from the ink spec, §4, is carried over: `lib/ferry.ts` holds the beats as pure, tested curves; `components/underworld/ferry.tsx` holds a pinned **250vh** track. Its beats change:

| Beat | p | Camera | DOM |
|---|---|---|---|
| `card` | 0–0.15 | `RIVER_CAMERA` (the descent's landing pose) | the title card: eyebrow, mark, tagline, red chip, [SYSTEM] slip, over a black radial field |
| `reveal` | 0.15–0.3 | same pose | the card's field and the mark dissolve. The dots scatter, a 300ms ease-out per dot via a CSS mask animation, and the world comes in |
| `ride` | 0.3–0.7 | dolly along the river toward the torii | whisper lines, one at a time, mono caps |
| `approach` | 0.7–0.9 | centre on the torii | none |
| `through` | 0.9–1 | push into the portal, cut under a full "signal loss" flash to the `rest` pose | CRT static burst: grain to 1, then back. This replaces the ink flood |

- **Whispers:** "By day, agents in production." / "By night —" / "the one who holds the line."
- **After the track:** the Trial and then the Status screen follow as normal sections over the fixed backdrop, which is at its `rest` pose.
- **Skip:** "Cross ↵" skips to `#trial`.
- **Landing mid-track:** a reload or a hash sets the pose from the scroll position on the first frame; nothing animates in from 0.

## 6. The System as a CRT terminal

`SystemWindow` keeps its API and semantics. Its CSS becomes a terminal readout:

- black at 85% opacity
- a 1px `--color-spirit` border at 50%
- mono text in spirit teal
- a 2px scanline overlay
- `[SYSTEM]` in bone

**Opening:** a 160ms horizontal "tube warm-up": scaleY 0.02 → 1 with a brightness flash, strong ease-out. The chime stays. Reduced motion gets a 150ms fade.

**Buttons:** spirit-outlined. The primary button is the seal-red chip.

## 7. The Trial

The gameplay is unchanged: `lib/arena.ts`, `lib/rank.ts`, the state machine, and the scoring and timing.

- **Field:** a black CRT panel, the same glass as the backdrop, applied in CSS.
- **Targets:** each target is a glowing teal contour sigil: two concentric rings and ticks drawn as strokes with a `shadowBlur` glow. Its life drains as the ring's line flickers and fades. `draw()` stays allocation-free: cache anything per target, nothing per frame.
- **Hit:** a burst of glowing line shards plus a one-frame white flash ring, within `BURST_MS`.
- **Rank:** a halftone-filled gothic letter, the same dot pattern as the mark, inside a seal-red chip frame.

## 8. The Status screen (replaces the Status Window, keeps `#status`)

A "spirit dossier" on a terminal screen:

- a small mark at the top, then name, job and title
- level and the five stats as mono bar meters made of halftone dots
- skills and equipment
- the visitor's record
- the party invite with a seal-red **[ Accept ]**

**Locked state:** "No signal. Clear the Gate to tune in."

**ARISE:** stays. The shades rise from the water and the pass draws them as teal and hot-eyed outlines. The full-screen word "ARISE" is set as a halftone gothic word with a signal-glitch reveal of about 300ms; the flash still lasts about 1.2s. It plays once per visitor.

## 9. The descent lands on the broadcast

`components/quest/crossing.tsx` already switches render style at `GATE_CUT`, under the flash. It now switches from the engraving to the spirit pass. The crossing's flash becomes a CRT signal-loss burst (static plus a white line) instead of System blue. The descent lands on `RIVER_CAMERA`, which is the `card` pose, so the handoff doesn't pop. The ascent plays the same cut in reverse.

## 10. Accessibility and fallbacks

- **Reduced motion:** no pinned track and no camera motion. One still spirit frame behind stacked content: card, whispers as plain lines, Trial, Status. No dot scatter (fades only). The CRT grain is static.
- **No WebGL:** black with a static CSS scanline and grain overlay. The mark, the card and the stacked content still show, since the mark is pure SVG.
- **Portrait (390×844):** portrait poses for every beat. The mark is at `w-[min(90vw,860px)]` and its thorns stay legible.
- **Contrast:** bone and teal on black both pass AA. Bone on the seal chip passes AA.
- **The gate page** ("No fare, no crossing."): a black CRT with the mark, dimmed, and the copy as a terminal slip.

## 11. Proof

1. **Unit tests** for `lib/ferry.ts`:
   - beat bounds
   - `ferryPose(0, a)` deep-equals `riverCamera(a)` for aspects 1.6 and 0.46
   - poses continuous except at the cut
   - signal-loss opacity is 1 at the cut and 0 at `p ≥ 1`
   - whispers never overlap
2. **Screenshots** at 1440×900 and 390×844 of every beat, the Trial live and its result, the Status locked and unlocked, ARISE, the gate page, reduced motion and no WebGL. Use Playwright, because the Orca tab is throttled to 2fps.
3. **Perf:** a same-session A/B against `main`'s bloom at 1440×900, mean and p95 frame time.
4. **Verify:** `npm run lint && npm test && npm run build` exits 0.

## 12. Out of scope, logged as follow-ups

- **The Olympus footer bas-relief (reference P, immersive-g.com):** the footer's name and links pressed into a plaster relief under raking light. The user asked for this; it gets its own short spec after this one.
- A new music track.
- Changes to the trial rules.
