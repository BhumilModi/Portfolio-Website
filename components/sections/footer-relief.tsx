"use client";
import { useCallback, useRef } from "react";
import Relief, { type PaintRelief } from "@/components/experience/relief";

// Tone-on-tone with the footer's red wash: a warm highlight and a deep red-brown shade (spirit spec follow-up, P).
const HIGH = "#ffd2b8";
const SHADE = "#2a0904";
const TAU = Math.PI * 2;

/** A teardrop petal from its base, pointing along angle: raised, rounded at the tip. */
function petal(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, len: number, width: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(len * 0.25, -width, len * 0.95, -width * 0.9, len, 0);
  ctx.bezierCurveTo(len * 0.95, width * 0.9, len * 0.25, width, 0, 0);
  ctx.fillStyle = "#dcdcdc";
  ctx.fill();
  ctx.restore();
}

/** A volute: a scroll curling into a raised eye, the anthemion's base and the frieze's tendrils. */
function volute(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, dir: 1 | -1, lw: number) {
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const a = dir * (Math.PI * 0.5 + t * Math.PI * 2.2);
    const rr = r * (1 - t * 0.78);
    const px = x + Math.cos(a) * rr;
    const py = y - r + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#b8b8b8";
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + dir * r * 0.05, y - r * 1.05, lw * 0.9, 0, TAU);
  ctx.fillStyle = "#e8e8e8";
  ctx.fill();
}

/** An anthemion palmette: a fan of petals over a pair of volutes. */
function palmette(ctx: CanvasRenderingContext2D, x: number, base: number, size: number) {
  const n = 9;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1) - 0.5; // -0.5 … 0.5 across the fan
    const angle = -Math.PI / 2 + t * 2.3;
    const len = size * (0.62 + 0.38 * Math.cos(t * Math.PI)); // the centre petal is tallest
    petal(ctx, x, base - size * 0.16, angle, len, size * 0.075);
  }
  // A small heart at the fan's root, then the two volutes it springs from.
  ctx.beginPath();
  ctx.ellipse(x, base - size * 0.14, size * 0.07, size * 0.09, 0, 0, TAU);
  ctx.fillStyle = "#f0f0f0";
  ctx.fill();
  volute(ctx, x - size * 0.16, base, size * 0.13, -1, size * 0.045);
  volute(ctx, x + size * 0.16, base, size * 0.13, 1, size * 0.045);
}

/** A lotus: three closed petals with two sepals curling out, between the palmettes. */
function lotus(ctx: CanvasRenderingContext2D, x: number, base: number, size: number) {
  petal(ctx, x, base, -Math.PI / 2, size * 0.72, size * 0.1);
  petal(ctx, x, base, -Math.PI / 2 - 0.36, size * 0.56, size * 0.085);
  petal(ctx, x, base, -Math.PI / 2 + 0.36, size * 0.56, size * 0.085);
  petal(ctx, x, base, Math.PI + 0.55, size * 0.34, size * 0.06);
  petal(ctx, x, base, -0.55, size * 0.34, size * 0.06);
}

/** An S-scroll tendril along the frieze's base, linking one flower to the next. */
function tendril(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, lift: number, lw: number) {
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.bezierCurveTo(x0 + (x1 - x0) * 0.35, y - lift, x0 + (x1 - x0) * 0.65, y + lift * 0.4, x1, y);
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#b0b0b0";
  ctx.stroke();
}

/** The Greek key: a running meander between two fillets, cell is one grid unit of the key. */
function meander(ctx: CanvasRenderingContext2D, x0: number, x1: number, top: number, cell: number) {
  const lw = cell * 0.46;
  ctx.lineWidth = lw;
  ctx.lineCap = "square";
  ctx.lineJoin = "miter";
  ctx.strokeStyle = "#cfcfcf";
  const y = (v: number) => top + cell + v * cell; // the key sits inside the fillets: rows 0–4
  const period = cell * 5;
  ctx.beginPath();
  for (let px = x0; px < x1; px += period) {
    const x = (v: number) => px + v * cell;
    ctx.moveTo(x(0), y(4));
    ctx.lineTo(x(0), y(0));
    ctx.lineTo(x(4), y(0));
    ctx.lineTo(x(4), y(3));
    ctx.lineTo(x(1.6), y(3));
    ctx.lineTo(x(1.6), y(1.4));
    ctx.lineTo(x(2.8), y(1.4));
    ctx.moveTo(x(0), y(4));
    ctx.lineTo(x(5), y(4));
  }
  ctx.stroke();
  // Fillets: a raised rule above and below the key.
  ctx.lineWidth = cell * 0.36;
  ctx.beginPath();
  ctx.moveTo(x0, top);
  ctx.lineTo(x1, top);
  ctx.moveTo(x0, y(4) + cell * 1.1);
  ctx.lineTo(x1, y(4) + cell * 1.1);
  ctx.stroke();
}

