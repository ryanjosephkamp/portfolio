// Molecule: the chalk stages (a molecule, a unit cell, an orbital), the isomers and the
// element speller. The chemistry is in chem.js; tools/verify.mjs checks it.

import * as chem from "./chem.js";
import { MOLECULES } from "./data.js";

const TAU = Math.PI * 2;
const still = matchMedia("(prefers-reduced-motion: reduce)");
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const YELLOW = "#ffe45c";
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const tone = (c, k) => c.map((v) => (k >= 0 ? v + (255 - v) * k : v * (1 + k)));

// The slate's tooth: a fixed grain knocked out of everything drawn, so chalk stays
// chalk while the molecule moves under it.
let grain;
function grainPattern(ctx) {
  if (!grain) {
    grain = document.createElement("canvas");
    grain.width = grain.height = 256;
    const g = grain.getContext("2d");
    const img = g.createImageData(256, 256);
    const rand = chem.mulberry(11);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = rand();
      img.data[i + 3] = v > 0.55 ? (v - 0.55) * 330 : 0;
    }
    g.putImageData(img, 0, 0);
  }
  return ctx.createPattern(grain, "repeat");
}

// ---- A stage: one canvas, one thing to hold --------------------------------------------

class Stage {
  constructor(canvas, { onMeasure, spin = true } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.onMeasure = onMeasure || (() => {});
    this.rot = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    this.turn(-0.5, 0.35);
    this.scene = { atoms: [], bonds: [], extent: 1 };
    this.ball = 0.28; // how much of its van der Waals radius an atom is drawn with
    this.ballTo = 0.28;
    this.cartoon = 0;
    this.cartoonTo = 0;
    this.picks = [];
    this.cursor = -1;
    this.vel = [0, 0];
    this.spin = spin && !still.matches;
    this.visible = false;
    this.raf = 0;
    this.bind();
    new ResizeObserver(() => this.resize()).observe(canvas);
    new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      this.kick();
    }).observe(canvas);
    document.fonts?.ready.then(() => this.kick());
  }

  // Turn about the screen's vertical axis by ax and its horizontal axis by ay (radians).
  turn(ax, ay) {
    const [cx, sx, cy, sy] = [Math.cos(ax), Math.sin(ax), Math.cos(ay), Math.sin(ay)];
    const m = [cx, 0, sx, sx * sy, cy, -cx * sy, -sx * cy, sy, cx * cy];
    const r = this.rot;
    const o = new Array(9);
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++) o[i * 3 + j] = m[i * 3] * r[j] + m[i * 3 + 1] * r[3 + j] + m[i * 3 + 2] * r[6 + j];
    this.rot = o;
  }

  setScene(scene, keepView = false) {
    this.scene = scene;
    this.picks = [];
    this.cursor = -1;
    if (!keepView) this.vel = [0, 0];
    this.report();
    this.kick();
  }

  setMode(mode) {
    this.cartoonTo = mode === "cartoon" ? 1 : 0;
    this.ballTo = mode === "fill" ? 1 : 0.28;
    if (still.matches) [this.ball, this.cartoon] = [this.ballTo, this.cartoonTo];
    this.picks = [];
    this.report();
    this.kick();
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = r.width;
    this.h = r.height;
    this.canvas.width = Math.max(1, Math.round(r.width * dpr));
    this.canvas.height = Math.max(1, Math.round(r.height * dpr));
    this.dpr = dpr;
    this.draw();
  }

  kick() {
    if (!this.raf && this.visible) this.raf = requestAnimationFrame((t) => this.frame(t));
  }

  frame(t) {
    this.raf = 0;
    const dt = Math.min(0.05, (t - (this.last || t)) / 1000);
    this.last = t;
    let moving = false;
    if (this.spin && !this.dragging) (this.turn(dt * 0.35, 0), (moving = true));
    if (!this.dragging && Math.hypot(...this.vel) > 0.0004) {
      this.turn(this.vel[0], this.vel[1]);
      this.vel = this.vel.map((v) => v * 0.93);
      moving = true;
    }
    for (const k of ["ball", "cartoon"]) {
      const to = this[k + "To"];
      if (Math.abs(this[k] - to) > 0.004) ((this[k] += (to - this[k]) * Math.min(1, dt * 9)), (moving = true));
      else this[k] = to;
    }
    this.draw();
    if (moving && this.visible) this.kick();
    else this.last = 0;
  }

  // Which atoms can be picked: all of them, or the chain's alpha carbons in a cartoon.
  pickable(i) {
    return this.cartoonTo ? this.scene.labels?.[i]?.endsWith(" CA") : true;
  }

  project() {
    const { atoms, extent } = this.scene;
    const r = this.rot;
    const s = ((Math.min(this.w, this.h) / 2 - 14) / extent) * (this.scene.atoms.length ? 1.3 - 0.3 * Math.min(1, this.ball) : 1);
    this.scale = s;
    const cx = this.w / 2;
    const cy = this.h / 2;
    this.at = (p) => {
      const x = r[0] * p[0] + r[1] * p[1] + r[2] * p[2];
      const y = r[3] * p[0] + r[4] * p[1] + r[5] * p[2];
      const z = r[6] * p[0] + r[7] * p[1] + r[8] * p[2];
      const k = 1 + (z / extent) * 0.16;
      return [cx + x * s * k, cy - y * s * k, z, k];
    };
    this.proj = atoms.map((a) => this.at(a.p));
  }

  draw() {
    if (!this.w) return;
    const { ctx, scene } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.globalCompositeOperation = "source-over";
    this.project();
    const { at, proj, scale } = this;
    const depth = (z) => 0.62 + 0.38 * Math.max(0, Math.min(1, (z / scene.extent + 1) / 2));
    ctx.lineCap = "round";

    // The cell's outline, behind everything.
    if (scene.edges) {
      ctx.setLineDash([7, 7]);
      ctx.lineWidth = 1.6;
      for (const [a, b] of scene.edges) {
        const [p, q] = [at(a), at(b)];
        ctx.strokeStyle = `rgba(239,236,226,${0.25 + 0.3 * depth((p[2] + q[2]) / 2)})`;
        ctx.beginPath();
        ctx.moveTo(p[0], p[1]);
        ctx.lineTo(q[0], q[1]);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // A cloud of dots (the orbital).
    if (scene.points) {
      const pts = scene.points;
      const size = Math.max(1.3, this.w / 330);
      for (let i = 0; i < pts.length; i += 4) {
        if (scene.cut && pts[i] > 0) continue;
        const p = at([pts[i], pts[i + 1], pts[i + 2]]);
        ctx.fillStyle = pts[i + 3] > 0 ? `rgba(126,178,255,${0.35 + 0.6 * depth(p[2])})` : `rgba(255,150,178,${0.35 + 0.6 * depth(p[2])})`; // prettier-ignore
        ctx.fillRect(p[0], p[1], size, size);
      }
      ctx.fillStyle = "#efece2";
      const o = at([0, 0, 0]);
      ctx.beginPath();
      ctx.arc(o[0], o[1], 2.5, 0, TAU);
      ctx.fill();
    }

    // Everything solid, back to front.
    const items = [];
    const ball = this.ball * (1 - this.cartoon);
    if (ball > 0.02) {
      scene.atoms.forEach((a, i) => items.push({ z: proj[i][2], atom: i }));
      if (ball < 0.8)
        for (const [i, j, order] of scene.bonds) {
          const mid = scene.atoms[i].p.map((v, k) => (v + scene.atoms[j].p[k]) / 2);
          const m = at(mid);
          items.push({ z: (proj[i][2] + m[2]) / 2, from: proj[i], to: m, el: scene.atoms[i].el, order });
          items.push({ z: (proj[j][2] + m[2]) / 2, from: proj[j], to: m, el: scene.atoms[j].el, order });
        }
    }
    if (this.cartoon > 0.02 && scene.ribbon) {
      const rb = scene.ribbon;
      for (let i = 0; i < rb.length - 1; i++) {
        const [p, q] = [at(rb[i].p), at(rb[i + 1].p)];
        items.push({ z: (p[2] + q[2]) / 2, from: p, to: q, ss: rb[i].ss });
      }
    }
    items.sort((a, b) => a.z - b.z);
    const SS = { h: [[255, 122, 138], 1.15], s: [[255, 228, 92], 1.0], c: [[239, 236, 226], 0.34] };
    for (const it of items) {
      if (it.atom !== undefined) {
        const a = scene.atoms[it.atom];
        const [x, y, z, k] = proj[it.atom];
        const r = Math.max(2, a.r * ball * scale * k);
        const c = tone(chem.chalk(a.el), (depth(z) - 1) * 0.55);
        const g = ctx.createRadialGradient(x - r * 0.36, y - r * 0.42, r * 0.05, x, y, r);
        g.addColorStop(0, rgb(tone(c, 0.5)));
        g.addColorStop(0.55, rgb(c));
        g.addColorStop(1, rgb(tone(c, -0.5)));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.fill();
        ctx.lineWidth = Math.max(1, r * 0.07);
        ctx.strokeStyle = `rgba(245,243,232,${0.35 + 0.35 * depth(z)})`;
        ctx.stroke();
      } else if (it.ss) {
        const [c, wide] = SS[it.ss];
        ctx.strokeStyle = rgb(tone(c, (depth(it.z) - 1) * 0.6), this.cartoon);
        ctx.lineWidth = Math.max(2, wide * scale * 1.5);
        ctx.beginPath();
        ctx.moveTo(it.from[0], it.from[1]);
        ctx.lineTo(it.to[0], it.to[1]);
        ctx.stroke();
      } else {
        const c = tone(chem.chalk(it.el), (depth(it.z) - 1) * 0.55);
        const wdt = Math.max(2, 0.2 * scale);
        const dx = it.to[0] - it.from[0];
        const dy = it.to[1] - it.from[1];
        const len = Math.hypot(dx, dy) || 1;
        const off = it.order === 2 ? wdt * 0.75 : 0;
        ctx.strokeStyle = rgb(c);
        ctx.lineWidth = it.order === 2 ? wdt * 0.7 : wdt;
        for (const side of off ? [-1, 1] : [0]) {
          const ox = (-dy / len) * off * side;
          const oy = (dx / len) * off * side;
          ctx.beginPath();
          ctx.moveTo(it.from[0] + ox, it.from[1] + oy);
          ctx.lineTo(it.to[0] + ox, it.to[1] + oy);
          ctx.stroke();
        }
      }
    }

    // The grain of the slate, knocked out of the chalk.
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = this.pattern || (this.pattern = grainPattern(ctx));
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.globalCompositeOperation = "source-over";

    this.drawMeasure();
  }

  drawMeasure() {
    const { ctx, proj, picks } = this;
    const ring = (i, color, dash) => {
      const a = this.scene.atoms[i];
      const [x, y, , k] = proj[i];
      const r = Math.max(7, a.r * this.ball * (1 - this.cartoon) * this.scale * k + 5);
      ctx.setLineDash(dash || []);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    };
    if (this.cursor >= 0 && proj[this.cursor]) ring(this.cursor, "#efece2", [4, 5]);
    if (!picks.length) return;
    ctx.strokeStyle = YELLOW;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([9, 7]);
    ctx.beginPath();
    picks.forEach((i, n) => ctx[n ? "lineTo" : "moveTo"](proj[i][0], proj[i][1]));
    ctx.stroke();
    ctx.setLineDash([]);
    picks.forEach((i) => ring(i, YELLOW));
    const P = (i) => this.scene.atoms[i].p;
    let text = "";
    let where;
    if (picks.length === 2) {
      text = `${chem.distance(P(picks[0]), P(picks[1])).toFixed(2)} Å`;
      where = [(proj[picks[0]][0] + proj[picks[1]][0]) / 2, (proj[picks[0]][1] + proj[picks[1]][1]) / 2 - 12];
    } else if (picks.length === 3) {
      text = `${chem.angle(P(picks[0]), P(picks[1]), P(picks[2])).toFixed(1)}°`;
      const m = proj[picks[1]];
      const a0 = Math.atan2(proj[picks[0]][1] - m[1], proj[picks[0]][0] - m[0]);
      let a1 = Math.atan2(proj[picks[2]][1] - m[1], proj[picks[2]][0] - m[0]);
      let d = a1 - a0;
      while (d > Math.PI) d -= TAU;
      while (d < -Math.PI) d += TAU;
      a1 = a0 + d;
      ctx.strokeStyle = YELLOW;
      ctx.beginPath();
      ctx.arc(m[0], m[1], 26, a0, a1, d < 0);
      ctx.stroke();
      const mid = a0 + d / 2;
      where = [m[0] + Math.cos(mid) * 52, m[1] + Math.sin(mid) * 52 + 6];
    }
    if (text) {
      ctx.font = `700 ${Math.max(17, this.w / 26)}px "Shantell Sans", sans-serif`;
      ctx.textAlign = "center";
      ctx.lineJoin = "round";
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#1c2526";
      ctx.strokeText(text, where[0], where[1]);
      ctx.fillStyle = YELLOW;
      ctx.fillText(text, where[0], where[1]);
    }
  }

  name(i) {
    return this.scene.labels?.[i] ?? `${chem.BY_SYMBOL.get(this.scene.atoms[i].el.toLowerCase()).name.toLowerCase()} ${i + 1}`;
  }

  report() {
    const p = this.picks;
    const P = (i) => this.scene.atoms[i].p;
    let text = "";
    if (p.length === 1) text = `Picked ${this.name(p[0])}. Pick another atom for the distance.`;
    if (p.length === 2) text = `${this.name(p[0])} to ${this.name(p[1])}: ${chem.distance(P(p[0]), P(p[1])).toFixed(3)} Å. A third atom gives the angle.`; // prettier-ignore
    if (p.length === 3) text = `The angle at ${this.name(p[1])}, between ${this.name(p[0])} and ${this.name(p[2])}: ${chem.angle(P(p[0]), P(p[1]), P(p[2])).toFixed(1)}°.`; // prettier-ignore
    this.onMeasure(text, p);
  }

  pick(i) {
    if (i < 0) return;
    if (this.picks.length >= 3) this.picks = [];
    if (this.picks.includes(i)) this.picks = this.picks.filter((x) => x !== i);
    else this.picks.push(i);
    this.report();
    this.kick();
    this.draw();
  }

  erase() {
    this.picks = [];
    this.report();
    this.draw();
  }

  // The atom under a point: the nearest one in front whose drawn disc (or a finger's
  // width around it) covers the point.
  hit(x, y) {
    let best = -1;
    let bestZ = -Infinity;
    const ball = this.ball * (1 - this.cartoon);
    this.proj.forEach(([px, py, z, k], i) => {
      if (!this.pickable(i)) return;
      const r = Math.max(14, this.scene.atoms[i].r * ball * this.scale * k + 4);
      if (Math.hypot(px - x, py - y) <= r && z > bestZ) [best, bestZ] = [i, z];
    });
    return best;
  }

  bind() {
    const c = this.canvas;
    let start = null;
    c.addEventListener("pointerdown", (e) => {
      if (this.scene.points && e.pointerType === "touch" && !e.isPrimary) return;
      c.setPointerCapture(e.pointerId);
      start = { x: e.clientX, y: e.clientY, moved: 0, lx: e.clientX, ly: e.clientY };
      this.dragging = true;
      this.spin = false;
      this.vel = [0, 0];
      c.classList.add("holding");
    });
    c.addEventListener("pointermove", (e) => {
      if (!start) return;
      const dx = e.clientX - start.lx;
      const dy = e.clientY - start.ly;
      start.lx = e.clientX;
      start.ly = e.clientY;
      start.moved += Math.abs(dx) + Math.abs(dy);
      if (start.moved < 5) return;
      this.turn(dx * 0.011, dy * 0.011);
      this.vel = still.matches ? [0, 0] : [dx * 0.011, dy * 0.011];
      this.draw();
    });
    const end = (e) => {
      if (!start) return;
      const tap = start.moved < 5;
      start = null;
      this.dragging = false;
      c.classList.remove("holding");
      if (tap && e.type === "pointerup" && this.scene.atoms.length) {
        const r = c.getBoundingClientRect();
        this.pick(this.hit(e.clientX - r.left, e.clientY - r.top));
      }
      this.kick();
    };
    c.addEventListener("pointerup", end);
    c.addEventListener("pointercancel", end);
    c.addEventListener("keydown", (e) => {
      const step = 0.16;
      const n = this.scene.atoms.length;
      const move = (d) => {
        if (!n) return;
        let i = this.cursor;
        for (let k = 0; k < n; k++) {
          i = (i + d + n) % n;
          if (this.pickable(i)) break;
        }
        this.cursor = i;
      };
      const keys = {
        ArrowLeft: () => this.turn(-step, 0),
        ArrowRight: () => this.turn(step, 0),
        ArrowUp: () => this.turn(0, -step),
        ArrowDown: () => this.turn(0, step),
        "]": () => move(1),
        "[": () => move(-1),
        Enter: () => this.pick(this.cursor),
        " ": () => this.pick(this.cursor),
        Escape: () => this.erase(),
      };
      if (!keys[e.key]) return;
      e.preventDefault();
      this.spin = false;
      keys[e.key]();
      this.draw();
    });
    c.addEventListener("blur", () => {
      this.cursor = -1;
      this.draw();
    });
  }
}

// ---- The hero: a molecule you can hold ---------------------------------------------------

const SUB = "₀₁₂₃₄₅₆₇₈₉";
const sub = (n) => String(n).replace(/\d/g, (d) => SUB[d]);

// A smooth chain through the alpha carbons (Catmull-Rom), eight steps a residue.
function ribbon(trace) {
  const out = [];
  const at = (i) => trace[Math.max(0, Math.min(trace.length - 1, i))];
  for (let i = 0; i < trace.length - 1; i++) {
    const [a, b, c, d] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    for (let s = 0; s < 8; s++) {
      const t = s / 8;
      const p = [0, 1, 2].map(
        (k) => 0.5 * (2 * b[k] + (c[k] - a[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t * t + (3 * b[k] - 3 * c[k] + d[k] - a[k]) * t ** 3),
      );
      out.push({ p, ss: b[3] === c[3] ? b[3] : "c" });
    }
  }
  out.push({ p: trace[trace.length - 1].slice(0, 3), ss: "c" });
  return out;
}

function moleculeScene(key) {
  const m = MOLECULES[key];
  const atoms = m.atoms.map(([el, x, y, z]) => ({ el, p: [x, y, z], r: chem.VDW[el] ?? 1.7 }));
  const extent = Math.max(...atoms.map((a) => Math.hypot(...a.p) + a.r));
  return { atoms, bonds: m.bonds, extent, labels: m.labels, ribbon: m.trace && ribbon(m.trace) };
}

function tile(symbol) {
  const el = chem.BY_SYMBOL.get(symbol.toLowerCase());
  const s = document.createElement("span");
  s.className = "el";
  s.style.setProperty("--c", rgb(chem.cpk(symbol)));
  s.innerHTML = `<small>${el.z}</small>${el.symbol}<i>${el.name.toLowerCase()}</i>`;
  return s;
}

const heroCanvas = $("#hero-stage");
if (heroCanvas) {
  const readout = $("#hero-readout");
  const meta = $("#hero-meta");
  let current = "caffeine";
  let mode = "sticks";
  const idle = () =>
    mode === "cartoon"
      ? "Crambin as a cartoon: helices in pink chalk, strands in yellow. Tap along the chain to measure between residues."
      : `${MOLECULES[current].name}. Nothing measured yet.`;
  const hero = new Stage(heroCanvas, { onMeasure: (text) => (readout.textContent = text || idle()) });
  const show = (key) => {
    current = key;
    const m = MOLECULES[key];
    const cartoonBtn = $('[data-mode="cartoon"]');
    cartoonBtn.disabled = !m.trace;
    if (!m.trace && mode === "cartoon") setMode("sticks");
    hero.setScene(moleculeScene(key), true);
    const f = chem.formula(m.atoms.map((a) => a[0]));
    const hill = f.parts.map(([e, n]) => e + (n > 1 ? sub(n) : "")).join("");
    const ways = chem.spellings(m.name);
    meta.textContent = `${hill} · ${m.atoms.length} atoms${m.trace ? " (no hydrogens in the entry)" : ` · ${f.mass.toFixed(2)} g/mol`} · ${m.note}`;
    if (ways.length) meta.append(` · in elements: ${ways[0].join(" ")}${ways.length > 1 ? ` (one of ${ways.length} ways)` : ""}`);
    heroCanvas.setAttribute("aria-label", heroCanvas.getAttribute("aria-label").replace(/^An? \w+ molecule/, `A ${m.name.toLowerCase()} molecule`)); // prettier-ignore
    $$("[data-mol]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.mol === key));
  };
  const setMode = (next) => {
    mode = next;
    hero.setMode(next);
    $$("[data-mode]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.mode === next));
  };
  $$("[data-mol]").forEach((b) => b.addEventListener("click", () => show(b.dataset.mol)));
  $$("[data-mode]").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
  $("#hero-erase").addEventListener("click", () => hero.erase());
  show("caffeine");
}

// ---- A unit cell ----------------------------------------------------------------------------

const cellCanvas = $("#cell-stage");
if (cellCanvas) {
  const readout = $("#cell-readout");
  const meta = $("#cell-meta");
  let key = "diamond";
  let bonds = false;
  const RULE = { diamond: "a√3 ⁄ 4", fcc: "a ⁄ √2", bcc: "a√3 ⁄ 2" };
  const idle = () => `${chem.CRYSTALS[key].name}: a = ${chem.CRYSTALS[key].a} Å.`;
  const stage = new Stage(cellCanvas, { spin: false, onMeasure: (t) => (readout.textContent = t || idle()) });
  const show = () => {
    const c = chem.unitCell(key);
    // Touching spheres: each atom's radius is half the nearest-neighbor distance.
    const atoms = c.atoms.map((a) => ({ el: a.el, p: a.p, r: c.d / 2 }));
    stage.setScene({ atoms, bonds: c.bonds, edges: c.edges, extent: (c.a * Math.sqrt(3)) / 2 + c.d / 2 }, true);
    stage.ballTo = bonds ? 0.3 : 1;
    if (still.matches) stage.ball = stage.ballTo;
    meta.textContent = `One conventional cell of ${c.name.toLowerCase()}, with the lattice constant Splashery uses (${c.source}). Tap two touching atoms: the distance should come to ${RULE[c.kind]} = ${c.d.toFixed(3)} Å. Each atom has ${c.neighbors} nearest neighbors.`;
    $$("[data-crystal]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.crystal === key));
    stage.kick();
  };
  stage.ball = 1;
  $$("[data-crystal]").forEach((b) => b.addEventListener("click", () => ((key = b.dataset.crystal), show())));
  $("[data-cellmode]").addEventListener("click", (e) => {
    bonds = !bonds;
    e.currentTarget.setAttribute("aria-pressed", bonds);
    show();
  });
  show();
}

// ---- A hydrogen orbital ---------------------------------------------------------------------

const orbCanvas = $("#orbital-stage");
if (orbCanvas) {
  const readout = $("#orbital-readout");
  const stage = new Stage(orbCanvas, { spin: true });
  let q = [3, 2, 0];
  let cut = false;
  const count = innerWidth < 600 ? 5000 : 9000;
  const show = (label) => {
    const cloud = chem.sampleOrbital(...q, count, 1);
    // Fit to the radius that holds 98% of the dots.
    const radii = [];
    for (let i = 0; i < cloud.points.length; i += 4) radii.push(Math.hypot(cloud.points[i], cloud.points[i + 1], cloud.points[i + 2]));
    radii.sort((a, b) => a - b);
    stage.setScene({ atoms: [], bonds: [], points: cloud.points, cut, extent: radii[Math.floor(radii.length * 0.98)] }, true);
    if (label) readout.textContent = `${label}: n = ${q[0]}, l = ${q[1]}, m = ${q[2]}. ${q[0] - q[1] - 1} radial node${q[0] - q[1] - 1 === 1 ? "" : "s"}, ${count.toLocaleString("en")} dots.`; // prettier-ignore
  };
  $$("[data-orb]").forEach((b) =>
    b.addEventListener("click", () => {
      q = b.dataset.orb.split(",").map(Number);
      $$("[data-orb]").forEach((x) => x.setAttribute("aria-pressed", x === b));
      show(b.textContent.trim());
    }),
  );
  $("[data-cut]").addEventListener("click", (e) => {
    cut = !cut;
    e.currentTarget.setAttribute("aria-pressed", cut);
    stage.scene.cut = cut;
    stage.draw();
  });
  show("3d z²");
}

// ---- Isomers: the same eight letters, rearranged ----------------------------------------------

const isomer = $("#isomer");
if (isomer) {
  const row = $(".letters", isomer);
  const FORMS = ["RYAN KAMP", "MAY PRANK", "PARK MANY", "RAMP YANK", "ARMY KNAP"];
  let n = 0;
  $("#isomer-next").addEventListener("click", () => {
    n = (n + 1) % FORMS.length;
    const tiles = $$("span:not(.gap)", row);
    const gap = $(".gap", row);
    const before = new Map([...tiles, gap].map((t) => [t, t.getBoundingClientRect().left]));
    const pool = [...tiles];
    for (const ch of FORMS[n]) {
      if (ch === " ") row.append(gap);
      else row.append(pool.splice(pool.findIndex((t) => t.textContent === ch), 1)[0]); // prettier-ignore
    }
    if (still.matches) return;
    for (const [t, x] of before) {
      const dx = x - t.getBoundingClientRect().left;
      if (dx) t.animate([{ transform: `translate(${dx}px, ${dx > 0 ? -14 : 14}px)` }, { transform: "none" }], { duration: 520, easing: "cubic-bezier(.3,1.3,.5,1)" }); // prettier-ignore
    }
  });
}

// ---- Written in elements ------------------------------------------------------------------------

const spellIn = $("#spell-in");
if (spellIn) {
  const out = $("#spell-out");
  const write = () => {
    const word = spellIn.value.toLowerCase().replace(/[^a-z]/g, "");
    out.textContent = "";
    if (!word) return;
    const ways = chem.spellings(word);
    const p = (cls, text) => {
      const el = document.createElement("p");
      el.className = cls;
      el.textContent = text;
      out.append(el);
      return el;
    };
    if (!ways.length) {
      const far = chem.stuckAt(word);
      const el = p("stuck big", "");
      el.append(word.slice(0, far).toUpperCase());
      const b = document.createElement("b");
      b.textContent = word.slice(far).toUpperCase();
      el.append(b);
      p("meta", `No way. It stops at “${word[far].toUpperCase()}”: no symbol is ${word[far].toUpperCase()}${word[far + 1] ? ` or ${word[far].toUpperCase()}${word[far + 1]}` : ""} there.`);
      return;
    }
    for (const way of ways.slice(0, 4)) {
      const row = p("tiles way", "");
      way.forEach((s) => row.append(tile(s)));
    }
    p("meta", ways.length === 1 ? "One way." : `${ways.length.toLocaleString("en")} ways${ways.length > 4 ? "; the first four are drawn" : ""}.`);
  };
  spellIn.addEventListener("input", write);
  write();
}
