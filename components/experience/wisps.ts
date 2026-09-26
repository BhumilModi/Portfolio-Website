import * as THREE from "three";

const wispVertex = /* glsl */ `
uniform float uTime;
uniform float uHeight;
uniform float uSize;
uniform float uMaxSize;
uniform float uSpeed;
uniform float uPixelRatio;
attribute float aRand;
varying float vAlpha;
void main() {
  vec3 p = position;
  p.y = mod(p.y + uTime * uSpeed * (0.4 + aRand * 0.6), uHeight);
  p.x += sin(uTime * 0.5 + aRand * 20.0) * 0.3;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  // Capped, so a mote drifting past the lens stays a mote, not a blob over the footer.
  gl_PointSize = min(uSize * uPixelRatio / -mv.z, uMaxSize * uPixelRatio);
  vAlpha = sin(3.14159 * p.y / uHeight);
}
`;

const wispFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uIntensity;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  gl_FragColor = vec4(uColor * uIntensity, vAlpha * uOpacity * 0.8 * pow(1.0 - d, 1.5));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export type WispOptions = { color: string; size?: number; maxSize?: number; speed?: number; intensity?: number };

/** Motes rising through a width×height×width box (x, z centred on 0; y from 0 up): shaft wisps, hitodama, shadow smoke. */
export function buildWisps(count: number, width: number, height: number, { color, size = 28, maxSize = 4, speed = 1, intensity = 1 }: WispOptions) {
  const pos = new Float32Array(count * 3);
  const rand = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos.set([(Math.random() - 0.5) * width, Math.random() * height, (Math.random() - 0.5) * width], i * 3);
    rand[i] = Math.random();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uHeight: { value: height },
      uSize: { value: size },
      uMaxSize: { value: maxSize },
      uSpeed: { value: speed },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: 1 },
      uIntensity: { value: intensity },
    },
    vertexShader: wispVertex,
    fragmentShader: wispFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(g, material);
  points.frustumCulled = false;
  return { points, material };
}
