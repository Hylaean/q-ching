// Build the blind-judging packets from the run traces in ../runs.
// Usage: node experiments/oracle-guided-openai/analysis/build-packets.mjs
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hexagramByNumber } from '@hylaean/core';

const here = path.dirname(fileURLToPath(import.meta.url));
const runsDir = path.resolve(here, '..', 'runs');

// Fixed act(+)/wait(−) poles per question index (must match src/questions.ts order).
const AXES = [
  { plus: 'leave for the startup', minus: 'stay in the stable job' },
  { plus: 'reach out to the friend', minus: 'let the friendship rest' },
  { plus: 'move to the new city', minus: 'stay near family' },
  { plus: 'push back hard against shipping fast', minus: 'defer and go along with shipping' },
  { plus: 'take the management promotion', minus: 'keep the current hands-on role' },
  { plus: 'confront the friend about the money', minus: 'let it go to keep the peace' },
  { plus: 'quit the degree and change direction', minus: 'stay the course and finish it' },
  { plus: 'invest the cash now', minus: 'wait for more stability' },
  { plus: 'raise moving the parent closer now', minus: 'wait and respect their independence' },
  { plus: 'say yes to the talk and stretch', minus: 'decline and stay in your lane' },
];

const providers = {};
for (const f of readdirSync(runsDir).filter((f) => f.endsWith('.json'))) {
  const d = JSON.parse(readFileSync(path.join(runsDir, f), 'utf8'));
  providers[d.mode] = d;
}

const items = [];
const map = {};
const hexNums = new Set();
let idc = 0;
for (const [mode, d] of Object.entries(providers)) {
  d.results.forEach((r, q) => {
    if (r.error) return;
    const num = r.guided.reading ? parseInt(r.guided.reading.primary, 10) : null;
    if (num) hexNums.add(num);
    for (const arm of ['control', 'guided']) {
      const answer = r[arm].answer;
      if (!answer || answer.length < 50) return;
      const id = 'A' + String(idc++).padStart(3, '0'); // id is assigned BEFORE the shuffle
      items.push({ id, question: r.question, act_pole: AXES[q].plus, wait_pole: AXES[q].minus, answer });
      map[id] = { provider: mode, arm, q, hexNum: num };
    }
  });
}

// Shuffle presentation order so a rater can't pair control/guided. (id↔content is fixed above.)
for (let i = items.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [items[i], items[j]] = [items[j], items[i]];
}

const hexagrams = [...hexNums].sort((a, b) => a - b).map((n) => {
  const h = hexagramByNumber(n);
  return { number: n, name: h.name.english, judgment: h.judgment, image: h.image };
});

writeFileSync(path.join(here, 'stance_items.json'), JSON.stringify(items, null, 2));
writeFileSync(path.join(here, 'stance_map.json'), JSON.stringify(map, null, 2));
writeFileSync(path.join(here, 'hexagrams.json'), JSON.stringify(hexagrams, null, 2));
console.log(`providers: ${Object.keys(providers).join(', ')}`);
console.log(`stance items: ${items.length} | unique hexagrams: ${hexagrams.length}`);
