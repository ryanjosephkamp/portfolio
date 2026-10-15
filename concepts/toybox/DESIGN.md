# Toy Box: design system

## The idea

**Signature.** The owner's name as a toy made of Gaussian splats. A visitor spins it, pokes it,
paints it, drops it and blows on it, hears a note for each letter, and copies a link that holds the
whole scene: the toy, its paint and the way it is turned.

**Territory.** A loud, saturated toy shop. The page is packaging: the hero is a blister pack with a
hang hole (`.pack`, `.pack__hole`), a brand line and a "Contents" label; the tools are stickers;
the stage behind the toy is a teal sunburst; the page itself is a yellow board with white polka
dots. Section tags speak like a box ("What's in the box", "Also on the shelf", "The serious sticker",
"Peel one off", "Take it home", "Unwrap it here", "Wash it off").

The toy is this page's own small WebGL2 renderer: flat Gaussian discs, counting-sorted back to front
every frame and simulated on the CPU (`README.md`). It is not Splashery's engine.

## Tokens

All tokens are custom properties on `:root` in `styles.css`. Colors are flat hex values; the only
translucent colors are in the dot patterns, the stage's glow and the contact stickers' shadow.

### Color

| Token | Value | Role |
|---|---|---|
| `--ink` | `#1b1036` | Text, every outline, every hard shadow, the contact band, pressed stickers' fill |
| `--paper` | `#fffdf5` | The pack, the sticker's die-cut edge, chips, the paper band, text on violet and ink |
| `--yellow` | `#ffd60a` | Page background, `theme-color`, the hang hole, the no-JavaScript name, text on pressed chips, the "My part" panel |
| `--pink` | `#ff3d8b` | The RK badge, the pink band, the Spin sticker, slider accents |
| `--teal` | `#00b8bd` | The stage sunburst, the Splashery band |
| `--teal-deep` | `#00a3ad` | The sunburst's alternate rays |
| `--orange` | `#ff6a1f` | The Paint sticker, cards and stickers |
| `--violet` | `#6a2cff` | The Drop sticker, cards and stickers (with `--paper` text) |
| `--sky` | `#96f0ff` | The Blow sticker, cards and stickers |

Per-element custom properties do the rest: `--c` (fill), `--fg` (text color) and `--tilt` (rotation)
are set inline on cards, interests and contact stickers, or by the `.st--*` classes.

Colors in `main.js`: `C` holds the toys' colors as 0 to 1 RGB (pink, yellow, white, orange, violet,
ink, sky, and `dough` for the donut); `LETTER_COLORS` and `LETTER_CSS` color the name's letters
yellow, pink, white, orange, white, orange, pink, yellow. `PAINTS` in `scene.js` holds the eight
paint swatches: pink, yellow, white, orange, violet, ink, sky and red `[232, 28, 46]`. The painted
count on the Contents label is `#c2185b`. A video is recorded on a solid teal clear color.

### Type

One family: **Fredoka**, `assets/fonts/fredoka-latin.woff2`, declared `font-weight: 300 700` and
`font-stretch: 75% 125%` (its axes are `wght` and `wdth`). `--font` is
`Fredoka, 'Arial Rounded MT Bold', 'Helvetica Neue', system-ui, sans-serif`. The toy's letters are
sampled from Fredoka 700 at 200 px, so the page and the toy share their shapes.

- Body: `500 clamp(1rem, 0.96rem + 0.22vw, 1.14rem)/1.5`.
- Display type is bold and a little wide: section `h2` at `clamp(2.6rem, 1.6rem + 5.4vw, 6rem)`,
  weight 700, `font-stretch: 112%`, line-height 0.95; card and panel titles at stretch 112%; the
  pack's brand at 118%, uppercase.
- The no-JavaScript name (`.stage__name`): `clamp(3.4rem, 15vw, 11rem)`, stretch 110%, uppercase,
  yellow with a 3px ink stroke and a `6px 8px 0` ink text shadow, like a die-cut sticker.
- Sticker buttons: `clamp(1rem, 0.9rem + 0.7vw, 1.4rem)`, weight 700, stretch 112%.
- Labels (`.shelf__label`, `.head__tag`, the Contents head): uppercase, 0.78 to 0.82em, letter-spacing
  0.08 to 0.12em, weight 700.
- Code, the covariance readout and the QR art use `ui-monospace, Menlo, monospace`.

### Spacing, radii, borders, shadows

- `--pad: clamp(16px, 4vw, 40px)`; `.wrap` is `min(100%, 1240px)` wide with `--pad` inside.
- Bands: `padding-block: clamp(48px, 8vw, 100px)` and a 4px ink top border.
- `--line: 3px`: the standard outline. Big panels (the pack, the stage, the embed, `.box__role`,
  `.one`) use 4px.
