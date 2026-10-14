// Builds ../data.js, the shelf's index, from ./shelf.json (what the Protein Data Bank's
// dictionary said when the shelf was stocked) and the files in ../assets/molecules/, which
// are unchanged downloads (CC0). Run: node concepts/molecule/tools/build-data.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { parse } from "../formats.js";

const here = (rel) => new URL(rel, import.meta.url);
const read = (name) => readFileSync(here(`../assets/molecules/${name}`), "utf8");
const shelf = JSON.parse(readFileSync(here("./shelf.json"), "utf8"));

// What this page calls each entry, and the words its own title must hold for that to be fair.
const ENTRY_NAMES = {
  "1CRN": ["Crambin", "crambin"],
  "1UBQ": ["Ubiquitin", "ubiquitin"],
  "4INS": ["Insulin (pig, with zinc)", "pig insulin"],
  "1LYZ": ["Lysozyme (hen egg white)", "hen egg-white lysozyme"],
  "1MBN": ["Myoglobin", "myoglobin"],
  "1EMA": ["Green fluorescent protein", "green fluorescent protein"],
  "2DHB": ["Hemoglobin (horse, deoxy)", "horse deoxyhaemoglobin"], // us-spelling: keep
  "1STP": ["Streptavidin holding biotin", "biotin binding to streptavidin"],
  "1BL8": ["Potassium channel KcsA", "potassium channel (kcsa)"],
  "1BNA": ["B-DNA, twelve base pairs", "b-dna dodecamer"],
  "1EHZ": ["Transfer RNA (yeast)", "yeast phenylalanine trna"],
};

const groups = shelf.groups.map(({ group, items }) => ({
  group,
  items: items.map(({ id, label, formula, weight, named, coords }) => {
    if (!named) throw new Error(`${id}: the dictionary does not call it ${label}`);
    const m = parse(read(`${id}.sdf`), `${id}.sdf`);
    return { id, name: label, formula, weight, atoms: m.atoms.length, ...(coords === "model" ? { coords } : {}) };
  }),
}));

const entries = shelf.entries.map(({ id, title }) => {
  const [name, words] = ENTRY_NAMES[id];
  if (!title.toLowerCase().includes(words)) throw new Error(`${id}: its title does not say "${words}"`);
  const m = parse(read(`${id}.pdb`), `${id}.pdb`);
  return { id, name, atoms: m.atoms.length };
});

writeFileSync(
  here("../data.js"),
  "// Built by tools/build-data.mjs. Do not edit by hand.\n" +
    "// The shelf: every small molecule is a Protein Data Bank chemical component at its ideal\n" +
    "// coordinates (assets/molecules/<ID>.sdf); every entry is a PDB entry (assets/molecules/<ID>.pdb).\n" +
    `export const STOCKED = ${JSON.stringify(shelf.fetched)};\n` +
    `export const SHELF = ${JSON.stringify(groups)};\n` +
    `export const ENTRIES = ${JSON.stringify(entries)};\n` +
    "// Caffeine's own file, so the first molecule needs no request.\n" +
    `export const FIRST = ${JSON.stringify({ id: "CFF", text: read("CFF.sdf") })};\n`,
);
const n = groups.reduce((s, g) => s + g.items.length, 0);
console.log(`${n} small molecules in ${groups.length} groups, ${entries.length} entries`);
for (const e of entries) console.log(`  ${e.id} ${e.name}: ${e.atoms} atoms`);
