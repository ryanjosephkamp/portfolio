// Builds assets/data.js from Splashery's own data snapshots.
//   node concepts/atlas/tools/build-data.mjs <dir with sky.json and sth.bin.gz>
// sky.json is assets/toys/night-sky/sky.json and sth.bin.gz is
// assets/toys/st-helens/terrain.bin.gz, both from the splashery repository.
// ne_110m_coastline.geojson and ne_50m_coastline.geojson are Natural Earth's
// (github.com/nvkelso/natural-earth-vector, geojson/).
import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';

const dir = process.argv[2];
const sky = JSON.parse(readFileSync(join(dir, 'sky.json'), 'utf8'));

// Stars to magnitude 5.2, and any fainter star a constellation line needs.
const need = new Set();
for (const c of sky.constellations) for (const i of c.lines) need.add(i);
const keep = [];
for (let i = 0; i < sky.count; i++) if (sky.mag[i] <= 5.2 || need.has(i)) keep.push(i);
const at = new Map(keep.map((i, k) => [i, k]));
const r2 = (x) => Math.round(x * 100) / 100;
const PC_LY = 3.26156;
const stars = {
  ra: keep.map((i) => r2(sky.ra[i])),
  dec: keep.map((i) => r2(sky.dec[i])),
  mag: keep.map((i) => Math.round(sky.mag[i] * 10) / 10),
  // Light-years; 0 where the catalog has no distance.
  ly: keep.map((i) => (sky.dist[i] > 0 && sky.dist[i] < 90000 ? Math.round(sky.dist[i] * PC_LY * 10) / 10 : 0)),
  name: Object.fromEntries(keep.map((i, k) => [k, sky.name[i]]).filter(([k, n]) => n && sky.mag[keep[k]] <= 2.6)),
};
const lines = sky.constellations.map((c) => ({ name: c.name, at: c.lines.map((i) => at.get(i)) }));

// Mount St. Helens: two 512 x 512 height grids, stored row by row as differences.
const bytes = gunzipSync(readFileSync(join(dir, 'sth.bin.gz')));
const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
const n = dv.getUint32(0, true);
const meta = JSON.parse(new TextDecoder().decode(bytes.subarray(4, 4 + n)));
const N = 128;
const grids = {};
for (const L of meta.layers) {
  const start = 4 + n + L.offset;
  const h = new Float64Array(L.w * L.h);
  for (let j = 0; j < L.h; j++) {
    let v = 0;
    for (let i = 0; i < L.w; i++) {
      v = (v + dv.getUint16(start + (j * L.w + i) * 2, true)) & 0xffff;
      h[j * L.w + i] = L.min + v * L.step;
    }
  }
  const f = L.w / N;
  const out = new Uint16Array(N * N);
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      let s = 0;
      for (let b = 0; b < f; b++) for (let a = 0; a < f; a++) s += h[(j * f + b) * L.w + i * f + a];
      out[j * N + i] = Math.round((s / (f * f)) * 10);
    }
  grids[L.name] = { b64: Buffer.from(out.buffer).toString('base64'), top: Math.round(L.max), low: Math.round(L.min) };
}
const helens = { n: N, span: meta.span[0], site: meta.site, fetched: meta.fetched, before: grids.before, after: grids.after };

// Coastlines: Natural Earth (public domain), as runs of lon, lat. The 1:110m set for the globe,
// and the 1:50m set cut to the Mid-Atlantic for the region around Washington.
function coast(file, digits, keep) {
  const gj = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  const p = 10 ** digits;
  const out = [];
  for (const f of gj.features) {
    const lines = f.geometry.type === 'MultiLineString' ? f.geometry.coordinates : [f.geometry.coordinates];
    for (const line of lines) {
      let run = [];
      for (const [lon, lat] of line) {
        if (keep(lon, lat)) run.push(Math.round(lon * p) / p, Math.round(lat * p) / p);
        else {
          if (run.length >= 4) out.push(run);
          run = [];
        }
      }
      if (run.length >= 4) out.push(run);
    }
  }
  return out;
}
const world = coast('ne_110m_coastline.geojson', 1, () => true);
const region = coast('ne_50m_coastline.geojson', 2, (lon, lat) => lon > -83 && lon < -69 && lat > 33 && lat < 44);

const head = `// Made by tools/build-data.mjs from Splashery's data snapshots. Do not edit by hand.
// Stars: the HYG database v4.1 (David Nash, astronexus.com), CC BY-SA 4.0. Positions are J2000.
// Constellation lines: the Stellarium team's Western sky culture, CC BY-SA.
// Mount St. Helens: the USGS pre-1980 DEM and USGS 3DEP, public domain. Heights are decimeters.
// Coastlines: Natural Earth, public domain.
`;
writeFileSync(
  new URL('../assets/data.js', import.meta.url),
  `${head}export const STARS = ${JSON.stringify(stars)};\nexport const LINES = ${JSON.stringify(lines)};\nexport const HELENS = ${JSON.stringify(helens)};\nexport const COAST = ${JSON.stringify({ world, region })};\n`,
);
console.log(world.reduce((a, r) => a + r.length / 2, 0), 'world coast points;', region.reduce((a, r) => a + r.length / 2, 0), 'region points;');
console.log(keep.length, 'stars;', lines.length, 'constellations; helens', helens.before.top, helens.after.top, helens.before.low);
