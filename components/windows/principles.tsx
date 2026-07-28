"use client"

import { type JSX } from "react"

import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PRINCIPLES } from "@/lib/content"
import { cn } from "@/lib/utils"

/**
 * Principles — window body only (design lines 408–464).
 *
 * `font-bold` is explicit on the h3s: the design leans on the UA heading
 * weight, which Tailwind's preflight resets to `inherit`.
 *
 * Toolkit rows differ by design, not by accident — only `daily` chips carry the
 * 2px offset shadow, and the whole `prior` row sits at .6 (lines 437–461).
 */
export function Principles(): JSX.Element {
  return (
    <ScrollArea className="min-h-0 max-w-[940px] flex-1 [&>[data-slot=scroll-area-viewport]>div]:block!">
      <div className="grid auto-rows-min content-start gap-[18px] p-[22px]">
        <p className="text-[0.98rem] leading-[1.55] opacity-80">{PRINCIPLES.intro}</p>

        {PRINCIPLES.items.map((item) => (
          <div key={item.heading} className="border-t-2 border-ink pt-[14px]">
            <h3 className="text-[1.12rem] font-bold tracking-[-0.02em]">{item.heading}</h3>
            <p className="mt-2 text-[0.94rem] leading-[1.6] opacity-85">{item.body}</p>
          </div>
        ))}

        <div className="border-t-2 border-ink pt-4">
          <div className="mb-2.5 font-mono text-[10.5px] tracking-[0.12em] uppercase opacity-55">
            {PRINCIPLES.toolkitLabel}
          </div>
          <div className="grid gap-2.5">
            {PRINCIPLES.toolkit.map((row) => (
              <div
                key={row.tier}
                className={cn(
                  "flex flex-wrap items-center gap-2",
                  row.dimmed && "opacity-60"
                )}
              >
                <span className="min-w-[74px] font-mono text-[11px] font-bold">{row.tier}</span>
                {row.chips.map((chip) => (
                  <Badge
                    key={chip}
                    variant="outline"
                    className={cn(
                      "h-auto border-2 px-[9px] py-[5px] font-mono text-[11.5px] font-normal",
                      row.raised && "shadow-hard-2"
                    )}
                  >
                    {chip}
                  </Badge>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
