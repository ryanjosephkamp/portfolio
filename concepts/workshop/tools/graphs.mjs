// Refreshes what index.html says about the graphs in graphs/, using grooph
// itself: the "in grooph" links (grooph share) for each document. Needs the
// grooph CLI. Run: node concepts/workshop/tools/graphs.mjs   (add --check to only compare)
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const check = process.argv.includes('--check');
let html = readFileSync(`${root}index.html`, 'utf8');
let stale = 0;
for (const file of readdirSync(`${root}graphs`).filter((f) => f.endsWith('.grooph.json')).sort()) {
  const id = file.replace('.grooph.json', '');
  const out = spawnSync('grooph', ['share', `${root}graphs/${file}`], { encoding: 'utf8' });
  const link = (out.stdout + out.stderr).match(/https:\/\/\S+/)?.[0];
  if (out.status !== 0 || !link) { console.error(`grooph share failed for ${file}`); process.exit(1); }
  const at = new RegExp(`(<a data-open="${id}" href=")[^"]*(")`);
  if (!at.test(html)) { console.error(`index.html has no link for ${id}`); process.exit(1); }
  const next = html.replace(at, `$1${link}$2`);
  if (next !== html) stale += 1;
  html = next;
  console.log(`${id}: ${link.length} characters`);
}
if (check) { console.log(stale ? `${stale} link(s) out of date` : 'links match the documents'); process.exit(stale ? 1 : 0); }
writeFileSync(`${root}index.html`, html);
console.log(stale ? `updated ${stale} link(s) in index.html` : 'index.html already up to date');
