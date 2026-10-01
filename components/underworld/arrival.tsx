"use client";
import { useEffect, useState } from "react";
import { SYSTEM, UNDERWORLD } from "@/lib/content";
import { scene } from "@/lib/scene";
import SystemWindow from "./system-window";

export default function Arrival() {
  // Arriving from the crossing, its notice is already on screen: show ours in place, without a second opening.
  const [carried] = useState(() => scene.noticeCarried);
  useEffect(() => {
    scene.noticeCarried = false;
  }, []);
  return (
    <section aria-labelledby="ryuma" className="mx-auto flex min-h-dvh w-full max-w-[1280px] flex-col justify-end gap-6 px-4 pb-24 md:px-8">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-spirit">{UNDERWORLD.eyebrow}</p>
      <h1 id="ryuma" className="system-glow cap-trim font-display text-[clamp(5rem,18vw,16rem)] uppercase leading-[0.85]">{UNDERWORLD.name}</h1>
      <p className="max-w-[40ch] font-serif text-2xl italic text-bone/90 md:text-3xl">{UNDERWORLD.line}</p>
      <SystemWindow notice instant={carried} className="w-fit max-w-[34rem]">
        {SYSTEM.entered}
      </SystemWindow>
    </section>
  );
}
