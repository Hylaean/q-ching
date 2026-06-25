import React from 'react';
import { Box, Text } from 'ink';
import type { Hexagram, Reading as ReadingType } from '@hylaean/core';
import { c } from '../theme.js';
import { Divider, Frame, Hints, Prose } from '../components/Layout.js';
import { HexLines } from '../components/HexLines.js';
import { isNarrow, ordinal, termWidth } from '../util.js';

export interface ReadingProps {
  reading: ReadingType;
  question: string;
}

/** The hexagram name block: Chinese · pinyin · English · gloss. */
function NameBlock({ hex }: { hex: Hexagram }): React.JSX.Element {
  return (
    <Box flexDirection="column">
      <Text>
        {c.goldBold(`${hex.number}. ${hex.name.chinese}`)}
        {c.dim('  ')}
        {c.ink(hex.name.pinyin)}
      </Text>
      <Text>{c.paper(hex.name.english)}</Text>
      <Text>{c.cinnabar(hex.gloss)}</Text>
    </Box>
  );
}

/** The glyph + lines header for a hexagram. */
function HexHeader({ hex, lines }: { hex: Hexagram; lines: ReadingType['lines'] }): React.JSX.Element {
  const narrow = isNarrow();
  if (narrow) {
    return (
      <Box flexDirection="column">
        <Text>{c.gold(hex.symbol)}</Text>
        <Box marginTop={1}>
          <HexLines lines={lines} />
        </Box>
        <Box marginTop={1}>
          <NameBlock hex={hex} />
        </Box>
      </Box>
    );
  }
  return (
    <Box flexDirection="row">
      <Box flexDirection="column" marginRight={3} alignItems="center">
        <Text>{c.gold(hex.symbol)}</Text>
      </Box>
      <Box flexDirection="column" marginRight={4}>
        <HexLines lines={lines} />
      </Box>
      <Box flexDirection="column" justifyContent="center">
        <NameBlock hex={hex} />
      </Box>
    </Box>
  );
}

export function Reading({ reading, question }: ReadingProps): React.JSX.Element {
  const { primary, transformed, changingPositions } = reading;
  const proseWidth = Math.min(termWidth() - 4, 72);

  return (
    <Frame>
      {question ? (
        <Box marginBottom={1}>
          <Text>
            {c.dim('your question · ')}
            {c.ink(question)}
          </Text>
        </Box>
      ) : null}

      <HexHeader hex={primary} lines={reading.lines} />

      <Box marginTop={1} flexDirection="column">
        <Text>{c.gold('The Judgment')}</Text>
        <Prose text={primary.judgment} width={proseWidth} color="paper" />
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text>{c.gold('The Image')}</Text>
        <Prose text={primary.image} width={proseWidth} color="ink" />
      </Box>

      {changingPositions.length > 0 ? (
        <Box marginTop={1} flexDirection="column">
          <Text>{c.cinnabarBold('Changing Lines')}</Text>
          {changingPositions.map((pos) => {
            const text = primary.lineTexts[pos - 1] ?? '';
            return (
              <Box key={pos} flexDirection="column" marginTop={1}>
                <Text>
                  {c.cinnabar('✳ ')}
                  {c.dim(`the ${ordinal(pos)} line`)}
                </Text>
                <Prose text={text} width={proseWidth - 2} color="ink" />
              </Box>
            );
          })}
        </Box>
      ) : (
        <Box marginTop={1}>
          <Text>{c.dim('No changing lines — the situation is settled; read the hexagram as it stands.')}</Text>
        </Box>
      )}

      {transformed ? (
        <Box marginTop={1} flexDirection="column">
          <Box marginBottom={1}>
            <Divider />
          </Box>
          <Text>{c.cinnabarBold('Becoming →')}</Text>
          <Box marginTop={1} flexDirection="row">
            <Box marginRight={3}>
              <Text>{c.gold(transformed.symbol)}</Text>
            </Box>
            <Box flexDirection="column">
              <Text>
                {c.goldBold(`${transformed.number}. ${transformed.name.chinese}`)}
                {c.dim('  ')}
                {c.ink(transformed.name.pinyin)}
                {c.dim('  ')}
                {c.paper(transformed.name.english)}
              </Text>
              <Text>{c.cinnabar(transformed.gloss)}</Text>
            </Box>
          </Box>
        </Box>
      ) : null}

      <Box marginTop={1} flexDirection="column">
        <Divider />
        <Box marginTop={1}>
          <Text>
            {c.dim('seed ')}
            {c.dim(reading.seed)}
          </Text>
        </Box>
        <Text>{c.dim('this seed reproduces the cast exactly — share it or keep it')}</Text>
      </Box>

      <Box marginTop={1}>
        <Hints hints={[['r', 'recast'], ['q', 'quit']]} />
      </Box>
    </Frame>
  );
}
