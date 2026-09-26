import { test } from "node:test";
import assert from "node:assert/strict";
import { rankFor } from "./rank.ts";

test("S only when the score beats Ryuma outright; a tie is A", () => {
  assert.equal(rankFor(5301, 5300), "S");
  assert.equal(rankFor(5300, 5300), "A");
});

test("every band at and just under its lower boundary (ryuma = 5000)", () => {
  const cases: [number, string][] = [
    [5000, "A"], [4000, "A"], [3999, "B"], [3000, "B"], [2999, "C"],
    [2000, "C"], [1999, "D"], [1000, "D"], [999, "E"], [0, "E"],
  ];
  for (const [score, rank] of cases) assert.equal(rankFor(score, 5000), rank, `score ${score}`);
});

test("boundaries hold for a best that is not a round number (ryuma = 5300)", () => {
  const cases: [number, string][] = [
    [4240, "A"], [4239, "B"], [3180, "B"], [3179, "C"],
    [2120, "C"], [2119, "D"], [1060, "D"], [1059, "E"],
  ];
  for (const [score, rank] of cases) assert.equal(rankFor(score, 5300), rank, `score ${score}`);
});

test("with no best to compare against, any score beats it and zero is E", () => {
  assert.equal(rankFor(1, 0), "S");
  assert.equal(rankFor(0, 0), "E");
});
