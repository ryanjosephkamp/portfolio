import { buildIndex, search, codes, fold, tokenize } from "./rank.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const still = matchMedia("(prefers-reduced-motion: reduce)");

/* ---------- split flaps ---------- */

// The drum: a flap turns forward through these, never backward.
const DRUM = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:-+*/'_×";
const TICK = 42;
const turning = new Set();
let frame = 0;
let lastTick = 0;

function makeCells(el, n) {
  el.textContent = "";
  const cells = [];
  for (let i = 0; i < n; i++) {
    const c = document.createElement("i");
    c.className = "c";
    c.innerHTML = '<b class="t"> </b><b class="b"> </b>';
    c._cur = " ";
    c._q = [];
    el.append(c);
    cells.push(c);
  }
  return cells;
}

function flapTo(c, ch, wait, most) {
  if (c._target === ch) return;
  c._target = ch;
  if (still.matches) {
    c._cur = c.firstChild.textContent = c.lastChild.textContent = ch;
    c._q = [];
    return;
  }
  let a = DRUM.indexOf(c._cur);
  const b = DRUM.indexOf(ch);
  const q = [];
  if (a < 0 || b < 0) q.push(ch);
  else {
    let steps = (b - a + DRUM.length) % DRUM.length;
    const max = most || 4 + ((Math.random() * 4) | 0);
    if (steps > max) {
      a = (b - max + DRUM.length) % DRUM.length;
      steps = max;
    }
    for (let k = 1; k <= steps; k++) q.push(DRUM[(a + k) % DRUM.length]);
  }
  c._q = q;
  c._wait = Math.round(wait || 0);
  turning.add(c);
  if (!frame) frame = requestAnimationFrame(tick);
}

function setText(cells, text, wait = 0, most = 0) {
  const s = String(text).toUpperCase().padEnd(cells.length).slice(0, cells.length);
  if (cells[0]) cells[0].parentNode.dataset.text = s.trimEnd();
  cells.forEach((c, i) => flapTo(c, s[i], wait + i * 0.3, most));
}

function tick(now) {
  frame = 0;
  if (now - lastTick >= TICK) {
    lastTick = now;
    let moved = 0;
    for (const c of turning) {
      if (c._wait > 0) {
        c._wait--;
        continue;
      }
      const top = c.firstChild;
      const bottom = c.lastChild;
      if (!c._q.length) {
        bottom.textContent = c._cur;
        c.classList.remove("f1", "f2");
        turning.delete(c);
        continue;
      }
      bottom.textContent = top.textContent;
      c._cur = top.textContent = c._q.shift();
      const one = c.classList.contains("f1");
      c.classList.toggle("f1", !one);
      c.classList.toggle("f2", one);
      moved++;
    }
    if (moved) clack(moved);
  }
  if (turning.size) frame = requestAnimationFrame(tick);
}

/* ---------- the sound of a flap, off until asked for ---------- */

