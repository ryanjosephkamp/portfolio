# Workshop: make it yours

Workshop is a one-page portfolio laid out as five sheets on a paper drafting table. Its signature is
sheet 1: pick one of four toys and one of five loop graphs, and a scripted builder drafts the toy in
pencil from 640 Gaussian splats, a check measures it against a bar, and the graph decides where the
work stops. Sometimes it stops at the visitor, who can approve, reject with feedback, or circle a
spot in red pencil so the next revision raises a lump there.

## Quick start

1. Unzip the download and open a terminal in the folder that holds `index.html`.
2. Serve the folder with any static server, for example `python3 -m http.server 8000`.
3. Open http://localhost:8000/ in a browser.

It needs a server. `main.js` is an ES module (`<script type="module">`) that imports `kit.js` and
`harness.js`, and `boot()` in `main.js` reads the five graph documents in `graphs/` with `fetch()`.
Opened as a `file://` page, none of that loads. There is no build step and nothing to install.

Two address parameters open the sheet on a given toy and graph, for example
`?toy=saturn&graph=ralph-loop`. The toy ids are `donut`, `saturn`, `ice-cream` and `torus-knot`; the
graph ids are the file names in `graphs/` without `.grooph.json`.

## Make it yours

Everything below is plain text in `index.html` unless another file is named.

**Head**

- [ ] `<title>`: "Ryan Kamp — the workshop".
- [ ] `<meta name="description">`: names Ryan, the University of Cincinnati and Splashery.
- [ ] Social card: `<meta property="og:title">` and `<meta property="og:description">`. There is no
  `og:url`, no `og:image` and no `assets/og.jpg` in this folder; add them if you want a picture
  when the link is shared.
- [ ] `<meta name="theme-color">` and the favicon (an inline SVG data URI) are part of the look, not
  personal. Change them only if you change the palette.

**Sheet 1 (`header#top`)**

- [ ] `.rail__mark`: the initials "RK" and the word "workshop".
- [ ] `h1.hero__head`: the name, set as `.lettering`. The drawing does not use the name, so this is
  the only place it appears on sheet 1.
- [ ] `.lede`: Ryan's first-person sentence about how he builds, then the pitch for the sheet.
- [ ] `p.fine` (the last paragraph of the hero): says the builder and checks are script, and names
  Splashery, Claude Code and "the person at the gate is me".
- [ ] `dl.titleblock`: "Drawn: builder (a script)" and "Sheet 1 of 5". `main.js` fills `#tb-title`,
  `#tb-rev`, `#tb-graph`, `#tb-checked` and `#tb-approved` while the run goes.
- [ ] `table.bom tfoot`: "The check" links to `tools/verify.mjs` on Ryan's GitHub. Point it at your
  own repository.

**Sheets 2 and 3 (`#splashery`, `#grooph`)**: see "Parts built on Ryan's projects" below.

**Sheet 4 (`section#drawer`)**

- [ ] `.features`: two worked projects, `article#reword` (reword_nerd) and `article#meteor`
  (Link Meteor).
- [ ] `ul.cards`: one `li` per project (resmon, English OpenList, Ars Magna, aqrobat, Amordle), each
  an `h3`, a paragraph and a `.links` row.
