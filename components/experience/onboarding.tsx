"use client";
import { Suspense, useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { PerspectiveCamera, View, useProgress } from "@react-three/drei";
import { ONBOARDING } from "@/lib/content";
import { scene } from "@/lib/scene";
import { clamp01, fadeInOut, local, smoothstep } from "@/lib/timeline";
import OnboardingScene, { BustOnboarding, FALLBACK_SPHERE } from "./onboarding-scene";
import SceneBoundary from "./scene-boundary";

// `<main>` (app/page.tsx) is `relative z-10`, which forms a stacking context: no z-index
// inside it, however high, can paint above the fixed z-20 <Canvas> in stage.tsx. Portaling
// the text/control layer to document.body escapes that trap and sits as a true sibling of
// the canvas, so z-30 here actually wins.
const DEFAULT_VARS = { "--counter": 1, "--whisper-in": 0, "--name": 0, "--whisper-out": 0, "--flood": 0 } as React.CSSProperties;
// Crisp near-offsets stand the glyphs off the bright engraved bust; the wider blur adds a
// soft halo for the busy hatched background behind it. Void only, per the constraints.
const TEXT_SHADOW = {
  textShadow:
    "0 0 1px var(--color-void), 0 1px 1px var(--color-void), 0 -1px 1px var(--color-void), 1px 0 1px var(--color-void), -1px 0 1px var(--color-void), 0 2px 8px var(--color-void)",
};
const noopSubscribe = () => () => {};

export default function Onboarding() {
  const track = useRef<HTMLElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  // The portal target (document.body) only exists client-side, and lives outside #onboarding
  // so the `#onboarding { display: none }` reduced-motion rule (globals.css) can't reach it —
  // gate it here too. Mirrors the SSR snapshot (false) vs. client snapshot without calling
  // setState from an effect.
  const showOverlay = useSyncExternalStore(noopSubscribe, () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => false);
  const loaded = Math.round(useProgress((s) => s.progress));

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let raf = 0;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const set = (k: string, v: number) => {
        const val = v.toFixed(3);
        el.style.setProperty(k, val);
        overlay.current?.style.setProperty(k, val);
      };
      const tick = () => {
        const rect = el.getBoundingClientRect();
        const p = clamp01(-rect.top / Math.max(1, rect.height - window.innerHeight));
        scene.progress = p;
        set("--counter", 1 - smoothstep(0, 0.4, local(p, "coalesce")));
        set("--whisper-in", fadeInOut(local(p, "radiance")));
        set("--name", smoothstep(0, 0.5, local(p, "name")) * (1 - smoothstep(0.2, 0.6, local(p, "descent"))));
        set("--whisper-out", fadeInOut(local(p, "descent")));
        set("--flood", smoothstep(0.55, 1, local(p, "descent")));
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && document.activeElement === document.body && scene.progress < 1) {
        document.querySelector<HTMLAnchorElement>('a[href="#hero"]')?.click();
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
      className="relative h-[400vh] bg-void text-bone"
      style={DEFAULT_VARS}
    >
      <div className="sticky top-0 h-dvh overflow-hidden">
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
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-field" style={{ opacity: "var(--flood)" }} />
      </div>

      {showOverlay &&
        createPortal(
          <div ref={overlay} className="pointer-events-none fixed inset-0 z-30" style={DEFAULT_VARS}>
            <p
              className="absolute left-4 top-4 font-mono text-xs uppercase tracking-[0.2em] md:left-8 md:top-8"
              style={{ opacity: "var(--counter)", ...TEXT_SHADOW }}
            >
              {ONBOARDING.mark} · {String(loaded).padStart(3, "0")}%
            </p>
            <p
              className="absolute inset-x-4 top-[18%] text-center font-serif text-2xl italic md:text-4xl"
              style={{ opacity: "var(--whisper-in)", ...TEXT_SHADOW }}
            >
              {ONBOARDING.whisperIn}
            </p>
            <div className="absolute inset-x-0 bottom-[12%] flex flex-col items-center gap-3 px-4 text-center">
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
              className="absolute inset-x-4 top-[18%] text-center font-serif text-2xl italic md:text-4xl"
              style={{ opacity: "var(--whisper-out)", ...TEXT_SHADOW }}
            >
              {ONBOARDING.whisperOut}
            </p>
            <a
              href="#hero"
              className="pointer-events-auto absolute bottom-4 right-4 font-mono text-xs uppercase tracking-[0.2em] text-bone/85 hover:text-bone md:bottom-8 md:right-8"
              style={TEXT_SHADOW}
            >
              {ONBOARDING.skip}
            </a>
          </div>,
          document.body,
        )}
    </section>
  );
}