- **The sticker** is the one surface recipe, shared by `.st`, `.chip`, `.card`, `.interests li`,
  `.elsewhere a` and `.nav__mark`: `border: var(--line) solid var(--ink)` and
  `box-shadow: 0 0 0 4px var(--paper), 0 0 0 calc(4px + var(--line)) var(--ink), 6px 9px 0 4px var(--ink)`:
  an ink line, a paper die-cut edge, an ink outline, and a hard shadow down and to the right.
  Chips use a lighter `3px 4px 0 var(--ink)`; panels use `8px 10px 0 var(--ink)`; the pack
  `clamp(6px, 1vw, 12px) clamp(8px, 1.3vw, 16px) 0 var(--ink)`. No shadow is blurred.
- Radii: `999px` for stickers, chips, tags and pills; 22px cards; 24px embed and "My part" panels;
  28px for `.one`; 14px for `.art`; `clamp(16px, 2.4vw, 28px)` for the stage;
  `clamp(22px, 3.4vw, 40px)` for the pack.
- Tilts: stickers and cards lean between −3 and 2.5 degrees (`--tilt`); the RK badge −8.
- Patterns: the body's white dots (`2.4px` on a `24px` grid), the paper band's ink dots at 9% (`22px`
  grid), the stage's `repeating-conic-gradient` of 9-degree teal rays with a soft white glow.

### Themes and editions

One theme, with color bands down the page: `.band--teal` (Splashery), `.band--paper` (the shelf),
`.band--pink` (research) and `.band--ink` (contact, where the tag turns yellow on ink and the focus
outline turns paper). There is no dark mode. The splat count has five tiers (12,000 to 192,000),
picked for the device and stepped with **Fewer** and **More**.

## Motion

- **Stickers**: `.st` moves in 0.14s and chips in 0.12s. Hover lifts a sticker 3px; pressing, or
  being the active tool (`aria-pressed="true"`), pushes it `4px 6px` into its shadow, which shrinks
  to `2px 3px`. An active sticker swaps colors: ink fill, its own color for the text.
- **The toy** (simulated in `step()` in `main.js`):
  - Splats spring home with stiffness `K = 46` and damping `DAMP = 5.5`.
  - **Drop**: each splat lets go after a random delay of up to 0.7 s, falls under `GRAV = 7`, and
    bounces on a floor near the bottom of the stage with a little random scatter. Drop again and
    they spring back.
  - **Poke**: a ring expands from the touched splat at 3.4 units a second for 1.4 s, pushing splats
    outward as it passes.
  - **Blow**: a gust pushes splats away from the pointer, with a flutter.
  - **Paint**: painted splats jump a little.
  - **Idle**: 2.6 s after the last touch, the name and a visitor's picture sway gently from side to
    side, and the donut, knot and planet turn at a steady rate; a flick coasts and slows
    (`exp(-2.2 t)`).
  - **New toy**: its splats fly in from a scatter.
- **Shelf art** (CSS keyframes): `travel` 6s (the grooph token), `grow` 5s (the list), `sweep` and
  `blip` 4s (resmon's radar), `flip` 4.5s staggered 0.28s (Amordle), `fall` and `land` 3s (Link
  Meteor), `review` and `stack` 4.8s (reword_nerd). Ars Magna's tiles slide over 0.9s on
  `cubic-bezier(0.6, -0.3, 0.3, 1.3)` when `arsMagna()` toggles `.is-b` every 2.6 s; the QR art's
  letters change every 2.4 s.
- **Small things**: the stage hint fades over 0.4s; contact stickers straighten and grow to 1.08 on
  hover; links fill with ink and turn yellow on hover.
- **Pace**: when frames average over 38 ms for a couple of seconds, a count nobody picked steps down
  a tier.

**Reduced motion.** CSS turns off every animation and transition and smooth scrolling. In
`main.js`, a new toy appears in place without the scatter, the toy does not sway or turn by itself,
and the QR letters and Ars Magna tiles stay still. The toy still moves when the visitor acts on it.

## Components and layout

- **Nav** (`.nav`): the round pink RK badge (a sticker, tilted −8 degrees) and section links with a
  3px underline on hover.
- **Pack** (`.pack`): paper, 4px ink border, hard shadow, the `.pack__hole`. Inside, in order:
  - `.pack__top`: the brand and the `#sound` chip.
  - `.stage#stage` (16:8.2, at most 68vh): `h1.stage__name`, `canvas#toy` and the `.stage__hint`
    pill. `.is-live` hides the plain name; `.is-touched` hides the Spin hint once the visitor has
    touched the toy (the other tools keep theirs).
  - `.tools`: five `.st` stickers, `.st--pink` Spin, `.st--yellow` Poke, `.st--orange` Paint,
    `.st--violet` Drop, `.st--sky` Blow, each with a round `<kbd>` number.
  - `.swatches`: eight round color buttons and **Wash it off**, shown only for Paint.
  - `.pack__foot`: the `.shelf` of toy chips (the dashed `.chip--dash` opens a file) and the
    `.share` chips.
  - `.contents`: a ruled label with the **Fewer** and **More** chips (`.detail`), the census and the
    `aria-live` status line.
