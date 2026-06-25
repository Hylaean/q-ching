#!/usr/bin/env node
/**
 * q-ching MCP server.
 *
 * Exposes the q-ching I-Ching oracle as a Model Context Protocol tool over
 * stdio, so any MCP client (Claude Desktop, Claude Code, other agents) can cast
 * a reading. Runs the dependency-free @hylaean/core engine directly — and,
 * being a Node process with no browser CORS, it reaches the live quantum
 * sources the same way the terminal app does.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { cast } from '@hylaean/core';
import { formatReading } from './format.js';

const server = new McpServer({ name: 'q-ching', version: '0.1.0' });

server.registerTool(
  'cast_reading',
  {
    title: 'Cast an I-Ching reading',
    description:
      'Cast an I-Ching (Book of Changes) reading from the q-ching oracle, which mixes ' +
      'true/quantum randomness (the NIST beacon, ANU, RANDOM.ORG) with a local cryptographic ' +
      'RNG. Returns the primary hexagram with its Judgment, Image, and one-line gloss; the ' +
      'changing lines and their texts; the hexagram it transforms into; and a reproducible hex ' +
      'seed (pass it back as `seed` to replay the exact same reading). Call this when the user ' +
      'poses a question to the oracle or wants a hexagram cast to reflect on a situation.',
    inputSchema: {
      question: z.string().optional().describe("The querent's question, recorded for context."),
      method: z
        .enum(['coin', 'yarrow'])
        .optional()
        .describe("Casting method: 'coin' (default) or the traditional 'yarrow' (changing lines rarer)."),
      seed: z
        .string()
        .optional()
        .describe('Reproduce a prior reading exactly from its hex seed (ignores the live entropy sources).'),
      quantum: z
        .boolean()
        .optional()
        .describe('Fold in live quantum entropy (default true). Set false to skip the network calls and use local entropy only.'),
      contextHash: z
        .string()
        .optional()
        .describe(
          "Your 'gesture': a hash or digest of your current conversation context, folded into the " +
            'entropy pool as the calling agent’s own contribution to the cast — the analog of a human ' +
            'querent stirring with their hand while holding the question in mind. Send e.g. a hex digest of ' +
            'your recent context, a summary string, or a nonce; it is hashed together with every other source, ' +
            'so its form does not matter. Unlike a human gesture it carries little true randomness (the quantum ' +
            'and local CSPRNG sources do that), but a fresh agent context is genuinely hard to reproduce, and ' +
            'this is how you participate in the reading rather than merely observe it. Ignored when `seed` is set ' +
            '(a replay is deterministic).',
        ),
    },
  },
  async ({ question, method, seed, quantum, contextHash }) => {
    // A seed reproduces a cast deterministically, so the live sources (quantum,
    // and the agent's own context gesture) are skipped when one is supplied.
    const contextFolded = !seed && !!contextHash;
    const reading = await cast({
      method,
      seed,
      userEntropy: contextFolded ? new TextEncoder().encode(contextHash) : undefined,
      qrng: seed ? undefined : quantum === false ? undefined : true,
    });
    return { content: [{ type: 'text', text: formatReading(reading, question, { contextFolded }) }] };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
