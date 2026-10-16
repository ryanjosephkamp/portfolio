// Pairs two clouds for a flight. Both are put in Morton order (a space-filling curve
// over each cloud's own box), and the r-th splat of one flies to the r-th splat of
// the other, so neighbors stay neighbors and every splat travels a short way. When
// one cloud has more splats, the other's splats are used more than once: the extra
// copies grow out of a splat that is there, or shrink into one.
import { makeSet } from "./splats.js";

function spread10(v) {
  v &= 0x3ff;
  v = (v | (v << 16)) & 0x030000ff;
  v = (v | (v << 8)) & 0x0300f00f;
  v = (v | (v << 4)) & 0x030c30c3;
  v = (v | (v << 2)) & 0x09249249;
  return v;
}

export function mortonOrder(set) {
  const n = set.count;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < n; i++)
    for (let k = 0; k < 3; k++) {
      const v = set.pos[i * 3 + k];
      if (v < min[k]) min[k] = v;
      if (v > max[k]) max[k] = v;
    }
  const keys = new Uint32Array(n);
  const sx = 1023 / (max[0] - min[0] || 1);
  const sy = 1023 / (max[1] - min[1] || 1);
  const sz = 1023 / (max[2] - min[2] || 1);
  for (let i = 0; i < n; i++) {
    const x = ((set.pos[i * 3] - min[0]) * sx) | 0;
    const y = ((set.pos[i * 3 + 1] - min[1]) * sy) | 0;
    const z = ((set.pos[i * 3 + 2] - min[2]) * sz) | 0;
    keys[i] = (spread10(x) | (spread10(y) << 1) | (spread10(z) << 2)) >>> 0;
  }
  const idx = new Uint32Array(n);
  for (let i = 0; i < n; i++) idx[i] = i;
  idx.sort((a, b) => keys[a] - keys[b]);
  return idx;
}

function copy(dst, j, src, i, hidden) {
  for (let k = 0; k < 3; k++) {
    dst.pos[j * 3 + k] = src.pos[i * 3 + k];
    dst.scale[j * 3 + k] = hidden ? 0 : src.scale[i * 3 + k];
  }
  for (let k = 0; k < 4; k++) dst.rot[j * 4 + k] = src.rot[i * 4 + k];
  for (let k = 0; k < 3; k++) dst.color[j * 4 + k] = src.color[i * 4 + k];
  dst.color[j * 4 + 3] = hidden ? 0 : src.color[i * 4 + 3];
  dst.part[j] = src.part ? src.part[i] : 0;
}

export function pairSets(A, B) {
  const M = Math.max(A.count, B.count);
  const ia = mortonOrder(A);
  const ib = mortonOrder(B);
  const a = makeSet(M);
  const b = makeSet(M);
  const nA = A.count;
  const nB = B.count;
  let lastA = -1;
  let lastB = -1;
  for (let r = 0; r < M; r++) {
    const ra = Math.floor((r * nA) / M);
    const rb = Math.floor((r * nB) / M);
    copy(a, r, A, ia[ra], ra === lastA);
    copy(b, r, B, ib[rb], rb === lastB);
    lastA = ra;
    lastB = rb;
  }
  return { a, b };
}
