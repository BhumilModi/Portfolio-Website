import * as THREE from "three";
import { TORII } from "./torii";

// calibration knob: the colonnade — the two banks' x, the first and last column's z, and the spacing (spirit spec §3.2).
export const COLONNADE = { left: -4.5, right: 12, near: 4, far: -40, step: 4.5 } as const;
// calibration knob: the braziers flanking the Gate, x offset from its centre and z in front of it.
export const BRAZIER = { dx: 4.4, dz: 1.6, y: 2.2 } as const;
const STONE = "#8a8a86"; // mid grey: the spirit pass reads shape from shading, not colour
const FIRE = "#ff3a12"; // saturated red-orange, inside the pass's red band, so the flames burn ember

/** A column on its base with a capital: the unit of the Gate and of both banks. */
function column(height: number, radius: number) {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.88, radius, height, 24));
  shaft.position.y = height / 2 + 0.3;
  const base = new THREE.Mesh(new THREE.BoxGeometry(radius * 3, 0.3, radius * 3));
  base.position.y = 0.15;
  const capital = new THREE.Mesh(new THREE.BoxGeometry(radius * 3.2, 0.32, radius * 3.2));
  capital.position.y = height + 0.46;
  g.add(shaft, base, capital);
  return g;
}

/**
 * The Styx temple (spirit spec §3.2, amended 2026-10-02): a Greek gate of two columns, an architrave and a pediment
 * framing the portal; a colonnade along both banks; plinths for the guardians; two braziers. Grey stone throughout;
 * only the brazier flames are red, so they are the scene's one ember accent. Local origin on the waterline.
 */
export function buildTemple() {
  const stone = new THREE.MeshStandardMaterial({ color: STONE, roughness: 0.85 });
  const fire = new THREE.MeshBasicMaterial({ color: new THREE.Color(FIRE).multiplyScalar(2.2) });
  const group = new THREE.Group();
  const inStone = (o: THREE.Object3D) => {
    o.traverse((m) => {
      if (m instanceof THREE.Mesh) m.material = stone;
    });
    return o;
  };

  // The Gate: the portal plane sits between its columns (TORII layout), under the architrave.
  for (const s of [-1, 1]) {
    const c = inStone(column(7, 0.42));
    c.position.set(TORII.x + s * 2.7, -0.3, TORII.z);
    group.add(c);
  }
  const architrave = inStone(new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.7, 1.1)));
  architrave.position.set(TORII.x, 7.8, TORII.z);
  const pedimentShape = new THREE.Shape([new THREE.Vector2(-3.9, 0), new THREE.Vector2(3.9, 0), new THREE.Vector2(0, 1.7)]);
  const pediment = inStone(new THREE.Mesh(new THREE.ExtrudeGeometry(pedimentShape, { depth: 0.9, bevelEnabled: false })));
  pediment.position.set(TORII.x, 8.15, TORII.z - 0.45);
  group.add(architrave, pediment);

  // The banks: a colonnade each side, with a continuous beam along the tops.
  for (const x of [COLONNADE.left, COLONNADE.right]) {
    for (let z = COLONNADE.near; z >= COLONNADE.far; z -= COLONNADE.step) {
      const c = inStone(column(6.4, 0.34));
      c.position.set(x, -0.3, z);
      group.add(c);
    }
    const beam = inStone(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, COLONNADE.near - COLONNADE.far + 1.2)));
    beam.position.set(x, 6.85, (COLONNADE.near + COLONNADE.far) / 2);
    group.add(beam);
  }

  // Plinths for the two side guardians (components/experience/sanzu/index.tsx places the scans on them).
  for (const s of [-1, 1]) {
    const plinth = inStone(new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 2.4)));
    plinth.position.set(TORII.x + s * 5.6, 0.8, TORII.z - 4);
    group.add(plinth);
  }

  // Braziers: a bowl on a short column, a flame above.
  const flames: THREE.Mesh[] = [];
  for (const s of [-1, 1]) {
    const x = TORII.x + s * BRAZIER.dx;
    const z = TORII.z + BRAZIER.dz;
    const stand = inStone(column(BRAZIER.y - 0.6, 0.18));
    stand.position.set(x, -0.3, z);
    const bowl = inStone(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.25, 0.4, 20, 1, true)));
    bowl.position.set(x, BRAZIER.y, z);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.34, 1.1, 12), fire);
    flame.position.set(x, BRAZIER.y + 0.7, z);
    flames.push(flame);
    group.add(stand, bowl, flame);
  }

  return {
    group,
    flames,
    dispose() {
      group.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
      stone.dispose();
      fire.dispose();
    },
  };
}
