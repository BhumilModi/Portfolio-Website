import * as THREE from "three";
import { NOISE, SANZU } from "./common";

// calibration knob: just above the Gate's pediment as seen from RIVER_CAMERA; stay inside the dome (radius 180).
export const MOON_POS: [number, number, number] = [20, 44, -120];

const skyVertex = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const skyFragment = /* glsl */ `
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uGlow;
uniform vec3 uMoonDir;
uniform float uTime;
varying vec3 vDir;
${NOISE}
void main() {
  vec3 d = normalize(vDir);
  vec3 col = mix(uHorizon, uZenith, smoothstep(-0.02, 0.5, d.y));
  float m = max(dot(d, uMoonDir), 0.0);
  col += uGlow * (pow(m, 40.0) * 0.5 + pow(m, 8.0) * 0.12);
  // Faint stars: about one cell in 1200, gone toward the horizon haze, each twinkling at its own rate.
  vec2 cell = floor(vec2(atan(d.z, d.x), asin(clamp(d.y, -1.0, 1.0))) * 700.0);
  float s = hash21(cell);
  float star = step(0.99915, s) * smoothstep(0.05, 0.4, d.y) * (0.55 + 0.45 * sin(uTime * (0.8 + s * 2.0) + s * 60.0));
  col += vec3(0.78, 0.84, 1.0) * star * 0.8;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const moonVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const moonFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
varying vec2 vUv;
${NOISE}
void main() {
  vec2 c = (vUv - 0.5) * 2.0;
  float r = length(c);
  if (r > 1.0) discard;
  float limb = 0.72 + 0.28 * sqrt(1.0 - r * r);
  float maria = noise2(c * 3.0 + 1.7) * 0.2 + noise2(c * 7.0) * 0.08;
  // A thin hot ring with a faint face: the spirit pass draws it as a lit halo, not a flat grey coin (spirit spec §3.2).
  float ring = smoothstep(0.86, 0.9, r) * (1.0 - smoothstep(0.96, 1.0, r));
  float face = 0.15 * limb * (1.0 - maria) * (1.0 - smoothstep(0.86, 0.9, r)); // calibration knob: face fill, 0–0.3
  gl_FragColor = vec4(uColor * uIntensity, ring + face);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/** Ink sky with a moon-glow and faint stars. Unfogged; drawn first, behind everything. */
export function buildSky() {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uZenith: { value: new THREE.Color(SANZU.zenith) },
      uHorizon: { value: new THREE.Color(SANZU.horizon) },
      uGlow: { value: new THREE.Color(SANZU.skyGlow) },
      uMoonDir: { value: new THREE.Vector3(...MOON_POS).normalize() },
      uTime: { value: 0 },
    },
    vertexShader: skyVertex,
    fragmentShader: skyFragment,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(180, 48, 24), material);
  mesh.renderOrder = -10;
  return { mesh, material, dispose: () => (mesh.geometry.dispose(), material.dispose()) };
}

/** A pale low moon: a hot ring with a faint face. Faces +z, toward the river camera. */
export function buildMoon() {
  const material = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(SANZU.moon) }, uIntensity: { value: 1.9 } }, // calibration knob: 1.2–2.5
    vertexShader: moonVertex,
    fragmentShader: moonFragment,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(4.2, 64), material);
  mesh.position.set(...MOON_POS);
  mesh.renderOrder = -9;
  return { mesh, material, dispose: () => (mesh.geometry.dispose(), material.dispose()) };
}
