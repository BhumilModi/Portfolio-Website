// The crossing (spec §3): a time-driven fall from Olympus to the Styx, in seconds.
// Pure curves; the 3D scene and the DOM overlay both read them — the same split as lib/timeline.ts.
import { clamp01, easeInOutCubic, smoothstep } from "./timeline.ts";

export const DESCENT_BEATS = [
  { id: "fare", start: 0, end: 0.6 },
  { id: "olympus", start: 0.6, end: 1.8 },
  { id: "fall", start: 1.8, end: 3.0 },
  { id: "abyss", start: 3.0, end: 4.2 },
  { id: "styx", start: 4.2, end: 5.5 },
] as const;

export type DescentBeat = (typeof DESCENT_BEATS)[number]["id"];
export type Direction = "down" | "up";
export const DESCENT_S = 5.5;
export const ASCENT_S = 3;

export function beatLocal(t: number, id: DescentBeat): number {
  const b = DESCENT_BEATS.find((x) => x.id === id)!;
  return clamp01((t - b.start) / (b.end - b.start));
}

/** Timeline position (0 = Olympus, DESCENT_S = the Styx) after `elapsed` seconds. Ascent plays it backwards in ASCENT_S. */
export function timelineAt(elapsed: number, direction: Direction, speed = 1): number {
  const e = Math.max(0, elapsed) * speed;
  return direction === "down" ? Math.min(DESCENT_S, e) : Math.max(0, DESCENT_S - e * (DESCENT_S / ASCENT_S));
}

export function isDone(elapsed: number, direction: Direction, speed = 1): boolean {
  return elapsed * speed >= (direction === "down" ? DESCENT_S : ASCENT_S);
}

// World layout: Olympus sits at the origin, the Styx's waterline STYX_Y below it.
export const STYX_Y = -44;
/** Camera pose relative to the water. The Underworld backdrop uses it unchanged, so the handoff is frame-identical. */
export const STYX_CAMERA = { position: [0, 1.2, 6] as [number, number, number], pitch: -0.06 };
export const DESCENT_FOV = 45;

const easeIn = (x: number) => x * x * x;
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
type Key = { t: number; pos: [number, number, number]; pitch: number; ease: (x: number) => number };
// ease: the curve used to arrive at this key from the previous one. Tuned visually in Task 9.
const KEYS: Key[] = [
  { t: 0, pos: [0, 1.5, 7], pitch: 0, ease: easeInOutCubic },
  { t: 0.6, pos: [0, 1.5, 6.5], pitch: 0, ease: easeInOutCubic },
  { t: 1.8, pos: [0, 1, 3], pitch: -0.6, ease: easeInOutCubic },
  { t: 3.0, pos: [0, -14, 0], pitch: -Math.PI / 2, ease: easeIn },
  { t: 4.2, pos: [0, -38, 0], pitch: -1.2, ease: (x) => x },
  { t: DESCENT_S, pos: [STYX_CAMERA.position[0], STYX_Y + STYX_CAMERA.position[1], STYX_CAMERA.position[2]], pitch: STYX_CAMERA.pitch, ease: easeOut },
];

/** Camera position and pitch at timeline t (radians; 0 looks along -z, -π/2 straight down). */
export function cameraAt(t: number): { pos: [number, number, number]; pitch: number } {
  const x = Math.min(DESCENT_S, Math.max(0, t));
  const i = Math.max(1, KEYS.findIndex((k) => k.t >= x));
  const a = KEYS[i - 1];
  const b = KEYS[i];
  const u = b.ease(clamp01((x - a.t) / (b.t - a.t)));
  const lerp = (p: number, q: number) => p + (q - p) * u;
  return { pos: [lerp(a.pos[0], b.pos[0]), lerp(a.pos[1], b.pos[1]), lerp(a.pos[2], b.pos[2])], pitch: lerp(a.pitch, b.pitch) };
}

/** 0 = warm Olympus, 1 = cold Underworld. Monotonic. */
export const coldness = (t: number) => smoothstep(1.8, 3.6, t);
/** How far cloud particles stretch into upward speed streaks: peaks through the fall. */
export const streak = (t: number) => smoothstep(1.6, 2.2, t) * (1 - smoothstep(3.6, 4.4, t));
export const cloudOpacity = (t: number) => 1 - smoothstep(3.4, 4.2, t);
export const olympusOpacity = (t: number) => 1 - smoothstep(2.4, 3.2, t);
export const shaftOpacity = (t: number) => smoothstep(2.6, 3.2, t) * (1 - smoothstep(4.6, 5.2, t));
export const styxOpacity = (t: number) => smoothstep(3.9, 4.6, t);
/** "You have crossed" (DOM). */
export const titleOpacity = (t: number) => smoothstep(4.6, 5.1, t);
/** Opaque backdrop behind the canvas that hides the page; in over the fare beat. */
export const backdropOpacity = (t: number) => smoothstep(0, 0.5, t);

/** The obol flips and drops out of frame through the fare beat. */
export function obolPose(t: number) {
  const f = beatLocal(t, "fare");
  return { flip: f * Math.PI * 3, drop: -3 * easeIn(f), opacity: 1 - smoothstep(0.7, 1, f) };
}
