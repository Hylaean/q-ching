import { motion } from 'framer-motion';
import type { QrngResult, QrngSourceName } from '@q-ching/core';
import styles from './SourceList.module.css';

export type SourceStatus = 'pending' | QrngResult;

const SOURCE_META: Record<QrngSourceName, { title: string; blurb: string }> = {
  nist: { title: 'NIST quantum beacon', blurb: 'the cosmic pulse at the moment you asked' },
  anu: { title: 'ANU vacuum noise', blurb: 'fluctuations of empty space' },
  'random.org': { title: 'atmospheric noise', blurb: 'static gathered from the sky' },
  csprng: { title: 'local entropy', blurb: 'your device’s own randomness' },
};

interface SourceListProps {
  /** Sources we attempted, in display order. */
  order: QrngSourceName[];
  /** Per-source status: 'pending' until gatherEntropy resolves, then its result. */
  statuses: Partial<Record<QrngSourceName, SourceStatus>>;
}

/**
 * One row per entropy source, resolving to a checkmark or a cross. In the
 * browser the remote quantum endpoints are frequently blocked by CORS and come
 * back ok:false — that's expected and shown plainly, while local entropy always
 * succeeds, so a cast is never blocked.
 */
export function SourceList({ order, statuses }: SourceListProps) {
  return (
    <div className={styles.list}>
      {order.map((source) => {
        const meta = SOURCE_META[source];
        const status = statuses[source] ?? 'pending';
        const pending = status === 'pending';
        const ok = !pending && status.ok;

        return (
          <motion.div
            key={source}
            className={styles.row}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span
              className={`${styles.glyph} ${pending ? styles.pending : ok ? styles.ok : styles.fail}`}
              aria-hidden
            >
              {pending ? <span className={styles.dot} /> : ok ? '✓' : '✗'}
            </span>
            <span className={styles.name}>
              <strong>{meta.title}</strong>
              {pending ? (
                <span className={styles.detail}> — listening…</span>
              ) : ok ? (
                <span className={styles.detail}> — {meta.blurb}</span>
              ) : (
                <span className={styles.detail}> — unreachable (folded around)</span>
              )}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
