/**
 * @q-ching/core — a platform-agnostic I-Ching engine.
 *
 * Runs identically in the browser, in Node, and in a terminal: it relies only
 * on Web Crypto and fetch, both standard in modern browsers and Node >=20.
 */

export * from './types.js';
export { TRIGRAMS, TRIGRAM_LIST, trigramByBits } from './trigrams.js';
export {
  HEXAGRAMS,
  hexagramByNumber,
  hexagramByBits,
  validateHexagrams,
  type ValidationResult,
} from './hexagrams.js';

export { EntropyPool } from './entropy/pool.js';
export { GestureEntropy } from './entropy/gesture.js';
export {
  gatherEntropy,
  localCsprng,
  fetchNistBeacon,
  fetchAnu,
  fetchRandomOrg,
  type QrngSourceName,
  type QrngResult,
  type QrngConfig,
} from './entropy/qrng.js';

export {
  cast,
  coinLine,
  yarrowLine,
  isValidSeed,
  normalizeSeed,
  SEED_LENGTH,
  type CastInput,
} from './casting.js';

export { toHex, fromHex } from './util.js';
