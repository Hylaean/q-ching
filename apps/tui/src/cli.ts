/**
 * Tiny, dependency-free CLI argument parsing for q-ching.
 *
 * The terminal app is an interactive ritual, so the surface is deliberately
 * small: the only real flags are the ones that let you *replay* a past reading
 * from its seed. Everything is parsed here (and unit-tested) so `index.tsx`
 * stays a thin entry point.
 */
import { isValidSeed, normalizeSeed, type CastMethod } from '@q-ching/core';

export interface Replay {
  seed: string;
  method: CastMethod;
}

export type ParsedArgs =
  | { kind: 'run'; replay?: Replay }
  | { kind: 'help' }
  | { kind: 'version' }
  | { kind: 'error'; message: string };

/**
 * Parse argv (already sliced past `node script`). Returns a discriminated
 * result the entry point switches on. `--help`/`--version` win over everything.
 */
export function parseArgs(argv: string[]): ParsedArgs {
  if (argv.includes('-h') || argv.includes('--help')) return { kind: 'help' };
  if (argv.includes('-v') || argv.includes('--version')) return { kind: 'version' };

  let seed: string | undefined;
  let method: CastMethod | undefined;

  // Accept both `--flag value` and `--flag=value`.
  const take = (i: number, inline: string | undefined): [string | undefined, number] =>
    inline !== undefined ? [inline, i] : [argv[i + 1], i + 1];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] ?? '';
    const eq = arg.indexOf('=');
    const name = eq === -1 ? arg : arg.slice(0, eq);
    const inline = eq === -1 ? undefined : arg.slice(eq + 1);

    switch (name) {
      case '-s':
      case '--seed': {
        const [value, next] = take(i, inline);
        if (value === undefined || value.startsWith('-')) {
          return { kind: 'error', message: `${name} needs a seed value.` };
        }
        if (!isValidSeed(value)) {
          return {
            kind: 'error',
            message: `that doesn't look like a seed — expected 64 hex characters.`,
          };
        }
        seed = normalizeSeed(value);
        i = next;
        break;
      }
      case '-m':
      case '--method': {
        const [value, next] = take(i, inline);
        if (value !== 'coin' && value !== 'yarrow') {
          return { kind: 'error', message: `--method must be 'coin' or 'yarrow'.` };
        }
        method = value;
        i = next;
        break;
      }
      default:
        return { kind: 'error', message: `unknown option: ${arg}` };
    }
  }

  if (method !== undefined && seed === undefined) {
    return {
      kind: 'error',
      message: `--method only applies with --seed (when replaying). In a fresh cast you choose the method on screen.`,
    };
  }

  if (seed !== undefined) {
    return { kind: 'run', replay: { seed, method: method ?? 'coin' } };
  }
  return { kind: 'run' };
}

/** The `--help` text. Mirrors the replay story the web app tells with a link. */
export const HELP = `
  q-ching — an I-Ching oracle cast from quantum noise and the rhythm of your typing.

  USAGE
    q-ching                     begin a new reading (interactive)
    q-ching --seed <hex>        replay a past reading from its seed
    q-ching --help | --version

  OPTIONS
    -s, --seed <hex>     reproduce a prior cast. Every reading prints a 64-character
                         seed; pass it back here to relive that exact throw.
    -m, --method <name>  coin (default) or yarrow. Use the SAME method the original
                         cast used — the seed alone doesn't carry it.
    -h, --help           show this help and exit
    -v, --version        print the version and exit

  REPLAY
    A reading is fully reproducible from its seed. After any cast, q-ching prints the
    exact command to relive it, for example:

        q-ching --seed 3f9c…(64 hex chars)… --method yarrow

    The same seed always draws the same lines — share it, or keep it to return to a
    throw. (In the web app the same idea is a link: …/?seed=<hex>&method=<name>.)

  q-ching needs a real interactive terminal — it reads single keypresses.
`;
