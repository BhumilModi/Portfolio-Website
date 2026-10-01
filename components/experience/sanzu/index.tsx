"use client";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera, View } from "@react-three/drei";
import * as THREE from "three";
import { DESCENT_FOV } from "@/lib/descent";
import { ferryPose } from "@/lib/ferry";
import { clamp01, easeInOutCubic } from "@/lib/timeline";
import { BACKDROP_READY_EVENT, scene } from "@/lib/scene";
import Spirit from "../spirit";
import SceneBoundary from "../scene-boundary";
import { buildWisps } from "../wisps";
import { useModelGeometry, type ModelId } from "../models";
import { FOG_DENSITY, INK, SANZU, sanzuClock, sanzuRand } from "./common";
import { buildMist } from "./mist";
import { createPortalMaterial } from "./portal";
import Shadows from "./shadows";
import { MOON_POS, buildMoon, buildSky } from "./sky";
import { BRAZIER, buildTemple } from "./temple";
import { TORII } from "./torii";
import { buildWater } from "./water";
import { buildWraith } from "./wraith";

const one = () => 1;
const LEAN = 0.1; // calibration knob: pointer lean in radians, 0.03–0.15 (spec §3 caps it at ±0.15)
const LEAN_RATE = 3; // calibration knob: how fast the lean eases toward the pointer, 1.5–6 per second
// calibration knob: the boat's path toward the Gate, left of the shadows' formation, and the stretch of the broadcast
// track (scene.ferry) it travels over, so it slides past the camera during the ride.
const BOAT = { from: new THREE.Vector3(-5, 0, -6.5), to: new THREE.Vector3(-1.4, 0, -11.2), start: 0.25, end: 0.85 };
const BRAZIER_LIGHT = 6; // calibration knob: candela for each brazier's light, 3–12

/** Half a cylinder, open side up, stretched along z and pinched to a point at bow and stern: a skiff. */
function buildHull(): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(0.42, 0.42, 3.2, 24, 16, true, -Math.PI / 2, Math.PI);
  g.rotateX(Math.PI / 2); // axis along z, the open half facing up
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const z = p.getZ(i) / 1.6; // -1 … 1 along the hull
    const pinch = 1 - z * z * 0.92;
    p.setX(i, p.getX(i) * pinch);
    p.setY(i, p.getY(i) * (0.55 + 0.45 * pinch) + z * z * 0.25); // shallower and swept up at the ends
  }
  g.computeVertexNormals();
  return g;
}

/** The ferryman's boat: lit wood, a hooded figure with a pole at the stern, a paper lamp at the bow. */
function Boat() {
  const hull = useMemo(() => buildHull(), []);
  const ferryman = useMemo(() => buildWraith({ segments: 32 }), []);
  const wood = useMemo(() => new THREE.MeshStandardMaterial({ color: SANZU.wood, roughness: 0.78, side: THREE.DoubleSide }), []);
  const cloth = useMemo(() => new THREE.MeshStandardMaterial({ color: SANZU.cloth, roughness: 0.95 }), []);
  const lamp = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(SANZU.lantern).multiplyScalar(3) }), []);
  const drift = useRef<THREE.Group>(null);
  const rock = useRef<THREE.Group>(null);
  useEffect(
    () => () => {
      hull.dispose();
      ferryman.dispose();
      wood.dispose();
      cloth.dispose();
      lamp.dispose();
    },
    [hull, ferryman, wood, cloth, lamp],
  );
  const yaw = Math.atan2(-(BOAT.to.x - BOAT.from.x), -(BOAT.to.z - BOAT.from.z)); // bow (-z) along the drift

  useFrame(({ clock }) => {
    const time = sanzuClock(clock.elapsedTime);
    // Rides with the broadcast's scroll; the descent's view (scene.ferry 0) keeps it at the start, so the handoff matches.
    drift.current?.position.lerpVectors(BOAT.from, BOAT.to, easeInOutCubic(clamp01((scene.ferry - BOAT.start) / (BOAT.end - BOAT.start))));
    if (rock.current) {
      rock.current.position.y = Math.sin(time * 0.8) * 0.04;
      rock.current.rotation.z = Math.sin(time * 0.6) * 0.03;
    }
  });

  return (
    <group ref={drift} position={BOAT.from.toArray()} rotation={[0, yaw, 0]}>
      <group ref={rock}>
        <mesh geometry={hull} material={wood} position={[0, 0.28, 0]} />
        {/* The ferryman: the shades' cloak, lit like the boat, facing the bow (-z). */}
        <mesh geometry={ferryman} material={cloth} position={[0, 0.23, 1.05]} rotation={[0, Math.PI, 0]} scale={0.72} />
        <mesh position={[0.3, 1.18, 0.9]} rotation={[0.3, 0, -0.35]} material={wood}>
          <cylinderGeometry args={[0.025, 0.025, 2.8, 8]} />
        </mesh>
        <mesh position={[0, 0.9, -1.45]} material={wood}>
          <cylinderGeometry args={[0.02, 0.02, 0.9, 6]} />
        </mesh>
        <mesh position={[0, 1.4, -1.45]} material={lamp}>
          <boxGeometry args={[0.16, 0.2, 0.16]} />
        </mesh>
      </group>
    </group>
  );
}

