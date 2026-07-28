# 3D Boarding Experience — Design

Date: 2026-07-29
Status: approved, ready for implementation planning
Project: Bhumil Modi portfolio (`~/Personal work/My Portfolio`), Next.js 16.2.12 App Router, React 19.2.4

---

## 1. Goal

The portfolio currently mounts with no arrival moment: `Desktop` renders, the `readme`
window is already open, and a 150ms opacity fade covers the first post-measure paint.
A visitor lands mid-scene.

This adds a boarding experience — a camera dolly through a WebGL scene that resolves
into a permanent, living 3D background. The decorative half of the current 2D
`Backdrop` becomes real geometry; the intro is the scene's own copy settling into its
resting position.

The central idea: **the intro is not a preamble that gets thrown away.** The headline
starts filling the frame and ends small and dimmed exactly where `backdrop.tsx` places
it today. Everything the visitor sees during the intro is still on screen when it ends.

---

## 2. Decisions made

These were settled during brainstorming. They are decisions, not open questions.

| Decision | Choice | Rejected alternatives |
|---|---|---|
| 3D technique | WebGL via three.js + react-three-fiber | CSS 3D transforms on the existing layers; canvas 2D pseudo-3D projection |
| Scene scope | Full 3D replace — decorative geometry *and* copy render in the scene | Replace geometry only, keep copy as DOM; add canvas behind an untouched backdrop |
| Choreography | Dolly-through: camera flies in from deep Z and decelerates into the rest framing | System-boot assemble; wireframe→solid snap; dolly+assemble overlap |
| Replay policy | Once per browser session, with skip | Every visit; once ever (localStorage) |
| Fallback strategy | Tiered, with `backdrop.tsx` retained as the no-WebGL fallback | 3D everywhere, no 2D fallback |
| Materials | Lit: standard materials, key + rim light, contact shadows | Unlit flat basic materials |
| Type treatment | Kinetic type as the intro's hero, resolving into its resting position | Type as scenery only |
| Reactivity | Scene responds to desktop interaction after the intro | Static rest state with mouse parallax only |
| Pacing | 2.4s total — explicitly *not* extended | ~4s multi-beat cinematic staging |
| Bloom / postprocessing | Excluded | Bloom (rejected: needs dark pixels; the `#E4E5DE` paper background turns bloom into a grey wash) |

### Accepted trade-offs

Two of these carry real cost. Both were raised and accepted.

**Bundle size.** three + fiber + drei add roughly 200KB gzip to a page that currently
ships almost nothing beyond React. This is the price of the chosen technique.

**Copy leaves the DOM.** "Full 3D replace" moves the eyebrow, headline, `~ uptime`
stats, note-to-self and hints into the WebGL scene, where they are not selectable, not
crawlable, and invisible to screen readers. Section 4 specifies the mandatory `sr-only`
DOM mirror that keeps that content accessible and indexed. **The mirror is not
optional** — without it this change is an accessibility and SEO regression.

---

## 3. File layout

```
lib/scene.ts                        layout data, camera keyframes, easing, pure response fns
lib/scene.test.ts                   node:test — easing, phase machine, scene response
hooks/use-boarding.ts               phase machine, sessionStorage, skip, capability detection
components/os/scene/
  scene.tsx                         <Canvas>, tier config, fog, camera rig, lights
  grid-floor.tsx                    receding grid — replaces DOT_GRID
  slabs.tsx                         extruded boxes — replaces the four squares + yellow block
  band.tsx                          tilted orange plane + its rule
  monogram.tsx                      outlined BM via drei <Text>, fillOpacity 0 + strokeWidth
  copy.tsx                          eyebrow / headline / stats / note card / hints, in 3D
components/os/backdrop-copy.tsx     sr-only server-rendered copy mirror  [NEW]
components/os/backdrop.tsx          RETAINED — renders only on the no-WebGL tier
components/os/desktop.tsx           gates chrome on phase, selects scene vs backdrop
hooks/use-desktop.ts                escape effect gains an `enabled` guard
public/fonts/                       static TTFs for troika text rendering
```

### Dependencies

```
three              0.185.1
@react-three/fiber 9.6.1     peer: react >=19 <19.3  — satisfied by 19.2.4
@react-three/drei  10.7.7
```

No animation library. Camera easing is a `useFrame` lerp against elapsed time. No
`postprocessing`.

Implementers must read the relevant guide in `node_modules/next/dist/docs/` before
writing code — per `AGENTS.md`, this Next.js version has breaking changes relative to
training data, particularly around dynamic imports and client boundaries.

---

## 4. Layering and the SEO/a11y contract

The canvas is dynamically imported with `ssr: false`, so nothing rendered inside it
exists in the server HTML. The copy therefore lives in the DOM as well.

