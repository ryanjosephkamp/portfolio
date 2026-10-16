// A binary tree over a splat set, for the dial from one splat to all of them. Each
// node is split at its median along the longest side of its box, so level L holds
// 2^L nodes of nearly equal size. A node is drawn as the one Gaussian with the same
// mass, center and covariance as the splats under it:
//   w_i = a_i * s_x s_y s_z                    (opacity times volume)
//   mu  = sum w_i mu_i / W
//   S   = sum w_i (S_i + mu_i mu_i^T) / W - mu mu^T
// and its color the same weighted mean; its opacity comes from the splats' combined
// transmittance.
import { covariance, decompose } from "./math.js";
import { makeSet } from "./splats.js";

export function buildTree(set) {
  const n = set.count;
  const levels = Math.floor(Math.log2(n));
  const perm = new Uint32Array(n);
  for (let i = 0; i < n; i++) perm[i] = i;
  const pos = set.pos;
  const bounds = [new Uint32Array([0, n])];
  for (let L = 0; L < levels; L++) {
    const prev = bounds[L];
    const next = new Uint32Array(2 ** (L + 1) + 1);
    const nodes = 2 ** L;
    for (let k = 0; k < nodes; k++) {
      const lo = prev[k];
      const hi = prev[k + 1];
      const mid = (lo + hi) >> 1;
      if (hi - lo > 1) {
        const axis = longestAxis(pos, perm, lo, hi);
        select(pos, perm, lo, hi - 1, mid, axis);
      }
      next[2 * k] = lo;
      next[2 * k + 1] = mid;
    }
    next[2 * nodes] = n;
    bounds.push(next);
  }
  // Per-splat covariance and weight, once.
  const cov = new Float32Array(n * 6);
  const w = new Float32Array(n);
  const s = [0, 0, 0];
  const q = [0, 0, 0, 1];
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < 3; k++) s[k] = set.scale[i * 3 + k];
    for (let k = 0; k < 4; k++) q[k] = set.rot[i * 4 + k];
    const c = covariance(s, q);
    for (let k = 0; k < 6; k++) cov[i * 6 + k] = c[k];
    w[i] = (set.color[i * 4 + 3] / 255) * s[0] * s[1] * s[2] + 1e-15;
  }
  return { levels, perm, bounds, cov, w, cache: new Map() };
}

export const leafCount = (tree) => tree.perm.length;

function longestAxis(pos, perm, lo, hi) {
  let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity; // prettier-ignore
  const step = hi - lo > 4096 ? Math.floor((hi - lo) / 2048) : 1;
  for (let j = lo; j < hi; j += step) {
    const o = perm[j] * 3;
    const x = pos[o];
    const y = pos[o + 1];
    const z = pos[o + 2];
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
    if (z < z0) z0 = z;
    if (z > z1) z1 = z;
  }
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dz = z1 - z0;
  return dx >= dy && dx >= dz ? 0 : dy >= dz ? 1 : 2;
}

// Quickselect: puts the k-th smallest (by the axis) at k, smaller ones before it.
function select(pos, perm, lo, hi, k, axis) {
  while (hi > lo) {
    const pivot = pos[perm[(lo + hi) >> 1] * 3 + axis];
    let i = lo;
    let j = hi;
    while (i <= j) {
      while (pos[perm[i] * 3 + axis] < pivot) i++;
      while (pos[perm[j] * 3 + axis] > pivot) j--;
      if (i <= j) {
        const t = perm[i];
        perm[i] = perm[j];
        perm[j] = t;
        i++;
        j--;
      }
    }
    if (k <= j) hi = j;
    else if (k >= i) lo = i;
    else return;
  }
}

