"use client";
import { useMemo, useState } from "react";
import { PLAN_EDGES, createRenderCache, type RenderMode } from "@/lib/daedalus";

type Highlight = "all" | "measured" | "assumed";

export default function DaedalusDemo() {
  const cache = useMemo(() => createRenderCache(), []);
  const [highlight, setHighlight] = useState<Highlight>("all");
  const [mode, setMode] = useState<RenderMode>("geometry");
  const [scan, setScan] = useState(1);
  const [last, setLast] = useState<{ key: string; hit: boolean } | null>(null);

  const label = mode === "geometry" ? "geometry stack" : "image model";
  const message = !last
    ? `scan ${scan} · ${label}`
    : mode === "geometry"
      ? "measured from depth · recomputed every time"
      : last.hit
        ? `cache hit · key ${last.key}`
        : `rendered · cached as ${last.key}`;

  return (
    <div className="flex flex-col gap-5 border border-bone/30 p-5">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-bone/85">Draw a room · illustration — not client data</p>
      <svg viewBox="0 0 100 70" role="img" aria-label="Floor plan: solid edges are measured, dashed edges are assumed" className="w-full bg-void">
        {PLAN_EDGES.map((e) => {
          const dim = highlight !== "all" && (highlight === "measured") !== e.measured;
          return (
            <line
              key={e.id}
              x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
              stroke={mode === "model" ? "var(--color-ember)" : "var(--color-bone)"}
              strokeWidth={0.8}
              strokeDasharray={e.measured ? undefined : "2 1.5"}
              opacity={dim ? 0.15 : 1}
              className="transition-opacity duration-300"
            />
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-2">
        {(["all", "measured", "assumed"] as const).map((h) => (
          <button key={h} type="button" aria-pressed={highlight === h} onClick={() => setHighlight(h)} className="demo-btn">{h}</button>
        ))}
        <span aria-hidden className="mx-1 w-px bg-bone/30" />
        {(["geometry", "model"] as const).map((m) => (
          <button key={m} type="button" aria-pressed={mode === m} onClick={() => { setMode(m); setLast(null); }} className="demo-btn">
            {m === "geometry" ? "geometry stack" : "image model"}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setLast(mode === "model" ? cache.render(`scan-${scan}`, mode) : { key: "", hit: false })} className="demo-btn">▶ render</button>
        <button type="button" onClick={() => { setScan((s) => s + 1); setLast(null); }} className="demo-btn">↻ rescan</button>
        <p aria-live="polite" className="font-mono text-xs text-bone/85">{message}</p>
      </div>
    </div>
  );
}
