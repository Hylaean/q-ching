# q-ching

*An I-Ching oracle cast from quantum noise and the motion of your own hand.*

A reading is, at heart, an act of randomness given meaning. q-ching takes that
literally: it draws each hexagram from a pool of **true / quantum randomness**
(the NIST quantum beacon, ANU vacuum fluctuations, RANDOM.ORG) mixed with the
**entropy of your own body** — your mouse path, your touch gesture, your phone's
motion, the rhythm of your typing — and a local cryptographic RNG that can never
fail. The same engine runs in a **browser**, on a **phone**, and in a
**terminal**.

```
䷻  60. 節 (jié) — Limitation
   “Restraint that gives life its shape”

   JUDGMENT: Limitation brings success. But limitation that is galling and
   bitter must not be made to endure; measure has its own measure…

   changing line 4 → becoming ䷹ 58. The Joyous Lake
```

---

## What's in the box

```
q-ching/
├── packages/core      @q-ching/core — the engine (no dependencies, runs everywhere)
├── apps/web           React + Vite + Framer Motion PWA  (laptop & mobile)
└── apps/tui           Ink terminal app  (where live quantum entropy shines)
```

### `@q-ching/core` — the engine
- **`EntropyPool`** — an HKDF-style pool. It *absorbs* labelled byte sources, *extracts*
  a pseudo-random key (the **seed**), and *squeezes* a whitened, uniform stream.
  No single source can bias the result, and the seed is exposed as a hex
  `fingerprint()` so any reading is **reproducible and shareable**.
- **QRNG clients** — `fetchNistBeacon` (keyless), `fetchAnu`, `fetchRandomOrg`,
  and `localCsprng`. `gatherEntropy()` tries them concurrently and *always* folds
  in the local CSPRNG, so a flaky API can never block or bias a cast.
- **`GestureEntropy`** — a platform-agnostic accumulator for mouse / touch /
  device-motion / keystroke-timing samples.
- **`cast()`** — correct **coin** (⅛·⅜·⅜·⅛) and **yarrow-stalk** (1⁄16·5⁄16·7⁄16·3⁄16)
  probability distributions, changing lines, and the transformed hexagram.
- **The 64 hexagrams** — King Wen order, with a deterministic validator (the 64
  patterns must be a permutation of all 6-bit values, with correct King Wen
  pairing) and original interpretive prose (judgment, image, gloss, six line texts).

## Quick start

```bash
npm install
npm run build:core      # build the engine once

# Web / PWA (laptop + mobile)
npm run dev:web         # http://localhost:5173

# Terminal
npm run tui

# Verify the engine
npm run test:core       # distributions, seed reproducibility, dataset integrity
node packages/core/demo.mjs   # a real cast with live quantum entropy
```

## The ritual (both apps share the arc)

1. **Threshold** — settle, breathe.
2. **Question** — hold what weighs on you; your keystrokes become entropy.
3. **Gather** — move/draw (web) while the quantum sources answer; each source
   shows ✓/✗ as it resolves.
4. **Cast** — six lines form from the bottom up; changing lines glow.
5. **Read** — the hexagram, its judgment and image, the changing-line texts, and
   the hexagram it is *becoming* — plus the seed that reproduces it.

## Honest notes

- **Quantum randomness is for *meaning*, not quality.** A modern CSPRNG is already
  statistically perfect for casting an oracle. The quantum sources are here for the
  story — your hexagram drawn from vacuum fluctuations and a cosmic beacon — and for
  transparency, not because they are "more random." The engine is candid about this.
- **Browser CORS.** In a browser, the NIST/ANU endpoints are usually blocked by CORS
  and come back unavailable; the UI shows this plainly and the local entropy carries
  the cast. For live quantum entropy in the browser, put a tiny serverless proxy in
  front (noted in the web app but not built). **The TUI has no CORS**, so it pulls the
  NIST beacon directly — that's its edge.
- **Text licensing.** The famous Wilhelm–Baynes translation is under copyright. The
  interpretive prose here is **original**, written in the spirit of the classic
  I-Ching — faithful to each hexagram's meaning, copied from no one.

## Cross-platform entropy (the "alternatives to mouse" answer)

Mouse movement only exists on a laptop. The engine captures, with the same
mechanic everywhere:

| Platform | Gesture source |
|----------|----------------|
| Laptop   | mouse path (`pointermove`) + keystroke timing |
| Mobile   | touch path + **device motion** (shake to cast) |
| Terminal | keystroke timing (inter-key intervals) |
