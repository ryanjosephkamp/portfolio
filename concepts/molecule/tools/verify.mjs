// Checks everything the page computes or reads, each a second way.
// Run: node concepts/molecule/tools/verify.mjs   (prints one line per check, exits 1 on a failure)

import { readFileSync } from "node:fs";
import * as chem from "../chem.js";
import { parse } from "../formats.js";
import { SHELF, ENTRIES, FIRST } from "../data.js";

let failed = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? "  " + detail : ""}`);
};
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const here = (rel) => new URL(rel, import.meta.url);
const text = (rel) => readFileSync(here(rel), "utf8");
const record = JSON.parse(text("./shelf.json"));
const dictionary = new Map(record.groups.flatMap((g) => g.items).map((it) => [it.id, it]));
const small = SHELF.flatMap((g) => g.items);

// ---- 1. Spelling in element symbols: the page's search against brute force, which builds
//         every run of symbols up to the word's length and keeps the ones that read as the word.
const symbols = chem.ELEMENTS.map(([s]) => s);
check("118 elements, no symbol twice", symbols.length === 118 && new Set(symbols).size === 118);
function brute(word) {
  const w = word.toLowerCase();
  const out = [];
  const grow = (run, t) => {
    if (t === w) out.push(run);
    if (t.length >= w.length) return;
    for (const s of symbols) {
      const next = t + s.toLowerCase();
      if (w.startsWith(next)) grow([...run, s], next);
    }
  };
  grow([], "");
  return out;
}
const WORDS = "ryan kamp joseph splashery grooph reword nerd resmon link meteor english openlist ars magna aqrobat amordle molecule caffeine dopamine serotonin crambin chalk slate cincinnati".split(" "); // prettier-ignore
let same = true;
for (const w of [...WORDS, ...small.map((it) => it.name.replace(/[^a-z]/gi, "")).filter((n) => n.length <= 16)]) {
  const a = chem.spellings(w).map((s) => s.join(" ")).sort(); // prettier-ignore
  const b = brute(w).map((s) => s.join(" ")).sort(); // prettier-ignore
  if (a.join("|") !== b.join("|")) same = false;
}
check("spellings match brute force for the page's words and the shelf's names", same);
const one = (w, s) => {
  const got = chem.spellings(w);
  return got.length === 1 && got[0].join(" ") === s;
};
check("KAMP is K Am P, the only way", one("kamp", "K Am P"));
check("SPLASHERY is S P La S H Er Y, the only way", one("splashery", "S P La S H Er Y"));
check("CAFFEINE is Ca F Fe I Ne, the only way", one("caffeine", "Ca F Fe I Ne"));
check("RESMON has two ways: Re S Mo N and Re Sm O N", chem.spellings("resmon").map((s) => s.join(" ")).sort().join("|") === "Re S Mo N|Re Sm O N"); // prettier-ignore
check("RYAN has no spelling and stops at its first letter", chem.spellings("ryan").length === 0 && chem.stuckAt("ryan") === 0); // prettier-ignore

// ---- 2. The shelf's small molecules: every file through the page's reader, against the
//         file read a second way and against what the PDB's dictionary says of it.
const hill = (els) => chem.formula(els).parts.map(([e, n]) => e + (n > 1 ? n : "")).join(" "); // prettier-ignore
const pairSet = (bonds) => new Set(bonds.map(([a, b]) => (a < b ? `${a},${b}` : `${b},${a}`)));
let worst = 0;
let pairs = 0;
let massWorst = 0;
const wrong = { formula: [], mass: [], bonds: [], hydrogens: [], charge: [], pose: [], stacked: [] };
let metalFiles = 0;
for (const it of small) {
  const raw = text(`../assets/molecules/${it.id}.sdf`);
  const m = parse(raw, `${it.id}.sdf`);
  // The same atoms by another route: every number on the atom lines, split on spaces.
  const lines = raw.split(/\r?\n/);
  const n = parseInt(lines[3].trim().split(/\s+/)[0].slice(0, 3), 10);
  const plain = lines.slice(4, 4 + m.atoms.length).map((l) => l.trim().split(/\s+/).slice(0, 3).map(Number));
  if (plain.length !== m.atoms.length || (n !== m.atoms.length && String(n).length < 3)) wrong.formula.push(`${it.id} (atom count)`);
  for (let i = 0; i < plain.length; i++)
    for (let j = i + 1; j < plain.length; j++) {
      const d1 = chem.distance(m.atoms[i].p, m.atoms[j].p);
      const d2 = Math.sqrt((plain[i][0] - plain[j][0]) ** 2 + (plain[i][1] - plain[j][1]) ** 2 + (plain[i][2] - plain[j][2]) ** 2);
      worst = Math.max(worst, Math.abs(d1 - d2));
      pairs++;
    }
  // No two atoms on top of each other: the dictionary writes every atom at the origin when it
  // has no ideal coordinates, and such a file must not be on the shelf.
  let closest = Infinity;
  for (let i = 0; i < m.atoms.length; i++) for (let j = i + 1; j < m.atoms.length; j++) closest = Math.min(closest, chem.distance(m.atoms[i].p, m.atoms[j].p)); // prettier-ignore
  if (closest < 0.6) wrong.stacked.push(it.id);
  const dict = dictionary.get(it.id);
  const f = chem.formula(m.atoms.map((a) => a.el));
  if (hill(m.atoms.map((a) => a.el)) !== dict.formula) wrong.formula.push(it.id);
  massWorst = Math.max(massWorst, Math.abs(f.mass - dict.weight));
  // The dictionary's weights and this page's differ in the fifth figure; over the 181 atoms
  // of cyanocobalamin that comes to 0.023.
  if (!near(f.mass, dict.weight, Math.max(0.02, dict.weight * 2.5e-5))) wrong.mass.push(`${it.id} ${f.mass.toFixed(3)} vs ${dict.weight}`);
  // Bonds found by distance alone must be the bonds the file lists (a metal's are the file's to say).
  const metal = m.atoms.some((a) => chem.METALS.has(a.el));
  if (metal) metalFiles++;
  else {
    const a = pairSet(m.bonds);
    const b = pairSet(chem.bondsByDistance(m.atoms));
    if (a.size !== b.size || [...a].some((k) => !b.has(k))) wrong.bonds.push(it.id);
    if (m.atoms.reduce((s, x) => s + (x.charge || 0), 0) !== dict.charge) wrong.charge.push(it.id);
  }
  // The skeletal formula: every hydrogen is written exactly once, on an atom or on its own.
  const sk = chem.skeleton(m.atoms, m.bonds);
  const written = sk.reduce((s, x, i) => s + (m.atoms[i].el === "H" ? (x.show ? 1 : 0) : x.h), 0);
  const shown = sk.filter((x) => x.show).length;
  const heavy = m.atoms.filter((x) => x.el !== "H").length;
  if (written !== m.atoms.filter((x) => x.el === "H").length || shown < heavy) wrong.hydrogens.push(it.id);
  // The flat pose is a proper rotation, with the thinnest spread toward the room.
  const { rot: r, spread } = chem.flatPose(m.atoms.map((x) => x.p));
  const det = r[0] * (r[4] * r[8] - r[5] * r[7]) - r[1] * (r[3] * r[8] - r[5] * r[6]) + r[2] * (r[3] * r[7] - r[4] * r[6]);
  if (!near(det, 1, 1e-9) || spread[0] + 1e-9 < spread[1] || spread[1] + 1e-9 < spread[2]) wrong.pose.push(it.id);
}
const N = small.length;
check(`${N} small molecules: ${pairs.toLocaleString("en")} distances agree with a second reading of each file`, worst < 1e-9, `worst ${worst.toExponential(1)} Å`); // prettier-ignore
check(`${N} files hold real coordinates: no two atoms within 0.6 Å`, !wrong.stacked.length, wrong.stacked.join(" "));
check(`${N} formulas match the dictionary's`, !wrong.formula.length, wrong.formula.join(" "));
check(`${N} molar masses within 0.02 g/mol of the dictionary's (25 parts in a million for the largest)`, !wrong.mass.length, wrong.mass.join("; ") || `worst ${massWorst.toFixed(4)}`); // prettier-ignore
check(`${N - metalFiles} metal-free molecules: bonds found by distance are exactly the bonds each file lists`, !wrong.bonds.length, wrong.bonds.join(" ")); // prettier-ignore
check(`${N - metalFiles} metal-free molecules: the charges add up to the dictionary's`, !wrong.charge.length, wrong.charge.join(" "));
check(`${N} skeletal formulas write every hydrogen exactly once`, !wrong.hydrogens.length, wrong.hydrogens.join(" "));
check(`${N} flat poses are proper rotations, thinnest side toward the room`, !wrong.pose.length, wrong.pose.join(" "));

