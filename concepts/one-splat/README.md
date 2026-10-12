# One Splat

A concept portfolio for Ryan Kamp as a computer graphics researcher. The hero draws his name
with Gaussian splats: turn the dial from 1 to 16,384, point at a splat to measure it, or type
your own text.

| File | What it holds |
|---|---|
| `index.html` | All of the content. |
| `fit.js` | The fit: a picture as a tree of Gaussians, each the exact mean and covariance of the pixels beneath it. Pure code, no DOM. |
| `main.js` | Rasterising text, the WebGL2 renderer (and a 2D-canvas one), the dial, the probe, the reshapeable splat, the titles. |
| `verify.mjs` | Exhaustive checks for `fit.js`. Run `node verify.mjs`. |
| `styles.css` | Tokens at the top, then one block per section. |

Append `?flat` to the URL to draw the hero on a 2D canvas, the path taken where WebGL2 is missing.

Fonts: B612 and B612 Mono (Intactile Design for Airbus) and STIX Two Text, all under the SIL Open
Font License.
