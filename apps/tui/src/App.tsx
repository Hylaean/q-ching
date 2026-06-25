import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import Spinner from 'ink-spinner';
import {
  GestureEntropy,
  cast,
  type CastMethod,
  type QrngResult,
  type Reading as ReadingType,
} from '@q-ching/core';
import { c } from './theme.js';
import { Frame, Heading } from './components/Layout.js';
import type { Replay } from './cli.js';
import { Splash } from './screens/Splash.js';
import { Question } from './screens/Question.js';
import { Method } from './screens/Method.js';
import { Gathering } from './screens/Gathering.js';
import { Casting } from './screens/Casting.js';
import { Reading } from './screens/Reading.js';

type Stage = 'splash' | 'replaying' | 'question' | 'method' | 'gathering' | 'casting' | 'reading';

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

export interface AppProps {
  /** When set, skip the ritual and reproduce this exact reading from its seed. */
  replay?: Replay;
}

export function App({ replay }: AppProps = {}): React.JSX.Element {
  const { exit } = useApp();
  const [stage, setStage] = useState<Stage>(replay ? 'replaying' : 'splash');
  const [state, setState] = useState<CastState>(EMPTY);

  // A fresh gesture accumulator per reading; replaced on recast.
  const gestureRef = useRef(new GestureEntropy());

  // Replay path: reproduce the cast from its seed and jump straight to the
  // reading, skipping the gather/draw animation. The CLI has already validated
  // the seed, but if the engine still rejects it we fall back to the ordinary
  // ritual rather than hang on the spinner.
  useEffect(() => {
    if (stage !== 'replaying' || !replay) return;
    let live = true;
    void (async () => {
      try {
        const reading = await cast({ seed: replay.seed, method: replay.method });
        if (!live) return;
        setState((s) => ({ ...s, method: replay.method, reading }));
        setStage('reading');
      } catch {
        if (live) setStage('splash');
      }
    })();
    return () => {
      live = false;
    };
  }, [stage, replay]);

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

    case 'replaying':
      return (
        <Frame>
          <Heading>Replaying</Heading>
          <Box flexDirection="row">
            <Text color="#b34733">
              <Spinner type="dots" />
            </Text>
            <Text>{c.ink('  reproducing the cast from its seed…')}</Text>
          </Box>
        </Frame>
      );

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
