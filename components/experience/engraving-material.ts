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

// Screen-space line hatching: brighter surfaces pick up more hatch layers, then solid highlights.
const fragmentShader = /* glsl */ `
uniform vec3 uBone;
uniform vec3 uVoid;
uniform vec3 uLight;
uniform float uSpacing;
uniform float uReveal;
uniform float uOpacity;
varying vec3 vNormal;
varying float vWorldY;

float lines(vec2 p, float angle, float spacing, float width) {
  vec2 n = vec2(-sin(angle), cos(angle));
  float d = abs(fract(dot(p, n) / spacing) - 0.5) * spacing;
  return 1.0 - smoothstep(width * 0.5 - 0.5, width * 0.5 + 0.5, d);
}

void main() {
  if (vWorldY > uReveal) discard;
  vec3 n = normalize(vNormal);
  float diffuse = max(dot(n, normalize(uLight)), 0.0);
  float rim = pow(1.0 - abs(n.z), 3.0);
  float l = clamp(diffuse * 0.85 + rim * 0.45, 0.0, 1.0);
  vec2 p = gl_FragCoord.xy;
  float ink = lines(p, 0.785, uSpacing, 0.8 + 2.2 * l) * step(0.1, l);
  ink = max(ink, lines(p, -0.785, uSpacing, 0.6 + 1.8 * l) * step(0.38, l));
  ink = max(ink, lines(p, 0.0, uSpacing * 0.7, 0.6 + 1.4 * l) * step(0.66, l));
  ink = max(ink, step(0.9, l));
  float scan = 0.86 + 0.14 * step(0.5, fract(p.y * 0.5));
  gl_FragColor = vec4(mix(uVoid, uBone, ink * scan), uOpacity);
  #include <colorspace_fragment>
}
`;

export type EngravingOptions = { spacing?: number; reveal?: number; opacity?: number };

// spacing is in device pixels — calibration knob for line density.
export function createEngravingMaterial({ spacing = 5, reveal = 100, opacity = 1 }: EngravingOptions = {}) {
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
