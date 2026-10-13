# Workshop

A concept portfolio for Ryan Kamp as a software engineering researcher, with
[Splashery](https://ryanjosephkamp.github.io/splashery/) as the centerpiece and
[grooph](https://ryanjosephkamp.github.io/grooph/) beside it. One page, static files, no build
step, no dependencies.

**The signature.** The hero is a drafting sheet. Pick a toy from Splashery's kit and a loop graph
from grooph. A builder drafts the toy out of 640 Gaussian splats, each drawn as one pencil ellipse;
a check measures it against a bar; and the graph says where the work stops, which is sometimes at
the visitor. Drag to turn the drawing, tap it to leave a red-pencil note (the next revision raises
a lump there), and answer the graph's gates: approve, or reject with feedback. Every step is typed
into the build log.

## Run it

```bash
python3 -m http.server 4177
```

`?toy=saturn&graph=ralph-loop` opens the sheet on a given toy and graph.

## The toys

Each is on Splashery's shelf, and is drawn here from shapes its kit (`src/kit.js` there) has. The
budget is shared between the parts the way that kit shares it: by surface area.

| Toy | Parts | The builder's first-draft mistake, and its closed form |
|---|---|---|
| Donut | `torus`, a `param` band, 26 of `cylinder` | uniform angles crowd the hole: (πR + 2r) / (πR − 2r) |
| Saturn | `sphere`, two of `disc` | uniform latitude crowds the poles: 1 + √2 |
| Ice cream | `cone`, two of `sphere` | uniform height crowds the tip: 3 |
| Torus knot | `tube` along a trefoil | uniform steps in the curve's parameter crowd the inner turns: a ratio of arc lengths |

The second part of each toy is first drafted with every share of the budget rounded down, which
loses exactly one splat.

## The loop graphs

`graphs/*.grooph.json` are five of grooph's built-in templates (review-gate, grind-loop,
metric-sandwich, spec-then-loop, ralph-loop) made with `grooph template use`, with only their slots
filled in. `grooph validate --for-export` finds no errors in any of them. The test command they
name, `tools/measure.mjs`, and the checklist, `graphs/CHECKLIST.md`, are real.

The page does not ship a picture of each graph. `harness.js` reads the document, `main.js` draws it,
and the same harness walks it: it follows the edges, counts rounds and dispatches as grooph's
`docs/graph-ir.md` describes, and halts at the stops the document names. It does not time minutes or
judge diminishing returns. In the review gate a visitor can make the round cap fire.

## Files

| File | What it holds |
|---|---|
| `index.html` | All of the content. |
| `styles.css` | Tokens at the top, then one block per sheet. |
| `kit.js` | The toy kit: shapes, areas, the budget split, the four toys, the critic's measure. Pure functions. |
| `harness.js` | The toy harness for grooph documents, and the scripted builder, planner and checks. Pure functions. |
| `main.js` | The pencil renderer, the graph drawing, the loop, and the small pieces on the other sheets. |
| `graphs/` | The five graph documents, the checklist and the plan file they name. |
| `tools/verify.mjs` | Checks the claims the page makes about its own drawing and graphs. |
| `tools/measure.mjs` | The test command the graphs name: measures a draft and exits 0 if it meets the bar. |
| `tools/graphs.mjs` | Refreshes the "in grooph" links in `index.html` with `grooph share`. |
| `assets/fonts/` | [National Park](https://nationalparktypeface.com/), latin subset (SIL Open Font License). |

To add a toy, add an entry to `OBJECTS` in `kit.js`, a radio button to `#pick-toy` in `index.html`,
and run the two tools. To add a graph, make it with grooph into `graphs/`, add its id to `GRAPHS` in
`main.js`, a radio button to `#pick-graph`, a row to the table on sheet 3, and run
`node tools/graphs.mjs`.

## What is checked

`node tools/verify.mjs` runs the page's own code and confirms:

- for every toy and every budget from 1 to 300,000, the split by surface area sums to the budget
  exactly, with no part more than one splat from its exact share;
- each toy's first-draft mistake crowds its surface by the closed-form figure, and the critic's
  measured figure matches it;
- for seeds 1 to 2000, every by-area draft meets the bar and every by-parameter draft fails it, and
  rounding two shares down loses exactly one splat, so the log never says otherwise;
- grooph accepts each graph document (when the `grooph` CLI is installed), and every loop names a
  stop;
- for every graph, every toy and every answer a person can give at a gate, a run ends at Done, at a
  round cap, or at a person's no;
- revision letters run A to Z, then AA.

## Invented for this page

The loop is a staged demonstration: the builder, the planner and the checks are script, and the
builder's first drafts of the first two parts are wrong on purpose. The page says so under the
drawing. Sheet titles and captions ("The drawer", "Who drew this", "filed flat") are voice.
Everything stated about Ryan, Splashery, grooph and the other projects traces to `docs/FACTS.md`, a
public README, Splashery's `AGENTS.md`, `src/kit.js` and `docs/lane-loop.grooph.json`, or grooph's
templates and `docs/graph-ir.md`.
