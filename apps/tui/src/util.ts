/** Small presentation helpers shared across screens. */

/** The usable terminal width, clamped to sane bounds. */
export function termWidth(): number {
  return Math.max(40, process.stdout.columns || 80);
}

/** True when the terminal is narrow enough that we should compact the layout. */
export function isNarrow(): boolean {
  return termWidth() < 64;
}

/**
 * Word-wrap a paragraph to `width` columns. Collapses internal whitespace and
 * preserves no markup. Returns an array of lines. Words longer than `width`
 * are placed on their own line rather than hard-split, which reads better for
 * prose (and the I-Ching has no monstrously long words).
 */
export function wrap(text: string, width: number): string[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ');
  if (words.length === 0 || (words.length === 1 && words[0] === '')) return [''];

  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (current === '') {
      current = word;
    } else if ((current + ' ' + word).length <= width) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current !== '') lines.push(current);
  return lines;
}

/** Wrap then re-join with newlines — convenient for a single <Text>. */
export function wrapText(text: string, width: number): string {
  return wrap(text, width).join('\n');
}

/** A promise that resolves after `ms` milliseconds. */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Ordinal label for a line position (1..6, bottom -> top). */
export function ordinal(n: number): string {
  switch (n) {
    case 1:
      return 'first';
    case 2:
      return 'second';
    case 3:
      return 'third';
    case 4:
      return 'fourth';
    case 5:
      return 'fifth';
    case 6:
      return 'sixth';
    default:
      return `${n}th`;
  }
}
