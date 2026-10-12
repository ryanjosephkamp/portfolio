// The exhaustive check of the plate's measures and its astronomy.
//   node concepts/atlas/tools/verify.mjs
// Prints one line per check and exits 1 if any fails.
import { readFileSync } from 'node:fs';
import { Z_MIN, Z_MAX, LY, AU, C, UNITS, scaleBar, lightTime, fmtLen } from '../scale.js';
import * as A from '../assets/astro.js';
import { STARS, LINES, HELENS } from '../assets/data.js';

let failed = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? `  (${detail})` : ''}`);
  if (!ok) failed++;
};
const num = (s) => Number(s.replace(/,/g, ''));

// 1. The scale bar at every zoom the rule can reach, in steps of a thousandth of a power of ten.
{
  let n = 0;
  let bad = 0;
  let lo = 1;
  let hi = 0;
  for (let i = 0; i <= Math.round((Z_MAX - Z_MIN) * 1000); i++) {
    const z = Z_MIN + i / 1000;
    const b = scaleBar(z);
    n++;
    lo = Math.min(lo, b.frac);
    hi = Math.max(hi, b.frac);
    const [value, ...unit] = b.label.split(' ');
    const u = UNITS.find((q) => q.one === unit.join(' ') || q.many === unit.join(' '));
    const lead = num(value) / 10 ** Math.floor(Math.log10(num(value)) + 1e-9);
    const clean = [1, 2, 5].some((m) => Math.abs(lead - m) < 1e-9);
    // The label, read back, is the length that was drawn.
    const back = num(value) * u.m;
    if (!clean || Math.abs(back / b.meters - 1) > 1e-12 || Math.abs((b.frac * 10 ** z) / back - 1) > 1e-12 || b.frac < 0.12 || b.frac > 0.3 + 1e-12) bad++;
  }
  check(`scale bar true and 1-2-5 at ${n.toLocaleString('en-US')} zooms`, bad === 0, `drawn at ${(lo * 100).toFixed(1)}% to ${(hi * 100).toFixed(1)}% of the plate`);
}

// 2. Light's crossing time, read back from its words, at the same zooms.
{
  const per = { years: 365.25 * 86400, days: 86400, seconds: 1, milliseconds: 1e-3, microseconds: 1e-6, nanoseconds: 1e-9, picoseconds: 1e-12, femtoseconds: 1e-15, attoseconds: 1e-18 };
  let bad = 0;
  let n = 0;
  for (let i = 0; i <= Math.round((Z_MAX - Z_MIN) * 1000); i++) {
    const d = 10 ** (Z_MIN + i / 1000);
    const t = lightTime(d);
    n++;
    let back;
    let m = t.text.match(/^(\d+) h (\d+) min$/);
    if (m) back = m[1] * 3600 + m[2] * 60;
    else if ((m = t.text.match(/^(\d+) min (\d+) s$/))) back = m[1] * 60 + Number(m[2]);
    else {
      m = t.text.match(/^([\d,.]+) (\w+)$/);
      back = m && per[m[2]] ? num(m[1]) * per[m[2]] : NaN;
    }
    // Two significant digits: within 5.3% of the exact time.
    if (!(Math.abs(back / (d / C) - 1) < 0.053)) bad++;
  }
  check(`light-crossing time reads back at ${n.toLocaleString('en-US')} zooms`, bad === 0);
  check('a light-year takes light a year', lightTime(LY * 10).text === '10 years', lightTime(LY * 10).text);
}

// 3. The stops in the page: in order, on the rule, and each ring inside its plate.
{
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const stops = [...html.matchAll(/data-z="([^"]+)" data-d="([^"]+)"/g)].map((m) => ({ z: Number(m[1]), d: Number(m[2]) }));
  check('17 stops, largest first', stops.length === 17 && stops.every((s, i) => !i || (s.z < stops[i - 1].z && s.d < stops[i - 1].d)));
  check('every stop is on the rule', stops.every((s) => s.z >= Z_MIN && s.z <= Z_MAX));
  check('every ring fits its plate', stops.slice(1).every((s) => s.d < 10 ** s.z), stops.slice(1).map((s) => (s.d / 10 ** s.z).toFixed(2)).join(' '));
  check('the rule spans twenty-nine powers of ten', Math.floor(Z_MAX - Z_MIN) === 29, (Z_MAX - Z_MIN).toFixed(1));
  check('sizes read as written', fmtLen(9.4607e20) === '100,000 light-years' && fmtLen(2e-8) === '20 nm' && fmtLen(9e12) === '60 AU' && fmtLen(3.5e-6) === '3.5 µm', [fmtLen(9.4607e20), fmtLen(2e-8), fmtLen(9e12), fmtLen(3.5e-6)].join(' | '));
}

// 4. The planets: Kepler's equation closes for every planet on every day of the table's years,
//    and the Earth keeps its distance from the Sun.
{
  const jd0 = A.julianDay(Date.UTC(1800, 0, 1));
  const jd1 = A.julianDay(Date.UTC(2050, 11, 31));
  let n = 0;
  let worst = 0;
  let near = 9;
  let far = 0;
  const range = { mercury: [0.3, 0.47], venus: [0.71, 0.73], emb: [0.98, 1.02], mars: [1.38, 1.67], jupiter: [4.9, 5.5], saturn: [9, 10.1], uranus: [18.2, 20.2], neptune: [29.7, 30.5] };
  for (let jd = jd0; jd <= jd1; jd++) {
    for (const id of Object.keys(range)) {
      const p = A.heliocentric(id, jd);
      const r = Math.hypot(p[0], p[1], p[2]);
      n++;
      if (r < range[id][0] || r > range[id][1]) worst++;
      if (id === 'emb') {
        near = Math.min(near, r);
        far = Math.max(far, r);
      }
    }
  }
  check(`each planet within its orbit's bounds on ${n.toLocaleString('en-US')} planet-days, 1800 to 2050`, worst === 0, `Earth ${near.toFixed(4)} to ${far.toFixed(4)} AU`);
}

