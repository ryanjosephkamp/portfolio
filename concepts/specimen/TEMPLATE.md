# Specimen: make it yours

Specimen is a one-page portfolio laid out as a microscope slide on a lab bench. Its hero is a
neuron made of 32,768 Gaussian splats: turn the focus and they merge, pair by pair, down to one
Gaussian with the same mass, center and covariance; tap the cell and a Hodgkin–Huxley spike runs
down its axon; pinned labels light the part they name; three stains re-dye the same splats. The
owner's name sits on the slide's paper label, and its optical size follows the focus.

## Quick start

1. Unzip. The template is `index.html`, `styles.css`, `main.js`, `specimen.js`, `worker.js`,
   `verify.mjs`, `README.md` and `assets/fonts/`, plus this file and `DESIGN.md`.
2. From the unzipped folder, serve it with any static file server:

   ```bash
   python3 -m http.server 8000
   ```

3. Open http://localhost:8000/.

Use a server rather than opening `index.html` from disk: `main.js` is an ES module that imports
`specimen.js`, and the neuron is grown in a module worker (`worker.js`). Most browsers block both on
`file://` pages. Where module workers fail, `main.js` grows the neuron itself. There is no build
step.

The slide and the small figures need WebGL2. Without it the slide shows its fallback sentence
(`.slide__fallback`) and the figures and emblems are left out (`no-plates` on `<html>`). The
Splashery toys in Case I load from the web only when a visitor picks one.

## Make it yours

Everything below is personal to Ryan. Paths are file names; `#id` and `.class` are selectors in
`index.html` unless a JavaScript name is given.

### The slide label (the signature's frame)

The neuron itself is not personal: `neuron(seed = 1952, depth = DEPTH)` in `specimen.js` grows it
from a seed, and the page uses the defaults. The label around it is Ryan's.

- `.slide__label h1`: "Ryan Kamp". Its optical-size axis follows the focus control (see `DESIGN.md`):
  at low focus it takes Newsreader's sturdy small-size design, at full focus the fine display one.
  A long name may need a smaller `font-size` on `h1` in `styles.css` (now
  `clamp(2.6rem, 5.2vw, 4rem)`) to fit the label column.
