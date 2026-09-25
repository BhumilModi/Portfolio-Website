"use client";
import { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { initScene, scene } from "@/lib/scene";
import SceneBoundary from "./scene-boundary";

// Runs once, client-only (this module is loaded with ssr:false).
const WEBGL = initScene();

// initScene() clears WEBGL up front from a probe context, but the real Canvas can still fail to
// mount (GPU context loss, a blocked driver). SceneBoundary catches that and lands here instead.
function NoWebglFallback() {
  useEffect(() => {
    document.documentElement.classList.add("no-webgl");
  }, []);
  return null;
}

export default function Stage() {
  if (!WEBGL) return null;
  return (
    <SceneBoundary fallback={<NoWebglFallback />}>
      <Canvas
        flat
        gl={{ alpha: true, antialias: true }}
        dpr={[1, scene.tier === "low" ? 1.5 : 2]}
        style={{ position: "fixed", inset: 0, zIndex: 20, pointerEvents: "none" }}
      >
        <View.Port />
      </Canvas>
    </SceneBoundary>
  );
}
