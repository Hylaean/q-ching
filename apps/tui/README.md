# @q-ching/tui

> An I-Ching oracle in your terminal — cast from live quantum entropy and the rhythm of your own typing.

`q-ching` casts a reading by mixing true/quantum randomness (the NIST randomness beacon, reachable directly from Node) with the entropy of your own keystroke timing, then draws the six lines, looks up the primary hexagram, computes the changing lines, and derives the transformed hexagram.

## Install

```bash
npm install -g @q-ching/tui
```

## Use

```bash
q-ching
```

Requires a real interactive terminal (it uses raw-mode key input) and Node ≥ 20. Follow the ritual: cross the threshold, hold your question, let it gather entropy, and read what is cast.

## How it works

This is a thin client over [`@q-ching/core`](https://www.npmjs.com/package/@q-ching/core), the dependency-free engine that does the entropy mixing and casting math. See the [project README](https://github.com/Hylaean/q-ching#readme) for the full story.

## License

MIT
