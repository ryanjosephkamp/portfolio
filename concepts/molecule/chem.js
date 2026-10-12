// The chemistry this page draws with: elements, their colors and sizes, the
// two measurements, spelling in element symbols, cubic unit cells and the
// hydrogen wavefunction. Pure functions, shared by main.js and
// tools/verify.mjs (which checks every one of them a second way).

// prettier-ignore
export const ELEMENTS = [
  ["H","Hydrogen"],["He","Helium"],["Li","Lithium"],["Be","Beryllium"],["B","Boron"],["C","Carbon"],
  ["N","Nitrogen"],["O","Oxygen"],["F","Fluorine"],["Ne","Neon"],["Na","Sodium"],["Mg","Magnesium"],
  ["Al","Aluminum"],["Si","Silicon"],["P","Phosphorus"],["S","Sulfur"],["Cl","Chlorine"],["Ar","Argon"],
  ["K","Potassium"],["Ca","Calcium"],["Sc","Scandium"],["Ti","Titanium"],["V","Vanadium"],["Cr","Chromium"],
  ["Mn","Manganese"],["Fe","Iron"],["Co","Cobalt"],["Ni","Nickel"],["Cu","Copper"],["Zn","Zinc"],
  ["Ga","Gallium"],["Ge","Germanium"],["As","Arsenic"],["Se","Selenium"],["Br","Bromine"],["Kr","Krypton"],
  ["Rb","Rubidium"],["Sr","Strontium"],["Y","Yttrium"],["Zr","Zirconium"],["Nb","Niobium"],["Mo","Molybdenum"],
  ["Tc","Technetium"],["Ru","Ruthenium"],["Rh","Rhodium"],["Pd","Palladium"],["Ag","Silver"],["Cd","Cadmium"],
  ["In","Indium"],["Sn","Tin"],["Sb","Antimony"],["Te","Tellurium"],["I","Iodine"],["Xe","Xenon"],
  ["Cs","Cesium"],["Ba","Barium"],["La","Lanthanum"],["Ce","Cerium"],["Pr","Praseodymium"],["Nd","Neodymium"],
  ["Pm","Promethium"],["Sm","Samarium"],["Eu","Europium"],["Gd","Gadolinium"],["Tb","Terbium"],["Dy","Dysprosium"],
  ["Ho","Holmium"],["Er","Erbium"],["Tm","Thulium"],["Yb","Ytterbium"],["Lu","Lutetium"],["Hf","Hafnium"],
  ["Ta","Tantalum"],["W","Tungsten"],["Re","Rhenium"],["Os","Osmium"],["Ir","Iridium"],["Pt","Platinum"],
  ["Au","Gold"],["Hg","Mercury"],["Tl","Thallium"],["Pb","Lead"],["Bi","Bismuth"],["Po","Polonium"],
  ["At","Astatine"],["Rn","Radon"],["Fr","Francium"],["Ra","Radium"],["Ac","Actinium"],["Th","Thorium"],
  ["Pa","Protactinium"],["U","Uranium"],["Np","Neptunium"],["Pu","Plutonium"],["Am","Americium"],["Cm","Curium"],
  ["Bk","Berkelium"],["Cf","Californium"],["Es","Einsteinium"],["Fm","Fermium"],["Md","Mendelevium"],["No","Nobelium"],
  ["Lr","Lawrencium"],["Rf","Rutherfordium"],["Db","Dubnium"],["Sg","Seaborgium"],["Bh","Bohrium"],["Hs","Hassium"],
  ["Mt","Meitnerium"],["Ds","Darmstadtium"],["Rg","Roentgenium"],["Cn","Copernicium"],["Nh","Nihonium"],["Fl","Flerovium"],
  ["Mc","Moscovium"],["Lv","Livermorium"],["Ts","Tennessine"],["Og","Oganesson"],
];

// symbol in lower case -> { z, symbol, name }
export const BY_SYMBOL = new Map(
  ELEMENTS.map(([symbol, name], i) => [symbol.toLowerCase(), { z: i + 1, symbol, name }]),
);

