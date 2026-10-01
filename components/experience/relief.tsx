"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { OrthographicCamera, View } from "@react-three/drei";
import * as THREE from "three";
import { scene } from "@/lib/scene";

// calibration knobs for the carved relief (after immersive-g.com).
const RELIEF = {
  depth: 6, // relief height in texels of slope; higher = deeper carving, 3–12
  rake: 0.38, // light elevation (z of the light direction); lower = longer, more raking shadows, 0.25–0.7
  light: 1.1, // highlight strength on faces turned to the light, 0.4–1.6
  dark: 1.3, // shade strength on faces turned away, 0.4–1.8
  shadow: 0.55, // cast-shadow strength, 0–0.8
  ease: 2.4, // how fast the light follows the pointer, per second
  pool: 0.3, // reveal pool radius as a fraction of the host's shorter side, 0.18–0.4 (px clamp below)
  lead: 4.5, // how fast the leading pool chases the pointer, per second
  trail: 1.3, // how fast the trailing pool follows, per second (lower = a longer trail)
  idleMs: 2500, // after this long without the mouse, the pools wander on their own
} as const;

const vertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

// Light and shade only: flat wall renders fully transparent, so whatever the DOM paints underneath (the footer's red
// relief wash) is the material, and the carving is the light falling on it.
const fragment = /* glsl */ `
uniform sampler2D tHeight;
uniform vec2 uTexel;
uniform vec3 uLight;
uniform vec3 uHigh;
uniform vec3 uShade;
uniform float uDepth, uLightK, uDarkK, uShadowK;
uniform float uClip; // canvas-pixel y (from the bottom) above which something covers the host
uniform vec3 uPoolA; // reveal pools in canvas pixels: x, y (from the bottom), radius
uniform vec3 uPoolB;
varying vec2 vUv;
float h(vec2 uv) { return texture2D(tHeight, uv).r; }
void main() {
  if (gl_FragCoord.y > uClip) discard;
  float c = h(vUv);
  vec2 e = uTexel;
  vec3 n = normalize(vec3((h(vUv - vec2(e.x, 0.0)) - h(vUv + vec2(e.x, 0.0))) * uDepth,
                          (h(vUv - vec2(0.0, e.y)) - h(vUv + vec2(0.0, e.y))) * uDepth, 1.0));
  vec3 l = normalize(uLight);
  float face = dot(n, l) - l.z;
  float shadow = 0.0;
#ifndef LOW
  vec2 dir = normalize(l.xy + 1e-5) * e * 2.0;
  float climb = 0.03 * l.z / max(length(l.xy), 1e-3);
  for (int i = 1; i <= 8; i++) {
    float t = float(i);
    shadow = max(shadow, smoothstep(0.0, 0.12, h(vUv + dir * t) - c - climb * t));
  }
#endif
  float hi = max(face, 0.0) * uLightK;
  float lo = max(-face, 0.0) * uDarkK + shadow * uShadowK;
  // The carving surfaces only inside the soft pools that follow the cursor, as on immersive-g.com.
  float ra = 1.0 - smoothstep(uPoolA.z * 0.35, uPoolA.z, distance(gl_FragCoord.xy, uPoolA.xy));
  float rb = 1.0 - smoothstep(uPoolB.z * 0.35, uPoolB.z, distance(gl_FragCoord.xy, uPoolB.xy));
  float a = clamp(hi + lo, 0.0, 0.85) * max(ra, rb * 0.85);
  vec3 col = (uHigh * hi + uShade * lo) / max(hi + lo, 1e-4);
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}
`;

/** Draws the height field: white is raised, black is the wall. Called on mount and whenever the host resizes. */
export type PaintRelief = (ctx: CanvasRenderingContext2D, w: number, h: number, scale: number) => void;

/** Ease the light toward the side the lead pool is on, so the carving rakes from where the cursor is. */
function follow(l: THREE.Vector3, aim: THREE.Vector2, dt: number) {
  const k = 1 - Math.exp(-Math.min(dt, 0.1) * RELIEF.ease);
  l.x += (aim.x - l.x) * k;
  l.y += (aim.y - l.y) * k;
}

/**
 * The page's canvas sits above the DOM, so the carving must stop where something still covers its host (the footer's
 * sticky reveal slides out from under the page): discard everything above the cover's bottom edge.
 */
function clip(u: { value: number }, cover: Element | null, dpr: number) {
  u.value = cover ? (window.innerHeight - cover.getBoundingClientRect().bottom) * dpr : 1e6;
}

/**
 * Move the two reveal pools: the lead chases the pointer, the trail follows it more slowly. Without the mouse (touch
 * screens, or idle), they wander over the host's top band on their own. The light rakes from the lead pool's side.
 */
