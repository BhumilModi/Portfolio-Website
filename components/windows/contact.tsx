"use client"

import { type JSX } from "react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CONTACT } from "@/lib/content"

/**
 * Contact — window body only (design lines 475–488).
 *
 * This window is inverted: the ink ground and #EEEFE9 text are set on the
 * window root by the chrome, so everything here is styled for a dark ground.
 *
 * The email link has no matching button variant (yellow fill, #EEEFE9 border,
 * orange offset shadow) and is used exactly once, so it takes className
 * overrides on `brutal` rather than earning a variant of its own.
 */
export function Contact(): JSX.Element {
  return (
    <ScrollArea className="min-h-0 flex-1 [&>[data-slot=scroll-area-viewport]>div]:block!">
      <div className="grid auto-rows-min content-start justify-items-start gap-4 p-6">
        <h2 className="text-[1.9rem] leading-none font-bold tracking-[-0.035em]">{CONTACT.h2}</h2>

        <p className="max-w-[44ch] text-[0.98rem] leading-[1.55] opacity-80">{CONTACT.body}</p>

        <Button
          asChild
          variant="brutal"
          className="border-window bg-yellow px-5 text-[0.95rem] font-bold text-ink no-underline shadow-[5px_5px_0_var(--color-orange)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-yellow hover:shadow-[7px_7px_0_var(--color-orange)]"
        >
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
        </Button>

        <div className="flex flex-wrap gap-[9px]">
          {CONTACT.links.map((link) => (
            <Button
              key={link.label}
              asChild
              variant="brutalGhostDark"
              className="px-[13px] no-underline hover:bg-window/10"
            >
              <a href={link.href} target="_blank" rel="noreferrer noopener">
                {link.label}
              </a>
            </Button>
          ))}
        </div>

        {/* Unfilled placeholder — stays a visible TODO until Bhumil writes it. */}
        <div className="max-w-[60ch] border-2 border-dashed border-window/33 px-[14px] py-3 font-mono text-[11.5px] leading-[1.65] opacity-75">
          <div className="mb-1.5 text-[10px] tracking-[0.12em] uppercase opacity-60">
            {CONTACT.nowLabel}
          </div>
          {CONTACT.now}
        </div>

        <div className="font-mono text-[11px] opacity-50">
          {CONTACT.footer}
          <a href={CONTACT.resume.href} className="text-window">
            {CONTACT.resume.label}
          </a>
        </div>
      </div>
    </ScrollArea>
  )
}
