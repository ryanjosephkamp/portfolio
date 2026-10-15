# Arcade: design system

## The idea

The territory is a vector arcade monitor: bright lines on black glass. A vector tube's beam draws
each line directly, so there are no pixels to show and no scanlines (the first comment in
`styles.css` says so). Everything on the page is drawn the way that tube would draw it: lines in
one mint phosphor, a soft afterglow, and one hot red for the ball.

The signature is the cabinet at the top (`#monitor`): a brick-breaker whose wall is the name, built
from a stroke font in 32 strokes. Three rule switches make eight rule sets, each with its own score
table and a house score to beat, and a View switch tips the board into 3D without touching the
rules. The rest of the page is a floor of cabinets (`.section`, "Cabinet 01" to "Cabinet 04", then
"Also on the floor"), each with a small playable plate, and ends on "Insert coin" and "Continue?".

## Tokens

### Color (`:root` in `styles.css`)

| Token | Value | Role |
|---|---|---|
| `--glass` | `#040706` | Black glass: the page ground, and type on a lit (filled) control |
| `--glass-2` | `#0a100e` | Defined, but no rule in `styles.css` reads it |
| `--p` | `#7dffc6` | The phosphor: headings, links, the wall, values, lit segments |
| `--p-soft` | `#b9f5dc` | Readouts on plates, `code`, the score table's House column |
| `--p-dim` | `#4f9c7d` | Labels, borders, nav links, the switch names |
| `--p-faint` | `#1d3a30` | Hairlines and frames: section rules, table rows, the shelf's grid |
| `--hot` | `#ff4a3d` | The ball, and anything you can lose: Start, switches that are on, section numbers, the focus ring, "present" letters |
| `--text` | `#c5dcd2` | Body copy |
| `--glow` | `0 0 10px color-mix(in srgb, var(--p) 55%, transparent)` | The phosphor glow, as a `text-shadow` |
| `--pad` | `clamp(16px, 4vw, 40px)` | Side padding of `.wrap` |

Fixed colors outside the tokens: `#e2f1ea` for lead type (`.panel__lede`, `.head__tag`); `#8fa9a0`,
`#9db5ab`, `#a9c1b7` and `#7d968d` for quieter text; `#0b1411`, `#0c1713` and `#08100d` for hover
and current-row grounds; `#050908` inside plates; and the monitor's own gradient (`#0b1512` to
`#050908` to `#020403`) with a `#1b2c26` border.

The game canvas does not read the tokens. `main.js` sets `MINT = "#7dffc6"`, `DIM = "#2f6d56"` and
`HOT = "#ff4a3d"`; change them with `--p` and `--hot`.

### Type

| Family | File | Axis | Role |
|---|---|---|---|
| Martian Mono | `assets/fonts/martian-mono-latin.woff2` (preloaded) | weight 100 to 800 | Everything |

The file is the SemiExpanded width of Martian Mono and carries only a weight axis. `body` sets
`font: 400 15px/1.7 "Martian Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace` and
`font-stretch: 87.5%`. Weights in use: 200, 300, 400 and 500.

| Use | Setting |
|---|---|
| Body | 15px, line-height 1.7 (14px under 520px) |
| `.monitor__still` (the name without scripts) | `clamp(40px, 9vw, 96px)`, weight 200, `0.16em` |
| `.panel h1` | `clamp(34px, 5.4vw, 68px)`, line-height 1, weight 300, `0.08em` |
| `h2` | `clamp(30px, 5.2vw, 58px)`, line-height 1.15, uppercase, `0.06em`, `--p` with `--glow` |
| `.head__tag`, `.panel__lede` | `clamp(15px, 1.4vw, 18px)` and `clamp(15px, 1.35vw, 17px)` |
| Small copy (`.game p`, `.board p`, `.plate__read`, `.tables__text p`) | 12.5px to 13.5px |
| Labels (`.btn`, `.link`, `.rule span`, `.specs dt`, `.slots a`, nav) | 11px to 12.5px, uppercase, `0.12em` to `0.16em` |
| `.head__no` | 11px, uppercase, `0.24em`, in `--hot` |

**Stroke headings.** Every `[data-vec]` heading (the `h1` and each section `h2`) is redrawn by
`main.js` in the same stroke font as the wall (`GLYPHS` in `game.js`: each glyph a few polylines on
a grid 4 wide and 6 tall). Each word becomes an SVG `1em` tall; `.vec path` is stroked in `--p` at
`2.2px` (`vector-effect: non-scaling-stroke`) with a `drop-shadow(0 0 5px ...)` glow, and the text
stays in an `.sr-only` span. Ars Magna's letters on its plate use the same stroke font.

### Space, shape and depth

