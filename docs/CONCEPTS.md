# Concept registry

Every concept site: what it is built on, the look it has claimed, and where it lives. A new concept
takes a direction and a territory that no row here has. The operator session keeps this file: a
concept's pull request changes only its own folder and states its row in its description.

## Built

| Slug | Direction | Territory | Signature | Branch | Port |
| --- | --- | --- | --- | --- | --- |
| `v1` (repo root) | Words and tools | Drenched blue, white tiles, one lime accent | His name as letter tiles that rearrange into its real anagrams | `main` (merged) | 4173 |
| `one-splat` | Computer graphics | A dark instrument; the only color is orange light | His name drawn with Gaussian splats, on a dial from 1 to 16,384 | `main` (merged October 14, 2026) | 4174 |
| `specimen` | Scientific visualization | A daylight lab bench and a microscope slide | A neuron of 32,768 splats that you focus, label, stain and fire | `main` (merged October 14, 2026) | 4175 |
| `toybox` | Digital media | A loud, saturated toy shop | His name as a splat toy to spin, poke, paint and drop | `main` (merged October 14, 2026) | 4176 |
| `workshop` | Software engineering | A paper drafting table, graphite and one red pencil | A drafting sheet: pick one of four toys from Splashery's kit and one of five loop graphs from grooph, and the build stops where the graph says, sometimes at the visitor | `main` (merged October 14, 2026) | 4177 |
| `overprint` | Media arts | A two-ink print on paper, slightly off register | One cloud of splats that re-forms for every section | `main` (merged October 14, 2026) | 4178 |
| `molecule` | Molecular visualization | A chemistry lecture hall: slate blackboard, chalk, CPK colors for the atoms | A chalk caffeine molecule you turn in your hand and measure, atom to atom | `main` (merged October 14, 2026) | 4181 |
| `resonance` | Sound and audio-visual media | Drenched copper, black sand, a violin bow, one patina-blue accent; the visitor can pick another plate (brass, steel, titanium or bronze), each with its own sand and tarnish | A plate you bow: sand runs to the still lines of the note, one of its 24 figures | `main` (merged October 14, 2026) | 4183 |
| `slice` | Volume and medical imaging | A radiology light box: blue-black film on a backlit white wall, one fuchsia wax pencil | Two real CT scans, a walnut and a young gar's head, to cut on three planes, window, and turn as a shaded cutaway | `main` (merged October 14, 2026) | 4184 |
| `atlas` | Scale, astronomy and Earth | A field star atlas: white line on black, its marks in one color (sea green as printed) that the visitor can turn; five more editions, Indigo and gilt among them | One plate that zooms from the Milky Way to a ribosome, with the planets where they are today and a true outline at every stop | `main` (merged October 14, 2026) | 4185 |
| `arcade` | Games and interaction design | A vector arcade monitor: mint phosphor lines on black glass, one hot red ball | His name as a wall of 32 strokes in a vector brick-breaker, with three rule switches, eight rule sets and a house score to beat on each | `main` (merged October 14, 2026) | 4189 |

Every built concept is published at `https://ryanjosephkamp.github.io/portfolios/<slug>/` (v1 as
`anagram-tiles`), on the Portfolios gallery at https://ryanjosephkamp.github.io/portfolios/, and is a
download on the `templates-v1` release. Both are copies from main, made on October 14, 2026;
`docs/operator/RESUME.md` says how to refresh them.

## Pieces

Standalone pages, not portfolios, built to push what people think a web page can do.
[PIECES.md](PIECES.md) has their rails, and `docs/operator/pieces-briefs.md` has each one's brief.
Ryan locked these ten on October 18, 2026; they are built in this order, three at a time. Each
builder picks its own look, so a piece's territory is recorded once it exists.

| Slug | Premise | Signature | Branch | Port |
| --- | --- | --- | --- | --- |
| `lineage` | The page's design is its genome: two children each round, one picked, then a mutation | Pick the child you like; the evolved page is a link | `piece/lineage` (wave 1) | 4211 |
| `crumple` | The page is a sheet of paper with real writing on it | Crumple it, throw it, smooth it out with the creases kept | `piece/crumple` (wave 1) | 4212 |
| `tenant` | A creature lives in the page's real text layout | Hand it a word and see what it does with it | `piece/tenant` (wave 1) | 4213 |
| `broken` | A page made of the ways web pages fail | Fix it, or break it further | `piece/broken` (wave 2) | 4214 |
| `motion-only` | Every frame is noise; the words exist only in its motion | Take a screenshot and get static | `piece/motion-only` (wave 2) | 4215 |
| `ctrl-f` | A page played with the browser's own controls, with a second page in its source | Find a word with the find bar | `piece/ctrl-f` (wave 2) | 4216 |
| `feedback` | Video feedback as an instrument | Twist the camera and watch patterns grow | `piece/feedback` (wave 3) | 4217 |
| `vessel` | Each window is a glass of water that pours into the next | Shake the window | `piece/vessel` (wave 3) | 4218 |
| `handscroll` | An endless painted handscroll, generated as it unrolls | Unroll it | `piece/handscroll` (wave 3) | 4219 |
| wildcard | Its builder's own idea | Its builder's own | `piece/<its slug>` (wave 4) | 4220 |

## Dropped

Ryan dropped these after his walkthrough on October 13, 2026. Each pull request is closed, each
branch is still on GitHub, and its tip is kept as a tag. Their territories are free again.

| Slug | Direction | Why | Kept as |
| --- | --- | --- | --- |
| `ripple` | Physical simulation: waves and optics | He liked the splash; the light and ripple lab parts were too plain | `archive/ripple-1`, pull request #12 |
| `query` | Information retrieval | Too many words, and not engaging enough | `archive/query-1`, pull request #11 |

## Next

Eleven are built. `arcade` took Ripple's place on October 13, 2026. Nothing replaces Query for now, so
no concept leads with information retrieval.

Alternates, if one is replaced: `plot` (data visualization: data in 3D and the climate records),
`lesson` (explorable explanations: the Tinkerer's Manual).

Not a basis for any concept: the capstone. It is the last, short entry in every project list.

The staging preview, every concept on one server, runs on port 4180.
