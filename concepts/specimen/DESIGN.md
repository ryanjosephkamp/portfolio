# Specimen: design system

## The idea

**Signature.** A microscope slide holding a neuron made of 32,768 Gaussian splats that a visitor
focuses, labels, stains and fires. Lowering the focus merges splats pair by pair into the one
Gaussian with the same mass, center and covariance; tapping the cell runs a Hodgkin–Huxley spike
down its axon.

**Territory.** Daylight. The stylesheet opens with "Daylight: a glass slide on a white bench by a
window." Everything sits on a pale bench under a soft white highlight: the hero is a glass slide with
a paper label, every figure is a small pane of glass with a green edge, the footer links are
specimen tags. Splats here absorb light instead of emitting it, like a stained section on a bright
stage, so the picture reads as ink on glass.

**Voice.** A collection catalog. Sections are numbered cases ("Case I *the collection*", "Case II
*the method*", ...), figures are "Fig. 1" to "Fig. 4", the grooph feature is "Drawer 1", and the
footer is headed "Filed under". Catalog numbers and field names are set in small capitals.

## Tokens

All tokens are custom properties on `:root` in `styles.css`. Colors are OKLCH; the inks share hue
302 (violet), the glass and bench lean green (hue 160 to 165).

### Color

| Token | Value | Role |
|---|---|---|
| `--bench` | `oklch(0.966 0.008 160)` | Page background, under a white radial highlight at the top right |
| `--glass` | `oklch(0.995 0.003 160)` | Glass panes, drawer cards, pressed chips |
| `--paper` | `oklch(0.985 0.012 95)` | The slide's paper label, pin tags, footer tags |
| `--ink` | `oklch(0.25 0.065 302)` | Text, slider track and thumb, drawer rules |
| `--ink-soft` | `oklch(0.45 0.045 302)` | Secondary text and every small-caps label |
| `--violet` | `oklch(0.43 0.17 302)` | "the stain": the emphasized words in the lede, hover borders, the focus knob's striped thumb |
| `--eosin` | `oklch(0.6 0.225 12)` | "a membrane that is firing": the Fire button, the chart pen, catalog numbers, link underlines and arrows, focus outlines, chosen pins and drawers |
| `--myelin` | `oklch(0.52 0.085 215)` | Defined; no rule uses it |
| `--rule` | `oklch(0.25 0.065 302 / 0.16)` | Hairlines and chip borders |
| `--edge` | `oklch(0.86 0.035 165 / 0.5)` | "the green you see in the edge of a pane of glass": the inset rim of every pane |
| `--shade` | `oklch(0.3 0.08 302 / 0.38)` | Drop shadows |

Other values: `theme-color` `#f3f5f1`; stain swatches `.dab--nissl` (`#5b2e93` and `#3690ab`),
`.dab--golgi` (`#33210f` and `#e8cf8f`), `.dab--he` (`#ec76a8` and `#4d3390`); the coverslip tint
for Golgi `oklch(0.93 0.075 88 / 0.7)` and for H&E `oklch(0.97 0.018 350 / 0.7)`; the tinted
sections' wash `oklch(0.95 0.014 165 / 0.75)` fading to `/ 0.35`.

The splat colors are absorbances, not CSS: `STAINS` in `specimen.js` gives each stain set (`nissl`,
`golgi`, `he`) four inks, one per kind of tissue (`BODY`, `DEEP`, `SHEATH`, `FINE`), written as
`stain(r, g, b)` of the color that light keeps after passing through. `SPIKE` is the firing color,
`stain(1.0, 0.2, 0.3)`.

### Type

One family: **Newsreader**, `assets/fonts/newsreader-latin.woff2` (roman) and
`assets/fonts/newsreader-italic-latin.woff2` (italic), both declared `font-weight: 200 800`. The
files also carry an optical-size axis, `opsz` 6 to 72. Both are preloaded.

- Body: `400 1.0625rem/1.55 Newsreader, 'Iowan Old Style', Georgia, serif`, with
  `font-optical-sizing: auto` and lining numerals.
- The slide's `h1`: `clamp(2.6rem, 5.2vw, 4rem)`, weight 500, with optical sizing turned off and
  `font-variation-settings: 'opsz' calc(6 + 66 * var(--focus))`. `main.js` sets `--focus` from 0 to
  1 as the focus turns, so the name moves from the sturdy 6 pt design to the fine 72 pt one.
- `h2`: `clamp(2.3rem, 5vw, 3.75rem)`, italic, weight 400, line-height 1.
- `h3`: 1.5rem, weight 500; feature and figure titles are italic.
- `.lede`: `clamp(1.4rem, 2.5vw, 2rem)`, line-height 1.25.
- Small capitals: nav, slide number, `dt`, `.head__no`, knob labels and ticks, figcaptions, legends,
  drawer titles, card and figure numbers are `0.78rem`, uppercase, letter-spacing `0.09em`,
  weight 500, in `--ink-soft`.
- Readouts use `tabular-nums lining-nums`.

The grooph graph and the lettered emblems (`openlist`, `ars`, `amordle`) are drawn with Newsreader
on a canvas before they become splats, so `main.js` waits for the fonts before it draws them.

### Spacing, radii, borders, shadows

- `--wrap: 78rem` and `--pad: clamp(1rem, 4vw, 2.5rem)`; `.wrap` is `min(100%, var(--wrap))` wide
  with `--pad` inside.
- Sections: `padding-block: clamp(3.5rem, 8vw, 6.5rem)` with a 1px `--rule` top border.
- **The glass pane** is the one surface recipe, shared by `.slide`, `.vitrine__bench`,
  `.card__slide`, `.fig__stage` and `.feature__art`: a 175deg gradient from `#fff` through
  `--glass`, a 1px border in `oklch(0.25 0.065 302 / 0.22)`, radius 10px, and the shadow
  `inset 0 0 0 3px var(--edge), 0 1px 0 #fff inset, 0 2.4rem 3.5rem -2.4rem var(--shade), 0 0.2rem 0.5rem oklch(0.3 0.08 302 / 0.07)`.
  Smaller panes round less: 8px for figures, 6px for card slides.
- The paper label: `--paper`, a 1px `--rule` border and a second rule drawn 5px inside it
  (`outline-offset: -5px`), radius 3px.
- Radii elsewhere: 2rem pill chips; a 3rem pill Fire button; 4px drawer cards; 3px pins; footer tags
  `1.6rem 4px 4px 1.6rem`, like a luggage tag with a punched hole (`::before`).
- Borders are 1px `--rule`; drawer headings take a 2px `--ink` underline.

### Themes and editions

The three stains act as editions of the specimen. The `.tray__stain` radios (`nissl`, `golgi`,
`he`) set `data-stain` on `.slide`, which tints the coverslip (amber for Golgi, pink for H&E), and
`main.js` glides the four inks from one `STAINS` set to the next. There is no dark mode.

## Motion

- **Opening**: 300 ms after the neuron is ready, the focus sweeps from one splat to all 32,768 over
  3.6 s (smoothstep, raised to the 0.8 power), then the cell fires once.
- **Focus**: the drawn level eases toward the knob's value exponentially (rate 12 per second);
  between whole levels, children slide out from their parents.
- **Fire**: the spike plays at 7 model milliseconds per second (`SLOW`) and the chart's pen draws
  along with it.
- **Stain**: the inks glide over 600 ms (smoothstep).
- **Labels**: the lit part's glow eases in and out (rate 10 per second); pins fade over 0.4s and show
  only near full focus.
- **Turntable**: 2.6 s after the last drag the cell turns slowly about its long axis (0.16 radians a
  second) and its tilt relaxes to zero.
- **Fig. 1**: the splat turns while in view and pauses 1.8 s after a drag.
- **Emblems**: the first time a card is reached, its emblem focuses from one splat to all 4,096 over
  1.4 s while a pulse runs through it; hovering replays it from level 8, clicking from level 0.
- **grooph graph**: focuses at 9 levels a second and runs its loop with captions from `SCRIPT`.
- **CSS**: 0.15s on chips, drawers, tags and the Fire button (which rises 1px on hover and presses
  down 1px); the slide's canvas fades in over 0.5s when live.
- **Load**: if frames on the slide keep arriving late, it lowers the pixel ratio by half steps; it
  never draws fewer splats.

**Reduced motion** (from `README.md`, and in the code): no turntable, no opening sweep; the focus and
the stains jump instead of gliding; Fire shows one still frame and the finished chart; Fig. 1 holds
still until dragged; the grooph graph and the emblems are drawn once, in full focus. CSS removes all
transitions and smooth scrolling.

## Components and layout

- **Nav** (`.nav`): small caps; under 40rem only the first two links show.
- **Slide** (`.slide`): a grid of the paper `.slide__label` (15 to 19rem) and `.slide__stage`. The
  stage holds `#scope` (the WebGL2 canvas, `mix-blend-mode: multiply`), the `::before` coverslip
  with a diagonal glint, `.pins`, `.slide__fallback` and `.slide__hint`. Height
  `clamp(22rem, 40vw, 33rem)`; under 40rem the label stacks on top.
- **Pins** (`.pins`, `.pin--up`, `.pin--down`): a dot, a hairline of length `--lead` and a paper tag
  button with a bold name and an italic gloss. `main.js` places each pin on its part every frame.
  On a portrait stage (`.pins--tall`) the tags go out to the sides.
- **Tray** (`.tray`): stain radio chips, each with a two-color `.dab`, and the `.toggle#labels`
  button.
- **Bench** (`.bench`, `1.25fr auto 1fr`): the `.knob` (label with `#count`, `input#focus` with a
  striped dial thumb and tick marks, `.knob__ticks`), the `.fire` button, and the `.strip` SVG chart.
- **Keeps** (`.keeps`): the mass, center and spread at the current level, which do not change.
- **Section head** (`.head`): `.head__no` ("Case I" plus a soft span), an italic `h2`, ledes.
- **Case I**: `.case` (`1.2fr 1fr`) with the sticky `.vitrine` (bench pane, `#bench-fx` chips,
  note) and `.drawers` (`.drawer`, a grid of `a[data-toy]` cards at least 8.4rem wide); then
  `.catalog` (two columns of `dl` rows) and `.ledger`.
- **Case II**: `.figs`, two columns of `figure.fig` with a `.fig__stage` pane, `.fig__no`, `h3`,
  `.fig__knobs` and a `.fig__says` readout; `.matrix` brackets a 2 × 2 matrix.
- **Case III**: `.feature` (`1.2fr 1fr`) for grooph, then `.cards` (auto-fit, at least 17rem) of
  `.card` with a `.card__slide` pane, `.card__no`, `h3`, text and links; then `.also`.
- **Case IV**: `.sheet` (`1.5fr 1fr`) with `.sheet__data` rows and `.sheet__aside`.
- **Footer** (`.foot`): "Filed under", `.tags`, `.colophon`.
- **Link** (`.link`): weight 600, a 1.5px `--eosin` underline and a `↗` in eosin.
- **Tinted sections**: `.section--tint` (Case II and IV) wash the bench green.
- **State classes**: `.is-live`, `.no-gl`, `.is-firing` on the hero; `.no-plates` on `<html>`;
  `.is-fired` on Fig. 4; `.is-shown` and `.pins--tall` on the pins.
- **Breakpoints**: 62rem (two-column blocks stack, pins drop their glosses, the vitrine stops
  sticking), 48rem (figures in one column), 40rem (the phone layout described above).

## Interaction

- **The cell**: a tap (less than 6 px of movement) fires it; a drag turns it. In landscape, dragging
  up and down spins it about its long axis and dragging sideways tilts it (up to 0.9 radians); in
  portrait, sideways drags spin it. The canvas keeps `touch-action: pan-y`.
- **Focus**: a native range input (`#focus`, 0 to 15); arrow keys work, and its `aria-valuetext`
  reads the splat count.
- **Fire**: the button, or a tap on the cell.
- **Labels**: the toggle starts on at 62rem and wider. Hovering a pin lights its part; clicking pins
  it (`aria-pressed`) until clicked again.
- **Stains**: radio chips; the label's "Stain" line follows.
- **Drawers**: click loads that toy onto the bench and marks it `aria-current`; the effect chips
  reload it with another autoplay effect.
- **Figures**: drag Fig. 1 to turn it; drag either splat in Fig. 2 (it must be pressed within reach
  of a splat); shuffle Fig. 3; slide the push in Fig. 4, where an eosin mark on the track shows the
  threshold.
- **Cards**: hover replays an emblem from level 8; click replays it from one splat.
- **Focus outline**: 2px `--eosin`, 3px offset; radio chips show it on their visible span.

## Keep it intact

- Do keep the splats absorbing, not glowing: optical depth summed, then `exp(-depth)`, and every
  splat canvas set to `mix-blend-mode: multiply` on a light pane.
- Do keep daylight: a pale green-gray bench, white glass, violet ink, and eosin as the one warm accent.
- Do build every new picture surface from the glass pane recipe, and every catalog label in small
  capitals.
- Do keep the name's optical size tied to the focus control.
- Do keep the page to two WebGL2 contexts, as `README.md` describes: one for the slide, and one
  hidden stage that every figure and emblem is drawn on and copied from.
- Don't add a dark theme or saturated backgrounds; color comes from the stains.
- Don't sort splats or switch to alpha blending; absorption does not depend on order, which is the
  point of Fig. 3.
- Don't remove the reduced-motion branches in `main.js` or the media query in `styles.css`.

## Using this with an AI coding agent

Put `DESIGN.md` in your project and tell Claude Code (or another coding agent) to follow it for
colors, type, layout and motion whenever it edits the page. Keep `TEMPLATE.md` for the content swap:
ask the agent to work through its "Make it yours" list with your name, projects and links.
