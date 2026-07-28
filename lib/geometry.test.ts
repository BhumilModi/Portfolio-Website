import test from "node:test";
import assert from "node:assert/strict";

import { clampTo, dockScale, tierOpacity } from "./geometry.ts";
import { LEFT, TOP, WINDOW_ORDER } from "./windows.ts";
import { PRON } from "./content.ts";

test("clampTo keeps windows out of the dock and below the menu bar", () => {
  const vw = 1440;
  const vh = 900;
  for (const id of WINDOW_ORDER) {
    // dragged hard up and to the left
    const tl = clampTo(-9999, -9999, id, vw, vh, LEFT);
    assert.equal(tl.x, LEFT, `${id}: x floor must be the dock edge`);
    assert.equal(tl.y, TOP, `${id}: y floor must be the menu-bar edge`);

    // dragged hard down and to the right
    const br = clampTo(9999, 9999, id, vw, vh, LEFT);
    assert.ok(br.x >= LEFT, `${id}: x=${br.x} must never cover the dock`);
    assert.ok(br.y >= TOP, `${id}: y=${br.y} must never go above the menu bar`);
  }
});

test("clampTo degrades sanely on a viewport narrower than the window", () => {
  // 'cases' wants 780px; at vw=400 the width clamp collapses it to vw - left - 12,
  // which pins the right bound to exactly `left`. Note the design's Math.max(8, …)
  // floor is defensive-only: because wd is itself clamped by `left`, the bound can
  // never drop below `left`. What matters is that it stays finite and on-screen.
  const p = clampTo(300, 300, "cases", 400, 700, LEFT);
  assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y), "no NaN");
  assert.ok(p.x >= 8, "never below the 8px floor");
  assert.equal(p.x, LEFT, "collapses onto the dock edge rather than going negative");
  assert.equal(p.y, 300, "y still inside the visible band");

  // and with the mobile dock band, same story at a smaller floor
  const m = clampTo(300, 300, "cases", 360, 640, 78);
  assert.ok(m.x >= 8 && Number.isFinite(m.x));
  assert.equal(m.x, 78);
});

test("dockScale ladder", () => {
  assert.equal(dockScale(2, 2), 1.35);
  assert.equal(dockScale(3, 2), 1.16);
  assert.equal(dockScale(4, 2), 1.06);
  assert.equal(dockScale(5, 2), 1);
  // nothing hovered -> hoverIndex -99 -> every slot at rest
  for (let i = 0; i < WINDOW_ORDER.length; i++) {
    assert.equal(dockScale(i, -99), 1, `index ${i} at rest`);
  }
});

test("tierOpacity settles on the resolved tier and dims the ones it skipped", () => {
  const cortexon = PRON.cortexon; // tier 2
  assert.equal(cortexon.tier, 2);

  // settled: pronStep = tier + 10
  assert.equal(tierOpacity(2, cortexon, 12), 1);
  assert.equal(tierOpacity(0, cortexon, 12), 0.3);
  assert.equal(tierOpacity(1, cortexon, 12), 0.3);

  // mid-flight at step 1
  assert.equal(tierOpacity(1, cortexon, 1), 0.85);
  assert.equal(tierOpacity(2, cortexon, 1), 0.2);

  // nothing resolved yet
  assert.equal(tierOpacity(0, null, -1), 0.35);
});
