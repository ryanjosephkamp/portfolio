# Atlas: design system

## The idea

The territory is an engraved field star atlas: a bound set of numbered plates, printed for use in
the dark as white line on black, with the marks that matter in one color. Each section is a plate
or a sheet ("Plate I", "Plate II", "Plates III to VI", "Legend", "Bearings"), framed by a double
rule, and the page closes on a colophon that credits every source.

The signature is Plate I (`canvas#plate`), one continuous zoom across twenty-nine powers of ten,
from the Milky Way to a ribosome. It is drawn like an engraving: a graduated rim, dashed rings at
each power of ten, haloed italic labels, a true scale bar. The planets and the Moon stand where
they are at the minute the page loads, and from Washington inward every outline is the true shape
of the thing at its true size.

An engraved atlas was printed more than one way, so this one is too: six editions, chosen from the
"Printed as" panel in the header.

## Tokens

### Color: the default edition (`:root` in `styles.css`)

"Field, in color": white line on black, its marks in one color.

| Token | Value | Role |
|---|---|---|
| `--ink` | `#0c0c0b` | The ground; also the halo behind canvas labels and type on a pressed key |
| `--ink-deep` | `#040404` | The darkest end of the body's radial gradient; the plate hint's ground |
| `--ink-lift` | `#171716` | The lightest point of the body's gradient (top center) |
| `--well` | `#050505` | Inside the plate and the sky chart |
| `--line` | `#e2dfd8` | Type and line work |
| `--dim` | `rgba(226, 223, 216, 0.76)` | Body copy, notes, captions, secondary labels |
| `--faint` | `rgba(226, 223, 216, 0.32)` | Frames and button borders |
| `--hair` | `rgba(226, 223, 216, 0.17)` | Hairlines between list items; the outer rule of a sheet |
| `--gold` | `#51c9ad` | The one color: planets, stops, measures, plate numbers, the current place, focus |

Whatever the edition, `--gold` names its one color. The body ground is
`radial-gradient(120% 80% at 50% 0%, var(--ink-lift) 0%, var(--ink) 46%, var(--ink-deep) 100%)`,
fixed to the viewport.

### Editions

An edition is a `data-scheme` attribute on `<html>` that overrides the tokens. The default,
`field-color`, sets no attribute.

| Edition (`data-scheme`) | Ground | `--line` | `--gold` | Dial |
|---|---|---|---|---|
| Field, in color (`field-color`) | `#0c0c0b` | `#e2dfd8` | `#51c9ad`, oklch(0.76 0.115 175) | yes |
| Field edition (`field`) | `#0c0c0b` | `#d6d3cb` | `#ffffff` | no |
| Black and one color (`one-color`) | `#f2ebd9` laid paper | `#1c1915` | `#804945`, oklch(0.47 0.076 25) | yes |
| Plain (`plain`) | `#f2ebd9` laid paper | `#1c1915` | `#1c1915` | no |
| Hand-colored (`colored`) | `#f2ebd9` laid paper | `#1c1915` | `#2a6a50`, and per sheet | no |
| Indigo and gilt (`gilt`) | `#0d1040` | `#eef0ff` | `#e8bd5a` | no |

- The three paper editions set `color-scheme: light`, `--ink-deep: #e7dec6`, `--ink-lift: #f9f4e7`,
  `--well: #f7f2e3`, and `--dim`, `--faint` and `--hair` from `rgba(28, 25, 21, ...)` at 0.8, 0.36
  and 0.18. Their body adds laid lines (every 3px) and chain lines (every 37px) in
  `rgba(70, 52, 20, ...)`.
- Hand-colored washes each sheet in its own color: `#splashery` `#9a3553`, `#plates` `#845509`,
  `#interests` `#2f4d8c`, and every `.sheet` gets a 7px inset border of its color at 20%.
- Indigo and gilt sets `--ink-deep: #080a2b`, `--ink-lift: #161a5c`, `--well: #0a0c33`, and its
  `--dim`, `--faint` and `--hair` from `rgba(238, 240, 255, ...)` at 0.72, 0.28 and 0.16.
