# Underworld Redesign — The Sanzu Gate and the System

**Status:** approved in brainstorming, 2026-09-26
**Amends:** `2026-09-26-underworld-side-quest-design.md`. Sections 2 (the hunt) and 3 (the descent, top half), and the quest store, trial rules, crossing driver and sound engine, stand as built in Tasks 1–10. This spec replaces the Underworld's look, the descent's bottom half, the Trial's presentation, the Card (§6) and the Underworld track (§7).

## 1. Why

The Underworld reused Olympus's engraving and dither, so both realms looked the same. The two sides should read as different worlds:

- **Olympus** stays Greek, flat, engraved and dithered.
- **The Underworld** becomes a refined, lit, game-like 3D Japanese underworld (the Sanzu River, 三途の川). Solo Leveling's "System" interface is layered on top: Gates, ranks, System windows, shadows rising.

Myth bridge: the dead crossing the Sanzu were buried with six coins (rokumonsen) as the ferry fare, which mirrors Charon's obol. The obol hunt carries over unchanged.

IP line: we evoke the genre (System windows, Gates, ranks, shadow soldiers). We use no Solo Leveling logo, character names, artwork or exact in-show titles. Ryuma gets his own job and title.

## 2. What stays, what changes

| Piece | Result |
|---|---|
| Olympus, obol hunt, quest chip | unchanged |
| Descent beats `fare`, `olympus`, `fall` (0–3.0s) | unchanged |
| Descent `abyss` + `styx` (3.0–5.5s) | retimed as portal → flash → Sanzu (§4) |
| `/underworld` backdrop | new Sanzu scene (§3) |
| Arrival | RYUMA title + System notice (§5) |
| Trial | Task 10 gameplay kept; reskinned as a Gate clear with rank (§5) |
| Card (old Task 11) | replaced by the Status Window + ARISE (§6) |
| Underworld music | new dark Kevin MacLeod CC BY 3.0 track (§7) |
| Teal palette, `isle.png`, `styx.tsx`, Met credit on the Underworld | removed |

## 3. The Sanzu scene

The `/underworld` backdrop, and the final frame of the descent.

### Composition (desktop 16:9)

- **Camera:** low over the water, pitched slightly up. The title sits left, over the darker half.
- **The torii Gate:** a vermilion lacquered torii stands in the river, right of centre. Between its pillars a slowly swirling blue-violet **portal** glows; it is the brightest element in the frame.
- **Moon and reflection:** a pale low moon behind the torii lays a light path on mirror-black water. The torii, portal, lanterns and moon all reflect in the water.
- **Floating lanterns (tōrō nagashi):** about 40 warm-amber paper lanterns drift slowly downstream and bob. They are one instanced draw.
- **Red spider lilies (higanbana):** a bank in the lower-left foreground, about 600 instances, swaying in the vertex shader.
- **Ferryman's boat:** low and wooden, with a hooded ferryman and pole, drifting toward the Gate. Procedural, lit wood.
- **Hitodama:** small blue-white spirit orbs drifting.
- **Mist and sky:** layered mist planes drift over the water. The sky is ink with faint stars.

### Look

- **Materials and tone:** lit PBR-style materials (lacquer, wet stone, paper, wood) with ACES tone mapping and exponential ink fog.
- **Lights:** cool directional moonlight, a violet point light from the portal, and amber from the lanterns. Lanterns are emissive; at most two real lanterns carry point lights.
- **Bloom:** only on emissive elements (portal, lanterns, hitodama, moon); the threshold keeps the rest crisp.
- **Parallax:** the camera leans with the pointer, within ±0.15 rad of yaw and pitch, eased.
- **No dither or engraving shader anywhere in this scene.**

### Tiers and accessibility

- **Low tier (existing `scene.tier`):** no reflector (glossy gradient water with a fake moon streak instead), glow sprites instead of bloom, half the lanterns and lilies, and one light besides the moon.
- **Portrait (390×844):** the camera reframes so the Gate sits in the top half and the text below.
- **Reduced motion:** one still frame; time is frozen and there is no parallax.
- **Footer credit:** the foreground water under the footer stays dark, so the credit stays legible (the lesson from Task 8).

## 4. The descent's bottom half

`fare`, `olympus` and `fall` are unchanged. The engraved shaft is unchanged down to its last ring.

