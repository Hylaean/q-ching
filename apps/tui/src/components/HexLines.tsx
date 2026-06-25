import React from 'react';
import { Box, Text } from 'ink';
import type { Line } from '@hylaean/core';
import { c } from '../theme.js';

const BAR = 11; // total bar width in cells
const GAP = 3; // gap in the middle of a yin (broken) line

/** A solid yang bar: "███████████". */
function yangBar(): string {
  return '█'.repeat(BAR);
}

/** A broken yin bar: "████   ████". */
function yinBar(): string {
  const side = Math.floor((BAR - GAP) / 2);
  const extra = BAR - GAP - side * 2;
  return '█'.repeat(side + extra) + ' '.repeat(GAP) + '█'.repeat(side);
}

export interface HexLineRowProps {
  line: Line;
  /** Briefly highlight the most-recently-drawn line during the cast animation. */
  highlighted?: boolean;
  /** Show the changing mark / dim styling. Defaults to true. */
  annotate?: boolean;
}

/** A single line of a hexagram, rendered as a block bar with an optional mark. */
export function HexLineRow({ line, highlighted = false, annotate = true }: HexLineRowProps): React.JSX.Element {
  const bar = line.yang ? yangBar() : yinBar();

  let body: string;
  if (line.changing && annotate) {
    body = c.cinnabarBold(bar);
  } else if (highlighted) {
    body = c.gold(bar);
  } else {
    body = c.ink(bar);
  }

  const mark = line.changing && annotate ? c.cinnabarBold(' ✳') : '  ';

  return (
    <Text>
      {body}
      {mark}
    </Text>
  );
}

export interface HexLinesProps {
  lines: Line[];
  /** position (1..6) to highlight, or null. */
  highlight?: number | null;
  /** how many lines (from the bottom) to actually show; for draw-in animation. */
  visibleCount?: number;
  annotate?: boolean;
}

/**
 * A stack of hexagram lines, drawn top -> bottom on screen (line 6 at the top),
 * which is how a hexagram is conventionally displayed. The data is bottom ->
 * top, so we reverse for rendering.
 */
export function HexLines({
  lines,
  highlight = null,
  visibleCount = 6,
  annotate = true,
}: HexLinesProps): React.JSX.Element {
  // Render from top line (position 6) down to bottom (position 1).
  const rows = [...lines].sort((a, b) => b.position - a.position);

  return (
    <Box flexDirection="column">
      {rows.map((line) => {
        const drawn = line.position <= visibleCount;
        if (!drawn) {
          // Reserve the row so the stack doesn't jump as lines appear.
          return (
            <Text key={line.position} color="gray">
              {' '.repeat(11)}
            </Text>
          );
        }
        return (
          <HexLineRow
            key={line.position}
            line={line}
            highlighted={highlight === line.position}
            annotate={annotate}
          />
        );
      })}
    </Box>
  );
}
