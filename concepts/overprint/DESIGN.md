# Overprint: design system

## The idea

The page is a two-ink print on paper, slightly off register, that is still moving. The opening
comment of `styles.css` gives the whole kit: paper, one committed ink (teal), one loud ink (orange),
one variable type family. The signature is a single cloud of Gaussian splats on a fixed canvas behind
the text. It prints the name first, then re-forms into a new figure for every section, each built by
a short recipe. A splat lays down ink in one of two plates, the second plate lands a little off
register, and where both inks fall one multiplies the other, as in an overprint.

## Tokens

### Color (`:root` in `styles.css`)

| Token | Value | Role |
|---|---|---|
| `--paper` | `#f4f0e6` | The paper: page, bar, card, panels; also `theme-color` |
| `--teal` | `#0f7f86` | The committed ink: the first plate, the focus ring, range sliders, the recipe rule, the fallback name |
| `--hot` | `#ff5a36` | The loud ink: the second plate, number chips, link underlines and hover fills, the card's shadow, text selection |
| `--teal-deep` | `#0a676d` | Teal dark enough for small type: eyebrows, tags, list numbers |
| `--ink` | `#17232b` | Text, rules, borders, pressed chips |
| `--ink-2` | `#44535b` | Secondary text |
| `--rule` | `#17232b33` | Faint rules between list rows |

Other literal colors: `#fffdf7` behind text inputs, `#a3271c` for a recipe that did not parse
(`.card__note.is-bad`), and `rgb(244 240 230 / 0)`, the paper faded out, at the foot of the bar.

The shaders take the same three colors as numbers. `main.js` holds `PAPER = [0.957, 0.941, 0.902]`,
`TEAL = [0.059, 0.498, 0.525]` and `HOT = [1.0, 0.353, 0.212]`; the stylesheet's comment and the
README both say these must agree with `:root`.

### How the print is made

Pass one (`SPLAT_VERT`, `SPLAT_FRAG`) draws every splat in one instanced call into a texture, teal
into the red channel and orange into the green, adding as it goes. A splat is a Gaussian with a long
axis that follows its stroke and a short radius (`width`). Pass two (`PRINT_FRAG`) prints the
plates on paper: ink saturates as `1 − exp(−3.2a)`, the orange plate is read `(1.5, −1.1)` CSS
pixels off register, a faint grain varies each ink by a few percent, and the two inks multiply where
they overlap. Each recipe sets its own `width` and `gain` (how much ink a splat lays down).

Splat counts, set in `start()`: 96,000 by default; 48,000 on a small screen (shorter side under
700 px) or four cores or fewer; 24,000 on two cores or fewer or 2 GB of memory or less. The canvas
renders at 1.5 to 2 device pixels per CSS pixel (`minDpr`, `maxDpr`), so hairlines stay fine.

### Type

One family: Recursive, `assets/fonts/recursive-latin.woff2`, weight 300 to 1000, oblique 0 to 15
degrees. Three of its axes are registered as custom properties (`@property --mono`, `--casl`,
`--slnt`), and every element sets `font-variation-settings: "MONO" var(--mono), "CASL" var(--casl),
"slnt" var(--slnt)`, so a class only has to set a number. `--mono: 1` turns on the monospace for
small labels; `i` gets `--slnt: -12; --casl: 0.6` (slanted and a little casual) in place of italics.
The fallback stack is `ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`.

| Step | Value |
|---|---|
| `--step-0` | `clamp(1rem, 0.96rem + 0.2vw, 1.1rem)`: body, line-height 1.58 |
| `--step-1` | `clamp(1.12rem, 1.04rem + 0.45vw, 1.4rem)`: lede (450), tags (700), list heads (750), contact pills |
| `--step-2` | `clamp(1.3rem, 1.15rem + 0.8vw, 1.8rem)`: research interests (350) |
| `--step-4` | `clamp(2.6rem, 1.7rem + 4.2vw, 5rem)`: section heads, weight 300, `-0.04em`, line-height 0.98 |

