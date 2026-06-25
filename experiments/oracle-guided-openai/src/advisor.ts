/**
 * The experiment's two arms, abstracted over the backend so the orchestrator in
 * index.ts is identical whether we talk to the OpenAI Platform API (with an API key,
 * via Chat Completions) or the Codex Responses backend (with a ChatGPT-plan OAuth
 * token). Both arms — control and oracle-guided — are otherwise identical, which is
 * what isolates the oracle's effect.
 */
import OpenAI from 'openai';
import { cast } from '@hylaean/core';
import { formatReading } from './format.js';

export const MAX_TOKENS = 16000;

type Effort = 'minimal' | 'low' | 'medium' | 'high';
const rawEffort = (process.env.OPENAI_REASONING_EFFORT?.trim() || 'medium').toLowerCase();
/** Reasoning effort — the OpenAI counterpart of adaptive thinking. `none` omits it. */
export const REASONING_EFFORT: Effort | null = rawEffort === 'none' ? null : (rawEffort as Effort);

export const SYSTEM_BASE =
  'You are a thoughtful advisor. The user brings you a real dilemma. Give grounded, ' +
  'specific, honest guidance — engage with the particulars, avoid platitudes, and be ' +
  'willing to make a recommendation.';

export const SYSTEM_GUIDED =
  SYSTEM_BASE +
  '\n\nYou have access to the q-ching I-Ching oracle via the `consult_oracle` tool. For ' +
  'this question, FIRST call `consult_oracle`, then let the hexagram it returns — its ' +
  'Judgment, Image, and any changing-line texts — genuinely shape your guidance. Refer to ' +
  'the hexagram explicitly and explain how its imagery bears on the question. Treat the ' +
  'reading as a lens the querent has deliberately chosen to consult; do not dismiss or ' +
  'override it.';

const ORACLE_DESCRIPTION =
  'Cast an I-Ching reading from the q-ching quantum oracle. Returns a hexagram with its ' +
  'Judgment, Image, gloss, changing lines and their texts, and the hexagram it transforms into.';

const ORACLE_PARAMETERS = {
  type: 'object',
  properties: {
    question: { type: 'string', description: "The querent's question." },
    method: { type: 'string', enum: ['coin', 'yarrow'], description: "Casting method (default 'coin')." },
  },
  required: ['question'],
  additionalProperties: false,
} as const;

export interface ReadingSummary {
  seed: string;
  method: string;
  primary: string;
  changingLines: number[];
  becoming: string | null;
}

export interface ArmResult {
  answer: string;
  stopReason: string | null;
}

export type GuidedResult = ArmResult & { reading: ReadingSummary | null };

export function summarize(r: Awaited<ReturnType<typeof cast>>): ReadingSummary {
  return {
    seed: r.seed,
    method: r.method,
    primary: `${r.primary.number}. ${r.primary.name.english}`,
    changingLines: r.changingPositions,
    becoming: r.transformed ? `${r.transformed.number}. ${r.transformed.name.english}` : null,
  };
}

/** Run the oracle for a tool call's raw JSON arguments. */
async function runOracle(
  rawArgs: string,
  fallbackQuestion: string,
): Promise<{ text: string; summary: ReadingSummary }> {
  let input: { question?: string; method?: 'coin' | 'yarrow' } = {};
  try {
    input = JSON.parse(rawArgs || '{}');
  } catch {
    /* malformed args — fall back to defaults */
  }
  const r = await cast({ method: input.method, qrng: true });
  return { text: formatReading(r, input.question ?? fallbackQuestion), summary: summarize(r) };
}

export interface Advisor {
  readonly model: string;
  control(question: string): Promise<ArmResult>;
  guided(question: string): Promise<GuidedResult>;
}

// ─── API-key backend: OpenAI Platform via Chat Completions ────────────────────

const ORACLE_TOOL_CC: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: { name: 'consult_oracle', description: ORACLE_DESCRIPTION, parameters: ORACLE_PARAMETERS },
};

export class ChatCompletionsAdvisor implements Advisor {
  constructor(
    private readonly client: OpenAI,
    readonly model: string,
  ) {}

  private reasoning(): { reasoning_effort?: Effort } {
    return REASONING_EFFORT ? { reasoning_effort: REASONING_EFFORT } : {};
  }

  async control(question: string): Promise<ArmResult> {
    const res = await this.client.chat.completions.create({
      model: this.model,
      max_completion_tokens: MAX_TOKENS,
      ...this.reasoning(),
      messages: [
        { role: 'system', content: SYSTEM_BASE },
        { role: 'user', content: question },
      ],
    });
    const c = res.choices[0];
    return { answer: (c?.message.content ?? '').trim(), stopReason: c?.finish_reason ?? null };
  }