// ---- 3. Caffeine, by hand: its formula, its mass, and angles that must add up because it is flat.
const caffeine = parse(FIRST.text, "first.sdf");
check("the first molecule is caffeine's own file, unchanged", FIRST.text === text("../assets/molecules/CFF.sdf"));
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
for (const [size, sum] of [[5, 540], [6, 720]]) { // prettier-ignore
  const rs = rings(caffeine, size);
  const P = (i) => caffeine.atoms[i].p;
  const total = rs[0].reduce((s, b, k) => s + chem.angle(P(rs[0][(k + size - 1) % size]), P(b), P(rs[0][(k + 1) % size])), 0);
  check(`caffeine: one ${size}-ring, its angles add to ${sum}°`, rs.length === 1 && near(total, sum, 0.05), total.toFixed(3));
}
const cf = chem.formula(caffeine.atoms.map((a) => a.el));
check("caffeine is C8 H10 N4 O2, 194.19 g/mol", hill(caffeine.atoms.map((a) => a.el)) === "C8 H10 N4 O2" && near(cf.mass, 194.19, 0.01), cf.mass.toFixed(3)); // prettier-ignore
const flat = chem.flatPose(caffeine.atoms.filter((a) => a.el !== "H").map((a) => a.p));
check("caffeine's heavy atoms lie flat: no spread toward the room", flat.spread[2] < 0.01, `${flat.spread[2].toFixed(4)} Å`);
const csk = chem.skeleton(caffeine.atoms, caffeine.bonds);
check("caffeine's skeletal formula writes four N and two O, and no carbon", csk.filter((s) => s.show && s.text).map((s) => s.text).sort().join("") === "NNNNOO"); // prettier-ignore

