# Toy Box: make it yours

Toy Box is a one-page portfolio dressed as toy packaging. Its hero is the owner's name as a toy made
of Gaussian splats: a visitor spins it, pokes it, paints it, drops it and blows on it, hears a note
for each letter, swaps it for a donut, a knot, a tiny planet or their own picture, and copies a link
that holds the whole scene. Below the pack sit Splashery, a shelf of other projects with small live
pictures, research interests and contact stickers.

## Quick start

1. Unzip. The template is `index.html`, `styles.css`, `main.js`, `scene.js`, `tools/verify.mjs`,
   `README.md` and `assets/` (the font and the social card image), plus this file and `DESIGN.md`.
2. From the unzipped folder, serve it with any static file server:

   ```bash
   python3 -m http.server 8000
   ```

3. Open http://localhost:8000/.

Use a server rather than opening `index.html` from disk: `main.js` is an ES module that imports
`scene.js`, and most browsers block module scripts on `file://` pages. There is no build step.

What depends on the browser:

- The toy needs WebGL2. Without it the page keeps the plain name in `h1.stage__name` and adds
  `no-gl` to `<html>`. The rest of the page reads without JavaScript.
- **Copy link** writes to the clipboard, which browsers allow on `localhost` and on HTTPS. Elsewhere
  the scene is left in the address bar, and the status line says so.
- **Save video** needs `MediaRecorder` and canvas capture; the button is disabled where they are
  missing.
- Sound is off until the visitor turns it on (`#sound`).

## Make it yours

Everything below is personal to Ryan. Paths are file names; `#id` and `.class` are selectors in
`index.html` unless a JavaScript name is given.

### The name toy (the signature)

The toy is built in the browser each time from text drawn in Fredoka, so there is no precomputed
data to regenerate. All of it is in `buildName(n)` in `main.js` and the constants above it.

- `buildName(n)`: draws `['RYAN', 'KAMP']`, one array entry per row, onto a 680 × 430 canvas
  (`W`, `H`) in Fredoka at weight 700 and 200 px (`px`), with baselines at y 196 and 392. It then
  places splats on the letters' rims, front faces and back faces. Put your name in the array. A row
  wider than 680 px at 200 px is cut off at the canvas edge, so for a long row raise `W` or lower
  `px`. For three rows, raise `H` and extend the baseline expression `r === 0 ? 196 : 392`.
- Each letter is filled with its own shade of red, `rgb((li + 1) * 28, 0, 0)`, so `letterAt` can
  tell which letter a pixel belongs to. That index picks the letter's splat color, its count on the
  Contents label, and its note. Keep these the same length as your name (eight now):
  - `LETTERS = 'RYANKAMP'`: the letters shown in the Contents census.
  - `LETTER_COLORS` (splat colors, as 0 to 1 RGB from `C`) and `LETTER_CSS` (the same colors as CSS
    for the census): yellow, pink, white, orange, white, orange, pink, yellow.
  - `T.census = new Array(8)` in `buildName`, and the clamp `Math.min(7, ...)` in `letterAt`.
  The step of 28 leaves room for nine letters (9 × 28 = 252 of the 255 a channel holds); for more,
  lower the step in both the `fillStyle` and `letterAt`.
- The notes: the `bar` voice in `sound` plays `SCALE[i % 8]`, a C major scale from C5 to C6, so
  letters past the eighth repeat it.
