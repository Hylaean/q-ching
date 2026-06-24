import { useEffect, useRef } from 'react';

/**
 * A faint column of incense smoke rising from the bottom of the page.
 *
 * Rendered with a single WebGL fragment shader: domain-warped fractal Brownian
 * motion (fbm) noise drifting upward, shaped into wisps and masked so it's
 * densest along the bottom and dissolves toward the upper screen. It reads as
 * volumetric smoke far better than a sprite/particle system, and it's GPU-cheap.
 *
 * It is purely BACKGROUND: pointer-transparent, fixed at z-index 0, sitting
 * behind all text and controls (which occlude it), and frozen under
 * prefers-reduced-motion.
 */

interface SmokeFieldProps {
  reducedMotion?: boolean;
  /** Peak opacity of the smoke. Kept very low — this is meant to be subtle. */
  intensity?: number;
  /**
   * The reading's seed (hex). The same quantum/entropy seed that casts the
   * hexagram also shapes which wisps of incense form — when it changes, the
   * smoke gently reorganises into a new pattern.
   */
  seed?: string;
  /**
   * When true (the "stir the well" seeding step), the pointer becomes the lit
   * tip of an incense stick, with extra smoke emanating from it.
   */
  emit?: boolean;
}

/** Map a hex seed string to a stable 2D offset into the noise field. */
function seedToVec(seed?: string): [number, number] {
  if (!seed) return [0, 0];
  let h1 = 2166136261;
  let h2 = 0x9e3779b9 | 0;
  for (let i = 0; i < seed.length; i++) {
    const c = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619);
    h2 = Math.imul(h2 ^ c, 2246822519);
  }
  return [((h1 >>> 0) / 4294967295) * 512, ((h2 >>> 0) / 4294967295) * 512];
}

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_intensity;
uniform vec2 u_seed;   // offset into the noise field, derived from the reading's seed
uniform float u_emit;  // 0..1: incense-stick tip emission (the "stir the well" step)
uniform vec2 u_tip;    // pointer position, 0..1, y-up — the held, lit tip

