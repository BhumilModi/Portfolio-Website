import * as THREE from "three";

const vertexShader = /* glsl */ `
varying vec3 vNormal;
varying float vWorldY;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorldY = world.y;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

// Screen-space 8×8 ordered (Bayer) dither: a cell inks bone when its surface brightness beats the cell's threshold.
const fragmentShader = /* glsl */ `
uniform vec3 uBone;
uniform vec3 uVoid;
uniform vec3 uLight;
uniform float uSpacing;
uniform float uReveal;
uniform float uOpacity;
varying vec3 vNormal;
varying float vWorldY;

float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2.0 + a.y * a.y * 0.75);
}
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

void main() {
  if (vWorldY > uReveal) discard;
  vec3 n = normalize(vNormal);
  float diffuse = max(dot(n, normalize(uLight)), 0.0);
  float rim = pow(1.0 - abs(n.z), 3.0);
  float l = clamp(diffuse * 0.85 + rim * 0.45, 0.0, 1.0);
  vec2 cell = floor(gl_FragCoord.xy / uSpacing);
  float threshold = bayer8(cell) + 1.0 / 128.0;
  float ink = step(threshold, l);
  gl_FragColor = vec4(mix(uVoid, uBone, ink), uOpacity);
  #include <colorspace_fragment>
}
`;

export type EngravingOptions = { spacing?: number; reveal?: number; opacity?: number };

// spacing is the dither cell size in device pixels — calibration knob for dot size.
export function createEngravingMaterial({ spacing = 3, reveal = 100, opacity = 1 }: EngravingOptions = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uBone: { value: new THREE.Color("#efe6d4") },
      uVoid: { value: new THREE.Color("#0b0907") },
      uLight: { value: new THREE.Vector3(0.55, 0.65, 0.8) },
      uSpacing: { value: spacing },
      uReveal: { value: reveal },
      uOpacity: { value: opacity },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
  });
}
