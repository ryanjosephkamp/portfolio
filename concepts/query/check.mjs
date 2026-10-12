// Exhaustive check of the codes on the Query board. Run: node concepts/query/check.mjs
// (add --write to put the computed codes into index.html).
//
// The page says each code is the shortest query that ranks its project first outright,
// alphabetically earliest of that length. This script reads the entries out of index.html,
// scores them with a second BM25 written here from the formula, tries every string of one
// to four letters, and compares the answer with rank.js and with the page.

import { readFileSync, writeFileSync } from "node:fs";
import { buildIndex, search, codes } from "./rank.js";

const file = new URL("./index.html", import.meta.url);
let html = readFileSync(file, "utf8");
const fail = (msg) => {
  console.error("FAIL " + msg);
  process.exitCode = 1;
};

// The entries, as plain text.
const docs = [];
for (const m of html.matchAll(/<article class="doc[^"]*" id="p-([a-z-]+)"[\s\S]*?<\/article>/g)) {
  const text = (field) =>
    [...m[0].matchAll(new RegExp(`<(h3|p|li)\\b[^>]*\\bdata-f="${field}"[^>]*>([\\s\\S]*?)</\\1>`, "g"))]
      .map((x) => x[2].replace(/<[^>]+>/g, ""))
      .join(" ");
  const d = { id: m[1], name: text("name"), body: text("body"), shown: (m[0].match(/<b class="doc-code">([^<]*)<\/b>/) || [])[1] };
  if (/&/.test(d.name + d.body)) fail(`${d.id}: an ampersand or entity in indexed text would be read differently by a browser`);
  docs.push(d);
}
if (docs.length !== 10) fail(`expected ten entries, found ${docs.length}`);

// A second scorer, independent of rank.js.
const words = (s) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().match(/[a-z0-9]+/g) || [];
const D = docs.map((d) => ({ id: d.id, name: words(d.name), body: words(d.body) }));
const len = (d) => d.name.length + d.body.length;
const avg = D.reduce((sum, d) => sum + len(d), 0) / D.length;
function naive(term) {
  const tf = D.map((d) => d.body.filter((w) => w.startsWith(term)).length + 3 * d.name.filter((w) => w.startsWith(term)).length);
  const df = tf.filter(Boolean).length;
  if (!df) return null;
  const idf = Math.log(1 + (D.length - df + 0.5) / (df + 0.5));
  return tf.map((f, i) => (f ? (idf * f * 2.2) / (f + 1.2 * (0.25 + (0.75 * len(D[i])) / avg)) : 0));
}

// Every string of one to four characters, in alphabetical order within each length.
const ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const starts = new Set();
for (const d of D) for (const w of [...d.name, ...d.body]) for (let n = 1; n <= 4 && n <= w.length; n++) starts.add(w.slice(0, n));
const brute = new Map();
let tried = 0;
let scored = 0;
function attempt(s) {
  tried++;
  // What the page does with a typed plural.
  const term = s.length > 3 && s.endsWith("s") && !s.endsWith("ss") ? s.slice(0, -1) : s;
  if (!starts.has(term)) return; // no word on the page starts with it, so every score is zero
  const scores = naive(term);
  scored++;
  const order = scores.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]);
  if (order[0][0] - order[1][0] > 1e-12 && !brute.has(D[order[0][1]].id)) brute.set(D[order[0][1]].id, s);
}
function walk(prefix, depth) {
  for (const ch of ALPHABET) {
    const s = prefix + ch;
    if (s.length === depth) attempt(s);
    else walk(s, depth);
  }
}
for (let depth = 1; depth <= 4; depth++) walk("", depth);

// rank.js against the brute force, and against the page.
const index = buildIndex(docs);
const fast = codes(index);
for (const d of docs) {
  const a = brute.get(d.id);
  const b = fast.get(d.id);
  if (!a) fail(`${d.id}: no string of up to four characters ranks it first`);
  if (a !== b) fail(`${d.id}: brute force says "${a}", rank.js says "${b}"`);
  if (process.argv.includes("--write") && b && d.shown !== b) {
    html = html.replace(new RegExp(`(id="p-${d.id}"[\\s\\S]*?<b class="doc-code">)[^<]*`), `$1${b}`);
    d.shown = b;
  }
  if (d.shown !== b) fail(`${d.id}: the page shows "${d.shown}", the code is "${b}"`);
}
if (process.argv.includes("--write")) writeFileSync(file, html);

// rank.js against the second scorer, for every prefix of every word on the page.
let compared = 0;
const all = new Set();
for (const w of index.vocab) for (let n = 1; n <= w.length; n++) all.add(w.slice(0, n));
for (const q of all) {
  const term = q.length > 3 && q.endsWith("s") && !q.endsWith("ss") ? q.slice(0, -1) : q;
  const want = naive(term);
  const got = search(index, q).rows;
  for (const r of got) {
    compared++;
    if (Math.abs(r.score - want[r.order]) > 1e-9) fail(`"${q}" ${r.id}: ${r.score} against ${want[r.order]}`);
  }
}

if (!process.exitCode) {
  console.log(`ok: ${tried.toLocaleString("en-US")} strings tried, ${scored.toLocaleString("en-US")} of them start a word on the page`);
  console.log(`ok: ${compared.toLocaleString("en-US")} scores from rank.js agree with the second scorer`);
  console.log(`entries: ${D.map((d) => `${d.id} ${len(d)}`).join(", ")}; average ${avg.toFixed(1)} words`);
  console.log(`codes: ${docs.map((d) => `${d.id}=${d.shown}`).join(" ")}`);
}
