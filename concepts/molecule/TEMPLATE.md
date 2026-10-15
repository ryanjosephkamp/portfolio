# Molecule: make it yours

Molecule is a one-page portfolio set in a chemistry lecture hall: slate blackboards in wooden frames,
chalk, and CPK colors for the atoms. Its signature is the first board, a caffeine molecule drawn in
chalk that you turn in your hand and measure: tap two atoms for the distance between them, a third
for the angle. The tray swaps the molecule and the drawing style, and a stockroom holds about 150
more molecules from the Protein Data Bank, or any PDB, mmCIF, SDF, MOL or XYZ file you bring.

## Quick start

1. Unzip the download and open a terminal in the folder that holds `index.html`.
2. Serve the folder with any static server, for example `python3 -m http.server 8000`.
3. Open http://localhost:8000/ in a browser.

It needs a server. `main.js` is an ES module (`<script type="module">`) that imports `chem.js`,
`formats.js` and `data.js`, and every molecule after caffeine is read from `assets/molecules/` with
`fetch()`. Opened as a `file://` page, none of that loads. Caffeine's own file is built into
`data.js` (`FIRST`), so the first molecule needs no request. Two things reach other sites, and only
when a visitor asks: the stockroom's "A Protein Data Bank code" form fetches from `files.rcsb.org`,
and "Put the real viewer on the board" loads Splashery's viewer from Ryan's site. There is no build
step and nothing to install.

## Make it yours

Everything below is in `index.html` unless another file is named.

**Head**

- [ ] `<title>`: "Ryan Kamp · Molecules you can hold".
- [ ] `<meta name="description">`: names Ryan, the University of Cincinnati and Splashery.
- [ ] Social card: there are no `og:` tags in this folder (no `og:title`, `og:description`,
  `og:url` or `og:image`, and no `assets/og.jpg`). Add them if you want a card when the link is
  shared.
- [ ] `<meta name="theme-color">` (`#1c2526`, the slate) belongs to the look.

**The first board (`header.board.hero#top`)**

- [ ] `.eyebrow`: "Molecular visualization · Room 1, front row".
- [ ] `h1.chalk`: the name. The molecule does not use it.
- [ ] `p.tiles` under the name spells "Kamp" in element symbols (K, Am, P). Each tile is a
  `span.el` with its CPK color in `--c`, the atomic number in `small`, the symbol, and the name in
  `i`. Update the `aria-label` too. `span.tiles-note` says Ryan cannot be spelled this way; rewrite
  it for your name. To find your own spellings, run
  `node -e "import('./chem.js').then((c) => console.log(c.spellings('yourname')))"` in the folder,
  or type the word into the page's "Write a word on the board" field. Take each tile's color from
  `cpk()` in `chem.js` (the `JMOL` table, by atomic number).
- [ ] `.lede`: "Graduate student at the University of Cincinnati…".
- [ ] `.how` and the tray (`.tray`) are instructions and controls, not personal. The tray's four
  regulars are `button[data-mol]` with PDB ids: `CFF` (caffeine), `LDP` (dopamine), `SRO`
  (serotonin) and `1CRN` (crambin). Any id on the shelf in `data.js` works.

**Project boards**

- [ ] `section#splashery` (Project 1), `section#grooph` (Project 2) and `section#words` (Projects 3
  and 4): see the next section.
- [ ] `section#more` (Projects 5 to 10): `ol.list` holds reword_nerd, Link Meteor, English
  OpenList (`li#openlist`), aqrobat, Amordle and the capstone (`li.last`, which spans both columns).
  The numbers come from `start="5"` on the list and `counter-reset: item 4` on `.list` in
  `styles.css`; change both, and the eyebrow, if the count changes.
- [ ] `section#spell` ("Written in elements"): the paragraph names Kamp, Splashery and caffeine.
  `input#spell-in` starts at `caffeine`, and the tiles inside `#spell-out` are only a first paint
  that `main.js` redraws at once.

