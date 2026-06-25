# @q-ching/core

> Platform-agnostic I-Ching engine: entropy pool, QRNG clients, casting math, and the 64 hexagrams.

The dependency-free engine behind [q-ching](https://github.com/Hylaean/q-ching#readme). It relies only on Web Crypto (`crypto.subtle`) and global `fetch`, so the *same* engine runs in the browser, in Node, and in the terminal. It powers the [`@q-ching/tui`](https://www.npmjs.com/package/@q-ching/tui) terminal app and the [`@q-ching/mcp`](https://www.npmjs.com/package/@q-ching/mcp) server.

## Install

```bash
npm install @q-ching/core
```

## Cast a reading

```js
import { cast } from "@q-ching/core";

const reading = await cast({ question: "What should I attend to?" });
console.log(reading.primary.number, reading.primary.name.english);
console.log(reading.changingPositions);     // which lines (1..6) are changing
console.log(reading.transformed?.number);   // the hexagram it changes into, or null
console.log(reading.seed); // reproducible: cast({ seed }) reproduces it exactly
```

## What it does

A reading is cast by absorbing the querent's gesture entropy, concurrently-fetched QRNG draws (NIST beacon, ANU, RANDOM.ORG), a fresh local CSPRNG draw, and a timestamp salt into an HKDF-style `EntropyPool`, then squeezing a whitened bit stream and drawing six lines. The pool's `fingerprint()` is the shareable, auditable seed; the local CSPRNG always carries the cast, so a blocked remote source can never block or bias it.

Requires Node ≥ 20 (or any modern browser).

## License

MIT
