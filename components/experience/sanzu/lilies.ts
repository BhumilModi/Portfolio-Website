import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { INK, SANZU } from "./common";
import { MOON_POS } from "./sky";

// calibration knob: the bank's footprint in the lower-left foreground. Keep lilies out of the bottom ~15% of the
// frame at 1440×900, where the footer sits (maxZ ≤ 3.5 from RIVER_CAMERA).
export const BANK = { minX: -9, maxX: -1.2, minZ: -5, maxZ: 3 } as const;

/** The bank's height above the water at (x, z): it rises gently to the left and slips under at its edge. */
export function bankHeight(x: number, z: number): number {
  return Math.min(0.55, Math.max(-0.3, (-x - 1.0) * 0.14)) + Math.sin(x * 1.7) * Math.cos(z * 1.3) * 0.05;
}

/** One higanbana: a bare stem, six thin petals that arc out and curl back, and six long stamens. About 0.6 tall. */
function lilyGeometry() {
  const parts: THREE.BufferGeometry[] = [new THREE.CylinderGeometry(0.008, 0.012, 0.5, 5, 1, true).translate(0, 0.25, 0)];
  for (let i = 0; i < 6; i++) {
    const petal = new THREE.PlaneGeometry(0.03, 0.17, 1, 5).translate(0, 0.085, 0);
    const p = petal.attributes.position as THREE.BufferAttribute;
    for (let k = 0; k < p.count; k++) {
      const t = p.getY(k) / 0.17;
      p.setZ(k, t * t * 0.07); // the curl back at the tip
    }
    petal.computeVertexNormals();
    parts.push(petal.rotateX(-1.05).rotateY((i / 6) * Math.PI * 2).translate(0, 0.5, 0));
    parts.push(
      new THREE.CylinderGeometry(0.0025, 0.0025, 0.22, 3, 1, true)
        .translate(0, 0.11, 0)
        .rotateX(-0.55)
        .rotateY(((i + 0.5) / 6) * Math.PI * 2)
        .translate(0, 0.5, 0),
    );
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((g) => g.dispose());
  return merged;
}

const vertex = /* glsl */ `
uniform float uTime;
attribute vec3 aOffset;
attribute float aSeed;
attribute float aScale;
varying vec3 vNormalW;
varying vec3 vWorld;
varying float vHeight;
#include <common>
#include <fog_pars_vertex>
void main() {
  float yaw = aSeed * 6.2831;
  mat2 r = mat2(cos(yaw), sin(yaw), -sin(yaw), cos(yaw));
  vec3 p = position * aScale;
  p.xz = r * p.xz;
  vec3 n = normal;
  n.xz = r * n.xz;
  // Sway grows with the square of height: the root stays planted and the flower head moves.
  float h = position.y / 0.55;
  float sway = sin(uTime * 1.1 + aSeed * 30.0 + aOffset.x * 0.8) * 0.06 + sin(uTime * 2.3 + aSeed * 11.0) * 0.02;
  p.x += sway * h * h;
  p.z += sway * 0.5 * h * h;
  vec4 w = modelMatrix * vec4(p + aOffset, 1.0);
  vWorld = w.xyz;
  vNormalW = normalize(mat3(modelMatrix) * n);
  vHeight = position.y;
  vec4 mvPosition = viewMatrix * w;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

const fragment = /* glsl */ `
uniform vec3 uPetal;
uniform vec3 uStem;
uniform vec3 uMoonDir;
uniform vec3 uMoonColor;
varying vec3 vNormalW;
varying vec3 vWorld;
varying float vHeight;
#include <common>
#include <fog_pars_fragment>
void main() {
  vec3 n = normalize(vNormalW);
  if (!gl_FrontFacing) n = -n;
  bool flower = vHeight > 0.46;
  vec3 base = flower ? uPetal : uStem;
  float diff = max(dot(n, uMoonDir), 0.0);
  float rim = pow(1.0 - max(dot(n, normalize(cameraPosition - vWorld)), 0.0), 3.0);
  // A little self-light so the red reads at night; the moon behind the bank gives each flower a cold rim.
  vec3 col = base * (0.22 + diff * uMoonColor * 0.9) + uMoonColor * rim * (flower ? 0.35 : 0.1);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`;

/** A bank of red spider lilies on dark wet stone, lower-left foreground. One instanced draw; sway in the vertex shader. */
export function buildLilies(count: number, rand: () => number = Math.random) {
  const offsets = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const scales = new Float32Array(count);
  // Clumps, not a carpet: each lily picks one of 28 clump centres and scatters round it.
  const clumps = Array.from({ length: 28 }, () => [BANK.minX + rand() * (BANK.maxX - BANK.minX), BANK.minZ + rand() * (BANK.maxZ - BANK.minZ)]);
  for (let i = 0; i < count; i++) {
    let x = 0;
    let z = 0;
    for (let k = 0; k < 8; k++) {
      const [cx, cz] = clumps[Math.floor(rand() * clumps.length)];
      x = Math.min(BANK.maxX, Math.max(BANK.minX, cx + (rand() - 0.5) * 1.2));
      z = Math.min(BANK.maxZ, Math.max(BANK.minZ, cz + (rand() - 0.5) * 1.2));
      if (bankHeight(x, z) > 0.03) break; // retry until it lands on dry bank
    }
    offsets.set([x, Math.max(0, bankHeight(x, z)), z], i * 3);
    seeds[i] = rand();
    scales[i] = 0.8 + rand() * 0.45;
  }

  const lily = lilyGeometry();
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setIndex(lily.index);
  for (const [name, attr] of Object.entries(lily.attributes)) geometry.setAttribute(name, attr);
  geometry.setAttribute("aOffset", new THREE.InstancedBufferAttribute(offsets, 3));
  geometry.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 1));
  geometry.setAttribute("aScale", new THREE.InstancedBufferAttribute(scales, 1));
  geometry.instanceCount = count;
  const material = new THREE.ShaderMaterial({
    uniforms: {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      uTime: { value: 0 },
      uPetal: { value: new THREE.Color(INK.lily) },
      uStem: { value: new THREE.Color(SANZU.stem) },
      uMoonDir: { value: new THREE.Vector3(...MOON_POS).normalize() },
      uMoonColor: { value: new THREE.Color(SANZU.moonlight) },
    },
    vertexShader: vertex,
    fragmentShader: fragment,
    side: THREE.DoubleSide,
    fog: true,
  });
  const flowers = new THREE.Mesh(geometry, material);
  flowers.frustumCulled = false;

  // The bank: dark wet stone, glossy enough to catch the moon.
  const ground = new THREE.PlaneGeometry(16, 16, 48, 48).rotateX(-Math.PI / 2).translate(-8.2, 0, -1);
  const gp = ground.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < gp.count; i++) gp.setY(i, bankHeight(gp.getX(i), gp.getZ(i)));
  ground.computeVertexNormals();
  const stone = new THREE.MeshStandardMaterial({ color: SANZU.stone, roughness: 0.32 });
  const bank = new THREE.Mesh(ground, stone);

  const group = new THREE.Group();
  group.add(bank, flowers);
  return {
    group,
    uniforms: material.uniforms,
    dispose() {
      lily.dispose();
      geometry.dispose();
      material.dispose();
      ground.dispose();
      stone.dispose();
    },
  };
}
