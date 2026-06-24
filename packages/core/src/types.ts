/**
 * Core domain types for the q-ching engine.
 *
 * Bit convention: a hexagram's six lines are stored bottom -> top, where
 * 1 = yang (solid ⚊) and 0 = yin (broken ⚋). The lower trigram occupies
 * bits[0..2], the upper trigram bits[3..5]. This matches the way an I-Ching
 * reading is built and drawn: from the ground line upward.
 */

export type Bit = 0 | 1;
export type HexBits = [Bit, Bit, Bit, Bit, Bit, Bit];
export type TriBits = [Bit, Bit, Bit];

/** The eight trigrams (bagua), keyed by pinyin. */
export type TrigramKey =
  | 'qian' // ☰ Heaven
  | 'dui'  // ☱ Lake
  | 'li'   // ☲ Fire
  | 'zhen' // ☳ Thunder
  | 'xun'  // ☴ Wind
  | 'kan'  // ☵ Water
  | 'gen'  // ☶ Mountain
  | 'kun'; // ☷ Earth

export interface Trigram {
  key: TrigramKey;
  /** bottom -> top */
  bits: TriBits;
  symbol: string;
  name: { chinese: string; pinyin: string; english: string };
  attribute: string;
  image: string;
  family: string;
}

export interface HexagramName {
  chinese: string;
  pinyin: string;
  english: string;
}

/** Raw authored data for a single hexagram (the shape stored on disk). */
export interface RawHexagram {
  number: number; // 1..64 (King Wen sequence)
  name: HexagramName;
  /** bottom -> top, 1=yang 0=yin */
  bits: HexBits;
  upper: TrigramKey;
  lower: TrigramKey;
  /** The Judgment (tuan) — the oracle's verdict on the hexagram as a whole. */
  judgment: string;
  /** The Image (xiang) — the contemplative counsel drawn from the trigrams. */
  image: string;
  /** A short modern gloss for at-a-glance meaning. */
  gloss: string;
  /** Texts for the six changing lines, bottom -> top. */
  lineTexts: [string, string, string, string, string, string];
}

/** A fully-resolved hexagram (raw data + derived trigrams + symbol). */
export interface Hexagram extends RawHexagram {
  symbol: string; // the unicode hexagram glyph, e.g. ䷀
}

export type LineValue = 6 | 7 | 8 | 9;
// 6 = old yin (changing -> yang), 7 = young yang, 8 = young yin, 9 = old yang (changing -> yin)

export interface Line {
  /** 1..6, bottom -> top */
  position: number;
  value: LineValue;
  yang: boolean;
  changing: boolean;
}

export type CastMethod = 'coin' | 'yarrow';

export interface EntropySourceRecord {
  label: string;
  bytes: number;
}

export interface Reading {
  method: CastMethod;
  /** six lines, bottom -> top */
  lines: Line[];
  primary: Hexagram;
  /** the hexagram the changing lines transform into, or null if static */
  transformed: Hexagram | null;
  /** positions (1..6) of the changing lines */
  changingPositions: number[];
  /** hex fingerprint of the entropy that produced this cast (reproducible seed) */
  seed: string;
  /** transcript of which sources contributed entropy */
  sources: EntropySourceRecord[];
  /** ISO timestamp */
  createdAt: string;
}
