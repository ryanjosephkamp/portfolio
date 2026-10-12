# Resonance

Ryan Kamp through sound and audio-visual media. The hero is a brass plate you bow: black sand
runs to the still lines of the note, by the rule Splashery's Chladni plate uses.

- `plate.js`: the plate's model and the sand (no DOM).
- `main.js`: the bow, the sound (made only after a touch), and the screens that read it.
- `tools/check-figures.mjs`: counts the plate's figures by brute force (24) and checks that the
  sand finds every one. Run `node concepts/resonance/tools/check-figures.mjs`.

Preview: `python3 -m http.server 4183` from the repo root, then open `/concepts/resonance/`.