// The familiar CPK (Jmol) colors, by atomic number.
// prettier-ignore
const JMOL = ("FFFFFF D9FFFF CC80FF C2FF00 FFB5B5 909090 3050F8 FF0D0D 90E050 B3E3F5 AB5CF2 8AFF00 BFA6A6 F0C8A0 " +
  "FF8000 FFFF30 1FF01F 80D1E3 8F40D4 3DFF00 E6E6E6 BFC2C7 A6A6AB 8A99C7 9C7AC7 E06633 F090A0 50D050 C88033 " +
  "7D80B0 C28F8F 668F8F BD80E3 FFA100 A62929 5CB8D1 702EB0 00FF00 94FFFF 94E0E0 73C2C9 54B5B5 3B9E9E 248F8F " +
  "0A7D8C 006985 C0C0C0 FFD98F A67573 668080 9E63B5 D47A00 940094 429EB0 57178F 00C900 70D4FF FFFFC7 D9FFC7 " +
  "C7FFC7 A3FFC7 8FFFC7 61FFC7 45FFC7 30FFC7 1FFFC7 00FF9C 00E675 00D452 00BF38 00AB24 4DC2FF 4DA6FF 2194D6 " +
  "267DAB 266696 175487 D0D0E0 FFD123 B8B8D0 A6544D 575961 9E4FB5 AB5C00 754F45 428296 420066 007D00 70ABFA " +
  "00BAFF 00A1FF 008FFF 0080FF 006BFF 545CF2 785CE3 8A4FE3 A136D4 B31FD4 B31FBA B30DA6 BD0D87 C70066 CC0059 " +
  "D1004F D90045 E00038 E6002E EB0026").split(" ");

export function cpk(symbol) {
  const el = BY_SYMBOL.get(String(symbol).toLowerCase());
  const hex = (el && JMOL[el.z - 1]) || "D8D4C8";
  return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
}

// A color as chalk: lifted toward white so the darkest elements still read on slate.
export function chalk(symbol, lift = 0.22) {
  const [r, g, b] = cpk(symbol);
  const m = (v) => Math.round(v + (245 - v) * lift);
  return [m(r), m(g), m(b)];
}

// van der Waals radii in ångströms (Bondi 1964) and covalent radii (Cordero et al. 2008).
export const VDW = { H: 1.2, C: 1.7, N: 1.55, O: 1.52, S: 1.8 };
export const COVALENT = { H: 0.31, C: 0.76, N: 0.71, O: 0.66, S: 1.05 };
// Standard atomic weights, to two places.
export const WEIGHT = { H: 1.008, C: 12.011, N: 14.007, O: 15.999, S: 32.06 };

// ---- Measuring ------------------------------------------------------------------------

export const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