- `.slide__no`: "Slide No. 001".
- `.slide__kind`: "*Homo sapiens*, graduate student".
- `.slide__label dl`: "Loc." (University of Cincinnati, Ohio), "Prep." (the neuron) and "Stain"
  (`#stain-name`, rewritten from each stain radio's `data-after`).
- `.nav__mark`: "RK" and, in its `<span>`, "Specimen". Its `aria-label` names Ryan.
- `.hero__intro`: the `.lede` (degrees, university link, "splats that explain") and the paragraph
  after it.

### Provenance, links and footer

- `#provenance .sheet__data`: "Now" (degree, concentration, university, expected date, thesis
  advisor link), "Before" (degrees, year) and "Interests".
- `#provenance .sheet__aside`: a paragraph on why the page argues for scientific visualization, and
  the CV link (a Google Drive URL).
- `#cabinet .also`: the capstone, in one line.
- `footer.foot .tags`: GitHub, Blog, Homepage, LinkedIn, X, YouTube, Hugging Face and CV.
- `.colophon`: "© 2026 Ryan Kamp." with the line about the neuron, and the typeface line.

### Head and social card

- `<title>`: "Ryan Kamp — Specimen: splats that explain".
- `<meta name="description">`: Ryan's program, university and interest, and the line about the
  neuron.
- `<meta name="theme-color" content="#f3f5f1">`: the bench color.
- `og:title`, `og:description` and `og:type`.
- This page has no `og:url`, no `og:image`, no `twitter:card` and no `assets/og.jpg`. To get a
  preview image when the link is shared, save a 1200 × 630 screenshot as `assets/og.jpg` and add,
  with your own address:

  ```html
  <meta property="og:url" content="https://example.com/">
  <meta property="og:image" content="https://example.com/assets/og.jpg">
  <meta name="twitter:card" content="summary_large_image">
  ```

- `<link rel="icon">`: an inline SVG of a glass slide with a violet dot. It is not personal.

### Storage

Specimen stores nothing in `localStorage` or cookies.

## Parts built on Ryan's projects

Most functions in `main.js` do not check that their elements exist. When you delete a part, delete
its call too: the calls are at the bottom of `main.js` (`hero()`, `collection()`, `figSpike()`) and
inside `plates()` (`figSplat()`, `figMerge()`, `figLight()`, `groophRun()`, `cabinet()`).

- **Splashery, Case I** (`#collection`):
  - `.drawers`: 23 Splashery toys in four drawers. Each is
    `<a href=".../embed/?toy=ID" data-toy="ID" data-note="...">` with a name in `<b>` and a line in
    `<span>`. `collection()` loads the chosen toy into `#bench` as an iframe:
    `https://ryanjosephkamp.github.io/splashery/embed/?toy=ID&theme=light&bg=transparent`, plus
    `&autoplay=EFFECT` from the `#bench-fx` radios (Still, Breeze, Pokes, Twist, Dissolve).
    Cmd-, Ctrl- or Shift-click follows the link to the toy's embed page instead. To swap a toy, change its `href`,
    `data-toy`, label and `data-note`; `README.md` advises seeing each embed render on the bench
    before relying on it.
  - `.catalog`: what Splashery's science shelves are computed from, by subject.
  - `.ledger`: Ryan's part, four facts about Splashery, and its links.
  - To remove Case I, delete the section, the `collection()` call, the "Collection" link in `.nav`,
    and point the skip link (`.skip`, now `#collection`) at another section.
- **grooph, Case III** (`article.feature`, `canvas#grooph-run`, `#grooph-says`): a loop graph drawn
  by `GROOPH` in `main.js` (a 2D canvas drawing of Builder, Critic and You, sampled into 8,192
  splats) with captions from `SCRIPT` in `groophRun()`. Edit the text in `.feature__text`, or delete
  the article and the `groophRun()` call.
- **Cabinet cards** (`.cards .card`): reword_nerd, resmon, Link Meteor, English OpenList (with its
  Hugging Face dataset link), Ars Magna, aqrobat and Amordle. Each `canvas[data-emblem]` names an
  entry in `EMBLEMS` in `main.js` (`reword`, `resmon`, `meteor`, `openlist`, `ars`, `aqrobat`,
  `amordle`). An entry is `[draw, when]`:
  - `draw(g)` paints on a 480 × 300 canvas. Black ink becomes splats in the body stain; ink whose
    blue channel is above 128 (the entries use `#00f`) takes the sheath stain.
  - `when(x, y)` takes a point as fractions of the canvas and returns when it lights up in the
    pulse, from 0 to 1.
  - `cabinet()` samples 4,096 splats from the ink the first time a card is scrolled to.

  To swap a project: write a new `EMBLEMS` entry, point the card's `data-emblem` at it, and edit
  `.card__no`, `<h3>`, the paragraph and `.links`. A card without `canvas[data-emblem]` is skipped
  by `cabinet()`; delete its `.card__slide` as well.
- **The four figures, Case II** (`#fig-splat`, `#fig-merge`, `#fig-light`, `#fig-spike`): these
  explain the slide, not a project. Keep them with the neuron.

## Third-party material in this folder

- `assets/fonts/newsreader-latin.woff2` and `assets/fonts/newsreader-italic-latin.woff2`:
  Newsreader, a variable font (weight 200 to 800, optical size 6 to 72), roman and italic, latin
  subset. Source: https://fonts.google.com/specimen/Newsreader (named in `README.md`). The font
  files' name table reads "Copyright 2020 The Newsreader Project Authors
  (http://github.com/productiontype/Newsreader)" and gives the license URL
  http://scripts.sil.org/OFL. License: SIL Open Font License, as stated in `README.md`.

No datasets, scans or images by anyone else are in this folder:

- The neuron is generated by code (`neuron()` in `specimen.js`); the colophon says "The neuron is a
  recipe, not a recording: no tissue was involved."
- The spike uses the Hodgkin–Huxley model with its 1952 squid-axon constants, written out as
  numbers in `hodgkinHuxley()` in `specimen.js`.
- The Splashery toys load from ryanjosephkamp.github.io when a visitor picks one. The data the
  catalog text names (NIST line spectra, the HYG star database, the walnut and gar scans) is used
  by Splashery, not by this page, and none of it is stored here.

## License

The code and the text are released under the MIT License; see `LICENSE` at the root of the
ryanjosephkamp/portfolio repository. Third-party material keeps its own license, listed above.

## Checks

`verify.mjs` checks the claims the page makes, using the same `specimen.js`. From the folder:

```bash
node verify.mjs
```

It grows the same neuron and checks every one of the 32,767 merged splats against all the leaves
beneath it, all 16 levels against the finest, that every covariance is positive definite and every
splat's four stain shares still sum to one (98,318 checks in all, largest drift about 1e-13). It
also checks that each pinned label picks out at least one splat and no splat answers to two labels,
and that the spike model rests at −65 mV, fires at its threshold and not just below it. It prints
`ok` with a summary, or stops with an error.

If you change `DEPTH` in `specimen.js` (now 15, for 2^15 = 32,768 splats), the recipe's counts
scale with it (`README.md`). Then update the counts written into `index.html` (32,768 in several
places, 32,767 and "all 16 levels" in Fig. 2, the `.knob__ticks` list), and the `/ 15` that spaces
the focus knob's tick marks in the `.knob input` background in `styles.css`.
