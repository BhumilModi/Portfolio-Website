import * as THREE from "three";
import { NOISE, SANZU } from "./common";

// calibration knob: depth, width, height and opacity per bank (opacity 0.08–0.3). The low tier keeps every other one.
const LAYERS = [
  { z: -7, w: 44, h: 2.2, opacity: 0.12 },
  { z: -15, w: 64, h: 3.2, opacity: 0.16 },
  { z: -26, w: 96, h: 4.6, opacity: 0.18 },
  { z: -44, w: 150, h: 7, opacity: 0.22 },
];

const vertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragment = /* glsl */ `
uniform float uTime;
uniform float uOpacity;
uniform float uSeed;
uniform vec3 uColor;
varying vec2 vUv;
${NOISE}
void main() {
  float n = fbm(vec2(vUv.x * 6.0 + uTime * 0.03 + uSeed, vUv.y * 2.0 - uTime * 0.01));
  float sides = smoothstep(0.0, 0.08, vUv.x) * (1.0 - smoothstep(0.92, 1.0, vUv.x));
  float a = smoothstep(0.35, 0.8, n) * pow(1.0 - vUv.y, 1.6) * sides;
  gl_FragColor = vec4(uColor, a * uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/** Mist banks drifting over the water: soft vertical planes, densest at the waterline. */
export function buildMist(layers: number) {
  const uTime = { value: 0 };
  const group = new THREE.Group();
  const picked = layers >= LAYERS.length ? LAYERS : LAYERS.filter((_, i) => i % 2 === 1);
  const owned: { dispose(): void }[] = [];
  picked.forEach((l, i) => {
    const material = new THREE.ShaderMaterial({
      uniforms: { uTime, uOpacity: { value: l.opacity }, uSeed: { value: i * 3.7 }, uColor: { value: new THREE.Color(SANZU.mist) } },
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
    });
    const geometry = new THREE.PlaneGeometry(l.w, l.h);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(2, l.h / 2 - 0.3, l.z);
    group.add(mesh);
    owned.push(material, geometry);
  });
  return { group, uniforms: { uTime }, dispose: () => owned.forEach((o) => o.dispose()) };
}
