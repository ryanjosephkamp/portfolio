#!/usr/bin/env node
// Checks the detail in the hero: "λ measured from the fringes".
//
//   node concepts/ripple/check.mjs
//
// With two dippers it runs the water at every frequency, speed and spacing
// on a grid across the controls' whole range, at both tank shapes, lets the pattern
// settle, measures the wavelength from the bright lines the way the page
// does, and compares it with c ÷ f. It also checks the glass on the light
// bench against the index its data sheet prints. Exits 1 on any miss.

import { Tank, fringeWavelength, MEASURABLE, FREQ, SPEED } from './sim.js';
import { MARGIN, CELLS_PER_CM, tankLayout, arcRadius } from './layout.js';
import { sellmeier } from './bench.js';

const TOLERANCE = 0.05;
const sizes = [
  { w: 48, h: 27 }, // wide screens
  { w: 24, h: 34 }, // phones
];
let checked = 0;
let skipped = 0;
let worst = 0;
let worstAt = '';
const misses = [];

for (const vis of sizes)
  for (const setup of ['two'])
    for (let f = FREQ[0]; f <= FREQ[1]; f += 1)
      for (let c = SPEED[0]; c <= SPEED[1]; c += 5)
        for (let spacing = 2; spacing <= 14; spacing += 2) {
          const tank = new Tank({ width: vis.w + 2 * MARGIN, depth: vis.h + 2 * MARGIN, nx: (vis.w + 2 * MARGIN) * CELLS_PER_CM, beach: MARGIN });
          const L = tankLayout({ setup, spacing, width: 1 }, vis);
          tank.c = c;
          tank.f = f;
          tank.sources = L.sources;
          tank.line = L.line;
          tank.setBarrier(L.barrier);
          const R = arcRadius(L.pair, vis);
          const settle = (R + 8) / c + 1.2;
          for (let t = 0; t < settle; t += 0.02) tank.advance(0.02, { maxSteps: 1e6 });
          const lambda = c / f;
          const got = fringeWavelength(tank, L.pair, R);
          const where = `${vis.w}×${vis.h} ${setup} f=${f} c=${c} d=${L.pair.d}`;
          // The page shows a measurement only while λ ≤ 0.6 d.
          const expectLine = lambda / L.pair.d <= MEASURABLE;
          if (got === null) {
            if (expectLine) misses.push(`${where}: no line found, expected λ = ${lambda.toFixed(2)}`);
            else skipped++;
            continue;
          }
          if (!expectLine) {
            skipped++;
            continue;
          }
          const err = Math.abs(got - lambda) / lambda;
          checked++;
          if (err > worst) {
            worst = err;
            worstAt = where;
          }
          if (err > TOLERANCE) misses.push(`${where}: measured ${got.toFixed(3)}, c ÷ f = ${lambda.toFixed(3)} (${(err * 100).toFixed(1)}% off)`);
        }

console.log(`fringes: ${checked} waters measured, ${skipped} with no first-order line to measure`);
console.log(`worst: ${(worst * 100).toFixed(2)}% off at ${worstAt}`);

const nd = sellmeier(587.6);
console.log(`N-BK7 at 587.6 nm: ${nd.toFixed(4)} (data sheet: 1.5168)`);
if (Math.abs(nd - 1.5168) > 0.0001) misses.push(`N-BK7 index ${nd}`);

if (misses.length) {
  console.log(`\n${misses.length} misses:`);
  for (const m of misses) console.log('  ' + m);
  process.exit(1);
}
console.log('all pass');
