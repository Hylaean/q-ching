import type { Trigram, TrigramKey, TriBits } from './types.js';

/**
 * The eight trigrams (bagua). `bits` are bottom -> top, 1 = yang (solid),
 * 0 = yin (broken). These binary patterns are canonical and are used to
 * derive and validate every hexagram.
 */
export const TRIGRAMS: Record<TrigramKey, Trigram> = {
  qian: {
    key: 'qian', bits: [1, 1, 1], symbol: '☰',
    name: { chinese: '乾', pinyin: 'Qián', english: 'The Creative' },
    attribute: 'strong', image: 'heaven', family: 'father',
  },
  dui: {
    key: 'dui', bits: [1, 1, 0], symbol: '☱',
    name: { chinese: '兌', pinyin: 'Duì', english: 'The Joyous' },
    attribute: 'joyful', image: 'lake', family: 'youngest daughter',
  },
  li: {
    key: 'li', bits: [1, 0, 1], symbol: '☲',
    name: { chinese: '離', pinyin: 'Lí', english: 'The Clinging' },
    attribute: 'light-giving', image: 'fire', family: 'middle daughter',
  },
  zhen: {
    key: 'zhen', bits: [1, 0, 0], symbol: '☳',
    name: { chinese: '震', pinyin: 'Zhèn', english: 'The Arousing' },
    attribute: 'inciting movement', image: 'thunder', family: 'eldest son',
  },
  xun: {
    key: 'xun', bits: [0, 1, 1], symbol: '☴',
    name: { chinese: '巽', pinyin: 'Xùn', english: 'The Gentle' },
    attribute: 'penetrating', image: 'wind', family: 'eldest daughter',
  },
  kan: {
    key: 'kan', bits: [0, 1, 0], symbol: '☵',
    name: { chinese: '坎', pinyin: 'Kǎn', english: 'The Abysmal' },
    attribute: 'dangerous', image: 'water', family: 'middle son',
  },
  gen: {
    key: 'gen', bits: [0, 0, 1], symbol: '☶',
    name: { chinese: '艮', pinyin: 'Gèn', english: 'Keeping Still' },
    attribute: 'resting', image: 'mountain', family: 'youngest son',
  },
  kun: {
    key: 'kun', bits: [0, 0, 0], symbol: '☷',
    name: { chinese: '坤', pinyin: 'Kūn', english: 'The Receptive' },
    attribute: 'devoted, yielding', image: 'earth', family: 'mother',
  },
};

export const TRIGRAM_LIST: Trigram[] = Object.values(TRIGRAMS);

function triKey(bits: TriBits): string {
  return bits.join('');
}

const TRIGRAM_BY_BITS: Record<string, TrigramKey> = Object.fromEntries(
  TRIGRAM_LIST.map((t) => [triKey(t.bits), t.key]),
) as Record<string, TrigramKey>;

/** Look up the trigram whose pattern matches the given three bits (bottom -> top). */
export function trigramByBits(bits: TriBits): Trigram {
  const key = TRIGRAM_BY_BITS[triKey(bits)];
  if (!key) throw new Error(`No trigram for bits ${bits.join('')}`);
  return TRIGRAMS[key];
}
