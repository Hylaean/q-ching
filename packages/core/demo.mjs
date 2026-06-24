// End-to-end smoke: cast a real reading using live quantum entropy (NIST beacon,
// which works in Node since there's no CORS) mixed with simulated gesture bytes.
import { cast, gatherEntropy, GestureEntropy, HEXAGRAMS } from '@q-ching/core';

console.log(`engine loaded: ${HEXAGRAMS.length} hexagrams\n`);

// 1) gather quantum + local entropy, show what answered
const qrng = await gatherEntropy(48, { sources: ['nist', 'csprng'] });
console.log('entropy sources:');
for (const r of qrng) {
  console.log(`  ${r.ok ? '✓' : '✗'} ${r.source}${r.ok ? ` (${r.bytes.length}B)` : ` — ${r.detail ?? 'unavailable'}`}`);
}

// 2) simulate a human gesture
const g = new GestureEntropy();
for (let i = 0; i < 40; i++) g.push(Math.sin(i) * 100, Math.cos(i) * 80, i * 16.7);
console.log(`\ngesture: ${g.count} samples, ${g.bytes.length} bytes`);

// 3) cast
const reading = await cast({ method: 'coin', userEntropy: g.bytes, qrng });

const L = (l) => (l.yang ? '━━━━━━━' : '━━   ━━') + (l.changing ? '  ✳' : '');
console.log('\nlines (top → bottom):');
for (const l of [...reading.lines].reverse()) console.log('  ' + L(l));

const p = reading.primary;
console.log(`\n${p.symbol}  ${p.number}. ${p.name.chinese} (${p.name.pinyin}) — ${p.name.english}`);
console.log(`   “${p.gloss}”`);
console.log(`\n   JUDGMENT: ${p.judgment}`);
console.log(`\n   IMAGE: ${p.image}`);

if (reading.changingPositions.length) {
  console.log(`\n   changing lines: ${reading.changingPositions.join(', ')}`);
  for (const pos of reading.changingPositions) {
    console.log(`     line ${pos}: ${p.lineTexts[pos - 1]}`);
  }
  const t = reading.transformed;
  console.log(`\n   becoming → ${t.symbol}  ${t.number}. ${t.name.english} — “${t.gloss}”`);
} else {
  console.log('\n   (no changing lines — a static situation)');
}

console.log(`\n   seed: ${reading.seed}`);
console.log(`   sources folded in: ${reading.sources.map((s) => s.label).join(', ')}`);

// 4) prove reproducibility
const again = await cast({ seed: reading.seed });
console.log(`\nreproduced from seed → #${again.primary.number} ${again.primary.name.english} (matches: ${again.primary.number === reading.primary.number})`);
