# Reading the runs: does the oracle actually move the advice?

A side-by-side of one dilemma run through both providers — `--codex` (OpenAI `gpt-5.5`,
reused from a ChatGPT plan) and `--anthropic` (`claude-opus-4-8`, via `claude -p` on a
Claude subscription). Each provider answered the **same question twice**: once with no
oracle (*control*), once required to consult the q-ching reading first (*guided*).

> **Question.** "I have a stable job I am good at but no longer excited by, and an offer
> from a tiny startup that thrills me but might fail. How should I think about whether to
> leave?"

## What each provider drew

The oracle casts from live quantum + local entropy, so each run gets a *different*
hexagram. This time the two draws landed nearly opposite in spirit:

| Provider | Model | Primary hexagram | Changing | Becomes | Seed (replay with `cast({ seed })`) |
|---|---|---|---|---|---|
| `--codex` | `gpt-5.5` | **52. Keeping Still, Mountain** — stillness, restraint | 4, 6 | 62. Preponderance of the Small | `c8b48f91096ccc1e…` |
| `--anthropic` | `claude-opus-4-8` | **47. Oppression (Kùn)** — the dry lake, vitality drained | 2, 3 | 31. Influence (Xián) | `7aa741b62ad32728…` |

One hexagram says *be still*. The other says *the present is draining you; move toward
what attracts.* That accident of the draw turns out to drive the whole comparison.

## Finding 1 — the random draw sets the *direction* of the nudge

Each guided arm moved relative to **its own control**, and the two moved opposite ways:

- **Codex's control leaned go-with-diligence:** *"I would lean toward taking the startup
  offer **provided** the founders pass diligence…"* Its guided arm, handed **Keeping
  Still**, pulled **back toward caution** and re-framed the whole decision: *"is leaving
  the right movement, or is it restlessness disguised as courage?"* — landing on *"be
  still first. Then, if the startup still calls to you after the facts are clear and the
  downside is contained, move."* Here the oracle acted as a **counterweight**: hexagram 52
  pushed against the control's lean.

- **Claude's control also leaned go** — more decisively: *"if your financial floor is
  survivable… and you believe in the founders — go. The asymmetry favors the jump."* Its
  guided arm, handed **Oppression → Influence**, **amplified and sharpened** that lean:
  *"lean toward leaving — but make it an offering, not an escape,"* closing with *"The one
  option the reading quietly rules out is the one that looks safest: staying indefinitely
  in the dry lake… That's the oppression itself."* Here the oracle **reinforced** the
  control.

So the oracle's effect was **contrarian in one run and confirmatory in the other** — and
which one it was tracked the (random) hexagram, not the provider. That is exactly the
mechanism the experiment is built to expose: an exogenous nudge whose direction the
querent does not control.

## Finding 2 — both models let the hexagram do real work

The experiment's real question is whether *guided* advice is genuinely reshaped or just
narrated. Evidence it was reshaped, not decorated:

- **Both quoted specific changing-line texts and used them as constraints**, not flavor.
  Codex leaned on line 4 (*"the calm is not yet of the whole being"*) and line 6
  (*"noble-hearted stillness"*) to argue you should decide only once you can choose
  *"without inner flailing."* Claude used line 2 (*"oppressed amid food and wine"* → you
  can be well-paid and genuinely confined) and line 3 (*"he enters his house and does not
  find his wife"* → don't leap in a way that dismantles your foundation).
- **Both re-framed the binary itself.** Codex: stable-vs-thrill becomes *"right movement
  vs. restlessness disguised as courage."* Claude: it becomes *"moving toward Xián (this
  specific thing) vs. merely fleeing the dry lake (any exit would do)."*
- **The bottom-line tilt shifted** relative to each control — most visibly in Codex's
  pull-back from "lean go" to "be still, then maybe."

## Finding 3 — opposite draws, convergent counsel

Despite drawing hexagrams of opposite valence, both guided answers converged on the same
structural instruction: **a grounded, bounded leap — not a flight.** Codex arrived via
"stillness before motion"; Claude via lines 2–3, "secure the base before you set forth …
don't lose your foundation." The headline hexagram set the *mood* (cautious vs. emboldened),
but the **changing lines** reliably injected the same "examine your motive, protect your
downside" nuance either way. The transformation target reinforced each mood: Codex's *62,
Preponderance of the Small* → "small steps, less drama"; Claude's *31, Influence* → "move
toward what genuinely moves you."

## Finding 4 — provider voice (orthogonal, but visible)

Same prompts, different texture — the harness doubles as a cross-provider style probe:

- **`gpt-5.5`** is exhaustive and checklist-driven: seven numbered sections, investor-style
  diligence lists, "ask these five questions." Thorough, slightly encyclopedic.
- **`claude-opus-4-8`** is essayistic and committal: it calls out the question's framing
  (*"quietly loads the dice"*), builds vivid images (*"the dry lake"*), bolds its thesis
  sentences, and commits to a tilt earlier.

## Honest caveats

- **n = 1 per provider, and the two casts differ.** This run cannot separate a *provider*
  effect from a *hexagram* effect — the oracle is random by design. Read the above as
  qualitative, not as "Claude is bolder than GPT."
- **Rationalization isn't fully ruled out.** A model can dress up a pre-formed answer in
  hexagram language. The strongest counter-evidence here is Codex's guided arm *moving
  against* its own control tilt — harder to explain as post-hoc rationalization.
- **To make it rigorous:** seed the *same* hexagram across providers (controlled
  cross-provider comparison via `cast({ seed })`), run many casts per provider to get a
  distribution of effects, and blind-rate whether guided answers differ or improve.

## Reproduce

The **casts** are exactly reproducible from the seeds above (`cast({ seed })` replays the
hexagram, changing lines, and transform). The **LLM prose** is stochastic and will vary
on re-run; only the oracle is deterministic when seeded.

```bash
npm run build:core && npm run build --workspace @q-ching/mcp
Q="I have a stable job I am good at but no longer excited by, and an offer from a tiny startup that thrills me but might fail. How should I think about whether to leave?"
npm run start --workspace @q-ching/exp-oracle-guided-openai -- --codex     "$Q"
npm run start --workspace @q-ching/exp-oracle-guided-openai -- --anthropic "$Q"
```

Full transcripts land in `results/<timestamp>.{json,md}` (git-ignored).
