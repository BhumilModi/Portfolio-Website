# Underworld Side Quest — Design Spec

Date: 2026-09-26
Status: Approved.

## 1. Goal

Give visitors a reason to explore beyond scrolling, and show the gaming side of Bhumil — without
getting in the way of the hiring path.

The main site is **Olympus** (warm, terracotta, gods — the work). The side quest is a hidden
descent into the **Underworld** (cold, dark, spectral — Ryuma, off duty). The quest is:
**hunt → crossing → trial → card**, with a background music theme in both realms.

Not a fact-based section: the site's facts-only content rule does not apply here. No game titles,
ranks or stats are shown.

## 2. The hunt — Charon's fare

- Three **obols** (small dithered coins in the site's engraving language) are hidden in:
  1. one Approach art tile,
  2. among the Record toolkit chips,
  3. the footer relief.
- Each obol is a real `<button aria-label="Obol">`, keyboard reachable. A faint ember glint every
  ~8s makes it discoverable but quiet.
- Pickup: coin pops and flies to the nav. Reduced motion: fade out, no flight, no glint.
- **Quest chip:** a fixed HUD chip in the bottom-left corner. The nav is not sticky, so a chip
  there would be off-screen when an obol is picked up in the footer. The chip stays hidden until
  the first pickup, then shows `◇ Obols 1/3`. At 3/3 it turns ember and reads
  `Pay the ferryman →`. After the visitor has crossed once, it reads `◆ Underworld`. Picked obols
  fly to it.
- Hints: one footer meta line — "The ferryman takes coin." — and a `console.log` greeting.
- Progress (`obols` found, `crossed`, visitor `best` score) persists in `localStorage`, every
  access in try/catch; on failure it falls back to in-memory state so the quest still works for
  the session.

## 3. The crossing — a 3D descent from heaven to hell

`Pay the ferryman →` plays a ~5.5s time-driven (not scroll) 3D cinematic on the existing fixed
canvas, built from the parts already there: engraving shader, particles, rays, colonnade. The
camera falls from Olympus to the Styx in one continuous shot.

| t (s) | Beat | What is on screen |
|---|---|---|
| 0 – 0.6 | **The fare** | An engraved obol flips in 3D and drops out of frame. The page fades behind the canvas. |
| 0.6 – 1.8 | **Olympus** | Camera among warm cloud particles and the colonnade, god-rays from above in bone/ember. The camera pitches down and starts to fall. |
| 1.8 – 3.0 | **The fall** | Through the cloud layer: particles stretch into upward speed streaks, rays go out, and the shader's palette uniform slides from warm to cold. |
| 3.0 – 4.2 | **The abyss** | A descending shaft of instanced columns and arches (Carceri-like) rushes past. Embers turn into soulfire wisps rising against the fall. |
| 4.2 – 5.5 | **The Styx** | The camera brakes and levels out over dark water (a shader plane with soulfire glints). An *Isle of the Dead* silhouette sits on the horizon. `YOU HAVE CROSSED` appears. |

- At the end the router navigates to `/underworld`. The canvas persists across the route, so the
  Styx water becomes the Underworld page's live backdrop: a seamless handoff, not a cut.
- **Ascend ↑** plays the same timeline reversed and shortened (~3s): it rises off the water, up
  the shaft, and through the clouds into warm light, then navigates to `/`.
- **Skip:** click, Esc or Enter jumps to the end state. A repeat crossing in the same session
  runs at ~2× speed.
- **Audio:** *Gymnopédie* fades out during the fall and *Danse macabre* fades in at the
  Styx (when sound is on).
- **Tiers:** low tier gets fewer particles and columns, and dpr is capped as it is today.
  Reduced motion, no WebGL, or a failed canvas falls back to a 1s crossfade from terracotta to
  abyss with `YOU HAVE CROSSED`.
- The timeline is a pure function of elapsed time in `lib/descent.ts` (beat windows, camera path
  and palette mix, via the existing `lib/timeline.ts` helpers), with a test. The scene only reads
  it, the same split as the onboarding.
- `StageLoader` moves from `app/page.tsx` to `app/layout.tsx` so the canvas survives the route
  change.
- **Charon's boat** waits on the Styx, and the camera settles beside it in the final beat. It is
  built procedurally, with no download: a narrow skiff hull from a few three.js primitives, a
  punting pole, a hooded ferryman silhouette (cone plus sphere) and a soulfire glow sprite at the
  prow. Everything uses the engraving shader, so it reads as an etching. The boat drifts slowly on
  the Underworld backdrop.
  (Poly Haven was checked on 2026-09-26: `ship_pinnace` is a sailed galleon with ~180k polys, and
  `Lantern_01` is a modern hurricane lamp. Neither fits.)
- No new 3D model files.
- The Underworld is its own route, `/underworld`. Visiting it without 3 obols shows Charon's
  gate: "No fare, no crossing." with a link back to Olympus. The gate is a client-side check —
  it is a game, not security.

## 4. The Underworld realm

**Palette** (inverse of Olympus; final values tuned in the impeccable/taste pass):

| Token | Value | Use |
|---|---|---|
| `--abyss` | `#05080a` | background |
| `--styx` | `#0e2626` | panels, arena floor |
| `--asphodel` | `#cfd8d3` | text (AA on abyss and styx) |
| `--soulfire` | `#5ef2c2` | the one accent: targets, focus ring, glow, foil |

Scoped to the `/underworld` route so Olympus tokens are untouched.

**Type:** same families (League Gothic, Newsreader, JetBrains Mono). Display gets a faint
soulfire glow; mono carries the HUD.

**Art:** same dithered pipeline (`scripts/fetch-art.mjs`, `Art` mask component). Sources:
Böcklin, *Island of the Dead* (The Met object 435683, Open Access CC0; audited on 2026-09-26:
one shrouded figure, no nudity) and the existing Piranesi *Carceri* mask.
Every pick audited against the no-nudity rule on the full image and on the crop — which rules
out most of Doré's *Inferno*.

**Atmosphere:** rising ash / soul wisps. Reuse the onboarding particle shader with cold uniforms
if that is cheap; otherwise a light 2D canvas. Off under reduced motion.

**Page flow:**
1. **Arrival** — `RYUMA`, and "By day, agents in production. By night —"
2. **The Trial** (§5)
3. **The Card** (§6)
4. **Ascend ↑**

## 5. The Trial — aim trainer

- Lobby: `TRIAL OF RYUMA` · "30 seconds. Banish the shades." · Start → 3-2-1 countdown.
- 30s round on a 2D canvas, one target at a time. Targets are **shades** (spectral masks) that
  fade over their lifespan; fully faded = miss. Lifespan ramps ~1.4s → ~0.7s across the round.
- A click/tap on empty arena is a miss (counts against accuracy).
- HUD (mono, corners): time, score, streak.
- Score: hits × 100 + speed bonus (faster reaction = more) × streak multiplier.
  End stats: score, hits, accuracy %, average reaction ms.
- End screen: `YOU 4,120 · RYUMA 5,300`, verdict line ("Ryuma still holds the arena" /
  "You took the arena"), buttons `Run it back` and `Claim your card →`.
- Ryuma's score is a constant in `content.ts`; Bhumil plays once and the value is hard-coded.
  Placeholder until then.
- Visitor best saved via the quest store. Mobile: tap, targets ≥ 48px. Round pauses when the tab
  is hidden. Esc leaves the round.
- Hit sound effect (short, quiet), only when sound is on.
- Pure logic (spawn position, lifespan curve, scoring) lives in `lib/arena.ts` with a
  `lib/arena.test.ts`, matching `argus.ts` / `daedalus.ts`. The component only draws and
  handles input.

## 6. The Card — Ryuma

A collectible trading card in the Underworld skin: styx panel, asphodel engraving, soulfire
foil edge, dithered bust as portrait.

- `RYUMA` (League Gothic, large) · `a.k.a. Bhumil Modi` (mono)
- `Plays` PvP · Battle royale · FPS
- `On` PC · Mobile
- *"I play the same way I ship: drop hot, rotate early."*
- Visitor stamp: `Challenger · 4,120 · 78% acc` (shown once they have played)
- Motion: tilts toward the pointer with a moving soulfire foil sheen; springs in when claimed.
  Reduced motion: static, fades in.
- `Squad up →` — `mailto:` with subject "Squad up — from the arena".

The card can only be claimed after one trial run, and revisits show it directly. The trial needs a
pointer, so a `Skip the trial` button also unlocks the card, without a stamp. That keeps it
reachable by keyboard and screen reader.

## 7. Music

- One looping track per realm. Both are Kevin MacLeod recordings, CC BY 3.0, taken from Wikimedia
  Commons (licences checked on 2026-09-26):
  - **Olympus:** Satie, *Gymnopédie No. 1*. The title comes from a Greek ritual dance.
    `File:Gymnopedie No. 1 (ISRC USUAN1100787).mp3`
  - **Underworld:** Saint-Saëns, *Danse macabre* (Death fiddles while the dead dance).
    `File:Danse Macabre (ISRC USUAN1100546).mp3`
  Gluck's *Dance of the Furies* was the first choice, but no public-domain or CC recording of it
  exists on Commons. CC BY requires a credit: "Music: Kevin MacLeod (incompetech.com), CC BY 3.0"
  goes in the footer meta on both realms and in `public/audio/manifest.json`.
- Files in `public/audio/`, trimmed to clean loops, ~128 kbps, target ≤ 3 MB each. Loaded only
  after the visitor turns sound on.
- **Off by default.** A `♪ Off / On` sound toggle sits in the Olympus nav and the Underworld header, and the choice persists.
- Crossing and Ascend crossfade between tracks. Fades use a Web Audio `GainNode` — iOS Safari
  ignores `HTMLMediaElement.volume`.
- The audio player lives in a client provider in `app/layout.tsx` so it survives client-side
  navigation between `/` and `/underworld`.
- Pauses while the tab is hidden; resumes on return if it was on. Low default level.
- If a track fails to load, the toggle disables itself; nothing else breaks.

## 8. Units

| Unit | Purpose |
|---|---|
| `lib/content.ts` | `UNDERWORLD`, `ARENA` copy; `ARENA.ryumaBest` |
| `lib/quest.ts` (+ test) | quest store: obols, crossed, best; storage fallback; subscribe |
| `lib/arena.ts` (+ test) | spawn, lifespan curve, scoring |
| `components/quest/obol.tsx` | hidden coin button |
| `components/quest/quest-chip.tsx` | fixed HUD quest chip |
| `lib/descent.ts` (+ test) | descent timeline: beats, camera path, palette mix |
| `components/quest/crossing.tsx` | trigger, skip, fallback crossfade, navigation |
| `components/experience/descent-scene.tsx` | the 3D descent (clouds, fall, shaft, Styx) |
| `components/experience/styx.tsx` | water plane and Charon's boat, reused as the Underworld backdrop |
| `components/quest/sound.tsx` | audio provider + toggle |
| `app/underworld/page.tsx` | realm route, gate |
| `components/underworld/arena.tsx` | trial canvas + lobby/end screens |
| `components/underworld/player-card.tsx` | the card |
| `public/audio/*`, `public/art/*` | assets, with licence entries in the manifest |

## 9. Out of scope

Leaderboards, shareable score images, server state of any kind, more than three obols.

## 10. Testing

- `npm test`: `descent.test.ts` (beat windows contiguous, palette mix 0→1 monotonic, reverse
  ends at start), `arena.test.ts` (lifespan curve bounds, score maths, accuracy) and
  `quest.test.ts` (pickup idempotence, 3/3 unlock, storage-throws fallback).
- `npm run lint`, `npm run build`.
- Performance trace (chrome-devtools) of the descent on a throttled CPU: no long frames on the
  handoff to `/underworld`.
- Browser pass (Orca): find all three obols → 3D descent (and skip) → trial → card → Ascend; direct
  `/underworld` visit without obols shows the gate; desktop and phone widths; reduced motion;
  sound on/off across the crossing; keyboard-only run.
