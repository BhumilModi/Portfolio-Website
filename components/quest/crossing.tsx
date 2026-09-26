"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PerspectiveCamera, View } from "@react-three/drei";
import { CROSSING } from "@/lib/content";
import { DESCENT_FOV, DESCENT_S, backdropOpacity, coldness, isDone, timelineAt, titleOpacity, type Direction } from "@/lib/descent";
import { quest } from "@/lib/quest";
import { CROSS_EVENT, scene } from "@/lib/scene";
import { smoothstep } from "@/lib/timeline";
import DescentScene from "@/components/experience/descent-scene";
import SceneBoundary from "@/components/experience/scene-boundary";
import { setRealm } from "./sound";

// Mirror --color-field and --color-abyss: the backdrop behind the canvas cools as the camera falls.
const FIELD = [154, 42, 20];
const ABYSS = [5, 8, 10];
const FALLBACK_S = 1;
let crossings = 0; // this session; a repeat crossing runs at 2×

type Run = { direction: Direction; speed: number; fallback: boolean };
const destination = (d: Direction) => (d === "down" ? { path: "/underworld", href: "/underworld" } : { path: "/", href: "/#hero" });

/** The crossing between realms (spec §3). Listens for cross() from lib/scene.ts. */
export default function Crossing() {
  const router = useRouter();
  const pathname = usePathname();
  const [run, setRun] = useState<Run | null>(null);
  const [pushedTo, setPushedTo] = useState<string | null>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLParagraphElement>(null);
  const skip = useRef(false);
  const leaving = run !== null && pushedTo === pathname;

  useEffect(() => {
    const onCross = (e: Event) => {
      const direction = (e as CustomEvent<Direction>).detail;
      const fallback = scene.reducedMotion || document.documentElement.classList.contains("no-webgl");
      setRun((current) => current ?? { direction, speed: crossings > 0 ? 2 : 1, fallback });
    };
    window.addEventListener(CROSS_EVENT, onCross);
    return () => window.removeEventListener(CROSS_EVENT, onCross);
  }, []);

  // Drive the timeline, paint the DOM layers, switch the music, and navigate at the end.
  useEffect(() => {
    if (!run) return;
    const { direction, speed, fallback } = run;
    const { path, href } = destination(direction);
    crossings += 1;
    skip.current = false;
    if (direction === "down") quest.cross();
    router.prefetch(path);
    const root = document.documentElement;
    const t0 = performance.now();
    let switched = false;
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = skip.current ? Infinity : (now - t0) / 1000;
      let t: number;
      let done: boolean;
      let cover: number;
      if (fallback) {
        const f = Math.min(1, elapsed / FALLBACK_S);
        t = direction === "down" ? f * DESCENT_S : (1 - f) * DESCENT_S;
        done = f >= 1;
        cover = direction === "down" ? smoothstep(0, 0.4, f) : 1;
      } else {
        t = timelineAt(elapsed, direction, speed);
        done = isDone(elapsed, direction, speed);
        cover = direction === "down" ? backdropOpacity(t) : 1;
      }
      scene.crossingT = t;

      const c = coldness(t);
      if (backdrop.current) {
        backdrop.current.style.backgroundColor = `rgb(${FIELD.map((v, i) => Math.round(v + (ABYSS[i] - v) * c)).join(",")})`;
        backdrop.current.style.opacity = String(cover);
      }
      if (title.current) title.current.style.opacity = String(titleOpacity(t));
      // Once the backdrop is opaque, take the page out of layout so its own 3D views stop drawing over the descent.
      if (cover >= 0.999) root.dataset.crossing = "";
      if (!switched && (direction === "down" ? t >= 1.8 : t <= 3)) {
        switched = true;
        setRealm(direction === "down" ? "underworld" : "olympus");
      }
      if (done) {
        setPushedTo(path);
        router.push(href);
        return; // ponytail: no timeout if navigation never lands; add one if that is ever seen in the wild
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") skip.current = true;
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
    };
  }, [run, router]);

  // The destination has mounted under the overlay: reveal it, fade the overlay, then unmount.
  useEffect(() => {
    if (!leaving) return;
    delete document.documentElement.dataset.crossing;
    // The router's hash scroll ran while the page was display:none; redo it now that it has layout.
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
    const id = setTimeout(() => {
      setRun(null);
      setPushedTo(null);
    }, 600);
    return () => clearTimeout(id);
  }, [leaving]);

  if (!run) return null;
  return (
    <div id="crossing" data-leaving={leaving ? "" : undefined}>
      <div ref={backdrop} className="crossing-backdrop" onClick={() => (skip.current = true)} />
      {!run.fallback && !leaving && (
        <View className="crossing-view">
          <PerspectiveCamera makeDefault fov={DESCENT_FOV} near={0.1} far={200} />
          <SceneBoundary fallback={null}>
            <Suspense fallback={null}>
              <DescentScene />
            </Suspense>
          </SceneBoundary>
        </View>
      )}
      <div className="crossing-hud">
        {run.direction === "down" && (
          <p ref={title} aria-live="polite" className="soul-glow cap-trim font-display text-[clamp(3rem,10vw,8rem)] uppercase leading-[0.9]" style={{ opacity: 0 }}>
            {CROSSING.title}
          </p>
        )}
        <button type="button" className="crossing-skip font-mono text-xs uppercase tracking-[0.2em]" onClick={() => (skip.current = true)}>
          {CROSSING.skip}
        </button>
      </div>
    </div>
  );
}
