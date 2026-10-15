# Anagram Tiles: design system

## The idea

**Signature.** A name as a row of letter tiles that rearrange, by drag, by typing or by button,
into its real anagrams. Under the tiles, a dictionary gloss names whatever the row spells, and a
shelf shows the arrangement between its alphabetical neighbors among every ordering of the letters.

**Territory.** Word-game tiles on a drenched blue table: white tiles with a thick bottom edge and a
small number in the corner (the letter's place in the alphabet), one lime accent, and a dictionary's
voice. Every section heading is an entry with its part of speech (`work` *noun*, `contact` *verb*).
The stylesheet's own summary: "One variable family (Recursive), one drenched blue, one loud accent."

The rest of the page borrows the tiles: the Ars Magna plate is a second tile row, the Amordle plate is
a staircase of word-game tiles, and the contact links and the floating dock are white tiles with the
same bottom edge.

## Tokens

All tokens are custom properties on `:root` in `styles.css`. Colors are OKLCH; the blues, the ink
and the grays share hue 264.

### Color

| Token | Value | Role |
|---|---|---|
| `--blue` | `oklch(0.44 0.21 264)` | Hero and contact background, link underline, part-of-speech labels, `.plate__tag` |
| `--blue-hi` | `oklch(0.52 0.22 264)` | Center of the hero and footer radial gradients |
| `--blue-lo` | `oklch(0.34 0.18 264)` | Edge of those gradients |
| `--navy` | `oklch(0.19 0.06 264)` | Amordle plate background |
| `--lime` | `oklch(0.91 0.2 123)` | The one accent: Rearrange button, lit and typed tiles, pips, selection, focus ring on blue, active dock link, link hover |
| `--lime-lo` | `oklch(0.74 0.19 123)` | The button's bottom edge |
| `--sky` | `oklch(0.84 0.09 240)` | Amordle "present" tiles (class `y`) |
| `--white` | `#fff` | Page background, tile faces, dock, contact pills |
| `--ink` | `oklch(0.2 0.045 264)` | Text, heavy 3px rules |
| `--ink-2` | `oklch(0.41 0.045 264)` | Secondary text, tile corner numbers |
| `--rule` | `oklch(0.89 0.02 264)` | 1px hairlines |
| `--wash` | `oklch(0.962 0.014 264)` | Research section background, index row hover |
| `--tile-edge` | `oklch(0.8 0.045 264)` | The solid bottom edge under tiles, the dock and contact pills |

Values used directly in rules: `oklch(0.93 0.04 264)` for secondary text on blue,
`oklch(0.95 0.03 264)` for the gloss definition, `oklch(1 0 0 / 0.22)` for unlit pips,
`oklch(0.13 0.035 264)` for the Splashery plate, `oklch(0.3 0.07 264)` for empty Amordle tiles, and
`#2b45d4` as the `theme-color`. The Splashery canvas paints with `#d9f55a`, `#ffffff`, `#9fd0ff`,
`#4f6bff` and `#ff8fb8` (`colors` in `splats()`).

### Type

One family: **Recursive**, `assets/fonts/recursive-latin.woff2`, declared with
`font-weight: 300 1000` and `font-style: oblique 0deg 15deg`. The file's axes are `MONO` 0 to 1,
`CASL` 0 to 1, `wght` 300 to 1000, `slnt` −15 to 0 and `CRSV` 0 to 1.

The axes are registered with `@property` as `--mono` (initial 0), `--casl` (0), `--crsv` (0.5) and
`--slnt` (0), and every element gets
`font-variation-settings: "MONO" var(--mono), "CASL" var(--casl), "CRSV" var(--crsv), "slnt" var(--slnt)`.
So a rule sets an axis by setting the property, and it inherits and animates.

- Tiles, initials, readouts, labels: `--mono: 1`, heavy weights (tiles 900).
- Italic voice: `i` and `em` are reset to `font-style: normal`; "italic" text sets `--casl: 1` and
  `--slnt: -15` instead (part-of-speech labels, `.gloss__pos`, `.also dt`, `.colophon i`).
- State on the tiles: `.tiles[data-state="anagram"]` sets `--casl: 1; --slnt: -9` (the letters
  loosen when the name becomes a joke); `[data-state="scramble"]` sets `--casl: 0.5`; the name itself
  is upright and linear.

| Step | Value | Used for |
|---|---|---|
| `--step-0` | `clamp(1rem, 0.96rem + 0.2vw, 1.125rem)` | Body (weight 400, line-height 1.6) |
| `--step-1` | `clamp(1.15rem, 1.05rem + 0.5vw, 1.45rem)` | Hero lede, gloss, intro, `.plate__tag`, `.head p` |
| `--step-2` | `clamp(1.4rem, 1.2rem + 1vw, 2rem)` | Index titles, `.also dd`, contact pills |
| `--step-3` | `clamp(1.9rem, 1.4rem + 2.2vw, 3.25rem)` | Plate titles, interests, post titles |
| `--step-4` | `clamp(2.6rem, 1.6rem + 4.6vw, 5.5rem)` | Section `h2`: weight 900, line-height 0.95, letter-spacing −0.035em |

Tile letters are sized from the tile unit: `font-size: calc(var(--u) * 0.6)`.

### Spacing, radii, borders, shadows

- `--gutter: clamp(1rem, 4vw, 3rem)`; `.wrap` is `min(100% - 2 * var(--gutter), 78rem)` wide.
- Sections: `padding-block: clamp(4.5rem, 11vw, 9.5rem)`; `.head` bottom margin
  `clamp(2.5rem, 7vw, 5.5rem)`.
- The tile unit `--u` is set in pixels by `TileRow.measure()`; a tile is `0.92u` square, a word space
  is `GAP = 0.5` units, stacked lines are `LEADING = 1.1` units apart.
- Radii: tile `calc(var(--u) * 0.13)`; button `0.85em`; plate art `clamp(1rem, 2vw, 1.75rem)`; dock
  `0.95rem` (links `0.65rem`); contact pills `0.5em`; pips `0.2rem`.
- Borders: hairlines are `1px solid var(--rule)`; section rules are `3px solid var(--ink)`.
- Shadows are physical edges, not glows. Tile:
  `0 calc(u * 0.065) 0 var(--tile-edge), 0 calc(u * 0.16) calc(u * 0.26) oklch(0.16 0.12 264 / 0.42)`
  (a held tile scales to 1.08 and its soft shadow deepens). Button: `0 0.28em 0 var(--lime-lo)`.
  Dock: `0 0.22rem 0 var(--tile-edge), 0 0.9rem 2rem oklch(0.2 0.1 264 / 0.2)`. Contact pills:
  `0 0.2em 0 var(--tile-edge)`.
- Layers: `--z-art: 1`, `--z-held: 5`, `--z-nav: 10`, `--z-skip: 20`.

### Themes and editions

One theme, light, with the blue hero and footer. There is no dark mode and no switch.

## Motion

Easing: `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)` for CSS transitions; tile hops and waves use
`cubic-bezier(0.3, 0.7, 0.3, 1)`.

- **Tiles slide** to their slots with `transform 0.75s var(--ease-out)`, staggered per tile by
  `transitionDelay` (38 ms in the hero, 30 ms on the Ars Magna plate).
- **Hop** (`hop()`): during a rearrangement, tiles moving right arc over the row and tiles moving
  left duck under it, rotating 7 degrees, over 750 ms.
- **Drop-in** (`dropIn()`): on load, tiles fall from `translateY(-140%) rotate(-9deg)` over 800 ms,
  60 ms apart.
- **Cheer** (`cheer()`): when a visitor finds a phrase by hand, the faces turn lime for 1.1 s and a
  wave runs down the row (520 ms per tile, 55 ms apart).
- **Typing**: a placed tile hops, or nudges down 9% for 220 ms if it did not move.
- **Rank**: `#rank` counts to its new value over 650 ms (ease-out quartic) and the shelf repaints
  every frame, like an odometer.
- **Demo**: the row spells MAY PRANK at 2.1 s and the name again at 5.2 s, unless touched.
- **Ars Magna plate**: flips every 4.2 s while half in view, until the visitor presses on its tiles.
- **Splashery plate**: the blob turns continuously while visible; poked splats spring home.
- **Swap line**: the lime chip changes word every 1.9 s with a 0.5 s `turn` (rotateX from 80deg).
- **Amordle stairs**: each tile flips in once (`flip`, 0.7 s, delay `--r * 110ms + --i * 45ms`).
- **grooph graph**: the loop edge marches (`march`, 1.1 s) and a token runs the path (5.2 s).
- **Dock**: slides in over 0.55 s once the hero has scrolled away.
- **Hover**: tiles lift 5%; the button rises and its arrows turn 180 degrees; nav underlines grow;
  `.link` underlines thicken into a lime highlighter; post rows fill blue; contact pills turn lime
  and loosen (`--casl: 1; --slnt: -9`).

**Reduced motion.** CSS cuts every animation and transition to 0.01 ms and turns off smooth
scrolling. In `main.js`, `hop`, `dropIn` and the cheer wave are skipped (the lime flash stays), the
rank jumps to its value, the demo does not run, the Ars Magna plate does not flip by itself, the
splat blob draws one still frame, the swap line shows all five words, and `watch()` removes the
grooph `<animateMotion>`.

## Components and layout

- **Hero** (`.hero`): full viewport (`min-height: 100svh`), a grid of four rows: `.nav`,
  `.hero__stage` (lede, `.tiles#name-tiles`, `.gloss`, `.hero__controls` with `.btn#rearrange` and
  `.found` pips), `.shelf` (a masked strip of 27 orderings, the current one `.is-here` in lime), and
  `.hero__foot` (intro and inventory, `1.5fr` and `1fr`).
- **TileRow** (`main.js`): the tile engine. `.tiles` holds absolutely placed `.tile` elements, each
  with a `.tile__face`. Position comes from `--x` and `--y` in tile units times `--u`. State classes:
  `.is-ready`, `.is-stacked`, `.is-lit`, `.tile.is-held`, `.tile.is-typed`.
- **Dock** (`.dock`): a fixed white pill of section links, hidden and `inert` while the hero is in
  view, `.is-on` after; the link for the section in view gets `aria-current`.
- **Section head** (`.head`): two columns, the `h2` entry with its part of speech in `<i>`, and a
  lede.
- **Plate** (`.plate`): a 12-column grid; text spans 5 columns, art spans 7, and even plates swap
  sides. Text: `h3`, `.plate__tag`, `.plate__desc`, `.plate__meta` (mono), `.links`. Art:
  `.plate__art` plus one of `.art--splash`, `.art--grooph`, `.art--ars`, `.art--amordle`.
- **Link** (`.link`): bold, a 2px blue underline drawn as a background, and a `↗` added by
  `::after`.
- **Index** (`.index`): rows of three columns (`7fr 11fr 8fr`): name, description, links.
- **Research**: `.study` (`5fr 7fr`) with `.study__prose` and the `.interests` list; `dl.also` with
  the `.swap` chip and the `.crescendo` (three sizes of the same phrase).
- **Posts** (`.posts`): full-width rows (`7fr 5fr auto`) that fill blue on hover.
- **Contact** (`.contact`): the blue footer, `.elsewhere` pills that look like tiles, `.colophon`.
- **Breakpoints**: at `56rem` every two-column block becomes one column and plate art moves above
  its text (`order: -1`); at `30rem` the dock and nav tighten and the interest labels hide. The hero
  row stacks one word per line below 560 px (`stackBelow`).

## Interaction

- **Drag**: pressing a tile captures the pointer; the tile follows it, and the row reorders live to
  the nearest slot. On release, `settle()` looks the letters up in `ENTRIES`. Tiles use
  `touch-action: pan-y`, so a vertical swipe still scrolls; stacked rows use `none`.
- **Type**: while at least 40% of the hero row is in view, letter keys place matching tiles left to
  right and Backspace takes the last one back. Keys with Cmd, Ctrl or Alt, and keys typed into form
  fields, are ignored. The hint ", or just type" shows only on devices with a fine pointer and hover.
- **Rearrange**: moves to the next phrase not yet found, then cycles.
- **Found**: pips and the count show progress, saved in `localStorage`.
- **Ars Magna plate**: click the panel (not a tile) to flip; tiles can be dragged too.
- **Splashery plate**: pointer movement or a press pushes the splats away; on touch, lifting the
  finger releases them.
- **Focus**: a 3px lime outline, blue inside `main` and on the dock. A skip link leads to `#work`.
- **Screen readers**: the tiles are `aria-hidden`; `h1.sr-only` carries the name and the `.gloss`
  paragraph is `aria-live="polite"`, so each new word and definition is announced.

## Keep it intact

- Do keep one blue field and one lime accent. A second accent color breaks the territory.
- Do keep the tile recipe together: white face, `--tile-edge` bottom edge, soft blue drop shadow,
  rounded corners at 0.13 of the unit, the alphabet number in the corner.
- Do express state through Recursive's axes (`--casl`, `--slnt`, `--mono`), not through new colors
  or a second typeface.
- Do keep the dictionary voice in headings: a lowercase word plus its part of speech.
- Do keep every phrase an exact anagram of the name; the page's claim is that the letters never
  change.
- Don't use `font-style: italic`; the CSS resets `i` and `em` and slants with `--slnt`.
- Don't replace the solid edge shadows with blurred glows; the edge is what makes a tile a tile.
- Don't remove the reduced-motion branches in `main.js` or the media query at the end of
  `styles.css`.
- Don't take the `aria-hidden` tiles' text out of the `h1` and `.gloss`.

## Using this with an AI coding agent

Put `DESIGN.md` in your project and tell Claude Code (or another coding agent) to follow it for
colors, type, layout and motion whenever it edits the page. Keep `TEMPLATE.md` for the content swap:
ask the agent to work through its "Make it yours" list with your name, anagrams, projects and links.
