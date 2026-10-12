// The toy kit behind the drawing on sheet 1: a donut made of Gaussian splats.
// Pure functions with no DOM, so tools/verify.mjs can run the same code in Node.

export const TAU = Math.PI * 2;
export const R = 1; // ring radius
export const r = 0.42; // tube radius
export const RF = r + 0.035; // the frosting sits just proud of the tube
export const FROST_MEAN = 0.95; // mean half-width of the frosting, in radians of v
export const SPRINKLES = 26;
export const SP_LEN = 0.2;
export const SP_RAD = 0.04;
export const BAR = 1.15; // the critic's bar: densest region over sparsest
export const BUDGET = 640;

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function halton(i, base) {
  let f = 1;
  let x = 0;
  while (i > 0) {
    f /= base;
    x += f * (i % base);
    i = Math.floor(i / base);
  }
  return x;
}

// Share a splat budget between parts in proportion to their areas: whole
// splats only, largest remainder first, so the parts always sum to the budget.
export function share(budget, areas) {
  const total = areas.reduce((a, b) => a + b, 0);
  const exact = areas.map((a) => (budget * a) / total);
  const counts = exact.map(Math.floor);
  let left = budget - counts.reduce((a, b) => a + b, 0);
  const order = exact.map((e, i) => [e - counts[i], i]).sort((p, q) => q[0] - p[0] || p[1] - q[1]);
  for (let k = 0; left > 0; k += 1, left -= 1) counts[order[k % order.length][1]] += 1;
  return counts;
}

// Areas, all closed form.
export const torusArea = (rho = r) => TAU * TAU * R * rho;
export const outerHalfArea = (rho = r) => TAU * rho * (Math.PI * R + 2 * rho); // cos v > 0
export const innerHalfArea = (rho = r) => TAU * rho * (Math.PI * R - 2 * rho); // cos v < 0
// A band of half-width w(u) centered on the top of the tube. The cos v term
// cancels across the band, and the ripples in w(u) integrate to nothing.
export const frostArea = () => RF * 2 * R * TAU * FROST_MEAN;
export const sprinkleArea = () => SPRINKLES * (TAU * SP_RAD * SP_LEN + 2 * TAU * SP_RAD * SP_RAD);
// What uniform angles do to a torus: the inside of the hole gets this many
// times the density of the outside.
export const crowding = (rho = r) => outerHalfArea(rho) / innerHalfArea(rho);

const frostWidth = (u, phase) => FROST_MEAN + 0.2 * Math.sin(5 * u + phase) + 0.1 * Math.sin(8 * u + 1.7 * phase);

// Invert the area CDF around the tube, F(v) = (R v + rho sin v) / (2 pi R).
export function invV(q, rho = r) {
  let v = q * TAU;
  for (let k = 0; k < 8; k += 1) v -= (R * v + rho * Math.sin(v) - q * TAU * R) / (R + rho * Math.cos(v));
  return v;
}

function frame(u, v, rho) {
  const cu = Math.cos(u), su = Math.sin(u), cv = Math.cos(v), sv = Math.sin(v);
  return {
    p: [(R + rho * cv) * cu, rho * sv, (R + rho * cv) * su],
    n: [cv * cu, sv, cv * su],
    tu: [-su, 0, cu],
    tv: [-sv * cu, cv, -sv * su],
  };
}
const mix = (a, b, ca, cb) => [a[0] * ca + b[0] * cb, a[1] * ca + b[1] * cb, a[2] * ca + b[2] * cb];
const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];

// One surface splat: a Gaussian flattened onto the surface, given as its three
// scaled axes. Its covariance is the sum of their outer products.
function surfel(u, v, rho, rad, part, rand) {
  const f = frame(u, v, rho);
  const phi = rand() * Math.PI;
  const a = rad * (1.05 + 0.35 * rand());
  const b = rad * (0.7 + 0.25 * rand());
  return {
    p: f.p, n: f.n, part, v,
    ax: [scale(mix(f.tu, f.tv, Math.cos(phi), Math.sin(phi)), a), scale(mix(f.tu, f.tv, -Math.sin(phi), Math.cos(phi)), b), scale(f.n, rad * 0.08)],
    k: rand(),
  };
}

