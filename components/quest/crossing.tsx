"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PerspectiveCamera, View } from "@react-three/drei";
import { CROSSING, SYSTEM } from "@/lib/content";
import {
  DESCENT_FOV, DESCENT_S, GATE_CUT,
  backdropOpacity, coldness, flashOpacity, isDone, noticeShown, scanline, timelineAt, type Direction,
} from "@/lib/descent";
import { quest } from "@/lib/quest";
import { BACKDROP_READY_EVENT, CROSS_EVENT, scene } from "@/lib/scene";
import { smoothstep } from "@/lib/timeline";
import Spirit from "@/components/experience/spirit";
import DescentScene from "@/components/experience/descent-scene";
import SceneBoundary from "@/components/experience/scene-boundary";
import SystemWindow from "@/components/underworld/system-window";
import { setRealm } from "./sound";

// Mirror --color-field and --color-abyss: the backdrop behind the canvas cools as the camera falls.
const FIELD = [154, 42, 20];
const ABYSS = [5, 7, 13];
const FALLBACK_S = 1;
/** Reduced motion: the notice opens halfway through the crossfade and is held this long before the page swaps in.
 * Must clear 1s of full opacity after its own 150ms fade-in (rd-constraints.md's "held fully visible for at least 1s"). */
const NOTICE_HOLD_S = 1.2;
/** ponytail: the longest the crossing waits for /underworld to compile before revealing it anyway. */
const BACKDROP_WAIT_MS = 4000;
let crossings = 0; // this session; a repeat crossing runs at 2×

/** awaitBackdrop: the destination draws WebGL, so hold the overlay until its programs are compiled. */
type Run = { direction: Direction; speed: number; fallback: boolean; awaitBackdrop: boolean };
const destination = (d: Direction) => (d === "down" ? { path: "/underworld", href: "/underworld" } : { path: "/", href: "/#hero" });
// The spirit pass once the Sanzu is on screen; before the cut the engraving draws straight, keeping its flat colours.
const spiritNow = () => scene.crossingT >= GATE_CUT;

