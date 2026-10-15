# Workshop: design system

## The idea

The page is a paper drafting table. Five bordered sheets lie on blue graph paper, everything is drawn
in graphite, construction lines and small labels are in non-photo blue, and there is one red pencil,
which belongs to the person at the gate (the opening comment of `styles.css` says so). The signature
is sheet 1: a toy drawn as several hundred overlapping pencil ellipses, one per Gaussian splat, beside
the loop graph that decides when the drawing is done. Around it sit things from the same desk: a
rubber stamp, a parts list, a title block, a ruled build log and drawer tabs.

## Tokens

### Color (`:root` in `styles.css`)

| Token | Value | Role |
|---|---|---|
| `--paper` | `#f4f0e6` | Page and sheet ground, button faces; also `theme-color` |
| `--paper-2` | `#ebe5d6` | Offset shadow of cards, `code` background, field labels |
| `--ink` | `#2a2927` | Graphite: text, borders, hard shadows, the filled `.btn--ink` |
| `--ink-2` | `#5a5750` | Secondary text, captions, dashed rules |
| `--blue` | `#256e86` | Non-photo blue: small-capital labels, dimension lines, the `.btn--ink` shadow |
| `--blue-line` | `rgba(64, 150, 180, 0.2)` | The 24 px grid and the log's ruling |
| `--blue-line-2` | `rgba(64, 150, 180, 0.38)` | The 120 px grid and the guide lines under `.lettering` |
| `--red` | `#c5281c` | The red pencil: the person's gate, notes, a rejection edge, link underlines, hover, focus |

The canvas cannot read CSS, so `main.js` repeats the palette: `PAPER = [244, 240, 230]`,
`INK = [42, 41, 39]`, `RED = '#c5281c'`, and construction lines in `rgba(64,150,180,0.7)` with the
dash `[14, 4, 2, 4]`. The two SVG arrow markers in `index.html` (`#ah`, `#ah-red`) are filled
`#2a2927` and `#c5281c`. A stale stage (`.stages button.is-stale`) is hatched in
`rgba(197, 40, 28, 0.13)`.

