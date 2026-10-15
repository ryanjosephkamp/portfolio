# One Splat: design system

## The idea

**Signature.** A name drawn with Gaussian splats, on a dial from 1 to 16,384. Each notch splits
every splat in two; a probe measures any splat the pointer touches; a visitor can type other words
and watch them fitted. Each splat is the exact mean and covariance of the pixels it stands for.

**Territory.** A dark instrument. The stylesheet opens with "One Splat — a dark instrument. Light is
the only color." The picture is orange light added onto black, the measuring tools are a thin cyan
line, and the hero's stage has a graticule etched over it, like the glass of a scope.

**Voice.** The page reads as a short paper. Section headings are a bold label and an italic title:
**Definition.** *One splat*, **Lemma.** *Splitting loses nothing*, **Example.** *Splashery*,
**Further examples.** *Other work*, **Remark.** *On the author*, **References.** The Lemma ends in
a proof and a ∎.

## Tokens

All tokens are custom properties on `:root` in `styles.css`, which also sets `color-scheme: dark`.

### Color

| Token | Value | Role |
|---|---|---|
| `--bg` | `#0a0a0b` | Page black. The WebGL clear color (`10/255, 10/255, 11/255`) and the 2D fallback fill match it. |
| `--panel` | `#111113` | Readout, knobs, the Lemma section, inputs and switches |
| `--ink` | `#ebe9e4` | Text |
| `--dim` | `#a5a39c` | Secondary text, labels, captions, nav links |
| `--rule` | `#2b2b2e` | Every hairline and border; the slider track |
| `--beam` | `#ff6a3a` | The light: the splats (`BEAM = [1.0, 0.34, 0.11]` in `main.js`), italic section titles, the active tick, link underlines, the `↗`, reference numbers, the ∎ |
| `--beam-hot` | `#ffc98a` | Link hover, the text box's letters, the slider thumb's core, the Example statement |
| `--probe` | `#8fe6f0` | Measurement: probe ellipses (`PROBE` in `main.js`), handles, focus outlines, pressed switches, probe rows of the readout, slider outputs, the skip link |

Values used directly: `#000` behind the Definition and Lemma canvases and the embed; `#0b0b0c` for
handle fills; `#fff` for the Lemma's rebuilt ellipse and the ledger sum; the slider thumb's glow
`rgb(255 106 58 / 0.75)`; the `<mark>` glow `rgb(255 106 58 / 0.6)`; the graticule lines
`rgb(255 255 255 / 0.09)` (axes) and `/ 0.045` (4rem grid). The Lemma figure colors its two halves
`FIRST` (255, 106, 58) and `SECOND` (128, 53, 29) and the rest of the picture `REST` (38, 38, 42).

**Color by angle** (`#tint`, WebGL only) is the one alternate rendering: each splat's color comes
from the angle of its long axis on a hue wheel that turns once per half turn, mixed with gray as
the splat gets rounder.

### Type

| Family | Files | Weights | Role |
|---|---|---|---|
| `--sans`: B612 | `b612-normal-400.woff2`, `b612-normal-700.woff2` | 400, 700 | Body and UI; the hero picture is rasterized from it (`FACE = '700 300px "B612", sans-serif'`), and so are the work titles (`700 150px`) |
| `--mono`: B612 Mono | `b612-mono-normal-400.woff2`, `b612-mono-normal-700.woff2` | 400, 700 | Readout, matrices, dial label and ticks, `.meta`, uppercase labels, the text box |
| `--math`: STIX Two Text | `stix-two-text-normal-400-700.woff2`, `stix-two-text-italic-400-700.woff2` | 400 to 700 (variable), roman and italic | Section headings, statements, equations, the lede, interests, and every `<i>` (math variables, set italic at 1.12em) |

Fallbacks: `ui-sans-serif, system-ui, sans-serif`; `ui-monospace, "SF Mono", Menlo, monospace`;
`"STIX Two Math", Georgia, serif`. B612 is preloaded in both weights.

