import * as THREE from "three";
import { INK } from "./common";

// calibration knob: x/z place the Gate right of centre from RIVER_CAMERA (x 3–6, z -13 to -20). The portal fills
// the opening under the nuki: its size follows the pillar spacing below, so change them together.
export const TORII = { x: 4, z: -16, portalY: 2.76, portalW: 4.5, portalH: 5.3 } as const;

/** A beam whose ends sweep upward, the torii's signature curve: y += lift · (x / half)^4. */
function sweptBeam(length: number, height: number, depth: number, lift: number) {
  const g = new THREE.BoxGeometry(length, height, depth, 32, 1, 1);
  const p = g.attributes.position as THREE.BufferAttribute;
  const half = length / 2;
  for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + lift * (p.getX(i) / half) ** 4);
  g.computeVertexNormals();
  return g;
}

/** A vermilion lacquered torii standing a metre deep in the river. Few pieces, strong silhouette. */
export function buildTorii() {
  const lacquer = new THREE.MeshPhysicalMaterial({ color: INK.lily, roughness: 0.42, clearcoat: 1, clearcoatRoughness: 0.18 });
  const black = new THREE.MeshStandardMaterial({ color: "#0c0d10", roughness: 0.55 });
  const group = new THREE.Group();
  group.position.set(TORII.x, 0, TORII.z);
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number) => {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(x, y, 0);
    group.add(m);
  };
  const pillar = new THREE.CylinderGeometry(0.3, 0.36, 8.2, 32); // hashira: a touch thicker at the foot
  const collar = new THREE.CylinderGeometry(0.44, 0.44, 0.7, 32); // nemaki: the black sleeve at the waterline
  for (const s of [-1, 1]) {
    add(pillar, lacquer, s * 2.6, 3.1); // y -1.0 … 7.2
    add(collar, black, s * 2.6, -0.05);
  }
  add(new THREE.BoxGeometry(6.6, 0.34, 0.36), lacquer, 0, 5.6); // nuki: the tie beam through both pillars
  add(new THREE.BoxGeometry(0.4, 1.0, 0.3), lacquer, 0, 6.3); // gakuzuka: the strut to the lintel
  add(sweptBeam(7.6, 0.34, 0.5, 0.2), lacquer, 0, 6.95); // shimaki
  add(sweptBeam(8.8, 0.3, 0.62, 0.45), black, 0, 7.35); // kasagi, capped black
  return {
    group,
    dispose() {
      group.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
      lacquer.dispose();
      black.dispose();
    },
  };
}