- [ ] `p.capstone`: Ryan's undergraduate capstone, with its code and video links.
- [ ] The sheet titles and tags ("The drawer", "Other things I have built, filed flat", "Who drew
  this") are voice. Rename them freely.

**Sheet 5 (`footer#contact`)**

- [ ] `.prose`, first paragraph: degree, university, concentration, expected finish (May 2027),
  thesis advisor and link, earlier degrees.
- [ ] `.prose`, second paragraph: research interests.
- [ ] `.prose .links`: "Read the CV", a Google Drive link.
- [ ] `dl.titleblock--links`: GitHub, Blog, Homepage, LinkedIn, X, YouTube, Hugging Face and CV.
  Each is a `div` holding a `dt` and a `dd > a`; delete the rows you do not need.
- [ ] `p.colophon`: "© 2026 Ryan Kamp" and the credits line.

**Sheet numbers**

- [ ] Each `.sheet__no` reads "Sheet N of 5", the hero's title block reads "1 of 5", and `.rail ol`
  numbers its five links with a CSS counter. Change them together if you add or drop a sheet.

**Other files**

- [ ] `README.md` describes Ryan's version. Rewrite it or delete it.
- [ ] `assets/screenshot.png` and `assets/screenshot-saturn.png` are screenshots of this page with
  Ryan's name on it. Nothing in the folder links to them; replace or delete them.
- [ ] No `localStorage` key is used, so there is no prefix to rename.

## Parts built on Ryan's projects

**The toys, from Splashery's kit.** `OBJECTS` in `kit.js` holds four toys, each built from shapes
that Splashery's own kit has. The drawing, the check and the log are local code and need nothing
from Splashery. The one live tie is each toy's `toy` field, its id on Splashery's shelf, which
`embed()` in `main.js` puts in the player's address.

- Keep: nothing to do.
- Swap or add a toy: add an entry to `OBJECTS` (its parts, each with a shape from `kit.js`, and its
  `wrong` text for the first-draft mistake), add a radio button to `#pick-toy`, and run the checks
  below.
- Remove the Splashery player: delete `figure#embed` on sheet 2 and the `embed()` call in `boot()`.

**Sheet 2, Splashery (`section#splashery`).** Prose, a `.mine` paragraph ("My part."), three links,
the `figure#embed` player (an iframe from `ryanjosephkamp.github.io/splashery/embed/` that loads
only when `#load-embed` is pressed) and four `article.plate` blocks. Two plates have script behind
them: `#fx-art`, animated by `ripple()`, and `#kitlist`, whose links (`?toy=donut#top`) change the
toy on sheet 1 without a reload. `.drawer-labels` links to files in Splashery's repository.

- Reuse it for your own main project: keep the `.cols` and `.plates` markup and replace the text.
- Remove it: delete the section and the `embed()` and `ripple()` calls in `boot()`, and repoint the
  links to `#splashery` (the skip link, the rail and `p.fine`).

**The loop graphs, from grooph.** `graphs/*.grooph.json` are five of grooph's built-in templates,
made with `grooph template use` and filled in for this sheet. `harness.js` reads and walks them; it
needs only the JSON, not the grooph app.

- `GRAPHS` in `main.js` lists their ids, and `#pick-graph` has one radio per id.
- `#graphs-table` on sheet 3 has one `tr[data-graph]` per graph. Each row's `a[data-open]` is a long
  `https://ryanjosephkamp.github.io/grooph/#/open?d=…` link that opens the document in grooph.
  `describe()` copies the current row's link to `#graph-open` under the hero's graph, and falls
  back to grooph's home page.
- The documents' `goal` and `check.run` fields name paths as they sit in Ryan's repository
  (`concepts/workshop/tools/measure.mjs`, `concepts/workshop/graphs/PLAN.md`). The page does not
  run them. Keep the plan check's command starting with `grep`: `roleOf()` in `harness.js` uses that
  to tell a list-counting check from a test.
- Add or swap a graph: make it with grooph into `graphs/`, add its id to `GRAPHS`, a radio to
  `#pick-graph` and a row to `#graphs-table`, then run `node tools/graphs.mjs` (needs the grooph
  CLI) to write its "in grooph" link.
- Drop the links to grooph but keep the loop: delete the `a[data-open]` links and `#graph-open`, and
  remove the line in `describe()` that sets `#graph-open`.

**Sheet 3, grooph (`section#grooph`).** `#lane-graph` draws part of the lane loop Splashery keeps in
its repository, and `#erase-stop` toggles `.is-erased` on it (`stops()` in `main.js`).
`blockquote.limits` quotes grooph's README. To remove the sheet, delete the section and the
`stops()` call, and change the hero links that point at `#grooph`.

**Sheet 4 widgets.** `#stages` (reword_nerd's four stages, run by `stages()`) and `#fields` with
`#lm-next` (Link Meteor, run by `meteor()`, which shows whichever outside link in `main` or `footer`
the pointer or focus is on). Each can go with its `article.feature` and its call in `boot()`.

**Ars Magna, aqrobat, Amordle, resmon, English OpenList.** Plain cards in `ul.cards` with outside
links; no code depends on them. Rewrite or delete each `li`.

## Third-party material in this folder

- `assets/fonts/national-park-latin.woff2`: National Park (https://nationalparktypeface.com/), a
  Latin subset of the variable font (weight 200 to 800). License: SIL Open Font License, as stated
  in `README.md`. The font file's own metadata reads "Copyright 2024 The National Park Project
  Authors (https://github.com/benhoepner/National-Park)" and gives https://openfontlicense.org as
  its license address.

Nothing else in this folder was made by someone else. The graph documents come from grooph, Ryan's
own project (its Ralph loop template credits Geoffrey Huntley's ralph loop for the idea, as sheet 3
says). The Splashery player and the grooph links load from Ryan's sites when a visitor asks for
them; they are not in the folder.

## License

The code and text in this folder are released under the MIT License; see `LICENSE` at the root of
the repository (ryanjosephkamp/portfolio). Third-party material keeps its own license, listed above.

## Checks

Each runs from the folder, and also from anywhere, since it finds its files from its own path.

- `node tools/verify.mjs` checks the claims the page makes about its own drawing and graphs: the
  split by surface area for every budget from 1 to 300,000, each toy's first-draft crowding against
  its closed form, seeds 1 to 2000 against the bar, every run of every graph for every answer a
  person can give, and the revision letters. With the `grooph` CLI installed it also runs
  `grooph validate --for-export` on each graph; without it, it prints `skip` for that part. It takes
  about ten seconds and exits 1 on any failure.
- `node tools/measure.mjs` is the test command the graphs name. With no arguments it measures every
  toy at every stage of its parts list and exits 0 only if all meet the bar.
  `node tools/measure.mjs saturn 2` measures one toy's first two parts; add `--wrong` or `--floor`
  to measure a staged first draft (those fail on purpose).
- `node tools/graphs.mjs` rewrites the `a[data-open]` links in `index.html` with `grooph share`. Add
  `--check` to compare without writing. Needs the `grooph` CLI.

These ran here on Node 26. The folder has no `package.json`, so Node has to recognize `kit.js` and
`harness.js` as ES modules from their syntax; if your Node refuses them, add a `package.json`
holding `{"type":"module"}`.
