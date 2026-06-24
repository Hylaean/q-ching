import { AnimatePresence, motion } from 'framer-motion';
import type { JournalEntry } from '../lib/journal';
import { useI18n } from '../i18n';
import { hexName } from '../i18n/hexText';
import type { Locale } from '../i18n/strings';
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

function formatDate(iso: string, locale: Locale): string {
  try {
    return new Date(iso).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
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
  const { t, locale } = useI18n();
  return (
    <>
      {!open && (
        <button className={styles.toggle} onClick={onOpen} aria-label={t('journal.open')}>
          {t('journal.toggle')}
          {entries.length ? ` · ${entries.length}` : ''}
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
                <h2>{t('journal.title')}</h2>
                <button className={styles.close} onClick={onClose}>
                  {t('journal.close')}
                </button>
              </div>

              {entries.length === 0 ? (
                <p className={styles.empty}>{t('journal.empty')}</p>
              ) : (
                <div className={styles.list}>
                  {entries.map((entry) => (
                    <button
                      key={entry.id}
                      className={styles.entry}
                      onClick={() => onRevisit(entry)}
                      title={t('journal.revisit')}
                    >
                      <span className={styles.entryGlyph}>{entry.primarySymbol}</span>
                      <span className={styles.entryBody}>
                        <span
                          className={`${styles.entryQuestion} ${entry.question ? '' : styles.muted}`}
                        >
                          {entry.question || t('journal.wordless')}
                        </span>
                        <span className={styles.entryMeta}>
                          <span>{formatDate(entry.createdAt, locale)}</span>
                          <span className={styles.dot}>·</span>
                          <span>
                            {hexName(entry.primaryNumber, entry.primaryName, locale)} · №
                            {entry.primaryNumber}
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
                    {t('journal.clear')}
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