| Step | Value | Used for |
|---|---|---|
| `--step-0` | `clamp(0.97rem, 0.93rem + 0.18vw, 1.06rem)` | Body (line-height 1.7) |
| `--step-1` | `clamp(1.15rem, 1.05rem + 0.5vw, 1.4rem)` | `.statement`, `.eq`, plain work titles |
| `--step-2` | `clamp(1.5rem, 1.2rem + 1.4vw, 2.2rem)` | `.lede`, work titles, interests |
| `--step-3` | `clamp(2.1rem, 1.3rem + 3.6vw, 3.9rem)` | Section `h2`: STIX 400, the `<b>` label 700, the `<i>` title in `--beam` |

Labels are B612 Mono at 0.72 to 0.8rem, often uppercase with 0.04 to 0.08em letter-spacing, in
`--dim`. Numbers use `font-variant-numeric: tabular-nums`. The no-JavaScript name (`.name`) is
`clamp(3rem, 14vw, 11rem)`, uppercase, in `--beam`.

### Spacing, radii, borders, shadows

- `--gutter: clamp(1rem, 4vw, 3rem)`; `.wrap` is `min(100% - 2 * var(--gutter), 76rem)` wide.
- Sections: `padding-block: clamp(4rem, 9vw, 8rem)` and a 1px `--rule` top border; headings sit
  `clamp(1.75rem, 4vw, 3.25rem)` above their content.
- Radii are small and squared off: 4px for panels and canvases, 3px for the text box and switches,
  50% for handles. A matrix (`.mat`) is drawn with 1.5px side borders and a 0.5em radius, like
  brackets.
- Borders: always `1px solid var(--rule)`.
- Shadows: none, apart from the glow on the slider thumb and the `<mark>` text shadow. Light comes
  from the splats, not from the interface.
- Layers: `--z-etch: 1` (the graticule over the light), `--z-probe: 2`, `--z-skip: 10`.
- `--ease: cubic-bezier(0.16, 1, 0.3, 1)` is defined but no rule uses it.

### Themes and editions

One theme, dark. The only switch is **Color by angle**, described above, and the `?flat` address
flag, which draws the hero on a 2D canvas instead of WebGL2.

## Motion

- **Opening**: the hero shows one splat, waits 900 ms, then divides to level 10 (1,024 splats) over
  4.6 s with a cubic ease-in-out (`tween()` in `main.js`). The probe then settles on the splat at the
  center of the stage.
- **Dial**: while dragged, splats move continuously between their parent's shape and their own
  (the shader mixes the two by `blend`). On release the dial glides to the nearest whole level in
  260 ms; arrow keys glide in 320 ms; a click on a tick glides in 500 ms.
- **Probe**: follows the pointer each frame, and follows its splat's line of descent when the level
  changes.
- **Text box**: refits 140 ms after the last keystroke.
- **Work titles**: each title starts at level 4 (16 splats, blurred) and sharpens to full detail over
  900 ms when its row crosses the middle 40% of the screen, or is hovered or focused. It blurs back
  over 500 ms when the row leaves that band.
- **CSS**: color transitions of 0.2s on links, ticks and switches; smooth scrolling.

**Reduced motion.** `tween()` jumps straight to its end value, so the opening lands on 1,024 splats at
once, and the dial and the work titles jump instead of gliding. CSS cuts transitions and animations
to 0.01 ms and turns off smooth scrolling.

## Components and layout

- **Hero** (`.hero`): full viewport, a grid of four rows: `.bar` (mark and nav), the stage, the dial,
  and `.hero__foot`.
- **Stage** (`.stage#stage`): two stacked canvases, `#beam` (the light) and `#probe` (the cyan
  overlay), with the graticule drawn by `.stage::after` and faded at the edges by a radial mask.
  `.is-stacked` gives it more height on narrow screens.
- **Dial** (`.dial`): a label and `input#dial` (range 0 to 14, step 0.01) over `.ticks`, whose spans
  are built by `refit()` and marked `.is-on` at the current level.
- **Hero foot** (`.hero__foot`, `1.55fr 1fr`): `.hero__say` (the `.lede` sentence, the bio, `.how`
  with `#fit-text` and the `.switch#tint`) beside the `.readout` panel (`dl` rows with a 6.5rem
  label column; `.readout__probe`, the row that opens the probe's measurements, is in `--probe` with
  a rule above it).
- **Matrix** (`.mat`): a 2 × 2 inline grid with bracket borders, used in the readout, equations and
  ledger.
