#!/usr/bin/env node
/**
 * Fallback caster for the woo-woo skill.
 *
 * Casts a reading from @hylaean/core and prints it, for when the q-ching MCP
 * server isn't connected. Run from the repo root so `@hylaean/core` resolves
 * via the workspace node_modules:
 *
 *   node .claude/skills/woo-woo/cast.mjs "should I ship this?"
 *   node .claude/skills/woo-woo/cast.mjs --yarrow "..."   # traditional method
 *   node .claude/skills/woo-woo/cast.mjs --local "..."    # skip the network gather
 *
 * Requires `npm run build:core` first (it imports the engine's dist/).
 */
import { cast } from '@hylaean/core';

const args = process.argv.slice(2);
const local = args.includes('--local');
const method = args.includes('--yarrow') ? 'yarrow' : 'coin';
const question = args.filter((a) => !a.startsWith('--')).join(' ') || undefined;

const reading = await cast({ method, qrng: local ? undefined : true });
const p = reading.primary;
const out = [];

if (question) out.push(`Question: ${question}`, '');
out.push(`${p.symbol} ${p.number}. ${p.name.chinese} (${p.name.pinyin}) — ${p.name.english}`);
out.push(`“${p.gloss}”`, '');
out.push(`Method: ${reading.method}`);
out.push(`Sources that answered: ${reading.sources.map((s) => s.label).join(', ')}`);
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
console.log(out.join('\n'));
