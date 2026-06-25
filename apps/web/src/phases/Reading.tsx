import { useEffect, useRef, useState } from 'react';
import { motion, type MotionProps } from 'framer-motion';
import type { Reading as ReadingType } from '@q-ching/core';
import { HexagramGlyph } from '../components/HexagramGlyph';
import { LineStack, bitsToLines } from '../components/LineStack';
import { useI18n } from '../i18n';
import { hexText } from '../i18n/hexText';
import { NOW_READINGS, transitionNote } from '../content/now';
import { NOW_READINGS_FR, transitionNoteFr } from '../content/now.fr';
import { NOW_LINES } from '../content/now-lines';
import { NOW_LINES_FR } from '../content/now-lines.fr';
import styles from './Reading.module.css';

interface ReadingProps {
  reading: ReadingType;
  question: string;
  reducedMotion: boolean;
  onAgain: () => void;
}

export function Reading({ reading, question, reducedMotion, onAgain }: ReadingProps) {
  const { t, locale } = useI18n();

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
  const primaryText = hexText(primary, locale);
  const transformedText = transformed ? hexText(transformed, locale) : null;
  const fr = locale === 'fr';
  const now = (fr ? NOW_READINGS_FR[primary.number] : undefined) ?? NOW_READINGS[primary.number];
  const nowBecoming = transformed
    ? (fr ? NOW_READINGS_FR[transformed.number] : undefined) ?? NOW_READINGS[transformed.number]
    : undefined;
  const nowLines = (fr ? NOW_LINES_FR[primary.number] : undefined) ?? NOW_LINES[primary.number];
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
            <HexagramGlyph symbol={primary.symbol} label={primaryText.name} />
            <div className={styles.lineCol}>
              <LineStack lines={primaryLines} reducedMotion={reducedMotion} />
            </div>
          </div>

          <p className={styles.number}>{t('reading.hexagram', { n: primary.number })}</p>
          <h1 className={styles.hanzi}>{primary.name.chinese}</h1>
          <p className={styles.pinyin}>
            {primary.name.pinyin} · <span className={styles.english}>{primaryText.name}</span>
          </p>
          <p className={styles.gloss}>{primaryText.gloss}</p>
        </motion.header>

        <div className="rule">
          <span className="rule__diamond" />
        </div>

        {/* ---- Judgment ----------------------------------------------------- */}
        <motion.section className={styles.passage} {...section(0.05)}>
          <p className="label">{t('reading.judgment')}</p>
          <p className={styles.prose}>{primaryText.judgment}</p>
        </motion.section>

        {/* ---- Image -------------------------------------------------------- */}
        <motion.section className={styles.passage} {...section(0.05)}>
          <p className="label">{t('reading.image')}</p>
          <p className={styles.prose}>{primaryText.image}</p>
        </motion.section>

        {/* ---- Now: a present-day lens (original, modern voice) ------------- */}
        {now && (
          <motion.section className={styles.now} {...section(0.05)}>
            <p className={styles.nowLabel}>{t('reading.now')}</p>
            <p className={styles.nowHook}>{now.hook}</p>
            <p className={styles.nowBody}>{now.body}</p>
          </motion.section>
        )}

        {/* ---- Changing lines ---------------------------------------------- */}
        {changingPositions.length > 0 && (
          <motion.section className={styles.changing} {...section(0.05)}>
            <p className="label">{t('reading.linesInMotion')}</p>
            <ul className={styles.changeList}>
              {changingPositions.map((pos) => (
                <li key={pos} className={styles.changeItem}>
                  <span className={styles.changeOrdinal}>{t('reading.line.' + pos)}</span>
                  <p className={styles.prose}>{primaryText.lineTexts[pos - 1]}</p>
                  {nowLines?.[pos - 1] && <p className={styles.nowLine}>{nowLines[pos - 1]}</p>}
                </li>
              ))}
            </ul>
          </motion.section>
        )}

        {/* ---- Transformed hexagram ---------------------------------------- */}
        {transformed && transformedText && (
          <motion.section className={styles.becoming} {...section(0.05)}>
            <div className="rule">
              <span className="rule__diamond" />
            </div>
            <p className={styles.becomingLabel}>{t('reading.becoming')}</p>
            <p className={styles.transition}>
              {(fr ? transitionNoteFr : transitionNote)(primaryText.name, transformedText.name)}
            </p>
            <div className={styles.glyphRow}>
              <HexagramGlyph symbol={transformed.symbol} size="medium" label={transformedText.name} />
              <div className={styles.lineCol}>
                <LineStack
                  lines={bitsToLines(transformed.bits)}
                  reducedMotion={reducedMotion}
                />
              </div>
            </div>
            <p className={styles.number}>{t('reading.hexagram', { n: transformed.number })}</p>
            <h2 className={styles.hanziMed}>{transformed.name.chinese}</h2>
            <p className={styles.pinyin}>
              {transformed.name.pinyin} ·{' '}
              <span className={styles.english}>{transformedText.name}</span>
            </p>
            <p className={styles.gloss}>{transformedText.gloss}</p>
            {nowBecoming && (
              <div className={styles.now}>
                <p className={styles.nowLabel}>{t('reading.now')}</p>
                <p className={styles.nowHook}>{nowBecoming.hook}</p>
                <p className={styles.nowBody}>{nowBecoming.body}</p>
              </div>
            )}
          </motion.section>
        )}

        {/* ---- Seed --------------------------------------------------------- */}
        <motion.section className={styles.seedBlock} {...section(0.05)}>
          <p className={styles.seedNote}>
            {t('reading.seedNote', { method: t('method.' + method + '.word') })}
          </p>
          <button className={styles.seedButton} onClick={copySeed} title={t('reading.copy')}>
            <span className={styles.seedValue}>{seed}</span>
            <span className={styles.copyTag}>{copied ? t('reading.copied') : t('reading.copy')}</span>
          </button>
        </motion.section>

        {/* ---- Cast again --------------------------------------------------- */}
        <motion.div className={styles.again} {...section(0.05)}>
          <button className="affordance affordance--primary" onClick={onAgain}>
            {t('reading.castAgain')}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