// calibration knob: the scanned guardians and relics (spirit spec §3.2, amended 2026-10-02) as [model, position, scale, yaw].
const GUARDIANS: [ModelId, [number, number, number], number, number][] = [
  ["lion", [TORII.x, 4.4, TORII.z - 3.2], 4.2, 0], // the great head behind the Gate, Cerberus's stand-in
  ["lion", [TORII.x - 5.6, 3.1, TORII.z - 4], 2.6, 0.6], // on the plinths either side
  ["lion", [TORII.x + 5.6, 3.1, TORII.z - 4], 2.6, -0.6],
  ["bust", [-3, 1.6, -4], 1.6, 0.5],
  ["horse", [9.5, 1.7, -9], 1.7, -0.7],
  ["vase", [-2.6, 0.9, -11], 0.9, 0],
];

function Guardian({ id, position, scale, yaw, material }: { id: ModelId; position: [number, number, number]; scale: number; yaw: number; material: THREE.Material }) {
  const geometry = useModelGeometry(id);
  return <mesh geometry={geometry} material={material} position={position} scale={scale} rotation={[0, yaw, 0]} />;
}

/** Real scans in grey stone: their carved detail is what the spirit pass draws, under the raking light. */
function Guardians() {
  const stone = useMemo(() => new THREE.MeshStandardMaterial({ color: "#8a8a86", roughness: 0.8 }), []);
  useEffect(() => () => stone.dispose(), [stone]);
  return (
    <Suspense fallback={null}>
      {GUARDIANS.map(([id, position, scale, yaw], i) => (
        <Guardian key={i} id={id} position={position} scale={scale} yaw={yaw} material={stone} />
      ))}
    </Suspense>
  );
}

/** The river of the dead: the Styx temple on black water (spirit spec §3.2). Local origin on the waterline; riverCamera() frames it. fade() === 0 hides it (the descent's cut). */
export function Sanzu({ fade = one }: { fade?: () => number }) {
  const low = scene.tier === "low";
  const sky = useMemo(() => buildSky(), []);
  const moon = useMemo(() => buildMoon(), []);
  const water = useMemo(() => buildWater(low), [low]);
  const temple = useMemo(() => buildTemple(), []);
  const portal = useMemo(() => createPortalMaterial(), []);
  const mist = useMemo(() => buildMist(low ? 2 : 3), [low]);
  const hitodama = useMemo(
    () => buildWisps(low ? 12 : 24, 24, 5, { color: SANZU.hitodama, size: 70, maxSize: 12, speed: 0.25, intensity: 2.2, rand: sanzuRand(3) }),
    [low],
  );
  const moonTarget = useMemo(() => new THREE.Object3D(), []);
  const root = useRef<THREE.Group>(null);
  useEffect(
    () => () => {
      sky.dispose();
      moon.dispose();
      water.dispose();
      temple.dispose();
      portal.dispose();
      mist.dispose();
      hitodama.points.geometry.dispose();
      hitodama.material.dispose();
    },
    [sky, moon, water, temple, portal, mist, hitodama],
  );

  // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
  useFrame(({ clock }) => {
    const shown = fade() > 0;
    if (root.current) root.current.visible = shown;
    if (!shown) return;
    const time = sanzuClock(clock.elapsedTime);
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    sky.material.uniforms.uTime.value = time;
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    water.uniforms.uTime.value = time;
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    portal.uniforms.uTime.value = time;
    temple.flames.forEach((f, i) => f.scale.set(1, 0.85 + 0.15 * Math.sin(time * 9 + i * 2) * Math.sin(time * 3.7 + i), 1));
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    mist.uniforms.uTime.value = time;
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    hitodama.material.uniforms.uTime.value = time;
  });

  return (
    <group ref={root}>
      <primitive object={sky.mesh} />
      <primitive object={moon.mesh} />
      <primitive object={water.mesh} />
      <primitive object={temple.group} />
      {/* A failed scan download drops the guardians, not the whole river (or the whole descent). */}
      <SceneBoundary fallback={null}>
        <Guardians />
      </SceneBoundary>
      <mesh position={[TORII.x, TORII.portalY, TORII.z]} material={portal} renderOrder={2}>
        <planeGeometry args={[TORII.portalW, TORII.portalH]} />
      </mesh>
      <primitive object={mist.group} />
      <group position={[1, 0.4, -12]}>
        <primitive object={hitodama.points} />
      </group>
      <Boat />
      <Shadows />
      {/* The light's target lives in this group, so the moonlight keeps its angle when the descent offsets the Sanzu. */}
      <primitive object={moonTarget} />
      {/* calibration knob: light intensities — moon 0.6–1.2, raking key 0.6–2, fill 0.2–0.6, portal 15–45. */}
      {/* Moonlight from behind the Gate gives a lit rim; the low raking key from the left draws the scans' carving. */}
      <directionalLight position={MOON_POS} target={moonTarget} color={SANZU.moonlight} intensity={0.9} />
      {!low && <hemisphereLight args={[SANZU.skyFill, INK.void, 0.55]} />}
      {/* The portal's violet spill on the pillars: the one light the low tier keeps besides the moon. */}
      <pointLight position={[TORII.x, TORII.portalY, TORII.z + 0.8]} color={INK.spirit} intensity={30} distance={34} decay={2} />
      <directionalLight position={[-14, 5, 12]} target={moonTarget} color="#e8eeff" intensity={1.2} />
      {!low &&
        [-1, 1].map((s) => (
          <pointLight key={s} position={[TORII.x + s * BRAZIER.dx, BRAZIER.y + 1, TORII.z + BRAZIER.dz]} color="#ff6a2a" intensity={BRAZIER_LIGHT} distance={10} decay={2} />
        ))}
    </group>
  );
}