let audio = null;
let noise = null;
const soundBtn = $("#sound");
function clack(n) {
  if (!audio || audio.state !== "running") return;
  const src = audio.createBufferSource();
  const gain = audio.createGain();
  const filter = audio.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1700 + Math.random() * 900;
  gain.gain.value = Math.min(0.05 + n * 0.006, 0.16);
  src.buffer = noise;
  src.connect(filter).connect(gain).connect(audio.destination);
  src.start();
}
soundBtn.addEventListener("click", () => {
  const on = soundBtn.getAttribute("aria-pressed") !== "true";
  if (on && !audio) {
    audio = new (window.AudioContext || window.webkitAudioContext)();
    noise = audio.createBuffer(1, audio.sampleRate * 0.03, audio.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3;
  }
  if (audio) on ? audio.resume() : audio.suspend();
  soundBtn.setAttribute("aria-pressed", String(on));
  soundBtn.textContent = "Flap sound: " + (on ? "on" : "off");
});

/* ---------- the documents are the page ---------- */

const list = $("#results");
const docs = $$(".doc", list).map((el) => ({
  id: el.id.slice(2),
  el,
  name: $$('[data-f="name"]', el).map((e) => e.textContent).join(" "),
  body: $$('[data-f="body"]', el).map((e) => e.textContent).join(" "),
  board: el.dataset.board,
  group: el.dataset.group,
}));
const byId = Object.fromEntries(docs.map((d) => [d.id, d]));
const index = buildIndex(docs);
const code = codes(index);

for (const d of docs) {
  d.rank = makeCells($(".doc-rank", d.el), 2);
  d.code = code.get(d.id) || "";
  $(".doc-code", d.el).textContent = d.code;
  $(".doc-codebtn", d.el).addEventListener("click", () => setQuery(d.code));
  d.why = document.createElement("div");
  d.why.className = "why";
  d.why.hidden = true;
  $(".doc-h", d.el).after(d.why);
}

/* ---------- the board ---------- */

const COLS = [["rank", 2], ["code", 5], ["name", 16], ["why", 22], ["score", 5]];
const boardEl = $("#board");
const rows = docs.map(() => {
  const li = document.createElement("li");
  li.className = "row";
  const a = document.createElement("a");
  li.append(a);
  const row = { li, a };
  for (const [key, n] of COLS) {
    const g = document.createElement("span");
    g.className = "g g-" + key;
    g.style.setProperty("--k", n);
    g.setAttribute("aria-hidden", "true");
    a.append(g);
    row[key] = makeCells(g, n);
  }
  boardEl.append(li);
  return row;
});

const nameCells = makeCells($("#name"), 9);
const clockCells = makeCells($("#clock"), 5);
const qCells = makeCells($("#qcells"), 18);
const input = $("#q");
const status = $("#status");

function showClock() {
  const d = new Date();
  setText(clockCells, String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"));
}

/* ---------- moving things: first, last, invert, play ---------- */

function reorder(parent, els) {
  if (els.every((e, i) => parent.children[i] === e)) return;
  const before = new Map(els.map((e) => [e, e.getBoundingClientRect()]));
  for (const e of els) parent.append(e);
  if (still.matches) return;
  for (const e of els) {
    const was = before.get(e);
    const now = e.getBoundingClientRect();
    const dx = was.left - now.left;
    const dy = was.top - now.top;
    if (dx || dy) e.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 560, easing: "cubic-bezier(.2,.8,.2,1)" });
  }
}

/* ---------- matched words, marked where they stand ---------- */

function unmark(root) {
  const marks = $$("mark.hit", root);
  for (const m of marks) m.replaceWith(m.textContent);
  if (marks.length) root.normalize();
}

function mark(root, terms) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const n of nodes) {
    const p = n.parentElement;
    if (!p.closest("[data-f]") || p.closest(".cells")) continue;
    const parts = n.nodeValue.split(/([A-Za-z0-9À-ɏ]+)/);
    if (!parts.some((w, i) => i % 2 && terms.some((t) => fold(w).startsWith(t)))) continue;
    const frag = document.createDocumentFragment();
    parts.forEach((w, i) => {
      if (i % 2 && terms.some((t) => fold(w).startsWith(t))) {
        const m = document.createElement("mark");
        m.className = "hit";
        m.textContent = w;
        frag.append(m);
      } else frag.append(w);
    });
    n.replaceWith(frag);
  }
}

/* ---------- Splashery's shelves ---------- */

const shelfList = $("#shelves");
const shelves = $$("li", shelfList).map((el, i) => ({
  el,
  i,
  key: el.dataset.shelf,
  label: $("b", el).textContent,
  words: tokenize(el.textContent),
  title: tokenize($("b", el).textContent),
  gate: makeCells($(".gate", el), 2),
}));
const splatLabel = makeCells($("#splat-label"), 18);