- **Width:** `.wrap` is at most `1200px`, padded by `--pad`.
- **Sections:** `padding-block: clamp(56px, 8vw, 112px)` and a `1px solid var(--p-faint)` top rule.
- **The monitor:** `aspect-ratio: 27 / 32`, at most `min(82vh, 760px)` tall, `border-radius:
  26px / 30px` (18px under 520px), a radial ground, and a stack of shadows: `inset 0 0 60px #000`,
  `inset 0 0 0 6px #070b0a`, `0 0 0 1px #000`, and a mint spill below
  (`0 30px 80px -30px` at 22%). `::after` lays a diagonal sheen of white across it, the glass.
- **Plates:** `.plate` has a `1px` `--p-faint` border, a radial ground and `border-radius: 14px`.
- **Controls:** square-cornered (`border-radius: 2px` on `.btn`); `.btn` and `.seg` buttons are at
  least 44px tall. Hover lights
  them with an outer and inner glow (`0 0 14px -2px var(--p), inset 0 0 12px -6px var(--p)`), red
  for `.btn--start`.
- **Lists:** the shelf (`.games`) is a hairline grid: cards on `--glass` with 1px gaps over
  `--p-faint`. `.board` numbers its rows with a `decimal-leading-zero` counter.

### The game field

The rules live in `game.js` on a field `W` 100 by `H` 120 units, stepped at `DT = 1/120` s. The
paddle sits at `PADDLE_Y` 108 with half-width `HW` 9; the ball's radius is `BALL_R` 1.3. The wall is
`ROWS` laid out in `CELL` (`w` 16, `h` 22, `gap` 6, `top` 14, `lead` 30).

`draw()` in `main.js` paints with `globalCompositeOperation = "lighter"` and round caps. Every batch
of lines is stroked twice, once five times as wide at 16% opacity (the bloom) and once at its own
width. Rails, strokes and the paddle are `MINT` at 1.5; walls that wrap and the floor are `DIM`;
falling shards are `MINT` at 55%, or `HOT` when catching them scores; sparks are `HOT`; the ball is a
`HOT` circle with a 7px halo. In 3D the board tips back by up to `TILT` 0.95 rad with perspective
`D` 230, and every stroke stands up into a fin.

## Motion

| What | How |
|---|---|
| Afterglow | each frame fades the last by `rgba(0,0,0,0.38)` (`destination-out`) instead of clearing it |
| The game | fixed steps of 1/120 s, at most eight per frame, frames capped at 0.05 s |
| Attract mode | the house plays itself (`autopilot()`) until Start; it returns 3.5 s after a house game ends, or 12 s after yours |
| The View switch | eases toward 2D or 3D at a rate of `dt × 5` a frame |
| Sparks | five per broken stroke, gone in 24 frames |
| `.monitor__msg.blink` | 1.4s `steps(2, jump-none)`, infinite |
| `.btn`, `.rule`, `.slots a` | border, glow and background, 0.15s |
| The shelf in 3D | each icon tips by `perspective(260px) rotateX(52deg) scale(1.08)`, 0.6s `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| Ars Magna | each letter moves 0.9s `cubic-bezier(0.3, 0.9, 0.3, 1)` |
| Amordle | tiles and keys color in 0.2s; a refused guess shakes the row (`nope`, 0.28s); a GO chain moves on after 1.6 s |
| grooph's loop | the token runs build 0.9s, to check 0.7s, check 0.9s, back 1.1s, to you 0.7s, with a smooth step |

The cabinet draws only while it is on screen, and the loop token runs only while its plate is.
Sound is off until the Sound switch is on, and plays only in a visitor's own game: short Web Audio
blips.

**Reduced motion** (`prefers-reduced-motion: reduce`): the house sits still instead of playing, the
canvas clears each frame instead of fading, the View switch snaps, sparks and the row shake are off,
the message does not blink, the CSS transitions on buttons, rules, icons, letters, tiles and keys
are off, and smooth scrolling is off. The loop plate opens at its last step (lap 3, at the person).

## Components and layout

- **`.nav`:** `.nav__mark` (initials in a box) and a list of section links, uppercase 12px.
- **`.cabinet`:** two columns, `minmax(0, 0.92fr) minmax(0, 1fr)`: the `.monitor` (with
  `canvas#screen`, `.monitor__still`, `.monitor__msg`, `.monitor__hud`) and the `.panel` (`h1`,
  `.panel__lede`, `.panel__how`, `.controls`, `fieldset.rules`).
- **`.btn`:** a square outline button. As a switch (`role="switch"`) it holds a `span` (the name,
  in `--p-dim`) and a `b` (the value, red when `aria-checked="true"`). `.btn--start` is red.
