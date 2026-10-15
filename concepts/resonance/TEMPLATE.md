# Resonance: make it yours

Resonance is a one-page portfolio about sound you can see. The page is a sheet of brushed metal, and
its signature is a plate you bow: drag the bow up or down the plate's edge to pick a note and saw it
to play, and the sand runs to the still lines of that note, one of the plate's 24 figures. Every
project below gets a figure and a note of its own, and a visitor can pick the plate: copper, brass,
steel, titanium or bronze, each with its own sand and tarnish.

## Quick start

1. Unzip the download and open a terminal in the folder that holds `index.html`.
2. Serve the folder with any static server, for example `python3 -m http.server 8000`.
3. Open http://localhost:8000/ in a browser.

It needs a server: `main.js` is an ES module (`<script type="module">`) that imports `plate.js` and
`take.js`, and browsers refuse to run modules from a `file://` page. There is no build step and
nothing to install. Sound starts only after the visitor's first touch, and the microphone only when
they press "Sing to it" and allow it. Add `?plate=steel` (or `brass`, `titanium`, `bronze`,
`copper`) to the address to show another plate for one visit without keeping it.

## Make it yours

Everything below is in `index.html` unless another file is named.

**Head**

- [ ] `<title>`: "Ryan Kamp · Resonance".
- [ ] `<meta name="description">`: "Ryan Kamp's work, shown as sound you can see…".
- [ ] Social card: `<meta property="og:title">` and `<meta property="og:description">`. There is no
  `og:url`, no `og:image` and no `assets/og.jpg` in this folder; add them if you want a picture
  when the link is shared.
- [ ] The first plate: `data-plate="copper"` on `<html>`. The comment above it says what else
  changes with it: `<meta name="theme-color">` (that plate's `--ground`), the word in
  `span[data-plate-word]` and the word in `span[data-sand-word]` ("pale" for bronze, "black" for the
  rest). `main.js` keeps them in step after the first paint.

**The hero (`header.hero#top`)**

- [ ] `.hero-text .stamp`: "Sound and audio-visual media".
- [ ] `h1.name#name`: "Ryan <span>Kamp</span>". The `span` puts the surname on its own line on wide
  screens. The heading's width follows the bowed note (`--wdth`, set in `frame()` in `main.js`), so
  a long name may need a smaller `font-size` on `.name` in `styles.css`.
- [ ] `.lede` and `.lede-2`: the plate sentence, Splashery, and "I'm a graduate student at the
  University of Cincinnati".
- [ ] `span.maker` on the plate: "Ryan Kamp · Cincinnati, Ohio", engraved in the lower left corner.
- [ ] `ul.how` and the controls are instructions, not personal.

**Projects**

- [ ] `section#splashery` and `section#grooph`: see the next section.
- [ ] `section#more` ("Eight more"): `ol.works` with `start="3"`, one `li.work` per project:
  reword_nerd, resmon, Link Meteor, English OpenList (`li#openlist`), Ars Magna, aqrobat, Amordle
  and the capstone (`li.work-last`, set smaller). Each holds a `button.thumb[data-ring]` with a
  `canvas[data-figure]`, a `.stamp`, an `h3`, a paragraph and `.links`.
- [ ] Each project's figure is written three times: `data-ring` and `data-figure` hold the same
  `"n,m,s"`, and the `.stamp` above the title says "Fig. N · Hz" by hand. They must agree with the
  plate's catalog. To list it, run
  `node -e "import('./plate.js').then((p) => p.catalog().forEach((f) => console.log(f.number, f.n, f.m, f.s, Math.round(f.hz))))"`
  in the folder. Figure 12 (`1,3,-1`, 654 Hz) is the one the plate settles into on first paint
  (`u: 11` in the `state` object in `main.js`), and the page gives it to its centerpiece.

**About (`section#about`)**

- [ ] `.stamp` "The maker's mark" and `h2#about-h` "Ryan Kamp".
- [ ] `.big`: research interests.
- [ ] The degrees paragraph: MS dates and concentration, thesis advisor link, BA and BS dates,
  capstone advisor link.
- [ ] `ul.tags`: CV (Google Drive), Homepage, Repositories, Blog, GitHub, LinkedIn, X, YouTube,
  Hugging Face.

**Footer and other files**

- [ ] `footer.foot`: "Ryan Kamp · Resonance. A concept site: one plate, 24 figures, ten projects."
- [ ] `README.md` describes Ryan's version. Rewrite it or delete it.
- [ ] `localStorage` keys: `resonance:plate` (the plate a visitor picked) and `resonance:muted`
  (their sound setting). If several of your sites share one origin, such as a GitHub Pages user
  site, rename the `resonance:` prefix in both places it appears: the inline `<script>` in the head
  of `index.html` and the `saved` object at the top of `main.js`.

## Parts built on Ryan's projects

**The plate model, after Splashery.** `plate.js` uses the model Splashery's Chladni plate uses (its
comment names `src/packs/studio.js` and `src/packs/chladni-sand.js` in Splashery). The code here is
complete on its own; nothing is loaded from Splashery to run it. Keep it as it is.

