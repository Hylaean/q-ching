import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cast } from './casting.js';
import { EntropyPool } from './entropy/pool.js';
import { HEXAGRAMS, hexagramByBits, hexagramByNumber, validateHexagrams } from './hexagrams.js';
import { BitReader } from './util.js';
import { coinLine, yarrowLine } from './casting.js';

test('dataset passes deterministic structural validation', () => {
  const result = validateHexagrams();
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(HEXAGRAMS.length, 64);
});

test('every hexagram has complete prose', () => {
  for (const h of HEXAGRAMS) {
    assert.ok(h.judgment.length > 10, `#${h.number} judgment`);
    assert.ok(h.image.length > 10, `#${h.number} image`);
    assert.ok(h.gloss.length > 2, `#${h.number} gloss`);
    assert.equal(h.lineTexts.length, 6, `#${h.number} lineTexts`);
    for (const lt of h.lineTexts) assert.ok(lt.length > 3, `#${h.number} line text`);
  }
});

test('hexagram 1 is Qian (all yang), 2 is Kun (all yin)', () => {
  assert.equal(hexagramByNumber(1).bits.join(''), '111111');
  assert.equal(hexagramByNumber(2).bits.join(''), '000000');
  assert.equal(hexagramByBits([1, 1, 1, 1, 1, 1]).number, 1);
  assert.equal(hexagramByBits([0, 0, 0, 0, 0, 0]).number, 2);
});

test('a seed reproduces an identical reading', async () => {
  const a = await cast({ userEntropy: [1, 2, 3, 4, 5], now: () => 1000 });
  const b = await cast({ seed: a.seed, now: () => 1000 });
  assert.equal(a.primary.number, b.primary.number);
  assert.equal(a.transformed?.number ?? null, b.transformed?.number ?? null);
  assert.deepEqual(a.lines.map((l) => l.value), b.lines.map((l) => l.value));
});

test('coin distribution ~ 1/8, 3/8, 3/8, 1/8', async () => {
  const counts: Record<number, number> = { 6: 0, 7: 0, 8: 0, 9: 0 };
  const N = 200_000;
  // deterministic uniform bytes from the pool, expanded large
  const stream = await EntropyPool.fromSeed('00'.repeat(32)).squeeze(Math.ceil((N * 3) / 8) + 64);
  const reader = new BitReader(stream);
  for (let i = 0; i < N; i++) counts[coinLine(reader)]++;
  assert.ok(Math.abs(counts[6] / N - 1 / 8) < 0.01, `6: ${counts[6] / N}`);
  assert.ok(Math.abs(counts[7] / N - 3 / 8) < 0.01, `7: ${counts[7] / N}`);
  assert.ok(Math.abs(counts[8] / N - 3 / 8) < 0.01, `8: ${counts[8] / N}`);
  assert.ok(Math.abs(counts[9] / N - 1 / 8) < 0.01, `9: ${counts[9] / N}`);
});

test('yarrow distribution ~ 1/16, 5/16, 7/16, 3/16', async () => {
  const counts: Record<number, number> = { 6: 0, 7: 0, 8: 0, 9: 0 };
  const N = 200_000;
  const stream = await EntropyPool.fromSeed('a5'.repeat(32)).squeeze(Math.ceil((N * 4) / 8) + 64);
  const reader = new BitReader(stream);
  for (let i = 0; i < N; i++) counts[yarrowLine(reader)]++;
  assert.ok(Math.abs(counts[6] / N - 1 / 16) < 0.01, `6: ${counts[6] / N}`);
  assert.ok(Math.abs(counts[7] / N - 5 / 16) < 0.01, `7: ${counts[7] / N}`);
  assert.ok(Math.abs(counts[8] / N - 7 / 16) < 0.01, `8: ${counts[8] / N}`);
  assert.ok(Math.abs(counts[9] / N - 3 / 16) < 0.01, `9: ${counts[9] / N}`);
});

test('changing lines produce a distinct transformed hexagram', async () => {
  // search seeds for a cast with changing lines
  let found = false;
  for (let i = 0; i < 50 && !found; i++) {
    const r = await cast({ userEntropy: [i], now: () => i });
    if (r.changingPositions.length > 0) {
      assert.ok(r.transformed, 'should have transformed hexagram');
      assert.notEqual(r.transformed!.number, r.primary.number);
      found = true;
    }
  }
  assert.ok(found, 'expected at least one changing-line cast in 50 tries');
});
