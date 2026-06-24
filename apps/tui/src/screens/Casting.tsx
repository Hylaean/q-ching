import React, { useEffect, useRef, useState } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { cast, type CastMethod, type QrngResult, type Reading } from '@q-ching/core';
import { c } from '../theme.js';
import { Frame, Heading } from '../components/Layout.js';
import { HexLines } from '../components/HexLines.js';

export interface CastingProps {
  method: CastMethod;
  userEntropy: Uint8Array;
  qrng: QrngResult[];
  onDone: (reading: Reading) => void;
}

const STEP_MS = 420; // delay between drawing each line
const HIGHLIGHT_MS = 260; // how long a freshly-drawn line stays gold

type Phase = 'casting' | 'drawing';

export function Casting({ method, userEntropy, qrng, onDone }: CastingProps): React.JSX.Element {
  const [phase, setPhase] = useState<Phase>('casting');
  const [reading, setReading] = useState<Reading | null>(null);
  const [visible, setVisible] = useState(0); // number of lines drawn so far (bottom-up)
  const [highlight, setHighlight] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Keep the latest onDone without making it an animation dependency, so a
  // re-render can never restart the line-drawing sequence midway.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // 1. Perform the cast.
  useEffect(() => {
    let live = true;
    void (async () => {
      const r = await cast({ method, userEntropy, qrng });
      if (!live) return;
      setReading(r);
      setPhase('drawing');
    })();
    return () => {
      live = false;
    };
  }, [method, userEntropy, qrng]);

  // 2. Animate the six lines drawing in from the bottom.
  useEffect(() => {
    if (phase !== 'drawing' || !reading) return;
    const list = timers.current;

    for (let i = 1; i <= 6; i++) {
      list.push(
        setTimeout(() => {
          setVisible(i);
          setHighlight(i);
          list.push(
            setTimeout(() => {
              setHighlight((h) => (h === i ? null : h));
            }, HIGHLIGHT_MS),
          );
        }, STEP_MS * i),
      );
    }

    list.push(
      setTimeout(() => {
        onDoneRef.current(reading);
      }, STEP_MS * 6 + 700),
    );

    return () => {
      for (const t of list) clearTimeout(t);
      timers.current = [];
    };
  }, [phase, reading]);

  if (phase === 'casting' || !reading) {
    return (
      <Frame>
        <Heading>Casting</Heading>
        <Box flexDirection="row">
          <Text color="#b34733">
            <Spinner type="dots" />
          </Text>
          <Text>{c.ink('  drawing the lines from the noise…')}</Text>
        </Box>
      </Frame>
    );
  }

  return (
    <Frame>
      <Heading>Casting</Heading>
      <Box marginLeft={1}>
        <HexLines lines={reading.lines} highlight={highlight} visibleCount={visible} />
      </Box>
      <Box marginTop={1}>
        <Text>
          {c.dim('lines fall from the ground up   ')}
          {visible === 6 ? c.gold('the hexagram stands') : c.dim(`${visible}/6`)}
        </Text>
      </Box>
    </Frame>
  );
}
