import type { Bit, CastMethod, HexBits, Line, LineValue, Reading } from './types.js';
import { BitReader } from './util.js';
import { EntropyPool } from './entropy/pool.js';
import { gatherEntropy, localCsprng, type QrngConfig, type QrngResult } from './entropy/qrng.js';
import { hexagramByBits } from './hexagrams.js';

/**
 * Coin method (three coins). Each coin: heads = 3, tails = 2. Three fair bits
 * decide the line. With h = number of heads, value = 6 + h, giving
 *   6 (old yin)   1/8
 *   7 (young yang) 3/8
 *   8 (young yin)  3/8
 *   9 (old yang)  1/8
 */
function coinLine(reader: BitReader): LineValue {
  const h = reader.readBit() + reader.readBit() + reader.readBit();
  return (6 + h) as LineValue;
}

/**
 * Yarrow-stalk method. The traditional stalk ritual yields an asymmetric
 * distribution that makes changing lines rarer:
 *   6 (old yin)    1/16
 *   7 (young yang) 5/16
 *   8 (young yin)  7/16
 *   9 (old yang)   3/16
 * Drawn from four uniform bits (0..15), since 16 is a power of two.
 */
function yarrowLine(reader: BitReader): LineValue {
  const v = reader.readBits(4); // 0..15, uniform
  if (v === 0) return 6;        // 1/16
  if (v <= 3) return 9;         // 3/16  (1,2,3)
  if (v <= 8) return 7;         // 5/16  (4,5,6,7,8)
  return 8;                      // 7/16  (9..15)
}

export interface CastInput {
  /** 'coin' (default) or 'yarrow'. */
  method?: CastMethod;
  /** Bytes captured from a human gesture (mouse, touch, motion, keystrokes). */
  userEntropy?: Uint8Array | number[];
  /**
   * Quantum entropy: pass `true` to auto-gather, a QrngConfig to configure the
   * gather, or a pre-fetched QrngResult[] (e.g. fetched server-side).
   */
  qrng?: boolean | QrngConfig | QrngResult[];
  /** Reproduce a prior cast from its seed (hex fingerprint). */
  seed?: string;
  /** Override the clock (mainly for tests/determinism). */
  now?: () => number;
}

const BYTES_TO_GATHER = 48;
const STREAM_BYTES = 64; // 6 lines need at most 24 bits; 64 bytes is generous headroom

/**
 * Cast a reading. Builds an entropy pool from the querent's gesture, optional
 * quantum sources, and the local CSPRNG; squeezes a whitened stream; and draws
 * six lines bottom -> top, deriving the primary hexagram, the changing lines,
 * and the transformed hexagram.
 */
export async function cast(input: CastInput = {}): Promise<Reading> {
  const method: CastMethod = input.method ?? 'coin';
  const now = input.now ?? (() => Date.now());

  let pool: EntropyPool;
  if (input.seed) {
    pool = EntropyPool.fromSeed(input.seed);
  } else {
    pool = new EntropyPool();
    if (input.userEntropy && input.userEntropy.length) {
      pool.absorb('gesture', input.userEntropy);
    }
    if (input.qrng) {
      let results: QrngResult[];
      if (Array.isArray(input.qrng)) {
        results = input.qrng;
      } else {
        const config = input.qrng === true ? {} : input.qrng;
        results = await gatherEntropy(BYTES_TO_GATHER, config);
      }
      for (const r of results) {
        if (r.ok && r.bytes && r.bytes.length) pool.absorb(`qrng:${r.source}`, r.bytes);
      }
    }
    // Always fold in a fresh local CSPRNG draw and a timestamp salt.
    pool.absorb('csprng', localCsprng(32));
    pool.absorb('time', String(now()));
  }

  const stream = await pool.squeeze(STREAM_BYTES);
  const reader = new BitReader(stream);

  const lines: Line[] = [];
  for (let i = 0; i < 6; i++) {
    const value = method === 'coin' ? coinLine(reader) : yarrowLine(reader);
    lines.push({
      position: i + 1,
      value,
      yang: value === 7 || value === 9,
      changing: value === 6 || value === 9,
    });
  }

  const primaryBits = lines.map((l) => (l.yang ? 1 : 0)) as Bit[] as HexBits;
  const primary = hexagramByBits(primaryBits);

  const changingPositions = lines.filter((l) => l.changing).map((l) => l.position);

  let transformed = null as Reading['transformed'];
  if (changingPositions.length > 0) {
    const tBits = lines.map((l) => {
      if (l.changing) return (l.yang ? 0 : 1) as Bit; // old yang -> yin, old yin -> yang
      return (l.yang ? 1 : 0) as Bit;
    }) as Bit[] as HexBits;
    transformed = hexagramByBits(tBits);
  }

  return {
    method,
    lines,
    primary,
    transformed,
    changingPositions,
    seed: await pool.fingerprint(),
    sources: pool.transcript,
    createdAt: new Date(now()).toISOString(),
  };
}

export { coinLine, yarrowLine };
