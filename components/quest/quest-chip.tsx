"use client";
import { useEffect } from "react";
import { OBOLS, paid } from "@/lib/quest";
import { cross } from "@/lib/scene";
import { QUEST } from "@/lib/content";
import { useHydrated, useQuest } from "./use-quest";

let greeted = false;

/** Fixed HUD chip, bottom-left (spec §2). #quest-anchor is where picked obols fly; it exists before the chip shows. */
export default function QuestChip() {
  const hydrated = useHydrated();
  const s = useQuest();
  useEffect(() => {
    if (greeted) return;
    greeted = true;
    console.log(`%c${QUEST.console}`, "font: 13px/1.5 ui-monospace, monospace; color: #d0643b");
  }, []);

  const base = "quest-chip font-mono text-xs uppercase tracking-[0.16em]";
  let chip: React.ReactNode = null;
  if (hydrated && s.crossed) {
    chip = <button type="button" onClick={() => cross("down")} className={base}>{QUEST.enter}</button>;
  } else if (hydrated && paid(s)) {
    chip = <button type="button" onClick={() => cross("down")} className={`${base} quest-chip-ready`}>{QUEST.pay}</button>;
  } else if (hydrated && s.obols.length > 0) {
    chip = <span className={base}>{QUEST.counter} {s.obols.length}/{OBOLS.length}</span>;
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 md:bottom-8 md:left-8">
      <span id="quest-anchor" aria-hidden className="absolute bottom-1 left-1 size-7" />
      <div aria-live="polite">{chip}</div>
    </div>
  );
}
