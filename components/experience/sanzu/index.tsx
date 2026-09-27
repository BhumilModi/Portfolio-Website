"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera, View } from "@react-three/drei";
import * as THREE from "three";
import { DESCENT_FOV, riverCamera } from "@/lib/descent";
import { BACKDROP_READY_EVENT, scene } from "@/lib/scene";
import Bloom, { GlowSprite, bloomOn } from "../bloom";
import SceneBoundary from "../scene-boundary";
import { buildWisps } from "../wisps";
import { FOG_DENSITY, INK, SANZU, sanzuClock, sanzuRand } from "./common";
import { buildLanterns, lanternCenter, type Lanterns } from "./lanterns";
import { buildLilies } from "./lilies";
import { buildMist } from "./mist";
import { createPortalMaterial } from "./portal";
import Shadows from "./shadows";
import { MOON_POS, buildMoon, buildSky } from "./sky";
import { TORII, buildTorii } from "./torii";
import { buildWater } from "./water";
import { buildWraith } from "./wraith";

const one = () => 1;
const LEAN = 0.1; // calibration knob: pointer lean in radians, 0.03–0.15 (spec §3 caps it at ±0.15)
const LEAN_RATE = 3; // calibration knob: how fast the lean eases toward the pointer, 1.5–6 per second
// calibration knob: the boat's drift toward the Gate, left of the shadows' formation; tau is the approach time constant (30–120s).
const BOAT = { from: new THREE.Vector3(-5, 0, -6.5), to: new THREE.Vector3(-1.4, 0, -11.2), tau: 60 };
const LANTERN_LIGHT = 2.2; // calibration knob: candela for each of the two lit lanterns, 1–4

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
    // Eases toward the Gate and comes to rest before it: no loop, so no jump.
    drift.current?.position.lerpVectors(BOAT.from, BOAT.to, 1 - Math.exp(-time / BOAT.tau));
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

/** The two real lantern lights (spec §3: at most two), riding lanterns 0 and 1. Normal tier only. */
function LanternLights({ lanterns }: { lanterns: Lanterns }) {
  const a = useRef<THREE.PointLight>(null);
  const b = useRef<THREE.PointLight>(null);
  const at = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }) => {
    const time = sanzuClock(clock.elapsedTime);
    [a.current, b.current].forEach((light, i) => {
      if (!light) return;
      const scale = lanternCenter(lanterns, i, time, at);
      light.position.set(at.x, at.y + 0.3, at.z);
      light.intensity = LANTERN_LIGHT * scale;
    });
  });
  return (
    <>
      <pointLight ref={a} color={SANZU.lantern} distance={7} decay={2} />
      <pointLight ref={b} color={SANZU.lantern} distance={7} decay={2} />
    </>
  );
}

/** The Sanzu (redesign spec §3). Local origin on the waterline; riverCamera() frames it. fade() === 0 hides it (the descent's cut). */
export function Sanzu({ fade = one }: { fade?: () => number }) {
  const low = scene.tier === "low";
  const sky = useMemo(() => buildSky(), []);
  const moon = useMemo(() => buildMoon(), []);
  const water = useMemo(() => buildWater(low), [low]);
  const torii = useMemo(() => buildTorii(), []);
  const portal = useMemo(() => createPortalMaterial(), []);
  // calibration knob: counts — the low tier halves each (spec §3: ~40 lanterns, ~450 lilies after Task 12's perf pass).
  const lanterns = useMemo(() => buildLanterns(low ? 20 : 40, sanzuRand(1)), [low]);
  const lilies = useMemo(() => buildLilies(low ? 225 : 450, sanzuRand(2)), [low]);
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
      torii.dispose();
      portal.dispose();
      lanterns.dispose();
      lilies.dispose();
      mist.dispose();
      hitodama.points.geometry.dispose();
      hitodama.material.dispose();
    },
    [sky, moon, water, torii, portal, lanterns, lilies, mist, hitodama],
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
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    lanterns.uniforms.uTime.value = time;
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    lilies.uniforms.uTime.value = time;
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
      <primitive object={torii.group} />
      <mesh position={[TORII.x, TORII.portalY, TORII.z]} material={portal} renderOrder={2}>
        <planeGeometry args={[TORII.portalW, TORII.portalH]} />
      </mesh>
      <primitive object={lanterns.mesh} />
      {!bloomOn() && <primitive object={lanterns.halos} />}
      <primitive object={lilies.group} />
      <primitive object={mist.group} />
      <group position={[1, 0.4, -12]}>
        <primitive object={hitodama.points} />
      </group>
      <Boat />
      <Shadows />
      {/* The light's target lives in this group, so the moonlight keeps its angle when the descent offsets the Sanzu. */}
      <primitive object={moonTarget} />
      {/* calibration knob: light intensities — moon 0.6–1.2, fill 0.2–0.6, portal 15–45. */}
      {/* Moonlight from behind the torii: the Gate reads as a silhouette with a lit rim. */}
      <directionalLight position={MOON_POS} target={moonTarget} color={SANZU.moonlight} intensity={0.9} />
      {!low && <hemisphereLight args={[SANZU.skyFill, INK.abyss, 0.55]} />}
      {/* The portal's violet spill on the pillars: the one light the low tier keeps besides the moon. */}
      <pointLight position={[TORII.x, TORII.portalY, TORII.z + 0.8]} color={INK.monarch} intensity={30} distance={34} decay={2} />
      {!low && <LanternLights lanterns={lanterns} />}
      <GlowSprite position={[TORII.x, TORII.portalY, TORII.z + 0.05]} size={11} color={INK.system} intensity={0.55} />
      <GlowSprite position={MOON_POS} size={30} color={SANZU.moon} intensity={0.3} />
    </group>
  );
}

/**
 * The backdrop camera: the river pose for this screen's shape (the descent lands on the same pose), leaning
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
    const pose = riverCamera(window.innerWidth / window.innerHeight);
    camera.position.set(...pose.position);
    camera.rotation.set(pose.pitch + lean.current.pitch, lean.current.yaw, 0, "YXZ");
  });
  return null;
}

/** While the crossing covers the page, the crossing's own view draws; the backdrop sits out. */
const crossingActive = () => "crossing" in document.documentElement.dataset;

// calibration knob: the bloom composer's pixel-ratio cap while the backdrop is up, 1–2. The Sanzu is fill-bound (on an
// M4 at 1440x900, DPR 2: ~23ms a frame uncapped, ~13ms capped at 1.25). Only the composer drops: the canvas keeps its ratio, since
// resizing an antialiased canvas costs ~200ms on the main thread. Nothing here is dithered; the glow hides the rest.
const BACKDROP_DPR = 1.25;

const backdropReady = () => window.dispatchEvent(new Event(BACKDROP_READY_EVENT));

/** The /underworld backdrop: the Sanzu from exactly where the descent lands. */
export function SanzuBackdrop() {
  return (
    <div aria-hidden className="fixed inset-0 z-0">
      <View className="size-full" visible={false}>
        <PerspectiveCamera makeDefault fov={DESCENT_FOV} near={0.1} far={400} />
        <Rig />
        <fogExp2 attach="fog" args={[SANZU.fog, FOG_DENSITY]} />
        <Bloom paused={crossingActive} onReady={backdropReady} maxDpr={BACKDROP_DPR} />
        <SceneBoundary fallback={null}>
          <Sanzu />
        </SceneBoundary>
      </View>
    </div>
  );
}
