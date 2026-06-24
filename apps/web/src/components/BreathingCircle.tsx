import styles from './BreathingCircle.module.css';

/**
 * A slow breathing circle — a pool of ink that gently expands and contracts,
 * inviting the querent to settle before they ask. Motion is CSS-driven and
 * fully suppressed under prefers-reduced-motion.
 */
export function BreathingCircle() {
  return (
    <div className={styles.wrap} aria-hidden>
      <div className={styles.ring} />
      <div className={styles.ink} />
      <div className={styles.core} />
    </div>
  );
}