// The angle at b, between a and c, in degrees.
export function angle(a, b, c) {
  const u = [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const v = [c[0] - b[0], c[1] - b[1], c[2] - b[2]];
  const d = (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / (Math.hypot(...u) * Math.hypot(...v));
  return (Math.acos(Math.max(-1, Math.min(1, d))) * 180) / Math.PI;
}

// The formula in Hill order (carbon, hydrogen, then the rest by symbol) and the molar mass.
export function formula(elements) {
  const n = {};
  for (const e of elements) n[e] = (n[e] || 0) + 1;
  const order = Object.keys(n).sort((a, b) => {
    const rank = (s) => (s === "C" ? 0 : s === "H" && n.C ? 1 : 2);
    return rank(a) - rank(b) || (a < b ? -1 : 1);
  });
  const mass = order.reduce((m, e) => m + (WEIGHT[e] ?? NaN) * n[e], 0);
  return { parts: order.map((e) => [e, n[e]]), mass };
}

// ---- Spelling in element symbols --------------------------------------------------------

// Every way to write a word as a run of element symbols. Each way is a list of symbols.
export function spellings(word) {
  const w = String(word).toLowerCase().replace(/[^a-z]/g, "");
  const memo = new Map();
  const from = (i) => {
    if (i === w.length) return [[]];
    if (memo.has(i)) return memo.get(i);
    const out = [];
    for (const len of [1, 2]) {
      const el = i + len <= w.length && BY_SYMBOL.get(w.slice(i, i + len));
      if (el) for (const rest of from(i + len)) out.push([el.symbol, ...rest]);
    }
    memo.set(i, out);
    return out;
  };
  return w ? from(0) : [];
}

// How far a word gets before no symbol fits: the longest prefix that can be spelled.
export function stuckAt(word) {
  const w = String(word).toLowerCase().replace(/[^a-z]/g, "");
  const ok = new Array(w.length + 1).fill(false);
  ok[0] = true;
  let far = 0;
  for (let i = 0; i < w.length; i++) {
    if (!ok[i]) continue;
    for (const len of [1, 2]) {
      if (i + len <= w.length && BY_SYMBOL.has(w.slice(i, i + len))) {
        ok[i + len] = true;
        far = Math.max(far, i + len);
      }
    }
  }
  return far;
}

// ---- Cubic unit cells --------------------------------------------------------------------

// Lattice constants in ångströms, as Splashery's unit cells use them
// (src/lattice/cells.js, which cites the Crystallography Open Database entries).
export const CRYSTALS = {
  diamond: { name: "Diamond", element: "C", a: 3.56679, source: "COD 9008564", kind: "diamond", neighbors: 4 },
  copper: { name: "Copper", element: "Cu", a: 3.61496, source: "COD 9008468", kind: "fcc", neighbors: 12 },
  iron: { name: "Iron (α)", element: "Fe", a: 2.8665, source: "COD 9008536", kind: "bcc", neighbors: 8 },
};

const FCC = [[0, 0, 0], [0, 0.5, 0.5], [0.5, 0, 0.5], [0.5, 0.5, 0]]; // prettier-ignore
const BASIS = {
  fcc: FCC,
  bcc: [[0, 0, 0], [0.5, 0.5, 0.5]], // prettier-ignore
  diamond: [...FCC, ...FCC.map(([x, y, z]) => [x + 0.25, y + 0.25, z + 0.25])],
};

// The nearest-neighbor distance of each kind of cell, from its lattice constant.
export const nearest = (c) =>
  c.kind === "diamond" ? (c.a * Math.sqrt(3)) / 4 : c.kind === "fcc" ? c.a / Math.SQRT2 : (c.a * Math.sqrt(3)) / 2;

// Every atom in or on one conventional cell (corners, faces and inside), centered on the
// origin, in ångströms, with the bonds between nearest neighbors.
export function unitCell(key) {
  const c = CRYSTALS[key];
  const seen = new Set();
  const atoms = [];
  for (const [x, y, z] of BASIS[c.kind]) {
    for (let i = 0; i <= 1; i++)
      for (let j = 0; j <= 1; j++)
        for (let k = 0; k <= 1; k++) {
          const f = [x + i, y + j, z + k];
          if (f.some((v) => v > 1 + 1e-9)) continue;
          const id = f.map((v) => v.toFixed(3)).join(",");
          if (seen.has(id)) continue;
          seen.add(id);
          atoms.push({ el: c.element, p: f.map((v) => (v - 0.5) * c.a), frac: f });
        }
  }
  const d = nearest(c);
  const bonds = [];
  for (let i = 0; i < atoms.length; i++)
    for (let j = i + 1; j < atoms.length; j++)
      if (Math.abs(distance(atoms[i].p, atoms[j].p) - d) < 0.01) bonds.push([i, j, 1]);
  const h = c.a / 2;
  const corner = (n) => [n & 1 ? h : -h, n & 2 ? h : -h, n & 4 ? h : -h];
  const edges = [];
  for (let n = 0; n < 8; n++) for (const bit of [1, 2, 4]) if (!(n & bit)) edges.push([corner(n), corner(n | bit)]);
  return { ...c, atoms, bonds, edges, d };
}

// ---- Hydrogen ----------------------------------------------------------------------------

const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));

// Associated Laguerre polynomial L_k^alpha(x), by its three-term recurrence.
function laguerre(k, alpha, x) {
  let prev = 1;
  if (k === 0) return prev;
  let cur = 1 + alpha - x;
  for (let i = 1; i < k; i++) {
    const next = ((2 * i + 1 + alpha - x) * cur - (i + alpha) * prev) / (i + 1);
    prev = cur;
    cur = next;
  }
  return cur;
}

// The radial wavefunction R_nl(r), r in Bohr radii.
export function radial(n, l, r) {
  const rho = (2 * r) / n;
  const norm = Math.sqrt(((2 / n) ** 3 * fact(n - l - 1)) / (2 * n * fact(n + l)));
  return norm * Math.exp(-rho / 2) * rho ** l * laguerre(n - l - 1, 2 * l + 1, rho);
}

