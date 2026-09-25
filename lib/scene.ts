// Mutable per-frame state. The onboarding scroll reader writes it; useFrame reads it.
// ponytail: a plain object, not a store — nothing re-renders from it, so nothing needs to subscribe.
export const scene = {
  progress: 0,
  tier: "high" as "high" | "low",
  reducedMotion: false,
};

/** Browser-only. Detects tier and motion preference, flags missing WebGL on <html>. */
export function initScene(): boolean {
  const matches = (q: string) => window.matchMedia(q).matches;
  scene.reducedMotion = matches("(prefers-reduced-motion: reduce)");
  scene.tier = matches("(max-width: 768px)") || (navigator.hardwareConcurrency ?? 8) <= 4 ? "low" : "high";
  const ok = Boolean(document.createElement("canvas").getContext("webgl2"));
  if (!ok) document.documentElement.classList.add("no-webgl");
  return ok;
}
