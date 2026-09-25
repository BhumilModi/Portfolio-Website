# Illustrated Rhythm — Design Spec

Date: 2026-09-26
Status: Design approved. Amends `2026-09-25-mythic-portfolio-design.md` §3, §4.2, FAQ and footer.

## 1. Problem

The sections read bland next to the references (hermes-agent.nousresearch.com, nousresearch.com):

- One terracotta field runs through every section — no rhythm, too much orange.
- Illustration lives only inside small art boxes; nothing sits *behind* content.
- FAQ is unwanted.
- Footer is an empty black void with four links.

Hermes gets its richness from alternating a colour field with off-white paper, and from large
duotone engraved classical art behind content. We adopt that mechanism with our own palette.

## 2. Section rhythm

| Section | Field | Text | Illustration |
|---|---|---|---|
| Hero | terracotta | bone | Large dithered engraving + SVG sunburst rays behind headline and bust, printed in void ink at low contrast |
| Engagement | terracotta | bone | Greek meander band at the section's bottom edge, the seam into paper |
| Approach | paper | ink | Existing black 3D cards unchanged; faint paper grain |
| Work | void | bone | Full-bleed dithered statue behind the grid, bone ink ~15% |
| Cases | paper | ink | Wide dithered illustration band above the I–IV columns |
| Record | paper | ink | Small engraved ornament beside the section title |
| Working together | void | bone | Large art on one side, facts + CTA on the other |
| Footer | terracotta | bone | Full-bleed statue collage, ghost outlined wordmark, link columns |

Terracotta drops from the whole page to roughly 30% of scroll length.

## 3. Tokens

Add to `@theme` in `app/globals.css`:

- `--color-paper: #efe6d4` (same value as bone; named for its role as a surface)
- `--color-ink: #0b0907` (same value as void; named for its role as text)

Paper sections set `bg-paper text-ink`. Everything inside a section uses `currentColor`-relative
utilities (`text-current/85`, `border-current/30`) instead of hard-coded `bone`, so
`SectionLabel`, rules and meta text work on any field. Contrast: ink on paper ≈ 16:1; `/85` and
`/70` variants must stay ≥ 4.5:1 for body/meta text (verify with axe).

The existing `text-field` on bone buttons stays. Buttons on paper sections invert to
`bg-ink text-paper`.

## 4. Art pipeline

- **Source:** The Met Open Access API (CC0). A fixed list of object IDs in the script. The script
  fetches `/public/collection/v1/objects/{id}`, **refuses any object whose `isPublicDomain` is not
  `true`**, downloads `primaryImage`, and writes `public/art/manifest.json` with id, title, and
  source URL for each.
- **Subjects:** Classical marble busts and heads, Greek vase painting, and one engraved scene with
  radiating composition for the hero. The plan picks exact IDs after checking the images.
- **Processing:** `sharp` (already installed as a Next dependency) converts to grayscale, resizes
  and levels the image, then applies a Bayer 8×8 ordered dither in JS over the raw pixel buffer.
  Output is a **single-channel alpha mask** (alpha = ink) saved as WebP/PNG. This matches the 3D
  shader's dither look.
- **Tinting:** A CSS class `.art-mask` uses `mask-image: var(--art)` + `background-color:
  currentColor`, so one file renders in any colour on any field. No JS and no per-colour copies.
- **Budget:** 5–6 images, each ≤ ~150 KB. Committed to `public/art/`; the script is re-runnable
  but not part of the build.
- **Accessibility:** decorative layers are `aria-hidden`, have no pointer events, and sit behind
  content (`-z-10` inside an `isolate` section).
- **Test:** one small test for the dither function (a known 2×2 input gives a known mask; 0 and 255
  stay solid).

## 5. Working together (replaces FAQ)

Delete `components/sections/faq.tsx` and the `FAQ` content export. Add
`components/sections/together.tsx` with `TOGETHER` content. The nav item `FAQ → #faq` becomes
`Hire → #together`.

Draft copy (every line traces to the resume or existing site copy; **Bhumil confirms before
ship**):

- Label: `Working together`
- Title: **Bring me in on the first call.**
- Facts (mono label → value):
  - Role → Forward Deployed AI Engineer
  - Based → Ankleshwar, India · IST (UTC+5:30)
  - Works → Remote, alongside your stakeholders
  - First version → A working POC within two weeks
  - Domains → Ten so far, from clinical to CAD
- CTA: `Get in touch` (mailto) + the existing `CopyCommand` mail block + `Resume ↓`

No availability dates, rates, or contract terms. Those aren't in any source.

## 6. Footer

- Stays sticky-reveal, now on terracotta.
- Background: collage of 2–3 dithered busts in void ink, full-bleed, cropped by the footer box.
- Ghost wordmark `BHUMIL MODI`: the same display type, outlined (`-webkit-text-stroke`, transparent
  fill), overlapping the collage.
- Link columns: **Contact** (email, copy) · **Elsewhere** (LinkedIn, GitHub) · **Site** (nav
  anchors) · **Resume** (PDF).
- The `Send word.` line and meta row (`location · © 2026`) stay.
- Text on terracotta stays bone (AA verified in the original spec).

## 7. Out of scope

Onboarding, 3D card art, case dialogs and demos, and copy outside §5 are unchanged.

## 8. Verification

- Screenshot every section at desktop width, and at 375px for the hero, Work and footer.
- `npm run lint`, `tsc --noEmit`, `npm run build`, and existing tests pass.
- axe contrast check passes on the paper sections and on text over art.
- Total new art weight ≤ ~900 KB. LCP image unaffected, since hero art is decorative and lazy
  when off-screen.
