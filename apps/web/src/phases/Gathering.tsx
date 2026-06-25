import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  gatherEntropy,
  type GestureEntropy,
  type QrngResult,
  type QrngSourceName,
} from '@hylaean/core';
import { InkCanvas } from '../components/InkCanvas';
import { EntropyMeter } from '../components/EntropyMeter';
import { SourceList, type SourceStatus } from '../components/SourceList';
import { useDeviceMotionCapability } from '../lib/hooks';
import { useI18n } from '../i18n';
import styles from './Gathering.module.css';

interface GatheringProps {
  gesture: GestureEntropy;
  reducedMotion: boolean;
  /** Quantum sources to draw from; local entropy ('csprng') is always folded in. */
  sources: QrngSourceName[];
  /** Called once the user commits — passes the resolved quantum results through. */
  onCast: (qrng: QrngResult[]) => void;
}

type MotionPermission = 'unknown' | 'unsupported' | 'prompt' | 'granted' | 'denied';

export function Gathering({ gesture, reducedMotion, sources, onCast }: GatheringProps) {
  const { t } = useI18n();

  // Display order: the requested sources, with local entropy always shown.
  const order = useMemo<QrngSourceName[]>(
    () => (sources.includes('csprng') ? sources : [...sources, 'csprng']),
    [sources],
  );

  const [fill, setFill] = useState(gesture.fill);
  const [statuses, setStatuses] = useState<Partial<Record<QrngSourceName, SourceStatus>>>(() => {
    const init: Partial<Record<QrngSourceName, SourceStatus>> = {};
    for (const s of order) init[s] = 'pending';
    return init;
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
    gatherEntropy(48, { sources })
      .then((results) => {
        if (!alive) return;
        qrngRef.current = results;
        const next: Partial<Record<QrngSourceName, SourceStatus>> = {};
        for (const r of results) next[r.source] = r;
        // ensure every displayed row resolves even if a source is absent
        for (const s of order) if (!next[s]) next[s] = { source: s, ok: false, bytes: null };
        setStatuses(next);
        setGatherDone(true);
      })
      .catch(() => {
        if (!alive) return;
        const fallback: Partial<Record<QrngSourceName, SourceStatus>> = {};
        for (const s of order) fallback[s] = { source: s, ok: false, bytes: null };
        setStatuses(fallback);
        setGatherDone(true);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          {t('gathering.label')}
        </motion.p>

        <motion.p
          className={styles.instruction}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        >
          {t('gathering.instruction')}
        </motion.p>

        <motion.div
          className={styles.panel}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.36 }}
        >
          <EntropyMeter fill={fill} />
          <div className={styles.sources}>
            <SourceList order={order} statuses={statuses} />
          </div>

          {motionPerm === 'prompt' && (
            <button className="affordance" onClick={requestMotion}>
              {t('gathering.allowMotion')}
            </button>
          )}
          {motionPerm === 'denied' && (
            <p className={styles.motionNote}>{t('gathering.motionDenied')}</p>
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
                {t('gathering.cast')}
              </motion.button>
            )}
          </AnimatePresence>
          {!ready && (
            <p className={styles.waiting}>
              {fill < 1 ? t('gathering.keepStirring') : t('gathering.listening')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
