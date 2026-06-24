#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { App } from './App.js';

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

const { waitUntilExit } = render(<App />, {
  exitOnCtrlC: true,
});

waitUntilExit().then(() => {
  // Leave a calm trailing newline so the prompt returns cleanly.
  process.stdout.write('\n');
});
