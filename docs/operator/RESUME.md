# Resuming the operator

Where the portfolio work stood on October 18, 2026. A session picking the work back up reads this
file, then `CLAUDE.md`, `docs/PLAYBOOK.md`, `docs/PIECES.md`, `docs/CONCEPTS.md` and the end of
`docs/operator/walkthrough-notes.md` (round three).

## State

Updated October 18, 2026, when Ryan locked the ten pieces.

- **Ten pieces are next**: standalone pages, not portfolios, built to push what people think a web
  page can do (`docs/PIECES.md`, and the "Pieces" rows in `docs/CONCEPTS.md`). Ryan picked them
  from three rounds of proposals on October 17 and 18. He said no to Friction (feel surfaces through
  the mouse), Chorus (phones as one choir), Peep Box (head-tracked depth), Room Score (a room's
  sounds as a score), Unmix (reversible syrup flow), Candlelight (lit by global illumination),
  Lightspeed (relativistic scrolling) and Peekaboo (moves only when unwatched). His yeses treat the
  page itself as the material.
- **All eleven concepts are on main** and no pull request is open: v1 (Anagram Tiles, the repo root),
  one-splat, specimen, toybox, workshop, overprint, molecule, resonance, slice, atlas and arcade.
  Ripple and Query were dropped; their tips are the tags `archive/ripple-1` and `archive/query-1`.
- **The Portfolios gallery is live** at https://ryanjosephkamp.github.io/portfolios/, from
  ryanjosephkamp.github.io pull request #35. Every concept is a poster with a six-second trailer and
  opens at `/portfolios/<slug>/` (v1 is `anagram-tiles`). A "Portfolios" link with a slowly turning
  color sits between Home and Repositories on the homepage and the repositories page, and in the
  blog's header and footer (blog pull request #21).
- **The templates are released**: https://github.com/ryanjosephkamp/portfolio/releases/tag/templates-v1
  holds `<slug>-template.zip` for all eleven, built by `tools/operator/build-templates.sh` from main
  at 1791ce1 (pull request #18). Each zip is the concept's folder plus `TEMPLATE.md` (make it
  yours), `DESIGN.md` (its design system, for Claude Code or any coding agent), `LICENSE` (MIT) and
  `THIRD_PARTY.md`. The gallery's Template buttons download these; its Design links open each
  `DESIGN.md` on main.
- **Licensing:** MIT for Ryan's code and text. Two Atlas files are not MIT: `assets/ground.js`
  (OpenStreetMap, ODbL) and `assets/data.js` (CC BY-SA star data). `THIRD_PARTY.md` lists the rest.
- **With Ryan, for Splashery's own operator session (another account):** the new-scans prompt below,
  if he wants more objects in Slice. He handles Splashery's British spellings himself. The English
  OpenList expansion comes later; "Change a fact or link everywhere" in the Prompt Kit covers it.

## Next, in order

1. **The pieces, three at a time.** `docs/operator/pieces-briefs.md` holds every brief, ready to
   paste. Ryan opens one session per piece and pastes its brief, as with the concept lanes.
   - Wave 1: Lineage, Crumple, Tenant (Xhigh).
   - Wave 2: Broken, Motion Only, Ctrl+F (Xhigh).
   - Wave 3: Feedback (Xhigh), Vessel and Handscroll (Max).
   - Wave 4: the Wildcard (Max), alone or two side by side.

   As each reports, recheck it with `tools/operator/check-lane.sh <slug> origin/main` (it knows
   pieces), look at it at desktop and phone widths, rebuild staging (it merges every `piece/*`
   branch), and record its territory in its registry row. Merge only on Ryan's go-ahead.
2. **After the pieces:** a second gallery on Ryan's site for them, and templates of the ones he
   wants to share, as with the portfolios.
3. Any further change to a concept goes on a new branch from main in that concept's worktree, as
   `update/<slug>-<topic>`, with its own pull request. After it merges, refresh the published copy
   and the template (below).

## Refreshing what is published

