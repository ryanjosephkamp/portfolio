# Atlas: make it yours

Atlas is a one-page portfolio set as an engraved star atlas: white line on black, its marks in one
color. Its signature is Plate I, one round plate that zooms continuously from the Milky Way to a
ribosome, with the planets and the Moon where they are at this minute and a true scale bar at every
step. The atlas comes in six editions, and two of them have a dial that turns their one color.

It is static files and ES modules, with no build step at serve time.

## Quick start

1. Unzip the download. You get an `atlas/` folder.
2. Serve that folder with any static server, for example:

   ```bash
   cd atlas
   python3 -m http.server 8000
   ```

3. Open http://localhost:8000/.

It needs a server. `atlas.js` is an ES module that imports the other modules, and it loads
`assets/ground.js` and `assets/small.js` with `import()` after the first paint. Opened from disk
(`file://`), browsers block module scripts and the plate stays blank.

## Make it yours

Everything personal is in `index.html` unless a line says otherwise.

- [ ] **Page title:** `<title>Ryan Kamp · Atlas</title>`.
- [ ] **Meta description:** `<meta name="description">`.
- [ ] **Social card:** there is none. Add `og:title`, `og:description`, `og:url` and `og:image`
      (an absolute URL) if you want one. No social image ships in this folder;
      `assets/screenshot.png` (1440 × 900) is a picture of this page with Ryan's name, and no file
      references it. Replace it or delete it.
- [ ] **Theme color:** `<meta name="theme-color" content="#0c0c0b">`. `atlas.js` rewrites it from
      `--ink` whenever the edition changes, so leave it.
- [ ] **The name, twice:** `.top-mark` ("Atlas *of the work of* Ryan Kamp", two `.sc` spans around
      an `i`) and `h1#name`. The plate is titled by the name: the `h1` sits in `.cartouche` under
      `.plate-no` ("Plate I. *The measure of things*"). The canvas itself draws no name.
- [ ] **The line under the name:** `.sub`.
- [ ] **Bio and university:** the two paragraphs after `.sub` in `.cartouche` (graduate student in
      computer science at the University of Cincinnati, his research interests, and the plate's
      link to Splashery's Powers of ten).
- [ ] **How-to line:** `p#how`. On touch screens `atlas.js` replaces it with its own sentence
      (search for `getElementById('how')`).
- [ ] **Navigation:** `.top nav` links to `#splashery`, `#plates`, `#interests` and `#links`; the
      `.skip` link points at `#plates`.
- [ ] **Featured project:** the `#splashery` sheet (Plate II): `.sheet-head`, the `.lede`
      paragraph and its `.links`, and three figures covered under "Parts built on Ryan's projects."
- [ ] **Other projects:** the `#plates` sheet. Each `article.chart` (Plates III to VI: grooph, Link
      Meteor, English OpenList, resmon) has an `svg.art` drawing and a `.chart-text` with
      `.plate-no`, `h3`, `.dates`, a description and `.links`. `ol.index` holds the rest
      (reword_nerd, Ars Magna, aqrobat, Amordle, and the capstone as `li.last`), text only.
- [ ] **Research interests:** `ul.legend` in `#interests`. Each item has a star-magnitude dot
      (`.mag.m1` largest to `.m5` smallest); `li.first` prints in the edition's color.
- [ ] **Education:** the two paragraphs under the legend (degrees, dates, advisor links).
- [ ] **Links:** `ul.bearings` in `#links` (CV on Google Drive, homepage, repositories, blog,
      GitHub, LinkedIn, X, YouTube, Hugging Face).
- [ ] **The sky's place:** Fig. 1 is the sky over Cincinnati. Change `LAT`, `LON` and the time zone
      in `when` (`'America/New_York'`) in `atlas.js`, the word "Cincinnati" in `drawSky()`'s
      readout, the `#sky` `aria-label`, the starting text of `#sky-read`, and the figure's
      paragraph.
- [ ] **Colophon:** `footer.colophon`. Keep the credit for every piece of data you keep. Delete
      `<a href="../../">The other concepts</a>`, which points at Ryan's gallery of concepts.
- [ ] **Stored choices:** the edition and the dial are kept in `localStorage` under `atlas:scheme`,
      `atlas:hue:field-color` and `atlas:hue:one-color`. The prefix is written in two places: the
      inline `<script>` in `<head>` and the editions block at the end of `atlas.js`
      (`atlas:scheme` and `` `atlas:hue:${...}` ``). Rename it in both if another page on your
      domain uses `atlas:`.

## Parts built on Ryan's projects

### Plate I follows Splashery's Powers of ten

The plate takes the same journey as Powers of ten in Splashery, Ryan's Gaussian splat playground,
and closes on the same spot: a small tree in the Enid A. Haupt Garden in Washington (`GARDEN` in
`atlas.js`, `LAT0` and `LON0` in `tools/trace.py`). The stops are the `li` elements in `ol#stops`;
each has `data-z` (log10 of the plate's width in meters), `data-d` (the stop's size in meters), and
for the traced stops `data-layer` and `data-source`.

- **Keep it:** nothing to do. Edit the stop sentences if you like, but keep the sizes: the checks
  compare them with what is drawn.
- **Remove a stop:** delete its `li`. `tools/verify.mjs` expects exactly 17 stops (check 3) and
  measures the traced ones (check 8), so edit those checks to match.
- **Close on another place:** this is a real rebuild. You need OpenStreetMap extracts of your place
  and a new run of `tools/trace.py`, whose `ground()` looks features up by name (the District of
  Columbia boundary, the United States Capitol, the Lincoln Memorial, the Smithsonian Institution
  Building, the Enid A. Haupt Garden, and others). Then change `GARDEN`, the region cut of the
  coastline in `tools/build-data.mjs` (the Mid-Atlantic), the stop sentences and sizes, the
  Washington labels in `drawPlate()`, and check 8 in `tools/verify.mjs`.

### The astronomy and the data (Splashery's own)

`assets/astro.js` is Splashery's astronomy module (sidereal time, precession, the planets, the
Moon). `assets/data.js` is built by `tools/build-data.mjs` from Splashery's data snapshots (its
Night sky and Mount St. Helens toys) and Natural Earth's coastlines. Plate I uses `STARS` and
`COAST`; Fig. 1 adds `LINES`; Fig. 2 uses `HELENS`. Keep both files with the page.

