# portfolio

Ryan Kamp's portfolio site. One page, no build step, no dependencies.

The hero is a row of letter tiles spelling RYAN KAMP. Drag them, type on them, or press
**Rearrange**: the same eight letters also spell MAY PRANK, PARK MANY, RAMP YANK and ARMY KNAP.

## Run it

Any static file server works:

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173.

## Files

| File | What it holds |
|---|---|
| `index.html` | All of the content. Edit copy and links here. |
| `styles.css` | Design tokens at the top (`:root`), then one block per section. |
| `main.js` | The tile engine (`TileRow`), the hero's phrases and glosses (`ENTRIES`), and the art for the Splashery plate. |
| `assets/fonts/` | [Recursive](https://www.recursive.design/) variable font, latin subset (SIL Open Font License). |

To add an anagram to the hero, add an entry to `ENTRIES` in `main.js` and a fifth-plus `<i>` to `#pips`
in `index.html`. Every phrase must use exactly the same letters.

## Deploy

The site is plain files at the repository root, so GitHub Pages can serve the `main` branch as is.