- **Hero foot** (`.hero__foot`, `1.6fr 1fr`): intro, and an aside with an ink rule on its left.
- **Band** (`.band`, `.band--*`) and **head** (`.head`): a tilted ink pill (`.head__tag`), a big
  `h2`, a `.head__lede`.
- **Box** (`.box`, `1.25fr 1fr`): the `.embed` panel (4:3) and the tilted yellow `.box__role`.
- **Cards** (`.cards`, auto-fit, at least 270px): `.card` stickers; `.cards--facts` and
  `.cards--shelf`; `.card--wide` spans two columns at 900px and up; `.card--art` cards open with a
  96px `.art` window (`.art--grooph`, `--qr`, `--amordle`, `--ars`, `--list`, `--meteor`, `--resmon`,
  `--reword`).
- **One splat** (`.one`): a paper panel with a dashed yellow `.one__art` canvas, three `.sliders`
  and the ink `.one__cov` readout.
- **Last** (`.last`): the capstone line under a dashed rule.
- **Research** (`.study`, `1.4fr 1fr`): prose and `.interests` stickers.
- **Contact** (`.band--ink`): `.elsewhere` stickers and `.colophon`.
- **Link** (`.link`): bold, a 3px underline in the text color, a `↗`.
- **Breakpoints**: 820px (two-column blocks stack; the stage becomes 4:3), 520px (the stage becomes
  1:1.02, the nav and stickers tighten, the pack's foot stacks).

## Interaction

- **Canvas**: `touch-action: none`, so every gesture on the stage goes to the toy. The cursor changes
  with the tool (`grab`, `crosshair` for Poke and Paint, `cell` for Blow).
- **Spin** (default): drag to turn it; a flick keeps it coasting; a tap (under 7 px of movement)
  pokes the spot.
- **Poke**: tap, or drag across it; each touch starts a ring and plays the toy's voice (for the
  name, the touched letter's note).
- **Paint**: drag across the toy with the chosen swatch; each dab colors every splat within a small
  radius (`PAINT_R`) of the front-most splat under the pointer. The page and its links keep the last
  180 dabs.
- **Drop**: a toggle; press again to put the toy back together.
- **Blow**: press and hold beside the toy.
- **Keyboard**: the stage is focusable (`tabindex="0"`, `role="group"`). Arrow keys spin it, Enter
  or Space uses the current tool on a random spot, 1 to 5 pick the tools (4 toggles Drop).
- **Sound**: the chip toggles it (`aria-pressed`) and plays three notes when it turns on. Spinning a
  toy by hand ticks; each toy has its own voice for a poke; Drop, Paint and the buttons have theirs.
- **Toy shelf**: chips swap the toy; **Your picture…** opens a file picker and rebuilds the picture
  from splats.
- **Take it home**: **Copy link**, **Save PNG** (with a see-through background) and **Save video**
  (four seconds of WebM while the toy turns).
- **Fewer** and **More**: step the splat count; the choice is remembered in this browser.
- **Focus outline**: 3px ink, 3px offset, rounded; paper on the ink band.

## Keep it intact

- Do make every control a sticker: ink line, paper die-cut edge, ink outline, hard offset shadow.
  Pressed means moved into the shadow.
- Do keep the palette flat and saturated: yellow, pink, teal, orange, violet, sky, on ink and paper.
  Pick a sticker's color with `--c`, not with a new hex value.
- Do keep tilts small (within 3 degrees) and vary them from item to item.
- Do keep shadows hard and down-right; never blurred.
- Do keep Fredoka bold and slightly wide for anything a visitor should read from across the shop.
- Don't add gradients beyond the stage's sunburst and glow and the dot patterns.
- Don't swap the toy's renderer for one that sorts less or blends differently without checking the
  frame times `README.md` lists; the splat tiers exist to keep it smooth.
- Don't remove the reduced-motion checks (`reduce.matches`) in `main.js` or the media query at the
  end of `styles.css`.

## Using this with an AI coding agent

Put `DESIGN.md` in your project and tell Claude Code (or another coding agent) to follow it for
colors, type, layout and motion whenever it edits the page. Keep `TEMPLATE.md` for the content swap:
ask the agent to work through its "Make it yours" list with your name, projects and links.
