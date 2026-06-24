import type { Bit, Hexagram, HexBits, RawHexagram } from './types.js';
import { HEXAGRAM_DATA } from './hexagram-data.js';

/**
 * Unicode hexagram glyphs occupy the contiguous block U+4DC0..U+4DFF, ordered
 * by the King Wen sequence (hexagram 1 = U+4DC0). So the glyph is derivable
 * directly from the King Wen number — no need to store it.
 */
function glyphFor(kingWenNumber: number): string {
  return String.fromCodePoint(0x4dc0 + (kingWenNumber - 1));
}

function bitsKey(bits: readonly Bit[]): string {
  return bits.join('');
}

/** The 64 hexagrams, ordered by King Wen number, with derived glyphs. */
export const HEXAGRAMS: Hexagram[] = HEXAGRAM_DATA
  .slice()
  .sort((a, b) => a.number - b.number)
  .map((raw: RawHexagram) => ({ ...raw, symbol: glyphFor(raw.number) }));

const BY_NUMBER = new Map<number, Hexagram>(HEXAGRAMS.map((h) => [h.number, h]));
const BY_BITS = new Map<string, Hexagram>(HEXAGRAMS.map((h) => [bitsKey(h.bits), h]));

export function hexagramByNumber(n: number): Hexagram {
  const h = BY_NUMBER.get(n);
  if (!h) throw new Error(`No hexagram with King Wen number ${n}`);
  return h;
}

/** Look up the hexagram for six bits (bottom -> top, 1=yang 0=yin). */
export function hexagramByBits(bits: readonly Bit[] | HexBits): Hexagram {
  const h = BY_BITS.get(bitsKey(bits as readonly Bit[]));
  if (!h) throw new Error(`No hexagram for bits ${bitsKey(bits as readonly Bit[])}`);
  return h;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

/**
 * Deterministic structural validation of the dataset. The 64 hexagrams must be
 * exactly the 64 possible 6-bit patterns (a permutation of 0..63), trigram
 * composition must match the stored upper/lower keys, and King Wen pairs
 * (1-2, 3-4, ...) must be vertical inversions of one another or, for the eight
 * symmetric hexagrams, bit-complements. These checks catch a wrong table
 * without trusting any prose.
 */
export function validateHexagrams(list: RawHexagram[] = HEXAGRAM_DATA): ValidationResult {
  const errors: string[] = [];

  if (list.length !== 64) errors.push(`expected 64 hexagrams, got ${list.length}`);

  const numbers = new Set(list.map((h) => h.number));
  for (let n = 1; n <= 64; n++) {
    if (!numbers.has(n)) errors.push(`missing King Wen number ${n}`);
  }

  const patterns = new Set<string>();
  for (const h of list) {
    const key = bitsKey(h.bits);
    if (h.bits.length !== 6) errors.push(`#${h.number} has ${h.bits.length} bits`);
    if (patterns.has(key)) errors.push(`duplicate bit pattern ${key} (#${h.number})`);
    patterns.add(key);
    const lower = bitsKey(h.bits.slice(0, 3));
    const upper = bitsKey(h.bits.slice(3, 6));
    if (TRI[h.lower] !== lower) errors.push(`#${h.number} lower trigram mismatch (${h.lower} vs ${lower})`);
    if (TRI[h.upper] !== upper) errors.push(`#${h.number} upper trigram mismatch (${h.upper} vs ${upper})`);
    for (let i = 0; i < 6; i++) {
      if (h.bits[i] !== 0 && h.bits[i] !== 1) errors.push(`#${h.number} bit ${i} not 0/1`);
    }
  }
  if (patterns.size !== 64) errors.push(`expected 64 unique patterns, got ${patterns.size}`);

  // King Wen pairing rule
  const byNum = new Map(list.map((h) => [h.number, h]));
  for (let k = 1; k <= 63; k += 2) {
    const a = byNum.get(k);
    const b = byNum.get(k + 1);
    if (!a || !b) continue;
    const inverted = a.bits.slice().reverse().join('') === bitsKey(b.bits);
    const complemented = a.bits.map((x) => (x ^ 1) as Bit).join('') === bitsKey(b.bits);
    if (!inverted && !complemented) {
      errors.push(`King Wen pair #${k}/#${k + 1} is neither inverse nor complement`);
    }
  }

  return { ok: errors.length === 0, errors };
}

const TRI: Record<string, string> = {
  qian: '111', dui: '110', li: '101', zhen: '100',
  xun: '011', kan: '010', gen: '001', kun: '000',
};
