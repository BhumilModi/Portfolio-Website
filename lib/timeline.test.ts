import { test } from "node:test";
import assert from "node:assert/strict";
import { BEATS, beatAt, clamp01, easeInOutCubic, easeOutCubic, fadeInOut, local, smoothstep } from "./timeline.ts";

const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≉ ${b}`);

test("beats tile 0..1 with no gaps", () => {
  assert.equal(BEATS[0].start, 0);
  assert.equal(BEATS[BEATS.length - 1].end, 1);
  for (let i = 1; i < BEATS.length; i++) assert.equal(BEATS[i].start, BEATS[i - 1].end);
});

test("beatAt maps progress to a beat and its local progress", () => {
  assert.deepEqual(beatAt(0), { id: "void", local: 0 });
  assert.deepEqual(beatAt(0.1), { id: "coalesce", local: 0 });
  const mid = beatAt(0.45);
  assert.equal(mid.id, "radiance");
  near(mid.local, 0.5);
  assert.deepEqual(beatAt(1), { id: "descent", local: 1 });
  assert.deepEqual(beatAt(-3), { id: "void", local: 0 });
  assert.deepEqual(beatAt(9), { id: "descent", local: 1 });
});

test("local clamps outside its beat", () => {
  assert.equal(local(0, "descent"), 0);
  assert.equal(local(1, "void"), 1);
  near(local(0.225, "coalesce"), 0.5);
});

test("easing helpers hit their endpoints", () => {
  assert.equal(clamp01(-1), 0);
  assert.equal(clamp01(2), 1);
  assert.equal(smoothstep(0, 1, 0.5), 0.5);
  assert.equal(smoothstep(0.2, 0.4, 0.1), 0);
  assert.equal(smoothstep(0.2, 0.4, 0.9), 1);
  assert.equal(easeOutCubic(0), 0);
  assert.equal(easeOutCubic(1), 1);
  assert.equal(easeInOutCubic(0), 0);
  assert.equal(easeInOutCubic(0.5), 0.5);
  assert.equal(easeInOutCubic(1), 1);
});

test("fadeInOut ramps up, holds, ramps down", () => {
  assert.equal(fadeInOut(0), 0);
  near(fadeInOut(0.125), 0.5);
  assert.equal(fadeInOut(0.5), 1);
  assert.equal(fadeInOut(1), 0);
});
