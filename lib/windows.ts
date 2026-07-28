export type WindowId = "readme" | "oss" | "cases" | "how" | "contact";

/** id, spawn fractions, rendered width, approximate rendered height.
 *  Order matters — the dock magnification uses index distance. */
export const WINDOWS: readonly (readonly [WindowId, number, number, number, number])[] = [
  ["readme", 0.24, 0.02, 640, 560],
  ["oss", 0.56, 0.3, 560, 420],
  ["cases", 0.34, 0.06, 780, 620],
  ["how", 0.44, 0.05, 620, 560],
  ["contact", 0.52, 0.18, 480, 420],
];

export const WINDOW_ORDER: readonly WindowId[] = WINDOWS.map(([id]) => id);

export const SIZE = Object.fromEntries(
  WINDOWS.map(([id, , , wd, ht]) => [id, { wd, ht }]),
) as Record<WindowId, { wd: number; ht: number }>;

export const TOP = 56;
export const BOTTOM = 20;
export const LEFT = 186;
export const MIN_VISIBLE = 260;
export const MIN_W = 320;
export const MIN_H = 200;

/** Narrower dock band below MOBILE_BREAKPOINT. */
export const LEFT_MOBILE = 78;
export const MOBILE_BREAKPOINT = 768;
