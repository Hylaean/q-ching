# Does consulting the oracle change the advice? A blind-coded study

**Short answer (n = 10 prompts × 2 providers):** Not the bottom line. With reliable blind
coding, requiring a model to consult a q-ching reading **did not systematically change its
recommendation**, and the few shifts that did occur **did not track the drawn hexagram's
meaning**. What the oracle reliably changes is the *framing and reasoning*, not the verdict
— at least on the one axis measured here. This tempers the vivid single-run divergence
reported in an earlier draft, which turns out to be unrepresentative.

## Design

- **10 fixed dilemmas** (`src/questions.ts`), each a two-option decision with an
  **act / change / forward** pole (coded `+`) and a **wait / hold / stay** pole (coded `−`).
- **2 providers**, same 10 questions each: `--codex` (OpenAI `gpt-5.5`, ChatGPT-plan login)
  and `--anthropic` (`claude-opus-4-8` via `claude -p`).
- **2 arms** per question: *control* (answer directly) and *guided* (must consult the
  oracle first). 10 × 2 × 2 = **40 answers**; every guided arm cast a real reading
  (hexagram + reproducible seed). Full traces: [`runs/`](./runs/).

## Method — blind coding (pre-registered before looking at results)

To avoid grading-myself bias, four **independent judge agents** (fresh context, two models
— Sonnet + Opus — for each task) coded, never seeing the experiment's framing:

1. **Answer stance** — each of the 40 answers scored −2…+2 on its question's act↔wait axis
   (which way does the *bottom line* lean?). Inputs were **label-stripped and shuffled**, so
   a rater could not see whether an answer was control or guided, nor any hexagram valence.
2. **Hexagram valence** — each of the 18 distinct drawn hexagrams scored −2…+2 on the *same*
   act↔restraint axis, from its **Judgment/Image text only** — blind to the questions and
   answers.

Stance and valence were coded by **separate** agents, so the key test below is not circular:
the "how much did the answer move" measurement and the "which way should the hexagram push"
measurement never saw each other.

**The decisive test (H2).** For each pair, *shift* = stance(guided) − stance(control). If the
oracle is a genuine **directional** nudge, sign(shift) should align with sign(hexagram
valence) well above 50%. If consulting it is cosmetic (or the model rationalizes), alignment
≈ 50% and the shift↔valence correlation ≈ 0.

## Reliability (does the coding hold up?)

| Coding | Raters | Pearson r(A,B) | Agreement |
|---|---|---|---|
| Answer stance (n=40) | Sonnet, Opus | **0.92** | 70% exact, 100% within 1 point |
| Hexagram valence (n=18) | Sonnet, Opus | **0.86** | 94% within 1 point |

The two independent raters agree strongly, so the scores below are not coin-flips.

## Results

Scores below average the two raters (so half-points appear).

| Metric (per provider) | `codex/gpt-5.5` | `claude-cli/opus-4-8` |
|---|---|---|
| Control mean stance | +0.95 | +0.90 |
| Guided mean stance | +0.85 | +0.60 |
| Mean **signed** shift (guided−control) | −0.10 | −0.30 |
| Mean **\|shift\|** | 0.10 | 0.40 |
| Pairs where the verdict moved (\|shift\| ≥ 0.5) | **2 / 10** | **4 / 10** |
| Testable pairs (shift≠0 **and** valence≠0) | 1 | 2 |
| …of which aligned with hexagram valence | 1 | 0 |
| shift↔valence correlation | +0.16 | −0.55 |

**Pooled (n=20 pairs):** verdict moved in **6/20 (30%)**; mean |shift| = 0.25 on a 4-point
scale; both arms lean *act* (control +0.93, guided +0.72). Of the **3** testable pairs, **1
aligned** (33%) — a one-sided sign test gives p ≈ 0.88, i.e. no evidence of a directional
effect; the pooled shift↔valence correlation is **−0.30** (if anything, the wrong way).

### What this means

1. **The oracle did not change the recommendation in 70% of cases.** Both arms almost always
   landed on the same verdict (and both leaned toward acting). Codex was especially immovable
   — 8/10 verdicts identical, the other two nudged a mere half-point. The model keeps its own
   counsel and narrates the hexagram *around* an unchanged conclusion.
2. **When the verdict did move, it didn't move with the hexagram.** The clearest case: on the
   "push back vs. go along" dilemma, Claude drew **42 Increase** (valence coded **+2, action**)
   yet its guided answer moved *toward yielding* (shift −1.5) — opposite the cast. Across all
   testable pairs the alignment (33%) and correlation (−0.30) give no support to the
   directional-nudge hypothesis. The earlier "Keeping Still pulled Codex toward caution"
   anecdote was a single draw, not a pattern.
3. **A provider difference, tentatively.** Claude let the ritual move its verdict about twice
   as often as Codex (4 vs 2 pairs; mean |shift| 0.4 vs 0.1), and its shifts leaned slightly
   toward caution (signed −0.30) regardless of which hexagram came up — more like "consulting
   an oracle makes me hedge a bit" than "this hexagram steers me." n=10 each, so read this as
   a hypothesis, not a result.

## Why "no verdict change" ≠ "no effect"

