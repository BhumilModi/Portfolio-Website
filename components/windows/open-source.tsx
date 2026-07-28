"use client"

import { type JSX } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { OSS } from "@/lib/content"
import { cn } from "@/lib/utils"

/**
 * Open source — window body only (design lines 135–160).
 *
 * `max-w-[860px]` sits on the scroll container, not the content, because that
 * is where the design has it (line 135) — the scrollbar tracks the 860px edge.
 *
 * TheAgenticBench is the small card: 4px shadow, 1.05rem title, 14/16 padding,
 * outlined star badge (design line 153).
 *
 * `rel="noreferrer noopener"` is the one addition to the source markup. The
 * design ships bare `target="_blank"`, which is a tab-nabbing hole.
 */
export function OpenSource(): JSX.Element {
  return (
    <ScrollArea className="min-h-0 max-w-[860px] flex-1 [&>[data-slot=scroll-area-viewport]>div]:block!">
      <div className="grid auto-rows-min content-start gap-[14px] p-[22px]">
        <p className="text-[0.98rem] leading-[1.55] opacity-80">{OSS.intro}</p>

        {OSS.repos.map((repo) => {
          // The lesser card is the one without the filled star badge — the two
          // signals are the same distinction in the design (headline repo vs
          // not), so this is read off the data rather than the array index.
          const small = !repo.badgeHighlight
          return (
            <Button
              key={repo.name}
              asChild
              variant="brutalCard"
              className={cn(
                "block whitespace-normal no-underline",
                small
                  ? "px-4 py-3.5 shadow-[4px_4px_0_var(--color-ink)] hover:shadow-[6px_6px_0_var(--color-orange)]"
                  : "px-[18px] py-4 hover:shadow-[7px_7px_0_var(--color-orange)]"
              )}
            >
              <a href={repo.url} target="_blank" rel="noreferrer noopener">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <strong className={cn("tracking-[-0.02em]", small ? "text-[1.05rem]" : "text-[1.2rem]")}>
                    {repo.name}
                  </strong>
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-auto border-2 px-2 py-1 font-mono font-bold",
                      repo.badgeHighlight ? "bg-yellow text-xs" : "text-[11.5px]"
                    )}
                  >
                    {repo.badge}
                  </Badge>
                </div>

                <p
                  className={cn(
                    "mt-2 leading-[1.5] opacity-80",
                    small ? "text-[0.92rem]" : "text-[0.94rem]"
                  )}
                >
                  {repo.description}
                </p>

                {repo.contribution !== null && (
                  <p className="mt-2 font-mono text-[11.5px] opacity-70">{repo.contribution}</p>
                )}
              </a>
            </Button>
          )
        })}
      </div>
    </ScrollArea>
  )
}
