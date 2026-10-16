# One Splat: make it yours

One Splat is a one-page portfolio set out like a short paper. Its hero draws a name with Gaussian
splats: a dial divides the picture from one splat up to 16,384, a probe measures whichever splat the
pointer is on, and a text box refits the picture to anything a visitor types. Below it, the
Definition section lets the visitor reshape one splat by hand, and the Lemma section cuts one splat
of the picture in two and shows that the halves keep its mass, mean and covariance.

## Quick start

1. Unzip. The template is `index.html`, `styles.css`, `main.js`, `fit.js`, `verify.mjs`,
   `README.md` and `assets/` (fonts and the social card image), plus this file and `DESIGN.md`.
2. From the unzipped folder, serve it with any static file server:

   ```bash
   python3 -m http.server 8000
   ```

3. Open http://localhost:8000/.

Use a server rather than opening `index.html` from disk: `main.js` is an ES module that imports
`fit.js`, and most browsers block module scripts on `file://` pages. There is no build step.

The hero draws with WebGL2. Where WebGL2 is missing it draws on a 2D canvas instead, and adding
`?flat` to the address (http://localhost:8000/?flat) forces that path so you can see it.

## Make it yours

Everything below is personal to Ryan. Paths are file names; `#id` and `.class` are selectors in
`index.html` unless a JavaScript name is given.

### The name (the signature)

- `main.js`, `const NAME = 'RYAN KAMP'`: the text the hero fits when the page opens, and the text it
  falls back to when the box is empty. `fitText()` draws it with `FACE`
  (`'700 300px "B612", sans-serif'`), samples up to 120,000 inked pixels, and builds the splat tree
  with `buildTree()` from `fit.js`. Nothing is precomputed: change the string and the picture, the
  dial's ticks and every readout follow.
- `#fit-text`: the text box's starting `value="RYAN KAMP"`. It takes up to 16 characters
  (`maxlength="16"`); what a visitor types is uppercased. Match the value to `NAME`.
- `h1.name`: the name as plain text, shown until the splats light. `main.js` adds `is-lit` to
  `<html>` once the hero is set up, and the CSS then hides the heading visually (it stays for
  screen readers).
- `#subject`: "my name". `refit()` in `main.js` writes "my name" while the hero shows `NAME` and
  quotes anything else; edit that string if you want different words.
- When the stage is narrower than 560 px, each word of the name goes on its own line (`stacked` in
  `hero()`), so a two-word name stacks on a phone.
- `MAX_LEVEL = 14` caps the tree at 16,384 splats, and `fitText()` also stops early so that each
  bottom-level splat stands for at least four sampled pixels. A short name with little ink can top
  out below 16,384; the dial and the readouts adjust by themselves.
- `REST = 10`: where the opening animation comes to rest (1,024 splats).
- Count text in `index.html`: `#r-splats` ("1 of 16,384"), `#r-level` ("0 of 14"), `#l-splits`
  ("16,383") and `#s-id` ("1 of 16,383") are starting values that `main.js` overwrites. The meta
  description ("from one Gaussian splat to sixteen thousand") and `og:description` ("from one to
  sixteen thousand") are fixed; adjust them if your name tops out lower.

### Bio, interests and links

- `.bar__mark`: "Ryan Kamp" and, in its `<span>`, the italic "one splat".
- `.hero__say`, the paragraph after `.lede`: name, program, university, interests, and the link to
  `#splashery`.
- `#author .author dl`: "Now" (degree, concentration, university link, dates, thesis advisor link)
  and "Before" (degrees, year, capstone advisor link).
- `#author .interests`: five research interests; the one wrapped in `<mark>` glows in the beam color.
- `footer.refs ol`: CV (a Google Drive link, dated October 2026), GitHub, Blog, Homepage, LinkedIn,
  X, YouTube and Hugging Face. The list numbers itself (`[1]`, `[2]`, ...).
- `.colophon`: "© 2026 Ryan Kamp." and the typeface line.
- `.bar ul`: the section links (`#definition`, `#splashery`, `#work`, `#author`).
- `#work .more`: the link to Ryan's repository map.

### Head and social card

- `<title>`: "Ryan Kamp — one splat".
- `<meta name="description">`: Ryan's program, university and interests, and the line about the
  name.
- `<meta name="theme-color" content="#0a0a0b">`: the page black.
- `og:title`, `og:description`, `og:url` and `og:image`. Both URLs are absolute and point at
  `https://ryanjosephkamp.github.io/portfolio/concepts/one-splat/`; point them at your own address.
- `assets/og.jpg`: a 1200 × 630 screenshot of the hero drawing Ryan's name. Replace it with a
  screenshot of yours at the same size. `twitter:card` is `summary_large_image` and uses the same
  image.
- `<link rel="icon">`: an inline SVG of one orange splat on black. It is not personal.

### Storage

One Splat stores nothing in `localStorage` or cookies.

## Parts built on Ryan's projects

- **Splashery** (`#splashery`, headed "Example."): a description of Splashery, Ryan's part in it, a
  `.meta` line, links, and a live iframe in `.embed`:
  `https://ryanjosephkamp.github.io/splashery/embed/?toy=gaussian-splatting&theme=dark`. The iframe
  loads from Ryan's site (`loading="lazy"`). To swap it, point `src` at another page that allows
  embedding and rewrite the `figcaption`. To remove it, delete `figure.example__live` or the whole
  section; then remove the `#splashery` link from `.bar ul` and from the hero paragraph, and the
  last sentence of the Lemma's `.aside` ("Splashery has a toy that shows it, next.").
- **The Tinkerer's Manual** (`#definition`, last paragraph of `.anatomy__math`): a link to
  Splashery's manual. Replace or delete the paragraph.
- **Further examples** (`#work ul.works`): each `li[data-splat]` gets its title drawn in splats by
  `titles()` in `main.js`, from the `data-splat` string (uppercased, fitted up to level 10). The rows
  are grooph, aqrobat, Ars Magna and Amordle. To swap a project, change `data-splat`, the `<h3>`,
  the paragraph and `.links`. A row without `data-splat` and its `<canvas>` renders as plain text.
- **See also** (`ul.works--plain`): reword_nerd, resmon, Link Meteor, English OpenList (with its
  Hugging Face dataset link) and the capstone. Plain rows: edit, add or delete them.

The two math sections, Definition and Lemma, are not about Ryan's projects; they explain the hero.
If you delete `#lemma`, also delete the two lines in `refit()` (inside `hero()` in `main.js`) that
set `out.splits` and `out.worst`: they write into `#l-splits` and `#l-worst`, which live in the
Lemma's proof, and `hero()` stops with an error when they are missing.

## Third-party material in this folder

- `assets/fonts/b612-normal-400.woff2` and `assets/fonts/b612-normal-700.woff2`: B612, regular and
  bold. `README.md` credits B612 and B612 Mono to Intactile Design for Airbus. The font files' name
  table reads "Copyright 2012 The B612 Project Authors (https://github.com/polarsys/b612)" and gives
  the license URL http://scripts.sil.org/OFL. License: SIL Open Font License, as stated in
  `README.md`.
- `assets/fonts/b612-mono-normal-400.woff2` and `assets/fonts/b612-mono-normal-700.woff2`: B612 Mono,
  regular and bold. Same credit, copyright line and license as B612.
- `assets/fonts/stix-two-text-normal-400-700.woff2` and
  `assets/fonts/stix-two-text-italic-400-700.woff2`: STIX Two Text, roman and italic, variable weight
  400 to 700. The name table reads "Copyright 2001-2021 The STIX Fonts Project Authors
  (https://github.com/stipub/stixfonts)" and gives the license URL https://scripts.sil.org/OFL.
  License: SIL Open Font License, as stated in `README.md`.

Nothing else in the folder was made by someone else. The Splashery iframe loads from
ryanjosephkamp.github.io when the page runs; none of it is stored here. The Definition section links
to Kerbl et al., 2023 as a citation only. `assets/og.jpg` is a screenshot of this page.

## License

The code and the text are released under the MIT License; see `LICENSE` at the root of the
ryanjosephkamp/portfolio repository. Third-party material keeps its own license, listed above.

## Checks

`verify.mjs` tests `fit.js`, the same code the page runs. From the folder:

```bash
node verify.mjs
```

It builds 256 trees from point sets shaped like parts of letters (bars, rings, diagonals, dust,
islands) and from degenerate ones (a line, a grid, one point), and asserts that:

1. every split conserves mass, mean and covariance (the law of total covariance);
2. every node's moments match a brute-force recomputation from its points;
3. every split is a median split along the principal axis;
4. every level covers the whole point set once, with no empty node;
5. `eig()` and `covariance()` undo each other;
6. `checkTree()` reports the worst split correctly;
7. 11,200 other divisions (straight cuts at any angle, and random ones) conserve the moments too.

It prints five summary lines and exits with an error at the first failed assertion. The checks do
not depend on the name, so swapping `NAME` needs no change here. The proof paragraph in `#lemma`
quotes the suite's numbers (169,544 splits, 11,200 divisions); keep them in step if you change
`verify.mjs`. Its "test suite" link opens `verify.mjs` on GitHub, because the published page leaves
the file out; point it at your own copy or repository.
