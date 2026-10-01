import * as THREE from "three";
import { INK, NOISE } from "./common";

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
uniform float uIntensity;
uniform vec3 uCore;
uniform vec3 uRim;
varying vec2 vUv;
${NOISE}
void main() {
  vec2 c = (vUv - 0.5) * 2.0; // the plane's own aspect makes it an ellipse between the pillars
  float r = length(c);
  if (r > 1.0) discard;
  // Arms that wind tighter toward the centre and turn slowly: rotate the noise lookup by an angle that grows inward.
  float twist = uTime * 0.35 + 2.4 / (r + 0.35);
  vec2 q = mat2(cos(twist), -sin(twist), sin(twist), cos(twist)) * c;
  float arms = smoothstep(0.42, 0.85, fbm(q * 2.6 + vec2(0.0, -uTime * 0.12)));
  float core = pow(1.0 - r, 2.4);
  float rim = smoothstep(0.62, 0.93, r) * (1.0 - smoothstep(0.93, 1.0, r));
  vec3 col = mix(uRim, uCore, clamp(core * 1.6 + arms * (1.0 - r) * 0.5, 0.0, 1.0));
  float glow = core * 1.6 + arms * (0.35 + 0.65 * (1.0 - r)) + rim * 0.8;
  float edge = 1.0 - smoothstep(0.88, 1.0, r);
  gl_FragColor = vec4(col * glow * uIntensity, edge * uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/**
 * The Gate's portal: a swirling System-blue core with a Monarch-violet rim — the brightest thing in the frame.
 * HDR (values above 1) so it blooms; additive. Used on the torii and as the descent's approach disc.
 */
export function createPortalMaterial(intensity = 2.0) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uIntensity: { value: intensity }, // calibration knob: 1.8–3.5
      uCore: { value: new THREE.Color(INK.bone) },
      uRim: { value: new THREE.Color(INK.spirit) },
    },
    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}
