import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  gatherEntropy,
  type GestureEntropy,
  type QrngResult,
  type QrngSourceName,
} from '@q-ching/core';
import { InkCanvas } from '../components/InkCanvas';
import { EntropyMeter } from '../components/EntropyMeter';
import { SourceList, type SourceStatus } from '../components/SourceList';
import { useDeviceMotionCapability } from '../lib/hooks';
import styles from './Gathering.module.css';

interface GatheringProps {
  gesture: GestureEntropy;
  reducedMotion: boolean;
  /** Called once the user commits — passes the resolved quantum results through. */
  onCast: (qrng: QrngResult[]) => void;
}

const SOURCE_ORDER: QrngSourceName[] = ['nist', 'csprng'];

type MotionPermission = 'unknown' | 'unsupported' | 'prompt' | 'granted' | 'denied';

export function Gathering({ gesture, reducedMotion, onCast }: GatheringProps) {
  const [fill, setFill] = useState(gesture.fill);
  const [statuses, setStatuses] = useState<Partial<Record<QrngSourceName, SourceStatus>>>({
    nist: 'pending',
    csprng: 'pending',
  });
  const [gatherDone, setGatherDone] = useState(false);
  const qrngRef = useRef<QrngResult[]>([]);

  const { needsPermission } = useDeviceMotionCapability();
  const [motionPerm, setMotionPerm] = useState<MotionPermission>(
    needsPermission ? 'prompt' : 'unknown',
  );

  const refreshFill = useCallback(() => {
    setFill(gesture.fill);
  }, [gesture]);

  // Fire the quantum gather once on mount; local CSPRNG always succeeds, so the
  // meter+gather can always complete even when remote beacons are CORS-blocked.
  useEffect(() => {
    let alive = true;
    gatherEntropy(48, { sources: ['nist', 'csprng'] })
      .then((results) => {
        if (!alive) return;
        qrngRef.current = results;
        const next: Partial<Record<QrngSourceName, SourceStatus>> = {};
        for (const r of results) next[r.source] = r;
        // ensure every requested row resolves even if a source is absent
        for (const s of SOURCE_ORDER) if (!next[s]) next[s] = { source: s, ok: false, bytes: null };
        setStatuses(next);
        setGatherDone(true);
      })
      .catch(() => {
        if (!alive) return;
        const fallback: Partial<Record<QrngSourceName, SourceStatus>> = {};
        for (const s of SOURCE_ORDER) fallback[s] = { source: s, ok: false, bytes: null };
        setStatuses(fallback);
        setGatherDone(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Device-motion: feed each acceleration axis into the pool as a scalar.
  const attachMotion = useCallback(() => {
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity ?? e.acceleration;
      if (!a) return;
      if (a.x != null) gesture.pushScalar(a.x);
      if (a.y != null) gesture.pushScalar(a.y);
      if (a.z != null) gesture.pushScalar(a.z);
      refreshFill();
    };
    window.addEventListener('devicemotion', onMotion);
    return () => window.removeEventListener('devicemotion', onMotion);
  }, [gesture, refreshFill]);

  // Auto-attach where no explicit permission is required (Android/desktop).
  useEffect(() => {
    if (motionPerm === 'unknown' && 'DeviceMotionEvent' in window) {
      return attachMotion();
    }
    return undefined;
  }, [motionPerm, attachMotion]);

  const requestMotion = async () => {
    const Ctor = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> };
    if (typeof Ctor.requestPermission !== 'function') {
      setMotionPerm('unsupported');
      return;
    }
    try {
      const res = await Ctor.requestPermission();
      if (res === 'granted') {
        setMotionPerm('granted');
        attachMotion();
      } else {
        setMotionPerm('denied');
      }
    } catch {
      setMotionPerm('denied');
    }
  };

  const ready = fill >= 1 && gatherDone;

  return (
    <div className={styles.gathering}>
      {/* full-bleed ink canvas behind everything */}
      <InkCanvas
        gesture={gesture}
        onSample={refreshFill}
        reducedMotion={reducedMotion}
        className={styles.canvas}
      />

      <div className={`stage ${styles.overlay}`}>
        <motion.p
          className="label"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.1 }}
        >
          Stir the well
        </motion.p>

        <motion.p
          className={styles.instruction}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        >
          Trace the dark with your hand. Your motion, the noise of your device, and the
          universe’s own randomness are gathering into a single seed.
        </motion.p>

        <motion.div
          className={styles.panel}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.36 }}
        >
          <EntropyMeter fill={fill} />
          <div className={styles.sources}>
            <SourceList order={SOURCE_ORDER} statuses={statuses} />
          </div>

          {motionPerm === 'prompt' && (
            <button className="affordance" onClick={requestMotion}>
              Allow motion
            </button>
          )}
          {motionPerm === 'denied' && (
            <p className={styles.motionNote}>Motion declined — your hand alone will do.</p>
          )}
        </motion.div>

        <div className={styles.castSlot}>
          <AnimatePresence>
            {ready && (
              <motion.button
                key="cast"
                className="affordance affordance--primary"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => onCast(qrngRef.current)}
              >
                Cast
              </motion.button>
            )}
          </AnimatePresence>
          {!ready && (
            <p className={styles.waiting}>
              {fill < 1 ? 'keep stirring…' : 'listening for the beacon…'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
