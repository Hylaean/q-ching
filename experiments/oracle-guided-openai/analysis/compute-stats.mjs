// Compute the rigorous stats from the blind codings in this directory.
// Inputs (same dir): stance_map.json, stance_scores_{A,B}.json, hex_scores_{A,B}.json.
// Usage: node experiments/oracle-guided-openai/analysis/compute-stats.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const J = (f) => JSON.parse(readFileSync(path.join(here, f), 'utf8'));

const map = J('stance_map.json');
const sA = J('stance_scores_A.json');
const sB = J('stance_scores_B.json');
const hA = J('hex_scores_A.json');
const hB = J('hex_scores_B.json');

const ids = Object.keys(map);
const missing = ids.filter((id) => sA[id] === undefined || sB[id] === undefined);
if (missing.length) console.error(`WARNING: ${missing.length} ids missing a stance score: ${missing.join(',')}`);

const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const pearson = (x, y) => {
  const mx = mean(x), my = mean(y);
  let n = 0, dx = 0, dy = 0;
  for (let i = 0; i < x.length; i++) { n += (x[i]-mx)*(y[i]-my); dx += (x[i]-mx)**2; dy += (y[i]-my)**2; }
  return dx && dy ? n / Math.sqrt(dx*dy) : NaN;
};
const comb = (n, k) => { let r = 1; for (let i = 0; i < k; i++) r = (r*(n-i))/(i+1); return r; };
const binomGE = (k, n, p = 0.5) => { let s = 0; for (let i = k; i <= n; i++) s += comb(n,i)*p**i*(1-p)**(n-i); return s; };

const stA = ids.map((id) => sA[id]), stB = ids.map((id) => sB[id]);
const stanceExact = ids.filter((id) => sA[id] === sB[id]).length / ids.length;
const stanceWithin1 = ids.filter((id) => Math.abs(sA[id]-sB[id]) <= 1).length / ids.length;
const hexNums = Object.keys(hA);
const hexWithin1 = hexNums.filter((n) => Math.abs(hA[n]-hB[n]) <= 1).length / hexNums.length;
const hexR = pearson(hexNums.map((n)=>hA[n]), hexNums.map((n)=>hB[n]));

const stance = {}; for (const id of ids) stance[id] = (sA[id]+sB[id])/2;
const valence = {}; for (const n of hexNums) valence[n] = (hA[n]+hB[n])/2;

const pairs = {};
for (const id of ids) {
  const { provider, arm, q, hexNum } = map[id];
  ((pairs[provider] ??= {})[q] ??= { hexNum }).hexNum = hexNum;
  pairs[provider][q][arm] = stance[id];
}

const EPS = 0.25;
const sign = (v) => (v > EPS ? 1 : v < -EPS ? -1 : 0);
const rows = [];
for (const [provider, qs] of Object.entries(pairs)) {
  for (const q of Object.keys(qs).map(Number).sort((a,b)=>a-b)) {
    const p = qs[q];
    const shift = p.guided - p.control;
    const val = valence[p.hexNum] ?? 0;
    rows.push({ provider, q, hexNum: p.hexNum, control: p.control, guided: p.guided, shift, valence: val, shiftSign: sign(shift), valSign: sign(val) });
  }
}

const summary = (rs) => {
  const shifts = rs.map((r) => r.shift);
  const changed = rs.filter((r) => Math.abs(r.shift) >= 0.5).length;
  const testable = rs.filter((r) => r.shiftSign !== 0 && r.valSign !== 0);
  const aligned = testable.filter((r) => r.shiftSign === r.valSign).length;
  return {
    n: rs.length,
    controlMean: +mean(rs.map((r)=>r.control)).toFixed(2),
    guidedMean: +mean(rs.map((r)=>r.guided)).toFixed(2),
    meanSignedShift: +mean(shifts).toFixed(2),
    meanAbsShift: +mean(shifts.map(Math.abs)).toFixed(2),
    changed, changedPct: +(100*changed/rs.length).toFixed(0),
    testableN: testable.length, aligned,
    alignedPct: testable.length ? +(100*aligned/testable.length).toFixed(0) : null,
    oneSidedP: testable.length ? +binomGE(aligned, testable.length).toFixed(4) : null,
    shiftValenceR: +pearson(rs.map((r)=>r.shift), rs.map((r)=>r.valence)).toFixed(2),
  };
};

const byProvider = {};
for (const prov of Object.keys(pairs)) byProvider[prov] = summary(rows.filter((r) => r.provider === prov));
const pooled = summary(rows);
const reliability = { stanceR: +pearson(stA,stB).toFixed(2), stanceExact, stanceWithin1, hexR: +hexR.toFixed(2), hexWithin1 };

console.log('reliability:', JSON.stringify(reliability));
for (const [p, s] of Object.entries(byProvider)) console.log(p, JSON.stringify(s));
console.log('pooled', JSON.stringify(pooled));
writeFileSync(path.join(here, 'stats.json'), JSON.stringify({ byProvider, pooled, reliability, rows }, null, 2));
console.log('wrote stats.json');
