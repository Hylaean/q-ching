import { useRef } from 'react';
import { motion } from 'framer-motion';
import type { CastMethod, GestureEntropy } from '@q-ching/core';
import styles from './Question.module.css';

interface QuestionProps {
  question: string;
  method: CastMethod;
  gesture: GestureEntropy;
  onQuestionChange: (q: string) => void;
  onMethodChange: (m: CastMethod) => void;
  onContinue: () => void;
}

const METHODS: { key: CastMethod; label: string; blurb: string }[] = [
  { key: 'coin', label: 'Coin', blurb: 'faster, balanced — changing lines come often' },
  { key: 'yarrow', label: 'Yarrow', blurb: 'traditional stalks — changing lines are rarer' },
];

export function Question({
  question,
  method,
  gesture,
  onQuestionChange,
  onMethodChange,
  onContinue,
}: QuestionProps) {
  const lastKey = useRef<number | null>(null);

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
        Hold it in mind
      </motion.p>

      <motion.h2
        className={styles.prompt}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}
      >
        What weighs on you?
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
          placeholder="A question, a knot, a crossing… or nothing at all."
          rows={3}
          spellCheck={false}
          autoComplete="off"
        />
        <span className={styles.underline} />
      </motion.div>

      <motion.div
        className={styles.methods}
        role="radiogroup"
        aria-label="Casting method"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
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
              <span className={styles.methodName}>{m.label}</span>
              <span className={styles.methodBlurb}>{m.blurb}</span>
            </button>
          );
        })}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.66 }}
      >
        <button className="affordance affordance--primary" onClick={onContinue}>
          Gather
        </button>
      </motion.div>
    </div>
  );
}
