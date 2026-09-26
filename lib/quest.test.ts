import { test } from "node:test";
import assert from "node:assert/strict";
import { INITIAL, createQuest, paid, parse, type KeyValue } from "./quest.ts";

const memory = (): KeyValue => {
  const data = new Map<string, string>();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
};

test("picking is idempotent, keeps canonical order, and 3/3 pays the fare", () => {
  const q = createQuest(memory());
  q.pick("record");
  q.pick("record");
  assert.deepEqual(q.get().obols, ["record"]);
  assert.equal(paid(q.get()), false);
  q.pick("footer");
  q.pick("approach");
  assert.deepEqual(q.get().obols, ["approach", "record", "footer"]);
  assert.equal(paid(q.get()), true);
});

test("progress survives a reload through storage", () => {
  const s = memory();
  const a = createQuest(s);
  a.pick("approach");
  a.cross();
  a.setSound(true);
  assert.deepEqual(createQuest(s).get(), { ...INITIAL, obols: ["approach"], crossed: true, sound: true });
});

test("record keeps the higher score and marks the trial tried", () => {
  const q = createQuest(memory());
  assert.equal(q.record({ score: 3000, hits: 20, accuracy: 0.8, reactionMs: 420 }), true);
  assert.equal(q.record({ score: 2000, hits: 15, accuracy: 0.7, reactionMs: 500 }), false);
  assert.equal(q.get().best?.score, 3000);
  assert.equal(q.get().tried, true);
});

test("skipTrial unlocks the card without a best", () => {
  const q = createQuest(memory());
  q.skipTrial();
  assert.equal(q.get().tried, true);
  assert.equal(q.get().best, null);
});

test("throwing storage falls back to memory", () => {
  const broken: KeyValue = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("quota"); },
  };
  const q = createQuest(broken);
  q.pick("footer");
  assert.deepEqual(q.get().obols, ["footer"]);
});

test("parse rejects junk, unknown obols and malformed bests", () => {
  assert.deepEqual(parse(null), INITIAL);
  assert.deepEqual(parse("not json"), INITIAL);
  const s = parse(JSON.stringify({ obols: ["footer", "hades"], best: { score: "x" }, crossed: "yes" }));
  assert.deepEqual(s.obols, ["footer"]);
  assert.equal(s.best, null);
  assert.equal(s.crossed, false);
});

test("subscribers hear each change and can unsubscribe", () => {
  const q = createQuest(null);
  let calls = 0;
  const off = q.subscribe(() => calls++);
  q.pick("approach");
  q.pick("approach"); // no-op, no notify
  off();
  q.pick("record");
  assert.equal(calls, 1);
});

test("arise is once only, notifies once and survives a reload", () => {
  const s = memory();
  const q = createQuest(s);
  let calls = 0;
  q.subscribe(() => calls++);
  assert.equal(q.get().arisen, false);
  q.arise();
  q.arise();
  assert.equal(q.get().arisen, true);
  assert.equal(calls, 1);
  assert.equal(createQuest(s).get().arisen, true);
});

test("arise still works in memory when storage throws", () => {
  const broken: KeyValue = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("quota"); },
  };
  const q = createQuest(broken);
  q.arise();
  assert.equal(q.get().arisen, true);
});

test("parse only accepts a literal true for arisen", () => {
  assert.equal(INITIAL.arisen, false);
  assert.equal(parse(JSON.stringify({ arisen: "yes" })).arisen, false);
  assert.equal(parse(JSON.stringify({ arisen: 1 })).arisen, false);
  assert.equal(parse(JSON.stringify({ arisen: true })).arisen, true);
  assert.equal(parse(JSON.stringify({ obols: ["footer"] })).arisen, false); // a v1 save from before ARISE
});
