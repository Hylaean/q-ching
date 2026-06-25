# Experiment: oracle-guided vs. control

**Question:** does consulting the q-ching oracle actually change how an LLM advises —
or does the model just rationalize whatever it was going to say?

For each prompt, the harness runs two arms with the **same model and settings**:

- **control** — Claude answers the dilemma directly.
- **guided** — Claude must first call `consult_oracle` (the real `@hylaean/core`
  engine, with live quantum entropy), then let the hexagram's Judgment, Image, and
  changing-line texts shape its guidance.

It logs both answers and the guided arm's **exact reading + reproducible seed**, so
every run is auditable and replayable with `cast({ seed })`.

## Run it

```bash
npm install
npm run build:core                 # the harness imports @hylaean/core from its dist/
export ANTHROPIC_API_KEY=sk-ant-…  # calls the Claude API — billed usage
npm run experiment                 # runs the default question set

# or a single question:
npm run experiment -- "Should I take the new job or stay where I am?"
```

Results are written to `experiments/oracle-guided/results/<timestamp>.{json,md}`
(git-ignored). The `.md` puts control and guided answers side by side per question,
with the hexagram and seed.

## Notes

- Model: `claude-opus-4-8` with adaptive thinking. Both arms are identical except the
  guided arm has the oracle tool and the instruction to consult it — that isolates the
  oracle's effect.
- The only manipulation is the oracle. To probe further, vary the casting `method`,
  re-run a fixed reading by seeding the tool, or add a third arm.
