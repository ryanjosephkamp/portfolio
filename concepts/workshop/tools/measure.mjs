// The test command the graphs in graphs/ name. It measures what the critic on
// sheet 1 measures and exits 0 only if every draft meets the bar.
//
//   node tools/measure.mjs                    every toy, at every stage of its parts list
//   node tools/measure.mjs saturn 2           one toy, its first two parts
//   node tools/measure.mjs donut 1 --wrong    a staged first draft (these fail): --wrong or --floor
import { OBJECTS, objectById, build, measure, BAR, BUDGET } from '../kit.js';

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const [id, parts] = args.filter((a) => !a.startsWith('--'));
const jobs = id
  ? [[objectById(id), Number(parts) || objectById(id).parts.length]]
  : OBJECTS.flatMap((o) => o.parts.map((_, i) => [o, i + 1]));

let failed = 0;
for (const [obj, n] of jobs) {
  const m = measure(build(obj, { parts: n, wrong: flags.has('--wrong'), floor: flags.has('--floor') }));
  const ok = m.total === BUDGET && m.spread <= BAR;
  if (!ok) failed += 1;
  console.log(`${ok ? 'pass' : 'FAIL'}  ${obj.label}, ${n} part${n === 1 ? '' : 's'}: ${m.total} of ${BUDGET} splats, densest region ${m.spread.toFixed(3)} times the sparsest (bar ${BAR})`);
  for (const g of m.regions) console.log(`        ${String(g.n).padStart(4)} splats on ${g.area.toFixed(3).padStart(7)}  ${g.name}`);
}
process.exit(failed ? 1 : 0);
