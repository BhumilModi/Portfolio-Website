# Portal-style Dither and Type Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the 3D art render as an ordered dither instead of line hatching, and move headings to mixed-case condensed gothic with `//` mono markers. The style cues come from portal.nousresearch.com.

**Architecture:** One shader swap in the shared engraving material, which every 3D mesh already uses. After that come class-level edits to existing section components. No new files, interfaces or dependencies.

**Tech Stack:** Next.js 16.2.12, React 19.2.4, Tailwind CSS 4, three 0.186.1, @react-three/fiber 9.8.1, @react-three/drei 10.7.8.

**Spec:** `docs/superpowers/specs/2026-09-25-portal-dither-type-design.md`. Parent spec: `docs/superpowers/specs/2026-09-25-mythic-portfolio-design.md`. Run these tasks after Task 10 of `docs/superpowers/plans/2026-09-25-mythic-portfolio.md`, and number them Task 12 and Task 13.

## Global Constraints

- **Copy:** every visible string comes from `lib/content.ts`, and no copy changes. The `//` marker is decorative, so it is `aria-hidden`.
- **Palette tokens:** `--color-void #0b0907`, `--color-field #9a2a14`, `--color-bone #efe6d4`, `--color-ash #6b5f52`, `--color-ember #d0643b`. No new colors.
- **Contrast:** text on `field` is `text-bone` or `text-bone/85` and never lower. No `ember` or `ash` text on `field`.
- **Fonts:** League Gothic (display), Newsreader (body), JetBrains Mono (meta). The body stays Newsreader.
- **Stays uppercase:** the onboarding name, the footer wordmark, and all mono nav, button, label and meta text.
- **Dependencies:** add nothing.
- **Interfaces:** `createEngravingMaterial(opts?: { spacing?: number; reveal?: number; opacity?: number })` and its uniforms `uBone`, `uVoid`, `uLight`, `uSpacing`, `uReveal` and `uOpacity` don't change. File names and section order don't change either.
- **WebGL:** exactly one `<Canvas>`. Reduced motion keeps the art still. With no WebGL, art slots show the `art-slot` halftone ground.
- **Layout invariants from earlier fixes (don't undo):** `<Onboarding/>` renders outside `<main>` in `app/page.tsx`, and `<main>` and `<Footer>` are wrapped in a plain `<div>`.
- **Next.js 16:** read `node_modules/next/dist/docs/` before using any Next API. These tasks shouldn't need one.
- **Gates for every task:** `npx tsc --noEmit && npm run lint && npm test && npm run build`.
- **Browser verification:**
  - Use the Orca CLI (`orca status`, `orca tab create --url`, `orca eval`; guide: `orca skills get orca-cli --reference browser`).
  - Orca can't resize to exact viewports, and its screenshots time out when its window isn't focused. Use Playwright MCP for the 1440×900 and 390×844 screenshots, and name that reason.
  - Run the dev server on a dedicated port, and kill only that process.
- **Frontend skills:** load `emil-design-eng`, then `impeccable:impeccable` and `taste-skill:taste-skill`. Don't use the shadcn MCP.
- **Git:** commit at the end of each task and stage only the files you touched. NEVER `git push`. NEVER add `Co-Authored-By` or any AI or Claude attribution.
- **Budget:** about 40 turns per task.

## File Map

```
components/experience/engraving-material.ts   fragment shader: hatch → 8×8 Bayer dither; default spacing   (T12)
components/experience/card-art.tsx             spacing call-site values only, if tuning needs it            (T12)
components/experience/onboarding-scene.tsx     spacing call-site values only, if tuning needs it            (T12)
components/sections/section-label.tsx          // marker, mixed-case h2                                      (T13)
components/sections/hero.tsx approach.tsx engagement.tsx cases.tsx case-dialog.tsx work.tsx
                                               mixed-case headings; approach art 2:1 + hairline               (T13)
```

---

### Task 12: Dither shading

**Files:**
- Modify: `components/experience/engraving-material.ts`, which is the whole `fragmentShader` string, the comment above it, and the default `spacing`
- Maybe modify (calibration only): the `spacing:` values passed at `components/experience/card-art.tsx` (the `createEngravingMaterial({ spacing: 4 })` call for the eye) and `components/experience/onboarding-scene.tsx` (the `createEngravingMaterial({ spacing: 6, opacity: 0 })` call for the columns)

**Interfaces:**
- Consumes: nothing new.
- Produces: the same `createEngravingMaterial` signature and uniforms. `uSpacing` now means the dither cell size in device pixels.

- [ ] **Step 1: Replace the fragment shader**

In `components/experience/engraving-material.ts`, replace the `// Screen-space line hatching…` comment and the whole `fragmentShader` constant with:

```ts
// Screen-space 8×8 ordered (Bayer) dither: a cell inks bone when its surface brightness beats the cell's threshold.
const fragmentShader = /* glsl */ `
uniform vec3 uBone;
uniform vec3 uVoid;
uniform vec3 uLight;
uniform float uSpacing;
uniform float uReveal;
uniform float uOpacity;
varying vec3 vNormal;
varying float vWorldY;

float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2.0 + a.y * a.y * 0.75);
}
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

void main() {
  if (vWorldY > uReveal) discard;
  vec3 n = normalize(vNormal);
  float diffuse = max(dot(n, normalize(uLight)), 0.0);
  float rim = pow(1.0 - abs(n.z), 3.0);
  float l = clamp(diffuse * 0.85 + rim * 0.45, 0.0, 1.0);
  vec2 cell = floor(gl_FragCoord.xy / uSpacing);
  float threshold = bayer8(cell) + 1.0 / 128.0;
  float ink = step(threshold, l);
  gl_FragColor = vec4(mix(uVoid, uBone, ink), uOpacity);
  #include <colorspace_fragment>
}
`;
```

