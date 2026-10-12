// node concepts/specimen/verify.mjs
// The detail nobody asked for, checked exhaustively: every coarser splat on the page keeps the
// mass, center and covariance of the finer splats beneath it.

import { neuron, buildTree, moments, level, hodgkinHuxley, DEPTH } from './specimen.js';

const leaves = neuron();
const tree = buildTree(leaves);
let worst = 0;
let checks = 0;
const far = (a, b) => {
  let d = Math.abs(a.w - b.w);
  for (let k = 0; k < 3; k += 1) d = Math.max(d, Math.abs(a.m[k] - b.m[k]));
  for (let k = 0; k < 6; k += 1) d = Math.max(d, Math.abs(a.S[k] - b.S[k]));
  return d;
};

if (leaves.length !== 2 ** DEPTH) throw new Error(`expected ${2 ** DEPTH} leaves, got ${leaves.length}`);

// 1. Every one of the 4,095 merged splats, against all the leaves underneath it.
const under = (i) => (i >= leaves.length ? [tree.nodes[i]] : [...under(2 * i), ...under(2 * i + 1)]);
for (let i = 1; i < leaves.length; i += 1) {
  worst = Math.max(worst, far(tree.nodes[i], moments(under(i))));
  checks += 1;
}

// 2. Every one of the 13 levels, taken whole, against the finest.
const finest = moments(leaves);
for (let L = 0; L <= DEPTH; L += 1) {
  const here = level(tree, L);
  if (here.length !== 2 ** L) throw new Error(`level ${L} holds ${here.length} splats`);
  worst = Math.max(worst, far(moments(here), finest));
  checks += 1;
}

// 3. Every covariance is a real one: symmetric by construction, and positive definite.
for (let i = 1; i < tree.nodes.length; i += 1) {
  const [xx, yy, zz, xy, xz, yz] = tree.nodes[i].S;
  const det = xx * (yy * zz - yz * yz) - xy * (xy * zz - yz * xz) + xz * (xy * yz - yy * xz);
  if (!(xx > 0 && xx * yy - xy * xy > 0 && det > 0)) throw new Error(`node ${i} is not positive definite`);
  checks += 1;
}

if (worst > 1e-12) throw new Error(`moments drift by ${worst}`);

const hh = hodgkinHuxley();
if (!(hh.peak > 20 && hh.peak < 50 && hh.trough < -70 && hh.trough > -77)) throw new Error(`implausible spike: ${hh.peak}, ${hh.trough}`);
if (Math.abs(hodgkinHuxley({ current: 0 }).peak - -65) > 0.05) throw new Error('the membrane does not rest at −65 mV');
if (hodgkinHuxley({ current: 2 }).peak > -50) throw new Error('a weak pulse should not fire');

console.log(`ok · ${checks} checks · largest drift in mass, center or covariance ${worst.toExponential(2)}`);
console.log(`center ${finest.m.map((v) => v.toFixed(12)).join(', ')} · σ ${finest.S.slice(0, 3).map((v) => Math.sqrt(v).toFixed(4)).join(', ')}`);
console.log(`spike: rest ${hh.rest} mV, peak ${hh.peak.toFixed(1)} mV, undershoot ${hh.trough.toFixed(1)} mV`);
