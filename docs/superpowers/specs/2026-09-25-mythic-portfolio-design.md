# Mythic Portfolio — Design Spec

Date: 2026-09-25
Status: Design approved. Content drafted from resume — awaiting approval.

## 1. Goal

Throw out the current portfolio completely — no design, structure, metaphor or copy survives.
Replace it with two parts:

1. **Onboarding** — a heavy, scroll-scrubbed 3D cinematic in the Nous Research visual language
   (engraved classical art, halftone/scanline dither, radiating rays), Greek-mythic in theme.
2. **Sections** — a conventional scrolling page whose section anatomy mirrors
   hermes-agent.nousresearch.com one-to-one, re-skinned in our own palette.

References: hermes-agent.nousresearch.com, nousresearch.com, portal.nousresearch.com,
motionsites.ai (ancient-oath).

## 2. Deletion (no trace)

Delete entirely: `components/os/`, `components/windows/`, `components/cases/`, `hooks/*`,
`lib/content.ts`, `lib/windows.ts`, `lib/geometry.ts`, `lib/geometry.test.ts`,
`docs/superpowers/specs/2026-07-29-3d-boarding-design.md`,
`docs/superpowers/plans/2026-07-29-3d-boarding.md`, default `public/*.svg`,
and any `components/ui/*` file the new build does not import.
Keep: Next/Tailwind/TS/ESLint config, `components.json`, `lib/utils.ts`.

## 3. Visual system

