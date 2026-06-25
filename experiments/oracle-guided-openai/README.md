# Experiment: oracle-guided vs. control — OpenAI edition

The same A/B experiment as [`../oracle-guided`](../oracle-guided/), but run against an
**OpenAI** model instead of Claude, with the key **reused from Codex**.

**Question:** does consulting the q-ching oracle actually change how the model advises —
or does it just rationalize whatever it was going to say?

For each prompt, the harness runs two arms with the **same model and settings**:

- **control** — the model answers the dilemma directly.
- **guided** — the model must first call `consult_oracle` (the real `@q-ching/core`
  engine, with live quantum entropy), then let the hexagram's Judgment, Image, and
  changing-line texts shape its guidance.

It logs both answers and the guided arm's **exact reading + reproducible seed**, so
every run is auditable and replayable with `cast({ seed })`.

## The key: reused from Codex

The harness resolves an OpenAI API key in this order:

1. `OPENAI_API_KEY` in your environment.
2. Codex's credential file — `$CODEX_HOME/auth.json` (default `~/.codex/auth.json`) —
   when Codex is logged in **with an API key** (`auth_mode: "apikey"`).

> **If Codex is signed in with ChatGPT (OAuth)** — `auth_mode: "chatgpt"`, the common
> case — `auth.json` holds OAuth tokens, **not an API key**, and the OpenAI API will not
> accept them as a Bearer key. The harness detects this and tells you what to do. To run
> the experiment, either:
>
> - `export OPENAI_API_KEY=sk-...` (create one at <https://platform.openai.com/api-keys>), or
> - re-auth Codex with a key: `codex login --api-key sk-...`

## Run it

```bash
npm install
npm run build:core                 # the harness imports @q-ching/core from its dist/
export OPENAI_API_KEY=sk-...        # or rely on a key-mode ~/.codex/auth.json
npm run experiment:openai          # runs the default question set

# or a single question:
npm run experiment:openai -- "Should I take the new job or stay where I am?"
```

Results are written to `experiments/oracle-guided-openai/results/<timestamp>.{json,md}`
(git-ignored). The `.md` puts control and guided answers side by side per question,
with the hexagram and seed.

## Configuration

| Env var                    | Default    | Notes                                                              |
| -------------------------- | ---------- | ------------------------------------------------------------------ |
| `OPENAI_API_KEY`           | —          | Highest priority; falls back to Codex's `auth.json`.               |
| `OPENAI_MODEL`             | `gpt-5`    | Any chat-capable model; match your Codex config if you like.       |
| `OPENAI_REASONING_EFFORT`  | `medium`   | `minimal` / `low` / `medium` / `high`; `none` omits it.            |
| `OPENAI_BASE_URL`          | —          | Honored by the OpenAI SDK for proxies / compatible gateways.       |
| `CODEX_HOME`               | `~/.codex` | Where to look for `auth.json`.                                     |

## Notes

- This is the OpenAI analogue of the Claude harness: both arms are identical except the
  guided arm has the oracle tool and the instruction to consult it — that isolates the
  oracle's effect. `reasoning_effort` is the OpenAI counterpart of adaptive thinking.
- The only manipulation is the oracle. To probe further, vary the casting `method`,
  re-run a fixed reading by seeding the tool, or add a third arm.
- The oracle tool itself (live quantum entropy, the cast, the seed) is identical to the
  Claude experiment — only the model that *consumes* the reading changes.
