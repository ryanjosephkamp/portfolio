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

1. **Gather.** Read [FACTS.md](FACTS.md) whole, then [CONCEPTS.md](CONCEPTS.md) for the territories
   already taken, then the README of every project you will feature
   (`gh api repos/ryanjosephkamp/<repo>/readme -H "Accept: application/vnd.github.raw"`), then v1's
   `index.html` and `main.js`. Done when each project you plan to feature has a description you can
   trace to a line you read.
2. **Find the signature.** Start from what is literally true and specific about Ryan and the
   direction, and look for the thing a visitor can do with it. Build it on Splashery or another of
   the first nine projects. Done when it passes the test above
   and you have checked that it is true (v1 confirmed each anagram letter by letter).
3. **Choose the look from the signature.** One sentence of physical scene (who is looking, where,
   in what light) decides light or dark. One typeface family picked for a reason the signature
   supplies (v1: Recursive, because its axes let the letters loosen when the name becomes a joke).
   One committed color and one loud accent, unlike every territory in the registry. Done when you
   can say why each choice follows from the signature.
4. **Build the hero first**, working, before any other section. Then all ten projects from
   FACTS.md: Splashery first and largest, grooph second, the capstone last. Give Splashery, grooph
   and the two or three projects nearest the concept's direction a small live piece of art built
   in code (v1: tiles, a tile staircase, a splat blob that scatters, an animated loop graph) in
   place of a screenshot; the rest can share a plainer list, with the capstone as its last, short
   entry. Then research interests and links.
5. **Add the detail nobody asked for, and verify it exhaustively.** v1 shows the current
   arrangement's rank among all 20,160 orderings, between its alphabetical neighbors; the ranking
   was checked against a brute-force list of every permutation. Done when your detail has a check
   of the same kind and it passes.
6. **Verify in a real browser** at 1440, 820 and 375 pixels wide. Done when you have seen each
   section at each width, driven the signature by pointer and by keyboard, read an empty console,
   measured no horizontal scroll (`scrollWidth === clientWidth`), and read the reduced-motion path
   in the code.
7. **Ship.** Run `node tools/us-spelling.mjs concepts/<slug>` until it prints nothing. Commit
   (identity in [CLAUDE.md](../CLAUDE.md)), push the branch, and open a pull request to `main` that
   changes only `concepts/<slug>/`. State your registry row (direction, territory, signature) in
   its description; the operator session adds it to [CONCEPTS.md](CONCEPTS.md).

## Project-first

A portfolio page is about the work. For every project:

- Lead with what it does, then what a visitor can do with it on this page, then the links.
- Describe behavior a visitor could check for themselves: what it takes in, what it gives back,
  what is measured, what the numbers are.
- Ryan's part, where a page needs it, is one clause in the wording FACTS.md gives.
- The story of how something was built (tools, agents, prompts, pipelines) belongs to the Workshop
  concept. Everywhere else the space goes to the project.

## Claim-safe

Ryan's own word for his sites. It means:

- Every factual sentence traces to FACTS.md, a public README, or a live page.
- Interests are interests. A direction he wants to pursue is written as one, never as a result.
- Counts that change (words in a list, toys in a pack) read "about", or are left out.
- Jokes and voice are yours to write. Say in your final report which lines are invented voice.

## Build rules

- Everything inside `concepts/<slug>/`: `index.html`, styles, scripts, `assets/`. Relative URLs.
- Static files at serve time. If the signature needs a build step, commit the built output.
- Content is in the HTML and visible without JavaScript; motion and interaction enhance it.
- Self-host fonts (`assets/fonts/`, open license, variable if it earns its weight).
- Every animation has a `prefers-reduced-motion` path.

## Gotchas

- `localStorage` is shared by every project on `ryanjosephkamp.github.io`. Namespace keys
  (`<slug>:found`).
- Splashery embeds (README, "Embedding") are real and welcome, and heavy: the engine plus one
  captured toy is about 8 MB. Lazy-load them, keep few on a page, and give each a no-embed fallback.
  Many science and lab toys sit behind a labs switch (`?labs=1` on the site). Load an embed of one
  and see it work before a page relies on it.
- A toy id or a quoted title that someone else spelled differently stays as they spelled it. Put
  `us-spelling: keep` in a comment on that line so the spelling check passes over it.
- Headless Chrome renders screenshots and social cards:
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --window-size=1200,630 --virtual-time-budget=1700 --screenshot=out.png <url>`.
- The Browser pane throttles animation frames while it is hidden. A screenshot taken straight after
  a scripted scroll or a timed animation can show an earlier frame. Take two.
- Dragging on touch needs `touch-action` set on the dragged element (`pan-y` to keep page scroll,
  `none` when the drag is two-dimensional).
