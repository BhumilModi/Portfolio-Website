"use client"

import { type JSX } from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { CASE03 } from "@/lib/content"
import { cn } from "@/lib/utils"

/**
 * Case 03 — window body only (design lines 353–378).
 *
 * The two terminals are the argument: the old tool lies in green, mine aborts
 * in red. Per-line colour / opacity / weight come from the `CASE03.terminals`
 * data, so those three stay inline styles — they are values, not variants.
 */
export function Case03(): JSX.Element {
  return (
    <ScrollArea className="min-h-0 flex-1 [&>[data-slot=scroll-area-viewport]>div]:block!">
      <div className="p-[22px]">
        <div className="font-mono text-[10.5px] tracking-[0.1em] uppercase opacity-55">
          {CASE03.meta}
        </div>
        <h2 className="mt-2 text-[1.5rem] font-bold tracking-[-0.03em]">{CASE03.h2}</h2>
        <p className="mt-3 text-[0.95rem] leading-[1.6]">{CASE03.body}</p>

        <div className="mt-[14px] grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-3">
          {CASE03.terminals.map((terminal) => (
            <div
              key={terminal.label}
              className={cn(
                "border-2 border-ink p-3.5 font-mono text-[11.5px] leading-[1.7]",
                terminal.inverted
                  ? "bg-ink text-window"
                  : "shadow-[4px_4px_0_var(--color-orange)]"
              )}
            >
              <div className="mb-2 text-[10px] tracking-[0.12em] uppercase opacity-50">
                {terminal.label}
              </div>
              {terminal.lines.map((line) => (
                <div
                  key={line.text}
                  style={{
                    color: line.color,
                    opacity: line.opacity,
                    fontWeight: line.bold ? 700 : undefined,
                  }}
                >
                  {line.text}
                </div>
              ))}
            </div>
          ))}
        </div>

        <blockquote className="mt-4 max-w-[42ch] border-l-[6px] border-orange pl-4 text-[1.05rem] leading-[1.35] font-semibold">
          {CASE03.quote}
        </blockquote>
      </div>
    </ScrollArea>
  )
}
