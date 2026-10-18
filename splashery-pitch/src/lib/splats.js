// A splat set, the one shape every source on the page is turned into:
//   pos    Float32Array(3n)  centers
//   scale  Float32Array(3n)  standard deviations along the splat's own axes
//   rot    Float32Array(4n)  turn, as a quaternion [x, y, z, w]
//   color  Uint8Array(4n)    red, green, blue, and opacity in alpha
//   part   Uint8Array(n)     which moving part a splat belongs to (0 for none)
import { toHalf, floatBits } from "./math.js";

export function makeSet(n) {
  return {
    count: n,
    pos: new Float32Array(n * 3),
    scale: new Float32Array(n * 3),
    rot: new Float32Array(n * 4),
    color: new Uint8Array(n * 4),
    part: new Uint8Array(n),
  };
}

// The GPU layout: two RGBA32UI texels per splat.
//   texel 0: x, y, z as float bits; color as rgba8
//   texel 1: half(sx) half(sy), half(sz) half(qx), half(qy) half(qz), half(qw) half(part)
export const ROW_SPLATS = 1024; // splats per texture row (2048 texels)

export function packGPU(set, out) {
  const n = set.count;
  const u = out || new Uint32Array(Math.ceil(n / ROW_SPLATS) * ROW_SPLATS * 8);
  const { pos, scale, rot, color, part } = set;
  for (let i = 0; i < n; i++) {
    const o = i * 8;
    const i3 = i * 3;
    const i4 = i * 4;
    u[o] = floatBits(pos[i3]);
    u[o + 1] = floatBits(pos[i3 + 1]);
    u[o + 2] = floatBits(pos[i3 + 2]);
    u[o + 3] = (color[i4] | (color[i4 + 1] << 8) | (color[i4 + 2] << 16) | (color[i4 + 3] << 24)) >>> 0; // prettier-ignore
    u[o + 4] = (toHalf(scale[i3]) | (toHalf(scale[i3 + 1]) << 16)) >>> 0;
    u[o + 5] = (toHalf(scale[i3 + 2]) | (toHalf(rot[i4]) << 16)) >>> 0;
    u[o + 6] = (toHalf(rot[i4 + 1]) | (toHalf(rot[i4 + 2]) << 16)) >>> 0;
    u[o + 7] = (toHalf(rot[i4 + 3]) | (toHalf(part ? part[i] : 0) << 16)) >>> 0;
  }
  return u;
}

export function bounds(set) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  const p = set.pos;
  for (let i = 0; i < set.count; i++)
    for (let k = 0; k < 3; k++) {
      const v = p[i * 3 + k];
      if (v < min[k]) min[k] = v;
      if (v > max[k]) max[k] = v;
    }
  return { min, max };
}

// A robust center and radius: the median center, and the radius that holds 98% of
// the splats, so a few stray floaters don't decide the framing.
export function framing(set, keep = 0.98) {
  const n = set.count;
  const step = Math.max(1, Math.floor(n / 20000));
  const xs = [];
  const ys = [];
  const zs = [];
  for (let i = 0; i < n; i += step) {
    if (set.color[i * 4 + 3] < 40) continue;
    xs.push(set.pos[i * 3]);
    ys.push(set.pos[i * 3 + 1]);
    zs.push(set.pos[i * 3 + 2]);
  }
  const med = (a) => a.sort((p, q) => p - q)[a.length >> 1] ?? 0;
  const c = [med(xs.slice()), med(ys.slice()), med(zs.slice())];
  const d = xs.map((x, j) => Math.hypot(x - c[0], ys[j] - c[1], zs[j] - c[2])).sort((p, q) => p - q);
  const r = d[Math.min(d.length - 1, Math.floor(d.length * keep))] || 1;
  return { center: c, radius: r };
}

// Moves and scales a set in place so its framing center is at the origin and its
// framing radius is `radius`.
export function normalize(set, radius = 1) {
  const f = framing(set);
  const s = radius / f.radius;
  for (let i = 0; i < set.count; i++)
    for (let k = 0; k < 3; k++) {
      set.pos[i * 3 + k] = (set.pos[i * 3 + k] - f.center[k]) * s;
      set.scale[i * 3 + k] *= s;
    }
  return { center: f.center, scale: s };
}
