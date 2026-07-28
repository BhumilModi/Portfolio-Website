"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, SyntheticEvent } from "react";

import {
  clampTo,
  defaultH,
  dockScale,
  dockSlotH,
  resolveSize,
  spawn,
  type Point,
  type Size,
} from "@/lib/geometry";
import {
  LEFT,
  LEFT_MOBILE,
  MIN_H,
  MIN_W,
  MOBILE_BREAKPOINT,
  SIZE,
  WINDOWS,
  WINDOW_ORDER,
  type WindowId,
} from "@/lib/windows";
import { useViewport } from "./use-viewport";

/** One entry of the design's `w[id]` record (renderVals, lines 742–757).
 *  `tabActive` / `dotVisible` replace the design's `tabBg` / `dot` colour
 *  strings — the colours belong to the components. */
export type DesktopWindow = {
  open: boolean;
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  maxH: number;
  shadow: string;
  tabActive: boolean;
  dotVisible: boolean;
  scale: number;
  slotH: number;
  labelOpacity: number;
  onEnter: () => void;
  onOpen: () => void;
  onToggle: () => void;
  onClose: (e?: SyntheticEvent) => void;
  onFocus: () => void;
  onDrag: (e: ReactPointerEvent) => void;
  onResize: (e: ReactPointerEvent) => void;
};

export type DesktopWindows = Record<WindowId, DesktopWindow>;

export type Desktop = {
  w: DesktopWindows;
  hover: WindowId | null;
  /** The dock's `onPointerLeave` (design line 786). */
  clearHover: () => void;
  caseId: number | null;
  openCase: (n: number) => void;
  closeCase: () => void;
  mounted: boolean;
  vw: number;
  vh: number;
  isMobile: boolean;
};

/** Spawn fractions by id, so nothing has to `WINDOWS.find(...)!` at runtime. */
const FRACTIONS = Object.fromEntries(
  WINDOWS.map(([id, fx, fy]) => [id, { fx, fy }]),
) as Record<WindowId, { fx: number; fy: number }>;

/** The pointermove handler is registered once, so it reads the viewport off
 *  `window` exactly like the design's `clampTo` does (lines 585–587) rather
 *  than closing over a stale value. */
function liveViewport() {
  const vw = window.innerWidth || 1280;
  const vh = window.innerHeight || 800;
  return { vw, vh, left: vw < MOBILE_BREAKPOINT ? LEFT_MOBILE : LEFT };
}

