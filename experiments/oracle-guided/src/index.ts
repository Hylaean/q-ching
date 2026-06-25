/**
 * Oracle-guided vs. control — an A/B experiment.
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
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { cast } from '@hylaean/core';
import { formatReading } from './format.js';
import { DEFAULT_QUESTIONS } from './questions.js';

const MODEL = 'claude-opus-4-8';
const MAX_TOKENS = 16000;

const SYSTEM_BASE =
  'You are a thoughtful advisor. The user brings you a real dilemma. Give grounded, ' +
  'specific, honest guidance — engage with the particulars, avoid platitudes, and be ' +
  'willing to make a recommendation.';

const SYSTEM_GUIDED =
  SYSTEM_BASE +
  '\n\nYou have access to the q-ching I-Ching oracle via the `consult_oracle` tool. For ' +
  'this question, FIRST call `consult_oracle`, then let the hexagram it returns — its ' +
  'Judgment, Image, and any changing-line texts — genuinely shape your guidance. Refer to ' +
  'the hexagram explicitly and explain how its imagery bears on the question. Treat the ' +
  'reading as a lens the querent has deliberately chosen to consult; do not dismiss or ' +
  'override it.';

const ORACLE_TOOL: Anthropic.Tool = {
  name: 'consult_oracle',
  description:
    'Cast an I-Ching reading from the q-ching quantum oracle. Returns a hexagram with its ' +
    'Judgment, Image, gloss, changing lines and their texts, and the hexagram it transforms into.',
  input_schema: {
    type: 'object',
    properties: {
      question: { type: 'string', description: "The querent's question." },
      method: { type: 'string', enum: ['coin', 'yarrow'], description: "Casting method (default 'coin')." },
    },
    required: ['question'],
  },
};

interface ReadingSummary {
  seed: string;
  method: string;
  primary: string;
  changingLines: number[];
  becoming: string | null;
}

interface ArmResult {
  answer: string;
  stopReason: string | null;
}

interface QuestionResult {
  question: string;
  control: ArmResult;
  guided: ArmResult & { reading: ReadingSummary | null };
}

function textOf(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
}

function summarize(r: Awaited<ReturnType<typeof cast>>): ReadingSummary {
  return {
    seed: r.seed,
    method: r.method,
    primary: `${r.primary.number}. ${r.primary.name.english}`,
    changingLines: r.changingPositions,
    becoming: r.transformed ? `${r.transformed.number}. ${r.transformed.name.english}` : null,
  };
}

async function controlArm(client: Anthropic, question: string): Promise<ArmResult> {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    thinking: { type: 'adaptive' },
    system: SYSTEM_BASE,
    messages: [{ role: 'user', content: question }],
  });
  return { answer: textOf(res.content), stopReason: res.stop_reason };
}

async function guidedArm(
  client: Anthropic,
  question: string,
): Promise<ArmResult & { reading: ReadingSummary | null }> {
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: question }];
  let reading: ReadingSummary | null = null;

  // Manual tool loop: call → run oracle → feed result back → answer.
  for (let turn = 0; turn < 4; turn++) {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      thinking: { type: 'adaptive' },
      system: SYSTEM_GUIDED,
      tools: [ORACLE_TOOL],
      messages,
    });

    if (res.stop_reason !== 'tool_use') {
      return { answer: textOf(res.content), stopReason: res.stop_reason, reading };
    }

    messages.push({ role: 'assistant', content: res.content });
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of res.content) {
      if (block.type !== 'tool_use' || block.name !== 'consult_oracle') continue;
      const input = block.input as { question?: string; method?: 'coin' | 'yarrow' };
      const r = await cast({ method: input.method, qrng: true });
      if (!reading) reading = summarize(r); // the cast that guided this answer
      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: formatReading(r, input.question ?? question),
      });
    }
    messages.push({ role: 'user', content: toolResults });
  }

  return { answer: '(oracle tool loop did not converge)', stopReason: 'incomplete', reading };
}

function toMarkdown(results: QuestionResult[], startedAt: string): string {
  const md: string[] = [
    '# Oracle-guided vs. control',
    '',
    `Model: \`${MODEL}\` · run: ${startedAt}`,
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
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      'Set ANTHROPIC_API_KEY before running (this calls the Claude API and incurs billed usage).',
    );
    process.exit(1);
  }

  // A single quoted question as argv runs just that one; otherwise the default set.
  const arg = process.argv.slice(2).find((a) => !a.startsWith('-'));
  const questions = arg ? [arg] : DEFAULT_QUESTIONS;

  const client = new Anthropic();
  const startedAt = new Date().toISOString();
  const results: QuestionResult[] = [];

  for (const [i, question] of questions.entries()) {
    console.error(`[${i + 1}/${questions.length}] ${question.slice(0, 72)}…`);
    console.error('  control arm…');
    const control = await controlArm(client, question);
    console.error('  guided arm (consulting the oracle)…');
    const guided = await guidedArm(client, question);
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
  await writeFile(jsonPath, JSON.stringify({ model: MODEL, startedAt, results }, null, 2));
  await writeFile(mdPath, toMarkdown(results, startedAt));

  console.error(`\nDone. ${results.length} question(s).`);
  console.error(`  ${jsonPath}`);
  console.error(`  ${mdPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
