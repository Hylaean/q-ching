import React, { useEffect, useRef, useState } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { gatherEntropy, type QrngResult, type QrngSourceName } from '@q-ching/core';
import { c } from '../theme.js';
import { Frame, Heading } from '../components/Layout.js';

const SOURCES: QrngSourceName[] = ['nist', 'csprng'];

const LABELS: Record<QrngSourceName, string> = {
  nist: 'NIST Randomness Beacon',
  anu: 'ANU quantum vacuum',
  'random.org': 'RANDOM.ORG atmospheric noise',
  csprng: 'local CSPRNG (always)',
};

const BLURB: Record<QrngSourceName, string> = {
  nist: 'a 512-bit quantum-seeded pulse, the same for everyone this minute',
  anu: 'vacuum fluctuations measured in a Canberra lab',
  'random.org': 'radio static turned into bits',
  csprng: 'OS cryptographic randomness, folded in for certainty',
};

export interface GatheringProps {
  onDone: (results: QrngResult[]) => void;
}

type Row = { source: QrngSourceName; state: 'pending' | 'ok' | 'fail'; detail?: string };

export function Gathering({ onDone }: GatheringProps): React.JSX.Element {
  const [rows, setRows] = useState<Row[]>(
    SOURCES.map((source) => ({ source, state: 'pending' })),
  );

  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    let live = true;
    void (async () => {
      const results = await gatherEntropy(48, { sources: SOURCES });
      if (!live) return;
      // Map results back onto our display rows (csprng is always present).
      setRows((prev) =>
        prev.map((row): Row => {
          const r = results.find((x) => x.source === row.source);
          if (!r) return { ...row, state: 'fail', detail: 'no response' };
          return {
            source: row.source,
            state: r.ok ? 'ok' : 'fail',
            detail: r.detail,
          };
        }),
      );
      // Linger briefly so the user can read the result, then advance.
      setTimeout(() => {
        if (live) onDoneRef.current(results);
      }, 900);
    })();
    return () => {
      live = false;
    };
  }, []);

  return (
    <Frame>
      <Heading>Gathering entropy</Heading>
      <Box flexDirection="column">
        {rows.map((row) => {
          const label = LABELS[row.source];
          const blurb = BLURB[row.source];
          const isQuantum = row.source === 'nist' || row.source === 'anu';

          let glyph: React.ReactNode;
          if (row.state === 'pending') {
            glyph = (
              <Text color={isQuantum ? '#7c9fd6' : '#8a8268'}>
                <Spinner type="dots" />
              </Text>
            );
          } else if (row.state === 'ok') {
            glyph = <Text>{c.jade('✓')}</Text>;
          } else {
            glyph = <Text>{c.dim('✗')}</Text>;
          }

          const name =
            row.state === 'ok' && isQuantum
              ? c.beacon(label)
              : row.state === 'ok'
                ? c.paper(label)
                : c.dim(label);

          return (
            <Box key={row.source} flexDirection="column" marginBottom={1}>
              <Box flexDirection="row">
                <Box width={3}>{glyph}</Box>
                <Text>{name}</Text>
                {row.state === 'fail' && row.detail ? (
                  <Text>{c.dim(`  — ${shorten(row.detail)}`)}</Text>
                ) : null}
              </Box>
              <Text>
                {'   '}
                {c.dim(blurb)}
              </Text>
            </Box>
          );
        })}
      </Box>
      <Box marginTop={1}>
        <Text>{c.dim('the local CSPRNG can never fail, so your cast is never blocked')}</Text>
      </Box>
    </Frame>
  );
}

function shorten(detail: string): string {
  const d = detail.replace(/^Error:\s*/, '').trim();
  return d.length > 48 ? d.slice(0, 45) + '…' : d;
}
