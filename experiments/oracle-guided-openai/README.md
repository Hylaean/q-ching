# Experiment: oracle-guided vs. control — multi-provider edition

The same A/B experiment as [`../oracle-guided`](../oracle-guided/), runnable three ways,
each reusing credentials you already have:

- **`--codex`** — your ChatGPT-plan login reused from Codex (OpenAI Responses backend).
- **default** — an OpenAI Platform API key (Chat Completions).
- **`--anthropic`** — your Claude subscription via the official `claude -p` CLI, the way
  OpenClaw drives it.

**Question:** does consulting the q-ching oracle actually change how the model advises —
or does it just rationalize whatever it was going to say?

> A worked comparison of one dilemma across both providers is in
> [`ANALYSIS.md`](./ANALYSIS.md).

For each prompt, the harness runs two arms with the **same model and settings**:

- **control** — the model answers the dilemma directly.
- **guided** — the model must first call `consult_oracle` (the real `@q-ching/core`
  engine, with live quantum entropy), then let the hexagram's Judgment, Image, and
  changing-line texts shape its guidance.

It logs both answers and the guided arm's **exact reading + reproducible seed**, so
every run is auditable and replayable with `cast({ seed })`.

## Three ways to authenticate

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

### C. Claude subscription, via the official CLI (`--anthropic`)

Run the Anthropic arm on your **Claude Pro/Max subscription** the way OpenClaw does it —
by driving the official **`claude -p`** (Claude Code, headless) as a local subprocess.
The OAuth token never leaves Claude Code; we only invoke the sanctioned client, so this
stays within Anthropic's terms. (Anthropic forbids reusing a subscription OAuth *token*
in third-party tools — the April 2026 OpenClaw ban — but driving `claude`/`claude -p` for
personal scripts is supported; `claude setup-token` exists for exactly this.)

The guided arm gives Claude the oracle through **this repo's q-ching MCP server**, so the
model genuinely calls `cast_reading` itself — the faithful analogue of the OpenAI arms.

```bash
npm run build:core
npm run build --workspace @q-ching/mcp     # the oracle tool the guided arm calls
claude /login                              # if not already logged in to your subscription
npm run start --workspace @q-ching/exp-oracle-guided-openai -- --anthropic
npm run start --workspace @q-ching/exp-oracle-guided-openai -- --anthropic "your dilemma"
```

Notes:

- **Personal use.** Per Anthropic's June 15 2026 change, this draws from your monthly
  Agent SDK credit first, then usage credits at standard API rates. For shared/production
  automation Anthropic directs you to an API key instead.
- The advisor runs `claude -p` from a neutral temp dir so the repo's `CLAUDE.md` doesn't
  bias it; both arms share Claude Code's base harness prompt, so the oracle remains the
  only difference between them.
- Model follows your Claude Code default; override with `ANTHROPIC_MODEL`. Override the
  binary with `CLAUDE_BIN`.

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
| `--codex` / `OPENAI_AUTH=codex`      | off                          | Mode A — ChatGPT-plan login from Codex.                        |
| `--anthropic` / `QCHING_AUTH=anthropic` | off                       | Mode C — Claude subscription via `claude -p`.                  |
| `OPENAI_API_KEY`          | —                                       | Mode B; highest priority, else key-mode `auth.json`.           |
| `OPENAI_MODEL`            | Codex's model, else `gpt-5.5`           | Mode A reads `config.toml`; mode B defaults to `gpt-5`.        |
| `ANTHROPIC_MODEL`         | Claude Code default                     | Mode C; passed as `claude -p --model`.                         |
| `OPENAI_REASONING_EFFORT` | `medium`                                | `minimal` / `low` / `medium` / `high`; `none` omits it.        |
| `CODEX_BASE_URL`          | `https://chatgpt.com/backend-api/codex` | Codex Responses backend (mode A).                              |
| `CODEX_HOME`              | `~/.codex`                              | Where `auth.json` / `config.toml` live.                        |
| `CLAUDE_BIN`              | `claude`                                | Mode C; path to the Claude Code CLI.                           |
| `QCHING_DEBUG`            | off                                     | Mode A — print per-turn output-item types to stderr.          |

## Notes

- Both arms are identical except the guided arm has the oracle tool and the instruction
  to consult it — that isolates the oracle's effect. Reasoning effort is the OpenAI
  counterpart of the Claude harness's adaptive thinking.
- Mode B (API key) talks to the OpenAI Platform via **Chat Completions**; mode A (ChatGPT
  plan) talks to the **Codex Responses backend**. The experiment logic is shared via the
  `Advisor` interface in `src/advisor.ts`.
- The oracle tool itself (live quantum entropy, the cast, the seed) is identical to the
  Claude experiment — only the model that *consumes* the reading changes.
