# Slice: design system

## The idea

The territory is a radiology reading room after hours: one wall box left on, films clipped to its
rail. A light box is a lit white wall, so the page is light and the films are the only dark things
on it. The rail across the top is the metal bar the films clip to, with a lamp that is on.

The signature is the film in the first section (`figure#viewer`): two real CT scans, a walnut and
a young gar's head, read live from their voxels into three cuts and a fourth picture that turns.
Every other project hangs on the same wall as a film of its own.

Three choices hold it together (from `README.md`, "Why it looks this way"):

- **Type:** Atkinson Hyperlegible, because a film's burnt-in annotation is the one place where a 0
  must never read as an O. Its Mono keeps the numbers still while the slices move.
- **Color:** blue-black film base, and one fuchsia wax pencil. It is the one color no gray film
  contains, so a cut line or a circled finding can never be mistaken for the scan.
- **Light:** the wall glows (tubes behind a diffuser); the films are dark and carry the detail.

## Tokens

### Color (`:root` in `styles.css`)

| Token | Value | Role |
|---|---|---|
| `--wall` | `#eaf1f4` | The diffuser, lit from behind: the page background |
| `--glow` | `#fbfeff` | The brightest white: scan labels, stickers, and link text on a dark hover |
| `--ink` | `#0b1722` | Type on the wall |
| `--ink-2` | `#44586a` | Quieter type on the wall: dates, role lines, the footer |
| `--film` | `#0a1520` | Blue-black film base (the outer edge of each film's gradient) |
| `--film-2` | `#12283a` | The lighter center of each film's radial gradient |
| `--film-line` | `#2f4a61` | Rules, dashed dividers and outlines on film |
| `--on-film` | `#dcebf6` | Type on film |
| `--on-film-2` | `#8fb0c8` | Burnt-in annotation and captions on film |
| `--wax` | `#ff3ea5` | The wax pencil: cut lines, the ring, pressed buttons, focus on film |
| `--wax-deep` | `#b80f72` | The same pencil pressed hard enough to read on white: links and focus on the wall, tags |
| `--metal` | `linear-gradient(#dfe5e8, #a9b3b9 55%, #c7cfd3)` | The rail and the film clips |

Fixed colors outside the tokens: `#070e16` behind every picture (`.view`, `.ct canvas`,
`.real-frame`); `#23000f` for type on a wax-colored button; `#06101a` for the strike flash
(`body::before`); `#ff6bb9` for the hover on `#real-load`. The body adds a radial fall-off and
repeating vertical bands of white over `--wall`, fixed to the viewport, for the tubes.

Colors in the scripts (`main.js`): film is `FILM = [7, 14, 22]` and full light is
`LIGHT = [234, 245, 255]`; `gray(t)` runs between them with a 0.9 power. `STOPS`
(`#6e2a1e`, `#b5553f`, `#d99a76`, `#eedcbc`, `#fff8ea`) is the warm ramp behind the "Bone and
tissue colors" button. Histogram bars inside the window are `#d6e9f7`, outside it `#4d6a82`.

### Type

| Family (CSS name) | File | Axis | Role |
|---|---|---|---|
| Atkinson Hyperlegible Next (`'Atkinson Next'`, `--text`) | `assets/fonts/atkinson-hyperlegible-next-latin.woff2` (preloaded) | weight 200 to 800 | Names, headings, prose |
| Atkinson Hyperlegible Mono (`'Atkinson Mono'`, `--mono`) | `assets/fonts/atkinson-hyperlegible-mono-latin.woff2` | weight 200 to 800 | Burnt-in annotation, labels, buttons, numbers |

Fallbacks: `system-ui, sans-serif` and `ui-monospace, monospace`. Both faces use
`font-display: swap`.

| Use | Setting |
|---|---|
| Body | `400 1.0625rem/1.55` Next |
| `h1` (the name) | `800 clamp(3.5rem, 8.6vw, 7.6rem)/0.86`, letter-spacing `-0.055em`, no wrap |
| `.lede` | `600 clamp(1.45rem, 2.4vw, 2.1rem)/1.15`, `-0.02em` |
| `h2` (section names) | `800 clamp(2.6rem, 6.4vw, 5.2rem)/0.92`, `-0.045em` |
| `.film h3` | `800 1.5rem/1.1`, `-0.02em`; `clamp(1.8rem, 3vw, 2.6rem)` on `.film-wide`; `1.12rem` on `.film-last` |
| `.big` (project lede) | `clamp(1.15rem, 1.6vw, 1.35rem)/1.45` |
| `.interests li` | `700 clamp(1.25rem, 2.2vw, 1.75rem)/1.2`, numbered in Mono with `--wax-deep` |
| `.burn`, `.tag` | `500 0.74rem/1.35` Mono, uppercase, `0.07em` (0.68rem and `0.04em` under 560px) |
| `.rail` | `600 0.78rem/1` Mono, uppercase, `0.08em` |
| `.links a`, `.presets button` | `600` Mono at `0.8rem` and `0.74rem`, uppercase, pill-shaped |
| `.stickers a` | `700 0.9rem/1` Mono, uppercase, `0.08em` |
| `figcaption`, `.small` | `0.86rem/1.45` and `0.9rem`, in `--on-film-2` |
| `output` | Mono with `tabular-nums` |

### Space, shape and depth

- **Gutter:** `--gutter: clamp(16px, 4vw, 56px)`. Sections (`.exam`, `.series`, `.foot`) are at
  most `1400px` wide.
- **Film:** `border-radius: 12px`, padding `clamp(14px, 2vw, 22px)`, a radial gradient from
  `--film-2` to `--film`, and a three-part shadow: a faint inner edge
  (`inset 0 0 0 1px rgb(150 190 220 / 0.14)`), a white lip below (`0 1px 0 rgb(255 255 255 / 0.9)`),
  and a soft drop (`0 22px 38px -22px rgb(10 30 50 / 0.55)`).
- **Clips:** `.clip` and `.clip-2`, 58 × 27px in `--metal`, `top: -15px`, at 16% from each side.
- **Radii:** `3px` on pictures, `4px` on stickers and focus rings, `8px` on the peel films and the
  embed frame, `999px` on links and presets.
- **Tilt:** films hang slightly off true. In `.wall`, odd films turn `-0.35deg` and even ones
  `0.3deg`; `.film-wide` `0.25deg`; `.film-real` `-0.2deg`; scan labels `-1.5deg` and `1.2deg`;
  stickers `-1.2deg` and `1deg`; `.aside` `-1deg`.
- **Stickers:** `1.5px solid var(--ink)` with a hard `3px 3px 0` shadow that collapses to `1px 1px`
  on hover.

## Motion

| What | How |
|---|---|
| The box strikes (`body::before`) | `strike`, 1.1s linear, once: a dark flash that flickers off |
| The exam film hangs (`.film-exam`) | `hang`, 1.8s `cubic-bezier(0.2, 0.7, 0.2, 1)` after 0.5s, a swing that settles; `hang-small` under 980px |
| The wax circle on grooph (`.wax`) | `circle`, 6s ease-out, infinite: the stop is circled in pencil |
| The pulse on grooph (`.pulse`) | SVG `animateMotion`, 6s, around the loop |
| The ring on the contact sheet | `left` and `top` transition 0.18s |
| Peeling a film (`.layers li`) | transform 0.55s `cubic-bezier(0.3, 0.1, 0.2, 1)`, opacity 0.45s |
| Stickers | translate, shadow and background, 0.12s |
| Idle cut (script) | until a visitor moves a cut, the top-down slice drifts about the scan's starting slice: `start[2] + 0.3 · nz · sin(t / 2600)` |
| Idle sway (script) | the fourth picture sways `0.34` rad about where it rests; it starts again 4s after the last turn |
| Back projection (script) | the first time `#ct` is 40% on screen, the views count runs from 1 to 180 over 7s (quadratic) |

The idle motion runs only while the viewer is on screen and the tab is visible. It moves on every
second frame when the last cutaway took more than 20 ms, and every fourth when it took more than
40 ms.

**Reduced motion** (`prefers-reduced-motion: reduce`): the strike, the hang and the wax circle do
not run; the pulse is hidden; the peel, ring and sticker transitions are off; smooth scrolling is
off. In `main.js` there is no idle drift or sway, the back-projection toy opens at 180 views, and
choosing a slice on the contact sheet jumps instead of scrolling smoothly.

## Components and layout

- **`.rail`:** sticky header in `--metal`, with `.rail-name` (`.lamp`, a wax dot with a glow, and
  `.rail-text`) and `nav`. Under 560px the text hides and the links spread across.
- **`.exam`:** the first section. `.exam-words` is one column, then `auto minmax(0, 1fr)` from
  1000px, with `.who` (`.tag`, `h1`, `.lede`) and `.what` (bio, and `.how` with a wax rule on its
  left).
- **`.film`:** the card for everything. Variants: `.film-exam` (the viewer), `.film-text`,
  `.film-sheet`, `.film-ct`, `.film-atlas`, `.film-wide` (two columns), `.film-real`, and
  `.film-last` (no film: an outline in `--ink-2` on the wall, for the last, quietest entry).
- **`.burn`:** burnt-in annotation, uppercase Mono in `--on-film-2`, with `b` in `--on-film`.
- **The viewer:** `.burn-head` (the `.scans` labels, `#burn-title`, `#burn-pos`), `.panes` of
  `.row`s of `.pane[data-cut]`, each a `.view` (canvas, `.hair-v`, `.hair-h`, and `.scale` on the
  front cut) and a `.burn` readout; then `.window` (`.wedge` with `#hist` and the `.band` with two
  `.grip`s, `.sliders`, `.presets`, `#count`).
- **Pane sizing:** each `.pane` grows by `--a`, its picture's width over its height, so a row of
  pictures shares one height. Under 1000px they sit in two rows; from 1000px all four sit in one
  row, the turning picture last (`order: 4`).
- **`.series`:** each later section, with `.series-head` (`.tag`, `h2`, `.big`, `.links`, `.part`).
- **`.wall`:** a 12-column grid. From 900px: the first film spans 1 to 5, `.film-sheet` 6 to 12
  over two rows, `.film-atlas` 1 to 5 in row 2, and `.film-ct` the full width in row 3 with its own
  two columns. Below 900px every film spans all 12.
- **`.wall-small`:** `repeat(auto-fill, minmax(min(100%, 300px), 1fr))` for the smaller films.
- **Small pieces:** `.fields` (two dashed fields), `.recut` (Mono letters split by a wax rule),
  `.ring` (a hand-drawn wax ellipse), `.layers` (stacked films), `.ct` (two canvases and a slider),
  `svg.loop` (`.wire`, `.node`, `.node-stop`, `.wax`, `.pulse`).
- **`.report-grid`:** `1.15fr 1fr`, one column under 980px; `.interests` (numbered), `.history`,
  `.aside`.
- **`.stickers`:** film ID stickers for links. **`.foot`:** credits, at most `96ch` a line.
- **Without scripts:** `html:not(.js)` hides the panes, the window, `.how`, the scan labels, the
  ring, the CT toy and the embed frame, and `img.film-fallback` shows the walnut's contact sheet.

## Interaction

- **The three cuts** (`.pane[data-cut="top|front|side"] .view`, each `tabindex="0"`): a mouse cuts
  wherever it hovers. A finger cuts where it taps, or follows a drag once the drag is more sideways
  than up and down; an up-and-down swipe scrolls the page (`touch-action: pan-y`). Arrow keys move
  the two cut lines on that picture (Shift moves 10); Page Up and Page Down step the slice.
- **The fourth picture** (`.pane[data-cut="view"] .view`): a sideways drag turns it, half a turn
  across its width; Left and Right arrows turn it 5 degrees. `[data-mode]` buttons switch between
  the cutaway and the maximum-intensity picture.
- **The scan labels** (`[data-scan]`, `aria-pressed`): load and show a scan. While one loads,
  `#burn-pos` says so; if it fails, the other scan stays up.
- **The window:** drag the band to move it, or a grip to move one edge; or use `#level` and
  `#width`; or a preset (`[data-preset]`, `aria-pressed` follows the window). `#colors` switches the
  gray ramp for the warm one. `#count` (`aria-live="polite"`) says what share of the scan prints
  black, gray and white.
- **The contact sheet:** click a slice to hang it in the top-down cut; the page scrolls back to the
  viewer.
- **`#views`:** 1 to 180 views for the back-projection toy.
- **`#layers`:** each click peels the top film; after the last, a click brings them all back.
- **`#real-load`:** replaces itself with the Splashery iframe.
- On coarse pointers the grips widen to 36px, the band grows, and buttons reach 40 to 44px. On
  devices without hover, `.for-touch` text replaces `.for-mouse` text in the instructions.

## Keep it intact

- Do keep the wall light and the films dark. Content that is not on a film sits on the wall in
  `--ink`.
- Do keep wax for marks only: cut lines, the ring, the band, pressed states, focus, highlights. Use
  `--wax` on film and `--wax-deep` on the wall, where `--wax` is too light for type.
- Don't put the wax color, or any color, inside a picture of a scan. Pictures are gray (or the warm
  ramp, on request), so the pencil stays readable on top of them.
- Do set annotation in uppercase Mono with tracking, and numbers that change in `tabular-nums`.
- Do keep the tilts small (under half a degree on films) and the clips on the films that hang.
- Don't resample the scans. Each contact sheet is every slice at its own size, 8-bit gray, and the
  page reads its volume from those pixels.
- Do keep `touch-action: pan-y` on every picture, so a phone can still scroll past the viewer.
- Do keep the reduced-motion path and the no-script fallback.

## Using this with an AI coding agent

Put this `DESIGN.md` in your project and tell Claude Code (or another coding agent) to follow it
for colors, type, layout and motion whenever it changes the page. Keep `TEMPLATE.md` for the
content swap: it lists where each personal detail lives.
