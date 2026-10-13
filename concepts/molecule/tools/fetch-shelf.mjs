// Stocks the shelf. For every molecule listed below it downloads the file from the
// Protein Data Bank (CC0) into ../assets/molecules/, unchanged, and records what the
// PDB's own dictionary says about it (name, synonyms, formula, formula weight) in
// ./shelf.json. tools/build-data.mjs turns that record into ../data.js, and
// tools/verify.mjs checks every file against it.
//
//   Small molecules: files.rcsb.org/ligands/download/<ID>_ideal.sdf  (ideal coordinates)
//                    data.rcsb.org/rest/v1/core/chemcomp/<ID>        (the dictionary record)
//   Entries:         files.rcsb.org/download/<ID>.pdb
//
// Run: node concepts/molecule/tools/fetch-shelf.mjs   (needs the network; rerun to restock)

import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";

const here = (rel) => new URL(rel, import.meta.url);
mkdirSync(here("../assets/molecules/"), { recursive: true });

// [PDB chemical component id, the name this page writes on the board]
const GROUPS = [
  ["Small and simple", [
    ["HOH", "Water"], ["CO2", "Carbon dioxide"], ["NH3", "Ammonia"], ["OXY", "Oxygen"], ["CMO", "Carbon monoxide"],
    ["NO", "Nitric oxide"], ["N2O", "Nitrous oxide"], ["SO2", "Sulfur dioxide"], ["H2S", "Hydrogen sulfide"],
    ["PEO", "Hydrogen peroxide"], ["MOH", "Methanol"], ["EOH", "Ethanol"], ["IPA", "Isopropyl alcohol"],
    ["EDO", "Ethylene glycol"], ["GOL", "Glycerol"], ["ACN", "Acetone"], ["ACY", "Acetic acid"], ["FMT", "Formic acid"],
    ["URE", "Urea"], ["DMS", "Dimethyl sulfoxide"], ["CCN", "Acetonitrile"],
  ]],
  ["Rings and chains", [
    ["BNZ", "Benzene"], ["MBN", "Toluene"], ["IPH", "Phenol"], ["ANL", "Aniline"], ["0PY", "Pyridine"],
    ["IMD", "Imidazole"], ["IND", "Indole"], ["CHX", "Cyclohexane"], ["HEX", "Hexane"], ["OCT", "Octane"],
    ["PLM", "Palmitic acid"], ["STE", "Stearic acid"], ["OLA", "Oleic acid"], ["CAM", "Camphor"],
    ["60C", "Buckminsterfullerene"],
  ]],
  ["From the kitchen", [
    ["CFF", "Caffeine"], ["37T", "Theobromine"], ["GLC", "Glucose"], ["FRU", "Fructose"], ["GAL", "Galactose"],
    ["RIB", "Ribose"], ["SOR", "Sorbitol"], ["XYL", "Xylitol"], ["CIT", "Citric acid"], ["TLA", "Tartaric acid"],
    ["LAC", "Lactic acid"], ["BEZ", "Benzoic acid"], ["V55", "Vanillin"], ["4DY", "Capsaicin"], ["QUE", "Quercetin"],
    ["STL", "Resveratrol"], ["CC9", "Curcumin"],
  ]],
  ["Neurotransmitters and hormones", [
    ["LDP", "Dopamine"], ["SRO", "Serotonin"], ["ACH", "Acetylcholine"], ["ABU", "GABA"], ["LNR", "Norepinephrine"],
    ["ALE", "Epinephrine"], ["HSM", "Histamine"], ["ML1", "Melatonin"], ["ADN", "Adenosine"], ["DAH", "Levodopa"],
    ["CHT", "Choline"], ["TAU", "Taurine"], ["NCT", "Nicotine"], ["TES", "Testosterone"], ["EST", "Estradiol"],
    ["STR", "Progesterone"], ["HCY", "Cortisol"], ["AS4", "Aldosterone"], ["T44", "Thyroxine"],
  ]],
  ["Medicines", [
    ["AIN", "Aspirin"], ["SAL", "Salicylic acid"], ["IBP", "Ibuprofen"], ["NPS", "Naproxen"], ["TYL", "Acetaminophen"],
    ["LQZ", "Lidocaine"], ["PNN", "Penicillin G"], ["MF8", "Metformin"], ["SWF", "S-warfarin"],
    ["MOI", "Morphine"], ["DZP", "Diazepam"], ["MTX", "Methotrexate"], ["CLQ", "Chloroquine"], ["QI9", "Quinine"],
    ["DEX", "Dexamethasone"], ["STI", "Imatinib"], ["VIA", "Sildenafil"], ["CPT", "Cisplatin"], ["TA1", "Paclitaxel"],
    ["ERY", "Erythromycin"], ["CLM", "Chloramphenicol"],
  ]],
  ["Vitamins, cofactors and pigments", [
    ["ASC", "Vitamin C"], ["RTL", "Retinol"], ["RET", "Retinal"], ["VD3", "Vitamin D3"], ["VIT", "Vitamin E"],
    ["PQN", "Vitamin K1"], ["VIB", "Thiamine"], ["RBF", "Riboflavin"], ["NIO", "Nicotinic acid"], ["NCA", "Nicotinamide"],
    ["PAU", "Pantothenic acid"], ["PLP", "Pyridoxal phosphate"], ["BTN", "Biotin"], ["FOL", "Folic acid"],
    ["ATP", "ATP"], ["ADP", "ADP"], ["AMP", "AMP"], ["NAD", "NAD"], ["FAD", "FAD"],
    ["COA", "Coenzyme A"], ["SAM", "S-adenosylmethionine"], ["GSH", "Glutathione"], ["HEM", "Heme"],
    ["CLA", "Chlorophyll a"], ["CLR", "Cholesterol"],
  ]],
  ["The letters of DNA and RNA", [
    ["ADE", "Adenine"], ["GUN", "Guanine"], ["CYT", "Cytosine"], ["TDR", "Thymine"], ["URA", "Uracil"],
  ]],
  ["The twenty amino acids", [
    ["ALA", "Alanine"], ["ARG", "Arginine"], ["ASN", "Asparagine"], ["ASP", "Aspartic acid"], ["CYS", "Cysteine"],
    ["GLN", "Glutamine"], ["GLU", "Glutamic acid"], ["GLY", "Glycine"], ["HIS", "Histidine"], ["ILE", "Isoleucine"],
    ["LEU", "Leucine"], ["LYS", "Lysine"], ["MET", "Methionine"], ["PHE", "Phenylalanine"], ["PRO", "Proline"],
    ["SER", "Serine"], ["THR", "Threonine"], ["TRP", "Tryptophan"], ["TYR", "Tyrosine"], ["VAL", "Valine"],
  ]],
]; // prettier-ignore