The gallery holds copies of the concepts, not links into this repo, so a change on main reaches the
site only when it is copied again.

1. In a worktree of ryanjosephkamp.github.io on a new branch, copy the concept with
   `rsync -a --delete --exclude tools/ concepts/<slug>/ <site>/portfolios/<slug>/` (v1: `index.html`,
   `main.js`, `styles.css` and `assets/` into `portfolios/anagram-tiles/`). Delete `README.md`,
   `check.mjs`, `verify.mjs`, `package.json`, `TEMPLATE.md` and `DESIGN.md` from the copy, and point
   `og:url`, `og:image` and `canonical` at `https://ryanjosephkamp.github.io/portfolios/<slug>/`.
2. If the change shows in the first six seconds, record a new poster with
   `tools/operator/trailers.sh http://localhost:<port>/portfolios <slug>` while the site's worktree
   is served, and copy `dist/trailers/<slug>.{webm,mp4,webp}` into `portfolios/assets/posters/`. The
   script's per-concept actions (clicks, dial turns) may need updating if the first screen changed.
3. Run the site's `npm run format:check`, `npm run lint:css` and the Playwright test
   `tests/web-qa/portfolios.spec.mjs`, then open a pull request.
4. Rebuild the zips with `tools/operator/build-templates.sh` and replace them on the release:
   `gh release upload templates-v1 dist/templates/*.zip --clobber --repo ryanjosephkamp/portfolio`.
   For a change people should notice, publish `templates-v2` instead and update the gallery's links.

## Pages

These are private pages on Ryan's claude.ai account. Their sources are in the repo, so a session
that cannot open them can still read and republish them.

| Page | Source | Address |
| --- | --- | --- |
| Portfolio Prompt Kit: copy-ready prompts for every kind of job | `docs/operator/prompt-kit.html` | https://claude.ai/artifact/NDCiAYaB23L5aqKQU3JsZo |
| Operator manual: status, registry, launch pack | `docs/operator/manual.html` | https://claude.ai/artifact/RqSMxQRX232yRdcVkFqp9E |
| Portfolio Walkthrough: a card per concept; verdicts and notes save to its database (collection `review`, documents `r<round>-<slug>`) | `docs/operator/walkthrough.html` | https://claude.ai/artifact/B8TXdmLZH6r95vqsFjqVFt |

Republish a page by reading it first (`Artifact` with `action: "read"` and its address), then
publishing its source file with that address. The walkthrough page keeps its `db` capability when the
publish leaves `capabilities` out.

## Staging

- `tools/operator/rebuild-staging.sh` rebuilds the local `staging` branch in
  `.claude/worktrees/staging` from main, this operator branch, v1's caption fix and every concept
  branch.
- Serve it with the launch config `staging` (port 4180). A server started from a session stops when
  the Claude app quits; start it again with `preview_start` and the name `staging`.
- `tools/operator/check-lane.sh <slug> <tip before the round>` rechecks a pushed branch.
- `tools/operator/shoot.mjs` loads a page in headless Chrome in real time and reports frame rate,
  console errors and sideways scroll. The Browser pane gets no animation frames while it is hidden.

## Lanes

Each concept has its own session and worktree under `.claude/worktrees/`.

| Concept | Session title | Worktree |
| --- | --- | --- |
| one-splat | One Splat portfolio refinement | `one-splat` |
| specimen | Specimen portfolio concept | `specimen-portfolio-concept-0969d9` |
| toybox | Toy Box portfolio concept | `toy-box-portfolio-72c06d` |
| workshop | Workshop portfolio concept site | `workshop-portfolio-concept-5836d0` |
| overprint | Portfolio site for MIT Media Arts & Sciences | `portfolio-mit-media-arts-b500c7` |
| molecule | Molecule portfolio concept | `molecule-portfolio-concept-15af88` |
| resonance | Resonance portfolio concept | `concept-resonance-4195a7` |
| slice | Slice portfolio concept | `slice-portfolio-concept-bb7b7b` |
| atlas | Atlas portfolio concept | `atlas-portfolio-concept-5e3947` |
| arcade | Arcade portfolio concept | `arcade-portfolio-concept-ba7f72` |

