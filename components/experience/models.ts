"use client";
import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export type ModelId = "bust" | "horse" | "lion" | "vase";

// rotation: per-model calibration knob (radians), applied after node transforms are baked in.
export const MODELS: Record<ModelId, { file: string; rotation: [number, number, number] }> = {
  bust: { file: "/models/marble_bust_01.glb", rotation: [0, 0, 0] },
  horse: { file: "/models/horse_head.glb", rotation: [0, 0, 0] },
  lion: { file: "/models/lion_head.glb", rotation: [0, 0, 0] },
  vase: { file: "/models/antique_ceramic_vase_01.glb", rotation: [0, 0, 0] },
};

// meshopt output is quantized (normalized ints) and may be interleaved; bake to plain Float32
// so node transforms and MeshSurfaceSampler work.
function toFloat(attr: THREE.BufferAttribute | THREE.InterleavedBufferAttribute): THREE.BufferAttribute {
  const out = new Float32Array(attr.count * attr.itemSize);
  for (let i = 0; i < attr.count; i++) {
    out[i * attr.itemSize] = attr.getX(i);
    if (attr.itemSize > 1) out[i * attr.itemSize + 1] = attr.getY(i);
    if (attr.itemSize > 2) out[i * attr.itemSize + 2] = attr.getZ(i);
  }
  return new THREE.BufferAttribute(out, attr.itemSize);
}

export function useModelGeometry(id: ModelId): THREE.BufferGeometry {
  const gltf = useGLTF(MODELS[id].file);
  return useMemo(() => {
    let mesh: THREE.Mesh | undefined;
    gltf.scene.traverse((o) => {
      if (!mesh && (o as THREE.Mesh).isMesh) mesh = o as THREE.Mesh;
    });
    if (!mesh) throw new Error(`model ${id} has no mesh`);
    mesh.updateWorldMatrix(true, false);

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", toFloat(mesh.geometry.getAttribute("position")));
    g.setAttribute("normal", toFloat(mesh.geometry.getAttribute("normal")));
    if (mesh.geometry.index) g.setIndex(mesh.geometry.index.clone());
    g.applyMatrix4(mesh.matrixWorld);

    const [rx, ry, rz] = MODELS[id].rotation;
    g.rotateX(rx).rotateY(ry).rotateZ(rz);
    g.computeBoundingBox();
    const box = g.boundingBox!;
    const centre = box.getCenter(new THREE.Vector3());
    g.translate(-centre.x, -centre.y, -centre.z);
    const s = 2 / (box.max.y - box.min.y);
    g.scale(s, s, s);
    g.computeBoundingSphere();
    return g;
  }, [gltf, id]);
}

if (typeof window !== "undefined") {
  for (const m of Object.values(MODELS)) useGLTF.preload(m.file);
}
