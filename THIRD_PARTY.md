# Third-party material

The code and text in this repository are Ryan Kamp's, under the MIT License in `LICENSE`. The files
below were made by other people, or come from data other people published, and keep their own
licenses. They ship inside the templates, so if you publish a page built from one, keep its credits
on the page and these notices with the files.

Each template's `TEMPLATE.md` has the same list for that template alone, under "Third-party material
in this folder", with exact file names and sources.

## In short

| License | What it covers | What it asks of you |
| --- | --- | --- |
| SIL Open Font License 1.1 | Every font file in every template | Keep the font's copyright and license with it; do not sell the font by itself; rename it if you modify it |
| CC BY 4.0 | Slice's two CT scans; three pictures Atlas traces | Credit the authors, as each page's colophon does |
| CC BY 2.0 | One picture Atlas traces (the maple leaf) | Credit the author |
| CC BY-SA 4.0 and CC BY-SA | Atlas's star data and constellation lines, in `concepts/atlas/assets/data.js` | Credit the sources, and share that file (and changes to it) under the same license |
| Open Database License (ODbL) 1.0 | Atlas's map of Washington, `concepts/atlas/assets/ground.js`, traced from OpenStreetMap | Credit "© OpenStreetMap contributors", and offer that file (and changes to it) under the ODbL |
| CC0 and public domain | Molecule's 154 molecule files from the Protein Data Bank; Atlas's elevation and coastline data, and its ribosome | Nothing required; credit is kind |
| MIT | Arcade's word files from English OpenList, with their own `LICENSE.txt`; code adapted from Splashery | Keep the copyright notice |

Two Atlas files are therefore not MIT: `assets/ground.js` (ODbL) and `assets/data.js` (CC BY-SA). To
drop them from a template, Atlas's `TEMPLATE.md` says how.

## Fonts (SIL Open Font License 1.1)

| Typeface | Templates | Copyright, as the font file states it |
| --- | --- | --- |
| Recursive | Anagram Tiles, Overprint | The Recursive Project Authors (github.com/arrowtype/recursive) |
| B612 and B612 Mono | One Splat | The B612 Project Authors (github.com/polarsys/b612), designed by Intactile Design for Airbus |
| STIX Two Text | One Splat | The STIX Fonts Project Authors (github.com/stipub/stixfonts) |
| Newsreader | Specimen | The Newsreader Project Authors (github.com/productiontype/Newsreader) |
| Fredoka | Toy Box | The Fredoka Project Authors (github.com/hafontia/Fredoka-One) |
| National Park | Workshop | The National Park Project Authors (github.com/benhoepner/National-Park) |
| Shantell Sans | Molecule | The Shantell Sans Project Authors (github.com/arrowtype/shantell-sans) |
| Archivo | Resonance | The Archivo Project Authors (github.com/Omnibus-Type/Archivo) |
| Atkinson Hyperlegible Next and Mono | Slice | The Atkinson Hyperlegible Next and Mono Project Authors (Braille Institute) |
| IM Fell English | Atlas | Igino Marini (iginomarini.com), with Reserved Font Names "IM FELL English Roman" and "Italic" |
| Martian Mono | Arcade | The Martian Mono Project Authors (github.com/evilmartians/mono) |

The license text is at https://openfontlicense.org.

## Data and pictures

### Slice

- Walnut 1, from *Cone-Beam X-Ray CT Data Collection Designed for Machine Learning* by Henri Der
  Sarkissian, Felix Lucka, Maureen van Eijnatten, Giulia Colacicco, Sophia Bethany Coban and K. Joost
  Batenburg (CWI), https://doi.org/10.5281/zenodo.2686726, CC BY 4.0. Downsampled, as Splashery ships
  it, and laid out as `assets/walnut-sheet.png`.
- The 12.8 mm larva from *MicroCT images of 3 early gar (Lepisosteus osseus) stages between 12.7mm
  and 21.7mm* by Brian Metscher (University of Vienna), https://doi.org/10.5281/zenodo.19021581,
  CC BY 4.0. Downsampled and cropped, as Splashery ships it, and laid out as `assets/gar-sheet.png`.

### Atlas

- `assets/ground.js`: traced from OpenStreetMap. © OpenStreetMap contributors, ODbL 1.0.
- `assets/data.js`: the HYG database v4.1 by David Nash (astronexus.com), CC BY-SA 4.0;
  constellation lines from the Stellarium team's Western sky culture, CC BY-SA; the USGS pre-1980
  DEM and USGS 3DEP, public domain; Natural Earth coastlines, public domain.
- `assets/small.js`, outlines traced from: *Golden Fullmoon Maple*, a 3D capture by Joshua Trapani,
  CC BY 4.0; *Golden Full Moon Maple* by susteph (Flickr), CC BY 2.0; *Arabidopsis thaliana plant
  cells containing chloroplasts* by Fernán Federici (Wellcome Collection), CC BY 4.0; *Chloroplast in
  a bean leaf, TEM* by Kevin Mackenzie, University of Aberdeen (Wellcome Collection), CC BY 4.0; and
  cryo-EM map EMD-48329 with its model PDB 9MKK, public domain.
- `assets/astro.js` uses published values and methods, credited in its comments: E. M. Standish's
  Keplerian elements (JPL), the low-precision lunar series of the Astronomical Almanac, and formulas
  from Jean Meeus, *Astronomical Algorithms*.
- `editions.js` uses Björn Ottosson's OKLab matrices, credited in a comment.

### Molecule

- `assets/molecules/*.sdf` (143 files): chemical components from the wwPDB Chemical Component
  Dictionary at ideal coordinates, and `assets/molecules/*.pdb` (11 files): PDB entries 1CRN, 1UBQ,
  4INS, 1LYZ, 1MBN, 1EMA, 2DHB, 1STP, 1BL8, 1BNA and 1EHZ. All from the Protein Data Bank
  (rcsb.org), unchanged, CC0.
- Reference values in `chem.js`: CPK colors as Jmol gives them; van der Waals radii from Bondi (1964)
  and Mantina et al. (2009); covalent radii after Cordero et al. (2008); standard atomic weights;
  lattice constants cited to Crystallography Open Database entries 9008564, 9008468 and 9008536.

### Arcade

- `assets/words/2.txt` to `35.txt`: a slice of English OpenList
  (https://huggingface.co/datasets/ryanjosephkamp/english-openlist), MIT, with its license in
  `assets/words/LICENSE.txt`.

## Ryan's own projects

Several templates show or embed Ryan's own projects: Splashery (MIT,
https://github.com/ryanjosephkamp/splashery), grooph, Ars Magna, Amordle and aqrobat. Embeds and
links load from his sites when a visitor asks for them; they are not copied into the templates. Each
`TEMPLATE.md` lists them under "Parts built on Ryan's projects", with how to keep, swap or remove
each one.
