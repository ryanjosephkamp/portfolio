// The splat cloud's shapes: one seeded recipe per Splashery shelf on the page.

export function mulberry(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TAU = Math.PI * 2;
const onSphere = (r, R) => {
  const u = r() * 2 - 1;
  const a = r() * TAU;
  const s = Math.sqrt(1 - u * u);
  return [s * Math.cos(a) * R, u * R, s * Math.sin(a) * R];
};
// Each shape places splat number i from t = i / count, in [0, 1), and a seeded random source r.
export const SHAPES = {
  blob: (t, r) => {
    const p = onSphere(r, 1);
    const k = 0.82 + 0.16 * Math.sin(5 * p[0]) * Math.cos(4 * p[1] + p[2] * 3);
    return [p[0] * k, p[1] * k, p[2] * k];
  },
  space: (t, r) => {
    if (t < 0.58) return onSphere(r, 0.62);
    const a = r() * TAU;
    const R = 0.92 + r() * 0.42;
    return [Math.cos(a) * R, Math.cos(a) * R * 0.32, Math.sin(a) * R];
  },
  tiny: (t, r) => {
    const y = (t - 0.5) * 2.3;
    const a = t * 13;
    const k = Math.floor(r() * 3);
    if (k < 2) return [Math.cos(a + k * Math.PI) * 0.46, y, Math.sin(a + k * Math.PI) * 0.46];
    const s = Math.round(t * 22) / 22;
    const m = r() * 2 - 1;
    return [Math.cos(s * 13) * 0.46 * m, (s - 0.5) * 2.3, Math.sin(s * 13) * 0.46 * m];
  },
  atoms: (t, r) => {
    if (t < 0.2) return onSphere(r, 0.2 * Math.cbrt(r()));
    const a = r() * TAU;
    const tilt = (Math.floor(t * 90) % 3) * (Math.PI / 3);
    const x = Math.cos(a) * 1.05;
    const z = Math.sin(a) * 1.05;
    return [x * Math.cos(tilt) + (r() - 0.5) * 0.04, x * Math.sin(tilt), z * 0.9];
  },
  body: (t, r) => {
    const a = r() * TAU;
    const k = Math.sqrt(r());
    const x = (16 * Math.sin(a) ** 3) / 17;
    const y = (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 17;
    return [x * k, y * k + 0.1, (r() - 0.5) * 0.7 * (1 - k * k)];
  },
  nature: (t, r, i) => {
    const R = Math.sqrt(t) * 1.1;
    const a = i * 2.39996;
    return [Math.cos(a) * R, Math.sin(a) * R, 0.35 * (1 - R * R)];
  },
  weather: (t, r) => {
    const R = (0.1 + 0.85 * t ** 1.7) * (0.7 + 0.3 * r());
    const a = t * 26 + r() * 1.4;
    return [Math.cos(a) * R, (t - 0.5) * 2.2, Math.sin(a) * R];
  },
  food: (t, r) => {
    const a = r() * TAU;
    const b = r() * TAU;
    const R = 0.74 + 0.32 * Math.cos(b);
    return [Math.cos(a) * R, 0.32 * Math.sin(b), Math.sin(a) * R];
  },
  playthings: (t, r) => {
    const p = [r() * 2 - 1, r() * 2 - 1, r() * 2 - 1];
    const f = Math.floor(r() * 3);
    p[f] = r() < 0.5 ? -1 : 1;
    return p.map((v) => v * 0.72);
  },
  games: (t, r) => {
    let x, z;
    do {
      x = Math.floor(r() * 8);
      z = Math.floor(r() * 8);
    } while ((x + z) % 2 && r() < 0.8);
    return [((x + r()) / 4 - 1) * 1.05, -0.2, ((z + r()) / 4 - 1) * 1.05];
  },
  landmarks: (t, r) => {
    const h = 1 - Math.sqrt(r());
    const w = (1 - h) * 0.95;
    const s = r() * 2 - 1;
    const f = Math.floor(r() * 4);
    const x = f < 2 ? s * w : f === 2 ? w : -w;
    const z = f < 2 ? (f ? w : -w) : s * w;
    return [x, h * 1.5 - 0.7, z];
  },
  vehicles: (t, r) => {
    if (t < 0.3) {
      const p = onSphere(r, 0.42);
      return [p[0], Math.abs(p[1]) + 0.1, p[2]];
    }
    const p = onSphere(r, 1);
    return [p[0] * 1.15, p[1] * 0.16, p[2] * 1.15];
  },
  animals: (t, r) => {
    const R = 0.1 + 0.9 * t;
    const a = Math.log(R / 0.09) / 0.16;
    const b = r() * TAU;
    const tube = R * 0.42;
    return [Math.cos(a) * (R + tube * Math.cos(b)) - 0.1, Math.sin(a) * (R + tube * Math.cos(b)), tube * Math.sin(b) * 1.4];
  },
  math: (t, r) => {
    const a = t * TAU;
    const R = 0.72 + 0.3 * Math.cos(3 * a);
    return [Math.cos(2 * a) * R + (r() - 0.5) * 0.09, 0.34 * Math.sin(3 * a) + (r() - 0.5) * 0.09, Math.sin(2 * a) * R + (r() - 0.5) * 0.09];
  },
  waves: (t, r) => {
    const x = r() * 2.3 - 1.15;
    const z = r() * 2.3 - 1.15;
    const d = Math.hypot(x, z);
    return [x, (0.2 * Math.sin(11 * d)) / (1 + 1.6 * d), z];
  },
  light: (t, r) => {
    if (t < 0.3) {
      const e = Math.floor(r() * 3);
      const s = r();
      const A = [[-0.45, -0.4], [0.45, -0.4], [0, 0.42]];
      const p = A[e];
      const q = A[(e + 1) % 3];
      return [p[0] + (q[0] - p[0]) * s, p[1] + (q[1] - p[1]) * s, (r() - 0.5) * 0.5];
    }
    if (t < 0.42) {
      const s = r();
      return [-1.2 + s * 0.98, -0.32 + s * 0.3, 0];
    }
    const ray = Math.floor(r() * 7);
    const s = r();
    return [0.25 + s * 0.95, 0.02 - s * (0.12 + ray * 0.07), (r() - 0.5) * 0.06];
  },
  sound: (t, r) => {
    for (let k = 0; k < 60; k++) {
      const x = r() * 2 - 1;
      const z = r() * 2 - 1;
      const f = Math.cos(3 * Math.PI * x * 0.5) * Math.cos(5 * Math.PI * z * 0.5) - Math.cos(5 * Math.PI * x * 0.5) * Math.cos(3 * Math.PI * z * 0.5);
      if (Math.abs(f) < 0.07) return [x * 1.05, -0.1, z * 1.05];
    }
    return [0, -0.1, 0];
  },
  volumes: (t, r) => {
    const y = (Math.floor(r() * 9) - 4) / 4.4;
    const R = Math.sqrt(1 - y * y) * Math.sqrt(r()) * 0.98;
    const a = r() * TAU;
    return [Math.cos(a) * R, y, Math.sin(a) * R];
  },
  scale: (t, r) => {
    const R = r() ** 0.7 * 1.25;
    const a = R * 4.2 + Math.floor(r() * 2) * Math.PI + (r() - 0.5) * 0.7;
    return [Math.cos(a) * R, ((r() - 0.5) * 0.3) / (1 + 4 * R), Math.sin(a) * R];
  },
  earth: (t, r) => {
    const x = r() * 2.3 - 1.15;
    const z = r() * 2.3 - 1.15;
    return [x, 0.22 * (Math.sin(3 * x) + 0.7 * Math.cos(2.3 * z) + 0.4 * Math.sin(5 * x + 2 * z)) - 0.1, z];
  },
};
