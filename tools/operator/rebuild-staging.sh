#!/bin/zsh
# Rebuilds the staging preview: origin/main, then the operator branch, then v1's open caption fix,
# then every concept branch, with conflicts resolved toward staging. Staging is a local branch in the
# worktree .claude/worktrees/staging and is never pushed. Serve it with the launch config "staging"
# (port 4180).
#
#   tools/operator/rebuild-staging.sh [operator branch]

OPERATOR=${1:-claude/portfolio-operator-takeover-d29b75}
CONCEPTS=(one-splat specimen toybox workshop overprint molecule resonance slice atlas arcade)
ID=(-c user.name="Ryan" -c user.email="192532973+ryanjosephkamp@users.noreply.github.com")

cd "$(git rev-parse --show-toplevel)/../staging" 2>/dev/null || cd /Users/noir/portfolio/.claude/worktrees/staging || exit 1
[ -n "$(git status --short)" ] && { echo "staging has uncommitted changes; stopping"; exit 1; }

git fetch -q origin && git reset -q --hard origin/main
git "${ID[@]}" merge -q --no-edit "origin/$OPERATOR" 2>&1 | tail -1
# v1's caption fix, while its pull request is open
git merge-base --is-ancestor origin/update/v1-refine origin/main 2>/dev/null || git "${ID[@]}" merge -q --no-edit origin/update/v1-refine 2>&1 | tail -1
for s in $CONCEPTS; do
  git "${ID[@]}" merge -q --no-edit -X ours "origin/concept/${s}" 2>&1 | tail -1 || echo "MERGE FAILED ${s}"
done
for s in $CONCEPTS; do
  [ "$(git rev-parse "HEAD:concepts/${s}")" = "$(git rev-parse "origin/concept/${s}:concepts/${s}")" ] && printf '%s=tip ' "$s" || printf '%s=DIFFERS ' "$s"
done
echo
node tools/us-spelling.mjs . | tail -2; echo "staging spelling exit $?"
