"use client";
import { Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera, View } from "@react-three/drei";
import type * as THREE from "three";
import type { ArtId } from "@/lib/content";
import { scene } from "@/lib/scene";
import { createEngravingMaterial } from "./engraving-material";
import { useModelGeometry, type ModelId } from "./models";
import SceneBoundary from "./scene-boundary";

const MODEL_FOR: Partial<Record<ArtId, ModelId>> = { bust: "bust", horse: "horse", lion: "lion", vase: "vase" };

function Motion({
  children,
  sway = false,
  speed = 0.18,
  slotRef,
}: {
  children: React.ReactNode;
  sway?: boolean;
  speed?: number;
  slotRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }, dt) => {
    if (!ref.current || scene.reducedMotion) return;
    // Low tier (phones, few cores) holds the pose to save GPU; spec §8's "one frame then stop" can't work on a fixed canvas.
    if (scene.tier === "high") {
      if (sway) ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.5) * 0.4;
      else ref.current.rotation.y += dt * speed;
    }
    // Hero bust parallax: drift vertically as the slot scrolls through the viewport.
    if (slotRef?.current) {
      const rect = slotRef.current.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const t = Math.min(1, Math.max(-1, centerY / window.innerHeight - 0.5));
      ref.current.position.y = t * 0.25;
    }
  });
  return <group ref={ref}>{children}</group>;
}

function ModelArt({ id }: { id: ModelId }) {
  const geometry = useModelGeometry(id);
  const material = useMemo(() => createEngravingMaterial(), []);
  return <mesh geometry={geometry} material={material} />;
}

function Orb() {
  const material = useMemo(() => createEngravingMaterial(), []);
  return (
    <group>
      <mesh material={material}>
        <sphereGeometry args={[0.75, 64, 64]} />
      </mesh>
      <mesh material={material} rotation={[1.2, 0, 0.3]}>
        <torusGeometry args={[1.1, 0.02, 12, 128]} />
      </mesh>
      <mesh material={material} rotation={[0.4, 0.9, 0]}>
        <torusGeometry args={[1.25, 0.015, 12, 128]} />
      </mesh>
    </group>
  );
}

function Eye() {
  const material = useMemo(() => createEngravingMaterial({ spacing: 4 }), []);
  return (
    <group>
      <mesh material={material}>
        <sphereGeometry args={[0.9, 64, 64]} />
      </mesh>
      <mesh material={material} position={[0, 0, 0.86]}>
        <torusGeometry args={[0.32, 0.05, 16, 64]} />
      </mesh>
      <mesh position={[0, 0, 0.88]}>
        <circleGeometry args={[0.2, 48]} />
        <meshBasicMaterial color="#0b0907" />
      </mesh>
    </group>
  );
}

function Art({ art, slotRef }: { art: ArtId; slotRef?: React.RefObject<HTMLDivElement | null> }) {
  const model = MODEL_FOR[art];
  if (model) return <Motion slotRef={slotRef}><ModelArt id={model} /></Motion>;
  if (art === "orb") return <Motion speed={0.3}><Orb /></Motion>;
  return <Motion sway><Eye /></Motion>;
}

export default function CardArt({ art, className, parallax }: { art: ArtId; className?: string; parallax?: boolean }) {
  const slotRef = useRef<HTMLDivElement>(null);
  return (
    <div aria-hidden ref={slotRef} className={className}>
      <View className="size-full">
        <PerspectiveCamera makeDefault position={[0, 0, 4.4]} fov={32} />
        <SceneBoundary fallback={null}>
          <Suspense fallback={null}>
            <Art art={art} slotRef={parallax ? slotRef : undefined} />
          </Suspense>
        </SceneBoundary>
      </View>
    </div>
  );
}
