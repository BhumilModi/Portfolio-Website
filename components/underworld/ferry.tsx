"use client";
import { useEffect, useRef, useState } from "react";
import { SYSTEM, UNDERWORLD } from "@/lib/content";
import { cardOpacity, signalLoss, whisperOpacity } from "@/lib/ferry";
import { scene } from "@/lib/scene";
import { clamp01 } from "@/lib/timeline";
import RyumaMark from "./ryuma-mark";
import SystemWindow from "./system-window";

const WHISPERS = UNDERWORLD.whispers;

/** Still: reduced motion, or no WebGL to ride through. The broadcast collapses to stacked content, no pinned track. */
const isStill = () => scene.reducedMotion || document.documentElement.classList.contains("no-webgl");

/**
 * The broadcast (spirit spec §5): a 250vh pinned track over the Sanzu. Scroll progress drives the backdrop's camera
 * (scene.ferry → lib/ferry.ts) and the stage's CSS variables: the title card, the mark's dot screen, the whispers and
 * signal loss at the dive into the portal.
 */
export default function Ferry() {
  const track = useRef<HTMLElement>(null);
  // Arriving from the crossing, its notice is already on screen: show ours in place, without a second opening.
  const [carried] = useState(() => scene.noticeCarried);
  // Realm mounts this only after hydration, so reading the browser here is safe.
  const [still] = useState(isStill);

  useEffect(() => {
    scene.noticeCarried = false;
    const el = track.current;
    if (!el) return;
    if (still) {
      scene.ferry = 0;
      return;
    }
    const set = (k: string, v: number) => el.style.setProperty(k, v.toFixed(3));
    let last = -1;
    const read = () => {
      const rect = el.getBoundingClientRect();
      const p = clamp01(-rect.top / Math.max(1, rect.height - window.innerHeight));
      if (Math.abs(p - last) < 1e-4) return;
      last = p;
      scene.ferry = p;
      const card = cardOpacity(p);
      set("--card", card);
      set("--dot", card);
      set("--signal", signalLoss(p));
      WHISPERS.forEach((_, i) => set(`--w${i}`, whisperOpacity(p, i, WHISPERS.length)));
    };
    read(); // before the first frame: a reload or a hash mid-track must not animate in from 0
    let raf = 0;
    const tick = () => {
      read();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const skip = () => el.querySelector<HTMLAnchorElement>("a[data-cross]")?.click();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && document.activeElement === document.body && last < 1) skip();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      scene.ferry = 0;
    };
  }, [still]);

  const card = (
    <>
      <h1 id="ryuma" className="relative w-[min(90vw,860px)] text-bone before:absolute before:-inset-x-[30%] before:-inset-y-[60%] before:-z-10 before:bg-[radial-gradient(closest-side,#000_55%,transparent)] before:content-['']">
        <RyumaMark className="block w-full" />
      </h1>
      <SystemWindow notice instant={carried} className="w-fit max-w-[34rem] text-left">
        {SYSTEM.entered}
      </SystemWindow>
    </>
  );

  if (still) {
    return (
      <section id="ferry" aria-labelledby="ryuma" className="mx-auto flex min-h-dvh w-full max-w-[1280px] flex-col items-center justify-center gap-8 px-4 py-24 text-center md:px-8">
        {card}
        <div className="flex flex-col gap-2 font-mono text-sm uppercase tracking-[0.2em] text-bone/85">
          {WHISPERS.map((w) => (
            <p key={w}>{w}</p>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      id="ferry"
      ref={track}
      aria-labelledby="ryuma"
      className="relative h-[250vh]"
      style={{ "--card": 1, "--dot": 1, "--signal": 0, "--w0": 0, "--w1": 0, "--w2": 0 } as React.CSSProperties}
    >
      <div className="sticky top-0 h-dvh overflow-hidden">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-4 pt-16 text-center" style={{ opacity: "var(--card)" }}>
          {card}
        </div>

        {WHISPERS.map((w, i) => (
          <p
            key={w}
            className="broadcast-subtitle absolute inset-x-4 bottom-[16%] text-center font-mono text-sm uppercase tracking-[0.24em] text-bone md:text-base"
            style={{ opacity: `var(--w${i})` }}
          >
            {w}
          </p>
        ))}

        <div aria-hidden className="signal-loss pointer-events-none absolute inset-0" style={{ opacity: "var(--signal)" }} />

        <div className="absolute inset-x-0 bottom-6 flex justify-center md:bottom-8">
          <a href="#trial" data-cross className="seal">
            {UNDERWORLD.cross}
          </a>
        </div>
      </div>
    </section>
  );
}