// PDB entries: the samples and the codes to try in Splashery's own molecule viewer.
const ENTRIES = ["1CRN", "1UBQ", "4INS", "1LYZ", "1MBN", "1EMA", "2DHB", "1STP", "1BL8", "1BNA", "1EHZ"];

// Names the dictionary spells another way, each checked by hand against its record.
const ACCEPT = {
  "60C": "the record's synonyms read: buckminsterfullerene, buckyball",
  V55: "the record's synonyms read: p-vanillin (4-hydroxy-3-methoxybenzaldehyde)",
};

// True when two atoms of an SDF file sit on top of each other (closer than 0.6 Å).
// Two components were left off the shelf for it: beta-carotene (BCR), whose ideal file has
// every atom at the origin, and cyanocobalamin (CNC), with a hydrogen 0.47 Å from its oxygen.
// Neither has a model file to fall back on.
function stacked(sdf) {
  const lines = sdf.split(/\r?\n/);
  const n = parseInt(lines[3].slice(0, 3), 10);
  const p = lines.slice(4, 4 + n).map((l) => [l.slice(0, 10), l.slice(10, 20), l.slice(20, 30)].map(Number));
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (Math.hypot(p[i][0] - p[j][0], p[i][1] - p[j][1], p[i][2] - p[j][2]) < 0.6) return true;
  return false;
}

