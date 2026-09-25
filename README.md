# Bhumil Modi — portfolio

Personal portfolio of a Forward Deployed AI Engineer. A scroll-scrubbed 3D onboarding
(particles, a dithered classical bust, rays and a colonnade) hands off to an editorial
single page: engagement, approach, work, cases with live demos, record, FAQ.

## Stack

Next.js 16 (App Router), React 19, Tailwind CSS 4, three.js with @react-three/fiber and
@react-three/drei (one fixed canvas, every scene a drei `View`), Lenis for smooth scroll.

## Commands

```bash
npm run dev     # local dev server
npm test        # node --test over lib/**/*.test.ts
npm run lint
npm run build
```

`node scripts/fetch-models.mjs` rebuilds `public/models/*.glb` (dev-time only).

## Layout

- `lib/content.ts` — all copy
- `lib/` — pure logic (onboarding timeline, case demos) with tests
- `components/experience/` — canvas, shader, onboarding, card art
- `components/sections/` — page sections
- `github-profile/` — themed GitHub profile README

## Credits

3D models: [Poly Haven](https://polyhaven.com), CC0.
