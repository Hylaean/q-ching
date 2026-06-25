/**
 * Reuse Codex's "Sign in with ChatGPT" credential to drive a ChatGPT-plan model —
 * the same mechanism OpenClaw and other third-party tools use, which OpenAI supports
 * for personal (non-commercial) use.
 *
 * We read the OAuth token from Codex's `auth.json` and treat it as an opaque bearer
 * credential — we never decode or inspect its claims. It is passed straight to the
 * Codex Responses backend the same way the Codex CLI itself does.
 *
 * Caveats, by design:
 *   • Personal use only. OpenAI scopes ChatGPT-subscription auth to personal, non-
 *     commercial use; for production/multi-user, use a platform API key instead.
 *   • This consumes the token; it does NOT refresh it. Codex refreshes tokens during
 *     its own use — if the call 401s, run any `codex` command (or `codex login`) once
 *     to refresh `auth.json`, then re-run.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { codexHome } from './openai-key.js';

/** The Codex "Responses backend" that accepts ChatGPT-plan OAuth, per the Codex CLI. */
export const DEFAULT_CODEX_BASE_URL = 'https://chatgpt.com/backend-api/codex';

export interface CodexOAuth {
  /** Opaque bearer token — never decoded here. */
  accessToken: string;
  /** ChatGPT account id, sent as the `chatgpt-account-id` header. */
  accountId: string;
  source: string;
}

export function resolveCodexOAuth(): CodexOAuth {
  const authPath = path.join(codexHome(), 'auth.json');
  let auth: { OPENAI_API_KEY?: string | null; tokens?: { access_token?: string; account_id?: string } | null };
  try {
    auth = JSON.parse(readFileSync(authPath, 'utf8'));
  } catch {
    throw new Error(
      `Codex credentials not found at ${authPath}.\n` +
        'Run `codex login` and choose "Sign in with ChatGPT" first.',
    );
  }

  const tokens = auth?.tokens ?? {};
  const accessToken = typeof tokens.access_token === 'string' ? tokens.access_token.trim() : '';
  const accountId = typeof tokens.account_id === 'string' ? tokens.account_id.trim() : '';

  if (!accessToken || !accountId) {
    if (typeof auth?.OPENAI_API_KEY === 'string' && auth.OPENAI_API_KEY.trim()) {
      throw new Error(
        'Codex is signed in with an API key, not ChatGPT. Drop --codex to use the API-key path.',
      );
    }
    throw new Error(
      `No ChatGPT-login tokens found in ${authPath}.\n` +
        'Run `codex login` and choose "Sign in with ChatGPT".',
    );
  }

  return { accessToken, accountId, source: authPath };
}

/** The model Codex is configured to use, read from `config.toml` (config, not a secret). */
export function codexConfiguredModel(): string | null {
  try {
    const cfg = readFileSync(path.join(codexHome(), 'config.toml'), 'utf8');
    const m = cfg.match(/^\s*model\s*=\s*["']([^"']+)["']/m);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}
