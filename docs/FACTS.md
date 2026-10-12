# Facts

The source for anything factual on a page in this repo. Drawn from Ryan's CV of October 2026 and
his public sites. When a page needs a fact that is missing here, read the project's public README;
when it is in neither, leave it out.

## Ryan

- Ryan Kamp. Graduate student at the University of Cincinnati, Cincinnati, Ohio.
- MS in Computer Science, concentration in Artificial Intelligence, August 2025 to expected May
  2027. Thesis advisor: [Dr. Yizong Cheng](https://researchdirectory.uc.edu/p/chengy).
- BA in Mathematics and BS in Neuroscience, University of Cincinnati, January 2020 to May 2025.
  Capstone advisor: [Dr. Hyunjoong Kim](https://sites.google.com/view/hkimmathbio/home).
- **Research interests, verbatim:** scientific visualization, computer graphics, digital media,
  software engineering, and information retrieval. A concept leads with the one it is built on.

## The projects

Every concept site presents all ten. **Splashery is first and largest, grooph is second, and the
capstone is last and brief.** The order of the rest is free. Ryan groups them as below; a page may
use the groups or not.

The text under each is what the project does, ready to adapt.

### Visualization and graphics

1. **Splashery** (2026 to present). An interactive Gaussian splat playground that runs entirely in
   the browser. Pick a toy (a real captured object, or one generated from a seed), spin it, poke
   it, blow on it, splash paint on it, drop it, watch it fall apart and come back, make your own,
   and share it as a link, an embed, a GIF or a video.
   [Play](https://ryanjosephkamp.github.io/splashery/) ·
   [code](https://github.com/ryanjosephkamp/splashery) ·
   [Tinkerer's Manual](https://ryanjosephkamp.github.io/splashery/manual/).
   Ryan's part, where a page needs it: he defined the project's vision and its toy categories,
   refined the interaction design through hands-on testing, and contributed mathematical recipes.

### Software engineering

2. **grooph** (2026 to present). Visual loop graphs for coding-agent workflows. You draw who
   builds, who checks, where a person decides and when the work stops. grooph checks that every
   loop names a stop, then compiles the graph into a prompt package for a separate coding-agent
   harness. It runs no agent and calls no model, and graphs stay on your device.
   [Open](https://ryanjosephkamp.github.io/grooph/) ·
   [docs](https://ryanjosephkamp.github.io/grooph/docs/) ·
   [code](https://github.com/ryanjosephkamp/grooph).
3. **reword_nerd.** A local-first browser workbench that turns a reviewed document, or a set of
   images, into a portable workbook of rewriting prompts. Everything stays reviewable in the
   browser, the download is a separate, explicit step, and the application contacts no model
   provider itself.
   [Open](https://ryanjosephkamp.github.io/reword-nerd/) ·
   [write-up](https://ryanjosephkamp.github.io/blog/articles/reword-nerd/) ·
   [code](https://github.com/ryanjosephkamp/reword-nerd).

### Information retrieval

4. **resmon** (April 2026 to present). A local-first literature-monitoring desktop application. It
   runs scheduled searches across open-access scholarly sources, removes duplicates, and compiles
   reading reports, with optional summaries.
   [Code](https://github.com/ryanjosephkamp/resmon).
5. **Link Meteor.** A Chrome extension that collects links with their anchor text and URL in
   separate fields, for reviewing sources and exporting a research collection. No account, ads,
   telemetry or backend. [Website](https://ryanjosephkamp.github.io/link-meteor/) ·
   [code](https://github.com/ryanjosephkamp/link-meteor).

### Words

6. **English OpenList** (December 2025 to present). A free, open, continuously maintained list of
   valid English words, about 345,000 of them, with the provenance of every word (which sources
   attested it, and when), auditable correction records, and a browser explorer.
   [Explore](https://english-openlist.pages.dev/) ·
   [code](https://github.com/ryanjosephkamp/english-openlist) ·
   [dataset](https://huggingface.co/datasets/ryanjosephkamp/english-openlist).
   This project is about to be expanded; keep its entry easy to change.
7. **Ars Magna.** An anagram finder. Give it any text and it returns every way those exact letters
   can be re-partitioned into real English words, by a deterministic search.
   [Try](https://ars-magna.pages.dev/) · [code](https://github.com/ryanjosephkamp/ars-magna).
8. **aqrobat.** A local text and emoji QR lab: QR artwork built from letters, symbols or emoji.
   [Make one](https://ryanjosephkamp.github.io/aqrobat/) ·
   [code](https://github.com/ryanjosephkamp/aqrobat).
9. **Amordle.** A free word game: any word length from 2 to 35 letters, three difficulties, a daily
   puzzle, and ranked multiplayer with an Elo rating.
   [Play](https://amordle.vercel.app) · [code](https://github.com/ryanjosephkamp/amordle) ·
   [write-up](https://ryanjosephkamp.github.io/blog/articles/amordle/).

### Last

10. **The Speed-Accuracy Trade-Off in Perceptual Decision-Making** (April 2025). Ryan's
    undergraduate research capstone. It models evidence accumulation as a diffusion process and
    uses dynamic programming and value iteration to study decision boundaries in a simulated
    autonomous-vehicle obstacle-avoidance scenario.
    [Code](https://github.com/ryanjosephkamp/UC_Undergraduate_Research_Capstone) ·
    [video](https://youtu.be/LRAP1YHy3g0).

**The capstone is listed, never featured.** It gets one short entry at the end of the list. A
concept, a hero, a signature or a section's art is built on any of the other nine.

Leave out: the Spring 2026 AI Research Prototype Portfolio, and any repository that is not public.

## Splashery, in depth

For concepts that center a part of it. Read the README, and the header comment of the pack you
write about (`src/packs/<pack>.js`), before writing; they are long and exact.

- **Toys.** Captured ones are real scans of up to 450,000 splats. Generated ones are built from
  seeded recipes, so a saved scene rebuilds the same toy. Shelves include space, a tiny world of
  cells and viruses, atoms, the body, nature, weather, food, playthings, games, landmarks,
  vehicles, animals and math.
- **Effects** run on the GPU for every splat, every frame: poke, wind, dissolve, drop, magnet,
  twist, slice, paint.
- **Waves and optics.** A ripple tank that solves the 2D wave equation (dippers, a plane wave, one
  or two slits), and a light bench that traces rays with Snell's law through lenses, mirrors, a
  prism, a glass block and a fiber.
- **Light lab.** Line spectra of sixteen elements from NIST data; a prism (Snell's law, with the
  glass's index from its Sellmeier fit) and a grating (d sin θ = m λ).
- **Sound.** A Chladni plate whose sand moves live with the sound, and a 3D version based on the
  acoustic radiation force. A sound lab with a spectrogram, a spectrum and an oscilloscope. A song
  landscape drawn from measured features: bands, loudness, spectral centroid, pitch.
- **Molecules and crystals.** A molecule viewer that opens PDB, mmCIF, SDF, MOL and XYZ files or
  fetches an entry from the Protein Data Bank, drawn as balls and sticks, space-filling atoms, a
  cartoon or a surface, with distance and angle measurement. Crystal unit cells from published
  lattice constants. Hydrogen orbitals sampled from |ψ|².
- **Volumes and imaging.** A volume viewer that opens CT, MRI and microscope scans (DICOM, NIfTI,
  TIFF stacks) on the device, with window and level, a transfer function, cut planes and a
  maximum-intensity picture; its samples are a walnut and a gar's head. Toys that show how CT, MRI,
  an electron microscope and a thermal camera see. An anatomy atlas peeled layer by layer.
- **Scale and sky.** Powers of ten: one continuous zoom from a galaxy down to a single molecular
  machine, through real pictures and data at every scale. The night sky for any date, time and
  place: stars to magnitude 6 from the HYG database, constellation lines, the Sun, the Moon and
  the planets.
- **Earth and data.** Real landscapes from public data (the Grand Canyon, Mount St. Helens before
  and after May 18, 1980, the Mariana Trench). Data in 3D: a CSV becomes a scatter, bars or a
  surface. Climate records: Mauna Loa CO2 as a spiral, GISTEMP temperature anomalies.
- **How splats work.** A Gaussian splatting toy that fits 2D Gaussians to a picture by gradient
  descent, step by step, and shows one splat, many splats and sorting. A splat equation toy that
  places every splat from equations in u, v and t. The Tinkerer's Manual: what one splat is (the
  Gaussian and its covariance), how a recipe is built, and the equation language.
- **Media.** PDFs, pictures, GIFs and videos rebuilt from splats; photos and videos turned into 3D
  reliefs. A synthesized sound for every toy. An arcade of games made of splats.
- **Sharing.** A link, a JSON file, a PNG, a GIF, a WebM, or an embed (an iframe or a
  `<splashery-toy>` element). Bring your own splat file: PLY, SOG, SPLAT, SPZ.
- **Engineering.** Static files and ES modules only: no build step, no framework, no server.
  PlayCanvas engine, WebGPU with a WebGL2 fallback.

## Links

- CV: https://drive.google.com/file/d/1x3CYZOWMckdRBlrFfejLhzqY4ftGoO9h/view?usp=drive_link
- Homepage https://ryanjosephkamp.github.io/ · repositories
  https://ryanjosephkamp.github.io/repositories/ · blog https://ryanjosephkamp.github.io/blog/
- GitHub https://github.com/ryanjosephkamp · LinkedIn https://www.linkedin.com/in/ryanjosephkamp ·
  X https://x.com/ryanjosephkamp · YouTube https://m.youtube.com/@RyanJosephKamp · Hugging Face
  https://huggingface.co/ryanjosephkamp

## Keep off every page

Email addresses, phone numbers, references, grades, employment history, family details, and any
repository that is not public.
