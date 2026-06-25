import React, { useCallback, useRef, useState } from 'react';
import { useApp, useInput } from 'ink';
import {
  GestureEntropy,
  type CastMethod,
  type QrngResult,
  type Reading as ReadingType,
} from '@hylaean/core';
import { Splash } from './screens/Splash.js';
import { Question } from './screens/Question.js';
import { Method } from './screens/Method.js';
import { Gathering } from './screens/Gathering.js';
import { Casting } from './screens/Casting.js';
import { Reading } from './screens/Reading.js';

type Stage = 'splash' | 'question' | 'method' | 'gathering' | 'casting' | 'reading';

interface CastState {
  question: string;
  /** Gesture bytes snapshotted at question submission (keystroke timings). */
  userEntropy: Uint8Array;
  method: CastMethod;
  qrng: QrngResult[];
  reading: ReadingType | null;
}

const EMPTY: CastState = {
  question: '',
  userEntropy: new Uint8Array(),
  method: 'coin',
  qrng: [],
  reading: null,
};

export function App(): React.JSX.Element {
  const { exit } = useApp();
  const [stage, setStage] = useState<Stage>('splash');
  const [state, setState] = useState<CastState>(EMPTY);

  // A fresh gesture accumulator per reading; replaced on recast.
  const gestureRef = useRef(new GestureEntropy());

  const recast = useCallback(() => {
    gestureRef.current = new GestureEntropy();
    setState(EMPTY);
    setStage('question');
  }, [gestureRef]);

  // Global keys. Individual screens own their own input; we only handle the
  // truly global ones here, and avoid stealing keys while typing the question.
  useInput((input, key) => {
    if (input === 'q' && stage !== 'question') {
      exit();
      return;
    }
    if (key.ctrl && input === 'c') {
      exit();
      return;
    }
    if (input === 'r' && (stage === 'reading' || stage === 'method')) {
      recast();
    }
  });

  switch (stage) {
    case 'splash':
      return <Splash onDone={() => setStage('question')} />;

    case 'question':
      return (
        <Question
          gesture={gestureRef.current}
          onSubmit={(question) => {
            setState((s) => ({
              ...s,
              question,
              userEntropy: gestureRef.current.bytes,
            }));
            setStage('method');
          }}
        />
      );

    case 'method':
      return (
        <Method
          onSelect={(method) => {
            setState((s) => ({ ...s, method }));
            setStage('gathering');
          }}
        />
      );

    case 'gathering':
      return (
        <Gathering
          onDone={(qrng) => {
            setState((s) => ({ ...s, qrng }));
            setStage('casting');
          }}
        />
      );

    case 'casting':
      return (
        <Casting
          method={state.method}
          userEntropy={state.userEntropy}
          qrng={state.qrng}
          onDone={(reading) => {
            setState((s) => ({ ...s, reading }));
            setStage('reading');
          }}
        />
      );

    case 'reading':
      return state.reading ? (
        <Reading reading={state.reading} question={state.question} />
      ) : (
        // Should not happen; recover gracefully.
        <Splash onDone={recast} />
      );

    default:
      return <Splash onDone={() => setStage('question')} />;
  }
}