// mode: 'angle' places the body uniformly in angle (the classic mistake),
// 'equal' gives every part the same number of splats, 'area' does it right.
export function build({ budget = BUDGET, frost = false, sprinkles = false, mode = 'area', seed = 1, lumps = [] } = {}) {
  const rand = mulberry32(seed);
  const shift = [rand(), rand(), rand(), rand()];
  const phase = rand() * TAU;
  const names = ['body'];
  const areas = [torusArea()];
  if (frost) { names.push('frosting'); areas.push(frostArea()); }
  if (sprinkles) { names.push('sprinkles'); areas.push(sprinkleArea()); }
  const counts = share(budget, mode === 'equal' ? areas.map(() => 1) : areas);
  const splats = [];

  const nb = counts[0];
  const radB = Math.sqrt(areas[0] / Math.max(nb, 1) / Math.PI) * 1.3;
  for (let i = 1; i <= nb; i += 1) {
    const u = ((halton(i, 2) + shift[0]) % 1) * TAU;
    const q = (halton(i, 3) + shift[1]) % 1;
    splats.push(surfel(u, mode === 'angle' ? q * TAU : invV(q), r, radB, 'body', rand));
  }

  if (frost) {
    const nf = counts[1];
    const radF = Math.sqrt(areas[1] / Math.max(nf, 1) / Math.PI) * 1.3;
    for (let i = 1, got = 0; got < nf && i < nf * 60; i += 1) {
      const u = ((halton(i, 2) + shift[2]) % 1) * TAU;
      const v = invV((halton(i, 3) + shift[3]) % 1, RF);
      let dv = v - Math.PI / 2;
      if (dv > Math.PI) dv -= TAU;
      if (Math.abs(dv) < frostWidth(u, phase)) { splats.push(surfel(u, v, RF, radF, 'frosting', rand)); got += 1; }
    }
  }

  if (sprinkles) {
    const ns = counts[2];
    for (let j = 0; j < SPRINKLES; j += 1) {
      const u = ((j + 0.5 + 0.7 * (rand() - 0.5)) / SPRINKLES) * TAU;
      const v = Math.PI / 2 + (rand() - 0.5) * 1.1;
      const psi = rand() * Math.PI;
      const c = Math.floor(ns / SPRINKLES) + (j < ns % SPRINKLES ? 1 : 0);
      const f = frame(u, v, RF + SP_RAD);
      const along = mix(f.tu, f.tv, Math.cos(psi), Math.sin(psi));
      const across = mix(f.tu, f.tv, -Math.sin(psi), Math.cos(psi));
      for (let k = 0; k < c; k += 1) {
        const off = ((k + 0.5) / c - 0.5) * SP_LEN;
        splats.push({
          p: [f.p[0] + along[0] * off, f.p[1] + along[1] * off, f.p[2] + along[2] * off],
          n: f.n, part: 'sprinkles', v,
          ax: [scale(along, (SP_LEN / (2 * c)) * 1.2), scale(across, SP_RAD * 1.15), scale(f.n, SP_RAD * 1.15)],
          k: rand(),
        });
      }
    }
  }

  // Clay: a lump raised under each red-pencil note.
  for (const s of splats) {
    for (const l of lumps) {
      const d2 = (s.p[0] - l[0]) ** 2 + (s.p[1] - l[1]) ** 2 + (s.p[2] - l[2]) ** 2;
      const h = 0.17 * Math.exp(-d2 / 0.16);
      if (h > 0.002) s.p = [s.p[0] + s.n[0] * h, s.p[1] + s.n[1] * h, s.p[2] + s.n[2] * h];
    }
  }

  // Shuffle the drafting order so a revision fills in all over the sheet.
  splats.forEach((s) => { s.order = rand(); });
  return { splats, names, areas, counts };
}

// What the critic inspects: splats per unit area in each region, and the total.
export function measure({ splats, names }) {
  let inner = 0, outer = 0, frosting = 0, sprinkles = 0;
  for (const s of splats) {
    if (s.part === 'frosting') frosting += 1;
    else if (s.part === 'sprinkles') sprinkles += 1;
    else if (Math.cos(s.v) < 0) inner += 1;
    else outer += 1;
  }
  const regions = [
    { name: 'body, inside the hole', n: inner, area: innerHalfArea() },
    { name: 'body, outside', n: outer, area: outerHalfArea() },
  ];
  if (names.includes('frosting')) regions.push({ name: 'frosting', n: frosting, area: frostArea() });
  if (names.includes('sprinkles')) regions.push({ name: 'sprinkles', n: sprinkles, area: sprinkleArea() });
  const dens = regions.map((g) => g.n / g.area);
  return { regions, total: splats.length, spread: Math.max(...dens) / Math.max(Math.min(...dens), 1e-9) };
}

// Revision letters: A to Z, then AA, AB and on.
export function revLetter(i) {
  let s = '';
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}
