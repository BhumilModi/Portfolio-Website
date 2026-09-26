"use client";
import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { scene } from "@/lib/scene";

// Task 4 spike (2026-09-26): composer passed, 1440x900 mean frame 16.67 ms vs 16.67 ms without (both vsync-capped, no drops).
const COMPOSER_OK = true;
// calibration knob: strength 0.5–1.4, radius 0.3–0.8, threshold 0.7–1.0 (linear HDR luminance, before tone mapping).
// The threshold must sit above every lit surface (torii, boat, lilies) so only emissives bloom.
const BLOOM = { strength: 0.85, radius: 0.55, threshold: 0.82 };
const EXPOSURE = 1.1; // calibration knob: ACES exposure for the Sanzu, 0.8–1.4

/** Real bloom this session? Normal tier only, and only if the composer passed Task 4's check. Call inside the canvas. */
export const bloomOn = () => COMPOSER_OK && scene.tier === "high";

type Props = {
  /** Run the bloom pass this frame (it also needs bloomOn()); otherwise draw straight to the canvas. */
  bloom?: () => boolean;
  /** ACES tone mapping this frame. False keeps the engraving's flat colours exact (Olympus, the shaft). */
  aces?: () => boolean;
  /** Draw nothing this frame, e.g. while the page sits hidden under the crossing. */
  paused?: () => boolean;
};
const yes = () => true;
const no = () => false;

/**
 * Takes over drawing for the drei <View> it sits in. Mount that View with visible={false} so drei doesn't draw it too.
 * ponytail: draws the whole canvas, not the View's rect — right for the two Sanzu views, which are fixed inset-0.
 * Make it rect-aware if a Sanzu view ever becomes a partial panel.
 */
export default function Bloom({ bloom = yes, aces = yes, paused = no }: Props) {
  const renderer = useThree((s) => s.gl);
  const post = useMemo(() => {
    if (!bloomOn()) return null;
    const composer = new EffectComposer(renderer); // HalfFloat targets keep emissives above 1.0 for the threshold
    const render = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
    const pass = new UnrealBloomPass(new THREE.Vector2(256, 256), BLOOM.strength, BLOOM.radius, BLOOM.threshold);
    composer.addPass(render);
    composer.addPass(pass);
    composer.addPass(new OutputPass()); // tone mapping + sRGB, read from the renderer on every render
    return { composer, render, pass, size: new THREE.Vector2(), dpr: 0 };
  }, [renderer]);
  const size = useMemo(() => new THREE.Vector2(), []);
  useEffect(
    () => () => {
      post?.pass.dispose();
      post?.composer.dispose();
    },
    [post],
  );

  useFrame((state, delta) => {
    if (paused()) return;
    const { gl, scene: world, camera } = state;
    gl.getSize(size);
    const cam = camera as THREE.PerspectiveCamera;
    if (cam.aspect !== size.x / size.y) {
      cam.aspect = size.x / size.y; // drei would do this in its scissor setup, which we skip
      cam.updateProjectionMatrix();
    }
    const tone = gl.toneMapping;
    const exposure = gl.toneMappingExposure;
    gl.toneMapping = aces() ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
    gl.toneMappingExposure = EXPOSURE;
    gl.setViewport(0, 0, size.x, size.y); // another View may have left its scissored viewport behind
    if (post && bloom()) {
      const dpr = gl.getPixelRatio(); // the full ratio: the engraved shaft's dither must stay pixel-exact
      if (!post.size.equals(size) || post.dpr !== dpr) {
        post.size.copy(size);
        // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
        post.dpr = dpr;
        post.composer.setPixelRatio(dpr);
        post.composer.setSize(size.x, size.y);
      }
      // eslint-disable-next-line react-hooks/immutability -- per-frame three.js mutation, not React state
      post.render.scene = world;
      post.render.camera = camera;
      post.composer.render(delta);
    } else {
      const autoClear = gl.autoClear;
      gl.autoClear = false; // draw over whatever other views drew this frame, as drei does
      gl.clearDepth();
      gl.render(world, camera);
      gl.autoClear = autoClear;
    }
    gl.toneMapping = tone;
    gl.toneMappingExposure = exposure;
  }, 1);
  return null;
}

const glowVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const glowFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
uniform float uOpacity;
varying vec2 vUv;
void main() {
  float d = length(vUv - 0.5) * 2.0;
  gl_FragColor = vec4(uColor * uIntensity, pow(max(0.0, 1.0 - d), 2.2) * uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/** An additive radial halo: the glow the bloom pass would have added, painted on. */
export function createGlowMaterial(color: THREE.ColorRepresentation, intensity: number) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uIntensity: { value: intensity }, uOpacity: { value: 1 } },
    vertexShader: glowVertex,
    fragmentShader: glowFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/** The bloom fallback (low tier, or COMPOSER_OK = false): a camera-facing halo. Renders nothing when real bloom is on. */
export function GlowSprite({ position, size, color, intensity = 1 }: { position: [number, number, number]; size: number; color: string; intensity?: number }) {
  const material = useMemo(() => createGlowMaterial(color, intensity), [color, intensity]);
  useEffect(() => () => material.dispose(), [material]);
  if (bloomOn()) return null;
  return (
    <Billboard position={position}>
      <mesh material={material} renderOrder={3}>
        <planeGeometry args={[size, size]} />
      </mesh>
    </Billboard>
  );
}
