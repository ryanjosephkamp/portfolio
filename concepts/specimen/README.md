# Specimen

A concept portfolio for Ryan Kamp as a scientific visualization researcher, with
[Splashery](https://ryanjosephkamp.github.io/splashery/) as the centerpiece. One page, static files,
no dependencies, no build step.

**The signature:** a microscope slide holding a neuron made of 4,096 Gaussian splats. Turn the
focus and they merge, pair by pair, down to one Gaussian with the same mass, center and covariance;
tap the cell and a Hodgkin–Huxley spike runs down its axon, hopping the myelin.

## Run it

```bash
python3 -m http.server 4175
```

from the repository root, then open http://localhost:4175/concepts/specimen/.

## Files

| File | What it holds |
|---|---|
| `index.html` | All of the content. Edit copy and links here. |
| `styles.css` | Design tokens at the top (`:root`), then one block per section. |
| `specimen.js` | The math, with no DOM: the neuron recipe, the splat tree (`merge`, `buildTree`), and the Hodgkin–Huxley integrator. |
| `main.js` | The WebGL2 stage (`Slide`), the hero controls, the cabinet emblems, and the lazy Splashery embeds. |
| `verify.mjs` | The check behind the page's claim. `node concepts/specimen/verify.mjs`. |
| `assets/fonts/` | [Newsreader](https://fonts.google.com/specimen/Newsreader) variable font, roman and italic, latin subset (SIL Open Font License). |

## The verified detail

Lowering the focus replaces each pair of splats with their moment-matched merge. `verify.mjs`
checks every one of the 4,095 merged splats against all the leaves beneath it, every one of the 13
levels against the finest, and that every covariance is positive definite: 12,299 checks, largest
drift about 1e-15. It also checks that the spike model rests at −65 mV, fires on the pulse the page
uses, and stays quiet on a weak one.

## How it is drawn

Splats here absorb light instead of emitting it, like a stained section on a bright stage. Each
splat adds optical depth to a float buffer; a second pass shows `exp(−depth)`. Sums do not depend on
order, so nothing is sorted. Where float render targets are missing it multiplies in 8 bits instead.

## Reduced motion

No turntable, no opening focus sweep, the focus jumps instead of gliding, and Fire shows one still
frame and the finished chart.