function rankShelves(terms) {
  const scored = shelves.map((s) => {
    let n = 0;
    for (const t of terms) n += s.words.filter((w) => w.startsWith(t)).length + 2 * s.title.filter((w) => w.startsWith(t)).length;
    return { s, n };
  });
  scored.sort((a, b) => b.n - a.n || a.s.i - b.s.i);
  reorder(shelfList, scored.map((x) => x.s.el));
  scored.forEach((x, i) => {
    x.s.el.classList.toggle("on", x.n > 0);
    setText(x.s.gate, String(i + 1).padStart(2, "0"), i * 0.5);
  });
  const hits = scored.filter((x) => x.n > 0).length;
  $("#shelf-count").textContent = terms.length ? `· ${hits} of ${shelves.length} match` : "";
  const top = hits ? scored[0].s : null;
  setText(splatLabel, top ? top.label : "any shelf");
  splat.shape(top ? top.key : "blob");
}

/* ---------- one query, the whole page ---------- */

const fmt = (x) => x.toFixed(2);
let lastQuery = null;

function render(q) {
  if (q === lastQuery) return;
  lastQuery = q;
  const t0 = performance.now();
  const res = search(index, q);
  const ms = performance.now() - t0;
  const has = res.terms.length > 0;
  const terms = res.terms.map((t) => t.term);
  const best = res.rows[0].score || 1;

  res.rows.forEach((r, i) => {
    const d = byId[r.id];
    const row = rows[i];
    const hit = r.score > 0;
    const no = String(i + 1).padStart(2, "0");
    row.a.href = "#p-" + r.id;
    row.a.setAttribute("aria-label", `${i + 1}. ${d.name}` + (has ? (hit ? `, score ${fmt(r.score)}` : ", no match") : ""));
    row.li.classList.toggle("miss", has && !hit);
    row.li.classList.toggle("first", has && hit && i === 0);
    setText(row.rank, no, i);
    setText(row.code, d.code, i + 1);
    setText(row.name, d.board, i + 2);
    setText(row.why, !has ? d.group : hit ? r.parts.map((p) => `${p.term}×${p.tf}`).join(" ") : "no match", i + 5);
    setText(row.score, has && hit ? fmt(r.score).padStart(5) : "", i + 9);

    setText(d.rank, no, i);
    d.el.classList.toggle("miss", has && !hit);
    d.el.classList.toggle("first", has && hit && i === 0);
    unmark(d.el);
    if (has) mark(d.el, terms);
    d.why.hidden = !has;
    if (has) d.why.innerHTML = explain(r, res, best, i);
  });

  reorder(list, res.rows.map((r) => byId[r.id].el));
  rankShelves(terms);
  setText(olWord, terms[0] || "provenance", 0, 3);

  if (!has) status.textContent = "All ten on the board, in scheduled order.";
  else if (!res.matched) status.textContent = `No word on this page starts with “${terms.join("” or “")}”. Scheduled order holds.`;
  else status.textContent = `${res.matched} of 10 match. First out: ${byId[res.rows[0].id].name}, ${fmt(res.rows[0].score)}. Ranked in ${ms < 1 ? ms.toFixed(2) : ms.toFixed(1)} ms.`;
}

function explain(r, res, best, i) {
  if (!r.score) {
    return `<p class="why-h">No match</p><p>None of this entry's ${r.len} words starts with ${res.terms.map((t) => `<b>${t.term}</b>`).join(" or ")}. It keeps its scheduled place under the matches.</p>`;
  }
  const lines = r.parts
    .map((p) => {
      const where = p.name ? `${p.body} in the text + ${p.name} in the name ×3 = ${p.tf}` : `${p.tf} in the text`;
      return `<li><b class="term">${p.term}</b><span>${where}</span><span>in ${p.df} of 10 entries, so worth ${fmt(p.idf)}</span><span class="pts">+${fmt(p.points)}</span><i class="bar" style="--w:${Math.round((p.points / best) * 100)}%"></i><small>${p.words.join(", ")}</small></li>`;
    })
    .join("");
  const ratio = r.len / index.avgLen;
  const length = `This entry is ${r.len} words; the average is ${Math.round(index.avgLen)}. ${ratio > 1.15 ? "A long entry needs more hits for the same points." : ratio < 0.85 ? "A short entry earns more from each hit." : "Length barely moves its score."}`;
  return `<p class="why-h">Why No ${String(i + 1).padStart(2, "0")} <span>score ${fmt(r.score)}</span></p><ul>${lines}</ul><p>${length}</p>`;
}

