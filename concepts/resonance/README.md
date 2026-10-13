# Resonance

Ryan Kamp through sound and audio-visual media. The hero is a metal plate you bow: sand runs to the
still lines of the note, by the rule Splashery's Chladni plate uses.

- `plate.js`: the plate's model and the sand (no DOM).
- `take.js`: the visitor's last notes, kept so Play it back can repeat them (no DOM). It holds the
  figure, how hard the plate rang and when, never sound.
- `main.js`: the bow, the sound (made only after a touch), the screens that read it, and the plate
  picker.
- `styles.css`: every color comes from one block of variables per plate. The plates are brass,
  copper, steel, titanium and bronze; a visitor's pick is kept under `resonance:plate`. The plate a
  first-time visitor sees is the `data-plate` attribute on `<html>` in `index.html`, and
  `?plate=steel` in the address shows a plate for one visit without keeping it.

## Checks

Run each from the repo root. Each prints `ok` and exits 0, or says what failed.

- `node concepts/resonance/tools/check-figures.mjs`: counts the plate's figures by brute force (24,
  on 14 pitches) and checks that the sand finds every one.
- `node concepts/resonance/tools/check-take.mjs`: a known performance played back at six frame
  rates gives the same figures in the same order at the same times.
- `node concepts/resonance/tools/check-contrast.mjs`: every plate holds text contrast, for every
  pairing of text and ground the stylesheet uses.

Preview: `python3 -m http.server 4183` from the repo root, then open `/concepts/resonance/`.
