import { useI18n } from '../i18n';
import { LOCALES, LOCALE_LABEL } from '../i18n/strings';
import styles from './LanguageSelector.module.css';

/** A small EN · FR toggle pinned to a corner. */
export function LanguageSelector() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div className={styles.wrap} role="group" aria-label={t('lang.label')}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          className={`${styles.btn} ${l === locale ? styles.active : ''}`}
          aria-pressed={l === locale}
          onClick={() => setLocale(l)}
        >
          {LOCALE_LABEL[l]}
        </button>
      ))}
    </div>
  );
}
