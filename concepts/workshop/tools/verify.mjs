// Checks the claims the page makes about its own drawing. Run: node tools/verify.mjs
import { share, build, measure, crowding, torusArea, frostArea, sprinkleArea, revLetter, BAR, BUDGET } from '../kit.js';

let failed = 0;
const check = (name, ok, detail = '') => {
  if (!ok) failed += 1;
  console.log(`${ok ? 'pass' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
};

// 1. The split by area, for every budget from 1 to 300,000 and both part lists.
const MAX = 300000;
for (const areas of [[torusArea(), frostArea()], [torusArea(), frostArea(), sprinkleArea()]]) {
  const total = areas.reduce((a, b) => a + b, 0);
  let bad = 0;
  for (let budget = 1; budget <= MAX; budget += 1) {
    const counts = share(budget, areas);
    const sum = counts.reduce((a, b) => a + b, 0);
    const off = counts.some((c, i) => Math.abs(c - (budget * areas[i]) / total) >= 1 || c < 0);
    if (sum !== budget || off) bad += 1;
  }
  check(`share(): ${areas.length} parts sum to the budget, each within one splat of its exact share, budgets 1 to ${MAX}`, bad === 0, `${bad} bad`);
}

// 2. Uniform angles crowd the hole by the closed-form ratio.
const wrong = measure(build({ mode: 'angle', seed: 1 }));
check('uniform angles: measured crowding matches (pi R + 2r) / (pi R - 2r)', Math.abs(wrong.spread - crowding()) < 0.03, `measured ${wrong.spread.toFixed(3)}, closed form ${crowding().toFixed(3)}`);
check('uniform angles fail the bar', wrong.spread > BAR);

// 3. Every draft the page can show lands on the side of the bar the log says it does.
let worst = 0;
let equalBest = Infinity;
for (let seed = 1; seed <= 2000; seed += 1) {
  for (const spec of [{}, { frost: true }, { frost: true, sprinkles: true }]) {
    const m = measure(build({ ...spec, seed }));
    if (m.total !== BUDGET) failed += 1;
    worst = Math.max(worst, m.spread);
  }
  equalBest = Math.min(equalBest, measure(build({ frost: true, mode: 'equal', seed })).spread);
}
check(`by area: all three recipes meet the bar (${BAR}) for seeds 1 to 2000`, worst <= BAR, `worst spread ${worst.toFixed(3)}`);
check('equal split: frosting draft fails the bar for seeds 1 to 2000', equalBest > BAR, `best spread ${equalBest.toFixed(3)}`);

// 4. Revision letters.
check('revision letters', revLetter(0) === 'A' && revLetter(25) === 'Z' && revLetter(26) === 'AA' && revLetter(701) === 'ZZ' && revLetter(702) === 'AAA');

console.log(failed ? `\n${failed} check(s) failed` : '\nall checks pass');
process.exit(failed ? 1 : 0);
