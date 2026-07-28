"use client";

import { useCallback, useState } from "react";

import { CASE02, PRON, type PronKey } from "@/lib/content";
import { tierOpacity } from "@/lib/geometry";

import { motionScale, type ScheduledStep, useScheduler } from "./use-sim";

/** Design lines 813–815 — the notes shown before anything is picked. */
const DEFAULT_NOTES = CASE02.tiers.map((t) => t.defaultNote);

export type UsePron = {
  activeKey: PronKey | null;
  /** `cfg.word`, or `—` (design line 810). */
  word: string;
  /** `cfg.result` once settled, else `resolving…`, else `—` (line 811). */
  result: string;
  /** The three tier notes, or the defaults when nothing is selected. */
  notes: readonly string[];
  /** `t0..t2` — the tier card opacities. */
  opacity: (i: number) => number;
  resolve: (key: PronKey) => void;
};

/** Case 02's precedence chain (design lines 715–724, 810–815).
 *
 *  `pronStep` doubles as the progress marker and the settled flag: values
 *  below 10 are still walking down the tiers, and `cfg.tier + 10` means
 *  "settled on `cfg.tier`". Both `tierOpacity` and the result string key off
 *  that encoding, so it stays as-is rather than becoming a second boolean. */
export function usePron(): UsePron {
  const [pronKey, setPronKey] = useState<PronKey | null>(null);
  const [pronStep, setPronStep] = useState(-1);
  const { schedule } = useScheduler();

  const cfg = pronKey ? PRON[pronKey] : null;

  const resolve = useCallback(
    (key: PronKey) => {
      const k = motionScale();
      const next = PRON[key];
      setPronKey(key);
      setPronStep(0);
      const steps: ScheduledStep[] = [];
      for (let i = 1; i <= next.tier; i++) {
        steps.push([520 * k, () => setPronStep(i)]);
      }
      steps.push([420 * k, () => setPronStep(next.tier + 10)]);
      schedule(steps);
    },
    [schedule],
  );

  return {
    activeKey: pronKey,
    word: cfg ? cfg.word : CASE02.emptyText,
    result: cfg
      ? pronStep >= 10
        ? cfg.result
        : CASE02.resolvingText
      : CASE02.emptyText,
    notes: cfg ? cfg.notes : DEFAULT_NOTES,
    opacity: (i) => tierOpacity(i, cfg, pronStep),
    resolve,
  };
}