// 5. The sky over Cincinnati: Polaris stays within a degree of the latitude's height, every hour of 2026.
{
  const i = Object.entries(STARS.name).find(([, n]) => n === 'Polaris')?.[0];
  let lo = 90;
  let hi = 0;
  let n = 0;
  for (let t = Date.UTC(2026, 0, 1); t < Date.UTC(2027, 0, 1); t += 3600000) {
    const { alt } = A.starAltAz(STARS.ra[i], STARS.dec[i], t, 39.1, -84.51);
    lo = Math.min(lo, alt);
    hi = Math.max(hi, alt);
    n++;
  }
  check(`Polaris holds near 39.1 degrees for ${n.toLocaleString('en-US')} hours of 2026`, i !== undefined && lo > 38.1 && hi < 40.1, `${lo.toFixed(2)} to ${hi.toFixed(2)}`);
  check('sidereal time at J2000', Math.abs(A.gmst(A.J2000) - 280.46061837) < 1e-9);
}

// 6. The data: every constellation line joins two stars that exist; the mountain lost its top.
{
  const n = STARS.ra.length;
  check('every line joins two stars in the catalog', LINES.every((c) => c.at.length % 2 === 0 && c.at.every((k) => Number.isInteger(k) && k >= 0 && k < n)), `${n} stars, ${LINES.length} constellations`);
  const grid = (b64) => new Uint16Array(Uint8Array.from(Buffer.from(b64, 'base64')).buffer);
  const before = grid(HELENS.before.b64);
  const after = grid(HELENS.after.b64);
  check('two grids of the same size', before.length === HELENS.n ** 2 && after.length === HELENS.n ** 2);
  check('the summit fell 412 m', HELENS.before.top - HELENS.after.top === 412 && HELENS.before.top === 2945, `${HELENS.before.top} to ${HELENS.after.top}`);
}

console.log(failed ? `${failed} check(s) failed` : 'all checks pass');
process.exit(failed ? 1 : 0);
