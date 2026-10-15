# Overprint: make it yours

Overprint is a one-page portfolio printed live in two inks on paper. One cloud of Gaussian splats
(96,000 on most machines) sits behind the page and re-forms for every section: the name, a Lorenz
attractor, a gyroid, a loop graph, an anagram, a real QR code, an ampersand and a Klein bottle. Push
the pointer through it, drag to turn it, or open the recipe card in the hero and change what it is
made from, down to writing the three expressions of a surface yourself.

## Quick start

1. Unzip the download and open a terminal in the folder that holds `index.html`.
2. Serve the folder with any static server, for example `python3 -m http.server 8000`.
3. Open http://localhost:8000/ in a browser.

It needs a server: `main.js` is loaded as an ES module (`<script type="module">`), which browsers
refuse to run from a `file://` page. It requests nothing beyond its own files, and there is no build
step. The cloud needs WebGL2. Without it, `start()` in `main.js` stops early: the page shows the
plain `h1.hero__name`, the recipe card stays hidden, and so does every element marked `.live` or
`.fig`.

## Make it yours

Everything below is in `index.html` unless another file is named.

**Head**

- [ ] `<title>`: "Ryan Kamp — splats, recipes, and forms you can turn over".
- [ ] `<meta name="description">`: names Ryan, the University of Cincinnati and his research
  interests.
- [ ] Social card: `<meta property="og:title">` ("Ryan Kamp") and `<meta property="og:description">`.
  There is no `og:url`, no `og:image` and no `assets/og.jpg` in this folder; add them if you want a
  picture when the link is shared.
- [ ] `<meta name="theme-color">` and the favicon (an inline SVG of two overlapping inks) belong to
  the look, not to Ryan.

**The name**

- [ ] `.bar__mark` in `nav.bar`: "Ryan Kamp".
- [ ] `h1.hero__name`: "Ryan Kamp". It is the page's real heading and the text shown when WebGL2 is
  missing; once the cloud runs, `.gl .hero__name` hides it visually.
- [ ] The cloud's lettering, in `main.js`: `FORMS.name.params.text` (`'RYAN KAMP'`) is what the hero
  prints first, and `enter()` prints `'RYAN KAMP'` again for the footer (`data-form="name"`). Change
  both. `word()` uppercases the text, `stacked()` puts each word on its own line when the canvas is
  under 700 px wide, and the recipe card's word field allows 14 characters (`max: 14`).

**Hero text**

- [ ] `.hero__lede .eyebrow`: "Portfolio · printed live, in two inks".
- [ ] `.lede`: Ryan's university (with a link) and research interests.

**Sections** (each `section.sec` names its form in `data-form` and its side in `data-at`)

- [ ] `section#work` and the "Recipes" section after it: Splashery (see the next section).
- [ ] The grooph, Ars Magna and aqrobat sections: see the next section.
- [ ] The "Also on the shelf" section: `ol.shelf--numbered` holds six `li` entries (reword_nerd,
  resmon, Link Meteor, English OpenList, Amordle, the capstone). Its numbers start at 05, set in two
  places: `start="5"` on the list and `counter-reset: n 4` on `.shelf--numbered` in `styles.css`.
  The eyebrow ("05–10") and the heading ("And six more") count the entries too.
- [ ] `section#research`: `ol.interests` (five research interests), the paragraph on the MS program
  (dates, concentration, thesis advisor link) and the one on earlier degrees, and two links (CV on
  Google Drive, Blog).
- [ ] Each section's `.eyebrow b` holds its number ("01" to "04"); keep them in order if you
  reorder sections.

**Footer (`footer#contact`)**

- [ ] `ul.elsewhere`: GitHub, LinkedIn, X, Hugging Face, YouTube, Blog, Homepage, CV.
- [ ] `.colophon`: "© 2026 Ryan Kamp. Set in Recursive…".
- [ ] `.colophon` also links "An earlier version of this site, in letter tiles" to `../../`, a page
  outside this folder. Delete that paragraph.

**Other files**

- [ ] `README.md` describes Ryan's version. Rewrite it or delete it.
- [ ] The last lines of `main.js` print an "OVERPRINT" banner to the browser console; edit or delete
  the `console.log`.
- [ ] No `localStorage` key is used, so there is no prefix to rename.

## Parts built on Ryan's projects

Every form is drawn by a recipe in `main.js`; none loads anything from Ryan's projects. What ties a
section to a project is its text, its links and the form named in its `data-form`. To give a section
a different form, change its `data-form` to another key of `FORMS`.

- **Splashery** (`section#work`, `data-form="lorenz"`, and the "Recipes" section, `data-form="gyroid"`):
  text, `ul.inside` (what is on Splashery's shelves), `.meta` and links. The Lorenz attractor and the
  gyroid are plain mathematics, so they suit any project; rewrite the text and the `.fig` captions.
  The Recipes section's "Write a recipe" link (`.link--up`) goes to the hero's recipe card.
- **grooph** (`data-form="loop"`): the `loop` recipe draws a builder, a critic, one loop back and a
  solid node for the person who decides. Keep it for any workflow, or swap the form.
- **Ars Magna** (`data-form="anagram"`): `enter()` in `main.js` alternates `'ANAGRAMS'` and
  `'ARS MAGNA'` every 3.6 s (both at once under reduced motion). Put two anagrams of your own in its
  `words` array, or give the section another form.
- **aqrobat** (`data-form="qr"`): a real QR code built by `qrMatrix()`, holding
  `FORMS.qr.params.text`, which is aqrobat's address. Put your own address there and update the
  figure's caption. The code is version 3 at error correction M, so the text can be 42 bytes at
  most; `qrMatrix()` throws on anything longer. Keep `sway: 0` and `whole` on this form so it stays
  square to the reader and whole on a narrow screen. Scan it with a phone after any change.
- **The "Also on the shelf" list** (`data-form="also"`, an ampersand): plain entries with outside
  links. Rewrite or delete each `li`, and fix the numbering noted above.

The recipe card (`aside#recipe`) offers the forms in `SHELF`: `name`, `lorenz`, `klein`, `gyroid`
and `yours`. None of them is tied to a project.

**A form of your own for a project.** Write a recipe function in `main.js` that takes `(n, params,
rand)`, fills `pos`, `tan` and `ink` from `blank(n)`, sets `width` and `gain`, and returns
`finish(out, stroke, flat)`. Order its splats so that any first part of them covers the whole form
(the existing recipes use the golden ratio, R2 or R3 sequences for this), because a slow machine
draws only the first half or quarter. Add it to `FORMS` with a `seed` and either `spin: true` or a
`sway`, then name its key in a section's `data-form`. To offer it in the recipe card too, give it
`label`, `recipe`, `controls` and `note`, and add its key to `SHELF`.

## Third-party material in this folder

- `assets/fonts/recursive-latin.woff2`: Recursive, a Latin subset of the variable font (axes MONO 0
  to 1, CASL 0 to 1, wght 300 to 1000, slnt −15 to 0, CRSV 0 to 1). The font file's own metadata
  reads "Copyright 2019 The Recursive Project Authors (github.com/arrowtype/recursive)". License not
  stated in this folder.

Nothing else in this folder was made by someone else. The QR encoder, the shaders and the recipes
are written for this page.

## License

The code and text in this folder are released under the MIT License; see `LICENSE` at the root of
the repository (ryanjosephkamp/portfolio). Third-party material keeps its own license, listed above.

## Checks

This folder has no test or check scripts. After a change, look at the page in a browser that has
WebGL2 and in one with it turned off (the fallback should read cleanly), turn on reduced motion in
your system settings, and scan the QR figure with a phone.
