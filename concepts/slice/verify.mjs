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
import { SCAN, CUTS, MIP_W, sheetToVolume, sheetSize, cut, mip, histogram, runningCount, windowCounts } from './volume.js'; // prettier-ignore

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

// 3. The maximum-intensity picture, straight on: rays run along y.
const m = mip(vol, 0);
const off = MIP_W / 2 - (nx - 1) / 2 - 1; // the ray through voxel column x lands on pixel x + off
for (let z = 0; z < nz; z++)
  for (let x = 0; x < nx; x++) {
    let want = 0;
    for (let y = 0; y < ny; y++) want = Math.max(want, at(x, y, z));
    if (m[z * MIP_W + x + off] !== want) fail(`maximum-intensity picture at ${x},${z}`);
  }
console.log(`mip     ${(nx * nz).toLocaleString('en-US')} rays: all equal`);

// 4. Against Splashery's own file.
if (process.argv[2]) {
  const b = gunzipSync(readFileSync(process.argv[2]));
  const src = b.subarray(14, 14 + vol.length);
  for (let i = 0; i < vol.length; i++) if (src[i] !== vol[i]) fail(`voxel ${i} differs from the source`);
  console.log(`source  ${vol.length.toLocaleString('en-US')} voxels equal Splashery's walnut.vol.gz`);
}
console.log('ok');