### The three figures on Plate II

| Markup | Code in `atlas.js` that reads it |
|---|---|
| Fig. 1, `canvas#sky`, `#hours`, `#now`, `#sky-read` | the "Fig. 1" section, `drawSky()` in `drawAll()`, and `skyCanvas` in the `ResizeObserver` list |
| Fig. 2, `canvas#helens`, `#before`, `#after`, `#helens-read` | the "Fig. 2" section, `drawHelens()` in `drawAll()`, and `helensCanvas` in the same list |
| Fig. 3, `#load-real` | the "real toy" block, which swaps the button for Splashery's embed player (`embed/?toy=powers-of-ten&theme=dark`) |

To remove a figure, delete its `article.fig` and the code in the right-hand column; `atlas.js`
looks each element up once at load and stops at one that is missing. The links under each figure
open Splashery's toys with `?labs=1`.

### The drawings on Plates III to VI

The four `svg.art` drawings are markup and CSS: grooph as a constellation (with `circle.runner` on a
CSS `offset-path`), Link Meteor as meteors, English OpenList as a logarithmic rule, resmon as a
survey sweep. The rule's ticks are added by the "Plate V" block in `atlas.js`; delete that block if
you delete `#log-ticks`. Replace each drawing with one for your own project, or drop the `svg` and
keep the text.

## Third-party material in this folder

- `assets/ground.js`: Washington's outlines (the District's boundary, its rivers and motorways, the
  Mall's water, streets and larger buildings, and the Haupt Garden's footprints, paths, hedges,
  beds and trees), traced by `tools/trace.py` from OpenStreetMap extracts. © OpenStreetMap
  contributors, Open Database License (ODbL). The file's header says: "This file is a derivative
  database and is offered under the same license." It is not under the MIT License.
- `assets/data.js` (built by `tools/build-data.mjs`), four sources in one file:
  - `STARS`: the HYG database v4.1 by David Nash (astronexus.com), CC BY-SA 4.0.
  - `LINES`: constellation lines from the Stellarium team's Western sky culture, CC BY-SA (the
    version is not stated in this folder).
  - `HELENS`: the USGS pre-1980 DEM and USGS 3DEP, public domain.
  - `COAST`: Natural Earth coastlines, public domain.
