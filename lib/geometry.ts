import {
  BOTTOM,
  MIN_H,
  MIN_VISIBLE,
  MIN_W,
  SIZE,
  TOP,
  type WindowId,
} from "./windows.ts";

export type Point = { x: number; y: number };
export type Size = { w: number; h: number };

/** Keeps a window inside the band beside the dock and below the menu bar.
 *  Design lines 585–594, with the viewport passed in instead of read off
 *  `window` so the module stays pure. */
export function clampTo(
  x: number,
  y: number,
  id: WindowId,
  vw: number,
  vh: number,
  left: number,
): Point {
  // windows never exceed the band beside the dock
  const wd = Math.min(SIZE[id].wd, vw - left - 12);
  return {
    x: Math.round(Math.min(Math.max(left, x), Math.max(8, vw - wd - 12))),
    y: Math.round(Math.max(TOP, Math.min(y, Math.max(TOP, vh - BOTTOM - MIN_VISIBLE)))),
  };
}

/** Design lines 595–599. */
export function spawn(
  fx: number,
  fy: number,
  id: WindowId,
  vw: number,
  vh: number,
  left: number,
): Point {
  return clampTo(fx * vw, TOP + fy * (vh - TOP - BOTTOM), id, vw, vh, left);
}

/** Design lines 675–679. */
export function defaultH(id: WindowId, y: number, vh: number): number {
  return Math.max(220, Math.min(SIZE[id].ht, vh - y - BOTTOM - 18));
}

/** Design lines 740–744 — the rendered width/height clamps plus max-height. */
export function resolveSize(
  id: WindowId,
  pos: Point,
  sized: Size | undefined,
  vw: number,
  vh: number,
): { w: number; h: number; maxH: number } {
  const wd = Math.max(MIN_W, Math.min(sized ? sized.w : SIZE[id].wd, vw - pos.x - 14));
  const ht = Math.max(
    MIN_H,
    Math.min(sized ? sized.h : defaultH(id, pos.y, vh), vh - pos.y - 14),
  );
  return {
    w: Math.round(wd),
    h: Math.round(ht),
    maxH: Math.max(MIN_H, vh - pos.y - BOTTOM - 18),
  };
}

/** Dock magnification ladder (design line 733).
 *  `hoverIndex` is -99 when nothing is hovered. */
export function dockScale(index: number, hoverIndex: number): number {
  const dist = Math.abs(index - hoverIndex);
  return dist === 0 ? 1.35 : dist === 1 ? 1.16 : dist === 2 ? 1.06 : 1;
}

/** Design line 734. */
export function dockSlotH(scale: number, vh: number): number {
  return Math.round(Math.max(40, Math.min(52, vh * 0.056)) * scale);
}

/** Design lines 761–767. `pronStep >= 10` encodes "settled on tier
 *  pronStep - 10"; anything below 10 is still in flight. */
export function tierOpacity(
  i: number,
  cfg: { tier: number } | null | undefined,
  pronStep: number,
): number {
  if (!cfg) return 0.35;
  const step = pronStep >= 10 ? pronStep - 10 : pronStep;
  if (step < i) return 0.2;
  if (i === cfg.tier && pronStep >= 10) return 1;
  return step === i ? 0.85 : 0.3;
}
