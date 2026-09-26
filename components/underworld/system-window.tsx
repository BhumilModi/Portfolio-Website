"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { SYSTEM } from "@/lib/content";
import { playChime } from "@/components/quest/sound";

type Props = {
  /** Bracketed header: "QUEST" renders "[ QUEST ]" as the window's heading. Ignored for a notice. */
  heading?: string;
  /** Heading level: 2 on its own (the Status Window), 3 inside another section (the Trial). */
  level?: 2 | 3;
  /** A one-line System notice: "[SYSTEM] …", role="status", a polite live region, no heading. */
  notice?: boolean;
  /** Already open: no line, no unfold, no chime (the notice carried over from the crossing). */
  instant?: boolean;
  id?: string;
  className?: string;
  children: ReactNode;
};

/**
 * The System window (redesign spec §5): a translucent deep-navy panel, a 1px System-blue border with a soft glow,
 * and corner brackets. It opens the first time it scrolls into view — a 120ms line, then a 180ms unfold, strong
 * ease-out — and chimes if sound is on. Reduced motion gets a plain 150ms fade (app/globals.css).
 */
export default function SystemWindow({ heading, level = 2, notice = false, instant = false, id, className = "", children }: Props) {
  // Observed on an unclipped wrapper, not the window itself: the shut state's clip-path collapses the
  // window's own box to zero, which would make an IntersectionObserver watching it (or a descendant of it)
  // report a permanent zero intersection ratio and never fire.
  const wrap = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const [phase, setPhase] = useState<"shut" | "open" | "still">(instant ? "still" : "shut");

  useEffect(() => {
    const el = wrap.current;
    if (instant || !el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        setPhase("open");
        playChime();
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [instant]);

  if (notice) {
    return (
      <div ref={wrap} className={className}>
        <div role="status" aria-live="polite" data-phase={phase} className="sys-window sys-notice">
          <div className="sys-body">
            <span className="sys-tag">{SYSTEM.tag}</span> {children}
          </div>
        </div>
      </div>
    );
  }
  const Heading = level === 3 ? "h3" : "h2";
  return (
    <div ref={wrap} className={className}>
      <section id={id} aria-labelledby={heading ? headingId : undefined} data-phase={phase} className="sys-window">
        {heading && (
          <Heading id={headingId} className="sys-head">
            <span aria-hidden>[ </span>
            {heading}
            <span aria-hidden> ]</span>
          </Heading>
        )}
        <div className="sys-body">
          {children}
        </div>
      </section>
    </div>
  );
}
