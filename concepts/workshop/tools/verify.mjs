// Checks the claims the page makes about its own drawing and its own loop
// graphs. Run from anywhere: node concepts/workshop/tools/verify.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { OBJECTS, share, shareFloor, build, measure, crowdingOf, revLetter, BAR, BUDGET } from '../kit.js';
import { startRun, arrive, follow, causeOf, roleOf, makeWorld, plan, draft, judge, settle } from '../harness.js';

let failed = 0;
const check = (name, ok, detail = '') => {
  if (!ok) failed += 1;
  console.log(`${ok ? 'pass' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
};

// 1. The split by area, for every budget from 1 to 300,000 and every parts list with two or more parts.
const MAX = 300000;
for (const obj of OBJECTS) {
  for (let n = 2; n <= obj.parts.length; n += 1) {
    const areas = obj.parts.slice(0, n).map((p) => p.shape.area);
    const total = areas.reduce((a, b) => a + b, 0);
    let bad = 0;
    for (let budget = 1; budget <= MAX; budget += 1) {
      const counts = share(budget, areas);
      const sum = counts.reduce((a, b) => a + b, 0);
      if (sum !== budget || counts.some((c, i) => c < 0 || Math.abs(c - (budget * areas[i]) / total) >= 1)) bad += 1;
    }
    check(`share(): ${obj.label}, ${n} parts sum to the budget, each within one splat of its share, budgets 1 to ${MAX}`, bad === 0, `${bad} bad`);
  }
}

// 2. Each toy's first-draft mistake crowds its surface by the closed-form figure.
for (const obj of OBJECTS) {
  const m = measure(build(obj, { parts: 1, wrong: true }));
  check(`${obj.label}: placing by parameter crowds it by the closed form, and fails the bar`, Math.abs(m.spread - crowdingOf(obj)) < 0.03 && m.spread > BAR, `measured ${m.spread.toFixed(3)}, closed form ${crowdingOf(obj).toFixed(3)}`);
}

// 3. Every draft the page can show lands on the side of the bar the log says it does.
for (const obj of OBJECTS) {
  let worst = 0, best = Infinity, lost = 0, off = 0;
  for (let seed = 1; seed <= 2000; seed += 1) {
    for (let n = 1; n <= obj.parts.length; n += 1) {
      const m = measure(build(obj, { parts: n, seed }));
      if (m.total !== BUDGET) off += 1;
      worst = Math.max(worst, m.spread);
    }
    best = Math.min(best, measure(build(obj, { parts: 1, wrong: true, seed })).spread);
    if (obj.parts.length > 1 && build(obj, { parts: 2, floor: true, seed }).splats.length !== BUDGET - 1) lost += 1;
  }
  check(`${obj.label}: by area, every stage meets the bar (${BAR}) with all ${BUDGET} splats, seeds 1 to 2000`, worst <= BAR && off === 0, `worst spread ${worst.toFixed(3)}`);
  check(`${obj.label}: by parameter, the first part fails the bar, seeds 1 to 2000`, best > BAR, `best spread ${best.toFixed(3)}`);
  if (obj.parts.length > 1) check(`${obj.label}: rounding the two shares down loses exactly one splat`, lost === 0 && shareFloor(BUDGET, obj.parts.slice(0, 2).map((p) => p.shape.area)).reduce((a, b) => a + b, 0) === BUDGET - 1);
}

// 4. The loop graphs: grooph accepts each one, and the sheet's harness ends every run at a stop.
const dir = fileURLToPath(new URL('../graphs/', import.meta.url));
const files = readdirSync(dir).filter((f) => f.endsWith('.grooph.json')).sort();
const hasGrooph = spawnSync('grooph', ['--version']).status === 0;
if (!hasGrooph) console.log('skip  grooph is not installed here, so `grooph validate` was not run');

// One run, with a person's answers given in order. Returns what happened.
function runOnce(doc, w, answers) {
  const run = startRun(doc);
  const seen = { steps: 0, gates: 0, repeats: 0, lastFail: null, verdicts: [] };
  for (;;) {
    const node = arrive(run);
    if (run.over || (seen.steps += 1) > 200) break;
    const role = roleOf(node);
    let verdict = '';
    if (role === 'plan') plan(w);
    else if (role === 'build') draft(w, causeOf(run));
    else if (role === 'gate') { verdict = answers[seen.gates] ?? null; seen.gates += 1; if (verdict === null) return { run, seen, waiting: true }; }
    else {
      verdict = judge(w, role).pass ? 'pass' : 'fail';
      if (verdict === 'fail' && role !== 'plan-check') { if (seen.lastFail === node.id) seen.repeats += 1; seen.lastFail = node.id; } else if (role !== 'plan-check') seen.lastFail = null;
    }
    if (follow(run, verdict).fired || run.over) break;
  }
  if (run.over?.kind === 'done') settle(w);
  return { run, seen };
}
const cloneWorld = (w) => ({ ...w, lumps: [...w.lumps], task: w.task && { ...w.task } });

for (const file of files) {
  const doc = JSON.parse(readFileSync(dir + file, 'utf8'));
  if (hasGrooph) {
    const v = spawnSync('grooph', ['validate', '--for-export', dir + file], { encoding: 'utf8' });
    check(`${file}: grooph validate --for-export finds no errors`, v.status === 0, (v.stdout + v.stderr).trim().split('\n').pop());
  }
  check(`${file}: every loop names a stop`, doc.loops.length > 0 && doc.loops.every((l) => l.stops.length > 0));
  let paths = 0, bad = 0, halts = 0;
  for (const obj of OBJECTS) {
    const w = makeWorld(obj);
    // From every state of the parts list, give every sequence of answers a person could give.
    for (let stage = 0; stage < obj.parts.length + 2; stage += 1) {
      const todo = [[]];
      while (todo.length) {
        const answers = todo.pop();
        const r = runOnce(doc, cloneWorld(w), answers);
        if (r.waiting) { todo.push([...answers, 'pass'], [...answers, 'fail']); continue; }
        paths += 1;
        const over = r.run.over;
        const caps = doc.loops.every((l) => l.stops.every((s) => s.kind !== 'max-iterations' || r.run.passes[l.id] <= s.n));
        const firedRight = over?.kind !== 'halted' || (over.stop.kind === 'max-iterations' ? r.run.passes[over.loop] === over.stop.n : true);
        const approved = !answers.includes('fail');
        if (over?.kind === 'halted') halts += 1;
        if (!over || !caps || !firedRight || r.seen.repeats || (approved && over.kind !== 'done')) bad += 1;
      }
      const main = runOnce(doc, w, Array(8).fill('pass'));
      if (main.run.over?.kind !== 'done') bad += 1;
    }
    if (w.done !== obj.parts.length) bad += 1;
  }
  check(`${file}: every run, for every answer a person can give on every toy, ends at Done, at a round cap, or at a person's no`, bad === 0, `${paths} runs walked, ${halts} halted at a round cap`);
}

// 5. Revision letters.
check('revision letters', revLetter(0) === 'A' && revLetter(25) === 'Z' && revLetter(26) === 'AA' && revLetter(701) === 'ZZ' && revLetter(702) === 'AAA');

console.log(failed ? `\n${failed} check(s) failed` : '\nall checks pass');
process.exit(failed ? 1 : 0);