/**
 * Carved into the footer's red wall (after immersive-g.com's reliefs): a Greek temple frieze across the band above
 * the footer's text, anthemion palmettes alternating with lotus, linked by S-scrolls, over a running meander. Every
 * text box, link and the hidden obol is still masked out, so the carving never touches what the visitor reads or clicks.
 */
export default function FooterRelief() {
  const host = useRef<HTMLDivElement>(null);
  // What covers the footer during its sticky reveal: the page content just before it.
  const coverOf = useCallback(() => host.current?.parentElement?.previousElementSibling ?? null, []);
  const paint = useCallback<PaintRelief>((ctx, w, h, scale) => {
    const el = host.current;
    if (!el) return;
    // The carving owns the band above the first line of text (spirit follow-up: design on top, info below).
    const box0 = el.getBoundingClientRect();
    let firstText = box0.bottom;
    el.parentElement?.querySelectorAll("p").forEach((n) => (firstText = Math.min(firstText, n.getBoundingClientRect().top)));
    const band = Math.max(120 * scale, (firstText - box0.top) * scale - 24 * scale);
    const mobile = w / scale < 768;
    // A temple frieze across the band: palmettes alternating with lotus over a running meander.
    const key = Math.max(4 * scale, Math.min(9 * scale, band / 26)); // calibration knob: meander cell, from the band's height
    const keyTop = band - key * 7.4; // the key strip (fillets included) is ~7 cells tall, sitting on the band's floor
    meander(ctx, -key * 2, w + key * 5, keyTop, key);
    const base = keyTop - key * 1.6; // the flowers stand on a groundline just above the key
    const size = Math.min((base - 28 * scale) * 0.92, (mobile ? 92 : 150) * scale); // calibration knob: palmette height, with headroom
    const step = size * (mobile ? 0.95 : 0.78);
    const first = (w % step) / 2 + step / 2;
    for (let i = 0, x = first; x < w; i++, x += step) {
      if (i % 2 === 0) palmette(ctx, x, base, size);
      else lotus(ctx, x, base, size * 0.82);
      if (x + step < w + step) tendril(ctx, x + size * 0.18, x + step - size * 0.18, base - size * 0.02, size * 0.22, size * 0.04);
    }
    const s = key / 6;
    // Soften the cut, like hand-worked plaster, then clear everything the visitor reads or clicks.
    const soft = document.createElement("canvas");
    soft.width = w;
    soft.height = h;
    const sc = soft.getContext("2d")!;
    sc.filter = `blur(${Math.max(1.2, 1.6 * s)}px)`;
    sc.drawImage(ctx.canvas, 0, 0);
    ctx.drawImage(soft, 0, 0);
    const box = el.getBoundingClientRect();
    const pad = 14 * scale;
    ctx.fillStyle = "#000";
    ctx.filter = `blur(${6 * scale}px)`;
    const clear = (r: DOMRect) => {
      if (r.width && r.height) ctx.fillRect((r.left - box.left) * scale - pad, (r.top - box.top) * scale - pad, r.width * scale + pad * 2, r.height * scale + pad * 2);
    };
    // The text's own line boxes, not its elements: a block-level wordmark spans the whole row, its letters do not.
    const footer = el.parentElement;
    if (footer) {
      const range = document.createRange();
      const walk = document.createTreeWalker(footer, NodeFilter.SHOW_TEXT);
      for (let t = walk.nextNode(); t; t = walk.nextNode()) {
        if (!t.textContent?.trim()) continue;
        range.selectNodeContents(t);
        for (const r of range.getClientRects()) clear(r);
      }
      footer.querySelectorAll("button").forEach((b) => clear(b.getBoundingClientRect())); // the hidden obol
    }
    ctx.filter = "none";
  }, []);
  return (
    <div ref={host} aria-hidden className="pointer-events-none absolute inset-0">
      {/* The page above slides off the footer as it reveals: carve only below its bottom edge. */}
      <Relief host={host} paint={paint} high={HIGH} shade={SHADE} cover={coverOf} className="absolute inset-0" />
    </div>
  );
}
