# Addendum: portal-style dither and type

Addendum to `2026-09-25-mythic-portfolio-design.md`. Reference: portal.nousresearch.com, used for
style cues only. We do not copy its layout or palette.

## Scope

Kept as is: the terracotta palette, the Hermes section order, the full-width layout, all copy, the
onboarding timeline, the single-Canvas architecture and every exported interface.

Changed: how the 3D art is shaded, how headings are cased and marked, and the shape of the Approach
card art.

## 1. Dither shading

File: `components/experience/engraving-material.ts`.

- Replace the line-hatching in the fragment shader with an 8×8 Bayer ordered dither in screen space.
  The dither cell is `floor(gl_FragCoord.xy / uSpacing)`, so `uSpacing` sets the dot size in device
  pixels.
- Luminance keeps the current terms: `l = clamp(diffuse * 0.85 + rim * 0.45, 0, 1)`. A fragment is
  bone where `l` is above the Bayer threshold for its cell, and void everywhere else. The palette is
  two-tone bone on void, with no new colors.
- The uniforms stay the same: `uBone`, `uVoid`, `uLight`, `uSpacing`, `uReveal` and `uOpacity`.
  `uReveal` still discards fragments above the world-space cut-off, and `uOpacity` still scales
  alpha. The `createEngravingMaterial(opts?)` signature doesn't change.
- Every mesh that uses the material picks up the new look: the onboarding bust, the rays, the
  colonnade and all card art. The onboarding's ember particles keep their own shader.
- The default `spacing` is tuned by eye so dots read as dither at 1440×900 and 390×844 and don't
  alias into moiré while the model rotates. Record the value chosen.
- No style switch and no hatch fallback.

## 2. Type treatment

- `components/sections/section-label.tsx`:
  - The eyebrow becomes a mono marker that reads `// {children}`. The `//` is decorative, so it is
    `aria-hidden` and not part of the copy. It replaces the square bullet.
  - The h2 drops `uppercase` and gets slightly tighter tracking (around `-0.01em`). It stays League
    Gothic and keeps its current size and leading.
- These display headings go mixed case (drop `uppercase`, tighten tracking to match):
  - `hero.tsx` h1
  - `approach.tsx` h3
  - `engagement.tsx` h3
  - `cases.tsx` h3
  - `case-dialog.tsx` h3
  - `work.tsx` h3 and h4
- These stay uppercase:
  - the onboarding name (`onboarding.tsx`)
  - the footer wordmark (`footer.tsx`)
  - all mono nav, button, label and meta text
- `lib/content.ts` strings are already sentence case, so no copy changes.
- The body font stays Newsreader.

## 3. Panels

- `components/sections/approach.tsx`: the card art goes from `aspect-[4/3]` to `aspect-[2/1]` and
  gets a 1px `border-bone/40` hairline. `art-slot` still provides the halftone ground when WebGL is
  missing.
- The hero art slot doesn't change.

## Constraints

Everything in the main plan's Global Constraints still holds: tokens, contrast rules, fonts, exact
dependency pins, one Canvas, reduced motion, no-WebGL behavior, and no AI attribution in commits.

## Verification

- Gates: `npx tsc --noEmit`, `npm run lint`, `npm test` and `npm run build`.
- Browser check at 1440×900 and 390×844, confirming:
  - every onboarding beat reads as dither, and the name stays legible over the bust
  - all six card-art pieces are dithered and upright
  - headings are mixed case, and `//` markers show on every section label
- Reduced motion: the art doesn't spin.
- No WebGL: the halftone ground shows.
- There are no new unit tests. Shader output is checked visually.
