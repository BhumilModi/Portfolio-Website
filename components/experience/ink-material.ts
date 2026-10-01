import * as THREE from "three";
import { NOISE } from "./sanzu/common";

// The ink pass (ink spec §3.1). Every number here is a calibration knob, tuned against the look test (§11 step 0).
export const INK_KNOBS = {
  exposure: 1.8, // calibration knob: scene luminance gain before the washes, 1.2–2.6 (lower loses the torii against the sky)
  gamma: 0.85, // calibration knob: wash response curve, 0.6–1.2 (lower lifts the mid washes)
  steps: 4, // calibration knob: number of ink washes, 3–5
  softness: 0.12, // calibration knob: how far a wash bleeds into the next, 0.02–0.25 (fraction of a band)
  noiseScale: 3, // calibration knob: size of the wash-edge wobble, 1–6 (screen heights per cell)
  wobble: 0.55, // calibration knob: how far the wash edges wander, 0–1 (fraction of a band)
  edge: 0.06, // calibration knob: relative depth step that inks an outline, 0.02–0.15
  edgeWidth: 1.5, // calibration knob: outline sample radius in px, 1–3
  redHalfWidth: 14, // calibration knob: half-width of the kept red hue band in degrees, 8–22
  satFloor: 0.35, // calibration knob: saturation a red pixel needs to keep its colour, 0.2–0.5
  redLift: 0.45, // calibration knob: darkest a kept red goes, 0.2–0.7 (of full red), so the lacquer reads in shadow
  grain: 0.08, // calibration knob: paper grain strength, 0.03–0.15
} as const;

const vertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragment = /* glsl */ `
uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform vec2 uResolution;
uniform float uNear;
uniform float uFar;
uniform vec3 uInk;
uniform vec3 uPaper;
uniform vec3 uRed;
uniform float uExposure, uGamma, uSteps, uSoftness, uNoiseScale, uWobble, uEdge, uEdgeWidth, uRedHalf, uSatFloor, uRedLift, uGrain;
varying vec2 vUv;
${NOISE}

float linearDepth(vec2 uv) {
  float z = texture2D(tDepth, uv).x * 2.0 - 1.0;
  return 2.0 * uNear * uFar / (uFar + uNear - z * (uFar - uNear));
}

// Sobel on depth, relative to the centre's depth so a near stem and a far roofline ink alike.
float edgeAt(vec2 uv, float radius) {
  vec2 px = radius / uResolution;
  float tl = linearDepth(uv + px * vec2(-1.0, 1.0));
  float t = linearDepth(uv + px * vec2(0.0, 1.0));
  float tr = linearDepth(uv + px * vec2(1.0, 1.0));
  float l = linearDepth(uv + px * vec2(-1.0, 0.0));
  float r = linearDepth(uv + px * vec2(1.0, 0.0));
  float bl = linearDepth(uv + px * vec2(-1.0, -1.0));
  float b = linearDepth(uv + px * vec2(0.0, -1.0));
  float br = linearDepth(uv + px * vec2(1.0, -1.0));
  float gx = (tr + 2.0 * r + br) - (tl + 2.0 * l + bl);
  float gy = (tl + 2.0 * t + tr) - (bl + 2.0 * b + br);
  float c = linearDepth(uv);
  return length(vec2(gx, gy)) / max(c, 1e-3);
}

vec3 hsvOf(vec3 c) {
  float mx = max(c.r, max(c.g, c.b));
  float mn = min(c.r, min(c.g, c.b));
  float d = mx - mn;
  float h = 0.0;
  if (d > 1e-5) {
    if (mx == c.r) h = mod((c.g - c.b) / d, 6.0);
    else if (mx == c.g) h = (c.b - c.r) / d + 2.0;
    else h = (c.r - c.g) / d + 4.0;
  }
  return vec3(h * 60.0, mx > 1e-5 ? d / mx : 0.0, mx);
}

void main() {
  vec3 hdr = texture2D(tColor, vUv).rgb;
  vec2 cell = vUv * vec2(uResolution.x / uResolution.y, 1.0) * uNoiseScale;

  // Washes: luminance posterized into a few ink tones, with soft wandering band edges so they bleed like wet ink.
  float lum = dot(hdr, vec3(0.2126, 0.7152, 0.0722)) * uExposure;
  float x = pow(clamp(lum, 0.0, 1.0), uGamma);
  float q = x * uSteps + (fbm(cell) - 0.5) * uWobble;
  float f = fract(q);
  float v = clamp((floor(q) + smoothstep(0.5 - uSoftness, 0.5 + uSoftness, f)) / uSteps, 0.0, 1.0);

  // Brush outlines: depth edges whose pressure swells and breaks along the stroke.
  float pressure = 0.6 + 0.8 * fbm(cell * 1.7 + 11.0);
  float e = edgeAt(vUv, uEdgeWidth * pressure);
#ifndef LOW
  e = max(e, 0.6 * edgeAt(vUv, uEdgeWidth * pressure * 2.0));
#endif
  float stroke = smoothstep(uEdge, uEdge * 1.8, e) * smoothstep(0.25, 0.45, pressure * fbm(cell * 4.0 + 3.0) + 0.2);
  v *= 1.0 - stroke;

  vec3 ink = mix(uInk, uPaper, v);

  // Red key: only a saturated red survives; everything else is ink on paper.
  vec3 hsv = hsvOf(hdr);
  float hueOff = min(hsv.x, 360.0 - hsv.x);
  float red = (1.0 - smoothstep(uRedHalf * 0.6, uRedHalf, hueOff)) * smoothstep(uSatFloor, uSatFloor + 0.15, hsv.y) * step(1e-4, hsv.z);
  vec3 redTone = uRed * mix(uRedLift, 1.15, v) * (1.0 - 0.6 * stroke);
  vec3 color = mix(ink, redTone, red);

  // Paper: fixed in screen space, grain plus slow fibres.
  vec2 frag = gl_FragCoord.xy;
  float grain = hash21(frag) * 0.6 + fbm(frag / vec2(220.0, 38.0)) * 0.4;
  color *= 1.0 - uGrain * grain;

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
`;

/** The full-screen ink shader. tColor/tDepth/uResolution/uNear/uFar are written by components/experience/ink.tsx each frame. */
export function createInkMaterial({ low }: { low: boolean }): THREE.ShaderMaterial {
  const k = INK_KNOBS;
  return new THREE.ShaderMaterial({
    defines: low ? { LOW: "" } : {},
    uniforms: {
      tColor: { value: null },
      tDepth: { value: null },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uNear: { value: 0.1 },
      uFar: { value: 400 },
      // Mirror --color-void, --color-bone and --color-lily (app/globals.css).
      uInk: { value: new THREE.Color("#0b0907") },
      uPaper: { value: new THREE.Color("#efe6d4") },
      uRed: { value: new THREE.Color("#c8232c") },
      uExposure: { value: k.exposure },
      uGamma: { value: k.gamma },
      uSteps: { value: k.steps },
      uSoftness: { value: k.softness },
      uNoiseScale: { value: k.noiseScale },
      uWobble: { value: k.wobble },
      uEdge: { value: k.edge },
      uEdgeWidth: { value: k.edgeWidth },
      uRedHalf: { value: k.redHalfWidth },
      uSatFloor: { value: k.satFloor },
      uRedLift: { value: k.redLift },
      uGrain: { value: k.grain },
    },
    vertexShader: vertex,
    fragmentShader: fragment,
    depthTest: false,
    depthWrite: false,
  });
}
