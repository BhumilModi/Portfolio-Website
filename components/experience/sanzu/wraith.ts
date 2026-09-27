import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { clamp01 } from "@/lib/timeline";

// A hooded, cloaked figure, shared by the shadow soldiers and the ferryman. One lathed cloak (hem → waist → shoulders →
// hood) bent into a stoop, with a hollow where the face would be, plus two hanging sleeves. Front is +z, feet at y = 0.
export const WRAITH_H = 2.26;

// calibration knob: the silhouette as [radius, height] from the hem up to the hood's peak.
const PROFILE: [number, number][] = [
  [0.6, 0], [0.54, 0.22], [0.45, 0.55], [0.37, 0.92], [0.39, 1.2], [0.46, 1.45], [0.45, 1.57],
  [0.3, 1.68], [0.26, 1.78], [0.255, 1.9], [0.23, 2.02], [0.16, 2.13], [0.07, 2.21], [0.001, WRAITH_H],
];
const HOOD = { from: 1.74, to: 2.08, depth: 0.14 }; // the face hollow, cut into the front of the hood
const RAG = 0.2; // how far the hem's tatters hang below the cloak's lowest ring
const STOOP = 0.24; // how far the hood leans forward over the chest

const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
// Deterministic tatter lengths round the hem: two sines plus a per-angle hash, so every cloak frays the same way.
const rag = (phi: number) => {
  const h = Math.sin(Math.floor(phi * 5.1) * 91.7) * 43758.5;
  return clamp01(0.35 + 0.3 * Math.sin(phi * 7 + Math.sin(phi * 3) * 1.4) + 0.35 * (h - Math.floor(h)));
};

/** Where a point on the straight lathe lands once the cloak is flattened, stooped and hollowed. phi = 0 is the front. */
function bend(r: number, y: number, phi: number, out: THREE.Vector3) {
  const depth = 1 - 0.26 * smooth(0, 0.6, y); // a cloak is wider than it is deep; the hem stays round
  let z = r * Math.cos(phi) * depth;
  const x = r * Math.sin(phi);
  const front = Math.max(0, Math.cos(phi));
  z -= HOOD.depth * smooth(HOOD.from, HOOD.from + 0.1, y) * (1 - smooth(HOOD.to - 0.1, HOOD.to, y)) * smooth(0.5, 0.95, front);
  const s = clamp01((y - 1.15) / (WRAITH_H - 1.15));
  z += STOOP * s * s;
  let yy = y - 0.06 * s * s;
  if (y < 0.3) yy -= RAG * (1 - y / 0.3) * rag(phi);
  return out.set(x, yy, z);
}

/** The hood's hollow in local space: where the eyes and the dark of the face sit. */
export function wraithFace() {
  const y = (HOOD.from + HOOD.to) / 2;
  const s = clamp01((y - 1.15) / (WRAITH_H - 1.15));
  return new THREE.Vector3(0, y - 0.06 * s * s, 0.255 * 0.74 - HOOD.depth + STOOP * s * s);
}

/** A sleeve hanging from the shoulder on `side` (±1); `reach` angles both forward and in, hands meeting at the chest. */
function sleeve(side: number, reach: boolean, radial: number) {
  const len = 0.92;
  const g = new THREE.CylinderGeometry(0.07, 0.15, len, radial, 3, true);
  g.translate(0, -len / 2, 0); // hang from the top
  g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(reach ? -0.62 : -0.06, 0, reach ? -side * 0.3 : side * 0.1)));
  const shoulder = bend(0.4, 1.56, side * (Math.PI / 2), new THREE.Vector3());
  g.translate(shoulder.x, shoulder.y, shoulder.z + 0.02);
  return g;
}

/** One merged geometry: the cloak and both sleeves. `segments` sets the lathe's roundness (low tier: fewer). */
export function buildWraith({ reach = false, segments = 40 } = {}) {
  const lathe = new THREE.LatheGeometry(PROFILE.map(([r, y]) => new THREE.Vector2(r, y)), segments, Math.PI); // seam at the back
  const pos = lathe.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    bend(Math.hypot(x, z), pos.getY(i), Math.atan2(x, z), v);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  const radial = Math.max(8, Math.round(segments / 3));
  const parts = [lathe, sleeve(-1, reach, radial), sleeve(1, reach, radial)];
  const merged = mergeGeometries(parts);
  parts.forEach((p) => p.dispose());
  merged.computeVertexNormals();
  return merged;
}
