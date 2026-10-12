# portfolio

Ryan Kamp's portfolio workshop. The repo root is **v1**. Concept sites live in `concepts/<slug>/`,
each self-contained, each built on its own branch `concept/<slug>` in its own worktree.
[docs/CONCEPTS.md](docs/CONCEPTS.md) is the registry: every concept, its territory, its branch and
its preview port.

## Rules for every page and every commit

- **American English.** US spelling and US dates (October 12, 2026) in pages, code, comments,
  commit messages and pull requests. `node tools/us-spelling.mjs <path>` prints nothing when a path
  is clean; run it before you ship.
- **Project-first.** Say what a project does and what a visitor can do with it. How it was made,
  AI assistance included, stays off the page. The Workshop concept is the one exception.
- **Claim-safe.** Every factual sentence traces to [docs/FACTS.md](docs/FACTS.md), a public README,
  or a live page.

## Working here

- **Building or changing a concept site:** read [docs/PLAYBOOK.md](docs/PLAYBOOK.md) first. It is
  the process v1 was made with.
- **Sync before you edit:** `git pull --rebase origin <your branch>`. The operator session pushes
  small fixes to concept branches.
- **Commits:**
  `git -c user.name="Ryan" -c user.email="192532973+ryanjosephkamp@users.noreply.github.com" commit …`
  The machine's default git email is private, and GitHub rejects any push (tags included) that
  carries it. A merge commit counts: the app's sync tool writes one with the private email, so
  re-author it (`commit --amend --no-edit --reset-author` with the same `-c` flags) before pushing.
- **Serving:** static files with relative URLs.
- **One session per checkout.** Parallel sessions each work in their own git worktree and preview
  on their own port.
