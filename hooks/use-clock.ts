"use client";

import { useEffect, useState } from "react";

/** `HH:MM`, zero-padded (design lines 781–782). Empty string until mounted —
 *  `new Date()` during SSR is a guaranteed hydration mismatch. */
export function useClock(): string {
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(
        String(now.getHours()).padStart(2, "0") +
          ":" +
          String(now.getMinutes()).padStart(2, "0"),
      );
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return clock;
}
