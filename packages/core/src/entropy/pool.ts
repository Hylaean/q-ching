import { concatBytes, fromHex, sha256, toBytes, toHex } from '../util.js';
import type { EntropySourceRecord } from '../types.js';

/**
 * An entropy pool that absorbs bytes from many labelled sources (a human
 * gesture, one or more quantum RNGs, a local CSPRNG) and squeezes a
 * whitened, uniform byte stream out of them.
 *
 * Design: extract-then-expand, HKDF-style.
 *   PRK        = SHA-256( source_1 || source_2 || ... )      (the "seed")
 *   output_i   = SHA-256( PRK || counter_i )                 (the expansion)
 *
 * No single source can bias the result, a dead QRNG can't block a cast, and
 * the PRK is exposed as a hex `fingerprint()` so a reading is fully
 * reproducible from its seed — the basis for shareable, auditable casts.
 */
export class EntropyPool {
  private chunks: { label: string; bytes: Uint8Array }[] = [];
  private _prk: Uint8Array | null = null;

  /** Absorb bytes from a source. Chainable. */
  absorb(label: string, data: Uint8Array | number[] | string): this {
    if (this._prk) {
      throw new Error('Cannot absorb into a pool created from a fixed seed.');
    }
    const bytes = toBytes(data);
    if (bytes.length > 0) this.chunks.push({ label, bytes });
    return this;
  }

  /** A transcript of what contributed entropy and how much. */
  get transcript(): EntropySourceRecord[] {
    if (this._prk) return [{ label: 'seed', bytes: this._prk.length }];
    return this.chunks.map((c) => ({ label: c.label, bytes: c.bytes.length }));
  }

  private async prk(): Promise<Uint8Array> {
    if (this._prk) return this._prk;
    const all = concatBytes(this.chunks.map((c) => c.bytes));
    this._prk = await sha256(all);
    return this._prk;
  }

  /** The reproducible seed: hex of the extracted pseudo-random key. */
  async fingerprint(): Promise<string> {
    return toHex(await this.prk());
  }

  /** Produce `numBytes` of uniform output, deterministic for a given PRK. */
  async squeeze(numBytes: number): Promise<Uint8Array> {
    const prk = await this.prk();
    const out = new Uint8Array(numBytes);
    let off = 0;
    let counter = 0;
    while (off < numBytes) {
      const input = new Uint8Array(prk.length + 4);
      input.set(prk, 0);
      new DataView(input.buffer).setUint32(prk.length, counter, false);
      counter += 1;
      const block = await sha256(input);
      const take = Math.min(block.length, numBytes - off);
      out.set(block.subarray(0, take), off);
      off += take;
    }
    return out;
  }

  /** Reconstruct a pool from a previously emitted seed (hex of the PRK). */
  static fromSeed(seedHex: string): EntropyPool {
    const pool = new EntropyPool();
    pool._prk = fromHex(seedHex);
    return pool;
  }
}
