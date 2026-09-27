"use client";
import { Suspense, useEffect, useRef } from "react";
import { PerspectiveCamera, View, useProgress } from "@react-three/drei";
import { NAV, ONBOARDING } from "@/lib/content";
import { scene } from "@/lib/scene";
import { clamp01, fadeInOut, local, smoothstep } from "@/lib/timeline";
import OnboardingScene, { BustOnboarding, FALLBACK_SPHERE } from "./onboarding-scene";
import SceneBoundary from "./scene-boundary";

// Crisp near-offsets stand the glyphs off the bright engraved bust; the wider blur adds a
// soft halo for the busy dithered background behind it. Void only, per the constraints.
const TEXT_SHADOW = {
  textShadow:
    "0 0 1px var(--color-void), 0 1px 1px var(--color-void), 0 -1px 1px var(--color-void), 1px 0 1px var(--color-void), -1px 0 1px var(--color-void), 0 2px 8px var(--color-void)",
};

export default function Onboarding() {
  const track = useRef<HTMLElement>(null);
  const curtain = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLParagraphElement>(null);

  // Load curtain: count up to the real asset progress, then open. Scroll stays locked until it opens
  // (SmoothScroll runs Lenis with autoToggle, so the inline overflow on <html> stops it too).
  useEffect(() => {
    const el = track.current;
    const veil = curtain.current;
    const count = counter.current;
    if (!el || !veil || !count) return;
    const open = () => {
      el.dataset.revealed = "";
      return window.setTimeout(() => (veil.hidden = true), 1400); // after the iris transition in globals.css
    };
    // Landing mid-page (a hash, a restored scroll) skips the intro, so skip its curtain too.
    if (location.hash || window.scrollY > 0) {
      veil.hidden = true;
      el.dataset.revealed = "";
      return;
    }
    const root = document.documentElement.style;
    root.setProperty("overflow", "clip");
    const t0 = performance.now();
    let shown = 0;
    let raf = 0;
    let timer = 0;
    const tick = (now: number) => {
      // Hidden (reduced motion, no WebGL): nothing will load here, so never hold the page.
      if (el.offsetHeight === 0) {
        root.removeProperty("overflow");
        veil.hidden = true;
        return;
      }
      const target = useProgress.getState().progress;
      shown += (target - shown) * 0.08;
      if (target - shown < 0.5) shown = target;
      count.textContent = `${String(Math.floor(shown)).padStart(3, "0")}%`;
      // ponytail: 15s cap so a stalled asset can't lock the page; the counter just stops short.
      if (shown >= 100 || now - t0 > 15000) {
        root.removeProperty("overflow");
        timer = open();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      root.removeProperty("overflow");
    };
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let raf = 0;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const set = (k: string, v: number) => el.style.setProperty(k, v.toFixed(3));
      let last = -1;
      const tick = () => {
        const rect = el.getBoundingClientRect();
        const p = clamp01(-rect.top / Math.max(1, rect.height - window.innerHeight));
        if (Math.abs(p - last) > 1e-4) {
          last = p;
          scene.progress = p;
          set("--hint", 1 - smoothstep(0, 0.03, p));
          set("--whisper-in", fadeInOut(local(p, "radiance")));
          set("--name", smoothstep(0, 0.5, local(p, "name")) * (1 - smoothstep(0.2, 0.6, local(p, "descent"))));
          set("--whisper-out", fadeInOut(local(p, "descent")));
          set("--flood", smoothstep(0.55, 1, local(p, "descent")));
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }
    const onKey = (e: KeyboardEvent) => {
      if (el.offsetHeight > 0 && e.key === "Enter" && document.activeElement === document.body && scene.progress < 1) {
        el.querySelector<HTMLAnchorElement>('a[href="#hero"]')?.click();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <section
      id="onboarding"
      ref={track}
      aria-label="Introduction"
      className="relative h-[250vh] bg-void text-bone"
      style={{ "--hint": 1, "--whisper-in": 0, "--name": 0, "--whisper-out": 0, "--flood": 0 } as React.CSSProperties}
    >
      <div ref={curtain} aria-hidden className="intro-curtain fixed inset-0 z-40 grid place-items-center bg-void text-bone">
        <div className="intro-curtain-mark flex flex-col items-center gap-5">
          <p className="cap-trim font-display text-[clamp(5rem,14vw,10rem)] uppercase leading-none tracking-wide">{NAV.brand}</p>
          <p ref={counter} className="font-mono text-xs tracking-[0.2em] tabular-nums text-bone/70">000%</p>
        </div>
      </div>

      <div className="sticky top-0 z-30 h-dvh overflow-hidden">
        <div aria-hidden className="absolute inset-0">
          <View className="size-full">
            <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={35} />
            <SceneBoundary fallback={<OnboardingScene geometry={FALLBACK_SPHERE} />}>
              <Suspense fallback={null}>
                <BustOnboarding />
              </Suspense>
            </SceneBoundary>
          </View>
        </div>

        <p
          className="absolute z-30 inset-x-4 top-[18%] text-center font-serif text-2xl italic md:text-4xl"
          style={{ opacity: "var(--whisper-in)", ...TEXT_SHADOW }}
        >
          {ONBOARDING.whisperIn}
        </p>
        <div className="absolute z-30 inset-x-0 bottom-[12%] flex flex-col items-center gap-3 px-4 text-center">
          <p
            className="cap-trim font-display text-[clamp(4rem,14vw,13rem)] uppercase leading-[0.85]"
            style={{ clipPath: "inset(0 calc((1 - var(--name)) * 100%) 0 0)", ...TEXT_SHADOW }}
          >
            {ONBOARDING.name}
          </p>
          <p className="font-mono text-xs uppercase tracking-[0.24em]" style={{ opacity: "var(--name)", ...TEXT_SHADOW }}>
            {ONBOARDING.role}
          </p>
        </div>
        <p
          className="absolute z-30 inset-x-4 top-[18%] text-center font-serif text-2xl italic md:text-4xl"
          style={{ opacity: "var(--whisper-out)", ...TEXT_SHADOW }}
        >
          {ONBOARDING.whisperOut}
        </p>
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-field" style={{ opacity: "var(--flood)" }} />
        <div aria-hidden className="scroll-hint absolute z-30 inset-x-0 bottom-4 flex justify-center md:bottom-8">
          <div className="flex flex-col items-center gap-3" style={{ opacity: "var(--hint)" }}>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-bone/85" style={TEXT_SHADOW}>
              {ONBOARDING.scroll}
            </span>
            <span className="relative h-10 w-px bg-bone/30">
              <span className="scroll-hint-dot absolute -left-[2px] top-0 size-[5px] rounded-full bg-bone" />
            </span>
          </div>
        </div>
        <a
          href="#hero"
          className="absolute z-30 bottom-4 right-4 font-mono text-xs uppercase tracking-[0.2em] text-bone/85 hover:text-bone md:bottom-8 md:right-8"
          style={TEXT_SHADOW}
        >
          {ONBOARDING.skip}
        </a>
      </div>
    </section>
  );
}
