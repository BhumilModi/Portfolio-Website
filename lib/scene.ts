// Mutable per-frame state. The onboarding scroll reader and the crossing overlay write it; useFrame reads it.
// ponytail: a plain object, not a store — nothing re-renders from it, so nothing needs to subscribe.
export const scene = {
  progress: 0,
  tier: "high" as "high" | "low",
  reducedMotion: false,
  /** Crossing timeline position in seconds (lib/descent.ts), written by components/quest/crossing.tsx each frame. */
  crossingT: 0,
};

/** Browser-only. Detects tier and motion preference, flags missing WebGL on <html>. */
export function initScene(): boolean {
  const matches = (q: string) => window.matchMedia(q).matches;
  scene.reducedMotion = matches("(prefers-reduced-motion: reduce)");
  scene.tier = matches("(max-width: 768px)") || (navigator.hardwareConcurrency ?? 8) <= 4 ? "low" : "high";
  const gl = document.createElement("canvas").getContext("webgl2");
  gl?.getExtension("WEBGL_lose_context")?.loseContext(); // release the probe context, don't hold a GPU context we don't use
  const ok = Boolean(gl);
  if (!ok) document.documentElement.classList.add("no-webgl");
  return ok;
}

export const CROSS_EVENT = "bm:cross";
/** Starts the crossing between realms. components/quest/crossing.tsx listens; nothing happens until it is mounted. */
export function cross(direction: "down" | "up") {
  window.dispatchEvent(new CustomEvent(CROSS_EVENT, { detail: direction }));
}
