# Resonance: design system

## The idea

A metal plate, sand and a violin bow. The opening comment of `styles.css` sets the rule: the page is
the metal, the type is the sand, and the metal's own tarnish is the one accent. The whole page is a
sheet of brushed metal with engraved type; the hero holds a polished plate clamped at its center, a
bow lying across its right edge, and sand that runs to the still lines of whatever note is bowed. The
plate follows the model Splashery's Chladni plate uses, `w(x, y) = cos(nπx)·cos(mπy) ±
cos(mπx)·cos(nπy)`, with n and m up to 4: 24 figures on 14 pitches, each pitch a whole multiple of
65.406 Hz (`BASE_HZ`). A visitor can pick one of five plates; copper comes first.

## Tokens

### The plates

Every color on the page comes from one block of custom properties per plate. `:root` holds brass;
each `:root[data-plate='…']` block overrides what differs. The plate in use is the `data-plate`
attribute on `<html>`.

| Plate | Look | `--ground` | `--ink` (sand, type) | `--accent` | `--accent-hi` |
|---|---|---|---|---|---|
| Copper (first) | Polished rose copper, black sand, the blue-green of its patina | `#cf9173` | `#190d08` | `#0b6170` | `#49c6d8` |
| Brass (`:root`) | Brass, black sand, verdigris | `#c3a04b` | `#16120a` | `#0c6f68` | `#3fd0bf` |
| Steel | Brushed steel, black sand, the blue a blade turns when it is tempered | `#aeb7be` | `#0e1216` | `#1a47b8` | `#6c9bff` |
| Titanium | Anodized violet that shifts toward blue, black sand, anodized teal | `#9c90dc` | `#110c20` | `#06646a` | `#4fe3d3` |
| Bronze | Dark statue bronze, pale sand, bright verdigris; the one dark plate | `#30281b` | `#f1e7cf` | `#58d9c6` | `#8ff3e3` |

| Plate | `--on-ink` | `--metal-hi` / `--metal-pale` (key faces) | `--p1` (plate highlight) | `--screen-fill` |
|---|---|---|---|---|
| Copper | `#f3cbb5` | `#f3cbb5` / `#e6b298` | `#f8d9c7` | `#e9bda4` |
| Brass | `#e9d28c` | `#e9d28c` / `#dcc070` | `#f0dc9c` | `#dfc573` |
| Steel | `#e6ebef` | `#e6ebef` / `#d0d7dd` | `#f1f4f6` | `#d6dce2` |
| Titanium | `#ddd7fb` | `#ddd7fb` / `#c6bdf5` | `#e9e4ff` | `#cfc7f8` |
| Bronze | `#2a2317` | `#54472f` / `#463b28` | `#63543a` | `#4f432d` |

What each token does (see `styles.css` for every plate's values):

- **The page:** `--ground` (also `theme-color`), `--g1` to `--g5` (the brushed gradient at 100°),
  `--grain-hi` and `--grain-lo` (a 4 px repeating brush grain).
- **Sand and type:** `--ink` and `--ink-rgb`, `--ink-hover`, and `--on-ink` for type on ink.
- **Engraving:** `--lip-rgb` is the lit lower lip of an engraved line; `--cut` (`0 1px 0` of it at
  55%) is the `text-shadow` on headings, stamps and lead text. `--mark` colors engraved marks: the
  rail ticks, the maker's mark, screen labels, figure numbers.
- **Keys:** `--metal-hi`, `--metal-pale`, `--key-hover`, `--key-lip`.
- **The plate:** `--p1` to `--p4` (polished, where the page is brushed), `--glint`, `--shade`,
  `--rim`, `--rim-lo`, `--inner`, `--edge-1` and `--edge-2` (its thickness), `--drop-rgb` (its
  shadow), `--screw-hi` and `--screw-mid` (the center clamp).
- **The accent:** `--accent` (the tarnish), `--accent-hi` and `--accent-hi-rgb` (the glow of a
  ringing plate), `--on-accent`.
- **The bow:** `--hair`, `--stick`, `--stick-edge`, `--tip`, `--frog`, `--frog-edge` (bronze gives
  the bow a lighter stick and an outlined frog). The bow's eye and screw are fixed (`#e8f4ee`,
  `#d8d2c0`).
