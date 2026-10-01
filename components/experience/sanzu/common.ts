import { mulberry32 } from "@/lib/rng";
import { scene } from "@/lib/scene";

// Mirror --color-void, --color-bone and --color-spirit in app/globals.css (spirit spec §4).
export const INK = { void: "#0b0907", bone: "#efe6d4", spirit: "#52f5d6" } as const;

// Scene-only tones, not UI tokens: night-blue moonlight, amber paper, ink water.
export const SANZU = {
  fog: "#070a12",
  water: "#020308",
  horizon: "#141c30",
  zenith: "#03050a",
  skyGlow: "#5a6f99",
  skyFill: "#1c2540",
  moon: "#e6ecf7",
  moonlight: "#9fb4d8",
  lantern: "#fff1d6", // the bow lamp on Charon's boat: warm white, outside the spirit pass's red band
  wood: "#4a3526",
  cloth: "#0b0d12",
  mist: "#7d8fb0",
  hitodama: "#cfe6ff",
  shadow: "#06070b",
} as const;

export const FOG_DENSITY = 0.018; // calibration knob: 0.012–0.03 — higher swallows the Gate, lower flattens the depth

/** Value noise and fbm for the portal, mist, sky and moon shaders. */
export const NOISE = /* glsl */ `
float hash21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise2(p);
    p = p * 2.03 + 17.0;
    a *= 0.5;
  }
  return v;
}
`;

/**
 * A fresh seeded generator per builder (salt keeps their sequences apart). The descent's Sanzu and the backdrop's are
 * separate mounts; a fixed seed gives both the same mote and shade layout, so the handoff doesn't pop.
 */
export const sanzuRand = (salt: number) => mulberry32(0x5a2e + salt);

let epoch = -1;
/**
 * Sanzu time in seconds, counted from the first Sanzu frame this session, so the descent's Sanzu and the backdrop's
 * agree at the handoff (the boat is where it was). Frozen at 0 under reduced motion: one still frame.
 */
export function sanzuClock(elapsed: number): number {
  if (scene.reducedMotion) return 0;
  if (epoch < 0) epoch = elapsed;
  return elapsed - epoch;
}
