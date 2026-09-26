"use client";
import { useCallback, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RIVER_Y, cameraAt, cloudOpacity, coldness, obolPose, olympusOpacity, shaftOpacity, streak, sanzuOpacity } from "@/lib/descent";
import { scene } from "@/lib/scene";
import { createEngravingMaterial } from "./engraving-material";
import { COLD, Styx, buildWisps } from "./styx";

const WARM = { ember: "#d0643b", bone: "#efe6d4" };

// Each cloud particle is a two-vertex segment: at rest a speck, during the fall a streak trailing upward.
const cloudVertex = /* glsl */ `
uniform float uStretch;
uniform float uTime;
attribute float aEnd;
attribute float aRand;
varying float vHead;
void main() {
  vec3 p = position;
  p.x += sin(uTime * 0.2 + aRand * 30.0) * 0.3 * (1.0 - uStretch);
  p.y += aEnd * (0.04 + uStretch * 3.0);
  vHead = 1.0 - aEnd;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;
const cloudFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying float vHead;
void main() {
  gl_FragColor = vec4(uColor, uOpacity * (0.25 + 0.75 * vHead));
  #include <colorspace_fragment>
}
`;

function buildClouds(count: number) {
  const pos = new Float32Array(count * 6);
  const end = new Float32Array(count * 2);
  const rand = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 1.5 + Math.random() * 10; // keep a clear column around the fall axis
    const [x, y, z] = [Math.cos(a) * r, -30 + Math.random() * 36, Math.sin(a) * r];
    pos.set([x, y, z, x, y, z], i * 6);
    end.set([0, 1], i * 2);
    const q = Math.random();
    rand.set([q, q], i * 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aEnd", new THREE.BufferAttribute(end, 1));
  g.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { uStretch: { value: 0 }, uTime: { value: 0 }, uColor: { value: new THREE.Color(WARM.ember) }, uOpacity: { value: 1 } },
    vertexShader: cloudVertex,
    fragmentShader: cloudFragment,
    transparent: true,
    depthWrite: false,
  });
  const lines = new THREE.LineSegments(g, material);
  lines.frustumCulled = false;
  return { lines, material };
}

/** God-rays falling from above onto the Olympus floor. */
function buildRays(count = 120) {
  const pos = new Float32Array(count * 6);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r0 = Math.random() * 1.5;
    const r1 = 2 + Math.random() * 6;
    pos.set([Math.cos(a) * r0, 18, Math.sin(a) * r0, Math.cos(a) * r1, -2.5, Math.sin(a) * r1], i * 6);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const material = new THREE.LineBasicMaterial({ color: WARM.bone, transparent: true, opacity: 0, depthWrite: false });
  return { lines: new THREE.LineSegments(g, material), material };
}

/** A descending shaft of columns and arches, each level turned a little: a Carceri spiral. */
function buildShaft(levels: number, material: THREE.Material) {
  const perLevel = 8;
  const radius = 3.2;
  const half = Math.PI / perLevel;
  const cols = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.24, 3.6, 16), material, levels * perLevel);
  const arches = new THREE.InstancedMesh(new THREE.TorusGeometry(radius * Math.sin(half), 0.1, 8, 24, Math.PI), material, levels * perLevel);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const v = new THREE.Vector3();
  const s = new THREE.Vector3(1, 1, 1);
  for (let l = 0; l < levels; l++) {
    const y = -8 - l * 4;
    for (let i = 0; i < perLevel; i++) {
      const k = l * perLevel + i;
      const a = (i / perLevel) * Math.PI * 2 + l * 0.35;
      cols.setMatrixAt(k, m.compose(v.set(Math.cos(a) * radius, y, Math.sin(a) * radius), q.identity(), s));
      // The arch spans to the next column: centred on the chord at capital height, its plane facing the axis.
      const mid = a + half;
      const chord = radius * Math.cos(half);
      q.setFromEuler(e.set(0, Math.PI / 2 - mid, 0));
      arches.setMatrixAt(k, m.compose(v.set(Math.cos(mid) * chord, y + 1.8, Math.sin(mid) * chord), q, s));
    }
  }
  cols.frustumCulled = false;
  arches.frustumCulled = false;
  return { cols, arches };
}

