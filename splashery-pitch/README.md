# Splashery, one frame apart

A one-page pitch for [Splashery](https://ryanjosephkamp.github.io/splashery/), the real-time 3D
Gaussian splat engine and studio. It is for Ryan's own use, to show people. It is not one of this
repo's portfolio concepts, it is not in [docs/CONCEPTS.md](../docs/CONCEPTS.md), and it is not on the
Portfolios gallery.

The page takes one frame of a real capture apart, then flies the same cloud of splats through
Splashery's other sources: a recipe, an equation, a CT volume, and a link.

| Step | What a visitor does |
| --- | --- |
| Hero | Drags the grape (300,000 splats) sideways: the frame comes apart into the layers it is blended in, back to front, and snaps together on release |
| One frame | Scrubs the blend from the back, and switches passes: depth, sort order, opacity, overdraw |
| One splat | Taps the grape: the splat that gives most to that pixel lifts out, with its μ, σ, q, Σ, color, and α, and its screen covariance |
| One to all | Turns a dial from one merged Gaussian to all 300,000 splats, drawn as splats, ellipsoids, rings, or centers |
| Recipe | The grape flies into Splashery's own treasure chest recipe, built on the device; changes the wood or the budget |
| Moving parts | Opens the lid: one part of the same cloud, turned on the graphics chip |
| Equations | Edits a splat program in x, y, z of u, v, t, read by Splashery's own equation reader |
| Real data | Cuts the walnut's X-ray CT volume open |
| Link | Watches the grape's 97-character link decode, and flies back to the grape |
| Claims, end | The manual's six claims, then Splashery's own player (the toy piano) |

## Run it

```bash
npm install
npm run dev
```

The preview is on port 4192. On a phone on the same Wi-Fi, open `http://<this Mac's address>:4192/`
(System Settings, Wi-Fi, Details, shows the address). `npm run build` writes a static site to `dist/`
with relative URLs; `npm run preview` serves it on the same port. After a build, `npm run verify`
runs the page's checks (below), and `npm run check:vendor` checks the copied Splashery files.

## Where it's published

Unlisted, at https://ryanjosephkamp.github.io/splashery-one-frame/ (ryanjosephkamp.github.io pull
request #36, October 16, 2026). Nothing on the site links to it, and it carries `noindex`. To
refresh it, run `npm run build` here, copy `dist/` over `splashery-one-frame/` in a branch of the
site repo (`rsync -a --delete dist/ <site>/splashery-one-frame/`), and open a pull request. The site
is built by GitHub Pages' Jekyll, which drops files whose names start with `_`, so
`vite.config.js` keeps every output name free of a leading underscore.

## How it draws

- **Its own WebGL2 splat renderer** (`src/gl/`). Each 3D Gaussian's covariance is carried through the
  camera's turn and the perspective's Jacobian to a 2D covariance; a quad covers three standard
  deviations along its eigenvectors; fragments write premultiplied color, blended back to front. The
  same shader draws the debug passes, the four views of a splat, flights between clouds, moving parts,
  the cut plane and the exploded frame.
- **The sort** (`src/workers/sort.js`): a 16-bit counting sort of depth along the camera's forward
  axis, on its own thread.
- **The data thread** (`src/workers/data.js`): reads SOG files (`src/lib/sog.js`, following
  `@playcanvas/splat-transform`'s reader, with its WebP decoder in `vendor/playcanvas-webp/`), reads
  the walnut's volume, runs the chest recipe, builds the merge tree for the dial (`src/lib/tree.js`),
  pairs clouds for a flight along a Morton curve (`src/lib/pair.js`), and picks the splat under a tap
  (`src/lib/pick.js`).
- **Splashery's own code**, copied unchanged under `vendor/splashery/` from the main branch of
  `ryanjosephkamp/splashery` at `0b6f4bf` (October 16, 2026): `kit.js` and `packs/objects.js` build
  the chest; `equation.js` and `packs/splat-equation.js` read the programs; `generators.js`,
  `noise.js`, `effects.js`, `font.js`, `packs/even.js`, and `physics/world.js` are what those import.
  `vendor/splashery/VENDOR.json` records each file's source path, commit, SHA-256, and license (MIT),
  and `npm run check:vendor` fails if any copy differs. Splashery's `effects.js` imports the
  PlayCanvas engine through `photo-splats.js`; `vite.config.js` points that one import at
  `src/lib/photo-splats-stub.js`, since the recipes need only its constants.
- The grape loads its 1.3 MB lite capture first (100,000 splats), then swaps in the full 3.6 MB one
  when nothing on the stage depends on the first.

Splashery itself draws with the PlayCanvas engine, on WebGPU with a WebGL2 fallback. This page draws
the same files with its own renderer so it can take them apart.

## Keyboard and errors

- Every step's controls sit in that step's section, so Tab reaches them in reading order; focusing
  one brings its step on. Radio groups take one tab stop each, with the arrow keys, Home, and End.
- On the focused stage, the arrow keys turn the camera; Enter or Space picks the splat at the
  crosshair (One splat), takes the frame apart (the hero), or opens the lid (Moving parts); Escape
  lets a picked splat go. A one-line hint shows while the stage has keyboard focus.
- A file that won't load (with its HTTP status), a thread that won't start or stops, or a lost
  drawing context shows a message on the stage with Retry (or Reload, when a thread is gone).

## Tools

- `tools/cdp.mjs`: drives headless Chrome over the DevTools protocol, with the GPU, device emulation,
  touch, screenshots and a screencast.
- `tools/verify.mjs`: the page's checks, against `dist/` on its own server that can fail files on
  purpose: every step at 1440×900 and 390×844, WebKit as an iPhone, the three forced failures, and a
  keyboard-only walk. Screenshots go to `screenshots/`.
- `tools/clip.mjs`: records the signature moment as an MP4: `node tools/clip.mjs` (desktop) or
  `node tools/clip.mjs --phone`, into `clips/`. It needs ffmpeg and the dev server running.

## Credits

- Grape: Dany Bittel, [SuperSplat](https://superspl.at/scene/4ae563ac),
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), converted for Splashery.
- Walnut: Der Sarkissian et al., CWI, [Zenodo](https://doi.org/10.5281/zenodo.2686726),
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), resampled to 0.3 mm for Splashery.
- Splashery's code: MIT, `vendor/splashery/LICENSE`.
- WebP decoder: PlayCanvas, MIT, `vendor/playcanvas-webp/LICENSE`.
- Geist and Geist Mono: SIL Open Font License, through `@fontsource-variable`.
