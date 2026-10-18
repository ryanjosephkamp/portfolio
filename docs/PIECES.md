# Pieces

Standalone web pages, not portfolios. Each piece exists to push what people think a web page can do,
and nothing on it needs to be about Ryan. A piece lives in `pieces/<slug>/`, is built on its own
branch `piece/<slug>` in its own worktree, and has a row under "Pieces" in
[CONCEPTS.md](CONCEPTS.md).

The portfolio process does not apply: no ten projects, no [FACTS.md](FACTS.md), no
[PLAYBOOK.md](PLAYBOOK.md) steps. A piece's brief gives a premise and a signature, the one thing a
visitor does within five seconds of arriving. Everything else (the look, the stack, the details) is
the builder's to invent.

## Rails

- **Static.** GitHub Pages serves the piece as static files with relative URLs: no server and no
  custom headers, so no `SharedArrayBuffer` or threaded WebAssembly without a workaround. If it needs
  a build step, commit the built output.
- **Works on arrival.** On a phone and a desktop, by touch, mouse and keyboard. A camera,
  microphone or motion permission is asked for only after a tap, and the piece still works if the
  visitor says no.
- **Safe to look at.** Nothing flashes more than three times a second. Every animation has a
  `prefers-reduced-motion` path that still shows the piece.
- **American English.** `node tools/us-spelling.mjs pieces/<slug>` prints nothing.
- **True.** Anything stated as fact is true. Invented voice is welcome.
- **Open.** Fonts, code and assets someone else made are under open licenses, self-hosted, and
  listed with their source and license in the piece's `README.md`.
- **Credited.** A small "A piece by Ryan Kamp" line that links to https://ryanjosephkamp.github.io/.
- **Namespaced.** Browser storage keys start with `<slug>:`, since every page on the site shares
  one origin.

## Ship

1. See it working in a real browser at desktop and phone widths, with an empty console and no
   sideways scroll, and drive the signature by pointer, touch and keyboard. Phone widths in headless
   Chrome need DevTools-protocol device emulation (`tools/operator/shoot.mjs` does it). Several
   piece sessions can share the Mac: run one headless browser at a time and close it when done.
2. Commit with the identity in [CLAUDE.md](../CLAUDE.md), push `piece/<slug>`, and open a pull
   request to `main` that changes only `pieces/<slug>/`. Give it a screenshot, two sentences on what
   the piece does, and what a visitor should try first. The operator session adds its row to
   [CONCEPTS.md](CONCEPTS.md).