- [ ] **Step 2: Set the default dot size**

In the same file, change the knob comment and the default:

```ts
// spacing is the dither cell size in device pixels — calibration knob for dot size.
export function createEngravingMaterial({ spacing = 3, reveal = 100, opacity = 1 }: EngravingOptions = {}) {
```

- [ ] **Step 3: Visual calibration**

Run `npm run dev -- -p 3120` and record its PID. Open `http://localhost:3120` and check at 1440×900 and 390×844 (Playwright MCP, for the resize reason given above):
- The onboarding at p≈0.2, 0.45, 0.65 and 0.9. The bust, rays and colonnade should read as grayscale dot dither in bone on void, and the name should stay legible over the bust.
- The hero bust and the six Approach card pieces. They should be dithered and upright.
- Rotation shows no crawling moiré.

If the dots are too fine or look like noise, raise `spacing`. If they're too chunky, lower it. You may also retune the two call-site values (eye `4`, columns `6`) so their dot size matches the rest. Record every value you choose, and why, in the report. Save screenshots to `.superpowers/sdd/screenshots/t12-*.png`. Kill only your PID.

- [ ] **Step 4: Run the gates**

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```

Expected: all pass, 13/13 tests.

- [ ] **Step 5: Commit**

```bash
git add components/experience/engraving-material.ts
# plus card-art.tsx / onboarding-scene.tsx only if Step 3 changed their spacing values
git commit -m "feat: ordered-dither shading for all engraved art"
```

---

### Task 13: Type treatment and panels

**Files:**
- Modify: `components/sections/section-label.tsx`, `hero.tsx`, `approach.tsx`, `engagement.tsx`, `cases.tsx`, `case-dialog.tsx`, `work.tsx`

**Interfaces:**
- Consumes: `SectionLabel({ children, title })` keeps its signature.
- Produces: nothing new.

- [ ] **Step 1: Replace `components/sections/section-label.tsx`**

```tsx
export default function SectionLabel({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-bone/85">
        <span aria-hidden>//</span>
        {children}
      </p>
      {title && (
        <h2 className="cap-trim font-display text-[clamp(3rem,7vw,6rem)] leading-[0.9] tracking-[-0.01em]">{title}</h2>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Make the display headings mixed case**

In each line below, delete the `uppercase` class and add `tracking-[-0.01em]`. Change nothing else on the line. Match by the text shown, not by line number, because Task 10 may have shifted lines.

| File | Element (current className) |
|---|---|
| `hero.tsx` | `<h1 className="cap-trim font-display text-[clamp(3.5rem,9vw,8.5rem)] uppercase leading-[0.9]">` |
| `approach.tsx` | `<h3 className="cap-trim font-display text-4xl uppercase">` |
| `engagement.tsx` | `<h3 className="cap-trim font-display text-5xl uppercase">` |
| `cases.tsx` | `<h3 className="cap-trim font-display text-4xl uppercase leading-[0.95]">` |
| `case-dialog.tsx` | `<h3 id={headingId} className="cap-trim font-display text-5xl uppercase md:text-6xl">` |
| `work.tsx` | `<h3 className="font-display text-3xl uppercase leading-none">` |
| `work.tsx` | `<h4 className="font-display text-4xl uppercase leading-none">` |

For example, the hero line becomes:

```tsx
<h1 className="cap-trim font-display text-[clamp(3.5rem,9vw,8.5rem)] leading-[0.9] tracking-[-0.01em]">{HERO.title}</h1>
```

Don't touch `footer.tsx`, `onboarding.tsx`, `nav.tsx` or any `font-mono` element.

- [ ] **Step 3: Widen the Approach art panels**

In `components/sections/approach.tsx`, change:

```tsx
<CardArt art={item.art} className="art-slot aspect-[4/3] w-full" />
```

to:

```tsx
<CardArt art={item.art} className="art-slot aspect-[2/1] w-full border border-bone/40" />
```

- [ ] **Step 4: Verify that `cap-trim` still trims correctly on mixed-case text**

Mixed case has ascenders and descenders that all-caps text lacks. Open `app/globals.css` and read the `.cap-trim` rule. In the browser, check that the headings aren't clipped (look at the descenders on "g", "y" and "p") and don't collide with the content below them. If they're clipped, adjust only the heading's `leading-[…]` on that line. Don't change `.cap-trim` itself. Report any change.

- [ ] **Step 5: Browser check**

Run `npm run dev -- -p 3121` and record its PID. At 1440×900 and 390×844 (Playwright MCP, for the resize reason given above), confirm:
- every section label reads `// Label`
- the hero, section, card, case, dialog and work headings are mixed case
- the onboarding name and footer wordmark are still uppercase
- the Approach art is 2:1 with a hairline border, and its models are still framed and not cropped
- nothing wraps badly at 390px
- with `prefers-reduced-motion: reduce` emulated, the art stays still
- with `HTMLCanvasElement.prototype.getContext = () => null` injected before load, the art slots show the halftone ground

Save screenshots to `.superpowers/sdd/screenshots/t13-*.png`. Kill only your PID.

- [ ] **Step 6: Run the gates**

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```

Expected: all pass, 13/13 tests.

- [ ] **Step 7: Commit**

```bash
git add components/sections/section-label.tsx components/sections/hero.tsx components/sections/approach.tsx components/sections/engagement.tsx components/sections/cases.tsx components/sections/case-dialog.tsx components/sections/work.tsx
git commit -m "feat: mixed-case gothic headings, // markers and wide art panels"
```
