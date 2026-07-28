"use client";

import { Fragment, type JSX } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { usePron } from "@/hooks/use-pron";
import { CASE02 } from "@/lib/content";
import { cn } from "@/lib/utils";

/** Per-tier chrome (design lines 330–346). Filled, solid, dashed — the three
 *  cards deliberately don't share a style, so the differences stay tabular
 *  rather than becoming conditionals in the markup. */
const TIER = [
  {
    box: "border-2 border-yellow bg-yellow text-ink",
    eyebrow: "opacity-70",
    note: "opacity-80",
  },
  {
    box: "border-2 border-window",
    eyebrow: "opacity-[0.55]",
    note: "opacity-60",
  },
  {
    box: "border-2 border-[#EEEFE966] border-dashed",
    eyebrow: "opacity-[0.55]",
    note: "opacity-60",
  },
];

/** Case 02 — the runnable precedence chain (design lines 297–350). */
export function Case02(): JSX.Element {
  const { word, result, notes, opacity, resolve } = usePron();

  return (
    <ScrollArea className="min-h-0 flex-1 [&>[data-slot=scroll-area-viewport]>div]:block!">
      <div className="p-[22px]">
        <div className="mb-3 font-mono text-[10.5px] tracking-[0.1em] uppercase opacity-[0.55]">
          {CASE02.meta}
        </div>

        <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-[minmax(0,1.05fr)_minmax(230px,0.95fr)]">
          <div>
            <h2 className="m-0 text-[clamp(1.3rem,2vw,1.7rem)] leading-[1.1] font-bold tracking-[-0.03em]">
              {CASE02.h2}
            </h2>

            <div className="mt-4 mb-[7px] font-mono text-[10.5px] tracking-[0.14em] uppercase opacity-50">
              {CASE02.situationLabel}
            </div>
            <p className="m-0 text-[0.95rem] leading-[1.6]">
              {CASE02.situation}
            </p>

            <div className="mt-4 mb-[7px] font-mono text-[10.5px] tracking-[0.14em] uppercase opacity-50">
              {CASE02.constraintLabel}
            </div>
            <p className="m-0 text-[0.95rem] leading-[1.6]">
              {CASE02.constraint}
            </p>

            <div className="mt-4 mb-[7px] font-mono text-[10.5px] tracking-[0.14em] uppercase opacity-50">
              {CASE02.builtLabel}
            </div>
            <p className="m-0 text-[0.95rem] leading-[1.6]">{CASE02.built}</p>

            <div className="mt-[18px] border-2 border-ink bg-yellow p-4 shadow-[4px_4px_0_var(--color-ink)]">
              <div className="mb-2.5 font-mono text-[10.5px] font-bold tracking-[0.14em] uppercase">
                {CASE02.forkLabel}
              </div>
              <p className="m-0 text-[0.95rem] leading-[1.6]">
                {CASE02.forkLead}
                <em>{CASE02.forkEmphasis}</em>
                {CASE02.forkTail}
              </p>
            </div>

            <blockquote className="mt-[18px] mb-0 max-w-[38ch] border-l-[6px] border-orange pl-4 text-[1.05rem] leading-[1.35] font-semibold">
              {CASE02.quote}
            </blockquote>
          </div>

          {/* the resolver */}
          <div className="self-start border-2 border-ink bg-ink p-4 text-window">
            <div className="mb-3.5 font-mono text-[10.5px] tracking-[0.12em] uppercase opacity-60">
              {CASE02.resolverLabel}
            </div>

            <div className="mb-4 flex flex-wrap gap-[7px]">
              {CASE02.words.map((w) => (
                <Button
                  key={w.key}
                  variant="brutalGhostDark"
                  onClick={() => resolve(w.key)}
                  className="border-window px-[11px] py-2 hover:border-yellow hover:bg-yellow hover:text-ink"
                >
                  {w.label}
                </Button>
              ))}
            </div>

            <div className="mb-4 border-2 border-[#EEEFE955] border-dashed px-[13px] py-[11px] font-mono text-xs leading-[1.55]">
              <div className="opacity-50">{CASE02.inputLabel}</div>
              <div className="text-base font-bold">{word}</div>
              <div className="mt-[9px] opacity-50">{CASE02.resolvedLabel}</div>
              {/* the design announces nothing; the resolved value is the answer */}
              <div aria-live="polite" className="text-base text-yellow">
                {result}
              </div>
            </div>

            {CASE02.tiers.map((tier, i) => (
              <Fragment key={tier.name}>
                {i > 0 && (
                  <div className="py-[7px] pl-[3px] font-mono text-[10.5px] opacity-50">
                    {CASE02.tierGaps[i - 1]}
                  </div>
                )}
                <div
                  className={cn(
                    "p-3 transition-opacity duration-[280ms] ease-[ease]",
                    TIER[i].box,
                  )}
                  style={{ opacity: opacity(i) }}
                >
                  <div className={cn("font-mono text-[10px]", TIER[i].eyebrow)}>
                    {tier.eyebrow}
                  </div>
                  <div className="mt-1 text-[1.05rem] font-bold">
                    {tier.name}
                  </div>
                  <div
                    className={cn("mt-1 font-mono text-[10.5px]", TIER[i].note)}
                  >
                    {notes[i]}
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
