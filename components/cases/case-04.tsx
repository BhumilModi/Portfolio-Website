"use client"

import { type JSX } from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { CASE04 } from "@/lib/content"

/**
 * Case 04 — window body only (design lines 381–395).
 *
 * The −480 tile bobs on an infinite loop. `bob` bakes `rotate(-3deg)` into
 * every keyframe, so no extra rotation goes on top; the global
 * `prefers-reduced-motion` guard in globals.css (`animation-duration: .001s`)
 * covers it, which is what makes a decorative infinite loop acceptable here.
 */
export function Case04(): JSX.Element {
  return (
    <ScrollArea className="min-h-0 flex-1 [&>[data-slot=scroll-area-viewport]>div]:block!">
      <div className="p-[22px]">
        <div className="border-t-2 border-ink pt-5">
          <div className="font-mono text-[10.5px] tracking-[0.1em] uppercase opacity-55">
            {CASE04.meta}
          </div>
          <h2 className="mt-2 text-[1.4rem] font-bold tracking-[-0.03em]">{CASE04.h2}</h2>

          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <p className="text-[0.95rem] leading-[1.6]">{CASE04.body}</p>
            <div className="animate-[bob_4s_ease-in-out_infinite] border-2 border-ink bg-ink px-[18px] py-3.5 text-center font-mono text-yellow">
              <div className="text-[1.6rem] font-bold">{CASE04.metric.value}</div>
              <div className="mt-[3px] text-[10px] tracking-[0.08em] opacity-65">
                {CASE04.metric.caption}
              </div>
            </div>
          </div>

          <blockquote className="mt-4 max-w-[44ch] border-l-[6px] border-orange pl-4 text-[1.05rem] leading-[1.35] font-semibold">
            {CASE04.quote}
          </blockquote>
        </div>
      </div>
    </ScrollArea>
  )
}
