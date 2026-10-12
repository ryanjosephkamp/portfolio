#!/usr/bin/env node
// Builds assets/walnut-sheet.png, the contact sheet the page reads its volume from, out of
// Splashery's walnut file (assets/toys/walnut-ct/walnut.vol.gz in the splashery repository).
//
//   node concepts/slice/tools/build-sheet.mjs <path to walnut.vol.gz>
//
// The sheet is an 8-bit gray PNG: every slice at its own size, 12 to a row, nothing resampled.

import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync, deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { SCAN, sheetSize } from '../volume.js';

const src = process.argv[2];
if (!src) {
  console.error('usage: build-sheet.mjs <walnut.vol.gz>');
  process.exit(1);
}
const b = gunzipSync(readFileSync(src));
const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
const magic = String.fromCharCode(b[0], b[1], b[2], b[3]);
const [nx, ny, nz] = [dv.getUint16(4, true), dv.getUint16(6, true), dv.getUint16(8, true)];
if (magic !== 'WCT1' || nx !== SCAN.nx || ny !== SCAN.ny || nz !== SCAN.nz)
  throw new Error(`unexpected volume: ${magic} ${nx} x ${ny} x ${nz}`);
const vol = b.subarray(14, 14 + nx * ny * nz);

const { width, height } = sheetSize();
const raw = new Uint8Array((width + 1) * height); // each row starts with filter byte 0
for (let z = 0; z < nz; z++) {
  const ox = (z % SCAN.cols) * nx;
  const oy = Math.floor(z / SCAN.cols) * ny;
  for (let y = 0; y < ny; y++)
    raw.set(vol.subarray(nx * (y + ny * z), nx * (y + ny * z) + nx), (oy + y) * (width + 1) + 1 + ox);
}

const table = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => {
  let c = 0xffffffff;
  for (const x of buf) c = table[(c ^ x) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'latin1');
  Buffer.from(data).copy(out, 8);
  out.writeUInt32BE(crc(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
};
const head = Buffer.alloc(13);
head.writeUInt32BE(width, 0);
head.writeUInt32BE(height, 4);
head.set([8, 0, 0, 0, 0], 8); // 8 bits, gray, no interlace
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', head),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', new Uint8Array(0)),
]);
const out = fileURLToPath(new URL('../assets/walnut-sheet.png', import.meta.url));
writeFileSync(out, png);
console.log(`${out}: ${width} x ${height}, ${png.length} bytes`);