- **Screens:** `--s1` to `--s3` and `--screen-fill`.
- **Live values:** `--wdth` (104 to start), the name's width, and `--ring` (0 to 1), how hard the
  plate rings; `main.js` sets both on `<html>` every frame. `--gutter: clamp(16px, 4vw, 56px)`.
- `color-scheme` is `light`, and `dark` on bronze.

The picker's swatches set their own `--a`, `--b` and `--c` inline in `index.html` (for copper,
`#f8d9c7`, `#c58565` and `#190d08`): a chip of the metal with one still line of its sand.

The canvases read `--ink-rgb`, `--screen-fill` and `--accent` through `readPlate()` in `main.js`
whenever the plate changes (`SAND`, `SCREEN`, `ACCENT`), so canvas colors never need editing.

### Type

One family: Archivo, `assets/fonts/archivo-variable-latin.woff2`, weight 100 to 900 and width
(`font-stretch`) 62% to 125%. The fallback stack is `'Helvetica Neue', Arial, sans-serif`. Width
does most of the work: wide for small capitals, narrow for big headings.

| Role | Selector | Setting |
|---|---|---|
| Body | `body` | 1.0625rem, line-height 1.55, weight 430, width 100% |
| The name | `.name` | `clamp(3.6rem, 10.2vw, 9.6rem)`, 860, uppercase, `-0.02em`, line-height 0.84, width from `--wdth` |
| Section heads | `.sec-head h2` | `clamp(2.9rem, 7vw, 6.6rem)`, 860, width 66%, uppercase (grooph keeps its lowercase) |
| Stamped capitals | `.stamp` | 0.74rem, 650, width 118%, `0.16em`, uppercase, engraved |
| Lead | `.lede`, `.big` | `clamp(1.2rem, 1.9vw, 1.6rem)` 560; `clamp(1.25rem, 2.1vw, 1.75rem)` 540 |
| Way and work heads | `.way h4`, `.work h3` | 780 at width 86%; 800 at width 82% |
| Keys and links | `.key`, `.links a`, `.tags a` | about 0.8rem, 700 to 750, width 112%, `0.08em`, uppercase |
| Figure number | `.fig b` | 3.1rem, 860, width 75%, tabular figures |
| Readouts | `.readout dd` | 1.12rem, 700, tabular figures |

The name's width tracks the note: `--wdth = round(125 − 63 × clamp(log2(hz / BASE_HZ) / 5))`, so the
lowest note sets it at 125 (widest) and the highest pulls it toward 62.

### Space, borders, shadows

- Content is at most 1500 px wide. Sections pad `clamp(48px, 8vw, 120px)` top and bottom and sit on
  a `5fr 7fr` grid with a gap of `clamp(20px, 4vw, 64px)`.
- Borders are `2px solid var(--ink)`. Each section opens with an engraved rule: `.sec::before`, 3 px
  of ink with a 1 px lit lip below.
- Radii are small: 3 px for keys, links and tags; 4 to 6 px for plates and screens; `999px` only for
  the loop's nodes.
- Shadows are stamped, not soft: keys `0 3px 0 var(--ink)` (loud keys `0 3px 0 var(--accent)`);
  plates and screens stack `0 2px 0 var(--edge-1)`, `0 4px` or `5px 0 var(--edge-2)` and a soft drop
  in `--drop-rgb`. A ringing plate adds `0 0 calc(var(--ring) * 46px) calc(var(--ring) * 4px)` of
  `--accent-hi`.

### Switching plates

1. Before first paint, the inline `<script>` in the head of `index.html` reads `?plate=` from the
   address, or else `localStorage['resonance:plate']`, and sets `data-plate` if it is one of the
   five. The first plate is whatever `index.html` names (`data-plate-first` keeps it).