The fallback name, `.hero__name`, is 900 at `clamp(3.2rem, 15vw, 13rem)`, uppercase, teal with an
orange `text-shadow` set off register. Eyebrows are 0.78rem, 600, uppercase, `0.11em`, monospace,
`--teal-deep`, with the number in an orange chip (`.eyebrow b`, 800). Figure captions are 0.76rem,
650, uppercase, monospace. The cloud's own lettering is drawn at `900 220px Recursive` in `word()`.

### Space, borders, shadows

- `--gutter: clamp(1.1rem, 4vw, 3rem)`; `--edge: max(var(--gutter), calc((100vw - 86rem) / 2))`
  keeps content inside 86rem on a wide screen.
- Borders and rules are `1.5px solid var(--ink)`; row rules are `1px solid var(--rule)`.
- Radii: none on panels, `999px` on chips and contact pills, `3px` on the focus ring.
- Shadows are hard offsets: the recipe card `6px 6px 0 var(--hot)`; a contact pill on hover
  `4px 4px 0 var(--ink)`.
- `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)` for every CSS transition.

### Themes

None. One paper, two inks, no dark mode.

## Motion

- **Re-forming.** `cloud.show(data, seconds)` sends every splat from where it is to the new form in
  1.8 s, or 0.75 s for a change made in the recipe card. Each splat leaves on its own schedule
  (`k = clamp(uMorph × 1.7 − seed × 0.7)`, smoothstepped), so a change passes through the cloud, and
  each swings off its straight path on the way (`sin(kπ) × 0.32`, in a direction set by its seed).
- **Idle life.** Every splat drifts by a tiny amount over time (`0.0022` units). Forms with
  `spin: true` turn at 0.22 rad a second and keep a drag's coast, which decays by 0.94 a frame; the
  others face the reader and sway by their `sway` (in radians) on a slow sine, plus a little toward
  the pointer.
- **Easing in the loop.** Position and scale follow `1 − exp(−dt × 3.4)`; rotation settles at
  `1 − exp(−dt × 2.6)`; the pointer's reach grows to 120 px at `1 − exp(−dt × 8)`.
- **The anagram** swaps between its two words every 3.6 s.
- **CSS.** Bar links, chips and contact pills change color in 0.2 s; a `.link`'s orange underline
  grows to fill it in 0.25 s; a contact pill lifts by 2 px. `scroll-behavior: smooth`.
- **Keeping up.** Each frame over 34 ms adds one to a count and each faster frame takes one off.
  When the count passes 50, the page draws half the splats, then a quarter, each swelled so the ink
  comes to the same, and after that drops the canvas to one device pixel per CSS pixel.
  `[data-count]` shows the number being drawn.

Reduced motion (`prefers-reduced-motion: reduce`): `calm` is true in the loop, so forms arrive at
once, splats neither drift nor bow, nothing spins or sways, and the view jumps to place. The anagram
prints both words together and never changes by itself. The stylesheet cuts every transition to
0.01 ms and turns smooth scrolling off.

## Components and layout

- **The print.** `canvas#cloud`: fixed, full viewport (`100lvh`), `z-index: 0`,
  `pointer-events: none`, `aria-hidden`. `.bar`, `.hero`, `main` and `.contact` sit above it at
  `z-index: 1`.
- **Bar.** `nav.bar`, fixed at the top, `pointer-events: none` except on its links, with a paper
  gradient that fades out below them. `.bar__mark` is uppercase; links are monospace 0.85rem, 700.
- **Hero.** `header.hero` (`data-form="hero"`): rows `minmax(54svh, 1fr) auto`. `.hero__stage` is
  the empty top where the name prints; `.hero__foot` has two columns, `minmax(0, 1fr)` and
  `minmax(0, 27rem)`, holding `.hero__lede` and the recipe card.
- **Recipe card.** `aside.card#recipe` (hidden until the cloud runs): `.card__head` with the
  `[data-count]` number, `.chips` of `button.chip[aria-pressed]`, `pre.recipe` (teal rule on the
  left), `.controls` with `label.field` (`.field--text`, `.field--range`) and `.card__note`.