| Token | Value | Use |
|---|---|---|
| `--void` | `#0b0907` | onboarding background, art panels |
| `--field` | `#9a2a14` | oxide-terracotta section field (Hermes' blue equivalent) |
| `--bone` | `#efe6d4` | text on field and void (6.2:1 on field — AA) |
| `--ash` | `#6b5f52` | meta, dividers, disabled |
| `--ember` | `#d0643b` | particles, hover, focus ring on void |

Reads as red-figure pottery inverted: black art panels, white engraving, on a terracotta field.

Type (Google Fonts via `next/font`):
- Display — **League Gothic**, uppercase, cap-trimmed (Hermes' condensed gothic equivalent).
- Serif — **Newsreader**, for FAQ questions and body lede.
- Mono — **JetBrains Mono**, for meta labels, numbering (`#1`), copy block, counter.

Final font choice may be adjusted during the `taste-skill` / `impeccable` pass; no Cinzel, no Inter.

**Engraving shader** (one shared `ShaderMaterial` on every mesh — a material, not a post-pass,
because drei `<View>` renders bypass a composer): lighting → screen-space line-hatching at 3
angles + solid highlights + faint horizontal scanlines, 2-tone (`--void` / `--bone`; particles `--ember`). A thin RGB tick bar on panel edges is a DOM
detail, not shader.

## 4. Content

Sources: the resume (`public/Bhumil-Modi-Resume-FDE.pdf`), plus Linear and git history in `~/TheAgentic/`
(researched 2026-09-25; evidence kept private, never on the site).

Rules:
- **Audience:** enterprise teams hiring Forward Deployed Engineers. Lead with agentic workflows —
  how agents are designed, guarded, evaluated, integrated and shipped inside a customer.
- **Light on detail.** Each case is a situation, a decision, one line of result. At most one
  number per case. No internal architecture walkthroughs.
- **No names.** No client, product or person names, Linear IDs, npm package names, or
  security specifics of client systems. Vendors only as stack.
- Facts only; every line traces to the resume, a Linear issue or a commit/spec. Only
  Bhumil's own work is credited. Nothing reused from the old site.
- Phone number is not written into site copy. The resume PDF (which includes it) is
  published as-is at `/Bhumil-Modi-Resume-FDE.pdf` — Bhumil approved.
- Interactive demos are labelled `illustration — not client data`.

### 4.1 Onboarding

- Counter: `ΒΜ · 000%` → `ΒΜ · 100%`
- Beat 2 whisper: `From the customer's first call —`
- Beat 3 name: **BHUMIL MODI** / `Forward Deployed AI Engineer`
- Beat 4 whisper: `— to agents in production.`
- Skip: `Enter ↵`

### 4.2 Nav

`BM` · Approach · Work · Cases · Record · FAQ · **Get in touch** (→ `mailto:`)

### 4.3 Hero

- Eyebrow: `Forward Deployed AI Engineer · Agentic systems`
- H1: **I deploy agentic systems inside the customer.**
- Lede: On the weekly call with your stakeholders, then building the agent pipelines,
  services and frontends myself — working POC in two weeks, live beta inside five months.
- Actions: `See the cases` · `Resume ↓`
- Copy block: `$ mail bhumilmodi2002@gmail.com` `[copy]`

### 4.4 The engagement (Hermes "desktop showcase" slot)

Label: `How an engagement runs`

| Phase | When | What happens |
|---|---|---|
| Embed | Kickoff | Weekly calls with the stakeholders and the product manager. Ambiguity becomes an agent design. |
| Prototype | Week 2 | A working proof of concept on the customer's real inputs. |
| Build | Month 2–2.5 | A functional application: the agent, its guardrails, the product around it. |
| Beta | Month 4–5 | Live with users the customer chooses. |

Stats row: `20+` client products · `10+` from empty repository to live beta · `10` domains ·
`6` products as project lead · `3,792` commits since Feb 2025.

### 4.5 Approach — #1–#6 (Hermes features grid)

| # | Label | Title | Body | Art |
|---|---|---|---|---|
| 1 | Embed | Start on the call | Requirements arrive ambiguous. I sit with the people who own the problem and turn it into an agent design. | `horse_head` |
| 2 | Design | Structure first, model second | Planners, tools and staged pipelines give the agent a shape. The model works inside it, not instead of it. | Oracle orb |
| 3 | Guard | Gates before output | Verification gates, bounded repair and fail-closed steps. A bad draft stops at the gate, not at the user. | Argus eye |
| 4 | Measure | Evals, not vibes | Deterministic checks plus model judges, run against fixed datasets, so a prompt change is measured rather than eyeballed. | `antique_ceramic_vase_01` |
| 5 | Integrate | Into their stack | Auth, tenancy, provider abstraction, rate limits and concurrency — what an agent needs to survive a real customer. | `lion_head` |
| 6 | Ship | Past the demo | Beta with real users, release pipelines, and an SDK so other teams can embed the agent. | `marble_bust_01` |

### 4.6 Agents in the field (Hermes platform-cards slot)

Intro: A selection of what I've deployed. Clients stay unnamed.

Card grid (mono label + one line each):
- **Clinical content agent** — turns protocol documents into patient-facing scripts, speech and video.
- **Listing-video planner** — plans, narrates and renders property videos from listing photos.
- **Kitchen vision pipeline** — reads photos of a room and draws plan, elevation and axonometric sheets.
- **Embeddable avatar assistant** — an AI video-avatar SDK other products drop into their app.
- **Sales-outreach agents** — campaigns, lead handling and automated appointment setting.
- **Meeting intelligence** — pre-call briefs and live-call analysis.
- **Grant discovery** — search, match and apply.
- **Biopharma agent fleet** — regulatory gap analysis ahead of a submission.

Plus TheAgentic's own platforms (nameable):
- **CortexON** — open-source generalised agent · ★ 450+ · frontend contributor
- **TheAgenticBench** — open-source digital-worker framework · ★ 50+ · frontend contributor
- **TheAgentic Console** — developer console for TheAgentic's AI infrastructure · built the entire UI

### 4.7 Cases I–IV (Hermes pricing columns → `<dialog>` detail)

Intro: Four decisions from client work.

**I · Argus** — `clinical · content agent` — *interactive*
- Title: **Coverage by construction**
- Situation: Generated content had to reach patients without a reviewer reading every word.
- Decision: A fact → plan → write → verify pipeline. The planner guarantees each fact is used
  exactly once; a deterministic gate checks coverage; the model only judges faithfulness.
- Result: Engineered to need no manual review.
- Demo: facts drop into slots → write → verify. `clean` ships; `drift` fails the gate, gets
  one bounded repair, then ships. The failing draft never ships.

**II · Ariadne** — `generative video · planning agent` — *cinematic*
- Title: **Same brief, same cut**
- Situation: A model-written video plan could invent assets and quietly drop scenes.
- Decision: A deterministic planner owns the plan; the model may only patch it, and invented
  references are rejected.
- Result: The same brief now produces the same video.

**III · Daedalus** — `vision · drawing pipeline` — *interactive*
- Title: **The pipeline I built, then retired**
- Situation: Turn photographs of a room into dimensioned drawing sheets.
- Decision: I built a measured geometry pipeline — then, when image-model rendering beat it,
  replaced it with a model call per view behind a content-addressed cache.
- Result: Keep what wins, even when you built the loser.
- Demo: SVG plan. Toggle measured (solid) vs assumed (dashed) edges; switch
  `geometry` ↔ `image model`; a repeat render of the same input is a cache hit.

**IV · Hermes** — `agent SDK · release` — *cinematic*
- Title: **An agent other teams can embed**
- Situation: An AI avatar assistant had to live inside other companies' products.
- Decision: A framework-free SDK core with a React-free transport, shipped through a gated
  CI pipeline with dev and stable channels.
- Result: v1.0 to public release.

### 4.8 Record (mono grid, Hermes footer-grid style)

| When | Where | Role | Line |
|---|---|---|---|
| May 2025 – now | TheAgentic | Forward Deployed AI Engineer | 20+ client products across ten domains; project lead on six. |
| Nov 2024 – May 2025 | TheAgentic | Software Engineer | Built the entire UI for TheAgentic Console; frontends across seven concurrent engagements. |
| Feb – Oct 2024 | ScaleGenAI | Senior Software Engineer | Sole owner of the flagship product's frontend architecture. |
| Oct 2023 – Jan 2024 | Tally Group | Software Engineer | Billing-simulation app for Australian utility clients. |
| Mar – Aug 2023 | SleevesUp | Software Engineer Intern | Full-stack on two products. |
| 2019 – 2023 | Vellore Institute of Technology | B.Tech CSE, AI & ML | GPA 9.08 / 10 |

Toolkit rows: **Agentic** workflow design · LLM orchestration · provider abstraction ·
verification & repair loops · evals — **Languages** Python · TypeScript · Go · SQL —
**Backend** FastAPI · Node.js — **Frontend** React · Next.js · Tailwind CSS —
**Platform** PostgreSQL · Redis · Docker · AWS · Auth0

### 4.9 FAQ

1. **What does a forward deployed engineer do?** — Sits with the customer. I'm on the weekly
   call with the stakeholders, then I build the agent and the product around it, from an
   empty repository to beta.
2. **Where does the model go in your designs?** — Inside a structure. Planners, gates and
   deterministic checks carry what must be exact; the model does the part only a model can.
3. **How do you know an agent works?** — Evals: deterministic checks plus model judges on
   fixed datasets, run whenever a prompt or model changes.
4. **How fast is a first version?** — A working POC within two weeks; a functional
   application by month 2–2.5; a beta with users you choose by month 4–5.
5. **Which domains?** — Ten, including clinical communications, insurance, generative media,
   CAD and manufacturing, sales, grants, equity research and biopharma.
6. **Can I see the client work?** — The cases describe decisions, not clients. Names stay out.
7. **Where are you based?** — Ankleshwar, Gujarat, India. Reach me at bhumilmodi2002@gmail.com.

### 4.10 Footer

- Wordmark: **BHUMIL MODI**
- Line: `Send word.`
- Links: bhumilmodi2002@gmail.com · LinkedIn (linkedin.com/in/bhumil-modi-430148190) ·
  GitHub (github.com/BhumilModi) · Resume (PDF)
- Meta: `Ankleshwar, Gujarat, India` · `© 2026`
- Site URL for metadata: bhumil-modi-portfolio.vercel.app

## 5. Part 1 — Onboarding (≈400vh, pinned, scroll-scrubbed)

One fixed R3F `<Canvas>`. Onboarding progress is read from the track's scroll position each frame and
drives both the 3D scene and the DOM text; Lenis smooths scroll. Section reveals use native CSS
`animation-timeline: view()`.
Beats (progress ranges are starting points, tuned visually):

| Beat | Progress | What happens |
|---|---|---|
| 0 Void | 0–0.10 | Black. ~30k ember particles drift. Mono counter `ΒΜ · 000%` shows real asset-load progress. |
| 1 Coalesce | 0.10–0.35 | Particles morph onto points sampled from the bust surface; engraving shading sweeps across. |
| 2 Radiance | 0.35–0.55 | Hundreds of line rays burst behind the head; camera orbits ~90°. |
| 3 Name | 0.55–0.75 | Name and role chiselled in (DOM text, mask reveal, synced to timeline). |
| 4 Descent | 0.75–1.00 | Camera pulls back through a procedural colonnade; `--field` floods in from edges; canvas framing shrinks into the hero art slot — the seam into Part 2. |

- **Skip**: `Enter ↵` control jumps to the hero.
- **Reduced motion**: no Lenis, no scrub; onboarding collapses to a single static engraved
  frame and the page starts at the hero.
- All onboarding text is real DOM (SSR'd, screen-reader readable).

## 6. Part 2 — Sections (Hermes anatomy → portfolio)

| Hermes section | Portfolio section | Content slot (§4) |
|---|---|---|
| Nav: brand · links · CTA | Nav: `BM` · section links · **Get in touch** | name |
| Hero: title, actions, curl block, art | Hero: headline, lede, 2 actions, copy block (`$ mail <email> [copy]`); live bust continues small with parallax | headline, lede, email |
| Desktop showcase (video) | **The engagement** — 4-phase timeline + stats row | §4.4 |
| Features #1–#6 grid with art | **Approach #1–#6** — numbered cards, each with engraved 3D art | §4.5 |
| Platform cards (mac/win/linux) | **Work: agents in the field** — platform-style card grid | §4.6 |
| Pricing: 4 tier columns | **Cases I–IV** — one column per case; opening shows detail in a native `<dialog>` | §4.7 |
| Footer mono link grid | **Record** — experience, education, toolkit as a mono grid | §4.8 |
| FAQ accordion | **FAQ** — native `<details>/<summary>` | §4.9 |
| Sticky reveal footer | Footer lifts to reveal giant name wordmark | §4.10 |

Section order: Nav · Hero · Engagement · Approach · Work · Cases · Record · FAQ · Footer.

**Interactive cases** (logic in `lib/`, visuals are DOM/SVG + CSS transitions, not 3D):
- **Argus** — facts drop into slots (each exactly once) → write → verify; a drifting draft
  fails the gate, gets one bounded repair, then ships. The failing draft never ships.
- **Daedalus** — SVG plan with measured (solid) / assumed (dashed) edges; `geometry stack` ↔
  `image model` switch; repeat render of the same input is a content-addressed cache hit.
- Ariadne and Hermes are cinematic (scroll-revealed, no interaction).

**Card art** — drei `<View>` scenes inside the single shared canvas (no extra WebGL contexts),
idle-rotating, rendered only while on screen. CC0 models from Poly Haven:
`marble_bust_01` (hero + Approach #6), `horse_head`, `lion_head`, `antique_ceramic_vase_01`;
plus procedural Oracle orb and Argus eye. Mapping is fixed in §4.5. Case columns use
mono numerals I–IV, not 3D.

## 7. Architecture

```
app/layout.tsx            fonts, metadata, Lenis bootstrap
app/page.tsx              server component, composes sections
app/globals.css           tokens (§3), base type
components/experience/
  stage.tsx               client; one fixed Canvas + View.Port (loaded via stage-loader, ssr:false)
  engraving-material.ts   shared engraving ShaderMaterial + GLSL
  onboarding.tsx          400vh DOM track, scroll → progress → scene + DOM text
  onboarding-scene.tsx    particles→bust morph, rays, colonnade, camera path
  card-art.tsx            <View> scenes for section cards
  models.tsx              useGLTF loaders + preload
components/sections/      nav, hero, cases,
                          engagement, approach, work, record, case-argus, case-daedalus, faq, footer
lib/content.ts            new copy (from §4)
lib/argus.ts (+test)      gate simulation — pure state machine
lib/daedalus.ts (+test)   plan edges + render-mode/cache state — pure
lib/timeline.ts (+test)   scroll progress → beat + local progress
lib/scene.ts              module-level mutable scene state written by the scroll reader, read in useFrame
public/models/*.glb       Poly Haven glTF → GLB (meshopt) via `npx @gltf-transform/cli`, dev-time only
```

Scene state is a plain mutable module object, not a state library: the scroll reader writes, `useFrame` reads.

**New dependencies:** `three`, `@react-three/fiber`, `@react-three/drei`, `lenis` (+ `@types/three`), pinned exact.
`gsap` and `postprocessing` were approved but are not needed (see §3, §5).

Next.js 16 has breaking changes: read the relevant guide in `node_modules/next/dist/docs/`
before writing code (client-only canvas loading, `next/font`, metadata).

## 8. Performance and fallbacks

- Budget: models ≤ 1.5 MB total (GLB + meshopt); 60 fps on an M1 laptop; ≥ 30 fps on a mid-range phone.
- Mobile (≤ 768px or low `hardwareConcurrency`): 12k particles, DPR ≤ 1.5, card art renders one frame then stops.
- Model load failure: error boundary; onboarding keeps particles only (sphere target), sections render without art.
- No WebGL: onboarding hidden, page starts at hero, card art panels show a CSS halftone pattern.
- Hero text, nav and every section are SSR'd and usable with the canvas absent.

## 9. Testing and verification

- `node --test` for `lib/argus.ts`, `lib/daedalus.ts`, `lib/timeline.ts`.
- `tsc`, `eslint`, `next build` clean.
- Visual check in the Orca browser at 1440×900 and 390×844: a screenshot per onboarding beat,
  each section, both interactive cases, reduced-motion mode.
- Lighthouse on the built site: accessibility ≥ 95; performance is recorded and reported, not gated.

## 10. GitHub profile README

Same theme, for the `BhumilModi/BhumilModi` profile repo. Built here in `github-profile/`; Bhumil
copies it over (no push from here).

- `README.md` plus self-contained SVGs in `github-profile/assets/`. GitHub strips CSS and JS from
  markdown, so the theme lives in the SVGs: `--void` panels, `--bone` engraving, `--field` accents,
  line-hatching patterns, radiating rays, a League Gothic wordmark embedded as a base64 subset
  (OFL, so it renders with no external font). Any animation is SVG-native CSS, and it stops
  under `prefers-reduced-motion`.
- Assets: `banner.svg` (wordmark + role + rays), `divider.svg`, `engagement.svg` (the four-phase
  timeline from §4.4).
- Copy is drawn from §4 and follows the same rules: agentic focus, facts only, no client names.
  Sections: headline + lede · How an engagement runs · Approach (6 one-liners) · Built at
  TheAgentic (CortexON, TheAgenticBench, Console) · Stack · Links (portfolio, LinkedIn, email, resume).
- Must read correctly in GitHub light and dark mode (the panels carry their own background).

## 11. Out of scope

Audio, CMS, blog, i18n, analytics, dark/light toggle (the site has one fixed theme).