**About (`section#about`)**

- [ ] `.eyebrow` "Office hours", `h2` "Research interests", the `.big` list of interests, the
  paragraph about molecular visualization, and the degrees paragraph (MS dates and concentration,
  thesis advisor link, BA and BS dates, capstone advisor link).
- [ ] `ul.contact`: CV (Google Drive), Homepage, Repositories, Blog, GitHub, LinkedIn, X, YouTube,
  Hugging Face.

**Footer (`footer.foot`)**

- [ ] The credits paragraph names the data sources and the font license; keep it accurate if you
  change the shelf or the font. Its line "Lattice constants are the ones Splashery's unit cells use"
  ties to Ryan's project.
- [ ] "Ryan Kamp · Cincinnati, Ohio".

**Other files**

- [ ] `tools/verify.mjs` lists Ryan's words in `WORDS` and checks some by name ("KAMP is K
  Am P", "SPLASHERY…", "RESMON…", "RYAN has no spelling…"). They test the speller, not the page, so
  they still pass after your edits; swap in your own words if you want them checked.
- [ ] No `localStorage` key is used, so there is no prefix to rename.

## Parts built on Ryan's projects

**Splashery (`section#splashery`).** Text about Splashery and its lab toys, `ul.facts`, element tiles
spelling "Splashery" (`p.tiles.long`), and three pieces that work on their own:

- `figure#cell` (a unit cell) and `figure#orbital` (a hydrogen orbital) are this page's own code in
  `chem.js` (`unitCell()`, `sampleOrbital()`). The only tie is that `CRYSTALS` in `chem.js` uses the
  lattice constants Splashery's unit cells use, and `main.js` writes "with the lattice constant
  Splashery uses" into `#cell-meta`. Keep the boards and rewrite those words, or move them under a
  heading of your own.
- `figure#real` loads Splashery's own molecule viewer
  (`https://ryanjosephkamp.github.io/splashery/embed/?toy=molecule-viewer&theme=dark`) into an
  iframe when `a#real-load` is clicked. Delete the figure to remove it; `main.js` checks for
  `#real-load` first, so nothing else changes.
- To remove the whole board, delete the section, then repoint the skip link (`a.skip`, which
  targets `#splashery`). `main.js` sets up `#cell-stage` and `#orbital-stage` only if they exist.

**grooph (`section#grooph`).** Text, links, and an SVG loop drawn like a reaction scheme, with a
yellow `.runner` dot that travels the loop (CSS only). Delete or rewrite the section freely.

**Ars Magna (`section#words`, first `article`).** `div#isomer` shows the letters of RYAN KAMP as
`.letters` spans, and the Rearrange button cycles them through `FORMS` in `main.js`: `"RYAN KAMP"`,
`"MAY PRANK"`, `"PARK MANY"`, `"RAMP YANK"`, `"ARMY KNAP"`. The code moves the existing letter
tiles, so every entry in `FORMS` must use exactly the letters in the spans (one `span.gap` marks the
space). Put your own name's anagrams in both places and in the `.meta` sentence below, or delete
the `#isomer` block; `main.js` checks for it first.

**resmon (`section#words`, second `article`).** Static tiles spelling "resmon" two ways (Re S Mo N,
Re Sm O N), and a sentence about it. Rewrite or delete.

**English OpenList, aqrobat, Amordle, reword_nerd, Link Meteor, the capstone.** Plain entries in
`ol.list` with outside links; no code depends on them.

## Third-party material in this folder

