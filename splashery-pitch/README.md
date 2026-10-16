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
| One splat | Taps the grape: the splat that gives most to that pixel lifts out, with its μ, σ, q, Σ, color, α and its screen covariance |
| One to all | Turns a dial from one merged Gaussian to all 300,000 splats, drawn as splats, ellipsoids, rings or centers |
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
with relative URLs; `npm run preview` serves it on the same port.

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
- **Splashery's own code**, copied unchanged under `vendor/splashery/` from
  `ryanjosephkamp/splashery` at `5fdaa4a` (October 14, 2026): `kit.js` and `packs/objects.js` build
  the chest; `equation.js` and `packs/splat-equation.js` read the programs. Splashery's `effects.js`
  imports the PlayCanvas engine through `photo-splats.js`; `vite.config.js` points that one import at
  `src/lib/photo-splats-stub.js`, since the recipes need only its constants.
- The grape loads its 1.3 MB lite capture first (100,000 splats), then swaps in the full 3.6 MB one
  when nothing on the stage depends on the first.

Splashery itself draws with the PlayCanvas engine, on WebGPU with a WebGL2 fallback. This page draws
the same files with its own renderer so it can take them apart.

## Tools

- `tools/cdp.mjs`: drives headless Chrome over the DevTools protocol, with the GPU, device emulation,
  touch, screenshots and a screencast.
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
