import { test } from "node:test";
import assert from "node:assert/strict";
import { EMPTY_TALLY, ROUND_MS, hitScore, isHit, lifespanMs, spawn, summarize, targetRadius, verdict } from "./arena.ts";

test("lifespan tightens from 1400ms to 700ms across the round and clamps", () => {
  assert.equal(lifespanMs(0), 1400);
  assert.equal(lifespanMs(ROUND_MS / 2), 1050);
  assert.equal(lifespanMs(ROUND_MS), 700);
  assert.equal(lifespanMs(-500), 1400);
  assert.equal(lifespanMs(ROUND_MS * 2), 700);
});

test("targets never shrink under the 48px touch floor", () => {
  assert.ok(targetRadius(320, 427) * 2 >= 48);
  assert.equal(targetRadius(2000, 1000), 45);
});

test("spawns stay inside the arena", () => {
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const [w, h] = [800, 500];
  const r = targetRadius(w, h);
  let prev;
  for (let i = 0; i < 500; i++) {
    const p = spawn(rand, w, h, r, prev);
    assert.ok(p.x >= r && p.x <= w - r && p.y >= r && p.y <= h - r, `out of bounds: ${p.x},${p.y}`);
    prev = p;
  }
});

test("spawn retries until the next target is a real flick away", () => {
  const seq = [0.5, 0.5, 0.5, 0.5, 0.95, 0.95];
  let i = 0;
  const rand = () => seq[i++];
  const [w, h] = [800, 500];
  const prev = { x: 400, y: 250 };
  const p = spawn(rand, w, h, targetRadius(w, h), prev);
  assert.ok(Math.hypot(p.x - prev.x, p.y - prev.y) >= Math.min(w, h) * 0.25);
  assert.equal(i, 6, "took the third candidate");
});

test("isHit is inclusive at the rim", () => {
  assert.equal(isHit({ x: 10, y: 0 }, { x: 0, y: 0 }, 10), true);
  assert.equal(isHit({ x: 10.01, y: 0 }, { x: 0, y: 0 }, 10), false);
});

test("hit score: base 100, up to +100 for speed, streak multiplier capped at 2x", () => {
  assert.equal(hitScore(0, 1000, 0), 200);
  assert.equal(hitScore(500, 1000, 0), 150);
  assert.equal(hitScore(1000, 1000, 0), 100);
  assert.equal(hitScore(0, 1000, 10), 400);
  assert.equal(hitScore(0, 1000, 50), 400);
});

test("summarize: accuracy counts timeouts and empty clicks as misses", () => {
  assert.deepEqual(summarize({ score: 900, hits: 3, misses: 1, reactionTotalMs: 1200 }), { score: 900, hits: 3, accuracy: 0.75, reactionMs: 400 });
  assert.deepEqual(summarize(EMPTY_TALLY), { score: 0, hits: 0, accuracy: 0, reactionMs: 0 });
});

test("a tie does not take the arena", () => {
  assert.equal(verdict(5300, 5300), "held");
  assert.equal(verdict(5301, 5300), "taken");
});
