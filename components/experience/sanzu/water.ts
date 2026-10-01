import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { SANZU } from "./common";
import { MOON_POS } from "./sky";

const vertex = /* glsl */ `
#ifdef REFLECT
uniform mat4 textureMatrix;
varying vec4 vUv;
#endif
varying vec3 vWorld;
#include <common>
#include <fog_pars_vertex>
void main() {
  #ifdef REFLECT
  vUv = textureMatrix * vec4(position, 1.0);
  #endif
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  vec4 mvPosition = viewMatrix * w;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

// Mirror-black water. Normal tier: the Reflector's texture, bent by two travelling ripple fields, weighted by
// Fresnel. Low tier: a glossy gradient toward the horizon instead. Both: a moon path and a dark foreground.
const fragment = /* glsl */ `
uniform vec3 color;
uniform float uTime;
uniform vec3 uMoon;
uniform vec3 uMoonColor;
uniform float uStreak;
uniform float uNear;
#ifdef REFLECT
uniform sampler2D tDiffuse;
uniform float uDistort;
uniform float uReflect;
varying vec4 vUv;
#else
uniform vec3 uHorizon;
#endif
varying vec3 vWorld;
#include <common>
#include <fog_pars_fragment>
void main() {
  vec2 p = vWorld.xz;
  vec2 ripple = vec2(
    sin(p.x * 0.9 + uTime * 0.7) + sin(p.y * 1.7 - uTime * 0.5),
    cos(p.y * 1.1 + uTime * 0.6) + sin(p.x * 1.3 - uTime * 0.45)
  ) * 0.5;
  vec3 toFrag = vWorld - cameraPosition;
  float d = length(toFrag.xz);
  float fres = 0.04 + 0.96 * pow(1.0 - clamp(normalize(-toFrag).y, 0.0, 1.0), 5.0);
  vec3 col = color;
  #ifdef REFLECT
  vec4 uv = vUv;
  uv.xy += ripple * uDistort * uv.w;
  col += texture2DProj(tDiffuse, uv).rgb * fres * uReflect;
  #else
  col = mix(col, uHorizon, fres * 0.9);
  #endif
  // The moon's path: a band straight below the moon (x/z only, so the descent's y offset doesn't matter).
  float a = atan(toFrag.x, -toFrag.z);
  float m = atan(uMoon.x - cameraPosition.x, -(uMoon.z - cameraPosition.z));
  float band = exp(-pow((a - m) * 24.0, 2.0));
  float glitter = smoothstep(0.2, 1.0, ripple.x * 0.6 + ripple.y * 0.4 + 0.3);
  col += uMoonColor * band * glitter * uStreak * smoothstep(4.0, 24.0, d);
  // Foreground stays dark, so the footer credit reads over it (the lesson from Task 8 of the first plan).
  col *= mix(uNear, 1.0, smoothstep(2.0, 12.0, d));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`;

const SIZE = 400;

function uniforms(): Record<string, THREE.IUniform> {
  return THREE.UniformsUtils.merge([
    THREE.UniformsLib.fog,
    {
      uTime: { value: 0 },
      uMoon: { value: new THREE.Vector3(...MOON_POS) },
      uMoonColor: { value: new THREE.Color(SANZU.moon) },
      uStreak: { value: 0.35 }, // calibration knob: moon path brightness, 0.15–0.6
      uNear: { value: 0.15 }, // calibration knob: foreground brightness under the footer, 0–0.3
    },
  ]);
}

/** The river. The normal tier reflects the scene (the temple, portal, guardians, moon); the low tier fakes it. */
export function buildWater(low: boolean) {
  const geometry = new THREE.PlaneGeometry(SIZE, SIZE);
  if (low) {
    const material = new THREE.ShaderMaterial({
      uniforms: { ...uniforms(), color: { value: new THREE.Color(SANZU.water) }, uHorizon: { value: new THREE.Color(SANZU.horizon) } },
      vertexShader: vertex,
      fragmentShader: fragment,
      fog: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    return { mesh, uniforms: material.uniforms, dispose: () => (geometry.dispose(), material.dispose()) };
  }
  const dpr = Math.min(window.devicePixelRatio, 2);
  const scale = 0.35; // calibration knob: reflection resolution vs the screen, 0.35–0.75 (the ripples soften it anyway)
  const mesh = new Reflector(geometry, {
    textureWidth: Math.round(window.innerWidth * dpr * scale),
    textureHeight: Math.round(window.innerHeight * dpr * scale),
    clipBias: 0.003,
    multisample: 0,
    color: SANZU.water,
    shader: {
      name: "SanzuWater",
      uniforms: {
        ...uniforms(),
        color: { value: null },
        tDiffuse: { value: null },
        textureMatrix: { value: null },
        uDistort: { value: 0.012 }, // calibration knob: ripple bend of the reflection, 0.005–0.03
        uReflect: { value: 0.9 },
      },
      vertexShader: "#define REFLECT\n" + vertex,
      fragmentShader: "#define REFLECT\n" + fragment,
    },
  });
  const material = mesh.material as THREE.ShaderMaterial;
  material.fog = true;
  mesh.rotation.x = -Math.PI / 2;
  return { mesh, uniforms: material.uniforms, dispose: () => (mesh.dispose(), geometry.dispose()) };
}
