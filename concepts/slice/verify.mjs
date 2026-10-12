#!/usr/bin/env node
// The checks behind the page's claims.
//
//   node concepts/slice/verify.mjs [path to Splashery's walnut.vol.gz]
//
// 1. The window readout. For every window the sliders can make (0 <= lo < hi <= 255, 32,640 of
//    them) the page's black, gray and white counts, read off one running count, equal a count
//    made the slow way: looking at every voxel of the walnut, one by one.
// 2. The cuts. Every pixel of every slice in all three directions equals the voxel it names.
// 3. The maximum-intensity picture, seen straight on, equals the largest voxel along each ray.
// 4. With a path to Splashery's file: every voxel on the contact sheet equals that file's.

import { readFileSync } from 'node:fs';
import { inflateSync, gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { SCAN, CUTS, MIP_W, sheetToVolume, sheetSize, cut, mip, solids, histogram, runningCount, windowCounts, shadowSet, rebuild } from './volume.js'; // prettier-ignore

const fail = (msg) => {
  console.error(`FAIL  ${msg}`);
  process.exit(1);
};

// Read the sheet: an 8-bit gray PNG with unfiltered rows, as tools/build-sheet.mjs writes it.
const png = readFileSync(fileURLToPath(new URL('./assets/walnut-sheet.png', import.meta.url)));
const { width, height } = sheetSize();
if (png.readUInt32BE(16) !== width || png.readUInt32BE(20) !== height) fail('sheet size');
const idat = [];
for (let p = 8; p < png.length; ) {
  const len = png.readUInt32BE(p);
  if (png.toString('latin1', p + 4, p + 8) === 'IDAT') idat.push(png.subarray(p + 8, p + 8 + len));
  p += 12 + len;
}
const raw = inflateSync(Buffer.concat(idat));
const pixels = new Uint8Array(width * height);
for (let y = 0; y < height; y++) {
  if (raw[y * (width + 1)] !== 0) fail(`row ${y} is filtered`);
  pixels.set(raw.subarray(y * (width + 1) + 1, (y + 1) * (width + 1)), y * width);
}
const vol = sheetToVolume(pixels, width);
const { nx, ny, nz } = SCAN;
console.log(`sheet   ${width} x ${height} px, ${nx} x ${ny} x ${nz} = ${vol.length.toLocaleString('en-US')} voxels`);

// 1. Every window, the slow way.
const walnut = vol.filter((v) => v > 0);
const upTo = runningCount(histogram(vol));
let windows = 0;
for (let lo = 0; lo < 255; lo++) {
  for (let hi = lo + 1; hi <= 255; hi++) {
    let black = 0;
    let white = 0;
    for (let i = 0; i < walnut.length; i++) {
      const v = walnut[i];
      black += v <= lo ? 1 : 0;
      white += v >= hi ? 1 : 0;
    }
    const got = windowCounts(upTo, lo, hi);
    if (got.black !== black || got.white !== white || got.gray !== walnut.length - black - white || got.total !== walnut.length) // prettier-ignore
      fail(`window ${lo}..${hi}: page ${JSON.stringify(got)}, counted ${black} black, ${white} white`);
    windows++;
  }
}
console.log(`window  ${windows.toLocaleString('en-US')} windows, each counted over ${walnut.length.toLocaleString('en-US')} walnut voxels: all equal`);

// 2. Every pixel of every cut.
const at = (x, y, z) => vol[x + nx * (y + ny * z)];
let cutPixels = 0;
for (const [name, c] of Object.entries(CUTS)) {
  for (let k = 0; k < c.n; k++) {
    const pic = cut(vol, name, k);
    for (let j = 0; j < c.h; j++)
      for (let i = 0; i < c.w; i++) {
        const want = name === 'top' ? at(i, j, k) : name === 'front' ? at(i, k, j) : at(k, i, j);
        if (pic[j * c.w + i] !== want) fail(`${name} cut ${k} at ${i},${j}`);
        cutPixels++;
      }
  }
}
console.log(`cuts    ${cutPixels.toLocaleString('en-US')} pixels in ${nz + ny + nx} slices: all equal`);

// 3. The maximum-intensity picture. Straight on, rays run along y: each pixel equals the largest
//    voxel along its ray. At every whole degree of a full turn: each pixel equals the largest
//    voxel whose center falls on its ray, found the slow way, through the air and all; and no
//    pixel inside the walnut's outline is left dark between two lit neighbors.
const solid = solids(vol);
const m = mip(solid, 0);
const off = MIP_W / 2 - (nx - 1) / 2; // the ray through voxel column x lands on pixel x + off
for (let z = 0; z < nz; z++)
  for (let x = 0; x < nx; x++) {
    let want = 0;
    for (let y = 0; y < ny; y++) want = Math.max(want, at(x, y, z));
    if (m[z * MIP_W + x + off] !== want) fail(`maximum-intensity picture at ${x},${z}`);
  }
let pinholes = 0;
const slow = new Uint8Array(MIP_W * nz);
for (let deg = 0; deg < 360; deg++) {
  const theta = (deg * Math.PI) / 180;
  const got = mip(solid, theta);
  slow.fill(0);
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  for (let z = 0; z < nz; z++)
    for (let y = 0; y < ny; y++)
      for (let x = 0; x < nx; x++) {
        const u = Math.floor(Math.fround((x - (nx - 1) / 2) * c + MIP_W / 2) + Math.fround((y - (ny - 1) / 2) * s));
        if (u < 0 || u >= MIP_W) continue;
        const v = at(x, y, z);
        if (v > slow[z * MIP_W + u]) slow[z * MIP_W + u] = v;
      }
  for (let i = 0; i < got.length; i++) if (got[i] !== slow[i]) fail(`maximum-intensity picture at ${deg} degrees, pixel ${i}`);
  for (let z = 0; z < nz; z++)
    for (let u = 1; u < MIP_W - 1; u++)
      if (!got[z * MIP_W + u] && got[z * MIP_W + u - 1] > 150 && got[z * MIP_W + u + 1] > 150) pinholes++;
}
if (pinholes) fail(`${pinholes} pinholes in the maximum-intensity picture`);
console.log(`mip     ${(nx * nz).toLocaleString('en-US')} rays straight on, and 360 turned pictures: all equal, no pinholes`);

// 3b. Back projection: from 180 views, the rebuilt slice matches the slice it was made from.
let worst = 1;
for (let z = 10; z < nz - 10; z += 6) {
  const pic = cut(vol, 'top', z);
  const back = rebuild(shadowSet(pic, nx, ny), nx, ny, 180);
  let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0;
  for (let i = 0; i < pic.length; i++) {
    const a = pic[i];
    const b = back[i];
    sa += a; sb += b; saa += a * a; sbb += b * b; sab += a * b;
  }
  const n = pic.length;
  const r = (n * sab - sa * sb) / Math.sqrt((n * saa - sa * sa) * (n * sbb - sb * sb));
  if (r < worst) worst = r;
}
if (worst < 0.95) fail(`back projection: correlation ${worst.toFixed(3)}`);
console.log(`rebuild from 180 views: correlation with the true slice at least ${worst.toFixed(3)}`);

// 4. Against Splashery's own file.
if (process.argv[2]) {
  const b = gunzipSync(readFileSync(process.argv[2]));
  const src = b.subarray(14, 14 + vol.length);
  for (let i = 0; i < vol.length; i++) if (src[i] !== vol[i]) fail(`voxel ${i} differs from the source`);
  console.log(`source  ${vol.length.toLocaleString('en-US')} voxels equal Splashery's walnut.vol.gz`);
}
console.log('ok');