// ---- 4. The entries: the PDB reader against a second count of each file, and the mmCIF
//         reader against the PDB reader on the same structure.
for (const e of ENTRIES) {
  const raw = text(`../assets/molecules/${e.id}.pdb`);
  const m = parse(raw, `${e.id}.pdb`);
  let count = 0;
  let waters = 0;
  let alt = null;
  for (const l of raw.split("\n")) {
    if (l.startsWith("ENDMDL")) break;
    if (!/^(ATOM  |HETATM)/.test(l)) continue;
    if (/^(HOH|DOD|WAT)$/.test(l.slice(17, 20).trim())) waters++;
    else if (l[16] === " " || (alt ??= l[16]) === l[16]) count++;
  }
  const traced = m.traces.reduce((s, t) => s + t.length, 0);
  check(`${e.id} ${e.name}: ${m.atoms.length} atoms, ${waters} waters left out, ${traced} residues traced in ${m.traces.length} stretch${m.traces.length === 1 ? "" : "es"}`, m.atoms.length === count && m.waters === waters && m.atoms.length === e.atoms && traced > 0); // prettier-ignore
}
const crnPdb = parse(text("../assets/molecules/1CRN.pdb"), "1CRN.pdb");
const crnCif = parse(text("./fixtures/1CRN.cif"), "1CRN.cif");
let cifWorst = 0;
crnPdb.atoms.forEach((a, i) => (cifWorst = Math.max(cifWorst, chem.distance(a.p, crnCif.atoms[i]?.p ?? [9e9, 0, 0]))));
const ssOf = (m) => m.traces.map((t) => t.map((p) => p.ss).join("")).join("/");
check("crambin as mmCIF and as PDB: the same 327 atoms, bonds, and helices and strands", crnCif.atoms.length === 327 && cifWorst < 0.0011 && crnCif.bonds.length === crnPdb.bonds.length && ssOf(crnCif) === ssOf(crnPdb), `worst ${cifWorst.toFixed(4)} Å, ${ssOf(crnPdb)}`); // prettier-ignore
check("crambin: 46 residues, two helices and two strands", /^s+c+h+c+h+c*s+c+$/.test(ssOf(crnPdb)) && ssOf(crnPdb).length === 46);
// A cartoon's rungs: in the B-DNA entry each base's rung must end on the atom that faces
// its partner, so across every pair the two ends sit a hydrogen bond apart.
const dna = parse(text("../assets/molecules/1BNA.pdb"), "1BNA.pdb");
const [strandA, strandB] = dna.traces;
const across = strandA.map((pt, k) => chem.distance(dna.atoms[pt.rung].p, dna.atoms[strandB[strandB.length - 1 - k].rung].p));
check("B-DNA: twelve pairs, and across each the two rungs end 2.6 to 3.2 Å apart", dna.traces.length === 2 && across.length === 12 && across.every((d) => d > 2.6 && d < 3.2), across.map((d) => d.toFixed(2)).join(" ")); // prettier-ignore
const cffCif = parse(text("./fixtures/CFF.cif"), "CFF.cif");
let compWorst = 0;
caffeine.atoms.forEach((a, i) => (compWorst = Math.max(compWorst, chem.distance(a.p, cffCif.atoms[i].p))));
const sameBonds = (a, b) => a.size === b.size && [...a].every((k) => b.has(k));
check("caffeine as the dictionary's own mmCIF and as SDF: the same atoms and the same bonds", compWorst < 0.0011 && sameBonds(pairSet(cffCif.bonds), pairSet(caffeine.bonds)) && cffCif.title === "CAFFEINE"); // prettier-ignore
const asXyz = `${caffeine.atoms.length}\ncaffeine\n${caffeine.atoms.map((a) => `${a.el} ${a.p.join(" ")}`).join("\n")}\n`;
const fromXyz = parse(asXyz, "caffeine.xyz");
check("caffeine written out as XYZ and read back: the same atoms, and the same bonds found by distance", fromXyz.atoms.every((a, i) => chem.distance(a.p, caffeine.atoms[i].p) < 1e-9) && sameBonds(pairSet(fromXyz.bonds), pairSet(caffeine.bonds))); // prettier-ignore
let refused = 0;
for (const bad of ["", "hello\nworld\n", "3\nwater\nO 0 0 0\n"]) {
  try {
    parse(bad, "x.txt");
  } catch {
    refused++;
  }
}
check("an empty file, a text file and a cut-short XYZ file are each refused with a message", refused === 3);

// ---- 5. Unit cells: every atom has the right number of nearest neighbors at the distance
//         the lattice constant gives, counted over a 3 x 3 x 3 block built here.
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

// ---- 6. Hydrogen: every R_nl for n = 1..4 integrates to 1 and has n - l - 1 nodes; every
//         harmonic integrates to 1 over the sphere; a sampled 2p cloud has the right mean radius.
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
    const K = 400;
    for (let i = 0; i < K; i++)
      for (let j = 0; j < 2 * K; j++) {
        const th = ((i + 0.5) / K) * Math.PI;
        const ph = ((j + 0.5) / (2 * K)) * 2 * Math.PI;
        const y = chem.harmonic(l, m, Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th));
        sum += y * y * Math.sin(th) * (Math.PI / K) ** 2;
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