// Real spherical harmonics for l = 0..3 at the unit vector (x, y, z), normalized.
const PI = Math.PI;
// prettier-ignore
const Y = {
  "0,0": () => 0.5 * Math.sqrt(1 / PI),
  "1,0": (x, y, z) => Math.sqrt(3 / (4 * PI)) * z,
  "1,1": (x) => Math.sqrt(3 / (4 * PI)) * x,
  "1,-1": (x, y) => Math.sqrt(3 / (4 * PI)) * y,
  "2,0": (x, y, z) => 0.25 * Math.sqrt(5 / PI) * (3 * z * z - 1),
  "2,1": (x, y, z) => 0.5 * Math.sqrt(15 / PI) * x * z,
  "2,-1": (x, y, z) => 0.5 * Math.sqrt(15 / PI) * y * z,
  "2,2": (x, y) => 0.25 * Math.sqrt(15 / PI) * (x * x - y * y),
  "2,-2": (x, y) => 0.5 * Math.sqrt(15 / PI) * x * y,
  "3,0": (x, y, z) => 0.25 * Math.sqrt(7 / PI) * (5 * z * z * z - 3 * z),
  "3,1": (x, y, z) => 0.25 * Math.sqrt(21 / (2 * PI)) * x * (5 * z * z - 1),
  "3,-1": (x, y, z) => 0.25 * Math.sqrt(21 / (2 * PI)) * y * (5 * z * z - 1),
  "3,2": (x, y, z) => 0.25 * Math.sqrt(105 / PI) * (x * x - y * y) * z,
  "3,-2": (x, y, z) => 0.5 * Math.sqrt(105 / PI) * x * y * z,
  "3,3": (x, y) => 0.25 * Math.sqrt(35 / (2 * PI)) * x * (x * x - 3 * y * y),
  "3,-3": (x, y) => 0.25 * Math.sqrt(35 / (2 * PI)) * y * (3 * x * x - y * y),
};
export const harmonic = (l, m, x, y, z) => Y[`${l},${m}`](x, y, z);

// psi(n, l, m) at a point, in Bohr radii.
export function psi(n, l, m, p) {
  const r = Math.hypot(p[0], p[1], p[2]) || 1e-12;
  return radial(n, l, r) * harmonic(l, m, p[0] / r, p[1] / r, p[2] / r);
}

// A small seeded generator, so a given orbital is the same cloud on every visit.
export function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Points drawn from |psi|^2: the radius from the radial distribution r^2 R^2 (by its
// cumulative sum), the direction by rejection against |Y|^2. Each point carries the sign
// of psi there. Returns { points: Float32Array [x, y, z, sign, ...], extent }.
export function sampleOrbital(n, l, m, count, seed = 1) {
  const rand = mulberry(seed * 7919 + n * 100 + l * 10 + (m + 3));
  const rmax = 4 * n * n + 12;
  const steps = 2400;
  const cdf = new Float64Array(steps + 1);
  for (let i = 1; i <= steps; i++) {
    const r = ((i - 0.5) / steps) * rmax;
    cdf[i] = cdf[i - 1] + r * r * radial(n, l, r) ** 2;
  }
  const total = cdf[steps];
  let ymax = 0;
  const dir = () => {
    const z = 2 * rand() - 1;
    const t = 2 * PI * rand();
    const s = Math.sqrt(1 - z * z);
    return [s * Math.cos(t), s * Math.sin(t), z];
  };
  for (let i = 0; i < 4000; i++) ymax = Math.max(ymax, harmonic(l, m, ...dir()) ** 2);
  ymax *= 1.05;
  const points = new Float32Array(count * 4);
  let extent = 0;
  for (let k = 0; k < count; k++) {
    const u = rand() * total;
    let lo = 0;
    let hi = steps;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (cdf[mid] < u) lo = mid;
      else hi = mid;
    }
    const r = ((lo + rand()) / steps) * rmax;
    let d;
    let y;
    do {
      d = dir();
      y = harmonic(l, m, ...d);
    } while (rand() * ymax > y * y);
    points[k * 4] = d[0] * r;
    points[k * 4 + 1] = d[1] * r;
    points[k * 4 + 2] = d[2] * r;
    points[k * 4 + 3] = Math.sign(radial(n, l, r) * y) || 1;
    extent = Math.max(extent, r);
  }
  return { points, extent, total: (total * rmax) / steps };
}
