import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ASCENT_S, DESCENT_BEATS, DESCENT_S, STYX_CAMERA, STYX_Y,
  cameraAt, coldness, isDone, obolPose, styxOpacity, timelineAt,
} from "./descent.ts";

const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≉ ${b}`);

test("beats are contiguous and cover the whole descent", () => {
  assert.equal(DESCENT_BEATS[0].start, 0);
  assert.equal(DESCENT_BEATS[DESCENT_BEATS.length - 1].end, DESCENT_S);
  for (let i = 1; i < DESCENT_BEATS.length; i++) assert.equal(DESCENT_BEATS[i].start, DESCENT_BEATS[i - 1].end);
});

test("coldness goes 0 → 1 and never warms back up", () => {
  assert.equal(coldness(0), 0);
  assert.equal(coldness(DESCENT_S), 1);
  let last = -1;
  for (let t = 0; t <= DESCENT_S; t += 0.05) {
    assert.ok(coldness(t) >= last);
    last = coldness(t);
  }
});

test("the camera starts on Olympus, ends on the Styx pose, and only ever falls", () => {
  const start = cameraAt(0);
  assert.deepEqual(start.pos, [0, 1.5, 7]);
  const end = cameraAt(DESCENT_S);
  near(end.pos[1], STYX_Y + STYX_CAMERA.position[1]);
  near(end.pos[2], STYX_CAMERA.position[2]);
  near(end.pitch, STYX_CAMERA.pitch);
  let lastY = Infinity;
  for (let t = 0; t <= DESCENT_S; t += 0.02) {
    const y = cameraAt(t).pos[1];
    assert.ok(y <= lastY + 1e-9, `rose at t=${t}`);
    lastY = y;
  }
});

test("descent runs forward, ascent runs the same timeline backwards", () => {
  assert.equal(timelineAt(0, "down"), 0);
  assert.equal(timelineAt(99, "down"), DESCENT_S);
  assert.equal(timelineAt(0, "up"), DESCENT_S);
  near(timelineAt(ASCENT_S, "up"), 0);
  assert.equal(timelineAt(1, "down", 2), 2);
});

test("isDone honours direction and speed", () => {
  assert.equal(isDone(DESCENT_S - 0.01, "down"), false);
  assert.equal(isDone(DESCENT_S, "down"), true);
  assert.equal(isDone(DESCENT_S / 2, "down", 2), true);
  assert.equal(isDone(2.9, "up"), false);
  assert.equal(isDone(3, "up"), true);
});

test("the obol is gone before Olympus and the Styx is fully up at the end", () => {
  assert.equal(obolPose(0).opacity, 1);
  assert.equal(obolPose(0.6).opacity, 0);
  assert.equal(styxOpacity(DESCENT_S), 1);
  assert.equal(styxOpacity(0), 0);
});
