"use client";
import { useEffect, useRef, useState } from "react";
import { ARENA, SYSTEM } from "@/lib/content";
import { EMPTY_TALLY, ROUND_MS, hitScore, isHit, lifespanMs, spawn, summarize, targetRadius, verdict, type Point, type Tally } from "@/lib/arena";
import { quest, type Best } from "@/lib/quest";
import { useQuest } from "@/components/quest/use-quest";
import { playHit } from "@/components/quest/sound";

type Screen = "lobby" | "countdown" | "live" | "done";
type Target = Point & { born: number; life: number };
type Burst = Point & { born: number };
const SOULFIRE = "#4aa8ff";
const ASPHODEL = "#cfd8e3";
const ABYSS = "#05070d";

/** A shade: a pale mask with hollow eyes in a system haze, fading and ringed by its remaining life. */
function draw(ctx: CanvasRenderingContext2D, w: number, h: number, target: Target, clock: number, bursts: Burst[], r: number) {
  ctx.clearRect(0, 0, w, h);
  const life = Math.max(0, 1 - (clock - target.born) / target.life);
  const { x, y } = target;
  ctx.save();
  ctx.globalAlpha = 0.25 + 0.75 * life;
  const haze = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 1.6);
  haze.addColorStop(0, "rgba(74, 168, 255, 0.5)");
  haze.addColorStop(1, "rgba(74, 168, 255, 0)");
  ctx.fillStyle = haze;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = ASPHODEL;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.78, r, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = ABYSS;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(x + s * r * 0.32, y - r * 0.18, r * 0.17, r * 0.24, s * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.42, r * 0.14, r * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = SOULFIRE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.15, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * life);
  ctx.stroke();
  ctx.restore();
  // Banished: an expanding system ring over 250ms.
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i];
    const k = (clock - b.born) / 250;
    if (k >= 1) {
      bursts.splice(i, 1);
      continue;
    }
    ctx.globalAlpha = 1 - k;
    ctx.strokeStyle = SOULFIRE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(b.x, b.y, r * (1 + k * 1.5), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export default function Arena() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [screen, setScreen] = useState<Screen>("lobby");
  const [count, setCount] = useState(3);
  const [hud, setHud] = useState({ timeLeft: ROUND_MS / 1000, score: 0, streak: 0 });
  const [result, setResult] = useState<(Best & { newBest: boolean }) | null>(null);
  const { best } = useQuest();

  const start = () => {
    setResult(null);
    setHud({ timeLeft: ROUND_MS / 1000, score: 0, streak: 0 });
    setCount(3);
    setScreen("countdown");
  };

  useEffect(() => {
    if (screen !== "countdown") return;
    let n = 3;
    const id = setInterval(() => {
      n -= 1;
      if (n > 0) setCount(n);
      else {
        clearInterval(id);
        setScreen("live");
      }
    }, 700);
    return () => clearInterval(id);
  }, [screen]);

  useEffect(() => {
    if (screen !== "live") return;
    const el = canvas.current!;
    const ctx = el.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio, 2);
    let w = 0;
    let h = 0;
    const resize = () => {
      const r = el.getBoundingClientRect();
      w = r.width;
      h = r.height;
      el.width = Math.round(w * dpr);
      el.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    let clock = 0; // round time in ms; stops while the tab is hidden
    let last = performance.now();
    let tally: Tally = EMPTY_TALLY;
    let streak = 0;
    let shown = { timeLeft: -1, score: -1, streak: -1 };
    const bursts: Burst[] = [];
    const next = (prev?: Point): Target => ({ ...spawn(Math.random, w, h, targetRadius(w, h), prev), born: clock, life: lifespanMs(clock) });
    let target = next();
    let raf = 0;

    const onDown = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const p = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      if (isHit(p, target, targetRadius(w, h))) {
        const reaction = clock - target.born;
        tally = { ...tally, score: tally.score + hitScore(reaction, target.life, streak), hits: tally.hits + 1, reactionTotalMs: tally.reactionTotalMs + reaction };
        streak += 1;
        bursts.push({ x: target.x, y: target.y, born: clock });
        playHit();
        target = next(target);
      } else {
        tally = { ...tally, misses: tally.misses + 1 };
        streak = 0;
      }
    };
    el.addEventListener("pointerdown", onDown);

    const frame = (now: number) => {
      if (!document.hidden) clock += Math.min(now - last, 100); // a stalled or hidden frame doesn't eat the round
      last = now;
      if (clock >= ROUND_MS) {
        const run = summarize(tally);
        setResult({ ...run, newBest: quest.record(run) });
        setScreen("done");
        return;
      }
      if (clock - target.born >= target.life) {
        tally = { ...tally, misses: tally.misses + 1 };
        streak = 0;
        target = next(target);
      }
      draw(ctx, w, h, target, clock, bursts, targetRadius(w, h));
      const timeLeft = Math.ceil((ROUND_MS - clock) / 1000);
      if (timeLeft !== shown.timeLeft || tally.score !== shown.score || streak !== shown.streak) {
        shown = { timeLeft, score: tally.score, streak };
        setHud(shown);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setScreen("lobby");
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
      ctx.clearRect(0, 0, w, h);
    };
  }, [screen]);

  return (
    <section id="trial" aria-labelledby="trial-title" className="mx-auto w-full max-w-[1280px] px-4 py-24 md:px-8">
      <div className="flex flex-col gap-4">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-system">{ARENA.label}</p>
        <h2 id="trial-title" className="cap-trim font-display text-[clamp(3rem,7vw,6rem)] uppercase leading-[0.9]">{ARENA.title}</h2>
      </div>
      <div className="relative mt-10 aspect-[3/4] w-full overflow-hidden border border-mist/25 bg-abyss/80 sm:aspect-[16/10]">
        <canvas
          ref={canvas}
          aria-label={ARENA.canvasLabel}
          className="absolute inset-0 size-full"
          style={{ touchAction: screen === "live" ? "none" : "auto", cursor: screen === "live" ? "crosshair" : "default" }}
        />

        {screen === "live" && (
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 flex justify-between p-4 font-mono text-xs uppercase tracking-[0.16em]">
            <span>{hud.timeLeft}s</span>
            <span>{hud.score.toLocaleString()}</span>
            <span>×{hud.streak}</span>
          </div>
        )}

        {screen === "lobby" && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <div className="flex flex-col items-center gap-6">
              <p className="font-serif text-2xl italic">{ARENA.briefing.lines.join(" ")}</p>
              <div className="flex flex-wrap justify-center gap-3">
                <button type="button" className="arena-btn arena-btn-primary" onClick={start}>{ARENA.start}</button>
                <a href="#card" className="arena-btn" onClick={() => quest.skipTrial()}>{ARENA.skip}</a>
              </div>
              {best && (
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-mist/70">
                  {ARENA.yourBest} {best.score.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}

        {screen === "countdown" && (
          <div aria-live="assertive" className="system-glow absolute inset-0 grid place-items-center font-display text-[clamp(6rem,20vw,14rem)]">
            {count}
          </div>
        )}

        {screen === "done" && result && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <div aria-live="polite" className="flex flex-col items-center gap-6">
              <p className="font-display text-[clamp(2.5rem,7vw,5rem)] uppercase leading-none">
                {ARENA.you} {result.score.toLocaleString()} <span className="text-mist/40">·</span> {ARENA.ryuma} {ARENA.ryumaBest.toLocaleString()}
              </p>
              <p className="font-serif text-xl italic">{verdict(result.score, ARENA.ryumaBest) === "taken" ? ARENA.taken : ARENA.held}</p>
              <dl className="grid grid-cols-3 gap-6 font-mono text-xs uppercase tracking-[0.14em]">
                <div>
                  <dt className="text-mist/60">{ARENA.stats.hits}</dt>
                  <dd className="mt-1 text-base">{result.hits}</dd>
                </div>
                <div>
                  <dt className="text-mist/60">{ARENA.stats.accuracy}</dt>
                  <dd className="mt-1 text-base">{Math.round(result.accuracy * 100)}%</dd>
                </div>
                <div>
                  <dt className="text-mist/60">{ARENA.stats.reaction}</dt>
                  <dd className="mt-1 text-base">{result.reactionMs} ms</dd>
                </div>
              </dl>
              {result.newBest && <p className="font-mono text-xs uppercase tracking-[0.16em] text-system">{SYSTEM.levelUp}</p>}
              <div className="flex flex-wrap justify-center gap-3">
                <button type="button" className="arena-btn" onClick={start}>{ARENA.again}</button>
                <a href="#card" className="arena-btn arena-btn-primary">{ARENA.arise}</a>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
