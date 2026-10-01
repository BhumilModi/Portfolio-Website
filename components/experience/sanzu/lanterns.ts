import * as THREE from "three";
import { SANZU } from "./common";

// calibration knob: the drift band (x span centred on centerX; z from near to far) and the flow speed in units/s (0.05–0.25).
export const LANTERN = { span: 36, centerX: 2, near: -3, far: -38, y: 0.02, speed: 0.12 } as const;

// Shared by the lanterns, and mirrored by lanternCenter() below for the two point lights.
const drift = /* glsl */ `
uniform float uTime;
uniform float uSpan;
uniform float uCenterX;
uniform float uSpeed;
// xyz: the lantern's base on the water; w: 0–1 scale, shrinking to nothing where the band wraps round.
vec4 lanternCenter(vec3 offset, float seed) {
  float left = uCenterX - uSpan * 0.5;
  float x = left + mod(offset.x - left + uTime * uSpeed * (1.0 + seed * 0.7), uSpan);
  float edge = smoothstep(0.0, 2.5, min(x - left, left + uSpan - x));
  return vec4(x, offset.y + sin(uTime * 1.3 + seed * 40.0) * 0.03, offset.z, edge);
}
`;

const bodyVertex = /* glsl */ `
attribute vec3 aOffset;
attribute float aSeed;
varying vec2 vUv;
varying float vFlicker;
${drift}
#include <common>
#include <fog_pars_vertex>
void main() {
  vec4 c = lanternCenter(aOffset, aSeed);
  float tilt = sin(uTime * 0.9 + aSeed * 17.0) * 0.07;
  float yaw = aSeed * 6.2831;
  vec3 p = position * c.w;
  p.xy = mat2(cos(tilt), sin(tilt), -sin(tilt), cos(tilt)) * p.xy;
  p.xz = mat2(cos(yaw), sin(yaw), -sin(yaw), cos(yaw)) * p.xz;
  vec4 mvPosition = modelViewMatrix * vec4(p + c.xyz, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  vUv = uv;
  vFlicker = 0.88 + 0.12 * sin(uTime * 7.0 + aSeed * 90.0) * sin(uTime * 3.1 + aSeed * 13.0);
  #include <fog_vertex>
}
`;

// Paper faces lit from inside, hottest at the centre where the candle is, with a dark wooden frame round each face.
const bodyFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
varying vec2 vUv;
varying float vFlicker;
#include <common>
#include <fog_pars_fragment>
void main() {
  vec2 e = min(vUv, 1.0 - vUv);
  float frame = 1.0 - smoothstep(0.03, 0.08, min(e.x, e.y));
  float hot = 1.0 - length(vUv - 0.5) * 1.2;
  vec3 paper = uColor * uIntensity * vFlicker * (0.55 + 0.45 * hot);
  gl_FragColor = vec4(mix(paper, vec3(0.04, 0.025, 0.015), frame), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`;

export type Lanterns = {
  mesh: THREE.Mesh;
  offsets: Float32Array;
  seeds: Float32Array;
  uniforms: { uTime: THREE.IUniform<number> };
  dispose(): void;
};

/** Tōrō nagashi: paper lanterns drifting downstream and bobbing, all in one instanced draw. Motion is in the shader. */
export function buildLanterns(count: number, rand: () => number = Math.random): Lanterns {
  const offsets = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    offsets.set([LANTERN.centerX + (rand() - 0.5) * LANTERN.span, LANTERN.y, LANTERN.near + rand() * (LANTERN.far - LANTERN.near)], i * 3);
    seeds[i] = rand();
  }
  // Slots 0 and 1 carry the two real point lights: start them near, where their light lands on water in frame.
  offsets.set([-1, LANTERN.y, -6], 0);
  offsets.set([7, LANTERN.y, -9], 3);

  // Shared uniform objects: one write per frame moves every lantern.
  const drifting = { uTime: { value: 0 }, uSpan: { value: LANTERN.span }, uCenterX: { value: LANTERN.centerX }, uSpeed: { value: LANTERN.speed } };

  // A paper cylinder, so it reads as a lantern in outline rather than a box (spirit spec §3.2).
  const box = new THREE.CylinderGeometry(0.13, 0.15, 0.32, 12).translate(0, 0.16, 0);
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setIndex(box.index);
  for (const [name, attr] of Object.entries(box.attributes)) geometry.setAttribute(name, attr);
  geometry.setAttribute("aOffset", new THREE.InstancedBufferAttribute(offsets, 3));
  geometry.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 1));
  geometry.instanceCount = count;
  const material = new THREE.ShaderMaterial({
    uniforms: {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      ...drifting,
      uColor: { value: new THREE.Color(SANZU.lantern) },
      uIntensity: { value: 2.4 }, // calibration knob: 1.5–3.5 (HDR: above the bloom threshold)
    },
    vertexShader: bodyVertex,
    fragmentShader: bodyFragment,
    fog: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false; // positions come from the shader

  return {
    mesh,
    offsets,
    seeds,
    uniforms: drifting,
    dispose() {
      box.dispose();
      geometry.dispose();
      material.dispose();
    },
  };
}

const smooth = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

/** The JS twin of the shader's lanternCenter(): writes lantern i's base into `out` and returns its 0–1 scale. */
export function lanternCenter(l: Lanterns, i: number, time: number, out: THREE.Vector3): number {
  const left = LANTERN.centerX - LANTERN.span / 2;
  const seed = l.seeds[i];
  const raw = l.offsets[i * 3] - left + time * LANTERN.speed * (1 + seed * 0.7);
  const x = left + (((raw % LANTERN.span) + LANTERN.span) % LANTERN.span);
  out.set(x, l.offsets[i * 3 + 1] + Math.sin(time * 1.3 + seed * 40) * 0.03, l.offsets[i * 3 + 2]);
  return smooth(Math.min(x - left, left + LANTERN.span - x) / 2.5);
}