  async guided(question: string): Promise<GuidedResult> {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_GUIDED },
      { role: 'user', content: question },
    ];
    let reading: ReadingSummary | null = null;

    for (let turn = 0; turn < 4; turn++) {
      const res = await this.client.chat.completions.create({
        model: this.model,
        max_completion_tokens: MAX_TOKENS,
        ...this.reasoning(),
        tools: [ORACLE_TOOL_CC],
        messages,
      });
      const c = res.choices[0];
      const msg = c?.message;
      const calls = msg?.tool_calls ?? [];

      if (!msg || calls.length === 0) {
        return { answer: (msg?.content ?? '').trim(), stopReason: c?.finish_reason ?? null, reading };
      }

      messages.push(msg);
      for (const tc of calls) {
        if (!('function' in tc) || tc.function.name !== 'consult_oracle') {
          const name = 'function' in tc ? tc.function.name : tc.type;
          messages.push({ role: 'tool', tool_call_id: tc.id, content: `Unsupported tool call: ${name}` });
          continue;
        }
        const { text, summary } = await runOracle(tc.function.arguments, question);
        if (!reading) reading = summary;
        messages.push({ role: 'tool', tool_call_id: tc.id, content: text });
      }
    }

    return { answer: '(oracle tool loop did not converge)', stopReason: 'incomplete', reading };
  }
}

// ─── ChatGPT-plan backend: Codex Responses backend via the Responses API ──────

const ORACLE_TOOL_RESP: OpenAI.Responses.FunctionTool = {
  type: 'function',
  name: 'consult_oracle',
  description: ORACLE_DESCRIPTION,
  parameters: ORACLE_PARAMETERS as unknown as Record<string, unknown>,
  strict: false,
};

/** Pull assistant text from message output items, accepting any `.text`-bearing part. */
function textFromItems(items: readonly OpenAI.Responses.ResponseOutputItem[]): string {
  const parts: string[] = [];
  for (const item of items) {
    if (item.type !== 'message') continue;
    for (const part of (item as { content?: Array<{ text?: unknown }> }).content ?? []) {
      if (typeof part?.text === 'string') parts.push(part.text);
    }
  }
  return parts.join('').trim();
}

export class CodexResponsesAdvisor implements Advisor {
  constructor(
    private readonly client: OpenAI,
    readonly model: string,
  ) {}

  private extras(): Record<string, unknown> {
    // store:false is required by the Codex backend (no server-side state); when reasoning
    // is on we ask for encrypted reasoning so it can be replayed across tool turns.
    const base: Record<string, unknown> = { store: false };
    if (REASONING_EFFORT) {
      base.reasoning = { effort: REASONING_EFFORT };
      base.include = ['reasoning.encrypted_content'];
    }
    return base;
  }

  /**
   * Run one turn against the Codex backend. That backend leaves `finalResponse().output`
   * EMPTY and delivers everything through stream events instead — so we collect the text
   * deltas and the completed output items (message, reasoning, function_call) live.
   */
  private async run(
    instructions: string,
    input: OpenAI.Responses.ResponseInput,
    withTool: boolean,
  ): Promise<{ status: string | null; text: string; items: OpenAI.Responses.ResponseOutputItem[] }> {
    const stream = await this.client.responses.stream({
      model: this.model,
      instructions,
      input,
      ...(withTool ? { tools: [ORACLE_TOOL_RESP], tool_choice: 'auto', parallel_tool_calls: false } : {}),
      ...this.extras(),
    });

    let streamed = '';
    const collected: OpenAI.Responses.ResponseOutputItem[] = [];
    stream.on('event', (e) => {
      if (e.type === 'response.output_text.delta') streamed += e.delta ?? '';
      else if (e.type === 'response.output_item.done') collected.push(e.item);
    });

    const res = await stream.finalResponse();
    const items = res.output?.length ? res.output : collected;
    const text = streamed.trim() || textFromItems(items);
    if (process.env.QCHING_DEBUG) {
      console.error(
        `[debug] status=${res.status} items=${JSON.stringify(items.map((o) => o.type))} text_len=${text.length}`,
      );
    }
    return { status: res.status ?? null, text, items };
  }

  async control(question: string): Promise<ArmResult> {
    const { status, text } = await this.run(SYSTEM_BASE, [{ role: 'user', content: question }], false);
    return { answer: text, stopReason: status };
  }

  async guided(question: string): Promise<GuidedResult> {
    let input: OpenAI.Responses.ResponseInput = [{ role: 'user', content: question }];
    let reading: ReadingSummary | null = null;

    for (let turn = 0; turn < 4; turn++) {
      const { status, text, items } = await this.run(SYSTEM_GUIDED, input, true);
      const calls = items.filter(
        (o): o is OpenAI.Responses.ResponseFunctionToolCall => o.type === 'function_call',
      );

      if (calls.length === 0) {
        return { answer: text, stopReason: status, reading };
      }

      // Carry the model's own output items (incl. reasoning + the call) forward, then answer.
      input = [...input, ...(items as unknown as OpenAI.Responses.ResponseInput)];
      for (const call of calls) {
        if (call.name !== 'consult_oracle') {
          input.push({ type: 'function_call_output', call_id: call.call_id, output: 'Unsupported tool' });
          continue;
        }
        const { text: oracleText, summary } = await runOracle(call.arguments, question);
        if (!reading) reading = summary;
        input.push({ type: 'function_call_output', call_id: call.call_id, output: oracleText });
      }
    }

    return { answer: '(oracle tool loop did not converge)', stopReason: 'incomplete', reading };
  }
}
