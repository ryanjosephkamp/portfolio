# Overprint

A concept for Ryan Kamp's portfolio. The page is one live print: a single cloud of Gaussian splats,
laid down in two inks on paper, that re-forms for each section. Static files, no build step, no
dependencies.

**The signature.** The name is drawn in splats. Push the pointer through it, drag to turn it, or
open the recipe card and change what it is made from: type a word, move a parameter, or write the
three expressions of a surface yourself.

## Run it

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173/concepts/overprint/ (serve from the repository root).

## Files

| File | What it holds |
|---|---|
| `index.html` | All of the content. Each section names its form in `data-form` and where the form sits in `data-at`. |
| `styles.css` | Tokens at the top (`:root`): paper, the two inks, type steps. |
| `main.js` | The recipes (`word`, `lorenz`, `klein`, `gyroid`, `decisions`, `loop`, `yours`), the table that names them (`FORMS`), the WebGL2 press (`Cloud`), and the page logic (`start`). |

## How the print is made

1. A recipe returns, for each splat, a centre, the direction its stroke runs, and an ink.
2. Pass one draws every splat in a single instanced call onto two plates (the red and green
   channels of one texture), adding as it goes. A splat is a Gaussian with a long axis that follows
   its stroke through the turn and the perspective, and a short radius.
3. Pass two prints the plates onto the paper: ink saturates as it builds, the second plate is
   sampled a little off register, and where both inks land one multiplies the other.

A change of form uploads new targets; each splat sets off from wherever it is and they leave in turn.

## Adding a form

Write a recipe that fills `pos`, `tan` and `ink` and ends with `finish(...)`, add it to `FORMS`, and
name it in a section's `data-form`. To offer it in the recipe card, give it `label`, `recipe`,
`controls` and `note`, and add its key to `SHELF`.

The paper and ink colours live in two places that must agree: `:root` in `styles.css` and the
`PAPER`, `TEAL` and `HOT` constants in `main.js`.