- **`.rule`:** a switch row of three columns (`8.5em 9em 1fr`): name, value, and an `i`
  description; a left border that turns red when the rule is on.
- **`.tables`:** the text and `table.scores` (Set, Walls, Gravity, Shards, House, You); the row in
  play is `.is-on`, and a best that beats the house is `.you.beat`.
- **`.section` > `.wrap`:** `.head` (`.head__no`, `h2[data-vec]`, `.head__tag`), then text and
  `.links` (each `.link` ends in a red " >").
- **`.lead` and `dl.specs`:** text and a spec sheet, `1.3fr` and `1fr`.
- **`.shelf`:** `.shelf__bar` (`h3` and a `.seg` toggle) over `ul.games` of `li.game` cards.
- **`.duo`:** text beside a `.plate`, `1fr 1fr`; `.duo--flip` puts the text second.
- **`.plate`:** a framed panel with an SVG or a game, `.plate__read` (a live readout) and
  `.plate__keys`. Inside the Amordle plate: `.slide` ranges, `.amo__status`, `.amo__board` of
  `.amo__row`s (tiles size with container query units), `.amo__suggest`, `.amo__keys`, and
  `.pools` (ten columns).
- **`ol.board`:** a ranked list: a counter, a red `.board__tag`, and the entry.
- **`ul.stats`:** each research interest with a segmented bar; the first is red.
- **`footer.credits`:** `ul.slots` (link slots with a mint left edge) and `.colophon`.
- **Under 900px:** every two-column grid becomes one column, the text of a flipped `.duo` goes back
  first, and each `.rule` puts its description under its name and value.
- **Under 520px:** body type drops to 14px, the score table hides its Walls, Gravity and Shards
  columns, `.board__tag` hides, and the Amordle keys shrink.
- **Without scripts:** `.monitor__still` shows the name in type, and `.amo__nojs` says the round
  needs JavaScript.

## Interaction

- **The cabinet** (`#monitor`, `tabindex="0"`): the pointer or a finger moves the paddle (the page
  works out where the pointer is on the tipped board in 3D); a click or tap serves, and starts a
  new game if no game of yours is running. Up-and-down swipes still scroll the page (`touch-action: pan-y`).
- **Keys** (while the cabinet is on screen, and not while typing in a field): Left or A and Right or
  D move the paddle; Space or Enter serves when the page or the monitor has focus. `#start` starts
  a game and focuses the monitor.
- **Rules:** each `.rule` (`data-bit` 1, 2 or 4) flips one bit of the rule set; each table row's
  button jumps to its set. Flipping a rule mid-game keeps the game going but marks it unranked, and
  its score is not saved.
- **Scoring:** 10 points a stroke times a combo that grows to 8 and resets at the paddle; 25 for
  each shard caught when Shards is on; clearing the name adds 100 for each ball left and 5 for each
  second under 100.
- **Switches:** `#view` (2D, 3D) and `#sound` (off, on) are `role="switch"` buttons with
  `aria-checked`. The shelf's `.seg` buttons use `aria-pressed`.
- **Amordle:** type while the board (or a key) has focus, or while nothing has focus and the plate
  is on screen; Backspace deletes, Enter guesses. The on-screen keys do the same. Past five letters,
  two typed letters bring up to six suggestions. The length slider deals a new round after 250 ms;
  Mode and Hard Mode deal one at once.
- **grooph:** Send it back, Accept, and the Stop switch. **Ars Magna:** Rearrange.
- The focus ring is `2px solid var(--hot)` with a 3px offset (6px on the Amordle board).

## Keep it intact

- Do draw with lines: strokes with round caps, glowing by `text-shadow`, `drop-shadow` or the double
  stroke on the canvas. Don't add fills, gradients on type, or scanlines.
- Do keep two colors: mint for the machine, red for the ball and what can be lost or switched on.
  Don't add a third hue.
- Do keep one typeface, monospace, with small labels in tracked uppercase.
- Do keep `[data-vec]` headings to the characters `GLYPHS` can draw.
- Do keep `game.js` free of the page: pure, stepped and seeded. After any change to the rules, the
  wall or the house, run `node check.mjs` and copy the scores it reports into `HOUSE` and the table.
- Do keep the switches as `role="switch"` buttons with a name and a value, and the eight-table rule:
  a score is only compared with scores from the same rules.
- Do keep the afterglow and the reduced-motion path.

## Using this with an AI coding agent

Put this `DESIGN.md` in your project and tell Claude Code (or another coding agent) to follow it
for colors, type, layout and motion, and to run `node check.mjs` after touching `game.js` or the
score table. Keep `TEMPLATE.md` for the content swap: it lists where each personal detail lives.
