import { motion } from 'framer-motion';
import type { QrngResult, QrngSourceName } from '@q-ching/core';
import { useI18n } from '../i18n';
import styles from './SourceList.module.css';

export type SourceStatus = 'pending' | QrngResult;

/** Base i18n key per source: `${base}.title` / `${base}.blurb`. */
const SOURCE_KEY: Record<QrngSourceName, string> = {
  nist: 'source.nist',
  anu: 'source.anu',
  'random.org': 'source.randomorg',
  csprng: 'source.csprng',
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
  const { t } = useI18n();
  return (
    <div className={styles.list}>
      {order.map((source) => {
        const base = SOURCE_KEY[source];
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
              <strong>{t(`${base}.title`)}</strong>
              {pending ? (
                <span className={styles.detail}> — {t('source.listening')}</span>
              ) : ok ? (
                <span className={styles.detail}> — {t(`${base}.blurb`)}</span>
              ) : (
                <span className={styles.detail}> — {t('source.unreachable')}</span>
              )}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
