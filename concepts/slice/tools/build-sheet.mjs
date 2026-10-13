#!/usr/bin/env node
// Builds a scan's contact sheet, the picture the page reads its volume from, out of the file
// Splashery ships:
//
//   node concepts/slice/tools/build-sheet.mjs walnut <splashery>/assets/toys/walnut-ct/walnut.vol.gz
//   node concepts/slice/tools/build-sheet.mjs gar    <splashery>/assets/toys/volume-viewer/gar.nii.gz
//
// The sheet is an 8-bit gray PNG: every slice at its own size, side by side, nothing resampled.

import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync, deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { SCANS, sheetSize } from '../volume.js';

// The voxels of one of Splashery's two sample files, x fastest, then y, then z.
export function readSource(path) {
  const b = gunzipSync(readFileSync(path));
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  if (String.fromCharCode(b[0], b[1], b[2], b[3]) === 'WCT1') {
    // The walnut: the Imaging lane's own format.
    const [nx, ny, nz] = [dv.getUint16(4, true), dv.getUint16(6, true), dv.getUint16(8, true)];
    return { nx, ny, nz, mm: dv.getFloat32(10, true), data: b.subarray(14, 14 + nx * ny * nz) };
  }
  if (dv.getInt32(0, true) === 348 && dv.getInt16(70, true) === 2) {
    // The gar: NIfTI-1, 8-bit.
    const [nx, ny, nz] = [dv.getInt16(42, true), dv.getInt16(44, true), dv.getInt16(46, true)];
    const at = dv.getFloat32(108, true);
    return { nx, ny, nz, mm: dv.getFloat32(80, true), data: b.subarray(at, at + nx * ny * nz) };
  }
  throw new Error(`${path}: not a volume this tool reads`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [id, src] = process.argv.slice(2);
  const s = SCANS[id];
  if (!s || !src) {
    console.error('usage: build-sheet.mjs <walnut|gar> <file>');
    process.exit(1);
  }
  const v = readSource(src);
  if (v.nx !== s.nx || v.ny !== s.ny || v.nz !== s.nz || Math.abs(v.mm - s.mm) > 1e-6)
    throw new Error(`unexpected volume: ${v.nx} x ${v.ny} x ${v.nz} at ${v.mm} mm`);

  const { width, height } = sheetSize(s);
  const raw = new Uint8Array((width + 1) * height); // each row starts with filter byte 0
  for (let z = 0; z < s.nz; z++) {
    const ox = (z % s.cols) * s.nx;
    const oy = Math.floor(z / s.cols) * s.ny;
    for (let y = 0; y < s.ny; y++) {
      const from = s.nx * (y + s.ny * z);
      raw.set(v.data.subarray(from, from + s.nx), (oy + y) * (width + 1) + 1 + ox);
    }
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
  const out = fileURLToPath(new URL(`../${s.sheet}`, import.meta.url));
  writeFileSync(out, png);
  console.log(`${out}: ${width} x ${height}, ${png.length} bytes`);
}
