// The exhaustive check of the plate's measures and its astronomy.
//   node concepts/atlas/tools/verify.mjs
// Prints one line per check and exits 1 if any fails.
import { readFileSync } from 'node:fs';
import { Z_MIN, Z_MAX, LY, AU, C, UNITS, scaleBar, lightTime, fmtLen } from '../scale.js';
import * as A from '../assets/astro.js';
import { STARS, LINES, HELENS, COAST } from '../assets/data.js';
import { surface, swing, dot, cross } from '../earth.js';
import { GROUND } from '../assets/ground.js';
import { SMALL } from '../assets/small.js';

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

// 7. The Earth's turn: the zenith over a place, found two ways (earth.js, and the third row of
//    Splashery's sky matrix), agrees for every hour of 2026; Washington never leaves the face
//    the plate shows; and the camera's frame stays square at every step of its swing.
{
  const places = [
    [38.888321, -77.025649],
    [39.1, -84.51],
  ];
  const e = (23.43928 * Math.PI) / 180;
  const eclipticNorth = [0, -Math.sin(e), Math.cos(e)];
  let n = 0;
  let worst = 0;
  let lowest = 1;
  for (let t = Date.UTC(2026, 0, 1); t < Date.UTC(2027, 0, 1); t += 3600000) {
    const jd = A.julianDay(t);
    const at = surface(A, jd);
    for (const [lat, lon] of places) {
      const v = at(lat, lon);
      const M = A.skyMatrix(jd, lat, lon);
      worst = Math.max(worst, Math.abs(v[0] - M[6]), Math.abs(v[1] - M[7]), Math.abs(v[2] - M[8]));
      n++;
    }
    lowest = Math.min(lowest, dot(at(places[0][0], places[0][1]), eclipticNorth));
  }
  check(`a place's zenith agrees with Splashery's sky matrix at ${n.toLocaleString('en-US')} place-hours of 2026`, worst < 1e-12, `worst difference ${worst.toExponential(1)}`);
  check('Washington stays on the face the plate shows, every hour of 2026', lowest > 0, `never nearer the rim than ${(Math.asin(lowest) * 180 / Math.PI).toFixed(1)} degrees`);
  const jd = A.julianDay(Date.UTC(2026, 9, 12, 19));
  const up = surface(A, jd)(38.888321, -77.025649);
  const pole = surface(A, jd)(90, 0);
  const k = dot(pole, up);
  const north = pole.map((p, i) => p - k * up[i]);
  let bad = 0;
  for (let i = 0; i <= 1000; i++) {
    const f = swing({ axis: eclipticNorth, up: [0, Math.cos(e), Math.sin(e)] }, { axis: up, up: north }, i / 1000);
    const c = cross(f.right, f.up);
    const square = Math.abs(dot(f.right, f.up)) + Math.abs(dot(f.up, f.axis)) + Math.abs(dot(f.right, f.axis)) + Math.abs(dot(c, f.axis) - 1) + Math.abs(dot(f.up, f.up) - 1);
    if (!(square < 1e-9)) bad++;
  }
  check('the camera keeps a square, right-handed frame at 1,001 steps of its swing', bad === 0);
  const pts = COAST.world.concat(COAST.region).flat();
  check('every coast point is a real longitude and latitude', pts.length % 2 === 0 && pts.every((x, i) => Number.isFinite(x) && (i % 2 ? Math.abs(x) <= 90 : Math.abs(x) <= 180)), `${pts.length / 2} points`);
}