function reveal(
  material: THREE.ShaderMaterial,
  el: HTMLElement,
  pointer: { x: number; y: number; at: number },
  pools: { a: THREE.Vector2; b: THREE.Vector2 },
  aim: THREE.Vector2,
  time: number,
  dt: number,
  dpr: number,
) {
  const r = el.getBoundingClientRect();
  const live = performance.now() - pointer.at < RELIEF.idleMs;
  const tx = live ? pointer.x : r.left + r.width * (0.5 + 0.36 * Math.sin(time * 0.17));
  const ty = live ? pointer.y : r.top + r.height * (0.2 + 0.06 * Math.sin(time * 0.29));
  if (pools.a.x < 0) {
    pools.a.set(tx, ty);
    pools.b.set(tx, ty);
  }
  const ka = 1 - Math.exp(-Math.min(dt, 0.1) * RELIEF.lead);
  const kb = 1 - Math.exp(-Math.min(dt, 0.1) * RELIEF.trail);
  pools.a.x += (tx - pools.a.x) * ka;
  pools.a.y += (ty - pools.a.y) * ka;
  pools.b.x += (pools.a.x - pools.b.x) * kb;
  pools.b.y += (pools.a.y - pools.b.y) * kb;
  const radius = Math.min(320, Math.max(150, Math.min(r.width, r.height) * RELIEF.pool)) * dpr;
  // Reduced motion: no chasing pools, the whole carving shows at once.
  material.uniforms.uPoolA.value.set(pools.a.x * dpr, (window.innerHeight - pools.a.y) * dpr, scene.reducedMotion ? 1e6 : radius);
  material.uniforms.uPoolB.value.set(pools.b.x * dpr, (window.innerHeight - pools.b.y) * dpr, radius * 0.8);
  aim.set(((pools.a.x - (r.left + r.width / 2)) / r.width) * 2.4, ((r.top + r.height / 2 - pools.a.y) / r.height) * 2.4);
}

function Carving({ host, paint, high, shade, cover }: { host: React.RefObject<HTMLElement | null>; paint: PaintRelief; high: string; shade: string; cover?: () => Element | null }) {
  const { material, texture, canvas } = useMemo(() => {
    const canvas = document.createElement("canvas");
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.NoColorSpace;
    const material = new THREE.ShaderMaterial({
      defines: scene.tier === "low" ? { LOW: "" } : {},
      uniforms: {
        tHeight: { value: texture },
        uTexel: { value: new THREE.Vector2(1 / 1024, 1 / 1024) },
        uLight: { value: new THREE.Vector3(-0.6, 0.5, RELIEF.rake) },
        uHigh: { value: new THREE.Color(high) },
        uShade: { value: new THREE.Color(shade) },
        uDepth: { value: RELIEF.depth },
        uLightK: { value: RELIEF.light },
        uDarkK: { value: RELIEF.dark },
        uShadowK: { value: RELIEF.shadow },
        uClip: { value: 1e6 },
        uPoolA: { value: new THREE.Vector3(0, 0, 0) },
        uPoolB: { value: new THREE.Vector3(0, 0, 0) },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    return { material, texture, canvas };
  }, [high, shade]);
  const aim = useRef(new THREE.Vector2(-0.6, 0.5));
  const pointer = useRef({ x: 0, y: 0, at: -Infinity });
  const pools = useRef({ a: new THREE.Vector2(-1, -1), b: new THREE.Vector2(-1, -1) });

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let live = true;
    const draw = () => {
      if (!live) return;
      const scale = Math.min(window.devicePixelRatio, scene.tier === "low" ? 1 : 1.5);
      const w = Math.max(2, Math.round(el.clientWidth * scale));
      const hgt = Math.max(2, Math.round(el.clientHeight * scale));
      // A GL texture's storage is fixed at its first size: free it when the canvas changes size, or the old one shows.
      if (canvas.width !== w || canvas.height !== hgt) texture.dispose();
      canvas.width = w;
      canvas.height = hgt;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, hgt);
      paint(ctx, w, hgt, scale);
      material.uniforms.uTexel.value.set(1 / w, 1 / hgt);
      texture.needsUpdate = true;
    };
    document.fonts.ready.then(draw); // text boxes (masked out of the carving) settle once the fonts have loaded
    const ro = new ResizeObserver(draw);
    ro.observe(el);
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.current = { x: e.clientX, y: e.clientY, at: performance.now() };
    };
    if (!scene.reducedMotion) window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      live = false;
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, [host, paint, canvas, material, texture]);
  useEffect(
    () => () => {
      material.dispose();
      texture.dispose();
    },
    [material, texture],
  );

  useFrame(({ clock, gl }, dt) => {
    const el = host.current;
    if (!el) return;
    const dpr = gl.getPixelRatio();
    clip(material.uniforms.uClip, cover?.() ?? null, dpr);
    reveal(material, el, pointer.current, pools.current, aim.current, scene.reducedMotion ? 0 : clock.elapsedTime, scene.reducedMotion ? 1 : dt, dpr);
    follow(material.uniforms.uLight.value, aim.current, scene.reducedMotion ? 1 : dt);
  });

  return (
    <mesh material={material} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

/**
 * A carved relief over the host element (after immersive-g.com): paint draws the height field, and a raking light
 * that follows the pointer carves it with light and shade only, so the host's own background is the material.
 */
export default function Relief({ host, paint, high, shade, cover, className = "" }: { host: React.RefObject<HTMLElement | null>; paint: PaintRelief; high: string; shade: string; cover?: () => Element | null; className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none ${className}`}>
      <View className="size-full">
        <OrthographicCamera makeDefault position={[0, 0, 1]} />
        <Carving host={host} paint={paint} high={high} shade={shade} cover={cover} />
      </View>
    </div>
  );
}
