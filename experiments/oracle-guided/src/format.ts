import type { Reading } from '@hylaean/core';

/** Render a Reading as readable text for the LLM's tool result. */
export function formatReading(reading: Reading, question?: string): string {
  const p = reading.primary;
  const out: string[] = [];

  if (question) out.push(`Question: ${question}`, '');

  out.push(`${p.symbol} ${p.number}. ${p.name.chinese} (${p.name.pinyin}) — ${p.name.english}`);
  out.push(`“${p.gloss}”`);
  out.push('');
  out.push(`Method: ${reading.method}`);
  out.push(
    reading.changingPositions.length
      ? `Changing lines: ${reading.changingPositions.join(', ')}`
      : 'Changing lines: none (a static hexagram)',
  );
  out.push('', 'JUDGMENT', p.judgment, '', 'IMAGE', p.image);

  if (reading.changingPositions.length) {
    out.push('', 'CHANGING LINES');
    for (const pos of reading.changingPositions) {
      out.push(`  Line ${pos}: ${p.lineTexts[pos - 1]}`);
    }
  }

  if (reading.transformed) {
    const t = reading.transformed;
    out.push('', `Becoming: ${t.symbol} ${t.number}. ${t.name.chinese} (${t.name.pinyin}) — ${t.name.english}`);
  }

  out.push('', `Seed: ${reading.seed}`);
  return out.join('\n');
}
