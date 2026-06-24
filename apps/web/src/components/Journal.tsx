import { AnimatePresence, motion } from 'framer-motion';
import type { JournalEntry } from '../lib/journal';
import styles from './Journal.module.css';

interface JournalProps {
  open: boolean;
  entries: JournalEntry[];
  reducedMotion: boolean;
  onOpen: () => void;
  onClose: () => void;
  onClear: () => void;
  /** Revisit a past reading by reproducing it from its seed. */
  onRevisit: (entry: JournalEntry) => void;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso.slice(0, 10);
  }
}

export function Journal({
  open,
  entries,
  reducedMotion,
  onOpen,
  onClose,
  onClear,
  onRevisit,
}: JournalProps) {
  return (
    <>
      {!open && (
        <button className={styles.toggle} onClick={onOpen} aria-label="Open journal">
          Journal{entries.length ? ` · ${entries.length}` : ''}
        </button>
      )}

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className={styles.scrim}
              onClick={onClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            />
            <motion.aside
              className={styles.drawer}
              role="dialog"
              aria-label="Reading journal"
              initial={reducedMotion ? { x: 0, opacity: 0 } : { x: '100%' }}
              animate={{ x: 0, opacity: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { x: '100%' }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className={styles.head}>
                <h2>Journal</h2>
                <button className={styles.close} onClick={onClose}>
                  Close
                </button>
              </div>

              {entries.length === 0 ? (
                <p className={styles.empty}>
                  Your past castings will gather here, each one returnable by its seed.
                </p>
              ) : (
                <div className={styles.list}>
                  {entries.map((entry) => (
                    <button
                      key={entry.id}
                      className={styles.entry}
                      onClick={() => onRevisit(entry)}
                      title="Revisit this reading"
                    >
                      <span className={styles.entryGlyph}>{entry.primarySymbol}</span>
                      <span className={styles.entryBody}>
                        <span
                          className={`${styles.entryQuestion} ${entry.question ? '' : styles.muted}`}
                        >
                          {entry.question || 'a wordless casting'}
                        </span>
                        <span className={styles.entryMeta}>
                          <span>{formatDate(entry.createdAt)}</span>
                          <span className={styles.dot}>·</span>
                          <span>
                            {entry.primaryName} · №{entry.primaryNumber}
                          </span>
                          {entry.transformedNumber !== null && (
                            <span className={styles.entryArrow}>→ №{entry.transformedNumber}</span>
                          )}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {entries.length > 0 && (
                <div className={styles.foot}>
                  <button className={styles.clear} onClick={onClear}>
                    Clear journal
                  </button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
