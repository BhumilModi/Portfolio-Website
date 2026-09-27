"use client";
import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { quest } from "@/lib/quest";
import { scene } from "@/lib/scene";
import { clamp01, easeOutCubic } from "@/lib/timeline";
import { buildWisps } from "../wisps";
import { INK, NOISE, SANZU, sanzuClock, sanzuRand } from "./common";
import { TORII } from "./torii";
import { buildWraith, wraithFace } from "./wraith";

const RISE_DELAY_S = 0.35; // the word lands first
const RISE_S = 1.5;
const STAGGER_S = 0.08; // centre first, then outward
const FADE_S = 0.8; // reduced motion: fade in, don't rise
const DEPTH = 2.4; // how far under the water they start

// calibration knob: the formation — a shallow V opening away from the camera, in front of the torii, right of the boat.
const FORMATION = [-3, -2, -1, 0, 1, 2, 3].map((k) => ({
  x: TORII.x + k * 1.15,
  z: TORII.z + 3.6 - Math.abs(k) * 0.45,
  scale: k === 0 ? 1.25 : 1 - Math.abs(k) * 0.03,
  order: Math.abs(k),
}));

const vertex = /* glsl */ `
uniform float uTime;
uniform float uFray; // 1 for cloth, 0 for the blade: steel neither stirs nor frays
varying vec3 vNormalW;
varying vec3 vWorld;
varying vec3 vLocal;
#include <common>
#include <fog_pars_vertex>
void main() {
  vec3 p = position;
  // The hem stirs in the current; the shoulders and hood stay put. Each soldier's x in the world offsets its phase.
  float loose = (1.0 - smoothstep(0.0, 1.0, p.y)) * uFray;
  float phase = modelMatrix[3].x * 1.7;
  p.x += sin(uTime * 1.3 + p.y * 3.0 + phase) * 0.05 * loose;
  p.z += cos(uTime * 1.1 + p.x * 4.0 + phase) * 0.04 * loose;
  vLocal = p;
  vec4 w = modelMatrix * vec4(p, 1.0);
  vWorld = w.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 mvPosition = viewMatrix * w;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

// Near-black cloaks with a Monarch-violet rim where the surface turns away: shadows, not statues. Below the waist the
// cloth frays into smoke: opacity falls off toward the hem through drifting noise, and the violet glows where it thins.
const fragment = /* glsl */ `
uniform vec3 uBody;
uniform vec3 uRim;
uniform float uOpacity;
uniform float uTime;
uniform float uFray;
varying vec3 vNormalW;
varying vec3 vWorld;
varying vec3 vLocal;
#include <common>
#include <fog_pars_fragment>
${NOISE}
void main() {
  float facing = clamp(dot(normalize(vNormalW), normalize(cameraPosition - vWorld)), 0.0, 1.0);
  float angle = atan(vLocal.x, vLocal.z);
  float n = noise2(vec2(angle * 2.5, vLocal.y * 3.0 - uTime * 0.6));
  float solid = mix(1.0, smoothstep(-0.1, 0.85, vLocal.y + (n - 0.5) * 0.5), uFray);
  if (solid * uOpacity < 0.02) discard;
  vec3 col = uBody + uRim * pow(1.0 - facing, 2.5) * 1.8;
  col += uRim * (1.0 - solid) * 0.9;
  gl_FragColor = vec4(col, uOpacity * solid);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`;

/** Seven hooded shades (a stooped, fraying cloak from ./wraith), System-blue eyes in the dark of the hood. */
function buildArmy(low: boolean) {
  const body = new THREE.ShaderMaterial({
    uniforms: {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      uBody: { value: new THREE.Color(SANZU.shadow) },
      uRim: { value: new THREE.Color(INK.monarch) },
      uOpacity: { value: 1 },
      uTime: { value: 0 },
      uFray: { value: 1 },
    },
    vertexShader: vertex,
    fragmentShader: fragment,
    fog: true,
    transparent: true,
  });
  // Same program, fray off. uOpacity and uTime are shared with the cloth, so the blade fades in with its bearer.
  const steel = body.clone();
  steel.uniforms = { ...body.uniforms, uFray: { value: 0 } };
  // HDR System blue: the eyes are the only part of a soldier that blooms.
  const eye = new THREE.MeshBasicMaterial({ color: new THREE.Color(INK.system).multiplyScalar(5), transparent: true });
  const void_ = new THREE.MeshBasicMaterial({ color: SANZU.shadow, transparent: true });
  const segments = low ? 24 : 40;
  const geo = {
    cloak: buildWraith({ segments }),
    bearer: buildWraith({ segments, reach: true }), // the centre knight's hands meet on the hilt
    face: new THREE.SphereGeometry(0.13, 16, 12),
    eye: new THREE.SphereGeometry(0.028, 8, 6),
    blade: new THREE.BoxGeometry(0.07, 1.05, 0.015),
    guard: new THREE.BoxGeometry(0.3, 0.035, 0.05),
    grip: new THREE.CylinderGeometry(0.022, 0.022, 0.22, 8),
  };
  const face = wraithFace();
  const group = new THREE.Group();
  const soldiers = FORMATION.map((f, i) => {
    const s = new THREE.Group();
    const put = (g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1) => {
      const mesh = new THREE.Mesh(g, m);
      mesh.position.set(x, y, z);
      mesh.scale.set(sx, sy, sz);
      s.add(mesh);
    };
    const bearer = i === 3;
    put(bearer ? geo.bearer : geo.cloak, body, 0, 0, 0);
    put(geo.face, void_, 0, face.y, face.z - 0.02, 1.1, 1.25, 0.6); // the dark inside the hood
    for (const side of [-1, 1]) put(geo.eye, eye, side * 0.055, face.y + 0.01, face.z + 0.045, 1.3, 0.7, 1);
    if (bearer) {
      put(geo.grip, steel, 0, 0.98, 0.52);
      put(geo.guard, steel, 0, 0.86, 0.52);
      put(geo.blade, steel, 0, 0.32, 0.52);
    }
    s.scale.setScalar(f.scale);
    s.position.set(f.x, -DEPTH, f.z);
    group.add(s);
    return s;
  });
  // Violet smoke curling up round their feet.
  const smoke = buildWisps(low ? 110 : 220, 9, 2.4, { color: INK.monarch, size: 40, maxSize: 8, speed: 0.35, intensity: 1.6, rand: sanzuRand(4) });
  smoke.points.position.set(TORII.x, 0, TORII.z + 3.2);
  group.add(smoke.points);
  // Left visible on purpose: the descent pre-compiles visible objects at mount, and the first frame hides it if not arisen.
  return {
    group,
    soldiers,
    body,
    eye,
    void_,
    smoke,
    dispose() {
      Object.values(geo).forEach((g) => g.dispose());
      body.dispose();
      steel.dispose();
      eye.dispose();
      void_.dispose();
      smoke.points.geometry.dispose();
      smoke.material.dispose();
    },
  };
}

/** The shadow army (redesign spec §6): hidden until ARISE, rises once, then stands and sways; already standing on later visits. */
export default function Shadows() {
  const low = scene.tier === "low";
  const army = useMemo(() => buildArmy(low), [low]);
  useEffect(() => () => army.dispose(), [army]);

  // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
  useFrame(({ clock }) => {
    const { arisen } = quest.get();
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    army.group.visible = arisen;
    if (!arisen) return;
    // Seconds since ARISE this session. A visitor who arose on an earlier visit finds them standing (Infinity → done).
    const since = scene.ariseAt ? (performance.now() - scene.ariseAt) / 1000 : Infinity;
    const time = sanzuClock(clock.elapsedTime);
    const still = scene.reducedMotion;
    const fade = still ? clamp01(since / FADE_S) : 1;
    army.body.uniforms.uOpacity.value = fade;
    army.body.uniforms.uTime.value = time;
    army.eye.opacity = fade;
    army.void_.opacity = fade;
    army.smoke.material.uniforms.uOpacity.value = still ? fade : clamp01((since - RISE_DELAY_S) / RISE_S);
    army.smoke.material.uniforms.uTime.value = time;
    army.soldiers.forEach((s, i) => {
      const k = still ? 1 : easeOutCubic((since - RISE_DELAY_S - FORMATION[i].order * STAGGER_S) / RISE_S);
      s.position.y = -DEPTH * (1 - k);
      s.rotation.z = Math.sin(time * 0.7 + i * 1.3) * 0.015 * k;
      s.rotation.x = Math.sin(time * 0.5 + i * 2.1) * 0.01 * k;
    });
  });

  return <primitive object={army.group} />;
}
