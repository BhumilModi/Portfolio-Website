"use client";
import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { initScene, scene } from "@/lib/scene";

// Runs once, client-only (this module is loaded with ssr:false).
const WEBGL = initScene();

export default function Stage() {
  if (!WEBGL) return null;
  return (
    <Canvas
      flat
      gl={{ alpha: true, antialias: true }}
      dpr={[1, scene.tier === "low" ? 1.5 : 2]}
      style={{ position: "fixed", inset: 0, zIndex: 20, pointerEvents: "none" }}
    >
      <View.Port />
    </Canvas>
  );
}
