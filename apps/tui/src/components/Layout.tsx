import React from 'react';
import { Box, Text } from 'ink';
import { c } from '../theme.js';
import { termWidth, wrap } from '../util.js';

/** Outer frame: consistent padding and a max width for readability. */
export function Frame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      {children}
    </Box>
  );
}

/** A small gold-on-dim section heading. */
export function Heading({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <Box marginBottom={1}>
      <Text>{c.goldBold(String(children))}</Text>
    </Box>
  );
}

/** A faint horizontal divider sized to the content width. */
export function Divider({ width }: { width?: number }): React.JSX.Element {
  const w = Math.min(width ?? termWidth() - 4, 60);
  return <Text>{c.dim('─'.repeat(Math.max(8, w)))}</Text>;
}

/**
 * Word-wrapped prose. We wrap manually (rather than relying on Ink's wrap) so
 * we can guarantee a margin and control the measured width precisely.
 */
export function Prose({
  text,
  width,
  color = 'ink',
}: {
  text: string;
  width?: number;
  color?: 'ink' | 'paper' | 'dim';
}): React.JSX.Element {
  const w = width ?? Math.min(termWidth() - 4, 72);
  const lines = wrap(text, w);
  const paint = color === 'paper' ? c.paper : color === 'dim' ? c.dim : c.ink;
  return (
    <Box flexDirection="column">
      {lines.map((line, i) => (
        <Text key={i}>{paint(line)}</Text>
      ))}
    </Box>
  );
}

/** A labelled key-hint footer, e.g. "r recast · q quit". */
export function Hints({ hints }: { hints: Array<[string, string]> }): React.JSX.Element {
  return (
    <Text>
      {hints.map(([key, label], i) => (
        <React.Fragment key={key}>
          {i > 0 ? c.dim('  ·  ') : ''}
          {c.gold(key)}
          {c.dim(' ' + label)}
        </React.Fragment>
      ))}
    </Text>
  );
}