// 8. The outlines from Washington inward (tools/trace.py): every one sits inside the frame of
//    its source, and every size the page states is the size of what is drawn.
{
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const stated = Object.fromEntries([...html.matchAll(/data-d="([^"]+)" data-layer="([^"]+)"/g)].map((m) => [m[2], Number(m[1])]));
  const pts = (layer, groups) => (groups || Object.keys(layer.lines)).flatMap((g) => layer.lines[g].flatMap((run) => run.reduce((a, v, i) => (i % 2 ? a : [...a, [v * layer.unit, run[i + 1] * layer.unit]]), [])));
  const box = (p) => [Math.min(...p.map((q) => q[0])), Math.min(...p.map((q) => q[1])), Math.max(...p.map((q) => q[0])), Math.max(...p.map((q) => q[1]))];
  const len = (m) => Math.hypot(m[2] - m[0], m[3] - m[1]);
  const near = (a, b, tol) => Math.abs(a / b - 1) <= tol;
  const layers = [GROUND.city, GROUND.mall, GROUND.garden, SMALL.bed, SMALL.leaf, SMALL.cells, SMALL.chloroplast, SMALL.ribosome];
  const runs = layers.flatMap((l) => Object.values(l.lines).flat());
  check('every outline is whole units, two to a point', runs.every((r) => r.length >= 4 && r.length % 2 === 0 && r.every(Number.isInteger)), `${runs.length.toLocaleString('en-US')} runs, ${(runs.reduce((a, r) => a + r.length, 0) / 2).toLocaleString('en-US')} points`);

  // Washington: the square's two whole sides, corner to corner.
  const dc = pts(GROUND.city, ['boundary']);
  const north = dc.reduce((a, q) => (q[1] > a[1] ? q : a));
  const east = dc.reduce((a, q) => (q[0] > a[0] ? q : a));
  const south = dc.reduce((a, q) => (q[1] < a[1] ? q : a));
  const sides = [Math.hypot(north[0] - east[0], north[1] - east[1]), Math.hypot(east[0] - south[0], east[1] - south[1])];
  check("the District's sides are about 16 km", sides.every((v) => v > 15700 && v < 16300), sides.map((v) => (v / 1000).toFixed(2)).join(' and ') + ' km');

  // The Mall: the measure runs between the two footprints the labels name.
  const at = (name) => GROUND.mall.labels.find((l) => l[2] === name);
  const m = GROUND.mall.measure;
  const ends = Math.hypot(m[0] - at('Lincoln Memorial')[0], m[1] - at('Lincoln Memorial')[1]) < 1 && Math.hypot(m[2] - at('the Capitol')[0], m[3] - at('the Capitol')[1]) < 1;
  check('the Mall is measured from the Lincoln Memorial to the Capitol', ends && near(len(m), GROUND.facts.capitolToLincolnKm * 1000, 0.002) && near(len(m), stated.mall, 0.002), `${len(m).toFixed(0)} m`);

  // The garden: its outline's span, with the zoom's target inside it.
  const hb = box(pts(GROUND.garden, ['haupt']));
  check('the Haupt Garden is as long as stated, and the target is in it', near(hb[2] - hb[0], stated.garden, 0.01) && hb[0] < 0 && hb[2] > 0 && hb[1] < 0 && hb[3] > 0, `${(hb[2] - hb[0]).toFixed(1)} m by ${(hb[3] - hb[1]).toFixed(1)} m`);

  // The bed: 2 m long, as Splashery scales the capture.
  check('the garden bed is 2 m long', near(len(SMALL.bed.measure), 2, 0.001) && near(len(SMALL.bed.measure), stated.bed, 0.001), `${len(SMALL.bed.measure).toFixed(3)} m`);

  // The pictures: every traced point lies inside the picture it was traced from.
  const frame = (layer, width, cx, cy, w, h, slack) => {
    const b = box(pts(layer));
    const height = (width * h) / w;
    return b[0] >= -cx * width - slack && b[2] <= (1 - cx) * width + slack && b[1] >= -(1 - cy) * height - slack && b[3] <= cy * height + slack;
  };
  check('the leaf stays inside its photograph, 13.5 cm wide', frame(SMALL.leaf, 0.135, 0.322, 0.52, 1024, 768, 2e-4) && near(len(SMALL.leaf.measure), SMALL.facts.leaf.bladeSpanM, 0.01) && near(len(SMALL.leaf.measure), stated.leaf, 0.02), `blade ${(len(SMALL.leaf.measure) * 100).toFixed(2)} cm`);
  check('the cells stay inside their picture, 200 µm wide', frame(SMALL.cells, 200e-6, 0.4795, 0.4445, 3047, 2531, 3e-7));
  check('the chloroplast stays inside its micrograph, 4.5 µm wide', frame(SMALL.chloroplast, 4.5e-6, 0.6, 0.5, 2400, 1800, 2e-8));

  // The chloroplasts in the cells: each ring's area as a circle's width, every ring counted.
  const rings = SMALL.cells.lines.plastids.map((run) => {
    let a = 0;
    for (let i = 0; i < run.length; i += 2) {
      const j = (i + 2) % run.length;
      a += run[i] * run[j + 1] - run[j] * run[i + 1];
    }
    return 2 * Math.sqrt(Math.abs(a / 2) / Math.PI) * SMALL.cells.unit;
  }).sort((p, q) => p - q);
  const median = rings[rings.length >> 1];
  check(`the median of ${rings.length} chloroplast rings is the size the plate states`, rings.length === SMALL.facts.cells.plastids && near(median, SMALL.facts.cells.plastidMedianM, 0.001), `${(median * 1e6).toFixed(2)} µm`);

  // The chloroplast: its length is the two points of its outline farthest apart.
  const body = SMALL.chloroplast.lines.envelope.map((run) => pts({ unit: SMALL.chloroplast.unit, lines: { a: [run] } })).find((p) => {
    const b = box(p);
    return b[0] < 0 && b[2] > 0 && b[1] < 0 && b[3] > 0;
  });
  let far = 0;
  for (const p of body) for (const q of body) far = Math.max(far, Math.hypot(p[0] - q[0], p[1] - q[1]));
  check('the chloroplast is as long as stated', near(far, SMALL.facts.chloroplast.lengthM, 0.03) && near(len(SMALL.chloroplast.measure), SMALL.facts.chloroplast.lengthM, 0.002) && near(far, stated.chloroplast, 0.03), `${(far * 1e6).toFixed(2)} µm`);

  // The ribosome: the outline's width, and every chain of the model inside it.
  const ob = box(pts(SMALL.ribosome, ['outline']));
  const cb = box(pts(SMALL.ribosome, ['rna', 'protein']));
  const inside = cb[0] > ob[0] - 1e-9 && cb[2] < ob[2] + 1e-9 && cb[1] > ob[1] - 1e-9 && cb[3] < ob[3] + 1e-9;
  check('the ribosome is as wide as stated, with its 52 chains inside the outline', near(ob[2] - ob[0], SMALL.facts.ribosome.acrossM[0], 0.03) && near(ob[2] - ob[0], stated.ribosome, 0.04) && inside && SMALL.ribosome.lines.rna.length + SMALL.ribosome.lines.protein.length === 52, `${((ob[2] - ob[0]) * 1e9).toFixed(1)} nm by ${((ob[3] - ob[1]) * 1e9).toFixed(1)} nm`);
}

console.log(failed ? `${failed} check(s) failed` : 'all checks pass');
process.exit(failed ? 1 : 0);
