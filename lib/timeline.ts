// Onboarding beats. Progress ranges are starting points, tuned visually in Task 6.
export const BEATS = [
  { id: "void", start: 0, end: 0.1 },
  { id: "coalesce", start: 0.1, end: 0.35 },
  { id: "radiance", start: 0.35, end: 0.55 },
  { id: "name", start: 0.55, end: 0.75 },
  { id: "descent", start: 0.75, end: 1 },
] as const;

export type BeatId = (typeof BEATS)[number]["id"];

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export function local(p: number, id: BeatId): number {
  const beat = BEATS.find((b) => b.id === id)!;
  return clamp01((p - beat.start) / (beat.end - beat.start));
}

export function beatAt(p: number): { id: BeatId; local: number } {
  const q = clamp01(p);
  const beat = BEATS.find((b) => q < b.end) ?? BEATS[BEATS.length - 1];
  return { id: beat.id, local: local(q, beat.id) };
}

export function smoothstep(a: number, b: number, x: number): number {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);

export function easeInOutCubic(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/** 0 → 1 over the first `edge` of t, hold at 1, then 1 → 0 over the last `edge`. */
export const fadeInOut = (t: number, edge = 0.25) => clamp01(Math.min(t, 1 - t) / edge);