- Field edition keeps the black grounds and takes its translucent tones from
  `rgba(214, 211, 203, ...)`.
- The swatches in the panel (`.swatch.s-<edition>`) repeat these colors by hand: a disc of the
  ground with its lower 42% in the edition's color (three bands for Hand-colored).

### The hue dial

`editions.js` holds the two editions that can turn: `DIALS['field-color'] = { l: 0.76, c: 0.115,
hue: 175 }` and `DIALS['one-color'] = { l: 0.47, c: 0.076, hue: 25 }`. The dial (`input#hue`,
0 to 359 in 1-degree steps) turns only the hue, in OKLCH. Lightness and chroma stay where the
edition sets them, and the chroma is low enough that every hue fits inside sRGB at that lightness,
so no position is clipped and every one keeps the edition's contrast.

- `hexOf(l, c, hue)` converts OKLCH to an sRGB hex through Björn Ottosson's OKLab matrices, and
  `paint()` in `atlas.js` sets the result as `--gold` on `<html>`.
- The dial's track is a 13-stop gradient of the same lightness and chroma, every 30 degrees, set as
  `--track` on the input.
- `hueName()` gives the readout in `#hue-name` and the slider's `aria-valuetext` ("sea green, 175
  degrees").
- `#hue-reset` ("As printed") returns to the edition's own hue. For a fixed edition the dial grays
  out (`.dial.off`, the input and the reset button disabled) and its note says which editions
  turn.
- The `--gold` in `styles.css` for a dial edition is the dial at its printed hue;
  `tools/check-contrast.mjs` fails if the two disagree.

### Type

| Family | File | Style | Role |
|---|---|---|---|
| IM Fell English | `assets/fonts/im-fell-english-roman.woff2` (preloaded) | roman, weight 400 | Everything set upright |
| IM Fell English | `assets/fonts/im-fell-english-italic.woff2` | italic, weight 400 | Notes, captions, navigation, and most labels on the canvases |

`--serif` is `'IM Fell English', 'Iowan Old Style', Georgia, serif`. There is one weight, 400, and
headings stay at it (`h1`, `h2`, `h3` set `font-weight: 400`). Hierarchy comes from size, italics,
letter-spaced capitals (`.sc`: uppercase, `0.22em`, `0.82em`) and the edition's color.

| Use | Setting |
|---|---|
| Body | `clamp(1.05rem, 0.98rem + 0.3vw, 1.22rem)`, line-height 1.55 |
| `h1` (the name) | `clamp(3rem, 2rem + 6vw, 7rem)`, line-height 0.95, uppercase, `0.02em` |
| `.sheet-head h2` | `clamp(2rem, 1.4rem + 3vw, 4rem)`, uppercase, `0.08em`; `.left` versions `clamp(1.5rem, 1.2rem + 1.4vw, 2.3rem)` |
| `.fig h3`, `.chart h3`, `.index h3` | `1.55em`, line-height 1.15 |
| `.sub` | `1.3em`, italic, in `--gold` |
| `.stop-name` | `1.35em`, italic, in `--gold` |
| `.minor` | `1em`, uppercase, `0.2em`, in `--dim` |
| `.fine`, `.press-note`, `.press-fine` | `0.82em` to `0.88em`, italic, in `--dim` |
| Canvas labels | italic (the compass letters upright), 10px to 17px times a scale `ts` (0.92 to 1.12) set from the canvas size |

### Space, frames and shape

- **Gutter:** `--gutter: clamp(16px, 4vw, 56px)`.
- **A sheet:** `.sheet` is at most `1380px` wide, padded `clamp(24px, 4vw, 56px)
  clamp(18px, 4vw, 56px)`, with a double rule: `border: 1px solid var(--faint)` and
  `outline: 1px solid var(--hair)` at `outline-offset: 5px` (3px under 760px).