- **Portal approach (`abyss`, 3.0–4.2s):** the portal appears far below the shaft. It is a violet-blue swirling disc that grows as the camera falls toward it. The shaft keeps its engraved dither.
- **Flash (`gate`, 4.2–4.45s):** the camera passes through the portal. A System-blue full-screen flash peaks at 4.3s with a thin scanline sweep (the System booting). The render style switches under the flash: the engraved shaft is hidden and the lit Sanzu scene is shown. The two styles are never blended.
- **Glide (`sanzu`, 4.45–5.5s):** the flash clears to the Sanzu. The camera emerges above the torii and glides down to `RIVER_CAMERA`, the backdrop's exact camera, so the handoff to `/underworld` does not pop.
- **Title:** "You have crossed" becomes the first System window, `[SYSTEM] You have entered the Gate.` It opens during the glide and stays on the page as the arrival notice.
- **Totals:** `DESCENT_S` stays 5.5 and `ASCENT_S` stays 3. Esc skip and the 2× speed on a repeat crossing stay.
- **Ascend:** the reverse. The camera rises into the portal, the flash hits, and the engraved shaft and Olympus follow.
- **Reduced motion:** the 1s crossfade with no 3D. The System notice is held fully visible for at least 1s, which fixes the ~0.1s title issue from Task 9.
- **Renames:** `STYX_Y` becomes `RIVER_Y`, `STYX_CAMERA` becomes `RIVER_CAMERA`, the beat `styx` becomes `sanzu`, and a new beat `gate` is added. Tests are updated to match.

## 5. The System interface

### Window

One shared component, `SystemWindow`:

- **Surface:** a translucent deep-navy panel (backdrop blur), a 1px System-blue border with a soft outer glow, and corner brackets.
- **Type:** headers in JetBrains Mono caps in brackets, e.g. `[ QUEST INFO ]`; big numbers in League Gothic; body copy in Newsreader. No new fonts.
- **Opening:** a horizontal line draws out (120ms), then the panel unfolds vertically (180ms), with a strong ease-out. With sound on, `playChime()` plays a short synthesized chime (Web Audio oscillators; no audio file). Reduced motion gives a plain 150ms fade and no motion.
- **Semantics:** real DOM. Notices use `role="status"` / `aria-live="polite"`. Windows are sections with headings.

### Arrival

The RYUMA title and tagline stay, with the System window `[SYSTEM] You have entered the Gate.` below them.

### Trial (Task 10 gameplay, reskinned)

- **Briefing window:** `[ QUEST ]` Clear the Gate. Banish the shades. Time limit: 30s.
- **Targets and feedback:** targets become violet-blue glowing sigils with a sharp hit burst. The hot path, scoring and timing from Task 10 are unchanged.
- **Result window:** shows the rank, score, hits, accuracy and average reaction, compared with Ryuma.
- **Rank** (`lib/rank.ts`, relative to `ARENA.ryumaBest`): `S` if the score beats Ryuma; otherwise `A` ≥ 80%, `B` ≥ 60%, `C` ≥ 40%, `D` ≥ 20%, and `E` below that.
- **LEVEL UP!:** a new personal best pops a System notice.
- **Finish button:** "Claim your card →" becomes **ARISE**.

## 6. ARISE and the Status Window

### ARISE

- **Trigger:** pressing ARISE after a clear, or skipping the trial.
- **The flash:** "ARISE" flashes huge in League Gothic with a Monarch-violet glow for about 1.2s.
- **In 3D:** 7 shadow soldiers rise from the river in front of the torii. They are dark humanoid silhouettes built from primitives, with glowing System-blue eyes and violet smoke. They rise over about 1.5s and then stand, swaying slightly.
- **Once only:** it plays once. `quest.arise()` sets `arisen: true` in the store, and on later visits the soldiers are already standing.
- **Reduced motion:** the soldiers fade in rather than rise, and the word appears without scale.
- After ARISE, the page scrolls to the Status Window.

### Status Window (`section#status`, replaces `#card`)

```
[ STATUS ]
NAME   Ryuma                 LEVEL  {level}
JOB    {job}                 TITLE  One Who Drops Hot
STR {str}  AGI {agi}  PER {per}  VIT {vit}  INT {int}
[ SKILLS ]     Active · Drop Hot   Passive · Rotate Early   PvP · Battle royale · FPS
[ EQUIPMENT ]  PC · Mobile
[ YOUR RECORD ] Rank {rank} · {score}
[SYSTEM] Ryuma has sent you a party invite.   [ Accept ]
```

