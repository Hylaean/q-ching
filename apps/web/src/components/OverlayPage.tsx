import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useI18n } from '../i18n';
import styles from './OverlayPage.module.css';

interface OverlayPageProps {
  open: boolean;
  reducedMotion: boolean;
  onClose: () => void;
  /** Accessible name for the dialog. */
  label: string;
  children: ReactNode;
}

/**
 * A full-screen "page" rendered over the ritual — used for About and Analysis.
 * Closes on Escape and via the corner affordance; scrolls its own content.
 */
export function OverlayPage({ open, reducedMotion, onClose, label, children }: OverlayPageProps) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.page}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0.15 : 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <button className={styles.close} onClick={onClose} aria-label={t('common.close')}>
            {t('common.close')}
          </button>

          <div className={`${styles.scroll} scroll-region`}>
            <motion.article
              className={styles.inner}
              initial={reducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
            >
              {children}
            </motion.article>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