Pencil shading, in `makeBoard()`: each splat is filled with paper mixed toward ink by
`t = (1 − lam) × 0.26 + tone`, where `lam` is the light from `LIGHT = [-0.47, 0.6, 0.65]` ("over the
left shoulder") and `tone` is how hard a part's pencil presses. Its outline is
`rgba(INK, 0.42 + 0.45k)` at `0.7 + 0.6k` px, with `k` a random pressure per splat. Parts marked
`solid` (sprinkles, the cherry) are filled `rgba(INK, 0.92)`.

### Type

One family: National Park, `assets/fonts/national-park-latin.woff2`, a variable font with a weight
axis from 200 to 800, loaded with `font-display: swap`. `--font` is
`'National Park', ui-rounded, 'Avenir Next', system-ui, sans-serif`. Numbers are `tabular-nums`
everywhere (set on `body`).

| Role | Selector | Setting |
|---|---|---|
| Body | `body` | 400, `1.0625rem/1.55` (1rem under 560 px) |
| Lettering, the name | `.lettering` | 300, `clamp(2.5rem, 7.4vw, 5.6rem)`, line-height 1, uppercase, `0.06em`, set between two blue guide lines |
| Sheet titles | `h2.lettering` | `clamp(2rem, 5.4vw, 4rem)` |
| Labels | `.sheet__no`, `.label`, `.rail`, `.titleblock dt`, `.bom th`, `.elabel`, `.board__dim`, `.gate__status`, `.picker legend` | 0.74rem, 500, uppercase, `0.14em`, `--blue` |
| Buttons | `.btn` | 600, `1rem/1`, `0.04em` |
| Drawer tabs | `.picker span` | 0.86rem, 600, `0.03em` |
| Stamp | `.stamp b` | 800, `clamp(1.3rem, 2.6vw, 2.1rem)`, uppercase, `0.16em` |
| Card heads | `.cards h3`, `.feature h3` | 700, 1.2rem and 1.45rem |
| Graph nodes | `.node text`, `.elabel` | 13.5px 600 `0.06em`; 10.5px `0.1em` (drawn larger under 560 px) |
| Code | `.graphs code`, the URL in `.fields` | `ui-monospace, SFMono-Regular, Menlo, monospace` |
| Notes on the canvas | `FONT` in `main.js` | `700 14px` |

### Space, borders, shadows

- `--pad: clamp(16px, 3.2vw, 44px)` pads each sheet; sheets sit `clamp(10px, 1.6vw, 22px)` from the
  window and `clamp(26px, 4vw, 56px)` apart.
- `--hair: 1.25px` is the hairline for tables, frames, tabs and cards.
- `.sheet` has a 2 px ink border plus a 1 px ink `outline` offset 4 px: a drawing's double border.
  Its fill is `color-mix(in srgb, var(--paper) 82%, transparent)`, so the grid shows faintly through.
- The body is graph paper: four `linear-gradient`s, a 120 px grid in `--blue-line-2` over a 24 px grid
  in `--blue-line`.
- Radii stay small: 2 to 4 px. Picker tabs are `3px 3px 0 0`, like drawer tabs; the stop pills in
  `.brakes` are `999px`; the stamp is `6px` with a `4px double` border.
- Shadows are hard offsets with no blur: `.btn` `3px 3px 0 var(--ink)` (4 px on hover, 1 px when
  pressed), red for `.btn--red`, blue for `.btn--ink`; cards and features `4px 4px 0 var(--paper-2)`.

### Themes

None. There is one light palette and no dark mode.

## Motion

- **The drawing.** A new revision fills in over 750 ms (`board.set(…, 750)`): splats appear in a
  shuffled `order`, so the drawing fills in all over at once. After 2.6 s without input the toy
  turns on its own (`yaw += dt * 0.16`). A new note sends a ripple through the surface for 2.6 s.
- **The run.** The planner takes 700 ms, the builder 800 ms and a check 380 ms (`sleep()`). The red
  token travels an edge in 300 ms, or 480 ms on a fail edge, eased by `k * k * (3 - 2k)`.
- **The stamp.** `.stamp.is-on` drops from `rotate(-9deg) scale(1.7)` to `scale(1)` in 0.16 s on
  `cubic-bezier(0.2, 1.4, 0.4, 1)`, fading to 0.88 opacity in 0.08 s.
- **Buttons.** 0.08 s on `transform` and `box-shadow`: up and left 1 px on hover, down and right 2 px
  when pressed. While the gate waits, its buttons run `nudge` (1.6 s, ease-in-out, twice).
- **Sheet 3.** `.strike` draws through the stops in 0.35 s ease-out, and `#stop-note` fades in
  0.2 s after a 0.25 s delay. Graph nodes change fill in 0.2 s.
- **Sheet 2.** `ripple()` runs a wave through a row of 19 ellipses while it is on screen.
- `html { scroll-behavior: smooth }`.
- The canvas draws only while on screen (an `IntersectionObserver`) and only when something changed.

Reduced motion (`prefers-reduced-motion: reduce`): the stylesheet turns off smooth scrolling, the
stamp, button, strike, note and node transitions, and the `nudge` animation. In `main.js`, `sleep()`
waits 0 ms, a revision appears at once, notes make no ripple, the toy does not turn by itself, the
token jumps to the end of its edge, and `ripple()` draws one still pose.

## Components and layout

- **Sheets.** `header.sheet--hero#top`, `main > section.sheet` (×3) and `footer.sheet--last#contact`.
  Each content sheet opens with `.sheet__head`: `.sheet__no`, `h2.lettering`, `.sheet__tag` (right
  aligned).
- **Rail.** `nav.rail`: `.rail__mark` and an `ol` numbered by a CSS counter.
- **Hero grid.** `.hero` has columns `minmax(0, 1.42fr) minmax(0, 1fr)` and areas
  `head lede / board loop / board gate / board log / bom tb / fine fine`. At 1020 px and below it is
  one column: `head, lede, board, gate, loop, log, bom, tb, fine`.
- **Pickers.** `fieldset.picker` with a `legend` and radio `label`s; the input is hidden and the
  `span` is a drawer tab, inked in when checked.
- **The board.** `figure.board > .board__paper` (at least 4:3, square under 560 px) holds
  `canvas#sheet-canvas`, `.stamp` (`.stamp--ink` for Done and Halted, red for Approved),
  `.board__dim` and `.board__hint`.
- **The loop.** `figure.loop` holds `svg#loop-graph`, drawn by `makeGraph()` from the document:
  `.node--agent` rectangles, `.node--check` clipped-corner gauges, `.node--human-gate` red diamonds
  reading "You", `.node--stop` double circles; `.edge`, `.edge.back` (dashed, arcing over),
  `.edge--red` (dashed, arcing under); `.elabel`; the red `.token`. `ul.brakes` lists the stops as
  pills: `.is-idle` dashed, `.is-person` red, `.is-fired` filled.
- **The gate.** `.gate` with `.gate__status` and `.btn` buttons: `.btn--red` (reject), `.btn--ink`
  (approve, next), `.btn--small`.
- **Records.** `.log` (a ruled `ol` with rows of `b`, `i`, `span`; `.is-you` red, `.is-fail` ✕,
  `.is-pass` ✓), `table.bom` (parts list; `.is-short` turns the total red), `dl.titleblock` (two
  columns, `.tb--wide` spans both), `p.fine`.
- **Content sheets.** `.cols` (two equal columns; one at 1020 px), `.prose` (62ch), `.mine`,
  `.links` with `.link` (a red arrow after each), `.embed` and `.embed__frame` (4:3),
  `.plates` (three columns) and `.plates--four` (four, then two at 1020 px, one at 560 px), `.plate`
  with a top rule, `.plate__art` drawn with `.pencil`, `.ptext`, `.dimline`, `.dtext`; `.kitlist`,
  `.drawer-labels`, `.lane`, `.limits`.
- **Graph table.** `.graphs` with `.graphs__scroll` (the table keeps a 760 px minimum width and
  scrolls sideways); `tr.is-running` gets a red bar on its left.
- **The drawer.** `.features` (two columns, one at 1020 px), `.feature`, `.stages` (four buttons;
  two columns under 560 px), `.fields`, `ul.cards` (five columns, two at 1020 px, one at 560 px),
  `.capstone`.
- **Contact.** `.titleblock--links`, `.colophon`.
- Breakpoints: 1020 px and 560 px.

## Interaction

- **Canvas, pointer.** Dragging turns the toy: 0.009 rad of yaw per pixel; a mouse also tilts it
  0.006 rad per pixel, held between 0.12 and 1.4. `touch-action: pan-y` lets a vertical swipe
  scroll the page. A tap (under 6 px of travel and 700 ms) leaves a red note on the nearest
  front-facing splat within 24 px; tapping a note within 22 px removes it. Six notes at most; the
  oldest goes first.
- **Canvas, keyboard.** `#sheet-canvas` is focusable. Arrow keys turn it (0.16 rad sideways, 0.1 rad
  up and down); Enter or Space leaves a note at the free point nearest the reader.
- **Pickers.** Native radio groups. Changing either restarts the run; the address updates by
  `history.replaceState`.
- **Gate.** The buttons are enabled only while the graph is asking; their labels come from the gate
  node's `options`, such as "approve" and "reject with feedback". When a run ends, `#next-run` replaces them.
- **Links that name a toy or graph** (`href` starting with `?`) set the pickers and scroll to `#top`
  without reloading. Modifier-clicks are left alone.
- **Other controls.** `#erase-stop` toggles with `aria-pressed`; `#load-embed` loads the player only
  on click; `#stages` buttons mark later stages stale and reapply; `#lm-next` steps through links.
- Focus is a 2 px red outline offset 3 px; a skip link leads to `#splashery`.

## Keep it intact

- Keep red for the person and what they touch: the gate, notes, the rejection edge, the approval
  stamp, focus and link underlines. Do not add a second accent color.
- Keep labels as small blue capitals and the name as light uppercase lettering between guide lines.
- Keep borders at the hairline or 2 px, shadows as hard offsets, and radii at 4 px or less.
- Keep the graph paper on `body` and the double border on every sheet.
- Draw each splat as one ellipse, projected from its covariance, as `makeBoard()` does. Do not
  switch to dots or sprites.
- If you change a color, change it in `:root` and in `PAPER`, `INK` and `RED` in `main.js`.
- If you change `BUDGET` or `BAR` in `kit.js`, change `graphs/CHECKLIST.md` and the page's text to
  match, and run `node tools/verify.mjs`.
- Keep the reduced-motion path in both files when you add motion.

## Using this with an AI coding agent

Put this `DESIGN.md` in your project and tell Claude Code (or another coding agent) to follow it for
color, type, layout and motion, and to check `styles.css` and `main.js` against it before changing
either. Keep `TEMPLATE.md` for the content swap: hand it to the agent as the checklist of what to
replace.
