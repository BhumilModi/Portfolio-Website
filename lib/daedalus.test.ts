import { test } from "node:test";
import assert from "node:assert/strict";
import { PLAN_EDGES, contentKey, createRenderCache } from "./daedalus.ts";

test("plan has both measured and assumed edges", () => {
  assert.ok(PLAN_EDGES.some((e) => e.measured));
  assert.ok(PLAN_EDGES.some((e) => !e.measured));
  assert.equal(new Set(PLAN_EDGES.map((e) => e.id)).size, PLAN_EDGES.length);
});

test("contentKey is deterministic 8-hex and sensitive to scan and mode", () => {
  const k = contentKey("scan-1", "model");
  assert.match(k, /^[0-9a-f]{8}$/);
  assert.equal(contentKey("scan-1", "model"), k);
  assert.notEqual(contentKey("scan-2", "model"), k);
  assert.notEqual(contentKey("scan-1", "geometry"), k);
});

test("cache: first render misses, repeat hits, rescan misses", () => {
  const cache = createRenderCache();
  assert.equal(cache.render("scan-1", "model").hit, false);
  assert.equal(cache.render("scan-1", "model").hit, true);
  assert.equal(cache.render("scan-2", "model").hit, false);
});
