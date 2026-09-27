"use client";
import { useEffect, useState } from "react";
import { SYSTEM } from "@/lib/content";
import { quest } from "@/lib/quest";
import { scene } from "@/lib/scene";
import { playChime } from "@/components/quest/sound";

const ARISE_EVENT = "bm:arise";
const FLASH_MS = 1200;
const toStatus = () => document.getElementById("status")?.scrollIntoView({ behavior: scene.reducedMotion ? "auto" : "smooth", block: "start" });

/** ARISE (redesign spec §6): the ARISE button after a clear, or skipping the trial. Once per visitor; later it just goes to the Status Window. */
export function summon() {
  if (quest.get().arisen) {
    toStatus();
    return;
  }
  scene.ariseAt = performance.now(); // before arise(), so the soldiers' first visible frame is the start of the rise
  quest.arise();
  playChime();
  window.dispatchEvent(new Event(ARISE_EVENT));
}

/** The word: "ARISE" huge in League Gothic with a Monarch-violet glow for ~1.2s, then on to the Status Window. */
export default function AriseFlash() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let id = 0;
    const onArise = () => {
      setOn(true);
      window.clearTimeout(id);
      id = window.setTimeout(() => {
        setOn(false);
        toStatus();
      }, FLASH_MS);
    };
    window.addEventListener(ARISE_EVENT, onArise);
    return () => {
      window.removeEventListener(ARISE_EVENT, onArise);
      window.clearTimeout(id);
    };
  }, []);
  if (!on) return null;
  return (
    <div className="arise-flash" role="status" aria-live="assertive">
      <span className="arise-word font-display">{SYSTEM.arise}</span>
    </div>
  );
}
