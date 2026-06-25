#!/usr/bin/env node
/**
 * q-ching MCP server.
 *
 * Exposes the q-ching I-Ching oracle as a Model Context Protocol tool over
 * stdio, so any MCP client (Claude Desktop, Claude Code, other agents) can cast
 * a reading. Runs the dependency-free @q-ching/core engine directly — and,
 * being a Node process with no browser CORS, it reaches the live quantum
 * sources the same way the terminal app does.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { cast } from '@q-ching/core';
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
    },
  },
  async ({ question, method, seed, quantum }) => {
    const reading = await cast({
      method,
      seed,
      // A seed reproduces a cast deterministically, so skip the live gather then.
      qrng: seed ? undefined : quantum === false ? undefined : true,
    });
    return { content: [{ type: 'text', text: formatReading(reading, question) }] };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