// Olympus colonnade: a ring of columns, open toward the camera.
const COLONNADE = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2)
  .map((a) => [Math.sin(a) * 5, Math.cos(a) * 5] as const)
  .filter(([, z]) => z < 3);

/** The fall from Olympus to the Styx (spec §3). Reads scene.crossingT; owns the view's camera. */
export default function DescentScene() {
  const low = scene.tier === "low";
  const clouds = useMemo(() => buildClouds(low ? 4000 : 9000), [low]);
  const rays = useMemo(() => buildRays(), []);
  const marble = useMemo(() => createEngravingMaterial({ spacing: 4 }), []);
  const coin = useMemo(() => createEngravingMaterial({ ink: WARM.ember }), []);
  const stone = useMemo(() => createEngravingMaterial({ ink: COLD.asphodel, ground: COLD.abyss }), []);
  // Every tier gets the full shaft: it is two instanced draw calls, and five levels end above the camera's abyss beat.
  const shaft = useMemo(() => buildShaft(9, stone), [stone]);
  const wisps = useMemo(() => buildWisps(low ? 250 : 600, 6, 36), [low]);
  const warm = useMemo(() => new THREE.Color(WARM.ember), []);
  const cold = useMemo(() => new THREE.Color(COLD.soulfire), []);
  const obol = useRef<THREE.Mesh>(null);
  const styxFade = useCallback(() => sanzuOpacity(scene.crossingT), []);

  // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
  useFrame(({ camera, clock }) => {
    const t = scene.crossingT;
    const { pos, pitch } = cameraAt(t);
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.rotation.set(pitch, 0, 0);

    const o = olympusOpacity(t);
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    marble.uniforms.uOpacity.value = o;
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    rays.material.opacity = 0.35 * o;

    const cu = clouds.material.uniforms;
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    cu.uStretch.value = streak(t);
    cu.uTime.value = clock.elapsedTime;
    cu.uOpacity.value = cloudOpacity(t);
    cu.uColor.value.copy(warm).lerp(cold, coldness(t));

    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    stone.uniforms.uOpacity.value = shaftOpacity(t);
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    wisps.material.uniforms.uOpacity.value = shaftOpacity(t);
    wisps.material.uniforms.uTime.value = clock.elapsedTime;

    const p = obolPose(t);
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    coin.uniforms.uOpacity.value = p.opacity;
    if (obol.current) {
      obol.current.visible = p.opacity > 0.001;
      obol.current.rotation.set(Math.PI / 2 + p.flip, 0, 0);
      obol.current.position.y = 1.5 + p.drop;
    }
  });

  return (
    <>
      <mesh ref={obol} position={[0, 1.5, 5]} material={coin}>
        <cylinderGeometry args={[0.35, 0.35, 0.06, 64]} />
      </mesh>
      {COLONNADE.map(([x, z]) => (
        <mesh key={`${x}:${z}`} position={[x, 0, z]} material={marble}>
          <cylinderGeometry args={[0.28, 0.32, 5, 24]} />
        </mesh>
      ))}
      {/* The floor of Olympus, with an oculus the camera falls through. */}
      <mesh position={[0, -2.5, 0]} rotation={[-Math.PI / 2, 0, 0]} material={marble}>
        <ringGeometry args={[1.8, 6.5, 64]} />
      </mesh>
      <primitive object={rays.lines} />
      <primitive object={clouds.lines} />
      <primitive object={shaft.cols} />
      <primitive object={shaft.arches} />
      <group position={[0, -40, 0]}>
        <primitive object={wisps.points} />
      </group>
      <group position={[0, RIVER_Y, 0]}>
        <Styx fade={styxFade} />
      </group>
    </>
  );
}