export function useDesktop(): Desktop {
  const { vw, vh, isMobile, left, mounted } = useViewport();

  const [open, setOpen] = useState<Partial<Record<WindowId, boolean>>>({ readme: true });
  const [hover, setHover] = useState<WindowId | null>(null);
  const [caseId, setCaseId] = useState<number | null>(null);
  const [size, setSize] = useState<Partial<Record<WindowId, Size>>>({});
  const [pos, setPos] = useState<Partial<Record<WindowId, Point>>>({});
  // z and topZ share one state object: the design reads both in a single
  // setState updater (line 654) and that atomicity is what makes the
  // already-on-top early-out correct.
  const [stack, setStack] = useState<{
    z: Partial<Record<WindowId, number>>;
    topZ: number;
  }>({ z: { readme: 101 }, topZ: 101 });
  const { z, topZ } = stack;

  // In-flight drag/resize live in refs, exactly as the design keeps them in
  // instance fields (`this._drag`, `this._resizing`) — pointermove must not
  // re-render through them.
  const drag = useRef<{ id: WindowId; sx: number; sy: number; ox: number; oy: number } | null>(
    null,
  );
  const resizing = useRef<{
    id: WindowId;
    sx: number;
    sy: number;
    ow: number;
    oh: number;
    x: number;
    y: number;
  } | null>(null);

  /** Design line 654 — returning the same state when already on top is the
   *  React equivalent of the design's `null`, and is what stops a re-render on
   *  every pointerdown. */
  const focus = useCallback((id: WindowId) => {
    setStack((s) =>
      s.z[id] === s.topZ ? s : { topZ: s.topZ + 1, z: { ...s.z, [id]: s.topZ + 1 } },
    );
  }, []);

  /** Design line 657 — always bumps, even if the window was already on top. */
  const openWin = useCallback((id: WindowId) => {
    setOpen((s) => ({ ...s, [id]: true }));
    setStack((s) => ({ topZ: s.topZ + 1, z: { ...s.z, [id]: s.topZ + 1 } }));
  }, []);

  const closeWin = useCallback((id: WindowId, e?: SyntheticEvent) => {
    if (e) e.stopPropagation();
    setOpen((s) => ({ ...s, [id]: false }));
  }, []);

  const toggleWin = useCallback(
    (id: WindowId) => {
      if (open[id]) closeWin(id);
      else openWin(id);
    },
    [open, closeWin, openWin],
  );

  const startDrag = useCallback(
    (id: WindowId, e: ReactPointerEvent) => {
      const { fx, fy } = FRACTIONS[id];
      const p = pos[id] ?? spawn(fx, fy, id, vw, vh, left);
      drag.current = { id, sx: e.clientX, sy: e.clientY, ox: p.x, oy: p.y };
      focus(id);
    },
    [pos, vw, vh, left, focus],
  );

  const startResize = useCallback(
    (id: WindowId, e: ReactPointerEvent) => {
      e.stopPropagation();
      const { fx, fy } = FRACTIONS[id];
      const p = pos[id] ?? spawn(fx, fy, id, vw, vh, left);
      const cur = size[id] ?? { w: SIZE[id].wd, h: defaultH(id, p.y, vh) };
      resizing.current = {
        id,
        sx: e.clientX,
        sy: e.clientY,
        ow: cur.w,
        oh: cur.h,
        x: p.x,
        y: p.y,
      };
      focus(id);
    },
    [pos, size, vw, vh, left, focus],
  );

  // Design lines 614–642 — one pointermove/pointerup pair for the whole desktop.
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const r = resizing.current;
      if (r) {
        const { vw: cvw, vh: cvh } = liveViewport();
        const wd = Math.max(MIN_W, Math.min(r.ow + (e.clientX - r.sx), cvw - r.x - 14));
        const ht = Math.max(MIN_H, Math.min(r.oh + (e.clientY - r.sy), cvh - r.y - 14));
        setSize((s) => ({ ...s, [r.id]: { w: Math.round(wd), h: Math.round(ht) } }));
        return;
      }
      const d = drag.current;
      if (!d) return;
      const { vw: cvw, vh: cvh, left: cleft } = liveViewport();
      const p = clampTo(
        d.ox + (e.clientX - d.sx),
        d.oy + (e.clientY - d.sy),
        d.id,
        cvw,
        cvh,
        cleft,
      );
      setPos((s) => ({ ...s, [d.id]: p }));
    };
    const up = () => {
      drag.current = null;
      resizing.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  // Not in the design: Escape closes the focused window. Its own effect so the
  // pointer listeners above stay mounted exactly once.
  const focusedId = WINDOW_ORDER.find((id) => open[id] && z[id] === topZ) ?? null;
  useEffect(() => {
    if (!focusedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeWin(focusedId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusedId, closeWin]);

  // renderVals, design lines 726–758.
  const hi = hover === null ? -99 : WINDOW_ORDER.indexOf(hover);
  const w = {} as DesktopWindows;
  WINDOWS.forEach(([id, fx, fy], idx) => {
    const dist = Math.abs(idx - hi);
    const scale = dockScale(idx, hi);
    const stored = pos[id];
    const p = stored
      ? clampTo(stored.x, stored.y, id, vw, vh, left)
      : spawn(fx, fy, id, vw, vh, left);
    const resolved = resolveSize(id, p, size[id], vw, vh);
    const focused = z[id] === topZ;
    w[id] = {
      open: !!open[id],
      x: p.x,
      y: p.y,
      z: z[id] ?? 100,
      w: resolved.w,
      h: resolved.h,
      maxH: resolved.maxH,
      shadow: focused ? "10px 10px 0 #E33F00" : "7px 7px 0 #16130F",
      tabActive: !!open[id],
      dotVisible: !!open[id],
      scale,
      slotH: dockSlotH(scale, vh),
      labelOpacity: hover === null ? 1 : dist === 0 ? 1 : 0.8,
      onEnter: () => setHover(id),
      onOpen: () => openWin(id),
      onToggle: () => toggleWin(id),
      onClose: (e) => closeWin(id, e),
      onFocus: () => focus(id),
      onDrag: (e) => startDrag(id, e),
      onResize: (e) => startResize(id, e),
    };
  });

  /** Design lines 776–779 — sets the case *and* opens the cases window. */
  const openCase = useCallback(
    (n: number) => {
      setCaseId(n);
      openWin("cases");
    },
    [openWin],
  );

  return {
    w,
    hover,
    clearHover: () => setHover(null),
    caseId,
    openCase,
    closeCase: () => setCaseId(null),
    mounted,
    vw,
    vh,
    isMobile,
  };
}
