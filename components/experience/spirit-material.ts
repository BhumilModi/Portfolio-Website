import * as THREE from "three";
import { NOISE } from "./sanzu/common";

// The spirit pass (spirit spec §3.1). Every number is a calibration knob, tuned against the approved spike (0656887).
export const SPIRIT_KNOBS = {
  depthEdge: [0.02, 0.06], // calibration knob: relative depth-Laplacian band that inks a line, 0.01–0.1
  lumEdge: [1.0, 1.8], // calibration knob: log-luminance Sobel band, 0.6–2.5 (lower floods the water with ripple lines)
  lumWeight: 0.6, // calibration knob: luminance lines against depth lines, 0.3–1
  halo: 0.3, // calibration knob: soft glow from the radius-3 ring, 0–0.6 (skipped on the low tier)
  lineGain: 1.25, // calibration knob: line brightness, 0.8–2
  fill: 0.05, // calibration knob: faint surface fill, 0–0.15
  fade: 0.035, // calibration knob: line dimming with distance, 0.01–0.08
  barrel: 0.045, // calibration knob: CRT curvature, 0–0.1
  scan: 0.14, // calibration knob: scanline depth, 0–0.3
  grain: 0.05, // calibration knob: grain strength, 0–0.12
  vignette: 0.175, // calibration knob: edge darkening, 0–0.4
  redHalfWidth: 14, // calibration knob: half-width of the red hue band that burns ember, 8–22 degrees
  satFloor: 0.35, // calibration knob: saturation a pixel needs to count as red, 0.2–0.5
  // The approved spike wrote these as linear literals; these hexes reproduce it on screen.
  spirit: "#99faec", // calibration knob: line colour
  ember: "#ffa276", // calibration knob: red-key line colour
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
uniform float uNear, uFar, uTime;
uniform vec3 uGround, uSpirit, uEmber;
uniform vec2 uDepthEdge, uLumEdge;
uniform float uLumWeight, uHalo, uLineGain, uFill, uFade, uBarrel, uScan, uGrain, uVignette, uRedHalf, uSatFloor;
varying vec2 vUv;
${NOISE}

float linearDepth(vec2 uv) {
  float z = texture2D(tDepth, uv).x * 2.0 - 1.0;
  return 2.0 * uNear * uFar / (uFar + uNear - z * (uFar - uNear));
}
float lumAt(vec2 uv) { return log(1.0 + 6.0 * dot(texture2D(tColor, uv).rgb, vec3(0.2126, 0.7152, 0.0722))); }

// x: relative depth Laplacian (a grazing flat plane like the water has a steep gradient but no curvature, so no line);
// y: Sobel on log luminance (ripples, the scans' carving, the shades' folds).
vec2 edges(vec2 uv, float radius) {
  vec2 px = radius / uResolution;
  #define D(x, y) linearDepth(uv + px * vec2(x, y))
  #define L(x, y) lumAt(uv + px * vec2(x, y))
  float c0 = linearDepth(uv);
  float lap = abs(D(1.,0.) + D(-1.,0.) - 2.0 * c0) + abs(D(0.,1.) + D(0.,-1.) - 2.0 * c0)
            + 0.5 * (abs(D(1.,1.) + D(-1.,-1.) - 2.0 * c0) + abs(D(1.,-1.) + D(-1.,1.) - 2.0 * c0));
  float lgx = (L(1.,1.) + 2.0 * L(1.,0.) + L(1.,-1.)) - (L(-1.,1.) + 2.0 * L(-1.,0.) + L(-1.,-1.));
  float lgy = (L(-1.,-1.) + 2.0 * L(0.,-1.) + L(1.,-1.)) - (L(-1.,1.) + 2.0 * L(0.,1.) + L(1.,1.));
  return vec2(lap / max(c0, 1e-3), length(vec2(lgx, lgy)));
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
  // The CRT: barrel-curve the picture into a rounded screen.
  vec2 c = vUv * 2.0 - 1.0;
  c *= 1.0 + uBarrel * dot(c, c);
  vec2 uv = c * 0.5 + 0.5;
  vec2 box = abs(c) - vec2(0.94, 0.92);
  float corner = length(max(box, 0.0)) + min(max(box.x, box.y), 0.0) - 0.05;
  float screen = 1.0 - smoothstep(0.0, 0.012, corner);

  vec2 e1 = edges(uv, 1.0);
  float line = max(smoothstep(uDepthEdge.x, uDepthEdge.y, e1.x), smoothstep(uLumEdge.x, uLumEdge.y, e1.y) * uLumWeight);
  float halo = 0.0;
#ifndef LOW
  halo = smoothstep(0.03, 0.15, edges(uv, 3.0).x) * uHalo;
#endif
  float fade = 0.25 + 0.75 * exp(-linearDepth(uv) * uFade);

  vec3 hdr = texture2D(tColor, uv).rgb;
  float lum = dot(hdr, vec3(0.2126, 0.7152, 0.0722));
  vec3 hsv = hsvOf(hdr);
  float hueOff = min(hsv.x, 360.0 - hsv.x);
  float red = (1.0 - smoothstep(uRedHalf * 0.6, uRedHalf, hueOff)) * smoothstep(uSatFloor, uSatFloor + 0.15, hsv.y);

  vec3 tone = mix(uSpirit, uEmber, red);
  vec3 col = uGround * 0.6;
  col += tone * (line * uLineGain + halo) * fade;
  col += tone * smoothstep(0.05, 0.6, lum) * uFill;
  col += mix(vec3(0.9, 1.0, 0.97), uEmber, red) * smoothstep(0.7, 2.2, lum); // hot cores: moon, braziers, wisps, the shades' eyes

  vec2 frag = gl_FragCoord.xy;
  col *= 1.0 - uScan + uScan * sin(frag.y * 3.14159 * 0.5);
  col += (hash21(frag + fract(uTime * 7.31)) - 0.5) * uGrain;
  col *= 1.0 - uVignette * dot(c, c);
  col = mix(vec3(0.0), col, screen);
  gl_FragColor = vec4(max(col, 0.0), 1.0);
  #include <colorspace_fragment>
}
`;

/** The full-screen spirit shader. tColor/tDepth/uResolution/uNear/uFar/uTime are written by components/experience/spirit.tsx. */
export function createSpiritMaterial({ low }: { low: boolean }): THREE.ShaderMaterial {
  const k = SPIRIT_KNOBS;
  return new THREE.ShaderMaterial({
    defines: low ? { LOW: "" } : {},
    uniforms: {
      tColor: { value: null },
      tDepth: { value: null },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uNear: { value: 0.1 },
      uFar: { value: 400 },
      uTime: { value: 0 },
      uGround: { value: new THREE.Color("#0b0907") }, // mirrors --color-void
      uSpirit: { value: new THREE.Color(k.spirit) },
      uEmber: { value: new THREE.Color(k.ember) },
      uDepthEdge: { value: new THREE.Vector2(...k.depthEdge) },
      uLumEdge: { value: new THREE.Vector2(...k.lumEdge) },
      uLumWeight: { value: k.lumWeight },
      uHalo: { value: k.halo },
      uLineGain: { value: k.lineGain },
      uFill: { value: k.fill },
      uFade: { value: k.fade },
      uBarrel: { value: k.barrel },
      uScan: { value: k.scan },
      uGrain: { value: k.grain },
      uVignette: { value: k.vignette },
      uRedHalf: { value: k.redHalfWidth },
      uSatFloor: { value: k.satFloor },
    },
    vertexShader: vertex,
    fragmentShader: fragment,
    depthTest: false,
    depthWrite: false,
  });
}