function paintQuery() {
  setText(qCells, input.value, 0, 2);
  qCells.forEach((c, i) => c.classList.toggle("caret", i === Math.min(input.value.length, qCells.length - 1)));
}

function setQuery(q) {
  input.value = q;
  paintQuery();
  render(q);
  history.replaceState(null, "", q ? "#q=" + encodeURIComponent(q) : location.pathname + location.search);
}

input.addEventListener("input", () => setQuery(input.value));
$("#chips").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (b) setQuery(b.dataset.q);
});
addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement !== input) {
    e.preventDefault();
    input.focus();
  } else if (e.key === "Escape" && document.activeElement === input) setQuery("");
});

/* ---------- art: a cloud of splats ---------- */

function mulberry(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TAU = Math.PI * 2;
const onSphere = (r, R) => {
  const u = r() * 2 - 1;
  const a = r() * TAU;
  const s = Math.sqrt(1 - u * u);
  return [s * Math.cos(a) * R, u * R, s * Math.sin(a) * R];
};
// Each shape places one splat from its number t in [0, 1) and a seeded random source r.
const SHAPES = {
  blob: (t, r) => {
    const p = onSphere(r, 1);
    const k = 0.82 + 0.16 * Math.sin(5 * p[0]) * Math.cos(4 * p[1] + p[2] * 3);
    return [p[0] * k, p[1] * k, p[2] * k];
  },
  space: (t, r) => {
    if (t < 0.58) return onSphere(r, 0.62);
    const a = r() * TAU;
    const R = 0.92 + r() * 0.42;
    return [Math.cos(a) * R, Math.cos(a) * R * 0.32, Math.sin(a) * R];
  },
  tiny: (t, r) => {
    const y = (t - 0.5) * 2.3;
    const a = t * 13;
    const k = Math.floor(r() * 3);
    if (k < 2) return [Math.cos(a + k * Math.PI) * 0.46, y, Math.sin(a + k * Math.PI) * 0.46];
    const s = Math.round(t * 22) / 22;
    const m = r() * 2 - 1;
    return [Math.cos(s * 13) * 0.46 * m, (s - 0.5) * 2.3, Math.sin(s * 13) * 0.46 * m];
  },
  atoms: (t, r) => {
    if (t < 0.2) return onSphere(r, 0.2 * Math.cbrt(r()));
    const a = r() * TAU;
    const tilt = (Math.floor(t * 90) % 3) * (Math.PI / 3);
    const x = Math.cos(a) * 1.05;
    const z = Math.sin(a) * 1.05;
    return [x * Math.cos(tilt) + (r() - 0.5) * 0.04, x * Math.sin(tilt), z * 0.9];
  },
  body: (t, r) => {
    const a = r() * TAU;
    const k = Math.sqrt(r());
    const x = (16 * Math.sin(a) ** 3) / 17;
    const y = (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 17;
    return [x * k, y * k + 0.1, (r() - 0.5) * 0.7 * (1 - k * k)];
  },
  nature: (t) => {
    const R = Math.sqrt(t) * 1.1;
    const a = t * 900 * 2.39996;
    return [Math.cos(a) * R, Math.sin(a) * R, 0.35 * (1 - R * R)];
  },
  weather: (t, r) => {
    const R = 0.1 + 0.85 * t ** 1.7;
    const a = t * 26 + r() * 0.9;
    return [Math.cos(a) * R, (t - 0.5) * 2.2, Math.sin(a) * R];
  },
  food: (t, r) => {
    const a = r() * TAU;
    const b = r() * TAU;
    const R = 0.74 + 0.32 * Math.cos(b);
    return [Math.cos(a) * R, 0.32 * Math.sin(b), Math.sin(a) * R];
  },
  playthings: (t, r) => {
    const p = [r() * 2 - 1, r() * 2 - 1, r() * 2 - 1];
    const f = Math.floor(r() * 3);
    p[f] = r() < 0.5 ? -1 : 1;
    return p.map((v) => v * 0.72);
  },
  games: (t, r) => {
    let x, z;
    do {
      x = Math.floor(r() * 8);
      z = Math.floor(r() * 8);
    } while ((x + z) % 2 && r() < 0.8);
    return [((x + r()) / 4 - 1) * 1.05, -0.2, ((z + r()) / 4 - 1) * 1.05];
  },
  landmarks: (t, r) => {
    const h = 1 - Math.sqrt(r());
    const w = (1 - h) * 0.95;
    const s = r() * 2 - 1;
    const f = Math.floor(r() * 4);
    const x = f < 2 ? s * w : f === 2 ? w : -w;
    const z = f < 2 ? (f ? w : -w) : s * w;
    return [x, h * 1.5 - 0.7, z];
  },
  vehicles: (t, r) => {
    if (t < 0.3) {
      const p = onSphere(r, 0.42);
      return [p[0], Math.abs(p[1]) + 0.1, p[2]];
    }
    const p = onSphere(r, 1);
    return [p[0] * 1.15, p[1] * 0.16, p[2] * 1.15];
  },
  animals: (t, r) => {
    const a = t * 15;
    const R = 0.09 * Math.exp(0.16 * a);
    const b = r() * TAU;
    const tube = R * 0.42;
    return [Math.cos(a) * (R + tube * Math.cos(b)) - 0.1, Math.sin(a) * (R + tube * Math.cos(b)), tube * Math.sin(b) * 1.4];
  },
  math: (t, r) => {
    const a = t * TAU;
    const R = 0.72 + 0.3 * Math.cos(3 * a);
    return [Math.cos(2 * a) * R + (r() - 0.5) * 0.09, 0.34 * Math.sin(3 * a) + (r() - 0.5) * 0.09, Math.sin(2 * a) * R + (r() - 0.5) * 0.09];
  },
  waves: (t, r) => {
    const x = r() * 2.3 - 1.15;
    const z = r() * 2.3 - 1.15;
    const d = Math.hypot(x, z);
    return [x, (0.2 * Math.sin(11 * d)) / (1 + 1.6 * d), z];
  },
  light: (t, r) => {
    if (t < 0.3) {
      const e = Math.floor(r() * 3);
      const s = r();
      const A = [[-0.45, -0.4], [0.45, -0.4], [0, 0.42]];
      const p = A[e];
      const q = A[(e + 1) % 3];
      return [p[0] + (q[0] - p[0]) * s, p[1] + (q[1] - p[1]) * s, (r() - 0.5) * 0.5];
    }
    if (t < 0.42) {
      const s = r();
      return [-1.2 + s * 0.98, -0.32 + s * 0.3, 0];
    }
    const ray = Math.floor(r() * 7);
    const s = r();
    return [0.25 + s * 0.95, 0.02 - s * (0.12 + ray * 0.07), (r() - 0.5) * 0.06];
  },
  sound: (t, r) => {
    for (let k = 0; k < 60; k++) {
      const x = r() * 2 - 1;
      const z = r() * 2 - 1;
      const f = Math.cos(3 * Math.PI * x * 0.5) * Math.cos(5 * Math.PI * z * 0.5) - Math.cos(5 * Math.PI * x * 0.5) * Math.cos(3 * Math.PI * z * 0.5);
      if (Math.abs(f) < 0.07) return [x * 1.05, -0.1, z * 1.05];
    }
    return [0, -0.1, 0];
  },
  volumes: (t, r) => {
    const y = (Math.floor(r() * 9) - 4) / 4.4;
    const R = Math.sqrt(1 - y * y) * Math.sqrt(r()) * 0.98;
    const a = r() * TAU;
    return [Math.cos(a) * R, y, Math.sin(a) * R];
  },
  scale: (t, r) => {
    const R = r() ** 0.7 * 1.25;
    const a = R * 4.2 + Math.floor(r() * 2) * Math.PI + (r() - 0.5) * 0.7;
    return [Math.cos(a) * R, ((r() - 0.5) * 0.3) / (1 + 4 * R), Math.sin(a) * R];
  },
  earth: (t, r) => {
    const x = r() * 2.3 - 1.15;
    const z = r() * 2.3 - 1.15;
    return [x, 0.22 * (Math.sin(3 * x) + 0.7 * Math.cos(2.3 * z) + 0.4 * Math.sin(5 * x + 2 * z)) - 0.1, z];
  },
};

const splat = (() => {
  const canvas = $("#splat");
  const ctx = canvas.getContext("2d");
  const N = innerWidth < 700 ? 620 : 1100;
  const pts = Array.from({ length: N }, () => ({ x: 0, y: 0, z: 0, tx: 0, ty: 0, tz: 0, ox: 0, oy: 0, sx: 0, sy: 0, size: 0.7 + Math.random() * 0.9, hot: Math.random() < 0.24, wait: 0 }));
  const sprite = (rgb) => {
    const s = document.createElement("canvas");
    s.width = s.height = 64;
    const g = s.getContext("2d");
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, `rgba(${rgb},.9)`);
    grad.addColorStop(0.4, `rgba(${rgb},.22)`);
    grad.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return s;
  };
  const white = sprite("244,240,230");
  const yellow = sprite("255,210,26");
  let key = "";
  let angle = 0.6;
  let seen = false;
  let raf = 0;
  let last = 0;
  let settle = 0;

  function shape(next) {
    if (next === key) return;
    key = next;
    let seed = 7;
    for (const ch of key) seed = (seed * 31 + ch.charCodeAt(0)) | 0;
    const r = mulberry(seed);
    const fn = SHAPES[key] || SHAPES.blob;
    pts.forEach((p, i) => {
      [p.tx, p.ty, p.tz] = fn(i / N, r);
      p.wait = still.matches ? 0 : (i / N) * 26;
    });
    settle = 140;
    wake();
  }

  function draw(now) {
    raf = 0;
    const dt = Math.min((now - last) / 16.7, 3) || 1;
    last = now;
    const w = canvas.width;
    const h = canvas.height;
    const sc = Math.min(w, h) * 0.34;
    if (!still.matches) angle += 0.006 * dt;
    const ca = Math.cos(angle);
    const sa = Math.sin(angle);
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    for (const p of pts) {
      if (p.wait > 0) p.wait -= dt;
      else {
        const k = still.matches ? 1 : 0.14;
        p.x += (p.tx - p.x) * k;
        p.y += (p.ty - p.y) * k;
        p.z += (p.tz - p.z) * k;
      }
      p.ox *= 0.92;
      p.oy *= 0.92;
      const x = p.x * ca + p.z * sa;
      const z = p.z * ca - p.x * sa;
      const y = p.y * 0.94 + z * 0.34;
      const f = 3.2 / (3.2 + z * 0.94 - p.y * 0.34);
      p.sx = w / 2 + x * sc * f + p.ox;
      p.sy = h / 2 - y * sc * f + p.oy;
      const d = sc * 0.034 * p.size * f;
      ctx.globalAlpha = Math.min(0.9, 0.2 + f * 0.42);
      ctx.drawImage(p.hot ? yellow : white, p.sx - d, p.sy - d, d * 2, d * 2);
    }
    ctx.globalAlpha = 1;
    if (settle > 0) settle -= dt;
    if (seen && (!still.matches || settle > 0)) raf = requestAnimationFrame(draw);
  }
  function wake() {
    if (!raf && seen) raf = requestAnimationFrame(draw);
  }
  function size() {
    const side = Math.round(canvas.clientWidth * Math.min(devicePixelRatio || 1, 2));
    if (side && canvas.width !== side) canvas.width = canvas.height = side;
    settle = Math.max(settle, 2);
    wake();
  }
  // Poke: splats near the pointer jump away and drift home.
  canvas.addEventListener("pointermove", (e) => {
    const box = canvas.getBoundingClientRect();
    const k = canvas.width / box.width;
    const mx = (e.clientX - box.left) * k;
    const my = (e.clientY - box.top) * k;
    const reach = canvas.width * 0.13;
    for (const p of pts) {
      const dx = p.sx - mx;
      const dy = p.sy - my;
      const d = Math.hypot(dx, dy);
      if (d < reach && d > 0.01) {
        const push = ((reach - d) / reach) * canvas.width * 0.05;
        p.ox += (dx / d) * push;
        p.oy += (dy / d) * push;
      }
    }
    settle = Math.max(settle, 60);
    wake();
  });
  new IntersectionObserver(([en]) => {
    seen = en.isIntersecting;
    wake();
  }).observe(canvas);
  new ResizeObserver(size).observe(canvas);
  return { shape };
})();

/* ---------- art: English OpenList, resmon ---------- */

setText(makeCells($("#ol-count"), 7), "345,000");
const olWord = makeCells($("#ol-word"), 12);

const arrivals = (() => {
  const el = $("#arrivals");
  const LEFT = ["arXiv", "PubMed", "OpenAlex", "Duplicates", "Report"];
  const STEPS = [
    ["scheduled", "scheduled", "scheduled", "waiting", "waiting"],
    ["searching", "searching", "searching", "waiting", "waiting"],
    ["arrived", "searching", "arrived", "waiting", "waiting"],
    ["arrived", "arrived", "arrived", "checking", "waiting"],
    ["arrived", "arrived", "arrived", "removed", "compiling"],
    ["arrived", "arrived", "arrived", "removed", "compiled"],
    ["arrived", "arrived", "arrived", "removed", "compiled"],
  ];
  const lines = LEFT.map((label) => {
    const row = document.createElement("div");
    row.className = "mini-row";
    const a = document.createElement("span");
    const b = document.createElement("span");
    a.className = "cells";
    b.className = "cells st";
    row.append(a, b);
    el.append(row);
    setText(makeCells(a, 10), label);
    return { row, cells: makeCells(b, 9) };
  });
  let step = still.matches ? STEPS.length - 1 : 0;
  let timer = 0;
  const show = () =>
    lines.forEach((l, i) => {
      setText(l.cells, STEPS[step][i], i);
      l.row.classList.toggle("done", /arrived|removed|compiled/.test(STEPS[step][i]));
    });
  show();
  new IntersectionObserver(([en]) => {
    clearInterval(timer);
    if (en.isIntersecting && !still.matches) {
      timer = setInterval(() => {
        step = (step + 1) % STEPS.length;
        show();
      }, 1500);
    }
  }).observe(el);
})();

/* ---------- start ---------- */

setText(nameCells, "Ryan Kamp", 4);
showClock();
setInterval(showClock, 15000);
input.addEventListener("focus", paintQuery);
const start = decodeURIComponent((location.hash.match(/^#q=(.*)$/) || [])[1] || "").slice(0, 18);
input.value = start;
paintQuery();
render(start);
