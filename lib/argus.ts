// Case I demo — illustration, not client data.
export const ARGUS_FACTS = [
  "Nothing to eat after midnight",
  "Bring your medication list",
  "Arrive 30 minutes early",
  "No driving for 24 hours",
  "Call if your fever passes 38 °C",
  "Resume your usual diet next morning",
] as const;

export const ARGUS_SLOTS = ["Day before", "Morning of", "After"] as const;

export type ArgusStage = "fact" | "plan" | "write" | "verify" | "repair" | "ship";
export type ArgusStep = { stage: ArgusStage; log: string; ok: boolean };

/** Round-robin: each fact index lands in exactly one slot. */
export function partition(factCount: number, slotCount: number): number[][] {
  const slots = Array.from({ length: slotCount }, () => [] as number[]);
  for (let i = 0; i < factCount; i++) slots[i % slotCount].push(i);
  return slots;
}

export function checkCoverage(factCount: number, draft: readonly number[]) {
  const seen = new Map<number, number>();
  for (const f of draft) seen.set(f, (seen.get(f) ?? 0) + 1);
  const missing: number[] = [];
  const repeated: number[] = [];
  for (let i = 0; i < factCount; i++) {
    const n = seen.get(i) ?? 0;
    if (n === 0) missing.push(i);
    if (n > 1) repeated.push(i);
  }
  return { missing, repeated };
}

const ids = (xs: number[]) => xs.map((i) => `#${i + 1}`).join(", ");

export function runArgus(mode: "clean" | "drift"): ArgusStep[] {
  const n = ARGUS_FACTS.length;
  const slots = partition(n, ARGUS_SLOTS.length);
  const planned = slots.flat();
  // drift: the writer drops one fact and repeats another
  const draft = mode === "clean" ? planned : [...planned.filter((f) => f !== 3), 1];

  const steps: ArgusStep[] = [
    { stage: "fact", log: `${n} facts extracted`, ok: true },
    { stage: "plan", log: `${n} facts → ${slots.length} slots, each used once`, ok: true },
    { stage: "write", log: `${draft.length} lines drafted`, ok: true },
  ];

  const first = checkCoverage(n, draft);
  if (first.missing.length || first.repeated.length) {
    steps.push({ stage: "verify", log: `coverage failed — missing ${ids(first.missing)}, repeated ${ids(first.repeated)}`, ok: false });
    steps.push({ stage: "repair", log: "one bounded repair against the plan", ok: true });
  }

  const final = checkCoverage(n, planned);
  steps.push({ stage: "verify", log: "coverage passed — every fact exactly once", ok: !final.missing.length && !final.repeated.length });
  steps.push({ stage: "ship", log: "shipped", ok: true });
  return steps;
}
