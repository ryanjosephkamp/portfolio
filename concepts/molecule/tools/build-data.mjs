// Builds ../data.js from the files in ./src, which are unchanged downloads from the
// Protein Data Bank (CC0): three chemical components with their ideal coordinates
// (files.rcsb.org/ligands/download/<ID>_ideal.sdf) and the entry 1CRN
// (files.rcsb.org/download/1CRN.pdb). Run: node concepts/molecule/tools/build-data.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { COVALENT } from "../chem.js";

const here = (rel) => new URL(rel, import.meta.url);
const read = (name) => readFileSync(here(`./src/${name}`), "utf8");
const round = (v) => Math.round(v * 1000) / 1000;

function sdf(name) {
  const lines = read(name).split(/\r?\n/);
  const na = +lines[3].slice(0, 3);
  const nb = +lines[3].slice(3, 6);
  const atoms = [];
  for (let i = 0; i < na; i++) {
    const t = lines[4 + i].trim().split(/\s+/);
    atoms.push([t[3], +t[0], +t[1], +t[2]]);
  }
  const bonds = [];
  for (let i = 0; i < nb; i++) {
    const l = lines[4 + na + i];
    bonds.push([+l.slice(0, 3) - 1, +l.slice(3, 6) - 1, +l.slice(6, 9)]);
  }
  return { atoms, bonds };
}

function pdb(name) {
  const atoms = [];
  const labels = [];
  const trace = [];
  const ss = {};
  for (const l of read(name).split(/\r?\n/)) {
    if (l.startsWith("HELIX")) for (let r = +l.slice(21, 25); r <= +l.slice(33, 37); r++) ss[r] = "h";
    if (l.startsWith("SHEET")) for (let r = +l.slice(22, 26); r <= +l.slice(33, 37); r++) ss[r] = "s";
    if (!l.startsWith("ATOM")) continue;
    const alt = l[16];
    if (alt !== " " && alt !== "A") continue;
    const el = l.slice(76, 78).trim();
    const atomName = l.slice(12, 16).trim();
    const res = l.slice(17, 20);
    const seq = +l.slice(22, 26);
    const p = [+l.slice(30, 38), +l.slice(38, 46), +l.slice(46, 54)];
    atoms.push([el[0] + el.slice(1).toLowerCase(), ...p]);
    labels.push(`${res} ${seq} ${atomName}`);
    if (atomName === "CA") trace.push([...p.map(round), ss[seq] || "c"]);
  }
  // Bonds by distance: closer than the two covalent radii plus 0.45 Å.
  const bonds = [];
  for (let i = 0; i < atoms.length; i++)
    for (let j = i + 1; j < atoms.length; j++) {
      const d = Math.hypot(atoms[i][1] - atoms[j][1], atoms[i][2] - atoms[j][2], atoms[i][3] - atoms[j][3]);
      if (d < COVALENT[atoms[i][0]] + COVALENT[atoms[j][0]] + 0.45) bonds.push([i, j, 1]);
    }
  return { atoms, bonds, labels, trace };
}

// Center on the mean position; keep three decimals, as the source files do.
function center(m) {
  const c = [1, 2, 3].map((k) => m.atoms.reduce((s, a) => s + a[k], 0) / m.atoms.length);
  const shift = (p, o = 0) => [p[o] - c[0], p[o + 1] - c[1], p[o + 2] - c[2]].map(round);
  m.atoms = m.atoms.map((a) => [a[0], ...shift(a, 1)]);
  if (m.trace) m.trace = m.trace.map((t) => [...shift(t), t[3]]);
  return m;
}

const out = {
  caffeine: {
    name: "Caffeine",
    note: "PDB chemical component CFF, ideal coordinates",
    source: "https://www.rcsb.org/ligand/CFF",
    ...center(sdf("CFF.sdf")),
  },
  dopamine: {
    name: "Dopamine",
    note: "PDB chemical component LDP, ideal coordinates",
    source: "https://www.rcsb.org/ligand/LDP",
    ...center(sdf("LDP.sdf")),
  },
  serotonin: {
    name: "Serotonin",
    note: "PDB chemical component SRO, ideal coordinates",
    source: "https://www.rcsb.org/ligand/SRO",
    ...center(sdf("SRO.sdf")),
  },
  crambin: {
    name: "Crambin",
    note: "PDB entry 1CRN, a small plant protein of 46 residues",
    source: "https://www.rcsb.org/structure/1CRN",
    ...center(pdb("1CRN.pdb")),
  },
};

writeFileSync(
  here("../data.js"),
  "// Built by tools/build-data.mjs from Protein Data Bank files (CC0). Do not edit by hand.\n" +
    "// Atoms are [element, x, y, z] in ångströms; bonds are [atom, atom, order].\n" +
    `export const MOLECULES = ${JSON.stringify(out)};\n`,
);
for (const [k, m] of Object.entries(out)) console.log(k, m.atoms.length, "atoms", m.bonds.length, "bonds");
