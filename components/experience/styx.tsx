"use client";
import { Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, PerspectiveCamera, View, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { DESCENT_FOV, STYX_CAMERA } from "@/lib/descent";
import { scene } from "@/lib/scene";
import { createEngravingMaterial } from "./engraving-material";
import SceneBoundary from "./scene-boundary";

// Mirror the --color-abyss/styx/asphodel/soulfire tokens in app/globals.css.
export const COLD = { abyss: "#05080a", styx: "#0e2626", asphodel: "#cfd8d3", soulfire: "#5ef2c2" };
const ISLE = "/art/isle.png";
const ISLE_ASPECT = 1.656; // calibration knob: width / height of public/art/isle.png (2000×1208)

const bayer = /* glsl */ `
float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }
`;

const waterVertex = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

// Dark water that melts into the abyss with distance; soulfire glints dithered onto the swell crests.
const waterFragment = /* glsl */ `
uniform vec3 uAbyss;
uniform vec3 uStyx;
uniform vec3 uGlint;
uniform float uTime;
uniform float uOpacity;
uniform float uSpacing;
varying vec3 vWorld;
${bayer}
void main() {
  float d = length(vWorld.xz - cameraPosition.xz);
  float fog = smoothstep(8.0, 70.0, d);
  float swell = sin(vWorld.x * 0.7 + uTime * 0.6) * sin(vWorld.z * 1.3 - uTime * 0.4) + sin(vWorld.z * 0.35 + uTime * 0.25);
  // Near fade keeps the foreground water (where the footer sits) dark and legible.
  float glint = smoothstep(1.2, 1.9, swell) * (1.0 - fog) * smoothstep(8.0, 16.0, d);
  float cell = bayer8(floor(gl_FragCoord.xy / uSpacing));
  vec3 col = mix(mix(uStyx, uAbyss, fog), uGlint, step(cell + 0.02, glint * 0.9));
  gl_FragColor = vec4(col, uOpacity);
  #include <colorspace_fragment>
}
`;

const uvVertex = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

// The dithered Isle mask (public/art/isle.png is alpha-only), inked flat.
const isleFragment = /* glsl */ `
uniform sampler2D uMap;
uniform vec3 uInk;
uniform float uOpacity;
varying vec2 vUv;
void main() {
  if (texture2D(uMap, vUv).a < 0.5) discard;
  gl_FragColor = vec4(uInk, uOpacity);
  #include <colorspace_fragment>
}
`;

const glowFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying vec2 vUv;
void main() {
  float d = length(vUv - 0.5) * 2.0;
  gl_FragColor = vec4(uColor, pow(max(0.0, 1.0 - d), 2.5) * uOpacity);
  #include <colorspace_fragment>
}
`;

const wispVertex = /* glsl */ `
uniform float uTime;
uniform float uHeight;
uniform float uSize;
uniform float uPixelRatio;
attribute float aRand;
varying float vAlpha;
void main() {
  vec3 p = position;
  p.y = mod(p.y + uTime * (0.4 + aRand * 0.6), uHeight);
  p.x += sin(uTime * 0.5 + aRand * 20.0) * 0.3;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  // Cap so wisps drifting past the lens stay motes, not blooms over the footer.
  gl_PointSize = min(uSize * uPixelRatio / -mv.z, 4.0 * uPixelRatio);
  vAlpha = sin(3.14159 * p.y / uHeight);
}
`;

const wispFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  if (dot(c, c) > 0.25) discard;
  gl_FragColor = vec4(uColor, vAlpha * uOpacity * 0.8);
  #include <colorspace_fragment>
}
`;

/** Soul wisps rising through a width×height×width box (x, z centred on 0; y from 0 up). */
export function buildWisps(count: number, width: number, height: number) {
  const pos = new Float32Array(count * 3);
  const rand = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos.set([(Math.random() - 0.5) * width, Math.random() * height, (Math.random() - 0.5) * width], i * 3);
    rand[i] = Math.random();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uHeight: { value: height },
      uSize: { value: 28 }, // calibration knob: wisp size
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uColor: { value: new THREE.Color(COLD.soulfire) },
      uOpacity: { value: 1 },
    },
    vertexShader: wispVertex,
    fragmentShader: wispFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(g, material);
  points.frustumCulled = false;
  return { points, material };
}

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

const one = () => 1;

