#!/usr/bin/env node
import React from 'react';
import { createRequire } from 'node:module';
import { render } from 'ink';
import { App } from './App.js';
import { parseArgs, HELP } from './cli.js';

const parsed = parseArgs(process.argv.slice(2));

// --help / --version / bad flags resolve without a terminal, so handle them
// before the TTY gate below.
if (parsed.kind === 'help') {
  process.stdout.write(HELP + '\n');
  process.exit(0);
}
if (parsed.kind === 'version') {
  const require = createRequire(import.meta.url);
  const { version } = require('../package.json') as { version: string };
  process.stdout.write(`q-ching ${version}\n`);
  process.exit(0);
}
if (parsed.kind === 'error') {
  process.stderr.write(`\n  ${parsed.message}\n  Run  q-ching --help  for usage.\n\n`);
  process.exit(1);
}

// q-ching is an interactive ritual: it needs a real terminal so it can read
// single keypresses (Ink's "raw mode"). When stdin is a pipe, a CI job, or a
// backgrounded process, degrade gracefully instead of throwing a stack trace.
if (!process.stdin.isTTY) {
  process.stderr.write(
    '\n  q-ching needs an interactive terminal.\n' +
      '  Run it directly in your shell:  npm run tui\n\n',
  );
  process.exit(1);
}

// Clear the screen for a clean stage, then mount the app in fullscreen-ish mode.
process.stdout.write('\x1b[2J\x1b[H');

const { waitUntilExit } = render(<App replay={parsed.replay} />, {
  exitOnCtrlC: true,
});

waitUntilExit().then(() => {
  // Leave a calm trailing newline so the prompt returns cleanly.
  process.stdout.write('\n');
});
