// The math behind the light box, with no DOM: the walnut's volume, its slices, its
// maximum-intensity picture, the window, and the back projection. main.js draws with these;
// verify.mjs checks them.

// The walnut as the contact sheet stores it: 142 slices of 113 x 115 voxels, 12 to a row,
// 0.3 mm to a voxel on every axis. Voxel z runs down the walnut.
export const SCAN = { nx: 113, ny: 115, nz: 142, cols: 12, mm: 0.3 };

// Densities at or below AIR are air; the shell starts at SHELL (both of 255).
export const AIR = 55;
export const SHELL = 158;

// The three windows, named as Splashery's volume viewer names its presets.
export const PRESETS = {
  full: { label: "Full range", lo: AIR, hi: 240 },
  soft: { label: "Soft tissue", lo: AIR, hi: SHELL },
  bone: { label: "Bone", lo: SHELL, hi: 232 },
};

// The contact sheet's pixels (one byte per pixel, or RGBA with step 4) to one volume.
export function sheetToVolume(pixels, sheetWidth, step = 1) {
  const { nx, ny, nz, cols } = SCAN;
  const vol = new Uint8Array(nx * ny * nz);
  for (let z = 0; z < nz; z++) {
    const ox = (z % cols) * nx;
    const oy = Math.floor(z / cols) * ny;
    for (let y = 0; y < ny; y++) {
      const row = ((oy + y) * sheetWidth + ox) * step;
      const out = nx * (y + ny * z);
      for (let x = 0; x < nx; x++) vol[out + x] = pixels[row + x * step];
    }
  }
  return vol;
}

export const sheetSize = () => ({
  width: SCAN.cols * SCAN.nx,
  height: Math.ceil(SCAN.nz / SCAN.cols) * SCAN.ny,
});

// The three cuts. Each is a picture w x h read out of the volume at index k along its axis.
//   top    looks down the walnut: x across, y down the picture, k = z
//   front  x across, z down, k = y
//   side   y across, z down, k = x
export const CUTS = {
  top: { label: "Top down", w: SCAN.nx, h: SCAN.ny, n: SCAN.nz, across: 0, down: 1, along: 2 },
  front: { label: "Front to back", w: SCAN.nx, h: SCAN.nz, n: SCAN.ny, across: 0, down: 2, along: 1 }, // prettier-ignore
  side: { label: "Side to side", w: SCAN.ny, h: SCAN.nz, n: SCAN.nx, across: 1, down: 2, along: 0 },
};

const STRIDE = [1, SCAN.nx, SCAN.nx * SCAN.ny];

export function cut(vol, name, k, out) {
  const c = CUTS[name];
  const sa = STRIDE[c.across];
  const sd = STRIDE[c.down];
  const base = k * STRIDE[c.along];
  out = out || new Uint8Array(c.w * c.h);
  for (let j = 0; j < c.h; j++) {
    let p = base + j * sd;
    const o = j * c.w;
    for (let i = 0; i < c.w; i++, p += sa) out[o + i] = vol[p];
  }
  return out;
}

// The walnut's own voxels (density 1 or more), listed once, slice by slice: where each one is
// and how dense. The pictures that look through the whole walnut walk this list, not the air.
export function solids(vol) {
  const { nx, ny, nz } = SCAN;
  let n = 0;
  for (let i = 0; i < vol.length; i++) if (vol[i]) n++;
  const x = new Uint8Array(n);
  const y = new Uint8Array(n);
  const v = new Uint8Array(n);
  const start = new Uint32Array(nz + 1);
  let k = 0;
  for (let z = 0, i = 0; z < nz; z++) {
    start[z] = k;
    for (let yy = 0; yy < ny; yy++)
      for (let xx = 0; xx < nx; xx++, i++)
        if (vol[i]) {
          x[k] = xx;
          y[k] = yy;
          v[k] = vol[i];
          k++;
        }
  }
  start[nz] = k;
  return { x, y, v, start };
}

// The maximum-intensity picture: the densest voxel along every ray, with the walnut turned
// by theta about its long axis. MIP_W x nz pixels. Each voxel lands on the one ray that
// passes within half a voxel of its center.
export const MIP_W = 132;
export function mip(solid, theta, out) {
  const { nx, ny, nz } = SCAN;
  out = out || new Uint8Array(MIP_W * nz);
  out.fill(0);
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const ux = new Float32Array(nx);
  const uy = new Float32Array(ny);
  for (let i = 0; i < nx; i++) ux[i] = (i - (nx - 1) / 2) * c + MIP_W / 2;
  for (let j = 0; j < ny; j++) uy[j] = (j - (ny - 1) / 2) * s;
  const { x, y, v, start } = solid;
  for (let z = 0; z < nz; z++) {
    const row = z * MIP_W;
    for (let k = start[z], end = start[z + 1]; k < end; k++) {
      const u = Math.floor(ux[x[k]] + uy[y[k]]);
      if (u < 0 || u >= MIP_W) continue;
      if (v[k] > out[row + u]) out[row + u] = v[k];
    }
  }
  return out;
}

