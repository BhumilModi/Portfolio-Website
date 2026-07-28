"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  SIM_IDLE_LOG,
  SIM_IDLE_STATUS,
  SIM_RUNNING_STATUS,
  SIM_SCRIPTS,
} from "@/lib/content";

/** `[delay, fn]`, where `delay` is time since the *previous* step — the
 *  scheduler accumulates them, exactly like the design's `_seq`. */
export type ScheduledStep = readonly [number, () => void];

/** Named-channel timeout scheduler, ported from design lines 644–651.
 *
 *  Two behaviours the design depends on:
 *  1. delays accumulate, so a step's number is time since the run started;
 *  2. `schedule` clears the channel first, so re-clicking a run button
 *     mid-flight cancels the old run instead of interleaving two.
 *
 *  One instance is one channel; `useSim` and `usePron` each hold their own,
 *  which is what the design's `'sim'` / `'pron'` channel names bought.
 *  Lives here rather than in its own module because Phase B3 owns exactly
 *  five files; `usePron` imports it from this one. */
export function useScheduler() {
  const ids = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = useCallback(() => {
    ids.current.forEach(clearTimeout);
    ids.current = [];
  }, []);

  const schedule = useCallback(
    (steps: readonly ScheduledStep[]) => {
      clear();
      let acc = 0;
      for (const [delay, fn] of steps) {
        acc += delay;
        ids.current.push(setTimeout(fn, acc));
      }
    },
    [clear],
  );

  // design line 641 — pending timeouts never outlive the component
  useEffect(() => clear, [clear]);

  return { schedule, clear };
}

/** Design lines 689–690 / 716–717. Read at run time, not at mount, so a
 *  mid-session preference change is respected. */
export function motionScale(): number {
  if (typeof window === "undefined") return 1;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? 0.2
    : 1;
}

export type SimKind = keyof typeof SIM_SCRIPTS;

export type UseSim = {
  /** -1 before the first stage lands; 0–3 once running. */
  stage: number;
  status: string;
  /** Falls back to the idle line when nothing has run (design line 798). */
  log: readonly string[];
  /** `stage >= i` (design lines 799–803). */
  stageActive: (i: number) => boolean;
  /** The `#F2C230` fill layer's opacity: `s0..s3`. */
  stageOpacity: (i: number) => number;
  /** The content colour flip: `c0..c3`. */
  stageColor: (i: number) => string;
  run: (kind: SimKind) => void;
  reset: () => void;
};

/** Case 01's orchestrator run (design lines 688–713, 804–806). */
export function useSim(): UseSim {
  const [stage, setStage] = useState(-1);
  const [status, setStatus] = useState<string>(SIM_IDLE_STATUS);
  const [log, setLog] = useState<readonly string[]>([]);
  const { schedule, clear } = useScheduler();

  const run = useCallback(
    (kind: SimKind) => {
      const k = motionScale();
      setStage(-1);
      setStatus(SIM_RUNNING_STATUS);
      setLog([]);
      schedule(
        SIM_SCRIPTS[kind].map((step): ScheduledStep => {
          const { stage, log: lines, status } = step;
          return [
            step.delay * k,
            () => {
              if (stage !== undefined) setStage(stage);
              // append-only: the log grows, it is never replaced
              if (lines) setLog((prev) => [...prev, ...lines]);
              if (status) setStatus(status);
            },
          ];
        }),
      );
    },
    [schedule],
  );

  const reset = useCallback(() => {
    clear();
    setStage(-1);
    setStatus(SIM_IDLE_STATUS);
    setLog([]);
  }, [clear]);

  const stageActive = useCallback((i: number) => stage >= i, [stage]);

  return {
    stage,
    status,
    log: log.length ? log : SIM_IDLE_LOG,
    stageActive,
    stageOpacity: (i) => (stage >= i ? 1 : 0),
    stageColor: (i) => (stage >= i ? "#16130F" : "#EEEFE9"),
    run,
    reset,
  };
}