2. `#plates`, a radio group hidden until `main.js` runs, calls `setPlate(name, true)` on change: it
   sets `data-plate`, saves the choice, re-reads the canvas colors, sets `theme-color`, rewrites
   `[data-plate-word]` and `[data-sand-word]` (`SAND_WORD = { bronze: 'pale' }`), and redraws every
   figure and screen.

## Motion

- **Sand.** `Sand.step()` moves every grain every frame: it hops more where the plate swings more
  and slides toward the still lines. Grains in the air (`hop > 0.3`) are drawn larger and at 42%
  opacity; settled ones at 92%. Silence leaves the sand where it lies.
- **Ringing.** The plate's energy rises with a 0.04 s time constant and falls with 0.5 s. A strike
  holds full ringing for a while: 0.35 s on pressing the plate, 0.5 s on Space, 0.9 s on an arrow
  key, 1.6 s for a tapped figure, 1.8 s for "Bow it", 2.6 s on first paint.
- **The bow.** When the stroke slows, the bow eases to the nearest figure (0.09 s). While the plate
  rings and nobody holds the bow, it saws on its own: `sin(now / 95) × 7%` of the plate's width,
  scaled by the energy.
- **Glow and width.** `--ring` steps by 0.05 and `--wdth` by whole units, and `.name` eases its
  width over 0.18 s.
- **CSS.** `.hint` bobs (`nudge`, 1.5 s, forever) until the plate is first played (`.is-played`),
  then fades out in 0.3 s. A tapped thumb runs `ring` (0.5 s, an accent ring spreading 18 px). Keys press
  down 3 px in 0.06 s; thumbs lift 2 px on hover. Loop nodes change in 0.12 s.
- **Sequences.** The grooph loop steps every 560 ms; "Play an example" plays eight figures, 470 ms
  apart.
- **Screens.** The spectrogram crosses its screen in six seconds by the clock, whatever the frame
  rate; the spectrum and scope redraw about every 30 ms; the landscape keeps one ridge per 40 ms
  frame. Canvases off screen are not drawn.

Reduced motion (`prefers-reduced-motion: reduce`): the sand does not animate; `settleNow()` puts it
straight onto the figure (200 steps at once) whenever the figure changes. The bow does not sway, the
loop shows its last step only, the spectrogram updates every 0.3 s and the other screens every
0.4 s. The stylesheet stops the hint, the ring animation, the thumb lift and every transition, and
turns smooth scrolling off.

## Components and layout

- **Top bar.** `.topbar` with `.plates` (`role="radiogroup"`), `.plates-label`, and one
  `label.plate-pick` per plate: a hidden radio, `.sw` (the swatch), `.nm` (the name); `.is-on` when
  chosen. Under 520 px only the chosen plate shows its name.
- **Hero.** `.hero`: columns `minmax(0, 1fr) minmax(0, min(46vw, 70svh, 640px))`, with extra right
  padding for the bow's frog. `.hero-text` holds `.stamp`, `h1.name`, `.lede`, `.lede-2`, `ul.how`.
  `.bench` holds the stage, `.readout` (`.fig` and a `dl` of mode, pitch and sand share),
  `.controls` and `.mic-say`.
- **Stage.** `div.stage#stage` (`role="slider"`, square) holds `.plate` with `canvas#sand`, `.clamp`
  (the center screw), `.maker` (the engraved maker's mark) and `.rail` (one tick `i` per figure,
  `.long` where the pitch changes, `.on` for the current one); then `svg.bow` (`.bow-stick`,
  `.bow-tip`, `.bow-hair`, `.bow-frog`, `.bow-eye`, `.bow-screw`) and `.hint`.
- **Keys.** `button.key` is a stamped metal tag; `.key-loud` is filled with ink; `.is-down` or
  `:active` presses it.
- **Sections.** `section.sec`: `.sec-head` (`.stamp`, `h2`, a `button.thumb`) and `.sec-body`
  (`.big`, `.links`, `.part`). `.links a` are outlined tags, the first one filled.
- **Thumbs.** `button.thumb[data-ring]` holding `canvas[data-figure]`: a small polished plate with a
  figure at rest (`restingFigure()`); tapping it rings that figure on the big plate.
