// The crossing (redesign spec §4): a time-driven fall from Olympus, down the engraved shaft, through the portal
// and out over the Sanzu, in seconds. Pure curves; the 3D scene and the DOM overlay both read them.
import { clamp01, easeInOutCubic, smoothstep } from "./timeline.ts";

export const DESCENT_BEATS = [
  { id: "fare", start: 0, end: 0.6 },
  { id: "olympus", start: 0.6, end: 1.8 },
  { id: "fall", start: 1.8, end: 3.0 },
  { id: "abyss", start: 3.0, end: 4.2 },
  { id: "gate", start: 4.2, end: 4.45 },
  { id: "sanzu", start: 4.45, end: 5.5 },
] as const;

export type DescentBeat = (typeof DESCENT_BEATS)[number]["id"];
export type Direction = "down" | "up";
export const DESCENT_S = 5.5;
export const ASCENT_S = 3;

export function beatLocal(t: number, id: DescentBeat): number {
  const b = DESCENT_BEATS.find((x) => x.id === id)!;
  return clamp01((t - b.start) / (b.end - b.start));
}

/** Timeline position (0 = Olympus, DESCENT_S = the Sanzu) after `elapsed` seconds. Ascent plays it backwards in ASCENT_S. */
export function timelineAt(elapsed: number, direction: Direction, speed = 1): number {
  const e = Math.max(0, elapsed) * speed;
  return direction === "down" ? Math.min(DESCENT_S, e) : Math.max(0, DESCENT_S - e * (DESCENT_S / ASCENT_S));
}

export function isDone(elapsed: number, direction: Direction, speed = 1): boolean {
  return elapsed * speed >= (direction === "down" ? DESCENT_S : ASCENT_S);
}

// World layout: Olympus at the origin; the shaft's last ring near y = -42; the portal PORTAL_Y below it;
// the Sanzu's waterline RIVER_Y below that. The Sanzu is hidden until the cut, so the gap is never seen.
export const PORTAL_Y = -56;
export const PORTAL_R = 3.4;
export const RIVER_Y = -80;
/** The camera passes through the portal: the flash peaks and the render style switches under it. */
export const GATE_CUT = 4.3;
/** The [SYSTEM] notice opens here, during the glide. */
export const NOTICE_AT = 4.7;
export const DESCENT_FOV = 45;

export type Pose = { position: [number, number, number]; pitch: number };
// calibration knob: both river poses — tune while comparing /underworld screenshots at 1440×900 and 390×844.
/** Low over the water, pitched slightly up; the torii sits right of centre. The backdrop uses it unchanged. */
export const RIVER_CAMERA: Pose = { position: [0, 1.1, 8], pitch: 0.05 };
/** Tall screens: centred on the torii and pitched down, so the Gate sits in the top half and the text below. */
export const RIVER_CAMERA_PORTRAIT: Pose = { position: [4, 1.2, 10], pitch: -0.1 };
export const PORTRAIT_BELOW = 0.9; // aspect (w / h) under which the portrait pose is used
export const riverCamera = (aspect: number): Pose => (aspect < PORTRAIT_BELOW ? RIVER_CAMERA_PORTRAIT : RIVER_CAMERA);

const easeIn = (x: number) => x * x * x;
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const linear = (x: number) => x;
type Key = { t: number; pos: [number, number, number]; pitch: number; ease: (x: number) => number };
// ease: the curve used to arrive at this key from the previous one.
// calibration knob: the t = 4.45 key (where the camera comes out of the flash above the torii); keep y below PORTAL_Y.
const KEYS: Key[] = [
  { t: 0, pos: [0, 1.5, 7], pitch: 0, ease: easeInOutCubic },
  { t: 0.6, pos: [0, 1.5, 6.5], pitch: 0, ease: easeInOutCubic },
  { t: 1.8, pos: [0, 1, 3], pitch: -0.6, ease: easeInOutCubic },
  { t: 3.0, pos: [0, -14, 0], pitch: -Math.PI / 2, ease: easeIn },
  // Straight down the shaft, through the portal at the flash peak.
  { t: GATE_CUT, pos: [0, PORTAL_Y, 0], pitch: -Math.PI / 2, ease: linear },
  // Out of the flash high above the torii, looking down at it.
  { t: 4.45, pos: [2, RIVER_Y + 15, -2], pitch: -1.0, ease: linear },
];
const land = (p: Pose): Key => ({ t: DESCENT_S, pos: [p.position[0], RIVER_Y + p.position[1], p.position[2]], pitch: p.pitch, ease: easeOut });
const PATHS = { landscape: [...KEYS, land(RIVER_CAMERA)], portrait: [...KEYS, land(RIVER_CAMERA_PORTRAIT)] };

/** Camera position and pitch at timeline t (radians; 0 looks along -z, -π/2 straight down). */
export function cameraAt(t: number, aspect = 16 / 9): { pos: [number, number, number]; pitch: number } {
  const keys = aspect < PORTRAIT_BELOW ? PATHS.portrait : PATHS.landscape;
  const x = Math.min(DESCENT_S, Math.max(0, t));
  const i = Math.max(1, keys.findIndex((k) => k.t >= x));
  const a = keys[i - 1];
  const b = keys[i];
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
/** The engraved shaft: in over the fall, gone at the cut. The two styles are never blended. */
export const shaftOpacity = (t: number) => (t < GATE_CUT ? smoothstep(2.6, 3.2, t) : 0);
/** The lit Sanzu: a hard step at the cut, hidden under the flash. */
export const sanzuOpacity = (t: number) => (t >= GATE_CUT ? 1 : 0);
/** The approach disc far below the shaft: in as the fall ends, gone at the cut (the torii's portal takes over). */
export const portalOpacity = (t: number) => (t < GATE_CUT ? smoothstep(3.0, 3.5, t) : 0);
/** The disc swells from a spark as it appears; perspective does the rest of the growing. */
export const portalScale = (t: number) => 0.25 + 0.75 * smoothstep(3.0, 3.9, t);
/** System-blue flash: up to its peak at the cut in 0.1s, then clear by the end of the gate beat. */
export const flashOpacity = (t: number) => smoothstep(4.2, GATE_CUT, t) * (1 - smoothstep(GATE_CUT, 4.45, t));
/** The scanline's sweep down the screen through the gate beat: 0 = top, 1 = bottom. */
export const scanline = (t: number) => beatLocal(t, "gate");
/** Bloom runs from the portal approach on; the Olympus beats never go through the composer. */
export const bloomBeat = (t: number) => t >= 3.0;
export const noticeShown = (t: number) => t >= NOTICE_AT;
/** Opaque backdrop behind the canvas that hides the page; in over the fare beat. */
export const backdropOpacity = (t: number) => smoothstep(0, 0.5, t);

/** The obol flips and drops out of frame through the fare beat. */
export function obolPose(t: number) {
  const f = beatLocal(t, "fare");
  return { flip: f * Math.PI * 3, drop: -3 * easeIn(f), opacity: 1 - smoothstep(0.7, 1, f) };
}
