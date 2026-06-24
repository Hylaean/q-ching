/**
 * A platform-agnostic accumulator for human "gesture" entropy: pointer moves,
 * touch paths, device-motion samples, keystroke timings — anything the
 * querent's body does while they hold their question in mind.
 *
 * It does not try to estimate entropy precisely; it simply captures the raw
 * float bytes of each sample. The EntropyPool hashes everything afterward, so
 * over-capture is harmless and a few genuinely unpredictable bits (the timing
 * jitter of a human hand) are what matter.
 */
export class GestureEntropy {
  private buf: number[] = [];
  private _count = 0;

  /** Number of samples captured. */
  get count(): number {
    return this._count;
  }

  private pushFloat(v: number): void {
    if (!Number.isFinite(v)) v = 0;
    const dv = new DataView(new ArrayBuffer(4));
    dv.setFloat32(0, v, true);
    this.buf.push(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3));
  }

  /** Record a pointer/touch sample at (x, y) with a high-resolution timestamp. */
  push(x: number, y: number, t: number): this {
    this.pushFloat(x);
    this.pushFloat(y);
    this.pushFloat(t);
    this._count += 1;
    return this;
  }

  /** Record a single scalar (e.g. an accelerometer axis or a key interval). */
  pushScalar(v: number): this {
    this.pushFloat(v);
    this._count += 1;
    return this;
  }

  /** The captured bytes. */
  get bytes(): Uint8Array {
    return Uint8Array.from(this.buf);
  }

  /** A coarse 0..1 sense of "how much" the querent has stirred — for UI meters. */
  get fill(): number {
    return Math.min(1, this._count / 96);
  }

  reset(): void {
    this.buf = [];
    this._count = 0;
  }
}
