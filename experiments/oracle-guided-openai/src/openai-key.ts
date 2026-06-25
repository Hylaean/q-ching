/**
 * Resolve an OpenAI API key the way you'd "reuse it from Codex".
 *
 * Lookup order:
 *   1. OPENAI_API_KEY in the environment (highest priority — explicit wins).
 *   2. Codex's credential file, `$CODEX_HOME/auth.json` (default `~/.codex/auth.json`),
 *      when Codex is logged in with an API key (`auth_mode: "apikey"`).
 *
 * If Codex is instead signed in with ChatGPT (`auth_mode: "chatgpt"`), the file holds
 * OAuth tokens, NOT an API key. The standard OpenAI API does not accept those tokens as
 * a Bearer key, so we surface a precise, actionable error rather than failing obscurely.
 */
import { readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** The subset of Codex's auth.json we care about. */
interface CodexAuth {
  auth_mode?: string;
  OPENAI_API_KEY?: string | null;
  tokens?: { access_token?: string; account_id?: string } | null;
}

export interface ResolvedKey {
  key: string;
  /** Human-readable provenance, for logging which credential we used. */
  source: string;
}

/** Codex's home directory: $CODEX_HOME, else ~/.codex. */
export function codexHome(): string {
  const fromEnv = process.env.CODEX_HOME?.trim();
  return fromEnv || path.join(os.homedir(), '.codex');
}

function readCodexAuth(authPath: string): CodexAuth | null {
  try {
    return JSON.parse(readFileSync(authPath, 'utf8')) as CodexAuth;
  } catch {
    return null;
  }
}

export function resolveOpenAIKey(): ResolvedKey {
  const fromEnv = process.env.OPENAI_API_KEY?.trim();
  if (fromEnv) return { key: fromEnv, source: 'OPENAI_API_KEY environment variable' };

  const authPath = path.join(codexHome(), 'auth.json');
  const auth = readCodexAuth(authPath);

  if (!auth) {
    throw new Error(
      [
        'No OpenAI API key found.',
        '  • Set one in your shell:   export OPENAI_API_KEY=sk-...',
        '  • Or log in to Codex with an API key:   codex login --api-key sk-...',
        `    (looked for ${authPath}, which is missing or unreadable)`,
      ].join('\n'),
    );
  }

  const fileKey = typeof auth.OPENAI_API_KEY === 'string' ? auth.OPENAI_API_KEY.trim() : '';
  if (fileKey) return { key: fileKey, source: `Codex auth file (${authPath})` };

  // Codex is present but holds no API key. Most commonly: signed in with ChatGPT (OAuth).
  if (auth.tokens?.access_token) {
    throw new Error(
      [
        'Codex is signed in with ChatGPT (OAuth), not an API key — there is no key to reuse.',
        `${authPath} holds OAuth tokens (auth_mode="${auth.auth_mode ?? 'chatgpt'}"), which the`,
        'OpenAI API will not accept as a Bearer key. To run this experiment, do one of:',
        '  • export OPENAI_API_KEY=sk-...    (create one at https://platform.openai.com/api-keys)',
        '  • re-auth Codex with a key:        codex login --api-key sk-...',
      ].join('\n'),
    );
  }

  throw new Error(
    `No OpenAI API key found in the environment or in ${authPath}.\n` +
      'Set OPENAI_API_KEY, or run `codex login --api-key sk-...`.',
  );
}
