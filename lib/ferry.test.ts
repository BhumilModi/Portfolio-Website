import { test } from "node:test";
import assert from "node:assert/strict";
import { riverCamera } from "./descent.ts";
import { FERRY_BEATS, FERRY_CUT, REST_CAMERA, REST_CAMERA_PORTRAIT, cardOpacity, ferryLocal, ferryPose, signalLoss, whisperOpacity } from "./ferry.ts";

const PORTRAIT = 390 / 844;
const LANDSCAPE = 1440 / 900;
const ASPECTS = [LANDSCAPE, PORTRAIT];

test("beats are contiguous and cover the track", () => {
  assert.deepEqual(FERRY_BEATS.map((b) => b.id), ["card", "reveal", "ride", "approach", "through"]);
  assert.equal(FERRY_BEATS[0].start, 0);
  assert.equal(FERRY_BEATS.at(-1)!.end, 1);
  for (let i = 1; i < FERRY_BEATS.length; i++) assert.equal(FERRY_BEATS[i].start, FERRY_BEATS[i - 1].end);
  assert.equal(ferryLocal(0.15, "card"), 1);
  assert.equal(ferryLocal(0.15, "reveal"), 0);
});

test("the track opens on the descent's landing pose and holds it through the card and the reveal", () => {
  for (const a of ASPECTS) {
    assert.deepEqual(ferryPose(0, a), riverCamera(a));
    assert.deepEqual(ferryPose(0.2, a), riverCamera(a));
    assert.deepEqual(ferryPose(0.3, a), riverCamera(a));
  }
});

test("the camera never jumps, except at the cut under signal loss", () => {
  for (const a of ASPECTS) {
    for (let p = 0; p < 1; p += 0.001) {
      if (p >= FERRY_CUT - 0.001 && p < FERRY_CUT + 0.001) continue;
      const u = ferryPose(p, a).position;
      const v = ferryPose(p + 0.001, a).position;
      assert.ok(Math.hypot(u[0] - v[0], u[1] - v[1], u[2] - v[2]) < 0.5, `jump at p=${p.toFixed(3)}`);
    }
  }
});

test("after the cut the camera rests", () => {
  assert.deepEqual(ferryPose(FERRY_CUT, LANDSCAPE), REST_CAMERA);
  assert.deepEqual(ferryPose(1, LANDSCAPE), REST_CAMERA);
  assert.deepEqual(ferryPose(1.4, LANDSCAPE), REST_CAMERA);
  assert.deepEqual(ferryPose(FERRY_CUT, PORTRAIT), REST_CAMERA_PORTRAIT);
  assert.deepEqual(ferryPose(1, PORTRAIT), REST_CAMERA_PORTRAIT);
});

test("the title card holds, then dissolves through the reveal", () => {
  assert.equal(cardOpacity(0), 1);
  assert.equal(cardOpacity(0.15), 1);
  assert.equal(cardOpacity(0.3), 0);
  assert.equal(cardOpacity(1), 0);
});

test("signal loss peaks at the cut and is gone once the track ends", () => {
  assert.equal(signalLoss(0), 0);
  assert.equal(signalLoss(0.89), 0);
  assert.equal(signalLoss(FERRY_CUT), 1);
  assert.equal(signalLoss(1), 0);
  assert.equal(signalLoss(1.5), 0);
});

test("whispers live inside the ride, peak in their slot, and never overlap", () => {
  const n = 3;
  for (let i = 0; i < n; i++) {
    assert.equal(whisperOpacity(0.29, i, n), 0);
    assert.equal(whisperOpacity(0.71, i, n), 0);
    const mid = 0.3 + (0.4 * (i + 0.5)) / n;
    assert.equal(whisperOpacity(mid, i, n), 1);
  }
  for (let p = 0; p <= 1; p += 0.005) {
    const lit = [0, 1, 2].filter((i) => whisperOpacity(p, i, n) > 0.5);
    assert.ok(lit.length <= 1, `two whispers at p=${p.toFixed(3)}`);
  }
});
