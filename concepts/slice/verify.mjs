#!/usr/bin/env node
// The checks behind the page's claims, run for each scan.
//
//   node concepts/slice/verify.mjs [--walnut <walnut.vol.gz>] [--gar <gar.nii.gz>] [--quick]
//
// 1. The window readout. For every window the sliders can make (0 <= lo < hi <= 255, 32,640 of
//    them) the page's black, gray and white counts, read off one running count, equal a count
//    made the slow way: looking at every one of the scan's voxels, one by one. (--quick tries
//    every 16th window.)
// 2. The cuts. Every pixel of every slice in all three directions equals the voxel it names.
// 3. The maximum-intensity picture: straight on against the largest voxel along each ray, and
//    at every whole degree of a full turn against a slow pass through the whole volume.
// 4. The cutaway: what every ray meets first equals a slow march that tests every sample of
//    the ray, with no stepping over empty blocks; and every voxel painted as a cut face lies on
//    one of the three cuts.
// 5. Back projection: from 180 views, the rebuilt slice matches the slice it was made from.
// 6. With a path to Splashery's file: every voxel on the contact sheet equals that file's.

import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { SCANS, sheetToVolume, sheetSize, cutShape, cut, mip, solids, blocks, cutaway, camera, viewShape, histogram, runningCount, windowCounts, shadowSet, rebuild } from './volume.js'; // prettier-ignore
import { readSource } from './tools/build-sheet.mjs';

const args = process.argv.slice(2);
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
const quick = args.includes('--quick');
const num = (n) => n.toLocaleString('en-US');
const fail = (msg) => {
  console.error(`FAIL  ${msg}`);
  process.exit(1);
};

// Read a sheet: an 8-bit gray PNG with unfiltered rows, as tools/build-sheet.mjs writes it.
function readSheet(s) {
  const png = readFileSync(fileURLToPath(new URL(`./${s.sheet}`, import.meta.url)));
  const { width, height } = sheetSize(s);
  if (png.readUInt32BE(16) !== width || png.readUInt32BE(20) !== height) fail(`${s.id}: sheet size`);
  const idat = [];
  for (let p = 8; p < png.length; ) {
    const len = png.readUInt32BE(p);
    if (png.toString('latin1', p + 4, p + 8) === 'IDAT') idat.push(png.subarray(p + 8, p + 8 + len));
    p += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const pixels = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    if (raw[y * (width + 1)] !== 0) fail(`${s.id}: row ${y} is filtered`);
    pixels.set(raw.subarray(y * (width + 1) + 1, (y + 1) * (width + 1)), y * width);
  }
  return { vol: sheetToVolume(s, pixels, width), width, height, bytes: png.length };
}

// The cutaway the slow way: every sample of every ray, in order.
function slowCutaway(s, vol, theta, pos, iso) {
  const { nx, ny, nz } = s;
  const { W, H, T } = viewShape(s);
  const { r, d, f } = camera(theta);
  const [px, py, pz] = pos;
  const inside = (x, y, z) => x >= 0 && x < nx && y >= 0 && y < ny && z >= 0 && z < nz;
  const carved = (x, y, z) => inside(x, y, z) && x > px && y < py && z < pz;
  const hit = new Int32Array(W * H).fill(-1);
  for (let w = 0; w < H; w++)
    for (let u = 0; u < W; u++) {
      const a = u + 0.5 - W / 2;
      const b = w + 0.5 - H / 2;
      const ox = (nx - 1) / 2 + a * r[0] + b * d[0];
      const oy = (ny - 1) / 2 + a * r[1] + b * d[1];
      const oz = (nz - 1) / 2 + a * r[2] + b * d[2];
      for (let n = 0; n <= 2 * T; n++) {
        const t = n - T;
        const xf = ox + t * f[0];
        const yf = oy + t * f[1];
        const zf = oz + t * f[2];
        const x = Math.floor(xf + 0.5);
        const y = Math.floor(yf + 0.5);
        const z = Math.floor(zf + 0.5);
        if (!inside(x, y, z) || carved(x, y, z)) continue;
        const i = x + nx * (y + ny * z);
        if (vol[i] <= iso) continue;
        const before = carved(Math.floor(xf - f[0] + 0.5), Math.floor(yf - f[1] + 0.5), Math.floor(zf - f[2] + 0.5));
        hit[w * W + u] = before ? -2 - i : i;
        break;
      }
    }
  return hit;
}