- `assets/fonts/shantell-sans-latin.woff2`: Shantell Sans, a Latin subset of the variable font
  (weight 300 to 800, axes INFM 0 to 100 and BNCE −100 to 100). License: SIL Open Font License, as
  stated in the footer of `index.html`. The font file's own metadata reads "Copyright 2022 The
  Shantell Sans Project Authors (https://github.com/arrowtype/shantell-sans)" and gives
  https://openfontlicense.org as its license address.
- `assets/molecules/*.sdf` (143 files): chemical components from the Protein Data Bank's chemical
  component dictionary, at their ideal coordinates, downloaded unchanged from
  `files.rcsb.org/ligands/download/<ID>_ideal.sdf` by `tools/fetch-shelf.mjs`. License: CC0, as
  stated in `tools/fetch-shelf.mjs` and `tools/build-data.mjs`; the footer of `index.html` calls the
  coordinates "public domain data from the wwPDB, copied here unchanged".
- `assets/molecules/*.pdb` (11 files): PDB entries 1CRN, 1UBQ, 4INS, 1LYZ, 1MBN, 1EMA, 2DHB, 1STP,
  1BL8, 1BNA and 1EHZ, downloaded unchanged from `files.rcsb.org/download/<ID>.pdb` by
  `tools/fetch-shelf.mjs`. License: CC0, stated in the same two files and the same footer.
- `data.js`: built from the files above by `tools/build-data.mjs`; it holds caffeine's SDF file
  (`FIRST`) and the shelf's index, with names, formulas and weights from `tools/shelf.json`.
- `tools/shelf.json`: what the PDB's dictionary said of each molecule when the shelf was stocked
  (name, formula, formula weight, charge), read from `data.rcsb.org/rest/v1/core/chemcomp/<ID>` by
  `tools/fetch-shelf.mjs`. License not stated in this folder for this record; the folder states CC0
  for the files it downloads from the Protein Data Bank.
- `tools/fixtures/1CRN.cif` and `tools/fixtures/CFF.cif`: mmCIF files that identify themselves as
  PDB entry 1CRN (`data_1CRN`) and chemical component CFF (`data_CFF`), used only by
  `tools/verify.mjs`. License not stated in this folder for these two files.
- Published reference values typed into `chem.js`: the CPK colors as Jmol gives them (`JMOL`); van
  der Waals radii from Bondi (1964) and Mantina et al. (2009) (`VDW`); covalent radii after Cordero
  et al. (2008) (`COVALENT`); abridged standard atomic weights (`WEIGHT`); and lattice constants
  for diamond, copper and iron taken from Splashery's unit cells, which cite Crystallography Open
  Database entries COD 9008564, 9008468 and 9008536 (`CRYSTALS`). License not stated in this
  folder.

## License

The code and text in this folder are released under the MIT License; see `LICENSE` at the root of
the repository (ryanjosephkamp/portfolio). Third-party material keeps its own license, listed above.

## Checks

- `node tools/verify.mjs` checks everything the page computes or reads, each a second way: the
  element speller against brute force; every shelf file through the page's reader against a second
  reading, against the dictionary's formula, mass and charge, and against bonds found by distance;
  caffeine by hand; every PDB entry against a second count; mmCIF against PDB on the same
  structure; the three unit cells; and the hydrogen functions. It runs offline, prints one line per
  check, and exits 1 on any failure.
- `node tools/fetch-shelf.mjs` stocks the shelf (needs the network). To add a molecule, add
  `[ID, "Name"]` to a group in `GROUPS` (or an id to `ENTRIES`) and run it; it downloads only files
  that are not already in `assets/molecules/`, and rewrites `tools/shelf.json`.
- `node tools/build-data.mjs` then rebuilds `data.js` from `tools/shelf.json` and the files. It stops
  if a small molecule's name is not the dictionary's own name or a synonym (unless the id is in
  `ACCEPT` in `tools/fetch-shelf.mjs`), and a new PDB entry needs its name in `ENTRY_NAMES` in
  `tools/build-data.mjs`. Run `tools/verify.mjs` after.

Each runs from the folder or from anywhere. They ran here on Node 26. The folder has no
`package.json`, so Node has to recognize `chem.js`, `formats.js` and `data.js` as ES modules from
their syntax; if your Node refuses them, add a `package.json` holding `{"type":"module"}`.