```
DOM     sr-only    <BackdropCopy/>   real text, server-rendered, always present
canvas  z-0        scene             aria-hidden, WebGL tiers
DOM     z-0        <Backdrop/>       aria-hidden, no-WebGL tier only
DOM     z-30+      menu bar · windows · dock
```

Four rules hold this together:

1. `<BackdropCopy/>` is a server component rendered unconditionally by `Desktop`. It
   carries the same strings as `BACKDROP` in `lib/content.ts` — eyebrow, headline,
   stats, note, hints — as `sr-only` text. This is the single source of that content
   for crawlers and assistive technology.
2. `backdrop.tsx` already carries `aria-hidden` on its root, so when the no-WebGL tier
   renders it, assistive technology does not read the content twice.
3. The canvas wrapper is `aria-hidden` for the same reason.
4. **Windows are never conditionally rendered.** They are gated with
   `opacity`/`visibility` only. The existing SSR strategy — windows in the server HTML
   so crawlers and link previews see real content — is preserved exactly. Any
   implementation that unmounts windows during the intro is wrong.

Consequence: the copy strings are consumed in two places (`copy.tsx` in 3D, and
`backdrop-copy.tsx` as `sr-only`). Both read from `BACKDROP` in `lib/content.ts`.
Neither hardcodes text.

---

## 5. Choreography

Total 2.4s. Every beat below is data in `lib/scene.ts`, not magic numbers scattered
across components.

```
0.00  cam z=42, dense fog. headline FILLS the frame.
      per-word mask reveal, tracking -0.06 -> -0.035
0.55  words landed. camera begins the push.
0.55  headline recedes as the camera overtakes it
1.10  slabs whip past, lit, contact shadows raking
1.45  BM monogram scales through the camera
1.80  deceleration begins, easeOutExpo
2.15  rest framing locked. headline now small and dimmed,
      landing where backdrop.tsx puts it today — a world-space
      position chosen so that, at the rest camera, it reads at
      the same screen position as the current DOM headline
      (left 240px, top 74px). The pixel values are the target
      to match on screen, not coordinates to use in the scene.
2.25  menu bar + dock fade in
2.40  readme window snaps open
```

Camera: perspective, fov 55, z 42 → 4, easeOutExpo across 2.1s.

Fog: `FogExp2`, colour `#E4E5DE` (the `--color-paper` token), so objects resolve out of
the paper itself rather than out of darkness.

---

## 6. Phase machine

Two phases only.

| phase | entered when | behaviour |
|---|---|---|
| `dolly` | fresh session **and** WebGL **and** width ≥768 **and** motion allowed | camera easing runs; chrome hidden |
| `rest` | 2.1s elapsed, or skipped, or any tier that does not qualify for `dolly` | idle orbit ±2°, mouse parallax, reactivity live; chrome visible |

**Skip.** `click`, `keydown`, `wheel`, or `touchstart` during `dolly` eases to the rest
frame over 350ms. A small mono "skip ›" affordance sits bottom-right.

**Escape is a skip, not a window close.** `useDesktop`'s escape effect currently closes
the focused window; during the intro that would silently close `readme`. `useDesktop`
gains an `enabled` parameter, passed `phase === "rest"`, so the escape-to-close
listener is not attached until the intro is over.

**Persistence.** `sessionStorage` key `bm.boarded`, written on entering `rest`. Set
means the next load in that session starts at `rest` with zero animation. A refresh
during development does not replay the intro.

**Dev/demo escape hatch.** `?boot=1` in the URL forces a replay regardless of the
session flag.

---

## 7. Tiers

Capability detection happens once, in `use-boarding.ts`, before the canvas mounts.

| tier | detection | behaviour |
|---|---|---|
| full | WebGL context available, width ≥768, no reduced-motion | dolly, kinetic type, fog, lights, contact shadows, idle orbit, mouse parallax, reactivity, DPR ≤2, continuous frameloop |
| mobile | WebGL context available, width <768 | opens at the rest frame — no dolly, no kinetic type. Contact shadows off, one light, fewer grid lines, no idle orbit, no reactivity, DPR ≤1.5, `frameloop="demand"` |
| reduced-motion | `prefers-reduced-motion: reduce` | rest frame, fully static, no reactivity, `frameloop="demand"` |
| none | no WebGL context obtainable | `<Backdrop/>` renders as today; no canvas mounts |

`frameloop="demand"` on the mobile and reduced-motion tiers means the scene renders
approximately once and then idles — near-zero battery cost, which is the point of
putting a WebGL background on a phone at all.

`globals.css:146` already contains a `prefers-reduced-motion` block. The
reduced-motion tier is a JS-side decision (whether to animate the camera at all), not a
CSS override, so it must be detected in `use-boarding.ts` via `matchMedia` — the
existing pattern in `hooks/use-sim.ts:57`.

---

