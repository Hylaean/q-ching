# @q-ching/mcp

An [MCP](https://modelcontextprotocol.io) server that exposes the **q-ching** I-Ching
oracle as a tool, so any MCP client — Claude Desktop, Claude Code, or another agent —
can cast a reading and be guided by it.

It runs the dependency-free `@q-ching/core` engine directly. Because it's a Node
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

Returns the primary hexagram (Judgment, Image, gloss), the changing lines and their
texts, the hexagram it transforms into, and the **reproducible seed**.

## Run it

```bash
npm install
npm run build:core        # the server imports @q-ching/core from its dist/
npm run mcp               # starts the server on stdio
```

## Use it from Claude Desktop / Claude Code

Build it once (`npm run build:core && npm run build:mcp`), then point your MCP client
at the compiled entry. For Claude Desktop, add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "q-ching": {
      "command": "node",
      "args": ["/absolute/path/to/q-ching/apps/mcp/dist/index.js"]
    }
  }
}
```

For Claude Code: `claude mcp add q-ching -- node /absolute/path/to/q-ching/apps/mcp/dist/index.js`.

Then ask the assistant to consult the oracle — it will call `cast_reading` and let the
hexagram shape its answer.