/** The Styx: water, the Isle of the Dead, Charon's boat, rising wisps. Local origin is the waterline; STYX_CAMERA frames it. */
export function Styx({ fade = one }: { fade?: () => number }) {
  const isleMap = useTexture(ISLE);
  const low = scene.tier === "low";
  const water = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uAbyss: { value: new THREE.Color(COLD.abyss) },
          uStyx: { value: new THREE.Color(COLD.styx) },
          uGlint: { value: new THREE.Color(COLD.soulfire) },
          uTime: { value: 0 },
          uOpacity: { value: 1 },
          uSpacing: { value: 3 },
        },
        vertexShader: waterVertex,
        fragmentShader: waterFragment,
        transparent: true,
      }),
    [],
  );
  const isle = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uMap: { value: isleMap },
          uInk: { value: new THREE.Color(COLD.asphodel).lerp(new THREE.Color(COLD.abyss), 0.55) },
          uOpacity: { value: 1 },
        },
        vertexShader: uvVertex,
        fragmentShader: isleFragment,
        transparent: true,
        depthWrite: false,
      }),
    [isleMap],
  );
  const hull = useMemo(() => buildHull(), []);
  const wood = useMemo(() => {
    const m = createEngravingMaterial({ ink: COLD.asphodel, ground: COLD.abyss });
    m.side = THREE.DoubleSide;
    return m;
  }, []);
  const glow = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color(COLD.soulfire) }, uOpacity: { value: 1 } },
        vertexShader: uvVertex,
        fragmentShader: glowFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  const wisps = useMemo(() => buildWisps(low ? 250 : 600, 30, 12), [low]);
  const boat = useRef<THREE.Group>(null);

  // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
  useFrame(({ clock }) => {
    const f = fade();
    const time = scene.reducedMotion ? 0 : clock.elapsedTime;
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    water.uniforms.uTime.value = time;
    water.uniforms.uOpacity.value = f;
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    isle.uniforms.uOpacity.value = f;
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    wood.uniforms.uOpacity.value = f;
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    glow.uniforms.uOpacity.value = f * (0.8 + 0.2 * Math.sin(time * 2.3));
    // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
    wisps.material.uniforms.uTime.value = time;
    wisps.material.uniforms.uOpacity.value = f;
    if (boat.current) {
      boat.current.position.y = Math.sin(time * 0.8) * 0.04;
      boat.current.rotation.z = Math.sin(time * 0.6) * 0.03;
    }
  });

  const isleW = 42; // calibration knob: how much of the horizon the Isle fills
  const isleH = isleW / ISLE_ASPECT;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={water} renderOrder={-1}>
        <planeGeometry args={[240, 240]} />
      </mesh>
      {/* 0.35: lifts the painting so its own waterline (~15% from the bottom) sits on ours. */}
      <mesh position={[0, isleH * 0.35, -60]} material={isle}>
        <planeGeometry args={[isleW, isleH]} />
      </mesh>
      {/* Charon's boat — position is a calibration knob; it must stay in frame on a portrait phone. */}
      <group position={[0.35, 0.28, 0.5]} rotation={[0, 0.5, 0]}>
        <group ref={boat}>
          <mesh geometry={hull} material={wood} />
          <mesh position={[0, 0.55, 1.05]} material={wood}>
            <coneGeometry args={[0.28, 1.15, 24]} />
          </mesh>
          <mesh position={[0, 1.2, 1.05]} material={wood}>
            <sphereGeometry args={[0.16, 24, 16]} />
          </mesh>
          <mesh position={[0.3, 0.9, 0.9]} rotation={[0.3, 0, -0.35]} material={wood}>
            <cylinderGeometry args={[0.025, 0.025, 2.8, 8]} />
          </mesh>
          <Billboard position={[0, 0.35, -1.55]}>
            <mesh material={glow}>
              <planeGeometry args={[0.7, 0.7]} />
            </mesh>
          </Billboard>
        </group>
      </group>
      <group position={[0, 0, -10]}>
        <primitive object={wisps.points} />
      </group>
    </group>
  );
}

/** The Underworld page's live backdrop: the Styx seen from exactly where the descent lands. */
export function StyxBackdrop() {
  return (
    <div aria-hidden className="fixed inset-0 z-0">
      <View className="size-full">
        <PerspectiveCamera makeDefault position={STYX_CAMERA.position} rotation={[STYX_CAMERA.pitch, 0, 0]} fov={DESCENT_FOV} near={0.1} far={200} />
        <SceneBoundary fallback={null}>
          <Suspense fallback={null}>
            <Styx />
          </Suspense>
        </SceneBoundary>
      </View>
    </div>
  );
}

if (typeof window !== "undefined") useTexture.preload(ISLE);
