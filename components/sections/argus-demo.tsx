"use client";
import { useEffect, useRef, useState } from "react";
import { ARGUS_FACTS, ARGUS_SLOTS, partition, runArgus, type ArgusStep } from "@/lib/argus";

const STAGES = ["fact", "plan", "write", "verify"] as const;
const SLOTS = partition(ARGUS_FACTS.length, ARGUS_SLOTS.length);

export default function ArgusDemo() {
  const [steps, setSteps] = useState<ArgusStep[]>([]);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function play(mode: "clean" | "drift") {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setSteps([]);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    runArgus(mode).forEach((s, i) => {
      timers.current.push(window.setTimeout(() => setSteps((prev) => [...prev, s]), reduce ? 0 : 450 * (i + 1)));
    });
  }

  const planned = steps.some((s) => s.stage === "plan");
  const shipped = steps.at(-1)?.stage === "ship";
  const caught = steps.some((s) => !s.ok);

  return (
    <div className="flex flex-col gap-5 border border-bone/30 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-bone/85">Run the pipeline · illustration — not client data</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => play("clean")} className="demo-btn">▶ clean</button>
          <button type="button" onClick={() => play("drift")} className="demo-btn">▶ drift</button>
        </div>
      </div>
      <ol className="grid grid-cols-4 gap-px bg-bone/25 font-mono text-xs uppercase tracking-[0.12em]">
        {STAGES.map((st) => {
          const last = steps.filter((s) => s.stage === st).at(-1);
          return (
            <li key={st} data-state={!last ? "idle" : last.ok ? "ok" : "fail"} className="stage-cell bg-void p-3 text-center">
              {st}
            </li>
          );
        })}
      </ol>
      <div className="grid gap-3 md:grid-cols-3">
        {ARGUS_SLOTS.map((name, si) => (
          <div key={name} className="flex flex-col gap-2 border border-bone/20 p-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-bone/85">{name}</p>
            <ul className="flex flex-col gap-1 text-sm">
              {SLOTS[si].map((f) => (
                <li key={f} data-in={planned} className="slot-fact">#{f + 1} {ARGUS_FACTS[f]}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <ol aria-live="polite" className="flex min-h-[8rem] flex-col gap-1 bg-void p-4 font-mono text-xs">
        {steps.length === 0 && <li className="text-bone/70">› idle — pick a run</li>}
        {steps.map((s, i) => (
          <li key={i} className={s.ok ? "text-bone" : "text-ember"}>
            {s.ok ? "›" : "✗"} {s.stage} — {s.log}
          </li>
        ))}
        {shipped && caught && <li className="text-bone">✓ the failing draft never shipped</li>}
      </ol>
    </div>
  );
}
