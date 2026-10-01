"use client";
import { useCallback, useRef } from "react";
import Relief, { type PaintRelief } from "@/components/experience/relief";

// Tone-on-tone with the footer's red wash: a warm highlight and a deep red-brown shade (spirit spec follow-up, P).
const HIGH = "#ffd2b8";
const SHADE = "#2a0904";
const TAU = Math.PI * 2;

/** A lanceolate leaf: raised blade with a sunken midrib. */
function leaf(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, len: number, width: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.45, -width, len, 0);
  ctx.quadraticCurveTo(len * 0.45, width, 0, 0);
  ctx.fillStyle = "#d8d8d8";
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(len * 0.05, 0);
  ctx.lineTo(len * 0.92, 0);
  ctx.lineWidth = Math.max(1, width * 0.18);
  ctx.strokeStyle = "#8a8a8a";
  ctx.stroke();
  ctx.restore();
}

/** An olive branch along a quadratic curve: a stem, alternating leaves, a few olives. */
function olive(ctx: CanvasRenderingContext2D, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, s: number, seed: number) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(cx, cy, x1, y1);
  ctx.lineWidth = 3.2 * s;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#b0b0b0";
  ctx.stroke();
  const at = (t: number) => {
    const u = 1 - t;
    return {
      x: u * u * x0 + 2 * u * t * cx + t * t * x1,
      y: u * u * y0 + 2 * u * t * cy + t * t * y1,
      a: Math.atan2(2 * u * (cy - y0) + 2 * t * (y1 - cy), 2 * u * (cx - x0) + 2 * t * (x1 - cx)),
    };
  };
  const count = Math.round(Math.hypot(x1 - x0, y1 - y0) / (26 * s)); // a leaf every ~26px along the stem
  for (let i = 1; i < count; i++) {
    const t = i / count;
    const p = at(t);
    const side = i % 2 ? 1 : -1;
    const len = (62 - 22 * Math.abs(t - 0.5)) * s; // calibration knob: olive leaves are long and slender
    leaf(ctx, p.x, p.y, p.a + side * (0.42 + 0.08 * Math.sin(i * 7 + seed)), len, len * 0.13);
    if ((i + seed) % 5 === 0) {
      const o = at(t + 0.02);
      ctx.beginPath();
      ctx.ellipse(o.x - side * 9 * s * Math.sin(o.a), o.y + side * 9 * s * Math.cos(o.a), 6 * s, 8 * s, o.a, 0, TAU);
      ctx.fillStyle = "#f0f0f0";
      ctx.fill();
    }
  }
  const tip = at(1);
  leaf(ctx, tip.x, tip.y, tip.a, 54 * s, 7 * s);
}