- **Sections.** `section.sec`, at least one screen tall, with the text in `.sec__text`
  (`width: min(34rem, 44vw)`). `.sec--right` keeps the text left and `.sec--left` keeps it right; the
  form takes the other side, 24% of the width from center (`spot()` in `main.js`, which reads
  `data-at`: `hero`, `left`, `right` or `center`). Sections alternate sides.
- **Inside a section.** `.eyebrow` (with `b`), `h2`, `.tag`, paragraphs, `.live` (lines that are
  true only while the cloud is drawn), `.sub`, `ul.inside`, `.meta`, `.links` with `.link`
  (`.link--up` points up), and `figure.fig` with a caption and `pre.recipe`.
- **Lists.** `ol.shelf` and `.shelf--numbered` (a two-column grid with a monospace counter),
  `ol.interests` (counter before each line).
- **Footer.** `footer.sec.contact#contact` (`data-form="name"`, `data-at="center"`), `ul.elsewhere`
  pills, `.colophon`.
- **Narrow, under 60rem (`max-width: 59.99rem`).** The hero foot becomes one column on paper with a
  top rule. Each `.sec` becomes a block with `56svh` of open window above its text panel (`48svh`
  for the contact), and the text panel is paper with a top rule. `spot()` puts the form at the top
  center of the screen when the canvas is under 960 px wide.
- **A form that must be seen whole.** The QR form (`whole` in `FORMS`) holds just under the bar on
  a narrow screen while its section's text passes beneath: `main.js` sets `--cut` on that section's
  `.sec__text`, and `.is-under` clips and masks the text above that line.
- **Under 30rem**, the bar tightens so the mark and its three links share one line.

## Interaction

- **Pointer.** Moving the pointer anywhere parts the cloud around it. Pressing on open page (not on
  a link, button, input, label, the card, a text panel or the bar) and dragging turns the form:
  0.006 rad of yaw and 0.005 rad of pitch per pixel, pitch held within ±1.2. `html.is-turning` shows
  the grabbing cursor and stops text selection. The hero and sections set `touch-action: pan-y`, so
  a vertical swipe still scrolls.
- **Sections.** A section takes over the print when it crosses the middle of the screen (an
  `IntersectionObserver` with `rootMargin: '-50% 0px -50% 0px'`).
- **Recipe card.** The chips pick a form from `SHELF`; each control rebuilds it as you type or
  slide, with the quick 0.75 s change. A recipe that fails shows "That did not parse:" and the error
  in red. "write your own" takes three expressions in `u` and `v`, run with `Math` in scope.
- **Keyboard.** The card's chips and inputs are native controls; the cloud itself is decorative and
  not focusable. A skip link leads to `#work`. Focus is a 3 px teal outline offset 3 px.

## Keep it intact

- Two inks only. Do not add a third color to the print or to the page.
- Change a paper or ink color in `:root` and in `PAPER`, `TEAL` or `HOT` in `main.js` together.
- Keep one form per section and keep the text on the side away from the form; alternate
  `.sec--left` and `.sec--right` with a matching `data-at`.
- Mark any sentence that talks about the live cloud `.live`, so it disappears when WebGL2 is
  missing.
- Order every recipe's splats so any first part covers the whole form; the slow-machine fallback
  depends on it.
- Keep a QR form at most 42 bytes, with `sway: 0` and its `whole` margin, and test it with a phone.
- Use Recursive's axes through `--mono`, `--casl` and `--slnt`; small labels are monospace and
  uppercase.
- Keep shadows as hard offsets in orange or ink, and transitions on `--ease-out`.
- Keep the `calm` path when you add motion to the loop.

## Using this with an AI coding agent

Put this `DESIGN.md` in your project and tell Claude Code (or another coding agent) to follow it for
color, type, layout and motion, including the two places each ink is defined. Keep `TEMPLATE.md`
for the content swap: hand it to the agent as the checklist of what to replace.
