#!/bin/zsh
# Records the Portfolios gallery's posters: a six-second trailer of each concept's first screen at
# poster shape (2:3), as WebM, MP4 and a WebP still, 540 by 810. Needs Google Chrome, Node 22 and
# ffmpeg. Copy the results into the homepage's portfolios/assets/posters/.
#
#   tools/operator/trailers.sh <base url> [slug ...]
#
# <base url> serves the concepts by slug, as the homepage's portfolios/ folder does
# (http://localhost:4191/portfolios). Output goes to dist/trailers/, which git ignores.
S=${0:A:h}
BASE=${1:?usage: trailers.sh <base url> [slug ...]}; shift
OUT=$(git rev-parse --show-toplevel)/dist/trailers
mkdir -p $OUT
SLUGS=(anagram-tiles one-splat specimen toybox workshop overprint molecule resonance slice atlas arcade)
(( $# )) && SLUGS=($@)
btn='const b=(re)=>[...document.querySelectorAll("button,a")].find(x=>re.test(x.textContent.trim()));'
typeset -A SETUP TICK
TICK[anagram-tiles]="$btn (b(/^Rearrange/i)||{click(){}}).click()"
SETUP[one-splat]='window.__v=0'
TICK[one-splat]='(()=>{const r=document.querySelector("input[type=range]");if(!r)return;const max=+r.max||14;window.__v=Math.min(max,(window.__v||0)+max/4);r.value=String(window.__v);r.dispatchEvent(new Event("input",{bubbles:true}));r.dispatchEvent(new Event("change",{bubbles:true}))})()'
TICK[specimen]="$btn (b(/^Fire/i)||{click(){}}).click()"
SETUP[toybox]='window.__i=0'
TICK[toybox]="$btn (()=>{const n=[/^1?\\s*Spin/i,/^2?\\s*Poke/i,/^3?\\s*Paint/i,/^4?\\s*Drop/i][(window.__i++)%4];const x=b(n);x&&x.click()})()"
SETUP[overprint]='window.__i=0'
TICK[overprint]="$btn (()=>{const n=[/^lorenz$/i,/^klein bottle$/i,/^gyroid$/i,/^name$/i][(window.__i++)%4];const x=b(n);x&&x.click()})()"
SETUP[molecule]='window.__i=0'
TICK[molecule]="(()=>{const ids=['LDP','SRO','1CRN','CFF'];const x=document.querySelector('[data-mol=\"'+ids[(window.__i=(window.__i||0)+1)%4]+'\"]');x&&x.click()})()"
SETUP[resonance]='window.__i=0'
TICK[resonance]="(()=>{const st=document.getElementById('stage')||document.querySelector('.stage');if(st)for(let k=0;k<3;k++)st.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowUp',bubbles:true}));const b=document.getElementById('bow-btn');b&&b.click()})()"
SETUP[slice]='window.__i=0'
TICK[slice]="(()=>{const s=['gar','walnut'][(window.__i=(window.__i||0)+1)%2];const x=document.querySelector('[data-scan='+s+']');x&&x.click()})()"
TICK[atlas]="(()=>{const x=document.getElementById('in');x&&x.click()})()"
for s in $SLUGS; do
  node $S/trailer.mjs "$BASE/$s/" "$OUT/$s" 720 1080 4500 6.5 $((9700 + RANDOM % 200)) "${SETUP[$s]:-0}" "${TICK[$s]:-}" | cut -c1-160
  ffmpeg -loglevel error -y -f concat -safe 0 -i "$OUT/$s/frames.txt" -vf "fps=30,scale=540:810:flags=lanczos,format=yuv420p" -t 6 -c:v libvpx-vp9 -b:v 0 -crf 40 -row-mt 1 -an "$OUT/$s.webm"
  ffmpeg -loglevel error -y -f concat -safe 0 -i "$OUT/$s/frames.txt" -vf "fps=30,scale=540:810:flags=lanczos,format=yuv420p" -t 6 -c:v libx264 -preset slow -crf 27 -movflags +faststart -an "$OUT/$s.mp4"
  first=$(ls $OUT/$s/f*.jpg | head -1)
  ffmpeg -loglevel error -y -i "$first" -vf "scale=540:810:flags=lanczos" -q:v 80 "$OUT/$s.webp" 2>/dev/null || cwebp -quiet -resize 540 810 -q 82 "$first" -o "$OUT/$s.webp"
  rm -rf "$OUT/$s"
  printf '%s  webm %s  mp4 %s  webp %s\n' $s "$(du -h $OUT/$s.webm | cut -f1)" "$(du -h $OUT/$s.mp4 | cut -f1)" "$(du -h $OUT/$s.webp | cut -f1)"
done
