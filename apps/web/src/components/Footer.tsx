import { useI18n } from '../i18n';
import styles from './Footer.module.css';

interface FooterProps {
  /** Open the About page. */
  onAbout: () => void;
}

/** A quiet footer pinned bottom-right: the About link and a copyright line. */
export function Footer({ onAbout }: FooterProps) {
  const { t } = useI18n();
  return (
    <footer className={styles.footer}>
      <button type="button" className={styles.about} onClick={onAbout}>
        {t('nav.about')}
      </button>
      <span className={styles.sep} aria-hidden>
        ·
      </span>
      <span className={styles.copy}>© Hylaean Industries 2026</span>
    </footer>
  );
}
