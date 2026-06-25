# @hylaean/mcp

An [MCP](https://modelcontextprotocol.io) server that exposes the **q-ching** I-Ching
oracle as a tool, so any MCP client — Claude Desktop, Claude Code, or another agent —
can cast a reading and be guided by it.

It runs the dependency-free `@hylaean/core` engine directly. Because it's a Node
process with no browser CORS in the way, it reaches the **live quantum sources** the
same way the terminal app does.

## The tool

**`cast_reading`** — cast an I-Ching reading.

| Input | Type | Notes |
|---|---|---|
| `question` | string? | The querent's question, recorded for context. |
| `method` | `"coin"` \| `"yarrow"`? | `coin` (default) or the traditional `yarrow` (changing lines rarer). |
| `seed` | string? | Reproduce a prior reading exactly from its hex seed. |
| `quantum` | boolean? | Fold in live quantum entropy (default `true`). |
| `contextHash` | string? | The agent's "gesture" — a hash/digest of its current conversation context, folded into the entropy pool as the caller's own contribution. Hashed with every other source, so its form is free. Ignored when `seed` is set. |

Returns the primary hexagram (Judgment, Image, gloss), the changing lines and their
texts, the hexagram it transforms into, and the **reproducible seed**.

## Run it

Install from npm:

```bash
npm install -g @hylaean/mcp
q-ching-mcp               # starts the server on stdio
```

Or run from a clone of the repo:

```bash
npm install
npm run build:core        # the server imports @hylaean/core from its dist/
npm run mcp               # starts the server on stdio
```

## Use it from Claude Desktop / Claude Code

With the package installed (or via `npx`), point your MCP client at it. For Claude
Desktop, add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "q-ching": {
      "command": "npx",
      "args": ["-y", "@hylaean/mcp"]
    }
  }
}
```

For Claude Code: `claude mcp add q-ching -- npx -y @hylaean/mcp`.

Running from a clone instead? Build once (`npm run build:core && npm run build:mcp`)
and point the client at `node /absolute/path/to/q-ching/apps/mcp/dist/index.js`.

Then ask the assistant to consult the oracle — it will call `cast_reading` and let the
hexagram shape its answer.
