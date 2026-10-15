# Anagram Tiles: make it yours

Anagram Tiles is a one-page portfolio whose hero spells a name in letter tiles. A visitor drags the
tiles, types on them, or presses **Rearrange**, and the same letters settle into real anagrams of
the name: RYAN KAMP becomes MAY PRANK, PARK MANY, RAMP YANK and ARMY KNAP. Below the hero sit
project plates with small live drawings, research interests, writing and contact links.

## Quick start

1. Unzip. The template is `index.html`, `main.js`, `styles.css` and `assets/` (the font and the
   social card image), plus this file and `DESIGN.md`.
2. From the unzipped folder, serve it with any static file server:

   ```bash
   python3 -m http.server 8000
   ```

3. Open http://localhost:8000/.

Use a server rather than opening `index.html` from disk: `main.js` loads as an ES module
(`<script type="module">`), and most browsers block module scripts on `file://` pages. There is no
build step and nothing to install.

## Make it yours

Everything below is personal to Ryan. Paths are file names; `#id` and `.class` are selectors in
`index.html` unless a JavaScript name is given.

### The name and its anagrams (the signature)

- `main.js`, `const NAME = 'RYAN KAMP'`: the phrase the tiles open on and return to.
- `main.js`, `const ENTRIES`: every phrase the tiles know, each with a part of speech and a one-line
  gloss. The first key must equal `NAME`. Every phrase must use exactly the same letters as `NAME`;
  only the word spaces may move. A hand-made arrangement is recognized by its letters alone
  (`TileRow` builds its `known` map that way).
- Letters must be capitals A to Z. Each tile prints its letter's place in the alphabet in the corner
  (`face.dataset.n = ch.charCodeAt(0) - 64` in `makeTile`), and typing accepts only the keys a to z.
- `#pips`: one `<i>` per entry in `ENTRIES` (five now). The first carries `class="is-on"`.
- `#found-count`: the starting text, "1 of 5 found". `paintFound()` in `main.js` rewrites it, but its
  final message is fixed text: "All five. Ars Magna finds the rest." Change the count word, and the
  link if you drop Ars Magna.
- `main.js`, the end of `hero()`: the opening demo moves to `'MAY PRANK'` after 2.1 seconds and back
  to `NAME` after 5.2 seconds, unless the visitor has touched the tiles. Put one of your phrases there.
- `#name-tiles`, `#gloss-word`, `#gloss-pos`, `#gloss-def`: the text shown before JavaScript runs.
  Match them to `NAME` and its entry.
- `.hero__inventory`: the sorted letters (`A A K M N P R Y`), the starting rank in `#rank` (17,359)
  and the total, "of 20,160". `main.js` recomputes `#rank` on load (`rankOf`), but the sorted letters
  and the total are typed into the HTML. The total is the number of distinct orderings: n! divided by
  k! for each letter that appears k times. RYAN KAMP has eight letters and two A's, so 8! / 2! =
  20,160.
- `.hero__lede`: "Eight letters, currently spelling".
- `main.js`, `hero()`: the gloss for an arrangement that is not in `ENTRIES`, "Not English, as far as
  I know. Keep dragging."
- `main.js`, the `console.log` above the final calls: a message naming RYAN KAMP, MAY PRANK and PARK
  MANY.
- `main.js`, `new TileRow(root, phrases, { maxUnit: 148, stackBelow: 560, ... })`: the largest tile
  size in pixels, and the row width under which each word gets its own line. Tiles are sized from
  the row's width and the longest phrase (`measure()`), so a longer name gets smaller tiles by
  itself; `maxUnit` only caps them on wide screens.

Nothing here is precomputed. The rank and the shelf of neighboring orderings (`#shelf`, 27 of them,
yours in the middle) are worked out in the browser from `NAME`.

To confirm that your phrases share their letters, edit the list and run:

```bash
node -e "const p=['RYAN KAMP','MAY PRANK'];const k=s=>[...s.replace(/ /g,'')].sort().join('');console.log(p.every(x=>k(x)===k(p[0])))"
```

It prints `true` when every phrase uses the same letters as the first.

### Name, bio and links elsewhere on the page

- `<h1 class="sr-only">`: the name for screen readers (the tiles are `aria-hidden`).
- `.nav__mark` and `.dock__mark`: the initials "RK". The `.nav__mark` `aria-label` also names Ryan.
- `.hero__intro`: the bio sentence, with the University of Cincinnati link.
- `#research .study__prose`: program, start date, thesis advisor and link, interests, and the CV link.
- `#research .interests`: five research interests, each with a short label in `<small>`.
- `#research dl.also`: the "professionally" and "personally" lists. The `data-swap` attribute holds
  the words `swapWords()` cycles through (`software|prompt|context|loop|graph`); the text inside the
  span is what shows without JavaScript or with reduced motion.
- `#writing .posts`: two blog posts, then the "All posts" link.
- `#contact .elsewhere`: GitHub, LinkedIn, X, Hugging Face, YouTube, Blog and CV, each with a
  `<small>` handle or note.
