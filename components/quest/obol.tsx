"use client";
import { useRef } from "react";
import { quest, type ObolId } from "@/lib/quest";
import { QUEST } from "@/lib/content";
import { useHydrated, useQuest } from "./use-quest";

/** A hidden coin (spec §2). Renders nothing until hydrated and nothing once picked. */
export default function Obol({ id, className = "" }: { id: ObolId; className?: string }) {
  const hydrated = useHydrated();
  const { obols } = useQuest();
  const ref = useRef<HTMLButtonElement>(null);
  if (!hydrated || obols.includes(id)) return null;

  const pick = () => {
    const el = ref.current;
    if (!el || el.dataset.picked) return;
    el.dataset.picked = "";
    const coin = el.firstElementChild as HTMLElement;
    const from = coin.getBoundingClientRect();
    const to = document.getElementById("quest-anchor")?.getBoundingClientRect();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Fly a fixed-position clone so no overflow-hidden ancestor (the footer) can clip the flight.
    const ghost = coin.cloneNode(true) as HTMLElement;
    Object.assign(ghost.style, { position: "fixed", left: `${from.left}px`, top: `${from.top}px`, margin: "0", zIndex: "50", pointerEvents: "none" });
    document.body.append(ghost);
    el.style.visibility = "hidden";
    const frames: Keyframe[] =
      reduced || !to
        ? [{ opacity: 1 }, { opacity: 0 }]
        : [
            { transform: "translate(0, 0) scale(1)" },
            { transform: "translate(0, -28px) scale(1.35)", offset: 0.25 },
            { transform: `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(0.7)`, opacity: 0.85 },
          ];
    ghost
      .animate(frames, { duration: reduced ? 200 : 700, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "forwards" })
      .finished.finally(() => {
        ghost.remove();
        quest.pick(id);
      });
  };

  return (
    <button ref={ref} type="button" aria-label={QUEST.obol} onClick={pick} className={`-m-2 p-2 ${className}`}>
      <span aria-hidden className="obol block" />
    </button>
  );
}