**Splashery (`section#splashery`).** Text, links and `.part` ("My part"), then `.ways`: four
`article.way` blocks, each describing one way Splashery shows sound, with this page's own version
beside it.

- `#way-plate` holds `#sheet` (all 24 figures, built by `main.js`, which expects it) and
  `div#real`, which loads Splashery's Chladni plate
  (`https://ryanjosephkamp.github.io/splashery/embed/?toy=chladni-plate&sound=on&turntable=off`)
  into an iframe when `#real-btn` is pressed. To drop the embed, delete `div#real` and the block at
  the end of `main.js` that starts `const realBtn` (it does not check that the button exists).
- `#way-lab` (`#spectrogram`, `#spectrum`, `#scope`, `#lab-peak`) and `#way-song` (`#landscape`,
  `#land-cap`) are screens that read this page's own sound, plus "Play it back" and "Play an example"
  buttons. They do not depend on Splashery: rewrite the paragraphs around them and keep the
  canvases. `main.js` draws into them by id (`screens`, `drawGram()`, `drawSpec()`, `drawScope()`,
  `drawLand()`, the spectrogram lines in `setPlate()`, and the `#lab-peak` and `#land-cap` lines in
  `readout()`), so removing one means removing its code too. Keep `listen()`: it also hears the
  voice for "Sing to it".
- `#way-voice` is text only.
- `.real-link` anchors open Splashery's plate and sound lab on their own pages; delete or replace.

**grooph (`section#grooph`).** `div#loop` lights four nodes (`li[data-node]`) in turn and strikes a
note for each: `LOOP` and `runLoop()` in `main.js`, started by `#loop-btn` and once, silently, when
the loop first scrolls into view. To remove it, delete the section and the grooph block in `main.js`
(`loopNodes`, `loopSay`, `LOOP`, `runLoop()`, the `#loop-btn` listener, and `loopEl` and
`loopSeen` near the end).

**Ars Magna (`li.work-art` with `#ars-thumb`).** `#ars-btn` swaps the figure's sign (+ to −): "the
plate's anagram", the same two waves put together the other way. It updates `#ars-canvas`,
`#ars-stamp` and its own label. Keep it for any project, or delete the `.art-line` paragraph and
the `arsBtn` block in `main.js`.

**Amordle (the `li.work-art` with `#bars`).** `main.js` builds one bar per word length, 2 to 35
letters, each a semitone lower than the last (`barHz()`), and `#bars-say` names the length and the
pitch. To remove it, delete `.bars-wrap` and the Amordle block in `main.js` (`bars`, `barsSay`,
`barHz`, `hitBar()` and the bar listeners).

**reword_nerd, resmon, Link Meteor, English OpenList, aqrobat, the capstone.** Text, links and a
figure each; no code depends on them beyond the shared `[data-ring]` handler.

## Third-party material in this folder

- `assets/fonts/archivo-variable-latin.woff2`: Archivo (variable: width 62 to 125, weight 100 to
  900), Latin subset, from Google Fonts. Copyright the Archivo Project Authors. License: SIL Open
  Font License 1.1, https://openfontlicense.org, as stated in `assets/fonts/README.md`. The font
  file's own metadata reads "Copyright 2020 The Archivo Project Authors
  (https://github.com/Omnibus-Type/Archivo)" and gives http://scripts.sil.org/OFL as its license
  address.

Nothing else in this folder was made by someone else. The sounds are synthesized in the browser by
`main.js`; there are no audio files.

## License

The code and text in this folder are released under the MIT License; see `LICENSE` at the root of
the repository (ryanjosephkamp/portfolio). Third-party material keeps its own license, listed above.

## Checks

Run each from the folder, or from anywhere by its full path (`package.json` sets `"type": "module"`
so Node reads the `.js` files as modules). Each prints `ok` and exits 0, or says what failed and exits 1.

- `node tools/check-figures.mjs`: counts the plate's figures by brute force (24, on 14 pitches),
  checks the catalog lists exactly those in pitch order, and checks that scattered sand rung for four
  seconds ends up on each figure's still lines.
- `node tools/check-take.mjs`: a known performance played back at six frame rates (120 down to 2
  frames a second) gives the same figures in the same order at the same times; a pause over four
  seconds starts a new take; a take holds 30 seconds.
- `node tools/check-contrast.mjs`: every plate holds text contrast (4.5 to 1 for text, 3 to 1 for
  the focus ring and the sand) for every pairing of text and ground the stylesheet uses. It reads
  each plate from a block written exactly as `:root[data-plate='name'] {` in `styles.css`, so keep
  that form when you add or change a plate.
