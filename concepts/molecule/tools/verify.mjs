// Checks everything the page computes, each a second way.
// Run: node concepts/molecule/tools/verify.mjs   (prints one line per check, exits 1 on a failure)

import { readFileSync } from "node:fs";
import * as chem from "../chem.js";
import { MOLECULES } from "../data.js";

let failed = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? "  " + detail : ""}`);
};
const near = (a, b, tol) => Math.abs(a - b) <= tol;

// 1. Spelling in element symbols: the page's search against brute force, which builds
//    every run of symbols up to the word's length and keeps the ones that read as the word.
const symbols = chem.ELEMENTS.map(([s]) => s);
check("118 elements, no symbol twice", symbols.length === 118 && new Set(symbols).size === 118);
function brute(word) {
  const w = word.toLowerCase();
  const out = [];
  const grow = (run, text) => {
    if (text === w) out.push(run);
    if (text.length >= w.length) return;
    for (const s of symbols) {
      const t = text + s.toLowerCase();
      if (w.startsWith(t)) grow([...run, s], t);
    }
  };
  grow([], "");
  return out;
}
const WORDS = "ryan kamp joseph splashery grooph reword nerd resmon link meteor english openlist ars magna aqrobat amordle molecule caffeine dopamine serotonin crambin chalk slate cincinnati".split(" "); // prettier-ignore
let same = true;
const spelled = [];
for (const w of WORDS) {
  const a = chem.spellings(w).map((s) => s.join(" ")).sort(); // prettier-ignore
  const b = brute(w).map((s) => s.join(" ")).sort(); // prettier-ignore
  if (a.join("|") !== b.join("|")) same = false;
  if (a.length) spelled.push(`${w} = ${a.join(" or ")}`);
}
check(`spellings match brute force for ${WORDS.length} words`, same);
console.log("     " + spelled.join("\n     "));
const one = (w, s) => {
  const got = chem.spellings(w);
  return got.length === 1 && got[0].join(" ") === s;
};
check("KAMP is K Am P, the only way", one("kamp", "K Am P"));
check("SPLASHERY is S P La S H Er Y, the only way", one("splashery", "S P La S H Er Y"));
check("RESMON has two ways: Re S Mo N and Re Sm O N", chem.spellings("resmon").map((s) => s.join(" ")).sort().join("|") === "Re S Mo N|Re Sm O N"); // prettier-ignore
check("RYAN has no spelling and stops at its first letter", chem.spellings("ryan").length === 0 && chem.stuckAt("ryan") === 0); // prettier-ignore

// 2. Measuring: every pair of atoms in every molecule, against the same distance worked
//    out from the downloaded file's own text (a different parser, uncentered coordinates).
const src = (name) => readFileSync(new URL(`./src/${name}`, import.meta.url), "utf8").split(/\r?\n/);
function rawSdf(name) {
  const lines = src(name);
  const n = parseInt(lines[3].slice(0, 3), 10);
  return lines.slice(4, 4 + n).map((l) => [l.slice(0, 10), l.slice(10, 20), l.slice(20, 30)].map(Number));
}
const rawPdb = (name) =>
  src(name)
    .filter((l) => /^ATOM/.test(l) && (l[16] === " " || l[16] === "A"))
    .map((l) => [l.slice(30, 38), l.slice(38, 46), l.slice(46, 54)].map(Number));
const RAW = { caffeine: rawSdf("CFF.sdf"), dopamine: rawSdf("LDP.sdf"), serotonin: rawSdf("SRO.sdf"), crambin: rawPdb("1CRN.pdb") }; // prettier-ignore
for (const [key, m] of Object.entries(MOLECULES)) {
  const raw = RAW[key];
  let worst = 0;
  let pairs = 0;
  for (let i = 0; i < raw.length; i++)
    for (let j = i + 1; j < raw.length; j++) {
      const d1 = chem.distance(m.atoms[i].slice(1), m.atoms[j].slice(1));
      const d2 = Math.sqrt((raw[i][0] - raw[j][0]) ** 2 + (raw[i][1] - raw[j][1]) ** 2 + (raw[i][2] - raw[j][2]) ** 2);
      worst = Math.max(worst, Math.abs(d1 - d2));
      pairs++;
    }
  check(`${key}: ${pairs} distances agree with the source file`, raw.length === m.atoms.length && worst < 0.003, `worst ${worst.toFixed(4)} Å`); // prettier-ignore
}

// 3. Angles: caffeine is flat, so the angles inside its five-ring must add to 540° and
//    inside its six-ring to 720°. Rings are found from the bonds, not typed in.
function rings(m, size) {
  const adj = m.atoms.map(() => []);
  for (const [a, b] of m.bonds) (adj[a].push(b), adj[b].push(a));
  const found = new Map();
  const walk = (path) => {
    const last = path[path.length - 1];
    for (const nx of adj[last]) {
      if (path.length === size && nx === path[0]) found.set([...path].sort((x, y) => x - y).join(","), [...path]);
      else if (path.length < size && !path.includes(nx)) walk([...path, nx]);
    }
  };
  m.atoms.forEach((_, i) => walk([i]));
  return [...found.values()];
}
const P = (m, i) => m.atoms[i].slice(1);
for (const [size, sum] of [[5, 540], [6, 720]]) { // prettier-ignore
  const rs = rings(MOLECULES.caffeine, size);
  const total = rs[0].reduce((s, b, k) => s + chem.angle(P(MOLECULES.caffeine, rs[0][(k + size - 1) % size]), P(MOLECULES.caffeine, b), P(MOLECULES.caffeine, rs[0][(k + 1) % size])), 0); // prettier-ignore
  check(`caffeine: one ${size}-ring, its angles add to ${sum}°`, rs.length === 1 && near(total, sum, 0.05), total.toFixed(3));
}
const f = chem.formula(MOLECULES.caffeine.atoms.map((a) => a[0]));
check("caffeine is C8 H10 N4 O2, 194.19 g/mol", f.parts.map((p) => p.join("")).join(" ") === "C8 H10 N4 O2" && near(f.mass, 194.19, 0.01), f.mass.toFixed(3)); // prettier-ignore
check("crambin: 327 atoms and a trace of 46 residues", MOLECULES.crambin.atoms.length === 327 && MOLECULES.crambin.trace.length === 46); // prettier-ignore

// 4. Unit cells: every atom inside the cell has the right number of nearest neighbors at
//    the distance the lattice constant gives, counted over a 3 x 3 x 3 block built here.
for (const key of Object.keys(chem.CRYSTALS)) {
  const cell = chem.unitCell(key);
  const block = [];
  const seen = new Set();
  for (const at of cell.atoms)
    for (let i = -1; i <= 1; i++)
      for (let j = -1; j <= 1; j++)
        for (let k = -1; k <= 1; k++) {
          const p = [at.p[0] + i * cell.a, at.p[1] + j * cell.a, at.p[2] + k * cell.a];
          const id = p.map((v) => v.toFixed(3)).join(",");
          if (!seen.has(id)) (seen.add(id), block.push(p));
        }
  let ok = true;
  let min = Infinity;
  for (const at of cell.atoms) {
    const ds = block.map((p) => chem.distance(p, at.p)).filter((d) => d > 1e-6);
    min = Math.min(min, ...ds);
    if (ds.filter((d) => d < cell.d + 0.01).length !== cell.neighbors) ok = false;
  }
  check(`${key}: ${cell.atoms.length} atoms on the cell, each with ${cell.neighbors} neighbors at ${cell.d.toFixed(4)} Å`, ok && near(min, cell.d, 1e-6)); // prettier-ignore
}

// 5. Hydrogen: every R_nl for n = 1..4 integrates to 1 and has n - l - 1 nodes; every
//    harmonic integrates to 1 over the sphere; a sampled 2p cloud has the right mean radius.
let radialOk = true;
for (let n = 1; n <= 4; n++)
  for (let l = 0; l < n; l++) {
    let sum = 0;
    let nodes = 0;
    let prev = 0;
    const dr = 0.002;
    for (let r = dr / 2; r < 120; r += dr) {
      const R = chem.radial(n, l, r);
      sum += r * r * R * R * dr;
      if (prev && Math.sign(R) !== Math.sign(prev) && Math.abs(R) > 1e-12) nodes++;
      prev = R;
    }
    if (!near(sum, 1, 1e-4) || nodes !== n - l - 1) radialOk = false;
  }
check("all ten radial functions for n = 1 to 4 integrate to 1 with n − l − 1 nodes", radialOk);
let harmonicOk = true;
for (let l = 0; l <= 3; l++)
  for (let m = -l; m <= l; m++) {
    let sum = 0;
    const N = 400;
    for (let i = 0; i < N; i++)
      for (let j = 0; j < 2 * N; j++) {
        const th = ((i + 0.5) / N) * Math.PI;
        const ph = ((j + 0.5) / (2 * N)) * 2 * Math.PI;
        const y = chem.harmonic(l, m, Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th));
        sum += y * y * Math.sin(th) * (Math.PI / N) ** 2;
      }
    if (!near(sum, 1, 1e-3)) harmonicOk = false;
  }
check("all sixteen harmonics for l = 0 to 3 integrate to 1 over the sphere", harmonicOk);
const cloud = chem.sampleOrbital(2, 1, 0, 40000, 3);
let mean = 0;
for (let i = 0; i < 40000; i++) mean += Math.hypot(cloud.points[i * 4], cloud.points[i * 4 + 1], cloud.points[i * 4 + 2]) / 40000; // prettier-ignore
check("40,000 points sampled from 2p have a mean radius of 5 Bohr radii", near(mean, 5, 0.06), mean.toFixed(3));

console.log(failed ? `\n${failed} check(s) failed` : "\nall checks pass");
process.exit(failed ? 1 : 0);