- **Section heading**: `<h2><b>Label.</b> <i>Title</i></h2>`.
- **Pane with grips** (`.pane`, `.grip`): a canvas with handles drawn on it; each `.grip` is a 2.75rem
  transparent target laid over a handle, so a finger elsewhere on the picture still scrolls.
- **Definition** (`.anatomy`, `5fr 6fr`): the `#anatomy` canvas (square, a faint 8 × 8 grid on black)
  beside `.anatomy__math` with equations and the `.knobs` grid (label, slider, output).
- **Lemma** (`.section--lemma` on `--panel`): `.lemma__body` (max 66ch), then `.split` (`7fr 5fr`):
  the `#split` canvas (3:2) and `.split__side` with `.picker` and `.ledger`, then the proof with
  `.qed` and an `.aside`.
- **Example** (`.example`, `5fr 7fr`): text beside `.embed` (4:3, black, hairline border).
- **Works** (`.works`): rows of `7fr 3fr` with a splat title canvas across the top (`.has-splat`);
  `.works--plain` is a two-column list. `.also` and `.more` are small uppercase mono labels.
- **Author** (`.author`, `7fr 5fr`): `dl` with a 5rem label column, and `.interests`.
- **References** (`.refs`): an ordered list in auto-fit columns, numbered `[n]` in `--beam` by a CSS
  counter; then `.colophon`.
- **Before JavaScript**: everything marked `.needs-js` is hidden until `html.is-lit`.
- **Breakpoints**: at `56rem` every two-column block becomes one column; at `34rem` the nav tightens,
  the mark's "one splat" hides, the dial label moves above it, and even ticks lose their labels.

## Interaction

- **Stage**: moving or pressing the pointer picks the splat the pointer is deepest inside (by
  Mahalanobis distance) and shows its ellipses at one and two standard deviations. A mouse leaving
  the stage lets go; on touch the stage keeps `touch-action: pan-y`, so vertical swipes scroll.
- **Dial**: drag; arrow keys move one level, Page Up and Page Down two, Home and End to the ends;
  click a tick. The dial reports its value as "N splats" (`aria-valuetext`).
- **Text box**: type up to 16 characters; an empty box returns to the name on blur.
- **Color by angle**: a toggle button with `aria-pressed`, hidden where WebGL2 is missing.
- **Definition**: drag either handle to set an axis's length and the angle, or use the three
  sliders; handles and sliders stay in sync.
- **Lemma**: the two cut handles are focusable buttons; drag them, or move them with the arrow keys
  (8 px a press, 1 px with Shift). The splat slider steps with the arrows, Page Up to a child, Page
  Down to the parent, Home and End. **Median cut** restores the tree's own split; **Worst split**
  jumps to the split with the largest error. A cut that would leave a half empty is refused.
- **Works**: hovering or focusing a row sharpens its title.
- **Focus**: a 2px `--probe` outline, 3px offset.

## Keep it intact

- Do keep light as the only color: `--beam` for what is drawn, `--probe` for what measures it.
  Everything else is black, off-white and gray.
- Do blend splats additively on black (`gl.blendFunc(gl.ONE, gl.ONE)` in WebGL, `'lighter'` in 2D),
  and keep the canvas clear color equal to `--bg`, so the stage has no visible edge.
- Do keep the three voices apart: B612 for prose and UI, B612 Mono for numbers and labels, STIX Two
  for mathematics and headings.
- Do keep the paper structure of the headings, and matrices in `.mat` brackets.
- Do keep handles as transparent `.grip` elements over canvas drawings, so pages still scroll on
  touch.
- Don't fill panels with color or add drop shadows; panels are `--panel` with a 1px `--rule` border.
- Don't round corners past 4px.
- Don't add a second accent; a new state uses `--probe` or `--beam-hot`.
- Don't remove the reduced-motion path in `tween()` or the media query at the end of `styles.css`.

## Using this with an AI coding agent

Put `DESIGN.md` in your project and tell Claude Code (or another coding agent) to follow it for
colors, type, layout and motion whenever it edits the page. Keep `TEMPLATE.md` for the content swap:
ask the agent to work through its "Make it yours" list with your name, projects and links.