- **Corners:** `2px` on buttons and the press list; round only for the plate, the sky chart and the
  swatches.
- **Hairlines:** list items, charts and the index are separated by `1px solid var(--hair)` top
  rules.
- **Shadow:** only the press panel has a drop shadow, `0 14px 40px rgba(0, 0, 0, 0.4)`. The
  pressed edition gets an inset 1px ring in `--gold`.

## Motion

| What | How |
|---|---|
| Gliding to a stop (`glide()` in `atlas.js`) | duration `clamp(|Δz| × 420, 500, 2600)` ms, ease in and out (quadratic) |
| Fig. 2, before and after | a 700 ms linear crossfade between the two contour sets |
| `.runner` (grooph) | moves along a CSS `offset-path` round the loop to the stop, 9s linear, infinite, resting at the stop from 86% |
| `.meteors path` (Link Meteor) | `fall`, 3.6s ease-in, infinite, staggered by 0.7s, 1.5s, 2.1s and 2.8s |
| `.log-index` (English OpenList) | `slide`, 2.4s `cubic-bezier(0.2, 0.7, 0.2, 1)`, tied to scrolling (`animation-timeline: view()`) |
| `.sweep` (resmon) | crosses the field, 7s linear, infinite |
| Plate layers | each layer fades in and out with the zoom through smooth steps (`ramp()` and `band()` in `scale.js`) |

**Reduced motion** (`prefers-reduced-motion: reduce`): the four CSS animations stop; the meteors
show whole, and the sweep rests at `translateX(160px)`. `glide()` jumps straight to its stop, the
Fig. 2 swap is instant, smooth scrolling is off, and a stop chosen from the list scrolls the plate
into view without animation.

## Components and layout

- **`.top`:** the top margin of the sheet: `.top-mark`, `nav` (italic), and `details.press`, which
  scripts unhide. Its `.press-panel` (at most 370px wide; in the flow under 560px) holds
  `.press-list` buttons (`.swatch`, `.press-name`, `.press-note`) and the `.dial`.
- **`.hero`:** a grid of `minmax(0, 5fr) minmax(0, 6fr)` with areas `'text plate' 'stops plate'`.
  `.cartouche` holds the words; `.plate-wrap` is sticky at `top: 16px` and holds the canvas, the
  `.readout` (`.stop-name`, `.stop-measure`, `.stop-source`) and the `.rule` (out button, the
  `#zoom` range with its `.ticks`, in button); `.stops-wrap` lists the stops.
- **Under 980px** the hero is one column and the plate comes straight after the name: `.cartouche`
  becomes `display: contents`, so the plate number, the name, `.sub` and `.how` come first, then
  the plate, then the prose, then the stops.
- **The plate** is `width: min(100%, 60vh)` (`70vh` stacked), square and round.
- **`.sheet`:** the double-ruled frame for Plates II to VI and the last sheet, with `.sheet-head`
  (`.plate-no`, `h2`, `.dates`), centered, or left-aligned with `.left`.
- **`.figs` and `.fig`:** two columns, art and text; `.flip` puts the art second; `.text-only`
  sets two text columns under a hairline. `.control` is a label, range and button row; `.seg` a row
  of pressed-or-not buttons.
- **`.charts` and `.chart`:** a two-column grid of plates; `.wide` spans both with its own two
  columns. `svg.art` uses `.con-lines`, `.con-stars`, `.con-names`, `.gold-line`, `.gold-star`,
  `.gold-text`, `.meteors`, `.fields`, `.logrule`, `.log-index`, `.survey-stars`, `.survey-dupes`
  and `.sweep`; its text is italic 11px (`.tiny` 9.5px).
- **`.index`:** a two-column list; `li.last` spans both, in a smaller italic.
- **`.sheet.two`:** two columns, the `.legend` (magnitude dots `.mag.m1` 14px down to `.m5` 4px)
  and the `.bearings` (two text columns).
