import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cast, type CastMethod, type QrngResult, type Reading } from '@hylaean/core';
import { LineStack, type LineDatum } from '../components/LineStack';
import { useI18n } from '../i18n';
import styles from './Casting.module.css';

interface CastingProps {
  method: CastMethod;
  userEntropy: Uint8Array;
  qrng: QrngResult[];
  reducedMotion: boolean;
  onComplete: (reading: Reading) => void;
}

const LINE_STAGGER = 0.62; // seconds between line reveals

/**
 * Calls cast() with the gathered entropy, then animates the six lines forming
 * from the bottom up. Once the last line has settled we hand the reading back
 * up so the READING phase can take over.
 */
export function Casting({ method, userEntropy, qrng, reducedMotion, onComplete }: CastingProps) {
  const { t } = useI18n();
  const [reading, setReading] = useState<Reading | null>(null);
  const [revealed, setRevealed] = useState(0); // how many lines have flourished
  const started = useRef(false);

  // Cast exactly once.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    cast({ method, userEntropy, qrng })
      .then(setReading)
      .catch((err) => {
        // A cast should never truly fail (csprng always succeeds), but guard anyway.
        console.error('cast failed', err);
      });
  }, [method, userEntropy, qrng]);

  // Drive the per-line flourish + hand off when complete.
  useEffect(() => {
    if (!reading) return;

    if (reducedMotion) {
      setRevealed(6);
      const t = setTimeout(() => onComplete(reading), 700);
      return () => clearTimeout(t);
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= 6; i++) {
      timers.push(setTimeout(() => setRevealed(i), 400 + i * LINE_STAGGER * 1000));
    }
    // hold the completed hexagram a beat, then advance
    timers.push(
      setTimeout(() => onComplete(reading), 400 + 6 * LINE_STAGGER * 1000 + 1200),
    );
    return () => timers.forEach(clearTimeout);
  }, [reading, reducedMotion, onComplete]);

  const lines: LineDatum[] = reading
    ? reading.lines.map((l) => ({ position: l.position, yang: l.yang, changing: l.changing }))
    : [];

  return (
    <div className={`stage ${styles.casting}`}>
      <motion.p
        className="label"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {method === 'coin' ? t('casting.coin') : t('casting.yarrow')}
      </motion.p>

      <div className={styles.flourishWrap}>
        {/* coin / stalk flourish — a soft ring that pulses as each line lands */}
        <AnimatePresence>
          {revealed > 0 && revealed < 6 && !reducedMotion && (
            <motion.span
              key={revealed}
              className={styles.flourish}
              initial={{ opacity: 0.5, scale: 0.4 }}
              animate={{ opacity: 0, scale: 2.2 }}
              transition={{ duration: LINE_STAGGER, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>

        {reading ? (
          <LineStack
            lines={lines}
            animate
            stagger={LINE_STAGGER}
            delay={0.4}
            reducedMotion={reducedMotion}
          />
        ) : (
          <p className={styles.casting_note}>{t('casting.note')}</p>
        )}
      </div>

      <p className={styles.count}>
        {reading ? t('casting.count', { n: Math.min(revealed, 6) }) : t('casting.drawing')}
      </p>
    </div>
  );
}
