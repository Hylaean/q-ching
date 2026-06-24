import { useCallback, useEffect, useRef } from 'react';
import type { GestureEntropy } from '@q-ching/core';

interface InkCanvasProps {
  /** Live gesture accumulator; every pointer move is pushed here. */
  gesture: GestureEntropy;
  /** Called after each accepted sample so the parent can update its fill meter. */
  onSample?: () => void;
  reducedMotion?: boolean;
  className?: string;
}

interface TrailPoint {
  x: number;
  y: number;
  age: number; // 0 = fresh, grows each frame
}

const MAX_AGE = 46; // frames a trail point lives
const ACCENT = '#b34733'; // cinnabar
const GLOW = '#d8745f';

/**
 * A full-bleed canvas the querent draws on with mouse or touch. A luminous
 * cinnabar ink trail follows the pointer; every move is fed into GestureEntropy
 * via push(x, y, performance.now()). The trail self-erases (ink drying), so the
 * surface never clutters during a long gather.
 */
export function InkCanvas({ gesture, onSample, reducedMotion, className }: InkCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailRef = useRef<TrailPoint[]>([]);
  const rafRef = useRef<number | null>(null);
  const dprRef = useRef(1);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    dprRef.current = dpr;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  }, []);

  // Capture a pointer sample: feed entropy + extend the visible trail.
  const sample = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      gesture.push(x, y, performance.now());
      trailRef.current.push({ x: x * dprRef.current, y: y * dprRef.current, age: 0 });
      // bound the trail so memory stays flat during long gathers
      if (trailRef.current.length > 400) trailRef.current.shift();
      onSample?.();
    },
    [gesture, onSample],
  );

  // Pointer handlers (covers mouse, touch, and pen via Pointer Events).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let drawing = false;

    const down = (e: PointerEvent) => {
      drawing = true;
      canvas.setPointerCapture?.(e.pointerId);
      sample(e.clientX, e.clientY);
    };
    const move = (e: PointerEvent) => {
      // coalesced events give smoother trails + richer timing entropy
      const events =
        'getCoalescedEvents' in e ? (e.getCoalescedEvents() as PointerEvent[]) : [e];
      if (drawing) {
        for (const ev of events) sample(ev.clientX, ev.clientY);
      } else {
        // even hover (desktop) gives a faint trail + a little entropy
        sample(e.clientX, e.clientY);
      }
    };
    const up = () => {
      drawing = false;
    };

    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);

    return () => {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
    };
  }, [sample]);

  // Render loop: draw + age the trail.
  useEffect(() => {
    resize();
    window.addEventListener('resize', resize);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const trail = trailRef.current;

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1];
        const b = trail[i];
        // break the stroke across pen-lifts (large jumps)
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        if (dist > 90 * dprRef.current) continue;

        const life = 1 - b.age / MAX_AGE;
        if (life <= 0) continue;

        const width = (2 + life * 9) * dprRef.current;
        ctx.strokeStyle = `rgba(216, 116, 95, ${0.06 + life * 0.32})`;
        ctx.lineWidth = width;
        ctx.shadowBlur = 16 * life;
        ctx.shadowColor = ACCENT;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // the leading wet point
      const head = trail[trail.length - 1];
      if (head && head.age < 4) {
        ctx.shadowBlur = 22;
        ctx.shadowColor = GLOW;
        ctx.fillStyle = 'rgba(239, 233, 221, 0.9)';
        ctx.beginPath();
        ctx.arc(head.x, head.y, 3 * dprRef.current, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // age + cull
      for (const p of trail) p.age += 1;
      trailRef.current = trail.filter((p) => p.age < MAX_AGE);

      rafRef.current = requestAnimationFrame(render);
    };

    // Under reduced motion we still draw the trail, but skip per-frame redraw
    // churn when idle is handled naturally by the cull (trail empties → blank).
    rafRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [resize, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ touchAction: 'none', width: '100%', height: '100%', display: 'block' }}
      aria-label="Drawing surface — trace with your finger or pointer to stir entropy"
    />
  );
}
