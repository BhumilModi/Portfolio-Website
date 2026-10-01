"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
import { scene } from "@/lib/scene";
import { createInkMaterial } from "./ink-material";
import { precompile, warm } from "./prepare";

type Props = {
  /** Ink this frame; otherwise draw straight to the canvas (the engraving's flat colours, before the descent's cut). */
  ink?: () => boolean;
  /** Draw nothing this frame, e.g. while the page sits hidden under the crossing. */
  paused?: () => boolean;
  /** Every program this view draws is compiled and its buffers uploaded; it draws from the next frame on. */
  onReady?: () => void;
  /** Cap on the ink target's pixel ratio; the ink pass still fills the canvas at its own ratio. */
  maxDpr?: number;
};
const yes = () => true;
const no = () => false;

type Post = { target: THREE.WebGLRenderTarget; material: THREE.ShaderMaterial; quad: FullScreenQuad };
type Fit = { w: number; h: number; dpr: number };
const canvasSize = new THREE.Vector2();

/** Ink one frame: the scene into the target, then the pass to the canvas. Resizes the target only when the canvas changed. */
function inkFrame(post: Post, fit: Fit, maxDpr: number, gl: THREE.WebGLRenderer, world: THREE.Scene, camera: THREE.Camera) {
  gl.getSize(canvasSize);
  const dpr = Math.min(gl.getPixelRatio(), maxDpr);
  if (fit.w !== canvasSize.x || fit.h !== canvasSize.y || fit.dpr !== dpr) {
    Object.assign(fit, { w: canvasSize.x, h: canvasSize.y, dpr });
    const w = Math.round(canvasSize.x * dpr);
    const h = Math.round(canvasSize.y * dpr);
    post.target.setSize(w, h);
    post.material.uniforms.uResolution.value.set(w, h);
  }
  const cam = camera as THREE.PerspectiveCamera;
  post.material.uniforms.uNear.value = cam.near;
  post.material.uniforms.uFar.value = cam.far;
  const rt = gl.getRenderTarget();
  gl.setRenderTarget(post.target);
  gl.clear();
  gl.render(world, camera);
  gl.setRenderTarget(rt);
  post.quad.render(gl);
}

/**
 * Takes over drawing for the drei <View> it sits in (ink spec §3.1). Mount that View with visible={false} so drei
 * doesn't draw it too. Inking: the scene goes into a HalfFloat target with a depth texture, then one full-screen
 * ink pass draws it to the canvas. No tone mapping: the ink ramp is authored directly.
 * ponytail: draws the whole canvas, not the View's rect — right for the two Sanzu views, which are fixed inset-0.
 * Make it rect-aware if an inked view ever becomes a partial panel.
 */
export default function Ink({ ink = yes, paused = no, onReady, maxDpr = Infinity }: Props) {
  const get = useThree((s) => s.get);
  const ready = useRef(false);
  const readyCallback = useRef(onReady);
  useEffect(() => {
    readyCallback.current = onReady;
  }, [onReady]);
  const post = useMemo(() => {
    const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthTexture: new THREE.DepthTexture(1, 1) });
    const material = createInkMaterial({ low: scene.tier === "low" });
    material.uniforms.tColor.value = target.texture;
    material.uniforms.tDepth.value = target.depthTexture;
    return { target, material, quad: new FullScreenQuad(material) };
  }, []);
  const size = useMemo(() => new THREE.Vector2(), []);
  const fitted = useRef({ w: 0, h: 0, dpr: 0 });
  useEffect(
    () => () => {
      post.quad.dispose();
      post.material.dispose();
      post.target.depthTexture?.dispose();
      post.target.dispose();
    },
    [post],
  );

  // Nothing draws until every program is compiled: a first-use compile stalls the frame it lands in.
  useEffect(() => {
    let live = true;
    const { gl, scene: world, camera } = get();
    precompile(gl, world, camera).then(() => {
      if (!live) return;
      warm(gl, world, () => {
        const rt = gl.getRenderTarget();
        inkFrame(post, fitted.current, maxDpr, gl, world, camera);
        gl.setRenderTarget(rt);
        gl.render(world, camera); // the direct path's programs too
      });
      ready.current = true;
      readyCallback.current?.();
    });
    return () => {
      live = false;
    };
  }, [get, post, maxDpr]);

  useFrame((state) => {
    if (!ready.current || paused()) return;
    const { gl, scene: world, camera } = state;
    gl.getSize(size);
    const cam = camera as THREE.PerspectiveCamera;
    if (cam.aspect !== size.x / size.y) {
      cam.aspect = size.x / size.y; // drei would do this in its scissor setup, which we skip
      cam.updateProjectionMatrix();
    }
    const tone = gl.toneMapping;
    gl.toneMapping = THREE.NoToneMapping;
    gl.setViewport(0, 0, size.x, size.y); // another View may have left its scissored viewport behind
    if (ink()) {
      inkFrame(post, fitted.current, maxDpr, gl, world, camera);
    } else {
      const autoClear = gl.autoClear;
      gl.autoClear = false; // draw over whatever other views drew this frame, as drei does
      gl.clearDepth();
      gl.render(world, camera);
      gl.autoClear = autoClear;
    }
    gl.toneMapping = tone;
  }, 1);
  return null;
}