Send a lane its prompt with `SendMessage` to its session id (`list_sessions` shows them), after
checking that the session is idle and its worktree clean. If a session is gone, the same prompt
works in a new session opened on that worktree.

## The round-three prompts (sent October 14)

### Slice

```
Refine Slice from Ryan's final review: this is his round-three refine prompt, sent by the operator session at his instruction.

Refine one of my concept portfolio sites from my notes.

CONCEPT: Slice (concepts/slice/) in ryanjosephkamp/portfolio.

START: work in this concept's own worktree on branch concept/slice while its pull request (#10) is open. Run `git pull --rebase origin concept/slice` first. The rules are on main: `git show origin/main:CLAUDE.md` and `git show origin/main:docs/PLAYBOOK.md`, if you have not read them this session. The pull request changes only concepts/slice/.

MY NOTES (Ryan's words):
1. "Almost perfect, but when the user chooses the "Gar's Head", section D ("The same walnut, in Splashery") doesn't change to something like "The young gar's head, in Splashery", and the text below it ("Everything above is this page's own drawing of the scan. This one is Splashery's: its walnut toy in the embed player, the same CT scan drawn as volume splats. It turns when idle and you can orbit it. In the playground you can cut it, or show only its dense shell.") doesn't update for the young gar's head toy."

From the operator, not Ryan's words:
- Section D follows the scan on the film: its heading, its paragraph and the embed itself show the gar when the gar is chosen. Find the Splashery toy or embed parameters that show the gar's head sample, and see the embed render before relying on it (the playbook's gotchas about embeds). If Splashery has no embeddable gar, say so, and give the section an honest gar version instead of the walnut's text.
- Keep adding a scan a one-entry change: the section's heading, text and embed come from the scan's entry in SCANS.

Keep the signature and the territory. See it at desktop and phone widths, switching scans both ways, and keep `node /Users/noir/portfolio/tools/us-spelling.mjs concepts/slice` printing nothing.

DONE WHEN: section D matches whichever scan is chosen, seen working. Push, reply with one line, and send the same report to the operator session.

When my usage reaches 98%, find a natural stopping point.
```

### Atlas

```
Refine Atlas from Ryan's final review: this is his round-three refine prompt, sent by the operator session at his instruction.

Refine one of my concept portfolio sites from my notes.

CONCEPT: Atlas (concepts/atlas/) in ryanjosephkamp/portfolio.

START: work in this concept's own worktree on branch concept/atlas while its pull request (#9) is open. Run `git pull --rebase origin concept/atlas` first. The rules are on main: `git show origin/main:CLAUDE.md` and `git show origin/main:docs/PLAYBOOK.md`, if you have not read them this session. The pull request changes only concepts/atlas/.

MY NOTES (Ryan's words):
1. "Atlas is basically complete, but I'd like to see a few more color themes. Maybe something like the Field edition with a bit of color? I don't like Indigo and gilt as the default, but I don't want to delete it or anything; Field edition is close to what I want, but maybe it could have a bit more color? Is there a way to allow the user to customize the color without making this look terrible?"

From the operator, not Ryan's words:
- Add a few editions. One is the Field edition with some color (white line on black, with color carried in the way a real field atlas would carry it), and it becomes the default. Indigo and gilt stays as a choice. Show Ryan the candidates in your report.
- Customizing without looking terrible: let a visitor turn one dial, the hue of the edition's color, in OKLCH with lightness and chroma held, so every position keeps the edition's contrast. Check contrast across the dial's whole range (Resonance's tools/check-contrast.mjs on its branch is a model) and remember the choice in the visitor's browser under a key that starts with `atlas:`.
- The default edition changes the registry row's territory: state the new row in the pull request description.
- Splashery's stop labels are being handled in Splashery itself. Atlas keeps stating what its own drawing measures.

Keep the signature. See each edition and the dial at desktop and phone widths, and keep `node /Users/noir/portfolio/tools/us-spelling.mjs concepts/atlas` printing nothing.

DONE WHEN: the note is answered and seen working. Push, reply with one line per point, and send the same report to the operator session.

When my usage reaches 98%, find a natural stopping point.
```