const get = async (url, as = "text") => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return as === "json" ? r.json() : r.text();
};

const out = { fetched: new Date().toISOString().slice(0, 10), groups: [], entries: [] };
for (const [group, list] of GROUPS) {
  const items = [];
  for (const [id, label] of list) {
    try {
      const file = here(`../assets/molecules/${id}.sdf`);
      const had = JSON.parse(existsSync(here("./shelf.json")) ? readFileSync(here("./shelf.json"), "utf8") : "{}").groups?.flatMap((g) => g.items).find((it) => it.id === id); // prettier-ignore
      let coords = had?.coords ?? "ideal";
      let sdf = existsSync(file) ? readFileSync(file, "utf8") : await get(`https://files.rcsb.org/ligands/download/${id}_ideal.sdf`);
      // Where the dictionary has no ideal coordinates the ideal file puts every atom at the
      // origin (beta-carotene). Those take the coordinates of the dictionary's model instead.
      if (stacked(sdf)) {
        sdf = await get(`https://files.rcsb.org/ligands/download/${id}_model.sdf`);
        coords = "model";
        if (stacked(sdf)) throw new Error("no usable coordinates");
        writeFileSync(file, sdf);
      }
      const rec = await get(`https://data.rcsb.org/rest/v1/core/chemcomp/${id}`, "json");
      const cc = rec.chem_comp ?? {};
      const synonyms = (rec.rcsb_chem_comp_synonyms ?? []).map((s) => s.name).concat(String(cc.pdbx_synonyms ?? "").split(";")).map((s) => s.trim()).filter(Boolean); // prettier-ignore
      const names = [cc.name, ...synonyms].map((s) => String(s).toLowerCase());
      // The board's name must be the dictionary's own name or one of its synonyms, letter for
      // letter (case and hyphens aside). Anything else prints NAME and is settled by hand below.
      const plain = (t) => t.toLowerCase().replace(/[-\s]+/g, " ").trim();
      const named = names.some((n) => plain(n) === plain(label)) || ACCEPT[id] !== undefined;
      if (!existsSync(file)) writeFileSync(file, sdf);
      items.push({ id, label, ccdName: cc.name, formula: cc.formula, weight: cc.formula_weight, charge: cc.pdbx_formal_charge ?? 0, coords, named });
      console.log(`${named ? "ok  " : "NAME"} ${id.padEnd(4)} ${label.padEnd(34)} ${String(cc.formula).padEnd(22)} ${String(cc.formula_weight).padEnd(9)} ${cc.name}${named ? "" : "  | " + synonyms.slice(0, 6).join("; ")}`); // prettier-ignore
    } catch (e) {
      console.log(`MISS ${id.padEnd(4)} ${label}: ${e.message}`);
    }
  }
  out.groups.push({ group, items });
}
for (const id of ENTRIES) {
  try {
    const file = here(`../assets/molecules/${id}.pdb`);
    const pdb = existsSync(file) ? readFileSync(file, "utf8") : await get(`https://files.rcsb.org/download/${id}.pdb`);
    if (!existsSync(file)) writeFileSync(file, pdb);
    const lines = pdb.split("\n");
    const title = lines.filter((l) => l.startsWith("TITLE")).map((l) => l.slice(10, 80).trim()).join(" "); // prettier-ignore
    const atoms = lines.filter((l) => /^(ATOM|HETATM)/.test(l) && l.slice(17, 20) !== "HOH").length;
    out.entries.push({ id, title, bytes: pdb.length });
    console.log(`ok   ${id} ${String(atoms).padStart(6)} atoms ${String(Math.round(pdb.length / 1024)).padStart(5)} KB  ${title}`);
  } catch (e) {
    console.log(`MISS ${id}: ${e.message}`);
  }
}
writeFileSync(here("./shelf.json"), JSON.stringify(out, null, 1) + "\n");
