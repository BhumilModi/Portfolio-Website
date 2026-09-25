import { test } from "node:test";
import assert from "node:assert/strict";
import { ditherMask } from "./dither.ts";

const fill = (v: number, n = 64) => new Uint8Array(n).fill(v);
const inked = (m: Uint8Array) => m.filter((a) => a === 255).length;

test("solid tones stay solid", () => {
  assert.equal(inked(ditherMask(fill(255), 8, 8, "light")), 64);
  assert.equal(inked(ditherMask(fill(255), 8, 8, "dark")), 0);
  assert.equal(inked(ditherMask(fill(0), 8, 8, "light")), 0);
  assert.equal(inked(ditherMask(fill(0), 8, 8, "dark")), 64);
});

test("mid grey inks half of an 8×8 cell", () => {
  assert.equal(inked(ditherMask(fill(128), 8, 8, "light")), 32);
});

test("levels clip the ground out", () => {
  assert.equal(inked(ditherMask(fill(100), 8, 8, "light", [100, 200])), 0);
  assert.equal(inked(ditherMask(fill(200), 8, 8, "light", [100, 200])), 64);
});

test("output is strictly 0 or 255", () => {
  const gray = Uint8Array.from({ length: 256 }, (_, i) => i);
  assert.ok(ditherMask(gray, 16, 16, "dark").every((a) => a === 0 || a === 255));
});