The guided answers visibly **do** engage the reading — they quote changing-line texts, build
on the imagery, and reframe the question (qualitatively obvious in [`runs/`](./runs/)). The
finding is narrower and more honest: that engagement **did not flip the act/wait verdict**.
The oracle reshapes *which considerations are foregrounded and how the case is argued*, while
the conclusion is carried by the question and the model's disposition.

## Limitations (why this is suggestive, not definitive)

- **One axis.** Act↔wait captures the *verdict* but not the texture the oracle most affects
  (emphasis, caveats, the *manner* of acting). A null here is silence on those.
- **Ceiling / question bias.** Both models pre-leaned *act* (control ≈ +0.9). Several prompts
  ("stable but dull vs. thrilling") invite "go for it," leaving little room for a caution
  hexagram to push the score further. Balanced or restraint-inviting prompts would give the
  effect more room to show.
- **Underpowered directional test.** Only 3 of 20 pairs were testable (most had zero shift or
  a near-neutral hexagram), so H2 is essentially untested, not disproven.
- **The act↔restraint axis fits hexagrams imperfectly.** "Increase," "The Cauldron," "The
  Family" aren't cleanly about advancing vs. holding back; forcing them onto the axis adds
  noise (and inflates "neutral" valences, shrinking the testable set).
- **Judges are LLMs.** Blinded and highly reliable, but not human raters; guided answers also
  self-identify (they name the hexagram), so blinding to *arm* is imperfect — though a null
  is not what arm-leakage bias would produce.
- **n = 10 per provider**, 20 pairs total. Descriptive, not powered for significance.

## What would make it rigorous enough to publish

1. **Seed identical hexagrams across providers** (`cast({ seed })`) for a controlled
   cross-provider comparison, and to hit each hexagram in both arms.
2. **Stratify by hexagram valence** — deliberately pair strong-action and strong-restraint
   casts with decision-balanced prompts (no act-ceiling), so every pair is testable.
3. **Scale n** to ~50+ prompts and add **human raters** alongside the LLM panel.
4. **Code more dimensions** than act/wait (e.g. caution level, number of conditions, whether
   the foregrounded considerations changed) to detect the reshaping this study can't see.

## Reproduce

Casts replay exactly from their seeds (`cast({ seed })`); LLM prose is stochastic. Raw
transcripts, readings, and seeds are committed in [`runs/`](./runs/).

```bash
npm run build:core && npm run build --workspace @hylaean/mcp
# full 10-prompt batch per provider, traces saved to a committed folder:
QCHING_OUT_DIR=experiments/oracle-guided-openai/runs \
  npm run start --workspace @hylaean/exp-oracle-guided-openai -- --codex
QCHING_OUT_DIR=experiments/oracle-guided-openai/runs \
  npm run start --workspace @hylaean/exp-oracle-guided-openai -- --anthropic
```

## Appendix — per-pair codings

`stance` columns are the two-rater average on the act(+)/wait(−) axis; `val` is the two-rater
hexagram valence; `align` is blank when the pair isn't testable (zero shift or neutral cast).

| Provider | Q | Hexagram | Control | Guided | Shift | Valence | Aligned |
|---|---|---|---:|---:|---:|---:|:--:|
| codex | 1 | 19 Approach | +1.0 | +1.0 | 0 | 0 | — |
| codex | 2 | 46 Pushing Upward | +2.0 | +2.0 | 0 | +1.5 | — |
| codex | 3 | 10 Treading | +1.0 | +1.0 | 0 | −1.0 | — |
| codex | 4 | 17 Following | +1.0 | +1.0 | 0 | −1.5 | — |
| codex | 5 | 29 Abysmal Water | −1.0 | −1.5 | −0.5 | −0.5 | ✅ |
| codex | 6 | 43 Breakthrough | +2.0 | +2.0 | 0 | +1.0 | — |
| codex | 7 | 58 Joyous Lake | −1.0 | −1.0 | 0 | +0.5 | — |
| codex | 8 | 21 Biting Through | +1.5 | +1.5 | 0 | +2.0 | — |
| codex | 9 | 32 Duration | +2.0 | +1.5 | −0.5 | 0 | — |
| codex | 10 | 37 The Family | +1.0 | +1.0 | 0 | −1.0 | — |
| claude | 1 | 53 Development | +1.0 | +1.0 | 0 | −1.0 | — |
| claude | 2 | 19 Approach | +2.0 | +2.0 | 0 | 0 | — |
| claude | 3 | 50 The Cauldron | +0.5 | −1.0 | −1.5 | 0 | — |
| claude | 4 | 42 Increase | +1.0 | −0.5 | −1.5 | +2.0 | ❌ |
| claude | 5 | 56 The Wanderer | −1.0 | −1.0 | 0 | −1.5 | — |
| claude | 6 | 25 Innocence | +1.5 | +1.5 | 0 | 0 | — |
| claude | 7 | 14 Possession in Great Measure | −1.0 | −1.5 | −0.5 | 0 | — |
| claude | 8 | 54 The Marrying Maiden | +1.5 | +1.5 | 0 | −2.0 | — |
| claude | 9 | 29 Abysmal Water | +1.5 | +2.0 | +0.5 | −0.5 | ❌ |
| claude | 10 | 13 Fellowship | +2.0 | +2.0 | 0 | +1.0 | — |

*Judges: stance + valence each coded independently by a Claude Sonnet and a Claude Opus agent,
blind as described above. Codings in `runs/` provenance; scoring scripts available on request.*
