#!/bin/zsh
# Rebuilds the staging preview: origin/main, then any open operator branch, then every concept branch
# that is still open, with conflicts resolved toward staging. A concept whose pull request has merged
# is already on main and its branch is gone, so it is skipped. Staging is a local branch in the
# worktree .claude/worktrees/staging and is never pushed. Serve it with the launch config "staging"
# (port 4180).
#
#   tools/operator/rebuild-staging.sh [operator branch]

OPERATOR=${1:-$(git rev-parse --abbrev-ref HEAD)}
CONCEPTS=(one-splat specimen toybox workshop overprint molecule resonance slice atlas arcade)
ID=(-c user.name="Ryan" -c user.email="192532973+ryanjosephkamp@users.noreply.github.com")
has() { git rev-parse -q --verify "$1^{commit}" >/dev/null; }

cd "$(git rev-parse --show-toplevel)/../staging" 2>/dev/null || cd /Users/noir/portfolio/.claude/worktrees/staging || exit 1
[ -n "$(git status --short)" ] && { echo "staging has uncommitted changes; stopping"; exit 1; }

git fetch -q --prune origin && git reset -q --hard origin/main
if [ "$OPERATOR" != "main" ] && has "origin/$OPERATOR" && ! git merge-base --is-ancestor "origin/$OPERATOR" origin/main; then
  git "${ID[@]}" merge -q --no-edit "origin/$OPERATOR" 2>&1 | tail -1
fi
for s in $CONCEPTS; do
  if has "origin/concept/${s}"; then
    git "${ID[@]}" merge -q --no-edit -X ours "origin/concept/${s}" 2>&1 | tail -1 || echo "MERGE FAILED ${s}"
  fi
done
for s in $CONCEPTS; do
  if has "origin/concept/${s}"; then
    [ "$(git rev-parse "HEAD:concepts/${s}")" = "$(git rev-parse "origin/concept/${s}:concepts/${s}")" ] && printf '%s=branch tip ' "$s" || printf '%s=DIFFERS ' "$s"
  elif git cat-file -e "origin/main:concepts/${s}" 2>/dev/null; then
    printf '%s=main ' "$s"
  else
    printf '%s=MISSING ' "$s"
  fi
done
echo
node tools/us-spelling.mjs . | tail -2; echo "staging spelling exit $?"
