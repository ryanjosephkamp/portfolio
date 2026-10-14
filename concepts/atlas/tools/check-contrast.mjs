#!/usr/bin/env node
// Checks that every edition holds its contrast, and that the two editions with a dial hold it at
// every position of the dial.
//
//   node concepts/atlas/tools/check-contrast.mjs
//
// It reads each edition's colors out of styles.css (the :root block is Field, in color; the
// others override it), and the dials out of editions.js. For each pair of text and ground the
// page uses it works out the WCAG contrast ratio; a color with some see-through in it is laid
// over its ground first. Text must reach 4.5 to 1; rules and frames, 1.5 to 1. A dial is turned
// through every tenth of a degree, and each position must also fit inside sRGB as it is, with
// nothing clipped, so lightness and chroma really are the same all the way round.
//
// Exits 1 if anything falls short.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DIALS, DEFAULT_EDITION, hexOf, linearOf, inGamut } from '../editions.js';

const read = (rel) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');
const css = read('../styles.css').replace(/\/\*[\s\S]*?\*\//g, '');
const html = read('../index.html');

// Every rule whose selectors set color tokens on the root: the base set, each edition, and the
// sheets of an edition that wash in a color of their own.
const base = {};
const editions = {};
const sheets = {};
for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const tokens = Object.fromEntries([...m[2].matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((t) => [t[1], t[2].trim()]));
  if (!Object.keys(tokens).length) continue;
  for (const sel of m[1].split(',').map((x) => x.trim())) {
    let e;
    if (sel === ':root') Object.assign(base, tokens);
    else if ((e = sel.match(/^:root\[data-scheme='([\w-]+)'\]$/))) Object.assign((editions[e[1]] ??= {}), tokens);
    else if ((e = sel.match(/^:root\[data-scheme='([\w-]+)'\] (#[\w-]+)$/))) (sheets[e[1]] ??= []).push([e[2], tokens['--gold']]);
  }
}
const names = [...html.matchAll(/data-scheme="([\w-]+)" data-name/g)].map((m) => m[1]);

const parse = (text) => {
  const hex = text.match(/^#([0-9a-f]{6})$/i);
  if (hex) return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16)).concat(1);
  const fn = text.match(/^rgba?\(([^)]+)\)$/);
  if (fn) {
    const p = fn[1].split(',').map(Number);
    return [p[0], p[1], p[2], p[3] ?? 1];
  }
  throw new Error(`cannot read the color ${text}`);
};
const over = (top, under) => top.slice(0, 3).map((c, i) => c * top[3] + under[i] * (1 - top[3]));
const lum = (rgb) => {
  const [r, g, b] = rgb.map((c) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (fg, bg) => {
  const under = parse(bg);
  const a = lum(over(parse(fg), under));
  const b = lum(under);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

const GROUNDS = ['--ink', '--ink-lift', '--ink-deep', '--well'];
// [what, foreground, grounds, least ratio]. `--gold` stands for the edition's color.
const PAIRS = [
  ['type', '--line', GROUNDS, 4.5],
  ['quieter type', '--dim', GROUNDS, 4.5],
  ["the edition's color as type and marks", '--gold', GROUNDS, 4.5],
  ['type on a pressed key', '--ink', ['--gold'], 4.5],
  ['rules and frames', '--faint', GROUNDS, 1.5],
];

let failed = false;
const fail = (text) => {
  failed = true;
  console.log(`FAIL  ${text}`);
};

// The least ratio of each pair for one set of tokens; failures are reported as they are found.
function measure(name, t, where = '') {
  const least = {};
  for (const [what, fg, grounds, need] of PAIRS)
    for (const bg of grounds) {
      const r = ratio(t[fg], t[bg]);
      least[what] = Math.min(least[what] ?? Infinity, r);
      if (r < need) fail(`${name}${where}: ${what}, ${fg} on ${bg} is ${r.toFixed(2)} to 1, needs ${need}`);
    }
  return least;
}

for (const name of names) {
  const t = name === DEFAULT_EDITION ? { ...base } : { ...base, ...(editions[name] || fail(`${name}: no tokens in styles.css`)) };
  const d = DIALS[name];
  if (!d) {
    const least = measure(name, t);
    for (const [sheet, gold] of sheets[name] || []) measure(name, { ...t, '--gold': gold }, ` (${sheet})`);
    console.log(`${name.padEnd(12)} type ${least.type.toFixed(1)}, its color ${least["the edition's color as type and marks"].toFixed(1)}, a pressed key ${least['type on a pressed key'].toFixed(1)} to 1 at the least`);
    continue;
  }
  // The color as printed is the dial at its own hue.
  if (t['--gold'].toLowerCase() !== hexOf(d.l, d.c, d.hue)) fail(`${name}: styles.css prints ${t['--gold']}, the dial makes ${hexOf(d.l, d.c, d.hue)} at ${d.hue} degrees`);
  const low = {};
  const high = {};
  let clipped = 0;
  for (let i = 0; i < 3600; i++) {
    const h = i / 10;
    if (!inGamut(linearOf(d.l, d.c, h))) clipped++;
    const least = measure(name, { ...t, '--gold': hexOf(d.l, d.c, h) }, ` at ${h} degrees`);
    for (const k in least) {
      low[k] = Math.min(low[k] ?? Infinity, least[k]);
      high[k] = Math.max(high[k] ?? 0, least[k]);
    }
  }
  if (clipped) fail(`${name}: ${clipped} of 3,600 dial positions fall outside sRGB at L ${d.l}, C ${d.c}`);
  const k = "the edition's color as type and marks";
  console.log(`${name.padEnd(12)} type ${low.type.toFixed(1)}; turned through 3,600 positions, its color ${low[k].toFixed(1)} to ${high[k].toFixed(1)}, a pressed key ${low['type on a pressed key'].toFixed(1)} to ${high['type on a pressed key'].toFixed(1)} to 1; none clipped`);
}
console.log(failed ? 'FAILED' : 'ok');
process.exit(failed ? 1 : 0);