float hash(vec2 p){
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p){
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res;            // 0..1, y up
  float aspect = u_res.x / u_res.y;

  // sample space: stretch vertically so wisps are tall and slender. The seed
  // offset selects which region of the noise field forms, so the same quantum
  // seed that casts the hexagram determines this particular plume.
  vec2 p = vec2(uv.x * aspect * 1.1, uv.y * 1.5) + u_seed;
  float t = u_time * 0.05;

  // domain warp: warp the field by itself, with the warp drifting upward,
  // so the smoke curls and rises rather than simply scrolling.
  vec2 q = vec2(
    fbm(p + vec2(0.0, t)),
    fbm(p + vec2(3.1, 1.7) - vec2(0.0, t * 0.8))
  );
  vec2 r = vec2(
    fbm(p + 3.0 * q + vec2(1.7, 9.2) - vec2(0.0, t * 1.3)),
    fbm(p + 3.0 * q + vec2(8.3, 2.8) - vec2(0.0, t * 0.6))
  );
  float f = fbm(p + 2.6 * r + vec2(0.0, t));

  // shape the field into wisps (soft threshold) rather than flat fog
  float density = smoothstep(0.42, 1.02, f);

  // rise: strongest along the bottom, climbing well up the screen before fading
  float rise = smoothstep(0.95, 0.0, uv.y);
  // soft falloff at the left/right edges so it doesn't cut hard at the sides
  float edge = smoothstep(0.0, 0.16, uv.x) * smoothstep(1.0, 0.84, uv.x);

  float baseAlpha = density * rise * edge * u_intensity;

  // --- incense-stick tip: a brighter plume rising from the held pointer,
  //     only during the seeding step. The tip is the source; smoke widens and
  //     fades as it climbs, with a small lit ember right at the point. ---
  float tipAlpha = 0.0;
  float ember = 0.0;
  if (u_emit > 0.001) {
    vec2 tp = uv - u_tip;
    float above = tp.y;                              // > 0 above the tip
    float lateral = tp.x * aspect;
    float width = 0.025 + 0.16 * max(above, 0.0);    // plume widens as it climbs
    float lateralMask = exp(-(lateral * lateral) / (2.0 * width * width));
    float heightMask = smoothstep(-0.03, 0.01, above) * exp(-max(above, 0.0) * 2.6);
    tipAlpha = u_emit * lateralMask * heightMask * (0.25 + 0.75 * density) * 0.55;
    ember = u_emit * exp(-dot(vec2(lateral, tp.y), vec2(lateral, tp.y)) * 520.0);
  }

  float alpha = clamp(baseAlpha + tipAlpha + ember * 0.5, 0.0, 0.9);

  // cool, faintly blue smoke with a hint of warm ember low down
  vec3 col = mix(vec3(0.71, 0.77, 0.87), vec3(0.80, 0.58, 0.47), 0.14 * (1.0 - uv.y));
  // glow warm right at the incense tip
  col = mix(col, vec3(0.96, 0.55, 0.30), ember * 0.85);

  // premultiplied output (matches premultipliedAlpha:true + blend ONE,1-SRC_ALPHA)
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn('SmokeField shader error:', gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export function SmokeField({
  reducedMotion = false,
  intensity = 0.136,
  seed,
  emit = false,
}: SmokeFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // target noise offset for the current seed; the render loop eases toward it
  const seedVecRef = useRef<[number, number]>(seedToVec(seed));
  // live pointer (y-up) and whether the incense tip is currently emitting
  const pointerRef = useRef<[number, number]>([0.5, 0.2]);
  const emitRef = useRef(false);

  useEffect(() => {
    seedVecRef.current = seedToVec(seed);
  }, [seed]);

  useEffect(() => {
    emitRef.current = !!emit;
  }, [emit]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      (canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false }) as
        | WebGLRenderingContext
        | null) ?? null;
    if (!gl) return; // no WebGL → just no smoke, the page is fine without it

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn('SmokeField link error:', gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    // fullscreen triangle
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uIntensity = gl.getUniformLocation(prog, 'u_intensity');
    const uSeed = gl.getUniformLocation(prog, 'u_seed');
    const uEmit = gl.getUniformLocation(prog, 'u_emit');
    const uTip = gl.getUniformLocation(prog, 'u_tip');

    // track the pointer (and touch) as the incense tip
    const onMove = (e: PointerEvent) => {
      pointerRef.current = [
        e.clientX / Math.max(1, window.innerWidth),
        1 - e.clientY / Math.max(1, window.innerHeight),
      ];
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onMove, { passive: true });

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    // The smoke is soft; render at a fraction of CSS resolution for performance
    // (the result is blurry by nature, so the downscale is invisible).
    const SCALE = 0.6;
    const resize = () => {
      const w = Math.max(1, Math.floor(canvas.clientWidth * SCALE));
      const h = Math.max(1, Math.floor(canvas.clientHeight * SCALE));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    gl.uniform1f(uIntensity, intensity);

    // ease the seed offset so a new reading reorganises the smoke gently
    const cur: [number, number] = [seedVecRef.current[0], seedVecRef.current[1]];
    // eased incense-tip emission + a lightly-lagging tip position
    const tip: [number, number] = [pointerRef.current[0], pointerRef.current[1]];
    let emitCur = 0;

    let raf = 0;
    let start = 0;
    let stopped = false;

    const frame = (now: number) => {
      if (stopped) return;
      if (!start) start = now;
      const elapsed = (now - start) / 1000;
      const target = seedVecRef.current;
      cur[0] += (target[0] - cur[0]) * 0.03;
      cur[1] += (target[1] - cur[1]) * 0.03;
      // incense tip: fade emission in/out with the phase; lag the tip slightly
      const emitTarget = reducedMotion ? 0 : emitRef.current ? 1 : 0;
      emitCur += (emitTarget - emitCur) * 0.1;
      tip[0] += (pointerRef.current[0] - tip[0]) * 0.25;
      tip[1] += (pointerRef.current[1] - tip[1]) * 0.25;
      gl.uniform1f(uTime, reducedMotion ? 0 : elapsed);
      gl.uniform2f(uSeed, cur[0], cur[1]);
      gl.uniform1f(uEmit, emitCur);
      gl.uniform2f(uTip, tip[0], tip[1]);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      // Under reduced motion a single static frame is enough — don't churn.
      if (!reducedMotion) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    // pause when the tab is hidden to save battery
    const onVisibility = () => {
      if (document.hidden) {
        stopped = true;
        cancelAnimationFrame(raf);
      } else if (!reducedMotion) {
        stopped = false;
        start = 0;
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onMove);
      document.removeEventListener('visibilitychange', onVisibility);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, [reducedMotion, intensity]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
