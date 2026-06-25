# Experiment: oracle-guided vs. control — OpenAI edition

The same A/B experiment as [`../oracle-guided`](../oracle-guided/), but run against an
**OpenAI** model instead of Claude. It can authenticate two ways — an OpenAI API key, or
your **ChatGPT-plan login reused from Codex**.

**Question:** does consulting the q-ching oracle actually change how the model advises —
or does it just rationalize whatever it was going to say?

For each prompt, the harness runs two arms with the **same model and settings**:

- **control** — the model answers the dilemma directly.
- **guided** — the model must first call `consult_oracle` (the real `@q-ching/core`
  engine, with live quantum entropy), then let the hexagram's Judgment, Image, and
  changing-line texts shape its guidance.

It logs both answers and the guided arm's **exact reading + reproducible seed**, so
every run is auditable and replayable with `cast({ seed })`.

## Two ways to authenticate

### A. ChatGPT plan, reused from Codex (`--codex`)

Use the subscription you already pay for. The harness reads the "Sign in with ChatGPT"
OAuth token from Codex's `auth.json` and calls the **Codex Responses backend** with it —
the same mechanism OpenClaw and other third-party tools use, which OpenAI supports for
**personal, non-commercial** use. The token is treated as an opaque bearer; we never
decode it.

```bash
npm run build:core
codex login                                  # if not already: choose "Sign in with ChatGPT"
OPENAI_AUTH=codex npm run experiment:openai                 # default question set
OPENAI_AUTH=codex npm run experiment:openai -- "Should I take the new job or stay?"
```

(`OPENAI_AUTH=codex` is equivalent to the `--codex` flag and passes cleanly through the
npm script; if you invoke the workspace directly you can use `-- --codex` instead.)

The model defaults to whatever Codex itself is configured for (read from
`~/.codex/config.toml`), so it works out of the box; override with `OPENAI_MODEL`.

Notes and honest caveats:

- **Personal use only.** OpenAI scopes ChatGPT-subscription auth to personal,
  non-commercial use. For production or multi-user, use an API key (mode B).
- **It consumes the token; it does not refresh it.** Codex refreshes tokens during its
  own use. If a call returns `401`, run any `codex` command (or `codex login`) once to
  refresh `~/.codex/auth.json`, then re-run.
- The Codex backend is an OpenAI-internal endpoint; the request shape and streaming here
  mirror the Codex CLI. It leaves `finalResponse().output` empty and delivers the message,
  reasoning, and tool calls purely via stream events, which the advisor collects.
- Set `QCHING_DEBUG=1` to print per-turn output-item types and text length to stderr.

### B. OpenAI Platform API key (default)

Resolved in order: `OPENAI_API_KEY` env, then a **key-mode** `~/.codex/auth.json`
(`codex login --api-key sk-…`). Billed to your OpenAI API account, separate from any
ChatGPT plan.

```bash
npm run build:core
export OPENAI_API_KEY=sk-...                  # or a key-mode ~/.codex/auth.json
npm run experiment:openai                     # default question set
npm run experiment:openai -- "Should I take the new job or stay?"
```

Results (both modes) are written to `experiments/oracle-guided-openai/results/<timestamp>.{json,md}`
(git-ignored). The `.md` puts control and guided answers side by side per question, with
the hexagram and seed.

## Configuration

| Env var                   | Default                                 | Notes                                                          |
| ------------------------- | --------------------------------------- | -------------------------------------------------------------- |
| `--codex` flag / `OPENAI_AUTH=codex` | off                          | Use the ChatGPT-plan login from Codex (mode A).                |
| `OPENAI_API_KEY`          | —                                       | Mode B; highest priority, else key-mode `auth.json`.           |
| `OPENAI_MODEL`            | Codex's model, else `gpt-5.5`           | Mode A reads `config.toml`; mode B defaults to `gpt-5`.        |
| `OPENAI_REASONING_EFFORT` | `medium`                                | `minimal` / `low` / `medium` / `high`; `none` omits it.        |
| `CODEX_BASE_URL`          | `https://chatgpt.com/backend-api/codex` | Codex Responses backend (mode A).                              |
| `CODEX_HOME`              | `~/.codex`                              | Where `auth.json` / `config.toml` live.                        |
| `QCHING_DEBUG`            | off                                     | Print per-turn output-item types + text length to stderr.     |

## Notes

- Both arms are identical except the guided arm has the oracle tool and the instruction
  to consult it — that isolates the oracle's effect. Reasoning effort is the OpenAI
  counterpart of the Claude harness's adaptive thinking.
- Mode B (API key) talks to the OpenAI Platform via **Chat Completions**; mode A (ChatGPT
  plan) talks to the **Codex Responses backend**. The experiment logic is shared via the
  `Advisor` interface in `src/advisor.ts`.
- The oracle tool itself (live quantum entropy, the cast, the seed) is identical to the
  Claude experiment — only the model that *consumes* the reading changes.