/** The owl of Athena, as on the Athenian tetradrachm: frontal head with great round eyes, folded wings, perched. */
function owl(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  const fill = (v: string) => (ctx.fillStyle = v);
  // body
  ctx.beginPath();
  ctx.ellipse(x, y + 18 * s, 34 * s, 50 * s, 0, 0, TAU);
  fill("#c8c8c8");
  ctx.fill();
  // folded wings with feather grooves
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(x + side * 16 * s, y + 26 * s, 20 * s, 42 * s, side * -0.18, 0, TAU);
    fill("#e2e2e2");
    ctx.fill();
    ctx.strokeStyle = "#9a9a9a";
    ctx.lineWidth = 2 * s;
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.arc(x + side * 16 * s, y + (8 + k * 14) * s, 13 * s, side > 0 ? 0.3 : Math.PI - 1.9, side > 0 ? 1.9 : Math.PI - 0.3);
      ctx.stroke();
    }
  }
  // head
  ctx.beginPath();
  ctx.ellipse(x, y - 34 * s, 32 * s, 26 * s, 0, 0, TAU);
  fill("#d4d4d4");
  ctx.fill();
  // ear tufts
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + side * 18 * s, y - 52 * s);
    ctx.lineTo(x + side * 30 * s, y - 68 * s);
    ctx.lineTo(x + side * 30 * s, y - 46 * s);
    ctx.closePath();
    fill("#d4d4d4");
    ctx.fill();
  }
  // eyes: a raised rim round a sunken pupil
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(x + side * 13 * s, y - 36 * s, 11 * s, 0, TAU);
    fill("#ffffff");
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + side * 13 * s, y - 36 * s, 5 * s, 0, TAU);
    fill("#7a7a7a");
    ctx.fill();
  }
  // beak
  ctx.beginPath();
  ctx.moveTo(x - 4 * s, y - 28 * s);
  ctx.lineTo(x + 4 * s, y - 28 * s);
  ctx.lineTo(x, y - 18 * s);
  ctx.closePath();
  fill("#f2f2f2");
  ctx.fill();
  // tail and talons over the perch
  ctx.beginPath();
  ctx.moveTo(x - 12 * s, y + 62 * s);
  ctx.lineTo(x + 12 * s, y + 62 * s);
  ctx.lineTo(x, y + 80 * s);
  ctx.closePath();
  fill("#bcbcbc");
  ctx.fill();
}

/** A swallow in flight: swept wings, a forked tail. */
function swallow(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, angle: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(0, -2);
  ctx.quadraticCurveTo(-30, -22, -66, -20);
  ctx.quadraticCurveTo(-30, -10, -5, 6);
  ctx.quadraticCurveTo(-5, 18, -16, 40);
  ctx.lineTo(0, 22);
  ctx.lineTo(16, 40);
  ctx.quadraticCurveTo(5, 18, 5, 6);
  ctx.quadraticCurveTo(30, -10, 66, -20);
  ctx.quadraticCurveTo(30, -22, 0, -2);
  ctx.closePath();
  ctx.fillStyle = "#d0d0d0";
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, 4, 5, 13, 0, 0, TAU);
  ctx.fillStyle = "#ececec";
  ctx.fill();
  ctx.restore();
}

/**
 * Carved into the footer's red wall (after immersive-g.com's plaster birds and flowers): in the band above the
 * footer's text, an olive branch arches across, the owl of Athena perches on it and swallows wheel above. Every text
 * box, link and the hidden obol is still masked out, so the carving never touches what the visitor reads or clicks.
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
    // calibration knob: motif scale follows the band's height.
    const s = Math.min(1.6 * scale, Math.max(0.55 * scale, band / 230));
    // An olive branch arching across the band; the owl perches on it; swallows wheel above.
    const x0 = w * 0.02, y0 = band * 0.92;
    const cx = w * 0.46, cy = band * 0.28;
    const x1 = w * 0.99, y1 = band * 0.8;
    olive(ctx, x0, y0, cx, cy, x1, y1, s, 1);
    const perch = (t: number) => {
      const u = 1 - t;
      return { x: u * u * x0 + 2 * u * t * cx + t * t * x1, y: u * u * y0 + 2 * u * t * cy + t * t * y1 };
    };
    const o = perch(mobile ? 0.8 : 0.78);
    // The owl stands 148 units tall above its talons: size it so its ear tufts stay inside the band.
    const os = Math.min(s * (mobile ? 0.7 : 0.95), (o.y - 10 * scale) / 148);
    owl(ctx, o.x, o.y - 80 * os, os);
    const birds: [number, number, number, number][] = mobile
      ? [[0.2, 0.3, 0.55, -0.15], [0.42, 0.14, 0.4, 0.12]]
      : [[0.14, 0.32, 0.75, -0.15], [0.27, 0.14, 0.55, 0.1], [0.38, 0.42, 0.42, -0.25], [0.86, 0.18, 0.6, 0.12]];
    for (const [bx, by, bs, ba] of birds) swallow(ctx, w * bx, band * by, s * bs, ba);
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
