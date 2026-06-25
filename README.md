<div align="center">

# ䷜ q-ching

**An I-Ching oracle cast from quantum noise and the motion of your own hand.**

*Mouse · touch · device-motion · keystrokes — mixed with the quantum vacuum, on your laptop, your phone, and in your terminal.*

</div>

---

A reading has always been an act of randomness given meaning — yarrow stalks and
coins are just entropy sources with a ritual wrapped around them. **q-ching** takes
that literally. Every hexagram is drawn from a pool that mixes:

- 🌌 **true / quantum randomness** — the NIST quantum beacon, ANU vacuum fluctuations, RANDOM.ORG
- ✋ **the entropy of your own body** — your mouse path, touch gesture, the shake of your phone, the rhythm of your typing
- 🔒 **a local cryptographic RNG** that can *never* fail, so a cast is never blocked

…all folded together and whitened into a single, reproducible **seed**. One engine
powers three faces: a browser PWA, a phone, and a terminal.

```
䷻  60. 節 (jié) — Limitation
   “Restraint that gives life its shape”

   JUDGMENT  Limitation brings success. But limitation that is galling and bitter
   must not be made to endure; measure has its own measure…

   changing line 4  →  becoming ䷹ 58. The Joyous Lake
```

## ✨ Features

- **Two casting rituals** with correct probabilities — the **coin** method (⅛·⅜·⅜·⅛) and the traditional **yarrow stalk** method (1⁄16·5⁄16·7⁄16·3⁄16, where changing lines are rarer).
- **Changing lines & transformation** — every reading shows the primary hexagram, the moving-line texts, and the hexagram it is *becoming*.
- **Reproducible, shareable seeds** — each cast exposes the exact seed that produced it; `cast({ seed })` reproduces it perfectly. Readings are auditable and shareable.
- **The full text** — all 64 hexagrams with judgment, image, a one-line gloss, and six line texts. Original prose, faithful to the classic meaning (no copyrighted translation).
- **Beautiful by intent** — an ink-wash aesthetic, slow eased animations, a luminous ink trail that follows your hand, and full `prefers-reduced-motion` support.
- **Runs everywhere from one engine** — `@q-ching/core` is dependency-free and uses only Web Crypto + `fetch`.

## 🚀 Quick start

```bash
npm install
npm run build:core      # build the shared engine first

npm run dev:web         # → http://localhost:5173   (laptop + phone on your LAN)
npm run tui             # the terminal ritual (where live quantum entropy works)
npm run mcp             # the oracle as an MCP server (Claude Desktop / Claude Code / agents)

npm run test:core       # the proofs: distributions, seed reproducibility, dataset integrity
node packages/core/demo.mjs   # one real cast with live quantum entropy
```

## 🕯️ The ritual

Both apps share the same arc:

1. **Threshold** — settle, breathe.
2. **Question** — hold what weighs on you; your keystrokes become entropy.
3. **Gather** — trace the dark with your hand while the quantum sources answer, each resolving to ✓ / ✗.
4. **Cast** — six lines form from the ground up; changing lines glow cinnabar.
5. **Read** — the hexagram, its judgment and image, the moving lines, what it is becoming — and the seed that reproduces it.

## 🧭 The surfaces

One engine, many faces — every app and tool is a thin client over `@q-ching/core`.