- `#contact .colophon`: "© 2026 Ryan Kamp · Earth (for now)" and the typeface line.
- The CV link (a Google Drive URL) appears twice: in `#research` and in `#contact`.

### Head and social card

- `<title>`: "Ryan Kamp — splats, words, and tools".
- `<meta name="description">`: Ryan's program, university, interests and projects.
- `<meta name="theme-color" content="#2b45d4">`: the hero blue; change it only if you change the
  blue.
- `og:title`, `og:description` (it quotes "Eight letters, 20,160 orderings"), `og:url` and
  `og:image`. Both URLs are absolute and point at `https://ryanjosephkamp.github.io/portfolio/`;
  point them at your own address.
- `assets/og.jpg`: a 1200 × 630 screenshot of this hero showing Ryan's name. Replace it with a
  screenshot of yours at the same size. `twitter:card` is `summary_large_image`, so the same image
  is used there.
- `<link rel="icon">`: an inline SVG data URI of a white tile with the letter R on blue
  (`%3ER%3C/text%3E` inside the URI). Change the letter.

### Saved progress

- `main.js`, `hero()`: the phrases a visitor has found are saved in `localStorage` under the key
  `portfolio:found`. Rename it (for example `yourname:found`) in both the `getItem` and `setItem`
  calls. Every page on the same origin shares `localStorage`, so a generic key can collide with
  another site you host there.

## Parts built on Ryan's projects

Each project is either a plate (`<article class="plate">` under `#work`) or a row of the "Also on
the shelf" index (`.index li`). The functions that animate plates (`arsMagna()`, `splats()`) return
early when their element is missing, so you can delete a plate's HTML and leave the calls at the
bottom of `main.js` alone.

- **Splashery plate** (`.art--splash`, `canvas#splat`, `splats()` in `main.js`): a 2D canvas drawing
  of 820 soft dots that turn slowly and scatter from the pointer, then spring back. It is drawn by
  this page; nothing loads from Splashery. Keep it as art for any project, change its palette (the
  `colors` array in `splats()`), or delete the article.
- **grooph plate** (`.art--grooph`): an inline SVG loop graph (Builder, Critic, You decide) with a
  token moving along an `<animateMotion>` path. Edit the `<text>` labels, or delete the article.
- **Ars Magna plate** (`.art--ars`, `#ars-tiles`, `#ars-label`, `arsMagna()`): a second tile row that
  flips between `'ARS MAGNA'` and `'ANAGRAMS'`. To reuse it for another pair, change the `phrases`
  array in `arsMagna()` (both must use the same letters) and the fallback text in `#ars-tiles` and
  `#ars-label`. The hero's "All five" message also links to Ars Magna.
- **Amordle plate** (`.art--amordle`, `ul.stairs`): HTML and CSS only. Each `<li>` is a row (inline
  `--r`), each `<b>` a tile (inline `--i`); class `g` makes a tile lime and `y` makes it sky blue.
- **Also on the shelf** (`.index`): English OpenList (with its Hugging Face dataset link), resmon,
  Link Meteor, aqrobat, reword_nerd and the capstone, then a link to Ryan's GitHub repositories. Each
  `<li>` is an `<h4>`, a paragraph and `.links`; add, swap or delete rows freely.
- **Writing** (`.posts`): both posts are about Ryan's projects (Amordle, reword_nerd).
- **Research**: the second paragraph of `.study__prose` names Splashery.

Plates alternate sides by position (`.plate:nth-of-type(even)` puts the art on the left), so deleting
one flips the plates after it. That is expected.

If you delete a whole section (`#work`, `#research` or `#writing`), also remove its id from the list
in `dock()` in `main.js` (`['work', 'research', 'writing', 'contact']`). Otherwise
`IntersectionObserver.observe` receives `null` and throws, and `watch()`, which runs after it, never
starts the plate animations. Remove the section's links from `.nav` and `#dock` too.

## Third-party material in this folder

- `assets/fonts/recursive-latin.woff2`: Recursive, a variable font, latin subset. Source:
  https://www.recursive.design/ (named in the repository's root `README.md`). The font file's own
  name table reads "Copyright 2019 The Recursive Project Authors (github.com/arrowtype/recursive)".
  License: SIL Open Font License, as stated in the root `README.md`.

Nothing else in the template was made by someone else. The drawings are code in `index.html`,
`styles.css` and `main.js`, and `assets/og.jpg` is a screenshot of this page.

## License

The code and the text are released under the MIT License; see `LICENSE` at the root of the
ryanjosephkamp/portfolio repository. Third-party material keeps its own license, listed above.

## Checks

No test or check script ships with this template. Before you publish, serve the page and drive the
signature by hand: drag a tile into a new slot, type one of your phrases, press **Rearrange** until
every pip is lit, reload to see the pips come back from `localStorage`, and check that the total in
`.hero__inventory` matches your letters.
