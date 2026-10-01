import * as THREE from "three";

/**
 * Run fn with every object in world shown (three's compile() skips invisible ones), then put visibility back.
 * lights: false hides the lights instead. The count of visible lights is part of every program's key, and the
 * descent draws both ways: Olympus while the Sanzu (and its five lights) is hidden, the Sanzu after the cut.
 */
function allVisible<T>(world: THREE.Scene, lights: boolean, fn: () => T): T {
  const changed: THREE.Object3D[] = [];
  world.traverse((o) => {
    const want = lights || !(o as THREE.Light).isLight;
    if (o.visible === want) return;
    changed.push(o);
    o.visible = want;
  });
  try {
    return fn();
  } finally {
    for (const o of changed) o.visible = !o.visible;
  }
}

/**
 * Compile every program a view will draw before it draws: the Sanzu while it is still hidden before the cut, the
 * shadows before ARISE. A first-use compile blocks the main thread for tens of ms per program (52 per crossing),
 * which is what froze the descent. compileAsync lets the driver compile in parallel off the main thread.
 * The render target and the light count are both part of each program's key, so compile every way a frame is drawn:
 * into the spirit pass's HalfFloat target, lit and unlit, and on screen unlit (the engraving, before the descent's cut).
 */
export async function precompile(gl: THREE.WebGLRenderer, world: THREE.Scene, camera: THREE.Camera) {
  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  const rt = gl.getRenderTarget();
  const tone = gl.toneMapping;
  // Nothing is tone mapped any more: the spirit pass reads linear HDR (spirit spec §3.1).
  const variants: [THREE.WebGLRenderTarget | null, THREE.ToneMapping, boolean][] = [
    [target, THREE.NoToneMapping, true],
    [target, THREE.NoToneMapping, false],
    [rt, THREE.NoToneMapping, false],
  ];
  try {
    for (const [into, mapping, lights] of variants) {
      gl.setRenderTarget(into);
      gl.toneMapping = mapping;
      const job = allVisible(world, lights, () => gl.compileAsync(world, camera));
      gl.setRenderTarget(rt);
      gl.toneMapping = tone;
      await job;
    }
  } finally {
    gl.setRenderTarget(rt);
    gl.toneMapping = tone;
    target.dispose();
  }
}

/**
 * One throwaway draw with everything shown, so geometry and texture uploads (and the water's reflection target)
 * happen now rather than on the first real frame. render draws a frame; it is called lit and unlit, so the spirit
 * pass's own program compiles here too.
 */
export function warm(gl: THREE.WebGLRenderer, world: THREE.Scene, render: () => void) {
  const tone = gl.toneMapping;
  for (const [mapping, lights] of [[THREE.NoToneMapping, false], [THREE.NoToneMapping, true]] as const) {
    gl.toneMapping = mapping;
    allVisible(world, lights, render);
  }
  gl.toneMapping = tone;
}