- **Accept:** `[ Accept ]` opens the existing "Squad up" email (`CARD.cta.href`, renamed with the copy).
- **Locked state:** before the Gate is cleared or skipped, the window renders locked: "Clear the Gate to unlock."
- **Copy placeholders:** `level`, `job` and the five stats are placeholders in `lib/content.ts` for Bhumil to fill, like `ARENA.ryumaBest`. The skill names derive from the old card's quote ("drop hot, rotate early") and its PvP / battle royale / FPS list.
- **Record without a score:** if the visitor skipped the trial, it reads "Unranked".

## 7. Music

Danse Macabre is replaced by a dark or ominous Kevin MacLeod track licensed CC BY 3.0, sourced from Wikimedia Commons through `scripts/fetch-audio.mjs` (same pipeline, fades and loudnorm). The track is chosen during planning. The credit line stays "Music: Kevin MacLeod (incompetech.com), CC BY 3.0" on both realms.

## 8. Palette

These replace the teal set. Olympus tokens are untouched.

| Token | Hex | Use |
|---|---|---|
| `--abyss` | `#05070d` | ground, fog |
| `--mist` | `#cfd8e3` | text |
| `--system` | `#4aa8ff` | System windows, eyes, portal core |
| `--monarch` | `#8b5cf6` | shadows, ARISE, portal rim |
| `--lily` | `#c8232c` | torii, spider lilies |

`.soul-glow` becomes `.system-glow`.

## 9. Units

- `components/experience/sanzu/` holds `index.tsx` (`<Sanzu fade? />`, `<SanzuBackdrop />`), `torii.ts`, `portal.ts`, `lanterns.ts`, `lilies.ts`, `water.ts`, `mist.ts` and `shadows.tsx`.
- `components/experience/bloom.tsx` adds the bloom, active only on `/underworld` and during the descent's portal beats.
- `components/underworld/` holds `system-window.tsx`, `arrival.tsx` (updated), `arena.tsx` (reskinned, rank, ARISE), `status-window.tsx` and `arise.tsx`.
- In `lib/`:
  - `rank.ts` is new, with tests.
  - `quest.ts` gains `arisen` and `arise()`, with tests.
  - `descent.ts` gets the retimed beats, the portal curves and the renames, with its tests updated.
- `components/quest/sound.tsx` gains `playChime()`.
- `scripts/fetch-audio.mjs` gets the new track.
- `lib/content.ts` gets all the new copy.

## 10. Risks

- **Bloom on the shared canvas.** The site renders one canvas split into drei `View` scissor regions, which complicates a post-processing composer. The first task spikes three.js's `EffectComposer` + `UnrealBloomPass` (from `three/examples/jsm`, no new dependency) against the View setup. If it cannot run cleanly, the fallback is additive glow sprites per emissive element, which is the same approach as the low tier.
- **Refined look from procedural geometry.** Quality comes from lighting, materials, fog and bloom rather than from mesh detail. Silhouettes (torii, boat, soldiers) are kept simple and strong.

## 11. Constraints (carry over, plus changes)

- No new npm dependencies. Dev scripts may use `ffmpeg` and `sharp`.
- Every `localStorage` access stays guarded. The site must work when storage throws.
- Music is off by default and starts only on a user gesture.
- Fonts stay League Gothic, Newsreader and JetBrains Mono. Copy lives in `lib/content.ts`.
- Art: the no-nudity rule still applies. No figurative art assets remain on the Underworld.
- Frontend tasks load `emil-design-eng`, `impeccable:impeccable` and `taste-skill:taste-skill`; motion tasks also load `apple-design`.
- Git: commit per task. No co-author trailer, no AI attribution, never push.

## 12. Testing

- **Unit:** `lib/rank.ts` (every band and boundary), `quest.arise()` and its persistence (including when storage throws), and the retimed `descent.ts` (beat continuity, camera monotonic fall, handoff at `RIVER_CAMERA`).
- **Browser (Playwright fallback where Orca screenshots fail):**
  - screenshots at 1440×900 and 390×844 of the landing, trial briefing, result, ARISE and Status Window, plus the locked state;
  - the descent frame by frame, including the flash cut;
  - the ascend;
  - reduced motion;
  - the footer credit legible on both realms.
- **Performance:** a Chrome DevTools trace on `/underworld`, targeting about 60fps on desktop; the low tier is checked for a smooth frame rate.
- **Regression:** Olympus is visually unchanged.
- **Gates:** `npm test`, `npx tsc --noEmit`, `npm run lint` and `npm run build` are green.
