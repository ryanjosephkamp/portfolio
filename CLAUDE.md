# portfolio

Ryan Kamp's portfolio. The repo root is **v1** (tag `v1-anagram-tiles`). Concept sites live in
`concepts/<slug>/`, each self-contained, each built on its own branch `concept/<slug>`.

- **Building or changing a concept site:** read [docs/PLAYBOOK.md](docs/PLAYBOOK.md) first. It is
  the process v1 was made with.
- **Anything factual about Ryan or his projects:** [docs/FACTS.md](docs/FACTS.md) is the source.
  Pages stay **claim-safe**: every factual sentence traces to it, a public README, or a live page.
- **Commits:**
  `git -c user.name="Ryan" -c user.email="192532973+ryanjosephkamp@users.noreply.github.com" commit …`
  The machine's default git email is private, and GitHub rejects any push (tags included) that
  carries it.
- **Serving:** static files with relative URLs. GitHub Pages serves the repo under `/portfolio/`.
- **One session per checkout.** Parallel sessions each work in their own git worktree and preview
  on their own port.