/** The crossing between realms (redesign spec §4). Listens for cross() from lib/scene.ts. */
export default function Crossing() {
  const router = useRouter();
  const pathname = usePathname();
  const [run, setRun] = useState<Run | null>(null);
  const [pushedTo, setPushedTo] = useState<string | null>(null);
  const [notice, setNotice] = useState(false);
  const [viewReady, setViewReady] = useState(false);
  const [backdropReady, setBackdropReady] = useState(false);
  const running = useRef(false);
  const backdrop = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const scan = useRef<HTMLDivElement>(null);
  const skip = useRef(false);
  const arrived = run !== null && pushedTo === pathname;
  const leaving = arrived && (!run.awaitBackdrop || backdropReady);
  // Compiling at the start, or at the end waiting on the destination: say so, rather than look frozen.
  const loading = run !== null && ((!run.fallback && !viewReady) || (arrived && !leaving));
  useEffect(() => {
    running.current = run !== null;
  }, [run]);

  useEffect(() => {
    const onCross = (e: Event) => {
      const direction = (e as CustomEvent<Direction>).detail;
      const noWebgl = document.documentElement.classList.contains("no-webgl");
      const fallback = scene.reducedMotion || noWebgl;
      setRun((current) => current ?? { direction, speed: crossings > 0 ? 2 : 1, fallback, awaitBackdrop: direction === "down" && !noWebgl });
    };
    // Only a backdrop mounted by this crossing counts; a direct visit to /underworld fires it with no run.
    const onBackdrop = () => running.current && setBackdropReady(true);
    window.addEventListener(CROSS_EVENT, onCross);
    window.addEventListener(BACKDROP_READY_EVENT, onBackdrop);
    return () => {
      window.removeEventListener(CROSS_EVENT, onCross);
      window.removeEventListener(BACKDROP_READY_EVENT, onBackdrop);
    };
  }, []);

  // A backdrop that never reports ready (a GPU error) must not trap the visitor under the overlay.
  useEffect(() => {
    if (!arrived || leaving) return;
    const id = setTimeout(() => setBackdropReady(true), BACKDROP_WAIT_MS);
    return () => clearTimeout(id);
  }, [arrived, leaving]);

  // Drive the timeline, paint the DOM layers, switch the music, and navigate at the end.
  // It starts once the descent's programs are compiled (Spirit's onReady), so t=0 is a real first frame.
  useEffect(() => {
    if (!run || (!run.fallback && !viewReady)) return;
    const { direction, speed, fallback } = run;
    const { path, href } = destination(direction);
    crossings += 1;
    skip.current = false;
    if (direction === "down") quest.cross();
    router.prefetch(path);
    const root = document.documentElement;
    const t0 = performance.now();
    let switched = false;
    let noticeOn = false;
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = skip.current ? Infinity : (now - t0) / 1000;
      let t: number;
      let done: boolean;
      let cover: number;
      let showNotice: boolean;
      if (fallback) {
        const f = Math.min(1, elapsed / FALLBACK_S);
        t = direction === "down" ? f * DESCENT_S : (1 - f) * DESCENT_S;
        cover = direction === "down" ? smoothstep(0, 0.4, f) : 1;
        showNotice = direction === "down" && f >= 0.5;
        done = direction === "down" ? elapsed >= FALLBACK_S / 2 + NOTICE_HOLD_S : f >= 1;
      } else {
        t = timelineAt(elapsed, direction, speed);
        done = isDone(elapsed, direction, speed);
        cover = direction === "down" ? backdropOpacity(t) : 1;
        showNotice = direction === "down" && noticeShown(t);
      }
      scene.crossingT = t;

      const c = coldness(t);
      if (backdrop.current) {
        backdrop.current.style.backgroundColor = `rgb(${FIELD.map((v, i) => Math.round(v + (ABYSS[i] - v) * c)).join(",")})`;
        backdrop.current.style.opacity = String(cover);
      }
      // The System boots: a blue flash peaking at the cut, with a scanline sweeping down under it.
      const f = flashOpacity(t);
      if (flash.current) flash.current.style.opacity = String(f);
      if (scan.current) {
        scan.current.style.opacity = f > 0.02 ? "1" : "0";
        scan.current.style.transform = `translateY(${scanline(t) * window.innerHeight}px)`;
      }
      if (showNotice && !noticeOn) {
        noticeOn = true;
        setNotice(true);
      }
      // Once the backdrop is opaque, take the page out of layout so its own 3D views stop drawing over the descent.
      if (cover >= 0.999) root.dataset.crossing = "";
      if (!switched && (direction === "down" ? t >= 1.8 : t <= 3)) {
        switched = true;
        setRealm(direction === "down" ? "underworld" : "olympus");
      }
      if (done) {
        // The overlay's notice sits exactly where the Arrival's will; tell the Arrival not to open a second one.
        if (direction === "down") scene.noticeCarried = noticeOn;
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
  }, [run, viewReady, router]);

  // The destination has mounted under the overlay: reveal it, fade the overlay, then unmount.
  useEffect(() => {
    if (!leaving) return;
    delete document.documentElement.dataset.crossing;
    // The router's hash scroll ran while the page was display:none; redo it now that it has layout.
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
    const id = setTimeout(() => {
      setRun(null);
      setPushedTo(null);
      setNotice(false);
      setViewReady(false);
      setBackdropReady(false);
    }, 600);
    return () => clearTimeout(id);
  }, [leaving]);

  if (!run) return null;
  return (
    <div id="crossing" data-leaving={leaving ? "" : undefined}>
      <div ref={backdrop} className="crossing-backdrop" onClick={() => (skip.current = true)} />
      {!run.fallback && !leaving && (
        <View className="crossing-view" visible={false}>
          <PerspectiveCamera makeDefault fov={DESCENT_FOV} near={0.1} far={400} />
          <Spirit on={spiritNow} onReady={() => setViewReady(true)} />
          <SceneBoundary fallback={null}>
            <DescentScene />
          </SceneBoundary>
        </View>
      )}
      <div className="crossing-hud">
        {!run.fallback && (
          <>
            <div ref={flash} aria-hidden className="crossing-flash" />
            <div ref={scan} aria-hidden className="crossing-scan" />
          </>
        )}
        {notice && (
          <div className="crossing-notice">
            <div className="mx-auto w-full max-w-[1280px] px-4 md:px-8">
              <SystemWindow notice className="w-fit max-w-[34rem]">
                {SYSTEM.entered}
              </SystemWindow>
            </div>
          </div>
        )}
        <div aria-hidden className="crossing-loader" data-on={loading ? "" : undefined}>
          <span className="flex items-baseline gap-3 font-mono text-xs uppercase tracking-[0.2em]">
            <span className="system-glow text-system">{SYSTEM.tag}</span>
            {CROSSING.loading}
          </span>
          <span className="crossing-loader-bar" />
        </div>
        <button type="button" className="crossing-skip font-mono text-xs uppercase tracking-[0.2em]" onClick={() => (skip.current = true)}>
          {CROSSING.skip}
        </button>
      </div>
    </div>
  );
}
