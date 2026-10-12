# Slice

A concept portfolio for Ryan Kamp built on volume and medical imaging visualization, with
[Splashery](https://ryanjosephkamp.github.io/splashery/) as the centerpiece. One page, static files,
no dependencies, no build step at serve time.

**The signature:** a radiology light box with a real CT scan of a walnut clipped to it, the sample
that ships in Splashery's volume viewer. Move across any of three cuts and the other two follow;
drag the window on the histogram; turn the maximum-intensity picture.

## Run it

```bash
python3 -m http.server 4184
```

from the repository root, then open http://localhost:4184/concepts/slice/.

## Files

| File | What it holds |
|---|---|
| `index.html` | All of the content. Edit copy and links here. |
| `styles.css` | Design tokens at the top (`:root`), then one block per section. |
| `volume.js` | The math, with no DOM: the contact sheet to a volume, the three cuts, the maximum-intensity picture, the window counts, and filtered back projection. |
| `main.js` | The viewer, the window strip, the contact sheet's ring, the back-projection toy and the stacked atlas films. |
| `verify.mjs` | The checks behind the page's claims. `node concepts/slice/verify.mjs`. |
| `tools/build-sheet.mjs` | Rebuilds `assets/walnut-sheet.png` from Splashery's `assets/toys/walnut-ct/walnut.vol.gz`. |
| `assets/walnut-sheet.png` | The scan: all 142 slices on one 8-bit gray sheet, nothing resampled. The page reads its volume from these pixels, and shows the same file as the contact sheet. |
| `assets/fonts/` | [Atkinson Hyperlegible](https://www.brailleinstitute.org/freefont/) Next and Mono, variable, latin subset (SIL Open Font License). |

## Why it looks this way

- **Scene:** a reading room after hours, one wall box left on, films clipped to its rail. A light
  box is a lit white wall, so the page is light and the films are the only dark things on it.
- **Type:** Atkinson Hyperlegible, because a film's burnt-in annotation is the one place where a
  0 must never read as an O; its Mono keeps the numbers still while the slices move.
- **Color:** blue-black film base, and one fuchsia wax pencil: the color no gray film contains, so
  a cut line or a circled finding can never be mistaken for the scan.

## The verified detail

Under the histogram the page says what the current window does to the walnut: what share of its
492,072 voxels print black, gray and white. `verify.mjs` checks that readout for every window the
sliders can make (32,640 of them) against a count made by looking at every voxel, one at a time.

It also checks:

- every pixel of every cut in all three directions;
- the maximum-intensity picture, straight on against the largest voxel along each ray, and at
  every whole degree of a full turn against a slow pass through the whole volume, with no pinholes;
- the back-projection toy: from 180 views the rebuilt slice correlates with the true slice at 0.98
  or better;
- given the path to Splashery's file, that all 1,845,290 voxels on the contact sheet equal the
  source.

## Touch, scripts off, and the real toy

- On a touch screen a tap cuts, a sideways drag follows the finger, and an up-and-down swipe
  scrolls the page (`touch-action: pan-y` on every picture).
- Without scripts the hero shows the contact sheet, and the parts that need the scan are hidden.
- "The real thing" loads Splashery's own `walnut-ct` toy in its embed player, from Splashery's
  site, only when the visitor asks. <!-- us-spelling: keep -->

## Credit

Walnut 1 from *Cone-Beam X-Ray CT Data Collection Designed for Machine Learning* by Henri Der
Sarkissian, Felix Lucka, Maureen van Eijnatten, Giulia Colacicco, Sophia Bethany Coban and K. Joost
Batenburg (CWI), https://doi.org/10.5281/zenodo.2686726, CC BY 4.0. Averaged to 0.3 mm voxels and
stored as 8-bit densities, as Splashery ships it.
