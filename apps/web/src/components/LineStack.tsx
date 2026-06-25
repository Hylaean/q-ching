import { motion } from 'framer-motion';
import type { Bit } from '@q-ching/core';
import styles from './LineStack.module.css';

export interface LineDatum {
  position: number; // 1..6 bottom->top
  yang: boolean;
  changing: boolean;
}

interface LineStackProps {
  lines: LineDatum[];
  /** if true, lines reveal one-at-a-time bottom->up with a stagger */
  animate?: boolean;
  /** seconds between successive line reveals */
  stagger?: number;
  /** seconds to wait before the first line */
  delay?: number;
  reducedMotion?: boolean;
  compact?: boolean;
  className?: string;
}

/** Derive a static line stack from a hexagram's six bits (no change marks). */
export function bitsToLines(bits: readonly Bit[]): LineDatum[] {
  return bits.map((b, i) => ({ position: i + 1, yang: b === 1, changing: false }));
}

export function LineStack({
  lines,
  animate = false,
  stagger = 0.55,
  delay = 0,
  reducedMotion = false,
  compact = false,
  className,
}: LineStackProps) {
  const sorted = [...lines].sort((a, b) => a.position - b.position);

  return (
    <div className={`${styles.stack} ${compact ? styles.compact : ''} ${className ?? ''}`}>
      {sorted.map((line, index) => {
        const reveal = animate && !reducedMotion;
        return (
          <motion.div
            key={line.position}
            className={`${styles.line} ${line.changing ? styles.changing : ''}`}
            initial={reveal ? { opacity: 0, y: 14, scaleX: 0.6 } : false}
            animate={reveal ? { opacity: 1, y: 0, scaleX: 1 } : undefined}
            transition={
              reveal
                ? { duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: delay + index * stagger }
                : undefined
            }
          >
            {line.yang ? (
              <div className={styles.yang} />
            ) : (
              <div className={styles.yin}>
                <span />
                <span />
              </div>
            )}
            {line.changing && <span className={styles.changeMark} aria-hidden />}
          </motion.div>
        );
      })}
    </div>
  );
}
