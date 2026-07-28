"use client";

import { type JSX } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useSim } from "@/hooks/use-sim";
import { CASE01 } from "@/lib/content";

/** Case 01 — the runnable orchestrator (design lines 218–294).
 *
 *  Owns its own scroll region, like the other three cases: this is the one
 *  that inverts to the ink ground (`#16130F` on `#EEEFE9`). */
export function Case01(): JSX.Element {
  const { status, log, stageOpacity, stageColor, run, reset } = useSim();

  return (
    <ScrollArea className="min-h-0 flex-1 bg-ink text-window [&>[data-slot=scroll-area-viewport]>div]:block!">
      <div className="p-[22px]">
        <h2 className="m-0 max-w-[30ch] text-[clamp(1.3rem,2.1vw,1.8rem)] leading-[1.1] font-bold tracking-[-0.03em]">
          {CASE01.h2}
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
          <div>
            <div className="mb-[7px] font-mono text-[10.5px] tracking-[0.14em] uppercase opacity-50">
              {CASE01.situationLabel}
            </div>
            <p className="m-0 text-[0.95rem] leading-[1.6] opacity-90">
              {CASE01.situation}
            </p>
          </div>
          <div>
            <div className="mb-[7px] font-mono text-[10.5px] tracking-[0.14em] uppercase opacity-50">
              {CASE01.constraintLabel}
            </div>
            <p className="m-0 text-[0.95rem] leading-[1.6] opacity-90">
              {CASE01.constraint}
            </p>
          </div>
        </div>

        {/* the runner */}
        <div className="mt-5 border-2 border-window p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] tracking-[0.1em] uppercase">
            <span className="opacity-60">{CASE01.runLabel}</span>
            {/* the design announces nothing; a run is only legible if the status is spoken */}
            <span aria-live="polite">
              status: <strong className="text-yellow">{status}</strong>
            </span>
          </div>

          <div className="mb-[18px] flex flex-wrap gap-2.5">
            <Button variant="brutalDark" onClick={() => run("clean")}>
              {CASE01.buttons.clean}
            </Button>
            <Button variant="brutalDanger" onClick={() => run("risky")}>
              {CASE01.buttons.risky}
            </Button>
            <Button variant="brutalGhostDark" onClick={reset}>
              {CASE01.buttons.reset}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {CASE01.stages.map((stage, i) => (
              <div
                key={stage.number}
                className="relative flex-[1_1_120px] overflow-hidden border-2 border-window bg-ink p-3"
              >
                {/* the fill layer is what reads as the stage lighting up */}
                <div
                  className="absolute inset-0 bg-yellow transition-opacity duration-300 ease-[ease]"
                  style={{ opacity: stageOpacity(i) }}
                />
                <div className="relative" style={{ color: stageColor(i) }}>
                  <div className="font-mono text-[10px] opacity-60">
                    {stage.number}
                  </div>
                  <div className="mt-1 text-[1.05rem] font-bold">
                    {stage.name}
                  </div>
                  <div className="mt-[5px] font-mono text-[10.5px] opacity-70">
                    {stage.note}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            aria-live="polite"
            className="mt-3.5 min-h-[132px] border-2 border-[#EEEFE955] border-dashed p-3.5 font-mono text-[11.5px] leading-[1.75]"
          >
            {log.map((line, i) => (
              <div key={i} className="opacity-85">
                {line}
              </div>
            ))}
            {/* trails the last line; solid rather than strobing under reduced motion */}
            <span className="inline-block h-[13px] w-[7px] bg-yellow align-[-2px] motion-safe:animate-[blink_1s_steps(1)_infinite]" />
          </div>
        </div>

        <div className="mt-5 border-2 border-yellow bg-yellow p-[18px] text-ink">
          <div className="mb-2.5 font-mono text-[10.5px] font-bold tracking-[0.14em] uppercase">
            {CASE01.forkLabel}
          </div>
          <p className="m-0 text-[0.97rem] leading-[1.6]">{CASE01.fork[0]}</p>
          <p className="mt-3 mb-0 text-[0.97rem] leading-[1.6]">
            {CASE01.fork[1]}
          </p>
        </div>

        <div className="mt-4">
          <div className="mb-[7px] font-mono text-[10.5px] tracking-[0.14em] uppercase opacity-50">
            {CASE01.rejectedLabel}
          </div>
          <p className="m-0 text-[0.95rem] leading-[1.6] opacity-90">
            {CASE01.rejected}
          </p>
        </div>

        <blockquote className="mt-[18px] mb-0 max-w-[44ch] border-l-[6px] border-orange pl-4 text-[1.1rem] leading-[1.35] font-semibold">
          {CASE01.quote}
        </blockquote>
      </div>
    </ScrollArea>
  );
}
