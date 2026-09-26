"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera, View } from "@react-three/drei";
import * as THREE from "three";
import { DESCENT_FOV, riverCamera } from "@/lib/descent";
import { scene } from "@/lib/scene";
import Bloom, { GlowSprite } from "../bloom";
import SceneBoundary from "../scene-boundary";
import { FOG_DENSITY, INK, SANZU, sanzuClock } from "./common";
import { createPortalMaterial } from "./portal";
import { MOON_POS, buildMoon, buildSky } from "./sky";
import { TORII, buildTorii } from "./torii";
import { buildWater } from "./water";

const one = () => 1;

/** The Sanzu (redesign spec §3). Local origin on the waterline; riverCamera() frames it. fade() === 0 hides it (the descent's cut). */
export function Sanzu({ fade = one }: { fade?: () => number }) {
  const low = scene.tier === "low";
  const sky = useMemo(() => buildSky(), []);
  const moon = useMemo(() => buildMoon(), []);
  const water = useMemo(() => buildWater(low), [low]);
  const torii = useMemo(() => buildTorii(), []);
  const portal = useMemo(() => createPortalMaterial(), []);
  const moonTarget = useMemo(() => new THREE.Object3D(), []);
  const root = useRef<THREE.Group>(null);
  useEffect(
    () => () => {
      sky.dispose();
      moon.dispose();
      water.dispose();
      torii.dispose();
      portal.dispose();
    },
    [sky, moon, water, torii, portal],
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
      {/* The light's target lives in this group, so the moonlight keeps its angle when the descent offsets the Sanzu. */}
      <primitive object={moonTarget} />
      {/* calibration knob: light intensities — moon 0.6–1.2, fill 0.2–0.6, portal 15–45. */}
      {/* Moonlight from behind the torii: the Gate reads as a silhouette with a lit rim. */}
      <directionalLight position={MOON_POS} target={moonTarget} color={SANZU.moonlight} intensity={0.9} />
      {!low && <hemisphereLight args={[SANZU.skyFill, INK.abyss, 0.55]} />}
      {/* The portal's violet spill on the pillars: the one light the low tier keeps besides the moon. */}
      <pointLight position={[TORII.x, TORII.portalY, TORII.z + 0.8]} color={INK.monarch} intensity={30} distance={34} decay={2} />
      <GlowSprite position={[TORII.x, TORII.portalY, TORII.z + 0.05]} size={11} color={INK.system} intensity={0.55} />
      <GlowSprite position={MOON_POS} size={30} color={SANZU.moon} intensity={0.3} />
    </group>
  );
}

/** Holds the backdrop camera on the river pose for this screen's shape: the descent lands on the same pose. */
function Rig() {
  useFrame(({ camera }) => {
    const pose = riverCamera(window.innerWidth / window.innerHeight);
    camera.position.set(...pose.position);
    camera.rotation.set(pose.pitch, 0, 0, "YXZ");
  });
  return null;
}

/** While the crossing covers the page, the crossing's own view draws; the backdrop sits out. */
const crossingActive = () => "crossing" in document.documentElement.dataset;

/** The /underworld backdrop: the Sanzu from exactly where the descent lands. */
export function SanzuBackdrop() {
  return (
    <div aria-hidden className="fixed inset-0 z-0">
      <View className="size-full" visible={false}>
        <PerspectiveCamera makeDefault fov={DESCENT_FOV} near={0.1} far={400} />
        <Rig />
        <fogExp2 attach="fog" args={[SANZU.fog, FOG_DENSITY]} />
        <Bloom paused={crossingActive} />
        <SceneBoundary fallback={null}>
          <Sanzu />
        </SceneBoundary>
      </View>
    </div>
  );
}
