// The walnut's X-ray CT volume, as Splashery ships it (assets/toys/walnut-ct/walnut.vol.gz):
//   "WCT1", then uint16 nx, ny, nz, then float32 voxel size (mm), then nx*ny*nz uint8
//   densities, x fastest. 255 is the shell's densest.
// Each kept voxel becomes one splat at its center, sized to the voxel; when the budget
// keeps only some of them, each kept splat grows to stand for the ones left out.
import { gunzipSync } from "fflate";
import { makeSet } from "./splats.js";
import { hash01 } from "./math.js";

export const WALNUT_FLOOR = 40;

export function readWalnut(gz, budget = 200000) {
  // A server may already have inflated it (Content-Encoding: gzip).
  const d = gz[0] === 0x1f && gz[1] === 0x8b ? gunzipSync(gz) : gz;
  const tag = String.fromCharCode(d[0], d[1], d[2], d[3]);
  if (tag !== "WCT1") throw new Error("Not a WCT1 volume.");
  const dv = new DataView(d.buffer, d.byteOffset, d.byteLength);
  const nx = dv.getUint16(4, true);
  const ny = dv.getUint16(6, true);
  const nz = dv.getUint16(8, true);
  const voxel = dv.getFloat32(10, true);
  const v = d.subarray(14);
  let kept = 0;
  for (let i = 0; i < v.length; i++) if (v[i] >= WALNUT_FLOOR) kept++;
  const p = Math.min(1, budget / kept);
  const grow = Math.cbrt(1 / p);
  const set = makeSet(Math.min(kept, Math.ceil(budget * 1.02)));
  let n = 0;
  const half = [nx / 2, ny / 2, nz / 2];
  for (let z = 0; z < nz; z++)
    for (let y = 0; y < ny; y++)
      for (let x = 0; x < nx; x++) {
        const i = x + nx * (y + ny * z);
        const val = v[i];
        if (val < WALNUT_FLOOR) continue;
        if (p < 1 && hash01(i) >= p) continue;
        if (n >= set.count) continue;
        const j = n++;
        const jx = hash01(i * 3 + 1) - 0.5;
        const jy = hash01(i * 3 + 2) - 0.5;
        const jz = hash01(i * 3 + 3) - 0.5;
        // The scan's z is the walnut's long axis; stand it up along y.
        set.pos[j * 3] = (x - half[0] + jx * 0.6) * voxel;
        set.pos[j * 3 + 1] = (z - half[2] + jz * 0.6) * voxel;
        set.pos[j * 3 + 2] = (y - half[1] + jy * 0.6) * voxel;
        const s = voxel * 0.62 * grow;
        set.scale[j * 3] = s;
        set.scale[j * 3 + 1] = s;
        set.scale[j * 3 + 2] = s;
        set.rot[j * 4 + 3] = 1;
        const t = (val - WALNUT_FLOOR) / (255 - WALNUT_FLOOR);
        const c = densityColor(t);
        set.color[j * 4] = c[0];
        set.color[j * 4 + 1] = c[1];
        set.color[j * 4 + 2] = c[2];
        set.color[j * 4 + 3] = Math.round(255 * Math.min(1, 0.32 + 0.85 * t));
        set.part[j] = 0;
      }
  set.count = n;
  for (const k of ["pos", "scale"]) set[k] = set[k].subarray(0, n * 3);
  for (const k of ["rot", "color"]) set[k] = set[k].subarray(0, n * 4);
  set.part = set.part.subarray(0, n);
  return { set, info: { nx, ny, nz, voxel, kept, used: n } };
}

// Low density to high: dark husk, the kernel's tan, the shell's pale ivory.
function densityColor(t) {
  const stops = [
    [0, [74, 52, 36]],
    [0.3, [150, 112, 74]],
    [0.6, [214, 188, 150]],
    [1, [248, 240, 226]],
  ];
  for (let k = 1; k < stops.length; k++)
    if (t <= stops[k][0]) {
      const [t0, a] = stops[k - 1];
      const [t1, b] = stops[k];
      const f = (t - t0) / (t1 - t0);
      return a.map((x, m) => Math.round(x + (b[m] - x) * f));
    }
  return stops[stops.length - 1][1];
}
