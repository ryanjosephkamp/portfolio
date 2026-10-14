#!/usr/bin/env node
// Checks the page's count and its sand, exhaustively.
//
//   node concepts/resonance/tools/check-figures.mjs
//
// 1. Every (n, m, s) with n and m from 0 to 4 and s = +1 or −1 is sampled on
//    a grid: 50 of them. Those that never swing are dropped, and two that are
//    the same figure (the same swing, or its negative, which has the same
//    still lines) count once. The page says 24 are left; this counts them.
// 2. The catalog the page uses lists exactly those 24, in pitch order.
// 3. For every one of the 24, sand scattered evenly and rung for four
//    seconds ends up on that figure's still lines.
// Also: every figure's pitch is a whole multiple of the lowest, and the 24
// figures share 14 pitches, as the page says.
//
// Exits 1 if any of it fails.

import { catalog, swing, Sand, mulberry, KMAX, BASE_HZ } from '../plate.js';

const G = 41;
const field = (f) => {
  const v = new Float64Array(G * G);
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) v[j * G + i] = swing(f, i / (G - 1), j / (G - 1)).w;
  return v;
};
const same = (a, b) => {
  let plus = 0;
  let minus = 0;
  for (let i = 0; i < a.length; i++) {
    plus = Math.max(plus, Math.abs(a[i] - b[i]));
    minus = Math.max(minus, Math.abs(a[i] + b[i]));
  }
  return Math.min(plus, minus) < 1e-9;
};

let failed = false;
const fail = (msg) => {
  failed = true;
  console.log('FAIL  ' + msg);
};

// 1. Brute force over all 50.
const distinct = [];
let tried = 0;
for (let n = 0; n <= KMAX; n++)
  for (let m = 0; m <= KMAX; m++)
    for (const s of [1, -1]) {
      tried++;
      const v = field({ n, m, s });
      let min = Infinity;
      let max = -Infinity;
      for (const x of v) {
        if (x < min) min = x;
        if (x > max) max = x;
      }
      if (max - min < 1e-9) continue; // no swing, or the same everywhere: no still lines
      if (!distinct.some((d) => same(d.v, v))) distinct.push({ n, m, s, v });
    }
console.log(`${tried} combinations, ${distinct.length} distinct figures`);
if (distinct.length !== 24) fail(`expected 24 distinct figures, counted ${distinct.length}`);

// 2. The catalog is those 24, in pitch order.
const cat = catalog();
if (cat.length !== distinct.length) fail(`the catalog lists ${cat.length}`);
for (const d of distinct) if (!cat.some((f) => same(field(f), d.v))) fail(`missing from the catalog: ${d.n}, ${d.m}, ${d.s}`);
for (let i = 1; i < cat.length; i++) if (cat[i].hz < cat[i - 1].hz) fail(`out of pitch order at ${i + 1}`);
for (const f of cat) if (Math.abs(f.hz - BASE_HZ * (f.n * f.n + f.m * f.m)) > 1e-9) fail(`pitch of figure ${f.number}`);

// Every pitch is a whole multiple of the lowest, and there are 14 of them.
const pitches = new Set(cat.map((f) => f.k));
for (const f of cat) if (!Number.isInteger(f.k) || Math.abs(f.hz / cat[0].hz - f.k) > 1e-9) fail(`figure ${f.number} is not a whole multiple`);
console.log(`${pitches.size} pitches: ${[...pitches].join(', ')} × the lowest`);
if (pitches.size !== 14) fail(`expected 14 pitches, counted ${pitches.size}`);

// 3. The sand finds every figure.
let worst = 1;
for (const f of cat) {
  const sand = new Sand(6000, mulberry(1000 + f.number));
  const before = sand.share(f, 6000);
  for (let t = 0; t < 4 * 60; t++) sand.step(1 / 60, [{ ...f, a: 1 }]);
  const after = sand.share(f, 6000);
  worst = Math.min(worst, after);
  const sign = f.s > 0 ? '+' : '−';
  console.log(`fig. ${String(f.number).padStart(2)}  n ${f.n} m ${f.m} ${sign}  ${f.hz.toFixed(0).padStart(4)} Hz  on a still line: ${(before * 100).toFixed(0)}% → ${(after * 100).toFixed(0)}%`);
  if (after < 0.7) fail(`figure ${f.number} settled to only ${(after * 100).toFixed(0)}%`);
}
console.log(`worst settle: ${(worst * 100).toFixed(0)}%`);
console.log(failed ? 'FAILED' : 'ok');
process.exit(failed ? 1 : 0);
