import { useEffect, useRef, useState } from 'react';
import { motion, type MotionProps } from 'framer-motion';
import type { Reading as ReadingType } from '@q-ching/core';
import { HexagramGlyph } from '../components/HexagramGlyph';
import { LineStack, bitsToLines } from '../components/LineStack';
import styles from './Reading.module.css';

interface ReadingProps {
  reading: ReadingType;
  question: string;
  reducedMotion: boolean;
  onAgain: () => void;
}

export function Reading({ reading, question, reducedMotion, onAgain }: ReadingProps) {
  // A scroll-triggered fade-in per section, or an immediate appearance when the
  // querent prefers reduced motion.
  const section = (delay: number): MotionProps =>
    reducedMotion
      ? { initial: false, animate: { opacity: 1, y: 0 } }
      : {
          initial: { opacity: 0, y: 22 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: '-12% 0px' },
          transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1], delay },
        };

  const { primary, transformed, changingPositions, lines, seed, method } = reading;
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );

  const copySeed = async () => {
    try {
      await navigator.clipboard.writeText(seed);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard may be unavailable; the seed is still visible to select */
    }
  };

  // line data for the primary (with change marks) and the transformed (static)
  const primaryLines = lines.map((l) => ({
    position: l.position,
    yang: l.yang,
    changing: l.changing,
  }));

  return (
    <div className={`${styles.reading} scroll-region`}>
      <div className={styles.inner}>
        {/* ---- crown: glyph + names + lines -------------------------------- */}
        <motion.header
          className={styles.crown}
          initial={reducedMotion ? false : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {question.trim() && <p className={styles.echo}>“{question.trim()}”</p>}

          <div className={styles.glyphRow}>
            <HexagramGlyph symbol={primary.symbol} label={primary.name.english} />
            <div className={styles.lineCol}>
              <LineStack lines={primaryLines} reducedMotion={reducedMotion} />
            </div>
          </div>

          <p className={styles.number}>Hexagram {primary.number}</p>
          <h1 className={styles.hanzi}>{primary.name.chinese}</h1>
          <p className={styles.pinyin}>
            {primary.name.pinyin} · <span className={styles.english}>{primary.name.english}</span>
          </p>
          <p className={styles.gloss}>{primary.gloss}</p>
        </motion.header>

        <div className="rule">
          <span className="rule__diamond" />
        </div>

        {/* ---- Judgment ----------------------------------------------------- */}
        <motion.section className={styles.passage} {...section(0.05)}>
          <p className="label">The Judgment</p>
          <p className={styles.prose}>{primary.judgment}</p>
        </motion.section>

        {/* ---- Image -------------------------------------------------------- */}
        <motion.section className={styles.passage} {...section(0.05)}>
          <p className="label">The Image</p>
          <p className={styles.prose}>{primary.image}</p>
        </motion.section>

        {/* ---- Changing lines ---------------------------------------------- */}
        {changingPositions.length > 0 && (
          <motion.section className={styles.changing} {...section(0.05)}>
            <p className="label">Lines in Motion</p>
            <ul className={styles.changeList}>
              {changingPositions.map((pos) => (
                <li key={pos} className={styles.changeItem}>
                  <span className={styles.changeOrdinal}>{ordinal(pos)}</span>
                  <p className={styles.prose}>{primary.lineTexts[pos - 1]}</p>
                </li>
              ))}
            </ul>
          </motion.section>
        )}

        {/* ---- Transformed hexagram ---------------------------------------- */}
        {transformed && (
          <motion.section className={styles.becoming} {...section(0.05)}>
            <div className="rule">
              <span className="rule__diamond" />
            </div>
            <p className={styles.becomingLabel}>this is becoming…</p>
            <div className={styles.glyphRow}>
              <HexagramGlyph symbol={transformed.symbol} size="medium" label={transformed.name.english} />
              <div className={styles.lineCol}>
                <LineStack
                  lines={bitsToLines(transformed.bits)}
                  reducedMotion={reducedMotion}
                />
              </div>
            </div>
            <p className={styles.number}>Hexagram {transformed.number}</p>
            <h2 className={styles.hanziMed}>{transformed.name.chinese}</h2>
            <p className={styles.pinyin}>
              {transformed.name.pinyin} ·{' '}
              <span className={styles.english}>{transformed.name.english}</span>
            </p>
            <p className={styles.gloss}>{transformed.gloss}</p>
          </motion.section>
        )}

        {/* ---- Seed --------------------------------------------------------- */}
        <motion.section className={styles.seedBlock} {...section(0.05)}>
          <p className={styles.seedNote}>
            This cast was drawn by the {method} method. Its seed reproduces it exactly —
            keep it to return to this same throw.
          </p>
          <button className={styles.seedButton} onClick={copySeed} title="Copy seed">
            <span className="mono">{seed}</span>
            <span className={styles.copyTag}>{copied ? 'copied' : 'copy'}</span>
          </button>
        </motion.section>

        {/* ---- Cast again --------------------------------------------------- */}
        <motion.div className={styles.again} {...section(0.05)}>
          <button className="affordance affordance--primary" onClick={onAgain}>
            Cast again
          </button>
        </motion.div>
      </div>
    </div>
  );
}

function ordinal(n: number): string {
  const names = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth'];
  return `${names[n - 1] ?? n} line`;
}
