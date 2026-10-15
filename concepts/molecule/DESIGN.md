# Molecule: design system

## The idea

The page is a chemistry lecture hall. Each section is a slate blackboard in a wooden frame, hung on a
dark wall, with the dust of old lectures on it. Everything is written in chalk; atoms take their CPK
colors, lifted toward white so they read on slate; and yellow chalk marks anything you can act on and
every measurement (the comment on `--yellow` in `styles.css`). The signature is the first board: a
caffeine molecule you turn in your hand and measure, atom to atom, with a wooden chalk tray of
controls along its foot.

## Tokens

### Color (`:root` in `styles.css`)

| Token | Value | Role |
|---|---|---|
| `--wall` | `#101617` | The wall: page background between boards |
| `--slate` | `#1c2526` | The board; SVG fills (`.slatefill`); `theme-color` |
| `--slate-hi` | `#263233` | The top of each board's gradient, under the lamp |
| `--chalk` | `#efece2` | Text, chalk lines, button faces |
| `--chalk-dim` | `#b9bdb4` | Secondary text, eyebrows, notes |
| `--yellow` | `#ffe45c` | Yellow chalk: anything you can act on, every measurement, pressed buttons, focus |
| `--wood` | `#7a5536` | The frame and the tray |
| `--wood-dark` | `#4a321f` | The frame's shadowed side and the tray's foot |

