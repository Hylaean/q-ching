import { useEffect, useState } from 'react';

/** Track the user's reduced-motion preference, reactively. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return Boolean(reduced);
}

/**
 * Whether this environment can offer DeviceMotion (and whether it gates access
 * behind an explicit permission prompt, as iOS Safari does).
 */
export function useDeviceMotionCapability(): { supported: boolean; needsPermission: boolean } {
  const supported = typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
  const needsPermission =
    supported &&
    typeof (DeviceMotionEvent as unknown as { requestPermission?: unknown }).requestPermission ===
      'function';
  return { supported, needsPermission };
}
