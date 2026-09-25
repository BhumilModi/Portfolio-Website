"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import { scene } from "@/lib/scene";
import { easeInOutCubic, easeOutCubic, local, smoothstep } from "@/lib/timeline";
import { createEngravingMaterial } from "./engraving-material";
import { useModelGeometry } from "./models";

export const FALLBACK_SPHERE = new THREE.SphereGeometry(1, 96, 64);

const particleVertex = /* glsl */ `
uniform float uMorph;
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
attribute vec3 aTarget;
attribute float aRand;
varying float vAlpha;
void main() {
  float t = clamp((uMorph - aRand * 0.35) / 0.65, 0.0, 1.0);
  t = t * t * (3.0 - 2.0 * t);
  vec3 drift = vec3(sin(uTime * 0.3 + aRand * 40.0), cos(uTime * 0.25 + aRand * 30.0), sin(uTime * 0.2 + aRand * 20.0)) * 0.15 * (1.0 - t);
  vec4 mv = modelViewMatrix * vec4(mix(position + drift, aTarget, t), 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * uPixelRatio / -mv.z;
  vAlpha = 0.35 + 0.65 * t;
}
`;

const particleFragment = /* glsl */ `
uniform vec3 uEmber;
uniform float uOpacity;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  if (dot(c, c) > 0.25) discard;
  gl_FragColor = vec4(uEmber, vAlpha * uOpacity);
  #include <colorspace_fragment>
}
`;

function buildParticles(geometry: THREE.BufferGeometry, count: number) {
  const sampler = new MeshSurfaceSampler(new THREE.Mesh(geometry)).build();
  const start = new Float32Array(count * 3);
  const target = new Float32Array(count * 3);
  const rand = new Float32Array(count);
  const v = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    sampler.sample(v);
    target.set([v.x, v.y, v.z], i * 3);
    const r = 3 + Math.random() * 4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    start.set([r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)], i * 3);
    rand[i] = Math.random();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(start, 3));
  g.setAttribute("aTarget", new THREE.BufferAttribute(target, 3));
  g.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uMorph: { value: 0 },
      uTime: { value: 0 },
      uSize: { value: 6 }, // calibration knob: particle size
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uEmber: { value: new THREE.Color("#d0643b") },
      uOpacity: { value: 1 },
    },
    vertexShader: particleVertex,
    fragmentShader: particleFragment,
    transparent: true,
    depthWrite: false,
  });
  const points = new THREE.Points(g, material);
  points.frustumCulled = false;
  return { points, material };
}

function buildRays(count = 260) {
  const pos = new Float32Array(count * 6);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.02;
    const r0 = 1.05 + Math.random() * 0.1;
    const r1 = r0 + 0.6 + Math.random() * 2.6;
    pos.set([Math.cos(a) * r0, Math.sin(a) * r0, 0, Math.cos(a) * r1, Math.sin(a) * r1, 0], i * 6);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const material = new THREE.LineBasicMaterial({ color: "#efe6d4", transparent: true, opacity: 0, depthWrite: false });
  return new THREE.LineSegments(g, material);
}

export function BustOnboarding() {
  return <OnboardingScene geometry={useModelGeometry("bust")} />;
}

// Reduced motion is fixed for the page's lifetime (set once by initScene()), so this early
// return before any hooks never toggles mid-session — it can't violate hooks order in practice,
// but we still split it into its own component so the linter doesn't have to take that on faith.
export default function OnboardingScene({ geometry }: { geometry: THREE.BufferGeometry }) {
  if (scene.reducedMotion) return null;
  return <OnboardingSceneActive geometry={geometry} />;
}

function OnboardingSceneActive({ geometry }: { geometry: THREE.BufferGeometry }) {
  const particles = useMemo(() => buildParticles(geometry, scene.tier === "low" ? 12000 : 30000), [geometry]);
  const rays = useMemo(() => buildRays(), []);
  const bust = useMemo(() => createEngravingMaterial({ reveal: -1.2 }), []);
  const columns = useMemo(() => createEngravingMaterial({ spacing: 4, opacity: 0 }), []);
  const root = useRef<THREE.Group>(null);
  const dir = useMemo(() => new THREE.Vector3(), []);

  // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
  useFrame(({ camera, clock }) => {
    const p = scene.progress;
    const c = local(p, "coalesce");
    const r = local(p, "radiance");
    const d = local(p, "descent");
    const fade = 1 - smoothstep(0.55, 1, d); // the DOM field flood takes over at the end
    if (root.current) root.current.visible = fade > 0.001;

    const u = particles.material.uniforms;
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    u.uMorph.value = c;
    u.uTime.value = clock.elapsedTime;
    u.uOpacity.value = (1 - 0.8 * smoothstep(0.7, 1, c)) * fade;

    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    bust.uniforms.uReveal.value = THREE.MathUtils.lerp(-1.2, 1.2, smoothstep(0.5, 1, c));
    bust.uniforms.uOpacity.value = fade;
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    columns.uniforms.uOpacity.value = smoothstep(0, 0.3, d) * fade;

    const grow = easeOutCubic(r);
    rays.scale.setScalar(Math.max(grow, 0.001));
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    (rays.material as THREE.LineBasicMaterial).opacity = 0.55 * grow * fade;

    const angle = (Math.PI / 2) * easeInOutCubic(r);
    const radius = THREE.MathUtils.lerp(THREE.MathUtils.lerp(6, 4.2, easeInOutCubic(c)), 14, easeInOutCubic(d));
    camera.position.set(Math.sin(angle) * radius, THREE.MathUtils.lerp(0, 2.2, easeInOutCubic(d)), Math.cos(angle) * radius);
    camera.lookAt(0, THREE.MathUtils.lerp(0, 0.6, d), 0);

    camera.getWorldDirection(dir);
    rays.position.copy(dir).multiplyScalar(0.9); // just behind the head, always facing the camera
    rays.quaternion.copy(camera.quaternion);
  });

  return (
    <group ref={root}>
      <primitive object={particles.points} />
      <primitive object={rays} />
      <mesh geometry={geometry} material={bust} />
      {Array.from({ length: 7 }, (_, i) =>
        [-2.4, 2.4].map((z) => (
          <mesh key={`${i}:${z}`} position={[2.6 + i * 2.2, 0, z]} material={columns}>
            <cylinderGeometry args={[0.28, 0.32, 5, 24]} />
          </mesh>
        )),
      )}
    </group>
  );
}
