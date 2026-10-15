#!/bin/zsh
# Builds one zip per concept for the templates release: the concept's folder, its TEMPLATE.md and
# DESIGN.md, the repo's LICENSE and THIRD_PARTY.md, at the top level of a folder named for it.
# Anagram Tiles (v1) is the repo root, so its files are gathered from there.
#
#   tools/operator/build-templates.sh [out dir]      (default: dist/templates, which git ignores)

root=$(git rev-parse --show-toplevel) || exit 1
out=${1:-$root/dist/templates}
CONCEPTS=(one-splat specimen toybox workshop overprint molecule resonance slice atlas arcade)
work=$(mktemp -d)
mkdir -p "$out"

pack() {  # pack <name>: zips $work/<name> into $out/<name>-template.zip
  ( cd "$work" && rm -f "$out/$1-template.zip" && zip -q -r -X "$out/$1-template.zip" "$1" -x '*.DS_Store' )
  printf '%-14s %s\n' "$1" "$(du -h "$out/$1-template.zip" | cut -f1)"
}

# Anagram Tiles: the repo root's page.
d=$work/anagram-tiles; mkdir -p "$d"
cp "$root/index.html" "$root/main.js" "$root/styles.css" "$d/" && cp -R "$root/assets" "$d/"
cp "$root/docs/templates/anagram-tiles/TEMPLATE.md" "$root/docs/templates/anagram-tiles/DESIGN.md" "$d/"
cp "$root/LICENSE" "$root/THIRD_PARTY.md" "$d/"
pack anagram-tiles

for s in $CONCEPTS; do
  d=$work/$s; mkdir -p "$d"
  rsync -a --exclude '.DS_Store' "$root/concepts/$s/" "$d/"
  for f in TEMPLATE.md DESIGN.md; do [ -f "$d/$f" ] || echo "MISSING $s/$f"; done
  cp "$root/LICENSE" "$root/THIRD_PARTY.md" "$d/"
  pack "$s"
done
rm -rf "$work"
