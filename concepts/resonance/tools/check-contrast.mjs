#!/usr/bin/env node
// Checks that every plate scheme holds text contrast, for every pairing of
// text and ground the stylesheet uses.
//
//   node concepts/resonance/tools/check-contrast.mjs
//
// It reads the schemes out of styles.css (brass is the base set; the others
// override it) and works out the WCAG contrast ratio of each pair. Text must
// reach 4.5 to 1 on every stop of every gradient it sits on; the focus ring,
// which is not text, must reach 3 to 1. A color with some see-through in it
// is laid over its ground first.
//
// Exits 1 if any pair falls short.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const css = readFileSync(fileURLToPath(new URL('../styles.css', import.meta.url)), 'utf8');

const block = (selector) => {
  const at = css.indexOf(selector + ' {');
  if (at < 0) throw new Error('no block for ' + selector);
  const body = css.slice(css.indexOf('{', at) + 1, css.indexOf('\n}', at));
  const out = {};
  for (const m of body.matchAll(/(--[\w-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
};
const base = block(':root');
const names = ['brass', ...[...css.matchAll(/:root\[data-plate='(\w+)'\] \{/g)].map((m) => m[1])];

// A color as [r, g, b, a], from #rgb, #rrggbb or rgba(r, g, b, a).
const parse = (text) => {
  const hex = text.match(/^#([0-9a-f]{6})$/i);
  if (hex) return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16)).concat(1);
  const fn = text.match(/^rgba?\(([^)]+)\)$/);
  if (fn) {
    const p = fn[1].split(',').map((x) => Number(x));
    return [p[0], p[1], p[2], p[3] ?? 1];
  }
  throw new Error('cannot read color ' + text);
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

// [what, text token, ground tokens, least ratio]
const PAIRS = [
  ['type on the page', '--ink', ['--g1', '--g2', '--g3', '--g4', '--g5'], 4.5],
  ['type on a key', '--ink', ['--metal-hi', '--metal-pale', '--key-hover'], 4.5],
  ['type on a loud key or the footer', '--on-ink', ['--ink', '--ink-hover'], 4.5],
  ['type on the listening key', '--on-accent', ['--accent'], 4.5],
  ['marks on a screen', '--mark', ['--s1', '--s2', '--s3'], 4.5],
  ['numbers on a small plate', '--mark', ['--p1', '--p2', '--p4'], 4.5],
  ['the focus ring on the page', '--ink', ['--g1', '--g2', '--g3', '--g4', '--g5'], 3],
  ['sand on the plate', '--ink', ['--p1', '--p2', '--p3', '--p4'], 3],
];

let failed = false;
for (const name of names) {
  const t = name === 'brass' ? base : { ...base, ...block(`:root[data-plate='${name}']`) };
  let least = Infinity;
  let where = '';
  for (const [what, fg, grounds, need] of PAIRS)
    for (const bg of grounds) {
      const r = ratio(t[fg], t[bg]);
      if (r < need) {
        failed = true;
        console.log(`FAIL  ${name}: ${what}, ${fg} on ${bg} is ${r.toFixed(2)} to 1, needs ${need}`);
      }
      if (need >= 4.5 && r < least) {
        least = r;
        where = `${what} (${fg} on ${bg})`;
      }
    }
  const page = Math.min(...['--g1', '--g2', '--g3', '--g4', '--g5'].map((g) => ratio(t['--ink'], t[g])));
  console.log(`${name.padEnd(9)} type on the page ${page.toFixed(1)} to 1 at its weakest; least text pair ${least.toFixed(1)} to 1: ${where}`);
}
console.log(failed ? 'FAILED' : 'ok');
process.exit(failed ? 1 : 0);
