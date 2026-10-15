# Slice: make it yours

Slice is a one-page portfolio set on a radiology light box: blue-black films clipped to a lit
white wall, marked with one fuchsia wax pencil. Its signature is a viewer with two real CT scans,
a walnut and a young gar's head. Move across any of the three cuts and the other two follow, turn
the fourth picture (the scan as a solid with one corner carved away), and drag the window on the
histogram.

It is static files with no dependencies and no build step.

## Quick start

1. Unzip the download. You get a `slice/` folder.
2. Serve that folder with any static server, for example:

   ```bash
   cd slice
   python3 -m http.server 8000
   ```

3. Open http://localhost:8000/.

It needs a server. `main.js` is an ES module, and the page reads every picture from the pixels of
`assets/walnut-sheet.png` through a canvas. Opened from disk (`file://`), browsers block both, and
the films stay blank. The gar's sheet is fetched only when its label is pressed.

`README.md` in this folder still says to serve from the portfolio repository's root on port 4184.
For the template, serve the `slice/` folder itself as above.

## Make it yours

Everything personal is in `index.html` unless a line says otherwise.

- [ ] **Page title:** `<title>Ryan Kamp · Slice</title>`.
- [ ] **Meta description:** `<meta name="description">`.
- [ ] **Social card:** `og:title`, `og:description` and `og:image` (`assets/og.jpg`, 1200 × 630, a
      picture of this page with Ryan's name on it). There is no `og:url`; add one with your
      address, and make `og:image` an absolute URL, since most sites that read the card need one.
- [ ] **Theme color:** `<meta name="theme-color" content="#eef4f6">` is close to `--wall`; keep
      it unless you change the wall.
- [ ] **The name:** `h1#name` ("Ryan Kamp"). The light box does not draw the name: it is plain
      text above the film, and nothing in the scripts reads it.
- [ ] **The line under the name:** `.lede` (`builds ways to <mark>see inside things</mark>.`).
- [ ] **The exam label:** `.exam .tag` ("Exam: one walnut, one gar, X-ray CT").
- [ ] **Bio and university:** the first paragraph in `.what` (graduate student in computer science
      at the University of Cincinnati, degrees in neuroscience and mathematics, and the link to
      `#splashery`). Keep `.how` unless you change how the viewer works.
- [ ] **The rail:** `.rail-text` ("Light box 1") and the four links in `.rail nav`, which point at
      `#splashery`, `#findings`, `#impression` and `#follow-up`.
- [ ] **Skip link:** `.skip` points at `#findings`.
- [ ] **Featured project:** the `#splashery` section. `.series-head` holds the tag ("Series 1 · 2026
      to present"), `h2#splashery-h`, the description in `.big`, the buttons in `.links`, and Ryan's
      role in `.part`. The films below it are covered under "Parts built on Ryan's projects."
- [ ] **Other projects:** the `#findings` section. `article.film-grooph` is project 2. Each
      `article.film` in `.wall-small` is one more (Link Meteor, Ars Magna, reword_nerd, resmon,
      English OpenList as `#openlist`, aqrobat, Amordle, and the capstone as `.film-last`). Each has
      a `p.burn` label (its number and dates), an `h3`, a description and a `.links` row. No script
      reads these, so add, remove or reorder them freely.
- [ ] **Anagrams of the name:** `ul.recut` in the Ars Magna film lists RYAN KAMP cut four other
      ways. Write your own name's anagrams there, or delete the list with the film.
- [ ] **Research interests:** `ol.interests` in `#impression`. The first item wraps its words in
      `<mark>`.
- [ ] **Education:** `dl.history` (degrees, dates, and advisor links) and the `.aside` line.
- [ ] **Links:** `ul.stickers` in `#follow-up` (CV on Google Drive, homepage, repositories, blog,
      GitHub, LinkedIn, X, YouTube, Hugging Face).
- [ ] **Footer:** the last line of `.foot` ("Ryan Kamp · Cincinnati, Ohio · Switch the box off when
      you leave."). Keep the two credit paragraphs above it for as long as the scans stay.
- [ ] **Pictures of this page:** `assets/og.jpg` and `assets/screenshot.png` (1440 × 1000) show
      Ryan's name. Replace both with pictures of your page, or delete `screenshot.png`, which no
      file references.
- [ ] **README.md:** it describes this page as Ryan's portfolio. Rewrite it or delete it.
- [ ] **Stored data:** none. Slice keeps nothing in `localStorage`.

## Parts built on Ryan's projects

### The two scans (from Splashery)

The walnut and the gar are the samples in the volume viewer of Splashery, Ryan's Gaussian splat
playground, copied voxel for voxel from Splashery's files. They live in `SCANS` in `volume.js`, in
`assets/walnut-sheet.png` and `assets/gar-sheet.png`, in the label buttons (`[data-scan]`), in the
captions (`[data-credit]`) and in the credits in `.foot`.

- **Keep them:** keep both credit paragraphs in `.foot`. Both scans are CC BY 4.0 and need them.
- **Remove the gar:** delete `SCANS.gar` in `volume.js`, the `data-scan="gar"` button, the
  `data-credit="gar"` caption, the gar's paragraph in `.foot`, and `assets/gar-sheet.png`.
- **Add or swap in a scan of your own:** follow "To add a scan" in `README.md`. In short: it must
  be a real scan under a license that allows it; write it as a contact sheet with
  `tools/build-sheet.mjs` (it reads Splashery's two formats, so add a reader for yours); add a
  `SCANS` entry (`nx`, `ny`, `nz`, `cols`, `mm`, `air`, `dense`, `top`, `viewW`, `sheet`, `start`,
  `turn`, `bar`, `parts`, `real` and the rest, as the two entries show); add a `[data-scan]` button,
  a `[data-credit]` caption and a footer credit.
- **Replacing the walnut as the first scan** takes more than a `SCANS` entry. The walnut is
  hard-coded in `main.js` (`load('walnut')` at the end, `id !== 'walnut'` in `load()`, and
  `realScan = SCANS.walnut`) and in `index.html` (`img#sheet-data`, the image in `#sheet`, the
  starting text of `#burn-title` and `#burn-pos`, and the voxel and slice counts in the captions).

### The window presets and the warm colors

`presets()` in `volume.js` names the three windows as Splashery's viewer names them (Full range,
Soft tissue, Bone), and each scan's `air`, `dense` and `top` are the levels that viewer computes
(Otsu's method on the histogram; the 99.9th percentile). `STOPS` in `main.js`, behind the "Bone and
tissue colors" button (`#colors`), is Splashery's "Bone and tissue" transfer function. For a scan
of your own, set `air`, `dense` and `top` from its own histogram.

### "The real thing" (section D, a Splashery embed)

`article.film-real` loads Splashery's own embed player in an iframe, only when `#real-load` is
pressed. The address comes from `SPLASHERY` and `embedUrl()` in `volume.js` and each scan's `real`
field: the walnut opens the `walnut-ct` toy, and the gar opens the `volume-viewer` toy through a
scene link (`#s=j.` and the scene as base64url JSON).

- **Remove it:** delete `article.film-real` from `index.html` and the `showReal(s);` line in
  `use()` in `main.js`. You can then delete `showReal()`, `loadReal()` and the `real` fields.

### The Splashery section's films

Films A, B and C describe Splashery's volume viewer, its CT toys and its anatomy atlas. Two of the
pieces in them are this page's own and work on any scan in `SCANS`:

| Markup | Code that reads it |
|---|---|
| `#sheet` (the contact sheet and its `#ring`) | `use()` (from `sheetSize(s)` to `#sheet-count`), the ring lines in `draw()`, and the "contact sheet" click handler in `main.js` |
| `#ct` (shadows, rebuilt slice, `#views`) | the "How a CT sees" block in `main.js`, the `sizeCT()` call in `use()`, and the `drawCT()` line in `draw()` |
| `#layers` (four films to peel) | the `layers` block in `main.js`; it does nothing if the list is gone |

Rewrite the words for your own project. If you delete `#sheet` or `#ct`, delete the code in the
right-hand column too, or `main.js` stops at the missing element.

### grooph, Ars Magna, English OpenList, Amordle and the rest

The films in `#findings` are text and links. `svg.loop` in the grooph film is drawn in markup (its
dot moves by SVG `animateMotion`), and `ul.recut` holds anagrams of the name. Replace or remove
them as in "Make it yours."

## Third-party material in this folder

- `assets/walnut-sheet.png`: Walnut 1 from *Cone-Beam X-Ray CT Data Collection Designed for Machine
  Learning* by Henri Der Sarkissian, Felix Lucka, Maureen van Eijnatten, Giulia Colacicco, Sophia
  Bethany Coban and K. Joost Batenburg (CWI), https://doi.org/10.5281/zenodo.2686726, CC BY 4.0.
  Changed: averaged to 0.3 mm voxels and stored as 8-bit densities, as Splashery ships it, then
  laid out as a contact sheet.
- `assets/gar-sheet.png`: the 12.8 mm larva from *MicroCT images of 3 early gar (Lepisosteus
  osseus) stages between 12.7mm and 21.7mm* by Brian Metscher (University of Vienna),
  https://doi.org/10.5281/zenodo.19021581, CC BY 4.0. Changed: averaged to 17.7 µm voxels, cropped
  to the fish with a margin, and the faint noise of the empty background set to 0, as Splashery
  ships it, then laid out as a contact sheet.
- `assets/og.jpg` and `assets/screenshot.png`: pictures of this page. They show renderings of the
  walnut scan above (CC BY 4.0, same credit).
- `assets/fonts/atkinson-hyperlegible-next-latin.woff2` and
  `assets/fonts/atkinson-hyperlegible-mono-latin.woff2`: Atkinson Hyperlegible Next and Atkinson
  Hyperlegible Mono, variable, latin subset, under the SIL Open Font License (`README.md`, which
  links https://www.brailleinstitute.org/freefont/). The files name their authors as "The Atkinson
  Hyperlegible Next Project Authors" and "The Atkinson Hyperlegible Mono Project Authors"
  (copyright 2020-2024).

Both scans are CC BY 4.0: keep their credits on the page (the two paragraphs in `.foot`) wherever
you publish it.

## License

The code and text in this folder are released under the MIT License; see `LICENSE` at the root of
the portfolio repository (https://github.com/ryanjosephkamp/portfolio). The third-party material
listed above keeps its own license.

## Checks

- `node verify.mjs` (run from this folder) checks the claims the page makes, for every scan in
  `SCANS`: the window readout under the histogram for all 32,640 windows, every pixel of every cut,
  the maximum-intensity picture, the cutaway against a slow ray march, and the back-projection toy.
  It takes about a minute and a half; `node verify.mjs --quick` takes a few seconds. It prints
  `ok` at the end, or one `FAIL` line and exits 1.
- `node verify.mjs --walnut <walnut.vol.gz> --gar <gar.nii.gz>` also checks every voxel of each
  contact sheet against Splashery's source file.
- `node tools/build-sheet.mjs <walnut|gar> <file>` rebuilds a contact sheet. `verify.mjs` reads a
  sheet only as an 8-bit gray PNG with unfiltered rows, which is what this tool writes, and fails
  on a sheet that has filtered rows, such as one saved again by an image editor.

Both need Node.js and nothing else.
