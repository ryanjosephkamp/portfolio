# Slice

A concept portfolio for Ryan Kamp built on volume and medical imaging visualization, with
[Splashery](https://ryanjosephkamp.github.io/splashery/) as the centerpiece. One page, static files,
no dependencies, no build step at serve time.

**The signature:** a radiology light box with two real CT scans clipped to it, the samples that
ship in Splashery's volume viewer: a walnut and a young gar's head. Move across any of three cuts
and the other two follow; the fourth picture is the scan as a shaded solid with that corner carved
away, to turn; drag the window on the histogram.

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
| `volume.js` | The math, with no DOM: the scans (`SCANS`), a contact sheet to a volume, the three cuts, the cutaway and its lighting, the maximum-intensity picture, the window counts, and filtered back projection. |
| `main.js` | The viewer, the scan labels, the window strip, the contact sheet's ring, the back-projection toy and the stacked atlas films. |
| `verify.mjs` | The checks behind the page's claims. `node concepts/slice/verify.mjs` (about a minute and a half; `--quick` for a few seconds). |
| `tools/build-sheet.mjs` | Rebuilds a scan's contact sheet from the file Splashery ships. |
| `assets/*-sheet.png` | The scans: every slice on one 8-bit gray sheet, nothing resampled. The page reads its volume from these pixels, and shows the same file as the contact sheet. |
| `assets/fonts/` | [Atkinson Hyperlegible](https://www.brailleinstitute.org/freefont/) Next and Mono, variable, latin subset (SIL Open Font License). |

## The scans

Both are the samples in Splashery's volume viewer, copied voxel for voxel from the files in the
Splashery repository (`verify.mjs` checks every voxel against them).

| Scan | From | License | Voxels | On disk | Loaded |
|---|---|---|---|---|---|
| Walnut | Walnut 1 of the CWI cone-beam CT collection, [doi:10.5281/zenodo.2686726](https://doi.org/10.5281/zenodo.2686726), by way of Splashery's `assets/toys/walnut-ct/walnut.vol.gz` | CC BY 4.0 | 113 × 115 × 142 at 0.3 mm | 496 KB (`walnut-sheet.png`) | with the page |
| Gar's head | The 12.8 mm larva of Brian Metscher's micro-CT gar series, [doi:10.5281/zenodo.19021581](https://doi.org/10.5281/zenodo.19021581), by way of Splashery's `assets/toys/volume-viewer/gar.nii.gz` | CC BY 4.0 | 118 × 192 × 126 at 17.7 µm | 1.31 MB (`gar-sheet.png`) | only when its label is pressed |

Each scan's air, dense and top levels in `SCANS` are what Splashery's viewer computes for it (Otsu's
method on the histogram; the 99.9th percentile), so the three presets are the viewer's own windows.

**To add a scan:** it must be a real scan under a license that allows it. Write its volume as a
sheet (`tools/build-sheet.mjs` reads Splashery's two formats; add a reader for a new one), add an
entry to `SCANS` in `volume.js` (its `real` field is section D: heading, words, and the Splashery
embed that shows it), a label button in `index.html` (`data-scan`), a caption line (`data-credit`)
and its credit in the footer. `verify.mjs` runs every check for every entry.

## Why it looks this way

- **Scene:** a reading room after hours, one wall box left on, films clipped to its rail. A light
  box is a lit white wall, so the page is light and the films are the only dark things on it.
- **Type:** Atkinson Hyperlegible, because a film's burnt-in annotation is the one place where a
  0 must never read as an O; its Mono keeps the numbers still while the slices move.
- **Color:** blue-black film base, and one fuchsia wax pencil: the color no gray film contains, so
  a cut line or a circled finding can never be mistaken for the scan.

## The cutaway

The fourth picture casts one ray per pixel into the scan, from a little above. The corner to the
right of, in front of and above the point where the three cuts cross is carved away, so the three
faces it leaves are the three cuts themselves, printed flat. Everything else is the first voxel
above the window's bottom that a ray meets, lit from the upper left by the slope of the density
around it. Set the window to Bone and only the densest parts stand, such as the walnut's shell.
The maximum-intensity picture is still there, one press away.

## The verified detail

Under the histogram the page says what the current window does to the scan: what share of its
voxels (those denser than air: 452,280 in the walnut, 632,337 in the gar) print black, gray and
white. `verify.mjs` checks that readout for every window the sliders can make (32,640 of them)
against a count made by looking at every voxel, one at a time.

For each scan it also checks:

- every pixel of every cut in all three directions;
- the maximum-intensity picture, straight on against the largest voxel along each ray, and at
  every whole degree of a full turn against a slow pass through the whole volume;
- the cutaway: in 48 pictures (six turns, four cut points, two windows) every ray meets the same
  voxel as a slow march that tests every sample with no shortcuts, and every pixel painted as a
  cut face shows a voxel that lies on one of the three cuts;
- the back-projection toy: from 180 views the rebuilt slice correlates with the true slice at 0.98
  or better;
- given the paths to Splashery's files (`--walnut`, `--gar`), that every voxel on each contact
  sheet equals the source.

## Touch, scripts off, and the real toy

- On a touch screen a tap cuts, a sideways drag follows the finger, and an up-and-down swipe
  scrolls the page (`touch-action: pan-y` on every picture).
- Without scripts the hero shows the walnut's contact sheet, and the parts that need a scan are
  hidden.
- "The real thing" (section D) follows the scan on the film, and loads from Splashery's site only
  when the visitor asks. For the walnut it is Splashery's `walnut-ct` toy in the embed player
  (`embed/?toy=walnut-ct`); for the gar it is the volume viewer with its gar sample, opened by a
  scene link (`embed/#s=j.…`, the toy `volume-viewer` with the option `source: "gar"`; see
  `embedUrl` in `volume.js` and `docs/SCENE-SCHEMA.md` in the Splashery repository). Both were
  seen rendering on October 14, 2026. <!-- us-spelling: keep -->

## Credit

Walnut 1 from *Cone-Beam X-Ray CT Data Collection Designed for Machine Learning* by Henri Der
Sarkissian, Felix Lucka, Maureen van Eijnatten, Giulia Colacicco, Sophia Bethany Coban and K. Joost
Batenburg (CWI), https://doi.org/10.5281/zenodo.2686726, CC BY 4.0. Averaged to 0.3 mm voxels and
stored as 8-bit densities, as Splashery ships it.

The 12.8 mm larva from *MicroCT images of 3 early gar (Lepisosteus osseus) stages between 12.7mm
and 21.7mm* by Brian Metscher (University of Vienna), https://doi.org/10.5281/zenodo.19021581,
CC BY 4.0. Averaged to 17.7 µm voxels, cropped to the fish with a margin, and the faint noise of the
empty background set to 0, as Splashery ships it.
