# Arcade: make it yours

Arcade is a one-page portfolio set on a vector arcade monitor: mint phosphor lines on black glass,
one hot red ball. Its signature is a brick-breaker whose wall is the owner's name, drawn in 32
strokes; every stroke the ball touches breaks off and falls. Three rule switches make eight rule
sets, each with a house score to beat, and a 2D/3D switch tips the board back without changing the
rules.

It is static files and ES modules, with no build step.

## Quick start

1. Unzip the download. You get an `arcade/` folder.
2. Serve that folder with any static server, for example:

   ```bash
   cd arcade
   python3 -m http.server 8000
   ```

3. Open http://localhost:8000/.

It needs a server. `main.js` is an ES module that imports `game.js` and `amordle.js`, and the
Amordle round fetches its words from `assets/words/<length>.txt`. Opened from disk (`file://`),
browsers block both, and the monitor stays dark.

## Make it yours

Text is in `index.html` unless a line says otherwise.

- [ ] **Page title:** `<title>Ryan Kamp — games, rules, and a wall of 32 strokes</title>`.
- [ ] **Meta description:** `<meta name="description">`.
- [ ] **Social card:** `og:title` ("Ryan Kamp: play with the rules"), `og:description` and
      `og:type`. There is no `og:url` and no `og:image`; add both (the image as an absolute URL) if
      you want a card with a picture. `assets/screenshot.png` and `assets/screenshot-3d.png` (1440 ×
      900 each) are pictures of this page with Ryan's name; no file references them. Replace them
      or delete them.
- [ ] **Favicon:** the `<link rel="icon">` is an inline SVG that draws "RK" in strokes. Redraw its
      path for your initials.
