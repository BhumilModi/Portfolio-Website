"use client";

import { useEffect, useState } from "react";

import { LEFT, LEFT_MOBILE, MOBILE_BREAKPOINT } from "@/lib/windows";

export type Viewport = {
  vw: number;
  vh: number;
  /** vw < MOBILE_BREAKPOINT. */
  isMobile: boolean;
  /** The left clamp every geometry call needs — never pick this yourself. */
  left: number;
  /** false on the SSR/first render, when vw/vh are the design's fallbacks. */
  mounted: boolean;
};

/** Design line 631 — `this._resize = () => this.forceUpdate()`.
 *  The SSR values are the design's own fallbacks (lines 586–587). */
export function useViewport(): Viewport {
  const [vp, setVp] = useState({ vw: 1280, vh: 800, mounted: false });

  useEffect(() => {
    const read = () =>
      setVp({
        vw: window.innerWidth || 1280,
        vh: window.innerHeight || 800,
        mounted: true,
      });
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);

  const isMobile = vp.vw < MOBILE_BREAKPOINT;
  return { ...vp, isMobile, left: isMobile ? LEFT_MOBILE : LEFT };
}
