/** Small dependency-free helpers shared across the engine. */

export function toBytes(data: Uint8Array | number[] | string): Uint8Array {
  if (data instanceof Uint8Array) return data;
  if (typeof data === 'string') return new TextEncoder().encode(data);
  return Uint8Array.from(data);
}

export function concatBytes(parts: Uint8Array[]): Uint8Array {
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

export function toHex(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += b.toString(16).padStart(2, '0');
  return s;
}

export function fromHex(hex: string): Uint8Array {
  const clean = hex.trim().replace(/^0x/i, '');
  if (clean.length % 2 !== 0) throw new Error('hex string must have even length');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/** Resolve the platform crypto object (Web Crypto), present in browsers and Node >=20. */
export function getCrypto(): Crypto {
  const c = (globalThis as unknown as { crypto?: Crypto }).crypto;
  if (!c || !c.subtle) {
    throw new Error('Web Crypto (crypto.subtle) is not available in this environment.');
  }
  return c;
}

export async function sha256(data: Uint8Array): Promise<Uint8Array> {
  // copy into a fresh ArrayBuffer-backed view so digest accepts it everywhere
  const buf = data.byteOffset === 0 && data.byteLength === data.buffer.byteLength
    ? data.buffer
    : data.slice().buffer;
  const digest = await getCrypto().subtle.digest('SHA-256', buf);
  return new Uint8Array(digest);
}

/** Reads bits MSB-first from a byte stream; used to draw line values. */
export class BitReader {
  private bytes: Uint8Array;
  private bitPos = 0;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
  }

  get remaining(): number {
    return this.bytes.length * 8 - this.bitPos;
  }

  readBit(): number {
    const byteIndex = this.bitPos >> 3;
    if (byteIndex >= this.bytes.length) {
      throw new Error('BitReader exhausted');
    }
    const bitIndex = 7 - (this.bitPos & 7);
    this.bitPos += 1;
    return (this.bytes[byteIndex] >> bitIndex) & 1;
  }

  readBits(n: number): number {
    let v = 0;
    for (let i = 0; i < n; i++) v = (v << 1) | this.readBit();
    return v;
  }
}
