# Concept portfolio playbook

How v1 (the anagram-tile site at the repo root) was made, as a process to repeat for a new concept.
A concept site is one page that presents Ryan through one research direction.

## The signature

Every concept site has one **signature**: an interaction in the hero that _is_ the subject, that a
visitor can play with inside five seconds.

v1's signature: the name RYAN KAMP as letter tiles that rearrange, by drag, by typing or by button,
into its real anagrams (MAY PRANK, PARK MANY, RAMP YANK, ARMY KNAP). It fits because Ryan builds
word tools, one of which finds anagrams.

The test: say the site in one sentence a friend would repeat. If the sentence would fit someone
else's portfolio, it is a decoration, and the signature is still missing.

The rest of the page borrows the signature's material. In v1 the tiles return in the Ars Magna
plate, the contact links are tiles, and the dictionary-gloss voice of the hero names every section.

## Steps

1. **Gather.** Read [FACTS.md](FACTS.md) whole, then the README of every project you will feature
   (`gh api repos/ryanjosephkamp/<repo>/readme -H "Accept: application/vnd.github.raw"`), then v1's
   `index.html` and `main.js`. Done when each project you plan to feature has a description you can
   trace to a line you read.
2. **Find the signature.** Start from what is literally true and specific about Ryan and the
   direction, and look for the thing a visitor can do with it. Done when it passes the test above
   and you have checked that it is true (v1 confirmed each anagram letter by letter).
3. **Choose the look from the signature.** One sentence of physical scene (who is looking, where,
   in what light) decides light or dark. One typeface family picked for a reason the signature
   supplies (v1: Recursive, because its axes let the letters loosen when the name becomes a joke).
   One committed colour and one loud accent. Done when you can say why each choice follows from the
   signature.
4. **Build the hero first**, working, before any other section. Then the projects, each with a
   small live piece of art built for it in code (v1: tiles, a tile staircase, a splat blob that
   scatters, an animated loop graph) in place of a screenshot. Then research, writing, contact.
5. **Add the detail nobody asked for, and verify it exhaustively.** v1 shows the current
   arrangement's rank among all 20,160 orderings, between its alphabetical neighbours; the ranking
   was checked against a brute-force list of every permutation. Done when your detail has a check
   of the same kind and it passes.
6. **Verify in a real browser** at 1440, 820 and 375 pixels wide. Done when you have seen each
   section at each width, driven the signature by pointer and by keyboard, read an empty console,
   measured no horizontal scroll (`scrollWidth === clientWidth`), and read the reduced-motion path
   in the code.
7. **Ship.** Commit (identity in [CLAUDE.md](../CLAUDE.md)), push the branch, open a pull request
   to `main`.

## Claim-safe

Ryan's own word for his sites. It means:

- Every factual sentence traces to FACTS.md, a public README, or a live page.
- His contributions are stated in his CV's own verbs, quoted in FACTS.md.
- Interests are interests. A direction he wants to pursue is written as one, never as a result.
- Counts that change (words in a list, toys in a pack) read "about", or are left out.
- Jokes and voice are yours to write. Say in your final report which lines are invented voice.

## Build rules

- Everything inside `concepts/<slug>/`: `index.html`, styles, scripts, `assets/`. Relative URLs.
- Static files at serve time. If the signature needs a build step, commit the built output.
- Content is in the HTML and visible without JavaScript; motion and interaction enhance it.
- Self-host fonts (`assets/fonts/`, open licence, variable if it earns its weight).
- Every animation has a `prefers-reduced-motion` path.

## Gotchas

- `localStorage` is shared by every project on `ryanjosephkamp.github.io`. Namespace keys
  (`<slug>:found`).
- Splashery embeds (README, "Embedding") are real and welcome, and heavy: the engine plus one
  captured toy is about 8 MB. Lazy-load them, keep few on a page, and give each a no-embed fallback.
- Headless Chrome renders screenshots and social cards:
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --window-size=1200,630 --virtual-time-budget=1700 --screenshot=out.png <url>`.
- A screenshot taken straight after a scripted scroll can show the previous frame. Take two.
- Dragging on touch needs `touch-action` set on the dragged element (`pan-y` to keep page scroll,
  `none` when the drag is two-dimensional).