- [ ] **Theme color:** `<meta name="theme-color" content="#040706">` matches `--glass`.
- [ ] **The wall (the name as the game):** `ROWS = ["RYAN", "KAMP"]` in `game.js`. Each letter is
      a few strokes from the stroke font `GLYPHS` (A to Z, 0 to 9, and `- / . : ! > + ?`); anything
      else draws nothing. `wall()` lays each row out as four letters (`CELL.w` 16 and `CELL.gap` 6
      fill 82 of the field's 100 units), so:
  - rows of up to four letters fit as they are (a shorter row sits left of center unless you
    change `x0` in `wall()` to use each row's own length);
  - for five or more letters a row, make `CELL.w` and `CELL.gap` smaller and update `x0`.
- [ ] **After changing the wall, fix the numbers.** Run `node check.mjs`. It counts the strokes and
      replays the house on all eight rule sets. Then:
  - put the new stroke count in `.panel__how` (`<b>32 strokes</b>`) and in the `<title>`;
  - put each new house score in `HOUSE` in `game.js`, in `data-house` and the House cell of each
    `tr` in `table#scores`, and set the starting text of `#hud-house` to the score for set B0F
    (`HOUSE[0]`);
  - run the check again until every line says PASS. If the house cannot clear your name on some
    rule set, try another `HOUSE_SEED` or a shorter name.
- [ ] **The name elsewhere:** `h1[data-vec]` (drawn in strokes by `main.js`), `.monitor__still`
      (`RYAN<br>KAMP`, shown only without scripts), the `#monitor` `aria-label`, and `.nav__mark`
      ("RK", with `aria-label="Ryan Kamp, top of page"`).
- [ ] **Bio and university:** `.panel__lede` (first person: master's student in computer science
      at the University of Cincinnati, with a link to uc.edu). Keep `.panel__how` and the `.rule`
      descriptions unless you change the game.
- [ ] **The score tables' words:** `.tables__text`. Keep them while the eight tables stay.
- [ ] **Navigation and skip link:** `nav.nav ul` links to `#splashery`, `#grooph`, `#amordle`,
      `#floor` ("More"), `#player` ("Research") and `#links`; `.skip` points at `#splashery`.
- [ ] **Projects:** each `section.section` is a cabinet: `.head` (`.head__no` such as "Cabinet 01",
      an `h2[data-vec]`, and `.head__tag`), the text, and `.links`. `#splashery` (with `.lead`,
      `.lead__part` for Ryan's role, `dl.specs` and the shelf), `#grooph`, `#amordle` and
      `#ars-magna` each have a plate, covered below. `#floor` lists the rest in `ol.board` (English
      OpenList, aqrobat, reword_nerd, resmon, Link Meteor, and the capstone), each with a
      three-letter `.board__tag`.
- [ ] **Stroke headings:** every `[data-vec]` heading is redrawn in the stroke font, with the text
      kept for screen readers in `.sr-only`. Keep heading text to the characters in `GLYPHS`.
- [ ] **Research and education:** `#player`: two paragraphs (degrees, dates, thesis advisor link,
      research interests), the CV link, and `ul.stats` (one row per interest; the first prints in
      red).
- [ ] **Links:** `ul.slots` in `footer#links` (GitHub, LinkedIn, X, YouTube, Hugging Face, blog,
      repositories, homepage, CV), each with a `small` note.
- [ ] **Colophon:** `.colophon` ("© 2026 Ryan Kamp · Cincinnati, Ohio", and the credits line).
- [ ] **Stored data:** each rule set's best score is kept in `localStorage` under `arcade:best`
      (`KEY` in `main.js`). Rename it if another page on your domain uses that key.
- [ ] **Console hooks:** `main.js` sets `window.arcade` and `window.amordle` for checking the page
      from a console. Keep or delete them; nothing else uses them.

## Parts built on Ryan's projects

Each plate below the cabinet has one block in `main.js`, headed by a dashed comment line that ends
in its name (`the shelf`, `grooph's loop`, `Amordle's round`, `Ars Magna's letters`). The block
looks its elements up when the page loads and stops at one that is missing, so delete a plate's
markup and its block together.

### Splashery's arcade shelf

`#shelf` lists twelve games from Splashery's arcade shelf (`li.game`, each with a small SVG, an
`h4`, a description, and a `.v2` and a `.v3` line for its 2D and 3D views). The `.seg` buttons
switch every card between them. The View switch on the cabinet follows the same idea, but it is
this page's own code (`proj()` in `main.js`). To remove the shelf, delete `div.shelf` and the shelf
block; the rest of the `#splashery` section is text.

### grooph's loop

`#loop` is a loop graph (build, check, you) whose token runs laps; the Stop switch
(`#loop-nostop`) shows what grooph's check catches. Replace it with a plate for your own project,
or delete `div.plate#loop` and its block.

### Amordle's round

`#amo` plays one round in Amordle's rules, as Amordle's How to play page and README state them:
OG (one puzzle, six guesses) or GO (a chain of five puzzles with 6, 5, 4, 3 and 2 guesses, each
solved answer laid on the next board), with or without Hard Mode, at any length from 2 to 35. The
rules are in `amordle.js`; the ranked-play pools (ten clocks by two modes by Hard Mode, 40 in all)
are drawn by the same block.

- **The words:** `assets/words/2.txt` to `35.txt`. Line 1 of each file is the answers a round can
  deal, separated by spaces; line 2 starts with `us-spelling: keep | ` (a marker for the portfolio
  repository's spelling check) and then lists the rest of the words a round accepts. To use your
  own list, keep that format: lowercase a to z, exactly the file's length, no word twice, and at
  least five answers per file. `check.mjs` also expects the counts of this release at lengths 2 to
  5 (`EXPECT`); change them to yours.
- **To remove it:** delete `section#amordle`, the Amordle block and the `import` of `amordle.js` in
  `main.js`, `amordle.js`, and `assets/words/`. In `check.mjs`, delete the `amordle.js` import and
  section 6. The Amordle paragraph and `.tables__text` both mention the eight tables; edit them if
  you keep one without the other.

### Ars Magna's letters

`#ars` draws the letters of ARS MAGNA in the stroke font and rearranges them into ANAGRAMS when
`#ars-go` is pressed. The order lives in `letters`, `from` and `to` in its block. Swap in another
pair of words with the same letters, or delete `div.plate#ars` and the block.

### English OpenList, and the other entries

English OpenList is the source of the Amordle words, and the page names it in the note under the
round (`.amo__note`), in `ol.board`, and in the colophon's credits line. The `ol.board` entries
are text and links only.

## Third-party material in this folder

- `assets/fonts/martian-mono-latin.woff2`: Martian Mono, latin subset, weight axis 100 to 800. The
  colophon names the typeface, but no README, comment or license file in this folder states its
  license. The font file's own metadata reads "Copyright 2020 The Martian Mono Project Authors
  (https://github.com/evilmartians/mono)" and gives the license URL https://scripts.sil.org/OFL
  (the SIL Open Font License).
- `assets/words/2.txt` to `assets/words/35.txt`: a slice of English OpenList
  (https://huggingface.co/datasets/ryanjosephkamp/english-openlist), from its per-length word files
  of the release dated September 24, 2026. Ryan made it, so it is not third-party, but it carries
  its own license: the MIT License, "Copyright (c) Ryan Kamp", in full in
  `assets/words/LICENSE.txt`. Keep that file with the word files. Words keep the spellings English
  OpenList gives them.

The shelf's descriptions mention NASA's public-domain asteroid models and elevation maps. Those are
in Splashery, not in this folder.

## License

The code and text in this folder are released under the MIT License; see `LICENSE` at the root of
the portfolio repository (https://github.com/ryanjosephkamp/portfolio). The third-party material
listed above keeps its own license.

## Checks

`node check.mjs` (run from this folder; it needs Node.js and nothing else) checks every number the
page states about its own cabinet. It prints one PASS or FAIL line per check and exits 1 on a
failure, in about two seconds:

- the wall's stroke count, and that the page says it;
- for each of the eight rule sets, that the house clears the name, that the same seed replays to
  the same game, and that its score matches both `HOUSE` and the table's `data-house`;
- that 2,000 more house games (250 seeds on each rule set) all end;
- that ARS MAGNA and ANAGRAMS are the same letters;
- Amordle's scoring against its help page's examples, repeated letters, Hard Mode, the guess
  budgets, a full OG round and a full GO chain;
- the word files: 2 to 35 letters, well formed, with enough answers for a GO chain at every length.
