// The broadcast (spirit spec §5): a 250vh scroll track over the Sanzu. Pure curves of scroll progress p (0–1);
// components/underworld/ferry.tsx writes p, the backdrop's Rig and the DOM read these.
import { PORTRAIT_BELOW, riverCamera, type Pose } from "./descent.ts";
import { clamp01, easeInOutCubic, fadeInOut, smoothstep } from "./timeline.ts";

export const FERRY_BEATS = [
  { id: "card", start: 0, end: 0.15 },
  { id: "reveal", start: 0.15, end: 0.3 },
  { id: "ride", start: 0.3, end: 0.7 },
  { id: "approach", start: 0.7, end: 0.9 },
  { id: "through", start: 0.9, end: 1 },
] as const;

export type FerryBeat = (typeof FERRY_BEATS)[number]["id"];

export function ferryLocal(p: number, id: FerryBeat): number {
  const b = FERRY_BEATS.find((x) => x.id === id)!;
  return clamp01((p - b.start) / (b.end - b.start));
}

/** The camera passes into the portal here and cuts, under full signal loss, to the rest pose. */
export const FERRY_CUT = 0.95;

// calibration knob: the rest poses after the cut — a wide, calm view with room for the shades rising before the torii.
export const REST_CAMERA: Pose = { position: [0, 3.2, 14], pitch: -0.06 };
export const REST_CAMERA_PORTRAIT: Pose = { position: [4, 1.6, 20], pitch: 0.1 };

type Key = { p: number; pose: Pose };
// calibration knob: every key below — the ride along the river (boat height), the approach centred on the torii
// (portal at TORII.portalY 2.76, plane z -16), and the push into the portal plane at FERRY_CUT.
const path = (start: Pose, ride: Pose, approach: Pose, cut: Pose): Key[] => [
  { p: 0.3, pose: start },
  { p: 0.7, pose: ride },
  { p: 0.9, pose: approach },
  { p: FERRY_CUT, pose: cut },
];
const PATHS = {
  landscape: path(
    riverCamera(16 / 9),
    { position: [2.2, 0.9, -1], pitch: 0.06 },
    { position: [4, 2.6, -7.5], pitch: 0.02 },
    { position: [4, 2.76, -15.5], pitch: 0 },
  ),
  portrait: path(
    riverCamera(0.5),
    { position: [4, 0.8, 4], pitch: 0.14 },
    { position: [4, 2.2, -7.5], pitch: 0.08 },
    { position: [4, 2.76, -15.5], pitch: 0 },
  ),
};

/** Copy a pose into out (when given) and return it; otherwise return the pose itself. */
function into(pose: Pose, out?: Pose): Pose {
  if (!out) return pose;
  out.position[0] = pose.position[0];
  out.position[1] = pose.position[1];
  out.position[2] = pose.position[2];
  out.pitch = pose.pitch;
  return out;
}

/**
 * Camera pose at progress p. Holds the descent's landing pose through the card and the reveal; rests after the cut.
 * Pass out to write into a caller-owned pose (the per-frame rig) instead of allocating one.
 */
export function ferryPose(p: number, aspect: number, out?: Pose): Pose {
  const portrait = aspect < PORTRAIT_BELOW;
  if (p >= FERRY_CUT) return into(portrait ? REST_CAMERA_PORTRAIT : REST_CAMERA, out);
  const keys = portrait ? PATHS.portrait : PATHS.landscape;
  if (p <= keys[0].p) return into(riverCamera(aspect), out);
  const i = keys.findIndex((k) => k.p >= p);
  const a = keys[i - 1].pose;
  const b = keys[i].pose;
  const u = easeInOutCubic((p - keys[i - 1].p) / (keys[i].p - keys[i - 1].p));
  const pose = out ?? { position: [0, 0, 0], pitch: 0 };
  pose.position[0] = a.position[0] + (b.position[0] - a.position[0]) * u;
  pose.position[1] = a.position[1] + (b.position[1] - a.position[1]) * u;
  pose.position[2] = a.position[2] + (b.position[2] - a.position[2]) * u;
  pose.pitch = a.pitch + (b.pitch - a.pitch) * u;
  return pose;
}

/** The title card: held, then gone by the end of the reveal. */
export const cardOpacity = (p: number) => 1 - smoothstep(0.15, 0.3, p);

/** CRT signal loss: up to full at the cut, clear by the end of the track, and never after it. */
export function signalLoss(p: number): number {
  if (p >= 1) return 0;
  return p < FERRY_CUT ? smoothstep(0.9, FERRY_CUT, p) : 1 - smoothstep(FERRY_CUT, 1, p);
}

/** Whisper i of n: each owns an equal slot of the ride and fades in and out inside it, so two never share the screen. */
export function whisperOpacity(p: number, i: number, n: number): number {
  const ride = ferryLocal(p, "ride");
  if (ride <= 0 || ride >= 1) return 0;
  const t = ride * n - i;
  return t <= 0 || t >= 1 ? 0 : fadeInOut(t, 0.3);
}