### Arcade

```
Refine Arcade from Ryan's final review: this is his round-three refine prompt, sent by the operator session at his instruction.

Refine one of my concept portfolio sites from my notes.

CONCEPT: Arcade (concepts/arcade/) in ryanjosephkamp/portfolio.

START: work in this concept's own worktree on branch concept/arcade while its pull request (#15) is open. Run `git pull --rebase origin concept/arcade` first. The pull request changes only concepts/arcade/.

MY NOTES (Ryan's words, numbered by the operator):
1. "EXTREMELY COOL! WOW! So creative... thank you for making this. Now, is the Amordle game demo actually playable? Can we make it playable?"
2. "And can we make the red letter box animation go away or be slower or something?"
3. "Aside from those comments, this portfolio is basically perfect. Great work!"

From the operator, not Ryan's words:
- Note 1: today the Amordle cabinet explains the game (word length, modes, clocks and rating pools) and cannot be played. Make one round playable here, in Amordle's own rules as its README states them (`gh api repos/ryanjosephkamp/amordle/readme -H "Accept: application/vnd.github.raw"`): guesses, the letter feedback Amordle gives, at the word length the slider picks. Take the words from a list whose license allows it; English OpenList is Ryan's own, so read its README and license first, and ship only a small slice, loaded when the cabinet is reached. Claim-safe: it is a round in Amordle's rules on this page, not Amordle itself, and Play still links to the real game for the daily puzzle and ranked play.
- Note 2: find the red letter-box animation he means (the tiles strip in the Amordle cabinet is the likely one; confirm by looking) and calm it: much slower, or still until the visitor acts. The reduced-motion path keeps it still.

Keep everything else. See it at desktop and phone widths, play a full round by hand, and keep `node /Users/noir/portfolio/tools/us-spelling.mjs concepts/arcade` printing nothing.

DONE WHEN: a visitor can play a round of Amordle's rules in the cabinet, the animation is calm, both seen working. Push, reply with one line per note, and send the same report to the operator session.

When my usage reaches 98%, find a natural stopping point.
```

### For Splashery's operator session: new scans for Slice

```
Add one to three new CT scans to Splashery's volume viewer, each with a toy the embed player can show, so my portfolio's Slice page can show them too.

Why: my portfolio's Slice concept shows the volume viewer's two samples, the walnut and the gar's head, copied voxel for voxel and embedded with the embed player. A new scan has to land here first: as a volume-viewer sample, as a toy the embed player shows by id, and in the README and the manual.

A good scan for this: a real CT or micro-CT scan of a thing that is not a person, under a license that allows redistribution (CC BY or CC0 preferred), with inner structure that rewards cutting, and small enough after downsampling to ship like the gar (a few megabytes at most, fetched on demand).

Candidates to check for license, source and size (none verified yet):
- a stag beetle (micro-CT; a classic volume-rendering dataset from TU Wien);
- a bonsai tree (CT; another classic test volume);
- a lobster, or the "Boston teapot" CT with a lobster inside it;
- a seashell such as a nautilus, from MorphoSource, where licenses vary by specimen;
- a fruit, such as a pomegranate or a pineapple, from an open CT collection.
The Open SciVis Datasets list (klacansky.com/open-scivis-datasets) gathers many classic volumes with their sources; MorphoSource and Zenodo hold more, each under its own license.

Pick the ones whose license and size work, say why for each, and follow the project's own rules for samples, credits and tests.

DONE WHEN: each new scan opens in the volume viewer, has a toy the embed player shows by id, is credited, the project's checks pass, and a pull request is open. Reply with each scan's source, license, size on disk and toy id.
```

When a new scan lands in Splashery, Slice takes it as one entry in its SCANS list plus one sheet (its
README has the steps), and section D shows the new toy.