| | |
|---|---|
| **`packages/core`** | `@q-ching/core` — the engine. Entropy pool, QRNG clients, casting math, the 64 hexagrams. No dependencies; runs in browser and Node alike. |
| **`apps/web`** | React + Vite + Framer Motion **PWA**. Captures mouse, touch, and device-motion entropy. Installable; works on laptop and mobile. Deploys to **[qching.hylaean.com](https://qching.hylaean.com)** via GitHub Pages. |
| **`apps/tui`** | An **Ink** terminal app. Captures keystroke-timing entropy and — with no browser CORS in the way — pulls the live NIST quantum beacon directly. |
| **`apps/mcp`** | `@q-ching/mcp` — an **MCP server** exposing the oracle as a `cast_reading` tool, so Claude Desktop, Claude Code, and other agents can consult it. Live quantum entropy, like the TUI. |
| **`experiments/oracle-guided`** | An A/B harness: does consulting the oracle actually change how an LLM advises? Guided arm vs. control, with every reading's seed logged for replay. |

## 🤖 Consult the oracle from your agent (MCP)

The terminal isn't the only way in. `apps/mcp` is a [Model Context Protocol](https://modelcontextprotocol.io)
server that exposes one tool — **`cast_reading`** — so any MCP client can ask the oracle a
question and be guided by the hexagram it draws. Being a Node process with no browser CORS,
it reaches the live quantum sources directly.

```bash
npm run build:core && npm run build:mcp
claude mcp add q-ching -- node "$PWD/apps/mcp/dist/index.js"   # Claude Code
```

Then: *"consult the q-ching oracle about X."* See [`apps/mcp/README.md`](./apps/mcp/README.md)
for the Claude Desktop config and the full tool reference.

## 🔮 woo-woo coding (a Claude Code skill)

For when the vibe coding is done and only the cosmos can tell you whether to ship: the
bundled **`woo-woo`** skill (`.claude/skills/woo-woo/`) turns Claude into the *Oracle of the
Quantum Codebase*. You don't interrogate the universe — you **cast once, and you trust it**.
One hexagram, drawn through the MCP tool from quantum noise, read back to you in wildly
over-the-top mystical prophecy. Type `/woo-woo` (or just ask the spirits what they make of
your code) and surrender.

## 🔬 How a cast works

```
GestureEntropy ─┐
QRNG (NIST/…) ──┼─▶ EntropyPool ─▶ squeeze ─▶ six lines ─▶ primary hexagram
local CSPRNG  ──┘   (extract: PRK = SHA-256(sources))      └▶ changing lines ─▶ transformed
                    (expand:  out = SHA-256(PRK‖counter))
                     fingerprint(PRK) = the shareable seed
```

The pool is HKDF-style: it *extracts* a pseudo-random key from every source, so no
single source can bias the result, then *expands* a uniform stream to draw the
lines. The PRK's hex fingerprint **is** the seed. For the deeper architecture and
conventions, see [`CLAUDE.md`](./CLAUDE.md).

## 🤔 Honest notes

- **Quantum randomness is for *meaning*, not quality.** A modern CSPRNG is already
  statistically perfect for casting an oracle. The quantum sources are here for the
  story — your hexagram drawn from vacuum fluctuations and a cosmic beacon — and for
  transparency. The engine is candid about this.
- **Browser CORS.** In a browser the NIST/ANU endpoints are usually CORS-blocked and
  shown as unreachable while local entropy carries the cast — this is expected, not a
  bug. For live quantum entropy in the browser, put a small serverless proxy in front
  (noted, not built). The **terminal app has no CORS**, so it reaches the beacon directly.
- **Text licensing.** The famous Wilhelm–Baynes translation is under copyright. The
  interpretive prose here is **original**, written in the spirit of the classic I-Ching
  and faithful to each hexagram's meaning — copied from no one.

## 🗺️ Roadmap

- A serverless QRNG proxy so the browser also gets live quantum entropy.
- A **remote MCP / A2A** endpoint (a small Cloudflare Worker at `mcp.qching.hylaean.com`) so web and cloud agents can consult the oracle too — without touching the Pages deploy.
- Bring-your-own ANU / RANDOM.ORG API keys (the clients already accept them).
- Polished PWA icons and screenshots.

## 🛠️ Tech

TypeScript monorepo (npm workspaces) · React 18 · Vite 5 · Framer Motion 11 · Ink 5 · Model Context Protocol · Web Crypto · zero-dependency core.

<div align="center">
<sub>made with stillness · 易</sub>
</div>