for (const s of Object.values(SCANS)) {
  const { nx, ny, nz } = s;
  const { vol, width, height, bytes } = readSheet(s);
  const at = (x, y, z) => vol[x + nx * (y + ny * z)];
  console.log(`\n${s.id}   sheet ${width} x ${height} px, ${num(bytes)} bytes; ${nx} x ${ny} x ${nz} = ${num(vol.length)} voxels`);

  // 1. Every window, the slow way.
  const own = vol.filter((v) => v > s.air);
  const upTo = runningCount(histogram(vol), s.air);
  let windows = 0;
  for (let lo = 0; lo < 255; lo++) {
    for (let hi = lo + 1; hi <= 255; hi++) {
      if (quick && (lo * 255 + hi) % 16) continue;
      let black = 0;
      let white = 0;
      for (let i = 0; i < own.length; i++) {
        const v = own[i];
        black += v <= lo ? 1 : 0;
        white += v >= hi ? 1 : 0;
      }
      const got = windowCounts(upTo, lo, hi);
      if (got.black !== black || got.white !== white || got.gray !== own.length - black - white || got.total !== own.length) // prettier-ignore
        fail(`${s.id} window ${lo}..${hi}: page ${JSON.stringify(got)}, counted ${black} black, ${white} white`);
      windows++;
    }
  }
  console.log(`window  ${num(windows)} windows, each counted over ${num(own.length)} voxels: all equal`);

  // 2. Every pixel of every cut.
  let cutPixels = 0;
  for (const name of ['top', 'front', 'side']) {
    const c = cutShape(s, name);
    for (let k = 0; k < c.n; k++) {
      const pic = cut(s, vol, name, k);
      for (let j = 0; j < c.h; j++)
        for (let i = 0; i < c.w; i++) {
          const want = name === 'top' ? at(i, j, k) : name === 'front' ? at(i, k, j) : at(k, i, j);
          if (pic[j * c.w + i] !== want) fail(`${s.id} ${name} cut ${k} at ${i},${j}`);
          cutPixels++;
        }
    }
  }
  console.log(`cuts    ${num(cutPixels)} pixels in ${nz + ny + nx} slices: all equal`);

  // 3. The maximum-intensity picture.
  const W = s.viewW;
  const solid = solids(s, vol);
  const m = mip(s, solid, 0);
  const off = W / 2 - (nx - 1) / 2; // the ray through voxel column x lands on pixel floor(x + off)
  for (let z = 0; z < nz; z++)
    for (let x = 0; x < nx; x++) {
      let want = 0;
      for (let y = 0; y < ny; y++) want = Math.max(want, at(x, y, z));
      if (m[z * W + Math.floor(x + off)] !== want) fail(`${s.id} maximum-intensity picture at ${x},${z}`);
    }
  const slow = new Uint8Array(W * nz);
  for (let deg = 0; deg < 360; deg += quick ? 15 : 1) {
    const theta = (deg * Math.PI) / 180;
    const got = mip(s, solid, theta);
    slow.fill(0);
    const c = Math.cos(theta);
    const sn = Math.sin(theta);
    for (let z = 0; z < nz; z++)
      for (let y = 0; y < ny; y++)
        for (let x = 0; x < nx; x++) {
          const u = Math.floor(Math.fround((x - (nx - 1) / 2) * c + W / 2) + Math.fround((y - (ny - 1) / 2) * sn));
          if (u < 0 || u >= W) continue;
          const v = at(x, y, z);
          if (v > slow[z * W + u]) slow[z * W + u] = v;
        }
    for (let i = 0; i < got.length; i++) if (got[i] !== slow[i]) fail(`${s.id} maximum-intensity picture at ${deg} degrees, pixel ${i}`);
  }
  console.log(`mip     ${num(nx * nz)} rays straight on, and ${quick ? 24 : 360} turned pictures: all equal`);

  // 4. The cutaway.
  const grid = blocks(s, vol);
  let rays = 0;
  let faces = 0;
  const spots = [s.start, [Math.floor(nx * 0.3), Math.floor(ny * 0.7), Math.floor(nz * 0.6)], [nx - 2, 1, 1], [0, ny - 1, nz - 1]];
  for (const theta of [0.6, 0, 1.9, 3.3, 4.71, 5.5])
    for (const pos of spots)
      for (const iso of [s.air, s.dense]) {
        const fast = cutaway(s, vol, grid, theta, pos, iso);
        const ref = slowCutaway(s, vol, theta, pos, iso);
        for (let i = 0; i < fast.length; i++) {
          if (fast[i] !== ref[i]) fail(`${s.id} cutaway at theta ${theta}, cut ${pos}, above ${iso}: ray ${i} met ${fast[i]}, slow march ${ref[i]}`);
          if (fast[i] < -1) {
            const v = -2 - fast[i];
            const z = Math.floor(v / (nx * ny));
            const y = Math.floor((v - z * nx * ny) / nx);
            const x = v - z * nx * ny - y * nx;
            if (x !== pos[0] && y !== pos[1] && z !== pos[2]) fail(`${s.id} cutaway: face voxel ${x},${y},${z} is on no cut through ${pos}`);
            faces++;
          }
        }
        rays += fast.length;
      }
  console.log(`cutaway ${num(rays)} rays in 48 pictures: all equal; ${num(faces)} face pixels, each on one of the three cuts`);

  // 5. Back projection.
  let worst = 1;
  for (let z = 10; z < nz - 10; z += 6) {
    const pic = cut(s, vol, 'top', z);
    const back = rebuild(shadowSet(pic, nx, ny), nx, ny, 180);
    let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0; // prettier-ignore
    for (let i = 0; i < pic.length; i++) {
      const a = pic[i];
      const b = back[i];
      sa += a; sb += b; saa += a * a; sbb += b * b; sab += a * b; // prettier-ignore
    }
    const n = pic.length;
    const r = (n * sab - sa * sb) / Math.sqrt((n * saa - sa * sa) * (n * sbb - sb * sb));
    if (r < worst) worst = r;
  }
  if (worst < 0.95) fail(`${s.id} back projection: correlation ${worst.toFixed(3)}`);
  console.log(`rebuild from 180 views: correlation with the true slice at least ${worst.toFixed(3)}`);

  // 6. Against Splashery's own file.
  if (opt(`--${s.id}`)) {
    const src = readSource(opt(`--${s.id}`)).data;
    if (src.length !== vol.length) fail(`${s.id}: the source has ${src.length} voxels`);
    for (let i = 0; i < vol.length; i++) if (src[i] !== vol[i]) fail(`${s.id}: voxel ${i} differs from the source`);
    console.log(`source  ${num(vol.length)} voxels equal Splashery's file`);
  }
}
console.log('\nok');
