#!/bin/zsh
# Rechecks one concept branch as pushed: its worktree is clean and at the tip, it changes nothing
# outside its own folder, its new commits carry the noreply identity, the spelling check passes, and
# the ten projects are on the page with the capstone last.
#
#   tools/operator/check-lane.sh <slug> <tip before this round> [scratch dir]

slug=$1; old=$2; scratch=${3:-${TMPDIR:-/tmp}/check-lane}
root=$(git rev-parse --show-toplevel) || exit 1
git -C "$root" fetch -q origin

wt=$(git -C "$root" worktree list --porcelain | awk -v b="refs/heads/concept/$slug" '/^worktree /{w=$2} $0=="branch "b{print w}')
[ -n "$wt" ] && echo "worktree $wt: HEAD $(git -C "$wt" rev-parse --short HEAD), $(git -C "$wt" status --short | wc -l | tr -d ' ') uncommitted"
echo "tip: $(git -C "$root" rev-parse --short origin/concept/$slug)"
echo "--- files changed against main outside concepts/$slug/ (of $(git -C "$root" diff --name-only origin/main...origin/concept/$slug | wc -l | tr -d ' ')):"
git -C "$root" diff --name-only origin/main...origin/concept/$slug | grep -v "^concepts/$slug/"
echo "--- new commits"
git -C "$root" log --format='%h %ae | %ce | %s' $old..origin/concept/$slug | cut -c1-140

d=$scratch/$slug; rm -rf "$d" && mkdir -p "$d" && git -C "$root" archive origin/concept/$slug concepts/$slug | tar -x -C "$d"
echo "--- spelling"; (cd "$d" && node "$root/tools/us-spelling.mjs" concepts/$slug; echo "spelling exit $?")
echo "--- projects"
python3 -I - "$d/concepts/$slug/index.html" <<'PY'
import re, sys
html = open(sys.argv[1]).read()
body = re.sub(r'<script[\s\S]*?</script>|<style[\s\S]*?</style>|<!--[\s\S]*?-->', '', html)
low = body.lower()
names = ['Splashery', 'grooph', 'reword_nerd', 'resmon', 'Link Meteor', 'English OpenList', 'Ars Magna', 'aqrobat', 'Amordle', 'Speed-Accuracy']
print('missing from the page:', [n for n in names if n.lower() not in low])
heads = [(m.start(), re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', m.group(0)))) for m in re.finditer(r'<h[2-4][^>]*>[\s\S]*?</h[2-4]>', body)]
order = []
for pos, text in heads:
    for n in names:
        if n.lower() in text.lower() and n not in order:
            order.append(n)
print('named in headings, in order:', order)
i = low.find('speed-accuracy')
last = max([pos for pos, text in heads if any(n.lower() in text.lower() for n in names[:-1])] or [0])
print('capstone comes after the last other project heading:', i > last)
PY
