// Case III demo — illustration, not client data.
export type Edge = { id: string; x1: number; y1: number; x2: number; y2: number; measured: boolean };

/** An L-shaped kitchen in a 100 × 70 plan space. Solid = measured, dashed = assumed. */
export const PLAN_EDGES: readonly Edge[] = [
  { id: "north", x1: 5, y1: 5, x2: 95, y2: 5, measured: true },
  { id: "east", x1: 95, y1: 5, x2: 95, y2: 40, measured: true },
  { id: "east-return", x1: 95, y1: 40, x2: 60, y2: 40, measured: false },
  { id: "inner", x1: 60, y1: 40, x2: 60, y2: 65, measured: false },
  { id: "south", x1: 60, y1: 65, x2: 5, y2: 65, measured: true },
  { id: "west", x1: 5, y1: 65, x2: 5, y2: 5, measured: true },
  { id: "counter", x1: 15, y1: 12, x2: 80, y2: 12, measured: true },
  { id: "island", x1: 25, y1: 35, x2: 45, y2: 35, measured: false },
];

export type RenderMode = "geometry" | "model";
export const PROMPT_VERSION = "v3";

/** FNV-1a 32-bit. Stands in for the real content hash in this illustration. */
export function contentKey(scan: string, mode: RenderMode): string {
  const s = `${scan}|${mode}|${PROMPT_VERSION}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

export function createRenderCache() {
  const seen = new Set<string>();
  return {
    render(scan: string, mode: RenderMode) {
      const key = contentKey(scan, mode);
      const hit = seen.has(key);
      seen.add(key);
      return { key, hit };
    },
  };
}