The frame and tray gradients add `#8d6441` and `#6d4a2d`. Other literal colors: `#23201a` (text on
chalk and yellow buttons), `#2b2e33` (the eraser and the stockroom doors, with a `#c9b79a` felt edge
on the eraser), `#ff4d43` (the stop in grooph's scheme), `#ff6b61` (the letter a word gets stuck on),
`#8c948c` (footer text), `#f3dcc3` (tray labels), `#5d584c` (small text on stockroom cards),
`#0b0f10` (the frame for Splashery's viewer). `color-scheme: dark`.

`main.js` repeats two of them for the canvas: `YELLOW = "#ffe45c"` and `CHALK = "#efece2"`; the
measurement text is outlined in `#1c2526`.

### Chalk on the canvas (`main.js`, `chem.js`)

- **Atoms.** `cpk()` returns the Jmol CPK color; `chalk(symbol, lift = 0.22)` lifts it 22% toward
  white. `stamp()` paints one shaded ball per element at each of six depths (`LEVELS = 6`), lit from
  the upper left, with a pale chalk rim, and every atom is a copy of one.
- **Depth.** Farther atoms and bonds are darker: depth runs from 0.62 at the back to 1 in front.
- **Grain.** After drawing, a fixed noise pattern (`grainPattern()`) is knocked out of everything
  with `destination-out`, so chalk keeps the slate's tooth while the molecule moves.
- **Chains** (the cartoon, `SS`): helix `[255, 122, 138]` (pink), strand `[255, 228, 92]` (yellow),
  coil in chalk, nucleic-acid backbone `[126, 178, 255]` (blue), base rungs in chalk.
- **Orbitals.** Dots in `rgba(126,178,255,a)` where ψ is positive and `rgba(255,150,178,a)` where it
  is negative, in twelve fills by sign and depth.
- **Measurements.** Yellow dashed line `[9, 7]` between picks, yellow rings, a yellow arc for an
  angle; hover and keyboard cursor rings are dashed chalk `[4, 5]`. A chalk ruler in the lower left
  shows a round length (1, 2, 5, 10, 20 or 50 Å, or a₀ for the orbital) at least 40 px long.

### Type

One family: Shantell Sans, `assets/fonts/shantell-sans-latin.woff2`, weight 300 to 800, with two
more axes, `INFM` (informality) and `BNCE` (bounce). The fallback stack is `"Comic Sans MS",
"Segoe Print", sans-serif`. Two settings are tokens:

- `--neat: "BNCE" 0, "INFM" 0` for body text, tiles and buttons;
- `--loose: "BNCE" 35, "INFM" 70` for chalk headings, list heads, inputs and the scheme's labels.

| Role | Selector | Setting |
|---|---|---|
| Body | `body` | `clamp(1rem, 0.95rem + 0.25vw, 1.15rem)`, line-height 1.6, neat |
| Chalk headings | `.chalk` | 700, loose, line-height 1.02, `filter: url(#chalk)` |
| Name | `h1.chalk` | `clamp(3.4rem, 9.5vw, 8.4rem)`; on wide screens `min(9.5vw, 12.5svh)` in the middle; under 560 px `clamp(2.5rem, 12.4vw, 3.4rem)` on one line |
| Board titles | `h2.chalk` | `clamp(2.3rem, 6vw, 4.8rem)` |
| Small boards | `h3.chalk` | `clamp(1.4rem, 2.6vw, 2rem)` |
| Lead text | `.big`, `.lede` | 1.22em, 1.25em |
| Eyebrows | `.eyebrow` | 0.85em, uppercase, `0.08em`, `--chalk-dim` |
| Readouts | `.readout` | 600, 1.08em, yellow |
| Notes | `.meta`, `.aside` | 0.9em, `--chalk-dim` |
| Canvas | `write()`, `drawRuler()`, `drawSkeleton()` | `700` and `600` weights of "Shantell Sans" |

The `#chalk` filter, defined once in an inline SVG, roughens edges with `feTurbulence`
(`baseFrequency 0.9`) and `feDisplacementMap` (`scale 2.2`) and eats holes in the strokes. It is used
on chalk headings and on the grooph scheme's lines, never on body text.

### Surfaces, space, shapes

- **Board.** `.board`: margin `clamp(10px, 2vw, 28px)`, padding `clamp(22px, 4vw, 64px)`, a frame
  `clamp(6px, 0.9vw, 12px)` thick drawn with `border-image` (a wood gradient). Its background
  stacks three faint white radial smudges, an SVG noise of dust, and the slate gradient. Shadow:
  `0 18px 40px rgba(0,0,0,0.55)` outside and `inset 0 0 90px rgba(0,0,0,0.35)` inside.
- **Lamp.** `.lamp` lights the top 46% of the first board with a warm radial glow.
- **Tray.** `.tray`: a wood gradient running the board's full width, with a light top edge.
- **Hand-cut corners.** Radii are deliberately uneven: buttons `4px 6px 5px 7px`, element tiles
  `5px 7px 4px 8px`, the small boards `14px 10px 16px 9px` and `10px 14px 9px 16px`, the stage
  `10px`.
- **Chalk outlines.** The small boards and Splashery's viewer frame use `2px dashed
  rgba(239, 236, 226, 0.32)`; list rows use a `2px` top rule at 30% chalk.
- **Buttons.** Chalk faces, `min-height: 44px`, a `0 2px 0 rgba(0,0,0,0.45)` ledge; pressed
  (`aria-pressed="true"`) turns yellow with a soft yellow ring.
- **Element tiles.** `.el` takes its color from `--c` and mixes it with white for the border (70%)
  and the symbol (62%), with a 12% tint behind.

### Themes

None. One dark hall; `color-scheme: dark`.

## Motion

- **Stages.** The molecule and the orbital turn slowly by themselves (`turn(dt * 0.35, 0)`); the
  unit cell does not (`spin: false`). The turn stops for good once the stage is dragged or turned
  from the keyboard, and pauses
  while a mouse is over the stage so an atom holds still to be tapped. A drag leaves inertia that
  decays by 0.93 a frame.
- **Drawing style.** Changing between balls and sticks, space-filling and the shorthand eases the
  ball size and the shorthand's fade at `dt × 9` a frame. The skeletal formula swings the molecule
  flat onto the board with `poseTo()`: a quaternion slerp over 0.7 s, smoothstepped.
- **grooph's scheme.** `.runner`, a yellow dot, travels the loop on `offset-path` in 5.5 s, linear,
  forever.
- **Isomers.** Rearranging animates each letter tile from its old place (FLIP, Web Animations):
  520 ms on `cubic-bezier(.3,1.3,.5,1)`, rising or dipping 14 px on the way.
- **Buttons** rise 2 px on hover (0.12 s). `scroll-behavior: smooth`; picking from the stockroom
  scrolls the molecule into view.
- A stage draws only while on screen and only while something moves.

Reduced motion (`prefers-reduced-motion: reduce`, `still` in `main.js`): no idle turn and no
inertia; drawing-style changes and `poseTo()` happen at once; the isomer tiles jump; `.runner` stops
at 12% of its path; button transitions and smooth scrolling are off.

## Components and layout

- **Hero.** `header.board.hero` is a grid: columns `minmax(0, 0.82fr) minmax(0, 1fr)`, areas
  `"words hold" "tray tray"`, at least as tall as the window, up to 1000 px. `.hero-words` holds
  `.eyebrow`, `h1.chalk`, `.tiles`, `.lede`, `.how`. `figure.hold` holds `.stage-wrap` with
  `canvas.stage#hero-stage` and a `figcaption` of `.readout` and `.meta`. Above 900 px the stage's
  height is `clamp(300px, calc(100svh - 420px), 640px)`; below, its shape is `1 / 0.7`, and under
  560 px `1 / 0.92`.
- **Tray.** `.tray` with `.pick` groups (`.tray-label` and `button[aria-pressed]`), `#hero-extra`
  (the molecule on the board when it is not one of the four), `.door` buttons for the stockroom,
  and `.eraser`.
- **Under 900 px** the hero becomes one column and `.hero-words` uses `display: contents`, so the
  order is: eyebrow, name, tiles, the molecule, `.how`, `.lede`, the tray.
- **Boards.** `.cols` (`1.25fr 1fr`) and `.cols.even` (two equal columns), one column under 900 px;
  `.big`, `.links`, `.aside`, `ul.facts` (yellow `b` heads with a chalk rule on the left).
- **Small boards.** `.pair` of `figure.mini` (dashed chalk frame, stage shape `1 / 0.8`, a `.pick`
  row, a readout); `figure.real` with `.real-frame` (4:3) and `a.real-load`.
- **Scheme.** `figure.scheme` with `.chalk-line`, `.slatefill`, `.stopfill`, `.scheme-text` and
  `.runner`.
- **Tiles.** `p.tiles` of `span.el` (`small`, symbol, `i`), `.tiles-note`, `.small-tiles`, `.or`;
  `.long` keeps seven tiles on one line under 560 px and hides their names.
- **Isomer.** `div.isomer` with `p.letters` of circled letters and a `span.gap`.
- **List.** `ol.list`: two columns (one under 560 px), numbered by a yellow counter; `li.last` spans
  both and is smaller and dimmer.
- **Speller.** `.spell-label` (yellow), `input#spell-in` (large loose chalk on a chalk underline),
  `#spell-out` with `.tiles.way` rows or `.stuck`.
- **About.** `ul.contact`, an auto-fill grid of 9em columns.
- **Stockroom.** `dialog#stockroom.stockroom` (a board in a frame over a dark `::backdrop`):
  `.stock-top`, `#stock-find`, `#stock-list` sections of `.cards` (`button.card` with a `small`
  formula), and `section.own` with `.own-ways` (`#own-form`, `#own-code`, `#own-file`). Dragging a
  file over the hero shows `.hero.dropping::after`, "Drop it on the board".
- Breakpoints: `min-width: 901px`, `max-width: 900px`, `max-width: 560px`.

## Interaction

- **Stage, pointer.** Drag to turn (0.011 rad per pixel, both axes); `touch-action: none`. A tap
  (under 5 px of travel) picks the front-most atom within its drawn radius plus 4 px (at least
  14 px) of the point. One pick names the atom; two give the distance (two decimals on the board, three in the
  readout); three give the angle at the middle atom; a fourth tap starts over; tapping a picked atom
  drops it. A mouse over an atom rings and names it (`.on-atom` shows a pointer cursor). In the
  shorthand, only atoms still drawn can be picked.
- **Stage, keyboard.** Each `canvas.stage` is focusable (`role="application"`). Arrow keys turn it
  0.16 rad; `[` and `]` step a cursor through the atoms; Enter or Space picks; Escape erases.
  The molecule's and the cell's readouts are `aria-live="polite"`.
- **Tray.** Molecule and drawing-style buttons carry `aria-pressed`. For a chain the shorthand
  button reads "Cartoon"; a chain over 700 atoms opens as its cartoon unless the visitor has picked
  another style.
- **Stockroom.** Opens as a modal `dialog`; the search box filters cards by name, formula or code;
  picking a card closes the dialog and puts the molecule on the board; a tap on the backdrop closes
  it. A file can also be dropped anywhere on the first board.
- **Other boards.** Crystal and orbital buttons, "Touching spheres", "Cut it in half", "Rearrange",
  and the speller, which redraws on every keystroke.
- Focus is a 3 px yellow outline offset 3 px; a skip link leads to `#splashery`.

## Keep it intact

- Keep yellow for what can be acted on and for measurements; everything else is chalk or dim chalk.
- Use CPK colors only for atoms and element tiles, always lifted toward chalk.
- Put `filter: url(#chalk)` and `--loose` on headings only; keep body text `--neat`.
- Keep every section on a framed board, with the dark wall showing between boards.
- Keep corners hand-cut and uneven; do not round everything the same.
- Keep `YELLOW` and `CHALK` in `main.js` in step with `:root`.
- Keep controls at least 44 px tall and keep the keyboard path on every stage.
- Load nothing from another site until a visitor asks (the PDB fetch, Splashery's viewer).
- Keep the `still` path when you add motion, and run `node tools/verify.mjs` after changing the
  chemistry or the shelf.

## Using this with an AI coding agent

Put this `DESIGN.md` in your project and tell Claude Code (or another coding agent) to follow it for
color, type, layout and motion, and to keep the canvas colors in `main.js` in step with the
stylesheet. Keep `TEMPLATE.md` for the content swap: hand it to the agent as the checklist of what
to replace.
