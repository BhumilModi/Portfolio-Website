import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ASCENT_S, DESCENT_BEATS, DESCENT_S, GATE_CUT, PORTAL_Y, RIVER_CAMERA, RIVER_CAMERA_PORTRAIT, RIVER_Y,
  cameraAt, coldness, flashOpacity, isDone, noticeShown, obolPose, portalOpacity, riverCamera, sanzuOpacity, shaftOpacity, timelineAt,
} from "./descent.ts";

const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≉ ${b}`);
const PORTRAIT = 390 / 844;
const LANDSCAPE = 1440 / 900;

test("beats are contiguous, cover the whole descent, and match the redesign's timing", () => {
  assert.deepEqual(DESCENT_BEATS.map((b) => b.id), ["fare", "olympus", "fall", "abyss", "gate", "sanzu"]);
  assert.equal(DESCENT_BEATS[0].start, 0);
  assert.equal(DESCENT_BEATS[DESCENT_BEATS.length - 1].end, DESCENT_S);
  for (let i = 1; i < DESCENT_BEATS.length; i++) assert.equal(DESCENT_BEATS[i].start, DESCENT_BEATS[i - 1].end);
  const at = Object.fromEntries(DESCENT_BEATS.map((b) => [b.id, [b.start, b.end]]));
  assert.deepEqual(at.fall, [1.8, 3.0]);
  assert.deepEqual(at.abyss, [3.0, 4.2]);
  assert.deepEqual(at.gate, [4.2, 4.45]);
  assert.deepEqual(at.sanzu, [4.45, 5.5]);
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

test("riverCamera picks the portrait pose on tall screens", () => {
  assert.equal(riverCamera(LANDSCAPE), RIVER_CAMERA);
  assert.equal(riverCamera(PORTRAIT), RIVER_CAMERA_PORTRAIT);
});

test("the camera starts on Olympus, passes the portal at the cut, lands on the river pose, and only ever falls", () => {
  for (const aspect of [LANDSCAPE, PORTRAIT]) {
    assert.deepEqual(cameraAt(0, aspect).pos, [0, 1.5, 7]);
    near(cameraAt(GATE_CUT, aspect).pos[1], PORTAL_Y);
    const pose = riverCamera(aspect);
    const end = cameraAt(DESCENT_S, aspect);
    near(end.pos[0], pose.position[0]);
    near(end.pos[1], RIVER_Y + pose.position[1]);
    near(end.pos[2], pose.position[2]);
    near(end.pitch, pose.pitch);
    let lastY = Infinity;
    for (let t = 0; t <= DESCENT_S; t += 0.01) {
      const y = cameraAt(t, aspect).pos[1];
      assert.ok(y <= lastY + 1e-9, `rose at t=${t} (aspect ${aspect})`);
      lastY = y;
    }
  }
});

test("the flash peaks at the cut and the two render styles are never on screen together", () => {
  near(flashOpacity(GATE_CUT), 1);
  assert.equal(flashOpacity(4.2), 0);
  assert.equal(flashOpacity(4.45), 0);
  assert.equal(sanzuOpacity(GATE_CUT - 1e-6), 0);
  assert.equal(sanzuOpacity(GATE_CUT), 1);
  for (let t = 0; t <= DESCENT_S; t += 0.005) {
    assert.ok(shaftOpacity(t) === 0 || sanzuOpacity(t) === 0, `shaft and Sanzu blended at t=${t}`);
    assert.ok(portalOpacity(t) === 0 || sanzuOpacity(t) === 0, `approach disc and Sanzu blended at t=${t}`);
  }
  assert.ok(portalOpacity(3.6) > 0.9);
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

test("the obol is gone before Olympus, the Sanzu is up at the end, and the notice opens during the glide", () => {
  assert.equal(obolPose(0).opacity, 1);
  assert.equal(obolPose(0.6).opacity, 0);
  assert.equal(sanzuOpacity(DESCENT_S), 1);
  assert.equal(sanzuOpacity(0), 0);
  assert.equal(noticeShown(4.45), false);
  assert.equal(noticeShown(DESCENT_S), true);
});
