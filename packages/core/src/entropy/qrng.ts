import { fromHex, getCrypto } from '../util.js';

/**
 * Quantum / true random number sources.
 *
 * Honest note: a local CSPRNG is already statistically perfect for casting an
 * oracle. The quantum sources are here for *meaning* — your hexagram drawn
 * from vacuum fluctuations and an atmospheric hiss — and for transparency, not
 * because they are "more random". Every gather always folds in the local
 * CSPRNG so a cast can never be blocked or biased by a flaky remote API.
 */

export type QrngSourceName = 'nist' | 'anu' | 'random.org' | 'csprng';

export interface QrngResult {
  source: QrngSourceName;
  ok: boolean;
  bytes: Uint8Array | null;
  detail?: string;
}

export interface QrngConfig {
  /** Which sources to attempt. Default: ['nist', 'csprng']. csprng is always included. */
  sources?: QrngSourceName[];
  anuApiKey?: string;
  randomOrgApiKey?: string;
  /** Inject a fetch implementation (defaults to global fetch). */
  fetchImpl?: typeof fetch;
  /** Per-request timeout in ms (default 6000). */
  timeoutMs?: number;
}

export function localCsprng(numBytes: number): Uint8Array {
  const out = new Uint8Array(numBytes);
  getCrypto().getRandomValues(out);
  return out;
}

function getFetch(config: QrngConfig): typeof fetch {
  const f = config.fetchImpl ?? (globalThis as { fetch?: typeof fetch }).fetch;
  if (!f) throw new Error('No fetch implementation available.');
  return f;
}

async function withTimeout<T>(p: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await p(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * NIST Randomness Beacon (v2). Public, keyless, quantum-seeded. Publishes a
 * 512-bit value every 60s — the same for everyone in a given minute, which is
 * its own kind of poetry: the cosmic pulse at the moment you asked.
 */
export async function fetchNistBeacon(numBytes: number, config: QrngConfig = {}): Promise<QrngResult> {
  const fetchImpl = getFetch(config);
  try {
    const res = await withTimeout(
      (signal) =>
        fetchImpl('https://beacon.nist.gov/beacon/2.0/pulse/last', { signal }),
      config.timeoutMs ?? 6000,
    );
    if (!res.ok) return { source: 'nist', ok: false, bytes: null, detail: `HTTP ${res.status}` };
    const json = (await res.json()) as { pulse?: { outputValue?: string } };
    const hex = json?.pulse?.outputValue;
    if (!hex) return { source: 'nist', ok: false, bytes: null, detail: 'no outputValue' };
    const full = fromHex(hex);
    return { source: 'nist', ok: true, bytes: full.subarray(0, numBytes) };
  } catch (err) {
    return { source: 'nist', ok: false, bytes: null, detail: String(err) };
  }
}

/**
 * ANU Quantum Random Numbers — vacuum fluctuations. The classic public
 * endpoint is now rate-limited and may require an API key; we pass one if
 * provided and fail gracefully otherwise.
 */
export async function fetchAnu(numBytes: number, config: QrngConfig = {}): Promise<QrngResult> {
  const fetchImpl = getFetch(config);
  try {
    const url = `https://qrng.anu.edu.au/API/jsonI.php?length=${numBytes}&type=uint8`;
    const headers: Record<string, string> = {};
    if (config.anuApiKey) headers['x-api-key'] = config.anuApiKey;
    const res = await withTimeout(
      (signal) => fetchImpl(url, { headers, signal }),
      config.timeoutMs ?? 6000,
    );
    if (!res.ok) return { source: 'anu', ok: false, bytes: null, detail: `HTTP ${res.status}` };
    const json = (await res.json()) as { success?: boolean; data?: number[] };
    if (!json?.success || !Array.isArray(json.data)) {
      return { source: 'anu', ok: false, bytes: null, detail: 'unsuccessful response' };
    }
    return { source: 'anu', ok: true, bytes: Uint8Array.from(json.data.slice(0, numBytes)) };
  } catch (err) {
    return { source: 'anu', ok: false, bytes: null, detail: String(err) };
  }
}

/** RANDOM.ORG atmospheric noise (JSON-RPC v4). Requires an API key. */
export async function fetchRandomOrg(numBytes: number, config: QrngConfig = {}): Promise<QrngResult> {
  const fetchImpl = getFetch(config);
  if (!config.randomOrgApiKey) {
    return { source: 'random.org', ok: false, bytes: null, detail: 'no API key' };
  }
  try {
    const body = {
      jsonrpc: '2.0',
      method: 'generateIntegers',
      params: { apiKey: config.randomOrgApiKey, n: numBytes, min: 0, max: 255, replacement: true },
      id: 1,
    };
    const res = await withTimeout(
      (signal) =>
        fetchImpl('https://api.random.org/json-rpc/4/invoke', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
          signal,
        }),
      config.timeoutMs ?? 6000,
    );
    if (!res.ok) return { source: 'random.org', ok: false, bytes: null, detail: `HTTP ${res.status}` };
    const json = (await res.json()) as { result?: { random?: { data?: number[] } } };
    const data = json?.result?.random?.data;
    if (!Array.isArray(data)) {
      return { source: 'random.org', ok: false, bytes: null, detail: 'no data' };
    }
    return { source: 'random.org', ok: true, bytes: Uint8Array.from(data) };
  } catch (err) {
    return { source: 'random.org', ok: false, bytes: null, detail: String(err) };
  }
}

/**
 * Attempt every configured source concurrently and always include the local
 * CSPRNG. Returns one result per attempted source (failures included, so the
 * UI can show what answered the call).
 */
export async function gatherEntropy(numBytes: number, config: QrngConfig = {}): Promise<QrngResult[]> {
  const requested = config.sources ?? ['nist', 'csprng'];
  const set = new Set<QrngSourceName>(requested);
  set.add('csprng'); // guaranteed fallback, always present

  const jobs: Promise<QrngResult>[] = [];
  for (const source of set) {
    switch (source) {
      case 'nist':
        jobs.push(fetchNistBeacon(numBytes, config));
        break;
      case 'anu':
        jobs.push(fetchAnu(numBytes, config));
        break;
      case 'random.org':
        jobs.push(fetchRandomOrg(numBytes, config));
        break;
      case 'csprng':
        jobs.push(
          Promise.resolve({ source: 'csprng' as const, ok: true, bytes: localCsprng(numBytes) }),
        );
        break;
    }
  }
  return Promise.all(jobs);
}
