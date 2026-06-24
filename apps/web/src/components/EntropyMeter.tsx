import styles from './EntropyMeter.module.css';

interface EntropyMeterProps {
  fill: number; // 0..1
  label?: string;
}

/** A thin filling line that reflects GestureEntropy.fill (how much the hand has stirred). */
export function EntropyMeter({ fill, label = 'Stirring' }: EntropyMeterProps) {
  const pct = Math.round(Math.min(1, Math.max(0, fill)) * 100);
  return (
    <div className={styles.meter}>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
      <div className={styles.caption}>
        <span>{label}</span>
        <span className={styles.pct}>{pct}%</span>
      </div>
    </div>
  );
}
