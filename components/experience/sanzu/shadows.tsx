"use client";
import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { quest } from "@/lib/quest";
import { scene } from "@/lib/scene";
import { clamp01, easeOutCubic } from "@/lib/timeline";
import { buildWisps } from "../wisps";
import { INK, SANZU, sanzuClock } from "./common";
import { TORII } from "./torii";

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
varying vec3 vNormalW;
varying vec3 vWorld;
#include <common>
#include <fog_pars_vertex>
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 mvPosition = viewMatrix * w;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

// Near-black bodies with a Monarch-violet rim where the surface turns away: shadows, not statues.
const fragment = /* glsl */ `
uniform vec3 uBody;
uniform vec3 uRim;
uniform float uOpacity;
varying vec3 vNormalW;
varying vec3 vWorld;
#include <common>
#include <fog_pars_fragment>
void main() {
  float facing = clamp(dot(normalize(vNormalW), normalize(cameraPosition - vWorld)), 0.0, 1.0);
  vec3 col = uBody + uRim * pow(1.0 - facing, 2.5) * 1.8;
  gl_FragColor = vec4(col, uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`;

/** Seven soldiers from primitives (legs, tapered torso, pauldrons, arms, head under a pointed hood, cloak), System-blue eyes. */
function buildArmy(low: boolean) {
  const body = new THREE.ShaderMaterial({
    uniforms: {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      uBody: { value: new THREE.Color(SANZU.shadow) },
      uRim: { value: new THREE.Color(INK.monarch) },
      uOpacity: { value: 1 },
    },
    vertexShader: vertex,
    fragmentShader: fragment,
    fog: true,
    transparent: true,
  });
  // HDR System blue: the eyes are the only part of a soldier that blooms.
  const eye = new THREE.MeshBasicMaterial({ color: new THREE.Color(INK.system).multiplyScalar(5), transparent: true });
  const geo = {
    leg: new THREE.CapsuleGeometry(0.11, 0.7, 4, 8),
    torso: new THREE.CylinderGeometry(0.34, 0.2, 0.8, 10),
    pauldron: new THREE.SphereGeometry(0.17, 12, 8),
    arm: new THREE.CapsuleGeometry(0.08, 0.62, 4, 8),
    head: new THREE.SphereGeometry(0.17, 16, 12),
    hood: new THREE.ConeGeometry(0.2, 0.36, 10),
    cloak: new THREE.ConeGeometry(0.5, 1.55, 12, 1, true),
    eye: new THREE.SphereGeometry(0.03, 8, 6),
    blade: new THREE.BoxGeometry(0.05, 1.3, 0.02),
  };
  const group = new THREE.Group();
  const soldiers = FORMATION.map((f, i) => {
    const s = new THREE.Group();
    const put = (g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, rz = 0, sy = 1) => {
      const mesh = new THREE.Mesh(g, m);
      mesh.position.set(x, y, z);
      mesh.rotation.z = rz;
      mesh.scale.y = sy;
      s.add(mesh);
    };
    for (const side of [-1, 1]) {
      put(geo.leg, body, side * 0.14, 0.46, 0);
      put(geo.pauldron, body, side * 0.38, 1.56, 0, 0, 0.7);
      put(geo.arm, body, side * 0.43, 1.13, 0.02, side * 0.12);
      put(geo.eye, eye, side * 0.06, 1.84, 0.16);
    }
    put(geo.torso, body, 0, 1.22, 0);
    put(geo.head, body, 0, 1.82, 0);
    put(geo.hood, body, 0, 2.06, -0.02);
    put(geo.cloak, body, 0, 0.98, -0.12);
    if (i === 3) put(geo.blade, body, 0.62, 0.95, 0.12, 0.08); // the knight in the centre carries a blade
    s.scale.setScalar(f.scale);
    s.position.set(f.x, -DEPTH, f.z);
    group.add(s);
    return s;
  });
  // Violet smoke curling up round their feet.
  const smoke = buildWisps(low ? 110 : 220, 9, 2.4, { color: INK.monarch, size: 40, maxSize: 8, speed: 0.35, intensity: 1.6 });
  smoke.points.position.set(TORII.x, 0, TORII.z + 3.2);
  group.add(smoke.points);
  // Left visible on purpose: the descent pre-compiles visible objects at mount, and the first frame hides it if not arisen.
  return {
    group,
    soldiers,
    body,
    eye,
    smoke,
    dispose() {
      Object.values(geo).forEach((g) => g.dispose());
      body.dispose();
      eye.dispose();
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
    army.eye.opacity = fade;
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
