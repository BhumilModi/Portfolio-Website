import { test } from "node:test";
import assert from "node:assert/strict";
import { ARGUS_FACTS, ARGUS_SLOTS, checkCoverage, partition, runArgus } from "./argus.ts";

test("partition puts every fact in exactly one slot", () => {
  for (const [n, k] of [[6, 3], [7, 3], [1, 4], [10, 1]] as const) {
    const slots = partition(n, k);
    assert.equal(slots.length, k);
    const all = slots.flat().sort((a, b) => a - b);
    assert.deepEqual(all, Array.from({ length: n }, (_, i) => i));
  }
});

test("checkCoverage reports missing and repeated facts", () => {
  assert.deepEqual(checkCoverage(4, [0, 1, 2, 3]), { missing: [], repeated: [] });
  assert.deepEqual(checkCoverage(4, [0, 1, 1, 2]), { missing: [3], repeated: [1] });
});

test("clean run passes every gate and ships once", () => {
  const steps = runArgus("clean");
  assert.deepEqual(steps.map((s) => s.stage), ["fact", "plan", "write", "verify", "ship"]);
  assert.ok(steps.every((s) => s.ok));
});

test("drift run fails verify, repairs once, then ships", () => {
  const steps = runArgus("drift");
  assert.deepEqual(steps.map((s) => s.stage), ["fact", "plan", "write", "verify", "repair", "verify", "ship"]);
  assert.equal(steps[3].ok, false);
  assert.equal(steps.filter((s) => s.stage === "repair").length, 1);
  assert.equal(steps.filter((s) => s.stage === "ship").length, 1);
  assert.equal(steps[steps.length - 2].stage, "verify");
  assert.equal(steps[steps.length - 2].ok, true, "ship must follow a passing verify");
});

test("demo data is the size the UI expects", () => {
  assert.equal(ARGUS_FACTS.length, 6);
  assert.equal(ARGUS_SLOTS.length, 3);
});