// ---- The window ---------------------------------------------------------------------------

export function histogram(vol) {
  const h = new Uint32Array(256);
  for (let i = 0; i < vol.length; i++) h[vol[i]]++;
  return h;
}

// upTo[v] = how many voxels of the walnut (density 1 or more) have a density of v or less.
export function runningCount(hist) {
  const upTo = new Uint32Array(256);
  let sum = 0;
  for (let v = 1; v < 256; v++) {
    sum += hist[v];
    upTo[v] = sum;
  }
  return upTo;
}

// What a window (lo, hi) does to the walnut's voxels: how many print black (at or below lo),
// how many print white (at or above hi), and how many keep a gray of their own.
export function windowCounts(upTo, lo, hi) {
  const total = upTo[255];
  const black = upTo[lo];
  const white = total - upTo[hi - 1];
  return { black, white, gray: total - black - white, total };
}

// 256 colors for a window: [r, g, b, 255] per density. ramp(t) gives a color for 0..1.
export function lookup(lo, hi, ramp) {
  const lut = new Uint8ClampedArray(1024);
  for (let v = 0; v < 256; v++) {
    const t = v <= lo ? 0 : v >= hi ? 1 : (v - lo) / (hi - lo);
    const [r, g, b] = ramp(t);
    lut[v * 4] = r;
    lut[v * 4 + 1] = g;
    lut[v * 4 + 2] = b;
    lut[v * 4 + 3] = 255;
  }
  return lut;
}

// ---- How a CT sees: shadows, then filtered back projection ---------------------------------

export const BINS = 165;

// One X-ray shadow of a picture (w x h densities) from angle theta: the sum along every ray.
export function shadow(pic, w, h, theta, out) {
  out = out || new Float32Array(BINS);
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const mid = (BINS - 1) / 2;
  for (let b = 0; b < BINS; b++) {
    const r = b - mid;
    let sum = 0;
    for (let t = 0; t < BINS; t++) {
      const d = t - mid;
      const x = Math.round(cx + r * c - d * s);
      const y = Math.round(cy + r * s + d * c);
      if (x >= 0 && x < w && y >= 0 && y < h) sum += pic[y * w + x];
    }
    out[b] = sum;
  }
  return out;
}

// The ramp filter (Ram-Lak), applied to one shadow.
export function rampFilter(p, out) {
  out = out || new Float32Array(BINS);
  for (let i = 0; i < BINS; i++) {
    let sum = p[i] / 4;
    for (let k = 1; i - k >= 0 || i + k < BINS; k += 2) {
      const wgt = -1 / (Math.PI * Math.PI * k * k);
      if (i - k >= 0) sum += p[i - k] * wgt;
      if (i + k < BINS) sum += p[i + k] * wgt;
    }
    out[i] = sum;
  }
  return out;
}

// Smear one filtered shadow back across the picture, adding to acc.
export function smear(acc, w, h, theta, q) {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const mid = (BINS - 1) / 2;
  for (let y = 0; y < h; y++) {
    let r = -cx * c + (y - cy) * s + mid;
    const o = y * w;
    for (let x = 0; x < w; x++, r += c) {
      const i = Math.floor(r);
      if (i < 0 || i >= BINS - 1) continue;
      const f = r - i;
      acc[o + x] += q[i] + (q[i + 1] - q[i]) * f;
    }
  }
}

// Every shadow of a picture, one for each whole degree of half a turn, raw and filtered.
// Computed once for a slice; rebuild() then only has to smear.
export const TURN = 180;
export function shadowSet(pic, w, h) {
  const raw = new Float32Array(TURN * BINS);
  const filtered = new Float32Array(TURN * BINS);
  for (let a = 0; a < TURN; a++) {
    const p = raw.subarray(a * BINS, (a + 1) * BINS);
    shadow(pic, w, h, (a * Math.PI) / TURN, p);
    rampFilter(p, filtered.subarray(a * BINS, (a + 1) * BINS));
  }
  return { raw, filtered };
}

// Which of the 180 shadows a rebuild from `views` evenly spaced views uses.
export const viewAngle = (i, views) => Math.floor((i * TURN) / views);

// The picture rebuilt from `views` evenly spaced shadows: densities of about 0..255.
export function rebuild(set, w, h, views) {
  const acc = new Float32Array(w * h);
  for (let i = 0; i < views; i++) {
    const a = viewAngle(i, views);
    smear(acc, w, h, (a * Math.PI) / TURN, set.filtered.subarray(a * BINS, (a + 1) * BINS));
  }
  const scale = Math.PI / views;
  for (let i = 0; i < acc.length; i++) acc[i] *= scale;
  return acc;
}
