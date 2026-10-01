"use client";
import { useEffect, useRef, useState } from "react";
import { ARENA, SYSTEM } from "@/lib/content";
import { EMPTY_TALLY, ROUND_MS, hitScore, isHit, lifespanMs, spawn, summarize, targetRadius, verdict, type Point, type Tally } from "@/lib/arena";
import { rankFor } from "@/lib/rank";
import { quest, type Best } from "@/lib/quest";
import { useQuest } from "@/components/quest/use-quest";
import { playHit } from "@/components/quest/sound";
import SystemWindow from "./system-window";
import { summon } from "./arise";

type Screen = "lobby" | "countdown" | "live" | "done";
type Target = Point & { born: number; life: number };
type Burst = Point & { born: number };
// Mirror --color-spirit, --color-seal and --color-bone. Interim: Task 7 of the spirit plan redraws the sigils.
const SYSTEM_BLUE = "#52f5d6";
const MONARCH = "#b31f27";
const MIST = "#efe6d4";
const TAU = Math.PI * 2;
const BURST_MS = 220;

/** A sigil: a violet haze, a System-blue ring with turning ticks, a counter-turning violet hexagram, a mist core; the outer arc drains with its life. */
function draw(ctx: CanvasRenderingContext2D, w: number, h: number, target: Target, clock: number, bursts: Burst[], r: number) {
  ctx.clearRect(0, 0, w, h);
  const life = Math.max(0, 1 - (clock - target.born) / target.life);
  const { x, y } = target;
  const spin = clock * 0.0015;
  ctx.save();
  ctx.globalAlpha = 0.3 + 0.7 * life;
  const haze = ctx.createRadialGradient(x, y, r * 0.1, x, y, r * 1.7);
  haze.addColorStop(0, "rgba(139, 92, 246, 0.55)");
  haze.addColorStop(0.5, "rgba(74, 168, 255, 0.18)");
  haze.addColorStop(1, "rgba(74, 168, 255, 0)");
  ctx.fillStyle = haze;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.7, 0, TAU);
  ctx.fill();
  ctx.shadowColor = SYSTEM_BLUE;
  ctx.shadowBlur = 12;
  ctx.strokeStyle = SYSTEM_BLUE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = spin + (i * TAU) / 8;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.78);
    ctx.lineTo(x + Math.cos(a) * r * 0.92, y + Math.sin(a) * r * 0.92);
    ctx.stroke();
  }
  ctx.strokeStyle = MONARCH;
  ctx.shadowColor = MONARCH;
  ctx.lineWidth = 1.5;
  for (const off of [0, Math.PI]) {
    ctx.beginPath();
    for (let k = 0; k < 3; k++) {
      const a = -spin * 0.6 + off + (k * TAU) / 3 - Math.PI / 2;
      const px = x + Math.cos(a) * r * 0.62;
      const py = y + Math.sin(a) * r * 0.62;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  }
  ctx.fillStyle = MIST;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.12, 0, TAU);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = MIST;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.18, -Math.PI / 2, -Math.PI / 2 + TAU * life);
  ctx.stroke();
  ctx.restore();
  // Banished: a white-hot core, a sharp ring and eight shards flying out, all in BURST_MS with a strong ease-out.
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i];
    const k = (clock - b.born) / BURST_MS;
    if (k >= 1) {
      bursts.splice(i, 1);
      continue;
    }
    const e = 1 - Math.pow(1 - k, 3);
    ctx.globalAlpha = 1 - k;
    ctx.strokeStyle = SYSTEM_BLUE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(b.x, b.y, r * (0.9 + e * 1.1), 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = MIST;
    for (let s = 0; s < 8; s++) {
      const a = (s * TAU) / 8 + 0.2;
      const r0 = r * (0.4 + e * 1.2);
      const r1 = r0 + r * 0.45 * (1 - k);
      ctx.beginPath();
      ctx.moveTo(b.x + Math.cos(a) * r0, b.y + Math.sin(a) * r0);
      ctx.lineTo(b.x + Math.cos(a) * r1, b.y + Math.sin(a) * r1);
      ctx.stroke();
    }
    if (k < 0.35) {
      ctx.globalAlpha = 1 - k / 0.35;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(b.x, b.y, r * 0.5 * (1 - k), 0, TAU);
      ctx.fill();
    }
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
  const skip = () => {
    quest.skipTrial();
    summon();
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

  const rank = result ? rankFor(result.score, ARENA.ryumaBest) : null;

  return (
    <section id="trial" aria-labelledby="trial-title" className="mx-auto w-full max-w-[1280px] px-4 py-24 md:px-8">
      <div className="flex flex-col gap-4">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-spirit">{ARENA.label}</p>
        <h2 id="trial-title" className="cap-trim font-display text-[clamp(3rem,7vw,6rem)] uppercase leading-[0.9]">{ARENA.title}</h2>
      </div>
      <div className="arena-field relative mt-10 aspect-[3/4] w-full overflow-hidden sm:aspect-[16/10]">
        <canvas
          ref={canvas}
          aria-label={ARENA.canvasLabel}
          className="absolute inset-0 size-full"
          style={{ touchAction: screen === "live" ? "none" : "auto", cursor: screen === "live" ? "crosshair" : "default" }}
        />

        {screen === "live" && (
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 flex justify-between p-4 font-mono text-xs uppercase tracking-[0.16em] text-bone">
            <span>{hud.timeLeft}s</span>
            <span className="tabular-nums">{hud.score.toLocaleString()}</span>
            <span>×{hud.streak}</span>
          </div>
        )}

        {screen === "lobby" && (
          <div className="absolute inset-0 grid place-items-center p-4 sm:p-6">
            <SystemWindow heading={ARENA.briefing.heading} level={3} className="w-full max-w-[26rem]">
              <ul className="flex flex-col gap-1.5 font-serif text-xl">
                {ARENA.briefing.lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" className="sys-btn sys-btn-primary" onClick={start}>
                  {ARENA.start}
                </button>
                <button type="button" className="sys-btn" onClick={skip}>
                  {ARENA.skip}
                </button>
              </div>
              {best && (
                <p className="mt-5 font-mono text-xs uppercase tracking-[0.16em] text-bone/70">
                  {ARENA.yourBest} · {ARENA.rank} {rankFor(best.score, ARENA.ryumaBest)} · <span className="tabular-nums">{best.score.toLocaleString()}</span>
                </p>
              )}
            </SystemWindow>
          </div>
        )}

        {screen === "countdown" && (
          <div aria-live="assertive" className="system-glow absolute inset-0 grid place-items-center font-display text-[clamp(6rem,20vw,14rem)]">
            {count}
          </div>
        )}

        {screen === "done" && result && rank && (
          <div className="absolute inset-0 grid place-items-center overflow-y-auto p-4 sm:p-6">
            <div aria-live="polite" className="flex w-full max-w-[30rem] flex-col gap-3">
              {result.newBest && <SystemWindow notice>{SYSTEM.levelUp}</SystemWindow>}
              <SystemWindow heading={ARENA.resultHeading} level={3}>
                <div className="flex items-end justify-between gap-6">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-bone/70">{ARENA.rank}</p>
                    <p className="rank-letter font-display" data-rank={rank}>
                      {rank}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-5xl leading-none tabular-nums">
                      <span className="sr-only">{ARENA.you} </span>
                      {result.score.toLocaleString()}
                    </p>
                    <p className="mt-2 font-mono text-xs uppercase tracking-[0.14em] text-bone/70">
                      {ARENA.ryuma} <span className="tabular-nums">{ARENA.ryumaBest.toLocaleString()}</span>
                    </p>
                  </div>
                </div>
                <p className="mt-4 font-serif text-lg italic">{verdict(result.score, ARENA.ryumaBest) === "taken" ? ARENA.taken : ARENA.held}</p>
                <dl className="mt-4 grid grid-cols-3 gap-4 border-t border-spirit/25 pt-4 font-mono text-xs uppercase tracking-[0.14em]">
                  <div>
                    <dt className="text-bone/60">{ARENA.stats.hits}</dt>
                    <dd className="mt-1 text-base tabular-nums">{result.hits}</dd>
                  </div>
                  <div>
                    <dt className="text-bone/60">{ARENA.stats.accuracy}</dt>
                    <dd className="mt-1 text-base tabular-nums">{Math.round(result.accuracy * 100)}%</dd>
                  </div>
                  <div>
                    <dt className="text-bone/60">{ARENA.stats.reaction}</dt>
                    <dd className="mt-1 text-base tabular-nums">{result.reactionMs} ms</dd>
                  </div>
                </dl>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" className="sys-btn" onClick={start}>
                    {ARENA.again}
                  </button>
                  <button type="button" className="sys-btn sys-btn-primary" onClick={summon}>
                    {ARENA.arise}
                  </button>
                </div>
              </SystemWindow>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
