import { useRef } from 'react';
import { motion } from 'framer-motion';
import type { CastMethod, GestureEntropy, QrngSourceName } from '@q-ching/core';
import { useI18n } from '../i18n';
import styles from './Question.module.css';

interface QuestionProps {
  question: string;
  method: CastMethod;
  gesture: GestureEntropy;
  sources: QrngSourceName[];
  onQuestionChange: (q: string) => void;
  onMethodChange: (m: CastMethod) => void;
  onSourcesChange: (s: QrngSourceName[]) => void;
  onContinue: () => void;
}

const METHODS: { key: CastMethod; nameKey: string; blurbKey: string }[] = [
  { key: 'coin', nameKey: 'method.coin.name', blurbKey: 'method.coin.blurb' },
  { key: 'yarrow', nameKey: 'method.yarrow.name', blurbKey: 'method.yarrow.blurb' },
];

/** Remote quantum beacons the user can toggle. Local 'csprng' is always on. */
const REMOTE_SOURCES: { key: QrngSourceName; titleKey: string }[] = [
  { key: 'nist', titleKey: 'source.nist.title' },
  { key: 'anu', titleKey: 'source.anu.title' },
  { key: 'random.org', titleKey: 'source.randomorg.title' },
];

export function Question({
  question,
  method,
  gesture,
  sources,
  onQuestionChange,
  onMethodChange,
  onSourcesChange,
  onContinue,
}: QuestionProps) {
  const { t } = useI18n();
  const lastKey = useRef<number | null>(null);

  // Toggle a remote source on/off, always preserving local entropy ('csprng').
  const toggleSource = (key: QrngSourceName) => {
    const selected = sources.includes(key);
    const next = selected ? sources.filter((s) => s !== key) : [...sources, key];
    if (!next.includes('csprng')) next.push('csprng');
    onSourcesChange(next);
  };

  // Capture keystroke timing: feed the interval (ms) between keydowns into the
  // pool. Human typing rhythm is a genuine, hard-to-predict entropy source.
  const handleKeyDown = () => {
    const now = performance.now();
    if (lastKey.current !== null) {
      gesture.pushScalar(now - lastKey.current);
    }
    lastKey.current = now;
  };

  return (
    <div className={`stage ${styles.question}`}>
      <motion.p
        className="label"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.1 }}
      >
        {t('question.label')}
      </motion.p>

      <motion.h2
        className={styles.prompt}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}
      >
        {t('question.prompt')}
      </motion.h2>

      <motion.div
        className={styles.field}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.34 }}
      >
        <textarea
          className={styles.textarea}
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('question.placeholder')}
          rows={3}
          spellCheck={false}
          autoComplete="off"
        />
        <span className={styles.underline} />
      </motion.div>

      <motion.div
        className={styles.chooser}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <span className={styles.legend}>{t('method.legend')}</span>
        <div className={styles.methods} role="radiogroup" aria-label={t('method.legend')}>
          {METHODS.map((m) => {
            const active = method === m.key;
            return (
              <button
                key={m.key}
                role="radio"
                aria-checked={active}
                className={`${styles.method} ${active ? styles.active : ''}`}
                onClick={() => onMethodChange(m.key)}
              >
                <span className={styles.methodName}>{t(m.nameKey)}</span>
                <span className={styles.methodBlurb}>{t(m.blurbKey)}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        className={styles.chooser}
        role="group"
        aria-label={t('sources.legend')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.58 }}
      >
        <span className={styles.legend}>{t('sources.legend')}</span>
        <div className={styles.sources}>
          {REMOTE_SOURCES.map((s) => {
            const active = sources.includes(s.key);
            return (
              <button
                key={s.key}
                type="button"
                role="checkbox"
                aria-checked={active}
                className={`${styles.source} ${active ? styles.active : ''}`}
                onClick={() => toggleSource(s.key)}
              >
                {t(s.titleKey)}
              </button>
            );
          })}
          <span
            className={`${styles.source} ${styles.active} ${styles.locked}`}
            aria-disabled
            title={t('sources.hint')}
          >
            {t('source.csprng.title')}
          </span>
        </div>
        <span className={styles.hint}>{t('sources.hint')}</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.66 }}
      >
        <button className="affordance affordance--primary" onClick={onContinue}>
          {t('question.gather')}
        </button>
      </motion.div>
    </div>
  );
}
