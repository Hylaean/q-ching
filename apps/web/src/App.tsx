import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GestureEntropy, cast, type QrngResult, type Reading } from '@q-ching/core';

import { initialRitualState, ritualReducer } from './ritual/machine';
import { useReducedMotion } from './lib/hooks';
import {
  clearJournal,
  loadJournal,
  recordReading,
  type JournalEntry,
} from './lib/journal';

import { Threshold } from './phases/Threshold';
import { Question } from './phases/Question';
import { Gathering } from './phases/Gathering';
import { Casting } from './phases/Casting';
import { Reading as ReadingPhase } from './phases/Reading';
import { Journal } from './components/Journal';

const phaseFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, transition: { duration: 0.7, ease: 'easeInOut' as const } },
};

export default function App() {
  const reducedMotion = useReducedMotion();
  const [state, dispatch] = useReducer(ritualReducer, initialRitualState);

  // One GestureEntropy instance per ritual run. We re-create it on each fresh
  // run (begin / cast again) so each reading is stirred from a clean slate.
  const gestureRef = useRef(new GestureEntropy());
  const [, forceGestureKey] = useState(0);

  // Quantum results captured during GATHERING, handed to CASTING.
  const qrngRef = useRef<QrngResult[]>([]);
  // Snapshot of the gesture bytes taken at the moment of casting.
  const userEntropyRef = useRef<Uint8Array>(new Uint8Array());

  // Journal
  const [journalOpen, setJournalOpen] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  useEffect(() => {
    setEntries(loadJournal());
  }, []);

  const freshGesture = useCallback(() => {
    gestureRef.current = new GestureEntropy();
    forceGestureKey((n) => n + 1);
  }, []);

  // ---- phase transitions ----------------------------------------------------

  const handleBegin = useCallback(() => {
    freshGesture();
    dispatch({ type: 'begin' });
  }, [freshGesture]);

  const handleGather = useCallback(() => {
    dispatch({ type: 'toGathering' });
  }, []);

  const handleCast = useCallback((qrng: QrngResult[]) => {
    qrngRef.current = qrng;
    userEntropyRef.current = gestureRef.current.bytes;
    dispatch({ type: 'toCasting' });
  }, []);

  const handleCastComplete = useCallback(
    (reading: Reading) => {
      recordReading(state.question, reading);
      setEntries(loadJournal());
      dispatch({ type: 'castComplete', reading });
    },
    [state.question],
  );

  const handleAgain = useCallback(() => {
    freshGesture();
    dispatch({ type: 'again' });
  }, [freshGesture]);

  // Revisit a journal entry: reproduce the cast deterministically from its seed.
  const handleRevisit = useCallback(async (entry: JournalEntry) => {
    setJournalOpen(false);
    try {
      const reading = await cast({ seed: entry.seed, method: entry.method });
      dispatch({ type: 'setQuestion', question: entry.question });
      // Jump straight to the reading without re-running the gather animation.
      dispatch({ type: 'castComplete', reading });
    } catch (err) {
      console.error('Could not reproduce reading from seed', err);
    }
  }, []);

  const clearAndClose = useCallback(() => {
    clearJournal();
    setEntries([]);
  }, []);

  // ---- render ---------------------------------------------------------------
  // Rendered fresh each pass; the surrounding AnimatePresence keys on phase, and
  // the gesture instance is read live from the ref so a fresh run is picked up.

  function renderPhase() {
    switch (state.phase) {
      case 'threshold':
        return <Threshold onBegin={handleBegin} />;
      case 'question':
        return (
          <Question
            question={state.question}
            method={state.method}
            gesture={gestureRef.current}
            onQuestionChange={(q) => dispatch({ type: 'setQuestion', question: q })}
            onMethodChange={(m) => dispatch({ type: 'setMethod', method: m })}
            onContinue={handleGather}
          />
        );
      case 'gathering':
        return (
          <Gathering
            gesture={gestureRef.current}
            reducedMotion={reducedMotion}
            onCast={handleCast}
          />
        );
      case 'casting':
        return (
          <Casting
            method={state.method}
            userEntropy={userEntropyRef.current}
            qrng={qrngRef.current}
            reducedMotion={reducedMotion}
            onComplete={handleCastComplete}
          />
        );
      case 'reading':
        return state.reading ? (
          <ReadingPhase
            reading={state.reading}
            question={state.question}
            reducedMotion={reducedMotion}
            onAgain={handleAgain}
          />
        ) : null;
      default:
        return null;
    }
  }

  return (
    <>
      <div className="atmosphere" aria-hidden />

      <Journal
        open={journalOpen}
        entries={entries}
        reducedMotion={reducedMotion}
        onOpen={() => setJournalOpen(true)}
        onClose={() => setJournalOpen(false)}
        onClear={clearAndClose}
        onRevisit={handleRevisit}
      />

      <AnimatePresence mode="wait">
        <motion.main
          key={state.phase}
          variants={phaseFade}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {renderPhase()}
        </motion.main>
      </AnimatePresence>
    </>
  );
}
