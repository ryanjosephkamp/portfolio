# Workshop

A concept portfolio for Ryan Kamp as a software engineering researcher, with
[Splashery](https://ryanjosephkamp.github.io/splashery/) as the centerpiece. One page, static files,
no build step, no dependencies.

**The signature.** The hero is a drafting sheet. A builder drafts a donut out of 640 Gaussian
splats, each drawn as one pencil ellipse; a critic measures it against a bar; the loop stops for a
person, and the visitor is that person. Drag to turn the drawing, tap it to leave a red-pencil note
(the next revision raises a lump there), then send it back or stamp it approved. Every step is typed
into the build log.

## Run it

```bash
python3 -m http.server 4177
```

## Files

| File | What it holds |
|---|---|
| `index.html` | All of the content. |
| `styles.css` | Tokens at the top, then one block per sheet. |
| `kit.js` | The toy kit: areas, the budget split, the samplers, the critic's measure. Pure functions. |
| `main.js` | The pencil renderer, the loop, and the small pieces on the other sheets. |
| `tools/verify.mjs` | Checks the claims the page makes about its own drawing. |
| `assets/fonts/` | [National Park](https://nationalparktypeface.com/), latin subset (SIL Open Font License). |

## What is checked

`node tools/verify.mjs` runs the page's own kit code and confirms:

- the budget split by surface area sums to the budget exactly, with no part more than one splat
  from its exact share, for every budget from 1 to 300,000;
- uniform angles crowd the inside of a torus by (πR + 2r) / (πR − 2r), about 1.73 here, and the
  critic's measured figure matches it;
- for seeds 1 to 2000, every by-area draft meets the bar and every even-split draft fails it, so
  the log never says otherwise;
- revision letters run A to Z, then AA.

## Invented for this page

The donut loop is a staged demonstration: the builder and critic are script, and the first drafts
of revisions A and B are wrong on purpose. The page says so under the drawing. Sheet titles and
captions ("The drawer", "Who drew this", "filed flat") are voice. Everything stated about Ryan,
Splashery, grooph and the other projects traces to `docs/FACTS.md`, a public README, Splashery's
`AGENTS.md` and `docs/lane-loop.grooph.json`, or v1 of this site.
