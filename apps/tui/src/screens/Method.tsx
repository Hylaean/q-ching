import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { CastMethod } from '@q-ching/core';
import { c } from '../theme.js';
import { Frame, Heading, Hints } from '../components/Layout.js';

interface Option {
  key: CastMethod;
  label: string;
  desc: string;
}

const OPTIONS: Option[] = [
  {
    key: 'coin',
    label: 'Three Coins',
    desc: 'quick and even — changing lines arise often (1/4 of throws)',
  },
  {
    key: 'yarrow',
    label: 'Yarrow Stalks',
    desc: 'the old slow ritual — changing lines are rarer and weightier',
  },
];

export interface MethodProps {
  onSelect: (method: CastMethod) => void;
}

export function Method({ onSelect }: MethodProps): React.JSX.Element {
  const [index, setIndex] = useState(0);

  useInput((input, key) => {
    if (key.upArrow || input === 'k') {
      setIndex((i) => (i + OPTIONS.length - 1) % OPTIONS.length);
    } else if (key.downArrow || input === 'j') {
      setIndex((i) => (i + 1) % OPTIONS.length);
    } else if (input === '1') {
      setIndex(0);
    } else if (input === '2') {
      setIndex(1);
    } else if (key.return) {
      const opt = OPTIONS[index];
      if (opt) onSelect(opt.key);
    }
  });

  return (
    <Frame>
      <Heading>Choose a method</Heading>
      <Box flexDirection="column">
        {OPTIONS.map((opt, i) => {
          const selected = i === index;
          const cursor = selected ? c.cinnabarBold('❯ ') : '  ';
          const title = selected ? c.goldBold(`${i + 1}. ${opt.label}`) : c.ink(`${i + 1}. ${opt.label}`);
          return (
            <Box key={opt.key} flexDirection="column" marginBottom={1}>
              <Text>
                {cursor}
                {title}
              </Text>
              <Text>
                {'   '}
                {selected ? c.ink(opt.desc) : c.dim(opt.desc)}
              </Text>
            </Box>
          );
        })}
      </Box>
      <Box marginTop={1}>
        <Hints hints={[['↑↓', 'move'], ['1/2', 'pick'], ['enter', 'cast'], ['q', 'quit']]} />
      </Box>
    </Frame>
  );
}