/**
 * The backdrop camera: the broadcast's pose for this scroll position and screen shape (lib/ferry.ts; at the top it is
 * the river pose the descent lands on), leaning
 * toward the pointer within ±LEAN, eased. The lean starts at zero, so the handoff doesn't pop. Reduced motion: no lean.
 */
function Rig() {
  const aim = useRef({ yaw: 0, pitch: 0 });
  const lean = useRef({ yaw: 0, pitch: 0 });
  useEffect(() => {
    if (scene.reducedMotion) return;
    const onMove = (e: PointerEvent) => {
      aim.current.yaw = -((e.clientX / window.innerWidth) * 2 - 1) * LEAN;
      aim.current.pitch = -((e.clientY / window.innerHeight) * 2 - 1) * LEAN;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  useFrame(({ camera }, delta) => {
    const k = 1 - Math.exp(-Math.min(delta, 0.1) * LEAN_RATE); // frame-rate independent
    lean.current.yaw += (aim.current.yaw - lean.current.yaw) * k;
    lean.current.pitch += (aim.current.pitch - lean.current.pitch) * k;
    const pose = ferryPose(scene.ferry, window.innerWidth / window.innerHeight);
    camera.position.set(...pose.position);
    camera.rotation.set(pose.pitch + lean.current.pitch, lean.current.yaw, 0, "YXZ");
  });
  return null;
}

/** While the crossing covers the page, the crossing's own view draws; the backdrop sits out. */
const crossingActive = () => "crossing" in document.documentElement.dataset;

// calibration knob: the spirit target's pixel-ratio cap while the backdrop is up, 1–2. The Sanzu is fill-bound (on an
// M4 at 1440x900, DPR 2: ~23ms a frame uncapped, ~13ms capped at 1.25). Only the spirit target drops: the canvas keeps its ratio, since
// resizing an antialiased canvas costs ~200ms on the main thread. Nothing here is dithered; the paper grain hides the rest.
export const BACKDROP_DPR = 1.25;

const backdropReady = () => window.dispatchEvent(new Event(BACKDROP_READY_EVENT));

/** The /underworld backdrop: the Sanzu from exactly where the descent lands. */
export function SanzuBackdrop() {
  return (
    <div aria-hidden className="fixed inset-0 z-0">
      <View className="size-full" visible={false}>
        <PerspectiveCamera makeDefault fov={DESCENT_FOV} near={0.1} far={400} />
        <Rig />
        <fogExp2 attach="fog" args={[SANZU.fog, FOG_DENSITY]} />
        <Spirit paused={crossingActive} onReady={backdropReady} maxDpr={BACKDROP_DPR} />
        <SceneBoundary fallback={null}>
          <Sanzu />
        </SceneBoundary>
      </View>
    </div>
  );
}
