# Underworld Side Quest — Design Spec

Date: 2026-09-26
Status: Design approved in brainstorming. Awaiting spec review.

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
- **Nav chip** (client island next to `BM`): hidden until the first pickup, then `◇ Obols 1/3`.
  At 3/3 it turns ember and reads `Pay the ferryman →`. After the visitor has crossed once it
  reads `◆ Underworld`.
- Hints: one footer meta line — "The ferryman takes coin." — and a `console.log` greeting.
- Progress (`obols` found, `crossed`, visitor `best` score) persists in `localStorage`, every
  access in try/catch; on failure it falls back to in-memory state so the quest still works for
  the session.

## 3. The crossing

- `Pay the ferryman →` plays a ~2s descent: the terracotta field drains downward, colour goes
  cold, a Styx waterline rises across the screen with `YOU HAVE CROSSED`, then the router
  navigates to `/underworld`. Skippable (click / Esc). Reduced motion: plain crossfade.
- `Ascend ↑` on the Underworld plays the reverse and returns to `/`.
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
Böcklin, *Isle of the Dead* (The Met, Open Access CC0) and a dark Piranesi *Carceri* plate.
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

The card is claimable only after one trial run; revisits show it directly.

## 7. Music

- One looping track per realm, from public-domain recordings:
  - **Olympus:** Satie, *Gymnopédie No. 1* (named for a Greek ritual dance).
  - **Underworld:** Gluck, *Dance of the Furies* (*Orfeo ed Euridice* — Orpheus at the gate of
    Hades).
  The **recording** must also be public domain / CC0 (e.g. Musopen, Wikimedia Commons), not just
  the composition — verified in the plan, source and licence recorded in the art/audio manifest.
- Files in `public/audio/`, trimmed to clean loops, ~128 kbps, target ≤ 3 MB each. Loaded only
  after the visitor turns sound on.
- **Off by default.** Sound toggle `♪ Off / On` in the nav of both realms; the choice persists.
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
| `components/quest/quest-chip.tsx` | nav chip |
| `components/quest/crossing.tsx` | descent / ascent transition + navigation |
| `components/quest/sound.tsx` | audio provider + toggle |
| `app/underworld/page.tsx` | realm route, gate |
| `components/underworld/arena.tsx` | trial canvas + lobby/end screens |
| `components/underworld/player-card.tsx` | the card |
| `public/audio/*`, `public/art/*` | assets, with licence entries in the manifest |

## 9. Out of scope

Leaderboards, shareable score images, server state of any kind, more than three obols.

## 10. Testing

- `npm test`: `arena.test.ts` (lifespan curve bounds, score maths, accuracy) and
  `quest.test.ts` (pickup idempotence, 3/3 unlock, storage-throws fallback).
- `npm run lint`, `npm run build`.
- Browser pass (Orca): find all three obols → crossing → trial → card → Ascend; direct
  `/underworld` visit without obols shows the gate; desktop and phone widths; reduced motion;
  sound on/off across the crossing; keyboard-only run.
