// Trial of Ryuma (spec §5): the aim trainer's rules. The canvas component only draws and handles input.
import { clamp01 } from "./timeline.ts";

export const ROUND_MS = 30_000;
export const LIFESPAN_START_MS = 1400;
export const LIFESPAN_END_MS = 700;
export const MIN_TARGET_PX = 48; // diameter floor for touch

/** How long a shade lives before it fades out; tightens linearly across the round. */
export function lifespanMs(elapsedMs: number): number {
  return LIFESPAN_START_MS + (LIFESPAN_END_MS - LIFESPAN_START_MS) * clamp01(elapsedMs / ROUND_MS);
}

/** Target radius for a w×h arena in CSS px: ~4.5% of the short side, never under the touch floor. */
export function targetRadius(w: number, h: number): number {
  return Math.max(MIN_TARGET_PX / 2, Math.min(w, h) * 0.045);
}

export type Point = { x: number; y: number };

/** A spawn point inside the arena, retried (up to 8×) until it is a quarter of the short side from the last one. */
export function spawn(rand: () => number, w: number, h: number, r: number, prev?: Point): Point {
  const pad = r + 8;
  const minGap = Math.min(w, h) * 0.25;
  let p: Point = { x: w / 2, y: h / 2 };
  for (let i = 0; i < 8; i++) {
    p = { x: pad + rand() * Math.max(0, w - 2 * pad), y: pad + rand() * Math.max(0, h - 2 * pad) };
    if (!prev || Math.hypot(p.x - prev.x, p.y - prev.y) >= minGap) break;
  }
  return p;
}

export const isHit = (p: Point, target: Point, r: number) => Math.hypot(p.x - target.x, p.y - target.y) <= r;

/** Points for one hit: 100, plus up to 100 for speed, times 1 + 0.1 per prior streak hit (capped at 2×). */
export function hitScore(reactionMs: number, lifespan: number, streak: number): number {
  const speed = Math.round(100 * (1 - clamp01(reactionMs / lifespan)));
  const multiplier = 1 + Math.min(streak, 10) * 0.1;
  return Math.round((100 + speed) * multiplier);
}

export type Tally = { score: number; hits: number; misses: number; reactionTotalMs: number };
export const EMPTY_TALLY: Tally = { score: 0, hits: 0, misses: 0, reactionTotalMs: 0 };

export function summarize(t: Tally): { score: number; hits: number; accuracy: number; reactionMs: number } {
  const shots = t.hits + t.misses;
  return {
    score: t.score,
    hits: t.hits,
    accuracy: shots ? t.hits / shots : 0,
    reactionMs: t.hits ? Math.round(t.reactionTotalMs / t.hits) : 0,
  };
}

export const verdict = (score: number, ryuma: number): "taken" | "held" => (score > ryuma ? "taken" : "held");
