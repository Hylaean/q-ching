import { motion } from 'framer-motion';
import { BreathingCircle } from '../components/BreathingCircle';
import styles from './Threshold.module.css';

interface ThresholdProps {
  onBegin: () => void;
}

const fade = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.2 + i * 0.28 },
  }),
};

export function Threshold({ onBegin }: ThresholdProps) {
  return (
    <div className={`stage ${styles.threshold}`}>
      <motion.div variants={fade} custom={0} initial="hidden" animate="show">
        <BreathingCircle />
      </motion.div>

      <motion.h1 className={styles.title} variants={fade} custom={1} initial="hidden" animate="show">
        q<span className={styles.dash}>-</span>ching
      </motion.h1>

      <motion.p
        className={styles.subtitle}
        variants={fade}
        custom={2}
        initial="hidden"
        animate="show"
      >
        an oracle cast from quantum noise and the motion of your hand
      </motion.p>

      <motion.div variants={fade} custom={3} initial="hidden" animate="show">
        <button className="affordance affordance--primary" onClick={onBegin}>
          Begin
        </button>
      </motion.div>
    </div>
  );
}