- `TOY_INFO.name`: the `label` 'The name' (read out in the status line) and the `made` line ("two
  rows of rounded letters, sampled from the page's own typeface") on the Contents label. The shelf
  chip's own text is in `index.html`, `button[data-toy="name"]`.
- `h1.stage__name`: "Ryan<br>Kamp", the name shown before the toy is live and where WebGL2 is
  missing.
- `.pack__brand b`: "Ryan Kamp" on the pack.
- `#stage` `aria-label`: "The toy: Ryan Kamp's name made of splats. ..."
- `#contents`: the fallback line "One name, in splats. Turn on JavaScript to tip them out."
- `.nav__mark`: "RK", with an `aria-label` that names Ryan.
- `main.js`, the share handlers: downloads are named `ryan-kamp-toy.png` and `ryan-kamp-toy.webm`.

Shared links (`#s=` in the address) hold the toy's index in `TOYS`, whether it was dropped, how it
was turned and up to 180 paint dabs, encoded by `encodeScene` in `scene.js`. The name is not in the
link: a link opens whatever `buildName` draws on the page that receives it. Paint is placed by
position, so old links still open, with their paint where it was.

### Bio, research and links

- `.hero__intro`: name, program, university link, the interest in digital media, and the link to
  `#box`.
- `.hero__aside`: how to use sound, **Copy link** and **More**.
- `#research .study__prose`: program, concentration, expected date, thesis advisor link, earlier
  degrees; the paragraph about splats as a material (`README.md` calls it "a stated interest, not a
  result"); the CV link (a Google Drive URL).
- `#research .interests`: five interests, as stickers. Each sets its fill, text color and tilt
  inline (`--c`, `--fg`, `--tilt`).
- `#contact .elsewhere`: GitHub, LinkedIn, X, YouTube, Hugging Face, Blog, Homepage and CV, as
  stickers with inline `--c` and `--tilt`.
- `.colophon`: "© 2026 Ryan Kamp." and the lines about Fredoka and the renderer.

### Head and social card

- `<title>`: "Ryan Kamp — Toy Box".
- `<meta name="description">`: Ryan's program, university and interest, and the line about the toy.
- `<meta name="theme-color" content="#ffd60a">`: the yellow page.
- `og:title`, `og:description`, `og:url` and `og:image`. Both URLs are absolute and point at
  `https://ryanjosephkamp.github.io/portfolio/concepts/toybox/`; point them at your own address.
- `assets/og.jpg`: a 1200 × 760 screenshot of the pack with Ryan's name on the toy. Replace it with
  a screenshot of yours (1200 × 630 is the usual card size). `twitter:card` is
  `summary_large_image` and uses the same image.
- `<link rel="icon">`: an inline SVG of a pink and a teal circle on yellow. It is not personal.

### Saved settings

- `main.js`, `toybox()`: the splat count a visitor picks with **Fewer** and **More** is kept in
  `localStorage` under the key `toybox:detail` (`README.md` documents it). Rename it in both the
  `getItem` and the `setItem` call. Every page on the same origin shares `localStorage`, so a
  generic key can collide with another site you host there.

## Parts built on Ryan's projects

- **Splashery** (`#box`, "What's in the box"):
  - `#embed-frame` and its button `#embed-load` ("Unwrap it here"): `embed()` in `main.js` replaces
    the box with an iframe of `https://ryanjosephkamp.github.io/splashery/embed/?toy=cactus&autoplay=breeze`
    when clicked. The box's text gives the download size (about 8 MB). To swap it, change the URL
    and `title` in `embed()` and the text in `#embed-frame`. To remove it, delete `#embed-frame`;
    `embed()` returns early without `#embed-load`.
  - `.head__lede`, the `.links` under the embed, `.box__role` ("My part") and `.cards--facts` (six
    cards about Splashery): text and links to edit or delete.
  - The hero's tool names (spin, poke, paint, drop, blow) follow Splashery's verbs (`README.md`), but
    the hero is this page's own renderer and loads nothing from Splashery. `.one` ("One splat, up
    close") explains the hero's splats; keep it with the toy.
- **The shelf** (`#shelf`, `.cards--shelf`): each card has a small live picture, `.art`, made in
  HTML and CSS, two with a little JavaScript:
  - grooph (`.art--grooph`, on the wide card `.card--wide`): three nodes, an arch for the loop, and
    a token on the `travel` keyframes.
  - aqrobat (`.art--qr`, `#qr`): `qrArt()` builds a 19 × 7 grid shaped like a QR code's corner and
    cycles the modules' text through `sets` (`'aqrobat'`, four symbols, `'SPLAT'`).
  - Amordle (`.art--amordle`): the letters S P L A T flipping on the `flip` keyframes.
  - Ars Magna (`.art--ars`, `#ars`): eight tiles; inline `--a` is each letter's place in ARS MAGNA
    and `--b` its place in ANAGRAMS; `arsMagna()` toggles `.is-b` every 2.6 s.
  - English OpenList (`.art--list`, with its Hugging Face dataset link), Link Meteor
    (`.art--meteor`), resmon (`.art--resmon`) and reword_nerd (`.art--reword`): CSS only.

  To swap a project, keep the card and change its `.art` contents, `<h3>`, paragraph and `.links`.
  To remove one, delete its `<li>`; `qrArt()` and `arsMagna()` return early when their element is
  gone.
- **The capstone** (`.last`): one line at the back of the shelf.

Inside `toybox()`, most of the pack's elements (`#sound`, `#drop`, `#swatches`, `#clear`,
`#photo-file`, `#share-link`, `#share-png`, `#share-video`, `#detail`, `#fewer`, `#more`, `#hint`,
`#contents`) are looked up without checks. Keep them if you keep the toy.

## Third-party material in this folder

- `assets/fonts/fredoka-latin.woff2`: Fredoka, a variable font (weight 300 to 700, width 75% to
  125%), latin subset. Source: https://fonts.google.com/specimen/Fredoka (named in `README.md`). The
  font file's name table reads "Copyright 2016 The Fredoka Project Authors
  (https://github.com/hafontia/Fredoka-One)" and gives the license URL http://scripts.sil.org/OFL.
  License: SIL Open Font License, as stated in `README.md`.

Nothing else in the folder was made by someone else:

- The donut, knot and planet are generated by code in `main.js` (`buildDonut`, `buildKnot`,
  `buildPlanet`).
- Every sound is synthesized with the Web Audio API by `sound` in `main.js`; there are no audio
  files.
- A visitor's picture is read in the browser (`createImageBitmap`, then `buildPhoto`) and is not
  uploaded or put in links.
- The cactus loads from Ryan's Splashery site only when a visitor asks for it.
- `assets/og.jpg` is a screenshot of this page.

## License

The code and the text are released under the MIT License; see `LICENSE` at the root of the
ryanjosephkamp/portfolio repository. Third-party material keeps its own license, listed above.

## Checks

`tools/verify.mjs` tests `scene.js`, the parts of the page with a right answer. From the folder:

```bash
node tools/verify.mjs
```

It checks that base64url encoding round-trips every byte in every position; that all 655,360 link
headers (5 toys × dropped or not × 256 turns × 256 tilts) and every value of a paint dab encode and
decode to themselves, as do scenes of 0 to 180 dabs; that a splat cut off at 3 sigma keeps
1 − e^−4.5 = 98.889% of its paint, by summing 16,777,216 samples; and that the covariance readout
under "One splat, up close" has the right trace and determinant at all 1,187,541 slider positions.
It ends with "all checks pass", or stops at the first failed assertion.

If you add a toy, append it to `TOYS` in `scene.js` (a link stores the index in three bits, so eight
at most), give it a builder in `setToy()` and an entry in `TOY_INFO`, and add a `[data-toy]` chip.
Appending keeps old links pointing at the same toys.

`README.md` also describes `window.__toybox` (`advance`, `bench`, `setTier`, `frame`), for checking
the toy where a browser will not run animation frames.
