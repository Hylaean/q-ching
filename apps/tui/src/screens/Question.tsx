import React, { useRef, useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import type { GestureEntropy } from '@q-ching/core';
import { c } from '../theme.js';
import { Frame, Heading, Hints, Prose } from '../components/Layout.js';

export interface QuestionProps {
  /** Shared gesture-entropy accumulator; we feed keystroke intervals into it. */
  gesture: GestureEntropy;
  onSubmit: (question: string) => void;
}

/** A coarse 0..1 meter of how much keystroke entropy has been stirred. */
function Meter({ fill }: { fill: number }): React.JSX.Element {
  const width = 24;
  const filled = Math.round(fill * width);
  const bar = '▰'.repeat(filled) + '▱'.repeat(width - filled);
  return (
    <Text>
      {c.dim('entropy  ')}
      {c.cinnabar(bar.slice(0, filled))}
      {c.dim(bar.slice(filled))}
    </Text>
  );
}

export function Question({ gesture, onSubmit }: QuestionProps): React.JSX.Element {
  const [value, setValue] = useState('');
  const [fill, setFill] = useState(0);
  const lastT = useRef<bigint | null>(null);

  // Each change in the input is (essentially) a keypress. Capture the
  // inter-key interval in nanoseconds as a scalar of gesture entropy — the
  // jitter of a human hand thinking through a question.
  const handleChange = (next: string): void => {
    const now = process.hrtime.bigint();
    if (lastT.current !== null) {
      const interval = Number(now - lastT.current); // ns since last keystroke
      gesture.pushScalar(interval);
    } else {
      gesture.pushScalar(Number(now % 1000000n));
    }
    lastT.current = now;
    setFill(gesture.fill);
    setValue(next);
  };

  const handleSubmit = (): void => {
    onSubmit(value.trim());
  };

  return (
    <Frame>
      <Heading>Hold your question in mind</Heading>
      <Prose
        text="Ask the oracle plainly. As you type, the timing of your keystrokes is folded into the cast — the hesitation of a real hand is real randomness."
        color="ink"
      />
      <Box marginTop={1} flexDirection="row">
        <Text>{c.cinnabar('› ')}</Text>
        <TextInput
          value={value}
          onChange={handleChange}
          onSubmit={handleSubmit}
          placeholder="what should I attend to?"
        />
      </Box>
      <Box marginTop={1}>
        <Meter fill={fill} />
      </Box>
      <Box marginTop={2}>
        <Hints hints={[['enter', 'continue'], ['q', 'quit']]} />
      </Box>
      <Box marginTop={1}>
        <Text>{c.dim('(you may leave the question blank — the casting needs no words)')}</Text>
      </Box>
    </Frame>
  );
}