- **Ways.** `.ways` > `article.way` (`5fr 7fr`) with `.way-text` and art: `.formula`, `.note` (an
  accent rule on the left), `#sheet` (six columns of thumbs, four under 520 px, each with `.num`;
  `.is-current` outlined in accent), `.real`, `.take-keys`, `.take-say`, `.screens` (two columns,
  `.screen-wide` spanning both; `.glass` with `.mark` and `.mark-x` axis labels), `.screen-tall`.
- **Loop.** `.loop` > `.loop-art` (an SVG of `.edge`, a dotted `.edge-back` and `.arrow`, with
  `ol.loop-nodes` placed over it by `--x`), `.loop-back`, `.loop-status`.
- **Works.** `ol.works` in the right column, `li.work` (thumb plus text), `.work-art`, `.art-line`,
  `.bars-wrap` / `.bars` (bars sized by `--h`, `.is-hit`) / `.bars-say`, `.work-last`.
- **About and footer.** `ul.tags` (metal tags); `footer.foot`, a band of ink.
- **Under 900 px** everything is one column; the bench comes first, at most `80svh` wide, with room
  on its right for the frog; the name's surname joins the first line. **Under 520 px** the plate
  names fold, the sheet drops to four columns and the screens to one.

## Interaction

- **Bowing.** Pressing the stage starts sound and bowing. The pointer's height on the plate picks
  the note (continuously across all 24, high notes at the top), its speed sets how hard the plate rings
  (`speed / 620`, capped at 1), and side-to-side movement slides the bow. On release the bow settles
  on the nearest figure. `touch-action: none` on the stage, with pointer capture.
- **Keyboard.** The stage is a focusable `role="slider"` with `aria-valuenow` and a spoken
  `aria-valuetext`. Arrow Up or Right raises the figure, Down or Left lowers it, Page Up and Page
  Down move four, Home and End go to the ends, Space or Enter bows while held, S scatters the sand.
- **Controls.** "Bow it", "Scatter", "Sound: on/off" (`aria-pressed`, remembered), "Sing to it"
  (asks for the microphone; the voice is measured, never played or kept, and the plate's own sound
  goes quiet while it listens), "Play it back" (repeats the visitor's last notes, kept as figures
  and strengths, never as sound), "Play an example".
- **Elsewhere.** Every thumb and every figure on `#sheet` rings when tapped. Amordle's bars play on
  tap or on a drag across them, and arrow keys move along them (one bar holds the tab stop). The
  grooph loop runs on its button. The plate picker is a native radio group.
- Sound waits for a gesture: the `AudioContext` is made in a handler. Focus is a 3 px ink outline
  offset 3 px; a skip link leads to `#splashery`.

## Keep it intact

- Take every color from the plate's block. To add a plate, write a
  `:root[data-plate='name'] {` block that overrides what differs from brass, add a
  `label.plate-pick` with its `--a`, `--b`, `--c`, add the name to `PLATES` in `main.js` and to the
  pattern in the head's inline script, give it a `SAND_WORD` if its sand is not black, and run
  `node tools/check-contrast.mjs`.
- One accent per plate, and it is that metal's own tarnish.
- Type and sand are the same color (`--ink`). Keep the engraved `--cut` shadow on headings and stamps.
- Keys stay stamped tags: 2 px border, 3 px offset shadow, uppercase, wide.
- Let Archivo's width carry meaning: the name's width follows the note. Do not fix it.
- No sound before a touch, no microphone without a press and a permission, and nothing of the
  visitor's voice kept.
- Keep each project's `data-ring`, `data-figure` and "Fig. N · Hz" stamp in agreement with
  `catalog()`, and run `node tools/check-figures.mjs` after touching `plate.js`.

## Using this with an AI coding agent

Put this `DESIGN.md` in your project and tell Claude Code (or another coding agent) to follow it for
color, type, layout and motion, and to add or change plates only through the plate blocks it
describes. Keep `TEMPLATE.md` for the content swap: hand it to the agent as the checklist of what to
replace.
