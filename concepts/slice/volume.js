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

// The maximum-intensity picture: the densest voxel along every ray, with the walnut turned
// by theta about its long axis. MIP_W x nz pixels.
export const MIP_W = 132;
export function mip(vol, theta, out) {
  const { nx, ny, nz } = SCAN;
  out = out || new Uint8Array(MIP_W * nz);
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const cx = (nx - 1) / 2;
  const cy = (ny - 1) / 2;
  const half = MIP_W / 2;
  const depth = 164;
  for (let u = 0; u < MIP_W; u++) {
    const du = u + 0.5 - half;
    // Walk the ray once and remember which columns of voxels it crosses.
    const cols = [];
    for (let t = 0; t < depth; t++) {
      const dt = t + 0.5 - depth / 2;
      const x = Math.round(cx + du * c - dt * s);
      const y = Math.round(cy + du * s + dt * c);
      if (x >= 0 && x < nx && y >= 0 && y < ny) cols.push(x + nx * y);
    }
    for (let z = 0; z < nz; z++) {
      const plane = z * nx * ny;
      let m = 0;
      for (let i = 0; i < cols.length; i++) {
        const v = vol[plane + cols[i]];
        if (v > m) m = v;
      }
      out[z * MIP_W + u] = m;
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
    for (let x = 0; x < w; x++) {
      const r = (x - cx) * c + (y - cy) * s + mid;
      const i = Math.floor(r);
      if (i < 0 || i >= BINS - 1) continue;
      const f = r - i;
      acc[y * w + x] += q[i] * (1 - f) + q[i + 1] * f;
    }
  }
}

// The picture rebuilt from `views` evenly spaced shadows over half a turn. Returns the
// rebuilt densities (about 0..255) and the shadows themselves, one row per view.
export function rebuild(pic, w, h, views) {
  const acc = new Float32Array(w * h);
  const rows = new Float32Array(views * BINS);
  const p = new Float32Array(BINS);
  const q = new Float32Array(BINS);
  for (let v = 0; v < views; v++) {
    const theta = (v * Math.PI) / views;
    shadow(pic, w, h, theta, p);
    rows.set(p, v * BINS);
    rampFilter(p, q);
    smear(acc, w, h, theta, q);
  }
  const scale = Math.PI / views;
  for (let i = 0; i < acc.length; i++) acc[i] *= scale;
  return { picture: acc, shadows: rows };
}