// The merged Gaussians of level L, cached.
function level(tree, set, L) {
  if (tree.cache.has(L)) return tree.cache.get(L);
  const b = tree.bounds[L];
  const nodes = b.length - 1;
  const out = makeSet(nodes);
  const { perm, cov, w } = tree;
  const pos = set.pos;
  const col = set.color;
  const dec = { s: [0, 0, 0], q: [0, 0, 0, 1] };
  const C = [0, 0, 0, 0, 0, 0];
  for (let k = 0; k < nodes; k++) {
    const lo = b[k];
    const hi = b[k + 1];
    let W = 0, mx = 0, my = 0, mz = 0; // prettier-ignore
    let xx = 0, xy = 0, xz = 0, yy = 0, yz = 0, zz = 0; // prettier-ignore
    let r = 0, g = 0, bl = 0, clear = 0; // prettier-ignore
    for (let j = lo; j < hi; j++) {
      const i = perm[j];
      const wi = w[i];
      const o = i * 3;
      const x = pos[o];
      const y = pos[o + 1];
      const z = pos[o + 2];
      const c6 = i * 6;
      W += wi;
      mx += wi * x;
      my += wi * y;
      mz += wi * z;
      xx += wi * (cov[c6] + x * x);
      xy += wi * (cov[c6 + 1] + x * y);
      xz += wi * (cov[c6 + 2] + x * z);
      yy += wi * (cov[c6 + 3] + y * y);
      yz += wi * (cov[c6 + 4] + y * z);
      zz += wi * (cov[c6 + 5] + z * z);
      r += wi * col[i * 4];
      g += wi * col[i * 4 + 1];
      bl += wi * col[i * 4 + 2];
      clear += Math.log(1 - Math.min(0.995, col[i * 4 + 3] / 255));
    }
    if (W <= 0 || hi <= lo) continue;
    mx /= W;
    my /= W;
    mz /= W;
    C[0] = xx / W - mx * mx;
    C[1] = xy / W - mx * my;
    C[2] = xz / W - mx * mz;
    C[3] = yy / W - my * my;
    C[4] = yz / W - my * mz;
    C[5] = zz / W - mz * mz;
    decompose(C, dec);
    out.pos[k * 3] = mx;
    out.pos[k * 3 + 1] = my;
    out.pos[k * 3 + 2] = mz;
    for (let a = 0; a < 3; a++) out.scale[k * 3 + a] = dec.s[a];
    for (let a = 0; a < 4; a++) out.rot[k * 4 + a] = dec.q[a];
    out.color[k * 4] = r / W;
    out.color[k * 4 + 1] = g / W;
    out.color[k * 4 + 2] = bl / W;
    // Opacity: how much the node's splats cover together (their transmittance multiplied,
    // tempered because they overlap), so a node of many faint splats reads as solid.
    out.color[k * 4 + 3] = Math.round(255 * Math.min(0.98, 1 - Math.exp(0.5 * clear)));
  }
  tree.cache.set(L, out);
  return out;
}

// Merged level L as a plain set (for a level shown at rest).
export function levelSet(tree, set, L) {
  return L > tree.levels ? set : level(tree, set, L);
}

// The flight from level L to level L + 1: every child starts as its parent.
// Level levels + 1 is the set itself, in tree order.
export function levelPair(tree, set, L) {
  const parent = level(tree, set, L);
  const leaf = L + 1 > tree.levels;
  const n = leaf ? set.count : 2 ** (L + 1);
  const from = makeSet(n);
  const to = makeSet(n);
  const b = tree.bounds[L];
  const child = leaf ? null : level(tree, set, L + 1);
  const copy = (dst, j, src, i) => {
    for (let k = 0; k < 3; k++) {
      dst.pos[j * 3 + k] = src.pos[i * 3 + k];
      dst.scale[j * 3 + k] = src.scale[i * 3 + k];
    }
    for (let k = 0; k < 4; k++) {
      dst.rot[j * 4 + k] = src.rot[i * 4 + k];
      dst.color[j * 4 + k] = src.color[i * 4 + k];
    }
  };
  if (leaf) {
    for (let k = 0; k < b.length - 1; k++)
      for (let j = b[k]; j < b[k + 1]; j++) {
        copy(from, j, parent, k);
        copy(to, j, set, tree.perm[j]);
      }
  } else {
    for (let k = 0; k < b.length - 1; k++)
      for (const c of [2 * k, 2 * k + 1]) {
        copy(from, c, parent, k);
        copy(to, c, child, c);
      }
  }
  return { from, to };
}
