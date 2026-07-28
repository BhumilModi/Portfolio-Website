"use client"

import { type JSX } from "react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { START } from "@/lib/content"
import { cn } from "@/lib/utils"

/**
 * Start here — window body only (design lines 93–124).
 *
 * The chrome (title bar, drag, resize, close) is applied around this by the
 * window shell; this component owns the design's inner `overflow: auto` div,
 * which is why the padding and the scroll container live here.
 *
 * `[&>[data-slot=scroll-area-viewport]>div]:block!` undoes Radix's
 * `display: table` content wrapper — without it the grid and the `ch`-based
 * max-widths size against a shrink-wrapping table instead of the viewport.
 */
export function StartHere({
  onRunCase01,
  onOpenContact,
}: {
  onRunCase01: () => void
  onOpenContact: () => void
}): JSX.Element {
  return (
    <ScrollArea className="min-h-0 flex-1 [&>[data-slot=scroll-area-viewport]>div]:block!">
      <div className="px-[26px] pt-[28px] pb-[30px]">
        {/* design line 94 */}
        <div className="inline-flex items-center gap-[9px] border-2 border-ink px-[11px] py-1.5 font-mono text-[11px] tracking-[0.12em] uppercase shadow-hard-3">
          <span className="inline-block size-[7px] animate-[pulseDot_1.8s_ease-in-out_infinite] rounded-full bg-orange" />
          {START.badge}
        </div>

        <h1 className="mt-[22px] text-[clamp(1.9rem,3vw,2.7rem)] leading-[1.02] font-bold tracking-[-0.035em] text-pretty">
          {START.h1}
        </h1>

        <p className="mt-[18px] max-w-[54ch] text-base leading-[1.55] opacity-[0.78]">
          {START.lede}
        </p>

        {/* one sentence — the highlight has to wrap with the lead, not after it */}
        <p className="mt-6 max-w-[24ch] text-[clamp(1.5rem,2.4vw,2.2rem)] leading-[1.1] font-bold tracking-[-0.03em] text-pretty">
          {START.pitchLead}{" "}
          <span className="mt-1.5 inline-block border-2 border-ink bg-yellow px-2 pt-0 pb-[3px] shadow-[4px_4px_0_var(--color-ink)]">
            {START.pitchHighlight}
          </span>
        </p>

        <div className="mt-[26px] grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3">
          {START.stats.map((stat, i) => (
            <div
              key={stat.value}
              className={cn("border-2 border-ink p-3.5", i === 0 && "bg-ink text-yellow")}
            >
              <div className="text-[1.7rem] leading-none font-bold">{stat.value}</div>
              <div
                className={cn(
                  "mt-1.5 font-mono text-[10.5px] leading-[1.45]",
                  i === 0 ? "opacity-70" : "opacity-65"
                )}
              >
                {stat.caption}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-5 font-mono text-[11.5px] leading-[1.6] opacity-60">{START.ndaNote}</p>

        <div className="mt-6 flex flex-wrap items-center gap-[14px]">
          <Button variant="brutalPrimary" onClick={onRunCase01}>
            {START.ctaPrimary}
          </Button>
          <Button variant="brutal" onClick={onOpenContact}>
            {START.ctaSecondary}
          </Button>
        </div>
      </div>
    </ScrollArea>
  )
}
