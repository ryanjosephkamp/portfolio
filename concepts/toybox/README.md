# Toy Box

A concept portfolio for Ryan Kamp as a digital media researcher, with
[Splashery](https://ryanjosephkamp.github.io/splashery/) as the centrepiece. One page, static files,
no build step, no dependencies.

**The signature:** Ryan's name is a toy made of Gaussian splats. Spin it, poke it, paint it, drop it
and blow on it (Splashery's own verbs), hear a note for each letter, and copy a link that holds the
whole scene.

## Run it

```bash
python3 -m http.server 4176 --bind 127.0.0.1   # from the repo root
# open http://127.0.0.1:4176/concepts/toybox/
```

## Files

| File | What it holds |
|---|---|
| `index.html` | All of the content. It reads without JavaScript. |
| `styles.css` | Tokens at the top (`:root`), then one block per section. |
| `main.js` | The sound voices, the five toy recipes, the splat renderer and its tools, and the small pieces lower on the page. |
| `scene.js` | The parts with a right answer: the link format, one splat's opacity and covariance. |
| `tools/verify.mjs` | The checks for `scene.js`. |
| `assets/fonts/` | [Fredoka](https://fonts.google.com/specimen/Fredoka) variable font, latin subset (SIL Open Font License). |

The hero is this page's own small renderer (WebGL2: flat Gaussian discs, counting-sorted back to
front each frame, simulated on the CPU). It is not Splashery's engine, which is PlayCanvas.

## The checks

```bash
node concepts/toybox/tools/verify.mjs
```

- Every header a link can carry (5 toys x dropped or not x 256 turns x 256 tilts = 655,360) encodes
  and decodes to itself; so does every value of every byte of a paint dab, and scenes of 0 to 180 dabs.
- A splat cut off at 3 sigma keeps 1 - e^-4.5 = 98.889% of its paint; summing 16,777,216 samples of
  the function the page draws with gives the same figure.
- The covariance readout under "One splat, up close" has the right trace and determinant at all
  1,187,541 positions of its three sliders.

`window.__toybox.advance(seconds)` steps the toy's clock by hand, for checking it where a browser
will not run animation frames (a hidden tab, a headless run).

## Voice

Facts trace to `docs/FACTS.md`, the project READMEs and the live pages. Invented voice: the toy
packaging lines ("some assembly encouraged", "Take it home", "Peel one off", "The serious sticker",
"no batteries", "Unwrap it here", "Wash it off"), the line about Fredoka's strokes, and the section
ledes. The paragraph under Research about splats as a material is a stated interest, not a result.
