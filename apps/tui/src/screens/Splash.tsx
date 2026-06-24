import React, { useEffect, useRef, useState } from 'react';
import { Box, Text, useInput } from 'ink';
// These two are optional dependencies; if they fail to resolve at runtime we
// gracefully fall back to a styled plain title. They are imported lazily below.
import { c, titleGradient } from '../theme.js';
import { Frame, Hints } from '../components/Layout.js';

const SUBTITLE = 'an oracle cast from quantum noise and the motion of your own hand';

/** Lazily-loaded fancy title pieces; null if the packages are unavailable. */
type Fancy = {
  Gradient: React.ComponentType<{ colors?: string[]; name?: string; children?: React.ReactNode }>;
  BigText: React.ComponentType<{ text: string; font?: string }>;
} | null;

let fancyCache: Fancy | undefined;

async function loadFancy(): Promise<Fancy> {
  if (fancyCache !== undefined) return fancyCache;
  try {
    const [{ default: Gradient }, { default: BigText }] = await Promise.all([
      import('ink-gradient'),
      import('ink-big-text'),
    ]);
    fancyCache = { Gradient, BigText } as unknown as Fancy;
  } catch {
    fancyCache = null;
  }
  return fancyCache;
}

export interface SplashProps {
  onDone: () => void;
}

export function Splash({ onDone }: SplashProps): React.JSX.Element {
  const [fancy, setFancy] = useState<Fancy>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    let live = true;
    void loadFancy().then((f) => {
      if (live) setFancy(f);
    });
    const t = setTimeout(() => onDoneRef.current(), 3200); // auto-advance
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, []);

  useInput((_input, key) => {
    if (key.return || _input === ' ') onDone();
  });

  return (
    <Frame>
      <Box flexDirection="column" alignItems="flex-start">
        {fancy ? (
          <fancy.Gradient colors={titleGradient}>
            <fancy.BigText text="q-ching" font="block" />
          </fancy.Gradient>
        ) : (
          <Text>{c.goldBold('☯  q - c h i n g')}</Text>
        )}
        <Box marginTop={fancy ? 0 : 1}>
          <Text>{c.cinnabar('䷀ ䷁ ䷂ ䷃ ䷄ ䷅')}</Text>
        </Box>
        <Box marginTop={1}>
          <Text>{c.ink(SUBTITLE)}</Text>
        </Box>
      </Box>
      <Box marginTop={2}>
        <Hints hints={[['enter', 'begin'], ['q', 'quit']]} />
      </Box>
      <Box marginTop={1}>
        <Text>{c.dim('the terminal speaks to the NIST quantum beacon directly — no CORS, real noise')}</Text>
      </Box>
    </Frame>
  );
}