- `assets/small.js` (built by `tools/trace.py`), outlines traced from:
  - `bed`: *Golden Fullmoon Maple*, a 3D capture by Joshua Trapani,
    https://superspl.at/scene/f233b115, CC BY 4.0.
  - `leaf`: *Golden Full Moon Maple* by susteph (Flickr),
    https://www.flickr.com/photos/28012136@N08/2649442904, CC BY 2.0.
  - `cells`: *Arabidopsis thaliana plant cells containing chloroplasts* by Fernán Federici
    (Wellcome Collection), https://wellcomecollection.org/works/gwmfux6b, CC BY 4.0.
  - `chloroplast`: *Chloroplast in a bean leaf, TEM* by Kevin Mackenzie, University of Aberdeen
    (Wellcome Collection), https://wellcomecollection.org/works/bx3dctp2, CC BY 4.0.
  - `ribosome`: cryo-EM map EMD-48329 (https://www.ebi.ac.uk/emdb/EMD-48329) and its model, PDB
    9MKK (Majumdar and others, 2025). The header of `small.js` says public domain; the colophon
    states no license.
- `assets/astro.js` (Splashery's module) carries published values and methods: E. M. Standish's
  Keplerian elements for approximate positions (JPL) in its `ELEMENTS` table, the low-precision
  lunar series of the Astronomical Almanac, and formulas from Meeus, *Astronomical Algorithms*.
  They are credited in its comments and the colophon; license not stated in this folder.
- `editions.js` uses Björn Ottosson's OKLab matrices, credited in a comment; license not stated in
  this folder.
- `assets/fonts/im-fell-english-roman.woff2` and `assets/fonts/im-fell-english-italic.woff2`: IM
  Fell English, Igino Marini's revival of the Fell types, under the SIL Open Font License
  (colophon). The files read "© 2007 Igino Marini (www.iginomarini.com) With Reserved Font Name IM
  FELL English Roman" (and "Italic").

What this means in practice: `ground.js` is ODbL, and `data.js` holds CC BY-SA data, so neither
file is MIT. If you publish the page with them, keep the colophon's credits, including
"© OpenStreetMap contributors". If you hand on the files themselves, they go under their own
licenses. To drop the OpenStreetMap data, delete `assets/ground.js` and the `import('./assets/ground.js')`
block in `atlas.js`: the city, Mall and garden stops then draw as a plain ring with their name and
size. Also edit their `data-source` text, the `.fine` paragraph under the stops, the colophon, and
check 8 and the `GROUND` import in `tools/verify.mjs`.

## License

The code and text in this folder are released under the MIT License; see `LICENSE` at the root of
the portfolio repository (https://github.com/ryanjosephkamp/portfolio). The third-party material
listed above keeps its own license.

## Checks

Run these from the `atlas/` folder. The two Node checks need Node.js and nothing else.

- `node tools/verify.mjs`: the plate's measures and astronomy. The scale bar and light's crossing
  time at every zoom the rule can reach (29,201 of them), the 17 stops in order, the planets on
  every day from 1800 to 2050, Polaris over Cincinnati, the data files, the Earth's turn, and every
  traced outline against the size the page states. One line per check; exits 1 on a failure.
- `node tools/check-contrast.mjs`: every edition's colors from `styles.css` and the dials from
  `editions.js`. Type must reach 4.5 to 1 on every ground and rules 1.5 to 1; each dial is turned
  through 3,600 positions, and each must fit inside sRGB. Run it after any color change.
- `node tools/build-data.mjs <dir>` rebuilds `assets/data.js` from Splashery's `sky.json` and
  `sth.bin.gz` and Natural Earth's `ne_110m_coastline.geojson` and `ne_50m_coastline.geojson`.
- `python3 tools/trace.py <source dir> [ground|small] [--preview <dir>]` rebuilds
  `assets/ground.js` and `assets/small.js` from the sources its docstring lists. It needs NumPy,
  Pillow, SciPy and scikit-image, and matplotlib for `--preview`.
