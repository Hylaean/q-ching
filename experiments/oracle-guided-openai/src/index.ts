/**
 * Oracle-guided vs. control — an A/B experiment, OpenAI edition.
 *
 * A faithful parallel of ../oracle-guided, run against an OpenAI model. Two auth modes:
 *   • default — an OpenAI Platform API key (OPENAI_API_KEY, else a key-mode ~/.codex/auth.json),
 *               via Chat Completions.
 *   • --codex — your ChatGPT-plan login reused from Codex's auth.json, via the Codex Responses
 *               backend (the same path OpenClaw uses). Personal, non-commercial use.
 *
 * For each question we run two arms with the same model and settings:
 *   • control — the model answers directly, no oracle.
 *   • guided  — the model must first call `consult_oracle` (the q-ching engine),
 *               then let the hexagram shape its answer.
 *
 * We log, per question: both answers, and the guided arm's exact reading
 * (hexagram + reproducible seed), so any run can be replayed via cast({ seed }).
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import OpenAI from 'openai';
import { resolveOpenAIKey } from './openai-key.js';
import { resolveCodexOAuth, codexConfiguredModel, DEFAULT_CODEX_BASE_URL } from './codex-oauth.js';
import {
  ChatCompletionsAdvisor,
  CodexResponsesAdvisor,
  type Advisor,
  type ArmResult,
  type GuidedResult,
} from './advisor.js';
import { ClaudeCliAdvisor } from './claude-cli.js';
import { DEFAULT_QUESTIONS } from './questions.js';

interface QuestionResult {
  question: string;
  control: ArmResult;
  guided: GuidedResult;
}

/** Build the advisor for the selected auth mode. Throws with actionable text on bad creds. */
function buildAdvisor(): { advisor: Advisor; mode: string } {
  // Anthropic arm: drive the local `claude -p` on your Claude subscription (OpenClaw's method).
  if (process.argv.includes('--anthropic') || process.env.QCHING_AUTH?.toLowerCase() === 'anthropic') {
    const model = process.env.ANTHROPIC_MODEL?.trim() || '';
    console.error('Auth: Claude subscription via the local `claude` CLI (claude -p) — personal use');
    console.error(
      `Engine: claude -p${model ? ` --model ${model}` : ' (subscription default model)'}; oracle via the q-ching MCP server`,
    );
    return { advisor: new ClaudeCliAdvisor(model), mode: `claude-cli/${model || 'default'}` };
  }

  const useCodex =
    process.argv.includes('--codex') || process.env.OPENAI_AUTH?.toLowerCase() === 'codex';

  if (useCodex) {
    const oauth = resolveCodexOAuth();
    // Default to whatever model Codex itself is configured for; override with OPENAI_MODEL.
    const model = process.env.OPENAI_MODEL?.trim() || codexConfiguredModel() || 'gpt-5.5';
    const baseURL = process.env.CODEX_BASE_URL?.trim() || DEFAULT_CODEX_BASE_URL;
    console.error(`Auth: ChatGPT-plan login reused from Codex (${oauth.source})`);
    console.error(`Backend: ${baseURL} · model: ${model} (personal, non-commercial use)`);
    const client = new OpenAI({
      apiKey: oauth.accessToken, // opaque OAuth bearer; sent as Authorization: Bearer
      baseURL,
      defaultHeaders: {
        'chatgpt-account-id': oauth.accountId,
        'OpenAI-Beta': 'responses=experimental',
        originator: 'codex_cli_rs',
        session_id: randomUUID(),
      },
    });
    return { advisor: new CodexResponsesAdvisor(client, model), mode: `codex/${model}` };
  }

  const resolved = resolveOpenAIKey();
  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-5';
  console.error(`Auth: OpenAI API key (${resolved.source}) · model: ${model}`);
  const client = new OpenAI({ apiKey: resolved.key });
  return { advisor: new ChatCompletionsAdvisor(client, model), mode: `apikey/${model}` };
}

function toMarkdown(results: QuestionResult[], mode: string, startedAt: string): string {
  const md: string[] = [
    '# Oracle-guided vs. control',
    '',
    `Mode: \`${mode}\` · run: ${startedAt}`,
    '',
    'Each question was answered twice with identical settings — once with no oracle (control),',
    'once required to consult the q-ching reading first (guided). Seeds reproduce each reading',
    'via `cast({ seed })`.',
    '',
  ];
  results.forEach((r, i) => {
    md.push(`## ${i + 1}. ${r.question}`, '');
    if (r.guided.reading) {
      const rd = r.guided.reading;
      const becoming = rd.becoming ? ` → becoming ${rd.becoming}` : '';
      const changing = rd.changingLines.length ? ` (changing: ${rd.changingLines.join(', ')})` : ' (static)';
      md.push(`**Reading** (${rd.method}): ${rd.primary}${changing}${becoming}`, '', `Seed: \`${rd.seed}\``, '');
    }
    md.push('### Control', '', r.control.answer || '_(no answer)_', '');
    md.push('### Guided', '', r.guided.answer || '_(no answer)_', '', '---', '');
  });
  return md.join('\n');
}

async function main(): Promise<void> {
  let built: { advisor: Advisor; mode: string };
  try {
    built = buildAdvisor();
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
  const { advisor, mode } = built;

  // A single quoted question as argv runs just that one; otherwise the default set.
  const arg = process.argv.slice(2).find((a) => !a.startsWith('-'));
  const questions = arg ? [arg] : DEFAULT_QUESTIONS;

  const startedAt = new Date().toISOString();
  const results: QuestionResult[] = [];

  for (const [i, question] of questions.entries()) {
    console.error(`[${i + 1}/${questions.length}] ${question.slice(0, 72)}…`);
    console.error('  control arm…');
    const control = await advisor.control(question);
    console.error('  guided arm (consulting the oracle)…');
    const guided = await advisor.guided(question);
    if (guided.reading) {
      const becoming = guided.reading.becoming ? ` → ${guided.reading.becoming}` : '';
      console.error(`  cast ${guided.reading.primary}${becoming}  (seed ${guided.reading.seed.slice(0, 12)}…)`);
    }
    results.push({ question, control, guided });
  }

  const here = path.dirname(fileURLToPath(import.meta.url));
  const outDir = path.join(here, '..', 'results');
  await mkdir(outDir, { recursive: true });
  const stamp = startedAt.replace(/[:.]/g, '-');
  const jsonPath = path.join(outDir, `${stamp}.json`);
  const mdPath = path.join(outDir, `${stamp}.md`);
  await writeFile(jsonPath, JSON.stringify({ mode, startedAt, results }, null, 2));
  await writeFile(mdPath, toMarkdown(results, mode, startedAt));

  console.error(`\nDone. ${results.length} question(s).`);
  console.error(`  ${jsonPath}`);
  console.error(`  ${mdPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
