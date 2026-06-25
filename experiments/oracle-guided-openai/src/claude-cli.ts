/**
 * Anthropic arm — run on a Claude subscription the way OpenClaw does it: drive the
 * official `claude -p` (Claude Code, headless) as a local subprocess. The OAuth token
 * never leaves Claude Code; we only invoke the sanctioned client, so this stays within
 * Anthropic's terms (which forbid reusing a subscription OAuth token in third-party
 * tools, but allow driving `claude`/`claude -p` for personal scripts and CI).
 *
 * Per Anthropic's June 15 2026 change, this usage draws from your monthly Agent SDK
 * credit first, then usage credits at standard API rates.
 *
 * The guided arm gives Claude the oracle via THIS repo's q-ching MCP server, so the
 * model genuinely calls `cast_reading` itself — the faithful analogue of the OpenAI
 * arms' `consult_oracle` tool call.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SYSTEM_BASE,
  SYSTEM_GUIDED,
  type Advisor,
  type ArmResult,
  type GuidedResult,
  type ReadingSummary,
} from './advisor.js';

const execFileAsync = promisify(execFile);
const CLAUDE_BIN = process.env.CLAUDE_BIN?.trim() || 'claude';
const MCP_TOOL = 'mcp__qching__cast_reading';
const RUN_TIMEOUT_MS = 600_000;

/** The built q-ching MCP server, resolved from this file (…/experiments/<exp>/src). */
function mcpServerPath(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const p = path.resolve(here, '../../../apps/mcp/dist/index.js');
  if (!existsSync(p)) {
    throw new Error(`q-ching MCP server not built at ${p}.\nRun: npm run build --workspace @hylaean/mcp`);
  }
  return p;
}

/** Parse a ReadingSummary out of the MCP tool's formatted reading text. */
function parseReading(text: string): ReadingSummary | null {
  // Primary hexagram line: "<glyph> 26. 大畜 (dà chù) — The Taming Power of the Great".
  const primary = text.match(/^(?!Becoming:)\S+\s+(\d+)\.\s+\S.*?—\s+(.+?)\s*$/m);
  if (!primary) return null;
  const seed = text.match(/^Seed:\s*([0-9a-fA-F]+)\s*$/m);
  const method = text.match(/^Method:\s*(\w+)/m);
  const changing = text.match(/^Changing lines:\s*(.+)$/m);
  const becoming = text.match(/^Becoming:\s+\S+\s+(\d+)\.\s+.*?—\s+(.+?)\s*$/m);
  const changingLines =
    changing && !/^none/i.test(changing[1]) ? (changing[1].match(/\d+/g) ?? []).map(Number) : [];
  return {
    seed: seed?.[1] ?? '',
    method: method?.[1] ?? 'coin',
    primary: `${primary[1]}. ${primary[2]}`,
    changingLines,
    becoming: becoming ? `${becoming[1]}. ${becoming[2]}` : null,
  };
}

interface StreamMsg {
  type?: string;
  result?: string;
  subtype?: string;
  message?: { content?: Array<{ type?: string; name?: string; id?: string; tool_use_id?: string; content?: unknown }> };
}

/** Pull the final answer and the oracle reading out of a stream-json transcript. */
function parseGuidedStream(ndjson: string, _question: string): GuidedResult {
  const lines = ndjson
    .trim()
    .split('\n')
    .map((l) => {
      try {
        return JSON.parse(l) as StreamMsg;
      } catch {
        return null;
      }
    })
    .filter((o): o is StreamMsg => o !== null);

  let castId: string | undefined;
  let readingText: string | null = null;
  let answer = '';
  let stopReason: string | null = null;

  for (const o of lines) {
    if (o.type === 'assistant') {
      for (const b of o.message?.content ?? []) {
        if (b.type === 'tool_use' && b.name === MCP_TOOL) castId = b.id;
      }
    } else if (o.type === 'user') {
      for (const b of o.message?.content ?? []) {
        if (b.type === 'tool_result' && b.tool_use_id === castId && readingText === null) {
          readingText = Array.isArray(b.content)
            ? (b.content as Array<{ text?: string }>).map((c) => c.text ?? '').join('')
            : typeof b.content === 'string'
              ? b.content
              : '';
        }
      }
    } else if (o.type === 'result') {
      answer = (o.result ?? '').trim();
      stopReason = o.subtype ?? null;
    }
  }

  return { answer, stopReason, reading: readingText ? parseReading(readingText) : null };
}

export class ClaudeCliAdvisor implements Advisor {
  private prep?: Promise<{ cwd: string; mcpConfig: string }>;

  constructor(readonly model: string) {}

  /** A neutral working dir (no project CLAUDE.md to bias the advisor) + the MCP config. */
  private prepare(): Promise<{ cwd: string; mcpConfig: string }> {
    if (!this.prep) {
      this.prep = (async () => {
        const cwd = await mkdtemp(path.join(os.tmpdir(), 'qching-cli-'));
        const mcpConfig = path.join(cwd, 'mcp.json');
        await writeFile(
          mcpConfig,
          JSON.stringify({ mcpServers: { qching: { command: 'node', args: [mcpServerPath()] } } }),
        );
        return { cwd, mcpConfig };
      })();
    }
    return this.prep;
  }

  private model_args(): string[] {
    return this.model ? ['--model', this.model] : [];
  }

  private async run(args: string[], cwd: string): Promise<string> {
    const { stdout } = await execFileAsync(CLAUDE_BIN, args, {
      cwd,
      timeout: RUN_TIMEOUT_MS,
      maxBuffer: 64 * 1024 * 1024,
    });
    return stdout;
  }

  async control(question: string): Promise<ArmResult> {
    const { cwd } = await this.prepare();
    const out = await this.run(
      ['-p', question, '--append-system-prompt', SYSTEM_BASE, '--output-format', 'json', ...this.model_args()],
      cwd,
    );
    const obj = JSON.parse(out) as { result?: string; stop_reason?: string; subtype?: string };
    return { answer: (obj.result ?? '').trim(), stopReason: obj.stop_reason ?? obj.subtype ?? null };
  }

  async guided(question: string): Promise<GuidedResult> {
    const { cwd, mcpConfig } = await this.prepare();
    const out = await this.run(
      [
        '-p',
        question,
        '--append-system-prompt',
        SYSTEM_GUIDED,
        '--mcp-config',
        mcpConfig,
        '--strict-mcp-config',
        '--allowedTools',
        MCP_TOOL,
        '--output-format',
        'stream-json',
        '--verbose',
        ...this.model_args(),
      ],
      cwd,
    );
    return parseGuidedStream(out, question);
  }
}
