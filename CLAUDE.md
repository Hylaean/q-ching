# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

q-ching is an I-Ching oracle that casts readings from quantum/true randomness mixed with the querent's own gesture entropy. It's an npm-workspaces monorepo: one shared engine consumed by a web/PWA app and a terminal app.

## Commands

```bash
npm install                 # install all workspaces

npm run build               # build everything (core → web → tui, in order)
npm run build:core          # build the engine only — REQUIRED before the apps typecheck/build
npm run build:web           # tsc + vite production build
npm run dev:web             # web dev server at http://localhost:5173 (laptop + mobile on LAN)
npm run tui                 # run the terminal app (needs an interactive TTY — see below)

npm run test:core           # compile tests into dist, then run them
node packages/core/demo.mjs # end-to-end cast using LIVE quantum entropy (NIST beacon)
```

Run a single core test (tests run from compiled output, so compile first):

```bash
cd packages/core && npx tsc -p tsconfig.test.json
node --test --test-name-pattern="coin distribution" dist/*.test.js
```

### Build/run order & environment gotchas

- **Build `core` before the apps.** Both apps import `@q-ching/core` and resolve it through its `package.json` `exports` → `dist/`. If `dist/` is stale or missing, app typechecks fail or use old types.
- **Core tests run from `dist`, not `src`.** Node's type-stripping doesn't remap `.js` import specifiers to `.ts` source, and the engine uses `.js`-suffixed ESM imports throughout. `tsconfig.test.json` compiles the tests alongside the engine into `dist/` so `node --test dist/*.test.js` resolves correctly.
- **The TUI requires a real terminal** (Ink "raw mode"). It detects non-TTY stdin (pipes, CI, backgrounded) and exits with a message instead of crashing — so it cannot be smoke-tested by piping input. Use a PTY (`script`) if you must drive it headlessly.

## Architecture

### The engine is the contract

`packages/core` (`@q-ching/core`) is **dependency-free** and relies only on Web Crypto (`crypto.subtle`) and global `fetch` — both present in browsers and Node ≥20. That's why the *same* engine runs in the browser PWA, in Node, and in the terminal. Everything the apps are allowed to use is the surface re-exported from `src/index.ts`; treat that as a locked public API and update it deliberately when adding capabilities, since both apps depend on it.

### The cast pipeline (spans several core files)

A reading flows through, in order:

1. **`GestureEntropy`** (`entropy/gesture.ts`) — accumulates raw bytes from the querent's motion: mouse/touch path, device-motion axes, or keystroke timing. Platform-agnostic; the caller decides what to feed it.
2. **`gatherEntropy()`** (`entropy/qrng.ts`) — fetches from QRNG sources (NIST beacon, ANU, RANDOM.ORG) concurrently and **always folds in the local CSPRNG**, so a flaky/blocked remote source can never block or bias a cast. Returns one result per source (failures included) so the UI can show what answered.
3. **`cast()`** (`casting.ts`) — the orchestrator. Builds an **`EntropyPool`** (`entropy/pool.ts`), absorbs the gesture + qrng + a fresh CSPRNG draw + a timestamp salt, squeezes a whitened byte stream, reads bits via `BitReader` (`util.ts`), and draws six lines using the chosen probability distribution. Then it looks up the primary hexagram from the resolved bits, computes the changing lines, and derives the transformed hexagram.

### EntropyPool: reproducible seeds

`EntropyPool` is HKDF-style extract-then-expand: `PRK = SHA-256(all absorbed source bytes)`, then `output_i = SHA-256(PRK || counter)`. `fingerprint()` returns the hex PRK — this **is** the shareable/auditable seed, and `EntropyPool.fromSeed(hex)` reconstructs the pool so `cast({ seed })` reproduces a prior reading exactly. No single source can bias the result.

### Bit & line conventions (pervasive — respect them everywhere)

- Hexagram lines are stored **bottom → top**. `1 = yang` (solid), `0 = yin` (broken).
- The **lower** trigram is `bits[0..2]`, the **upper** trigram is `bits[3..5]`.
- `LineValue`: `6` old-yin (changing→yang), `7` young-yang, `8` young-yin, `9` old-yang (changing→yin).
- Casting methods have different, deliberate distributions: **coin** = ⅛·⅜·⅜·⅛, **yarrow** = 1⁄16·5⁄16·7⁄16·3⁄16 (changing lines rarer). Both are statistically asserted in the tests.

### The hexagram dataset is generated and validated

`src/hexagram-data.ts` is **auto-generated — do not hand-edit it.** `hexagrams.ts` wraps it: it derives the unicode glyph from the King Wen number (`U+4DC0 + n − 1`), builds the number/bits lookup maps, and exposes `validateHexagrams()`. That validator is a deterministic correctness gate: the 64 patterns must be a permutation of all 6-bit values, King Wen pairs (1&2, 3&4, …) must be vertical inverses or bit-complements, and stored trigram keys must match the bits. If you regenerate or modify the data, this must still pass (the test suite runs it). The interpretive prose is **original** (faithful but not a verbatim copy of any copyrighted translation, e.g. Wilhelm-Baynes).

### Why QRNG, honestly

A CSPRNG is already statistically perfect for casting; the quantum sources exist for *meaning* and transparency, not better randomness. Practical consequence: **in the browser the NIST/ANU calls are usually CORS-blocked and come back `ok:false` — this is expected degradation, not a bug.** The local CSPRNG carries the cast and the UI shows which sources answered. The TUI (Node, no CORS) reaches the NIST beacon directly. Production browser quantum entropy would need a small serverless proxy (noted, not built).

### Apps

Both apps are thin clients over the engine and share the same ritual arc (threshold → question → gather → cast → read).

- **`apps/web`** — React + Vite + Framer Motion PWA. A typed reducer in `ritual/machine.ts` drives the phases under `src/phases/`; entropy is captured from pointer/touch/device-motion and keystroke timing. Honors `prefers-reduced-motion`.
- **`apps/tui`** — Ink (React for the terminal). A stage machine in `App.tsx` drives the screens under `src/screens/`; entropy comes from keystroke timing. This is where live quantum entropy actually works.