- **`.colophon`:** centered, at most `60em`, in `--dim`, headed by a `.sc` line in `--gold`.
- **Under 760px** every two-column grid becomes one column.

### Drawing on the canvases

- Each draw reads `--ink`, `--well`, `--line` and `--gold` from its own canvas's computed style
  (`ink()` in `atlas.js`), so a canvas inside a hand-colored sheet takes that sheet's color. The
  cache is cleared whenever the edition or the dial changes.
- Labels are italic IM Fell with a halo: stroked in `--ink` (at least 3.5px wide), then filled. On a
  round plate a label that would cross the rim slides back inside; a `soft` label gives way to one
  already placed.
- Line work is 0.6px to 1.4px. The rim is graduated in ecliptic longitude, a tick every 2 degrees,
  longer every 10 and 30. A dotted ring marks each power of ten, labeled "10ⁿ m".
- The scale bar is 1, 2 or 5 of a unit, between 12% and 30% of the plate's width.
- The canvas resolution follows the device pixel ratio, up to 2. Everything redraws on resize, when
  the fonts arrive, and when the edition changes.

## Interaction

- **The plate** (`canvas#plate`, `tabindex="0"`): the wheel zooms. Where the layout is stacked
  (980px and under), the wheel scrolls the page until the plate is clicked or focused, and
  `#plate-hint` says so for 2.6s; Ctrl or Command with the wheel always zooms. A mouse drags up and
  down to zoom; a finger drags sideways (up and down scrolls the page, `touch-action: pan-y`), and
  two fingers pinch.
- **Keys on the plate:** Up, Left or `-` zoom out a tenth of a power of ten; Down, Right, `+` or `=`
  zoom in; Page Up and Page Down glide to the next stop out or in; Home and End glide to the ends.
- **The rule:** `#zoom` (0 to 2920, step 5) sets the zoom directly; `#out` and `#in` glide to the
  next stop. Each stop's name in `#stops` becomes a button that glides there and scrolls the plate
  into view if it is off screen. The readout is `aria-live="polite"`, and `#zoom` has an
  `aria-valuetext` with the stop and the plate's width.
- **Fig. 1:** drag the sky sideways or slide `#hours` (12 hours either way, in 10-minute steps);
  `#now` returns. **Fig. 2:** `#before` and `#after` (`aria-pressed`). **Fig. 3:** `#load-real`
  swaps itself for the embed.
- **The press:** a `details` element. The edition buttons use `aria-pressed`; Escape closes the
  panel and returns focus to its `summary`; a click outside closes it. Choices are saved under
  `atlas:` keys, and an inline script in `<head>` applies the saved edition before the first paint.
- Buttons are at least 44px tall, except the dial's reset button (36px), and every focus ring is
  `2px solid var(--gold)`.

## Keep it intact

- Do take every color from a token. Don't write a color into a component or a canvas draw: the
  editions and the dial work only because everything reads `--ink`, `--line`, `--dim`, `--faint`,
  `--hair` and `--gold`.
- Do keep one accent. `--gold` is for the marks that matter (the planets, the stops, measures,
  plate numbers, the current place); everything else is line and its translucent tones.
- Don't add a bold weight or a second family. Use size, italics, `.sc` capitals and the accent.
- Do frame sheets with the double rule and separate items with hairlines, not boxes or shadows.
- To change the accent of a dial edition, change `DIALS` in `editions.js` and the matching `--gold`
  and `.s-*` swatch in `styles.css` together, then run `node tools/check-contrast.mjs`.
- Do keep the plate true: sizes, the scale bar and light's crossing time are checked by
  `tools/verify.mjs`. Don't round a size for looks.
- Do keep the haloed labels and the reduced-motion path.

## Using this with an AI coding agent

Put this `DESIGN.md` in your project and tell Claude Code (or another coding agent) to follow it
for colors, type, layout and motion, and to run `node tools/check-contrast.mjs` after any color
change. Keep `TEMPLATE.md` for the content swap: it lists where each personal detail lives.