## 8. Materials

Lit, not glossy. The 2D design is deliberately flat with hard offset shadows; the
scene keeps that palette and hardness and adds only real occlusion.

- `MeshStandardMaterial` throughout, albedo flat and saturated: ink `#16130F`,
  orange `#E33F00`, yellow `#F2C230`. No gradients.
- One directional key light plus a tight rim light.
- `ContactShadows` beneath the slabs — this, not bloom, is what produces the sense of
  expense.
- `roughness` 0.3 on the yellow block alone, so exactly one surface catches a
  highlight. Everything else stays matte.
- No bloom, no depth of field, no `postprocessing` dependency.

---

## 9. Reactivity

After the intro, the scene responds to desktop interaction. The interface between
desktop state and the scene is one narrow, low-frequency prop:

```ts
type SceneInput = {
  openCount: number;            // -> camera dolly -0.4 per open window, damped
  focusedId: WindowId | null;
  hoveredId: WindowId | null;   // -> grid wave originating at that dock slot
  dragging: boolean;            // -> slabs lean ~3deg
};
```

**`dragging` is deliberately a boolean, not a position.** Window drags already update
position state on every `pointermove`, so a positional prop would push new props into
the canvas tree 60 times a second. A boolean gives the same read — "the user is
manipulating something" — at zero per-frame cost.

All responses damp at roughly 0.15 lerp per frame, so nothing snaps or twitches.

Of these, only `hoveredId` exists directly on `useDesktop`'s return value (as `hover`).
`openCount` and `focusedId` are derivable from the existing `w` record — `focusedId` is
already computed internally as `WINDOW_ORDER.find(id => open[id] && z[id] === topZ)` but
is not returned, so it needs exposing. `dragging` requires exposing whether the internal
`drag`/`resizing` refs are engaged — as a boolean state, not the ref contents, since refs
do not trigger renders.

Reactivity is live only on the full tier.

---

## 10. Fonts

troika-three-text (which backs drei's `<Text>`) reads `.ttf`, `.otf` and `.woff`. It
does **not** read `.woff2`, which is the only format Google's `css2` endpoint serves —
so `next/font/google` cannot supply the scene's fonts.

Static TTFs for Space Grotesk 700 and JetBrains Mono 400 go in `public/fonts/`, sourced
from the fontsource CDN. DOM text continues to use `next/font/google` exactly as it
does today; this is an additional asset for the canvas only.

**This needs an eyes-on check, not a green build.** If a font URL 404s, troika falls
back to its own default font silently — the build passes, the tests pass, and the
typography is quietly wrong. Verification must include looking at the rendered scene.

---

## 11. Known limitation: flat monogram

The BM monogram renders as flat SDF text with `fillOpacity: 0` and a `strokeWidth`,
positioned at a Z depth the camera flies past. It is not extruded geometry.

This is a deliberate simplification. Extrusion would require drei's `Text3D`, which
needs a facetype.js JSON conversion of the font — a build-time asset pipeline for one
decorative element. The current 2D design already renders the monogram as a
transparent-fill outline (`WebkitTextStroke: 3px #16130F1a`), so flat-with-stroke is a
faithful match rather than a compromise on appearance.

It carries a `ponytail:` comment naming the ceiling: if it reads too flat at the moment
the camera passes through it, the upgrade path is `Text3D` plus a facetype JSON.

---

## 12. Verification

`lib/scene.test.ts`, following the existing `lib/geometry.test.ts` pattern
(`node --test`, already wired into `npm test`):

- **Camera easing** — hits z=42 at t=0 and z=4 at t=1, and is monotonically decreasing
  across the interval.
- **Phase machine** — `dolly → rest` on elapse; `dolly → rest` on skip; starts at
  `rest` when the session flag is set; starts at `rest` on every non-full tier.
- **`sceneResponse(input)`** — camera offset scales with `openCount` and clamps at the
  bound, so five open windows cannot push the camera through the grid.

These are pure functions in `lib/scene.ts` precisely so they are testable without a
WebGL context.

Beyond the automated checks, three things require manual confirmation:

1. Scene typography uses Space Grotesk and JetBrains Mono, not troika's fallback
   (§10).
2. Server HTML still contains the window content and the `sr-only` copy mirror — check
   `curl` output or view-source, not the hydrated DOM (§4).
3. The no-WebGL tier renders `backdrop.tsx` — testable by forcing the detection to
   fail.

---

## 13. Out of scope

- Extruded 3D monogram (§11).
- Bloom or any postprocessing (§2).
- Extended multi-beat cinematic staging beyond 2.4s (§2).
- Scroll-driven motion — the desktop does not scroll.
- Any change to window behaviour, dock behaviour, case sims, or content copy.
- Dark mode. The design has none and `globals.css` documents the deleted `.dark` block
  as deliberate.
