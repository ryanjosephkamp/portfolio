// Ryan Kamp — the workshop. No dependencies. The toy kit is in kit.js.
import { build, measure, revLetter, R, TAU, BAR, BUDGET } from './kit.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const $ = (s) => document.querySelector(s);
const sleep = (ms) => new Promise((res) => { setTimeout(res, reduce.matches ? 0 : ms); });
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const FONT = "'National Park', ui-rounded, system-ui, sans-serif";
const PAPER = [244, 240, 230];
const INK = [42, 41, 39];
const RED = '#c5281c';
const LIGHT = [-0.47, 0.6, 0.65]; // over the left shoulder, as at a drafting table

// ---------- the drawing: every splat is one pencil ellipse ----------
function makeBoard(canvas) {
  const ctx = canvas.getContext('2d');
  let W = 1, H = 1, dpr = 1, S = 100;
  let yaw = 0.55, pitch = 0.66;
  let splats = [];
  let grow = { t0: 0, ms: 0 };
  let marks = [];
  let poke = null;
  let list = [];
  let down = null;
  let lastInput = -1e9, lastFrame = 0, dirty = true, visible = true;
  let onMarks = () => {};

  function resize() {
    const b = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(b.width));
    H = Math.max(1, Math.round(b.height));
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    S = Math.min(W / 3.25, H / 2.7);
    dirty = true;
  }

  function draw(now) {
    const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const rt = [cyw, 0, syw], up = [syw * sp, cp, -cyw * sp], fw = [-syw * cp, sp, cyw * cp];
    const cx = W / 2, cy = H * 0.5;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // Construction lines, in non-photo blue: center lines and the ring's axis circle.
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(64,150,180,0.7)';
    ctx.setLineDash([14, 4, 2, 4]);
    ctx.beginPath();
    ctx.moveTo(cx - S * 1.6, cy); ctx.lineTo(cx + S * 1.6, cy);
    ctx.moveTo(cx, cy - S * 1.3); ctx.lineTo(cx, cy + S * 1.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, cy, R * S, Math.max(R * S * sp, 0.5), 0, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);

    const frac = grow.ms ? Math.min((now - grow.t0) / grow.ms, 1) : 1;
    const tp = poke ? (now - poke.t0) / 1000 : 0;
    if (poke && tp > 2.6) poke = null;
    list = [];
    for (const s of splats) {
      if (s.order > frac) continue;
      const f = dot(s.n, fw);
      if (f < -0.05) continue; // facing away: hidden by the near side
      let p = s.p;
      if (poke) {
        const d2 = (p[0] - poke.p[0]) ** 2 + (p[1] - poke.p[1]) ** 2 + (p[2] - poke.p[2]) ** 2;
        const a = 0.09 * Math.sin(13 * Math.sqrt(d2) - 10 * tp) * Math.exp(-2 * tp - 0.9 * d2);
        p = [p[0] + s.n[0] * a, p[1] + s.n[1] * a, p[2] + s.n[2] * a];
      }
      list.push({ s, x: cx + dot(p, rt) * S, y: cy - dot(p, up) * S, z: dot(p, fw), lam: Math.max(0, dot(s.n, rt) * LIGHT[0] + dot(s.n, up) * LIGHT[1] + f * LIGHT[2]) });
    }
    list.sort((a, b) => a.z - b.z);

    for (const it of list) {
      const { s } = it;
      // Project the Gaussian's covariance onto the sheet; its eigenvectors are the ellipse.
      let A = 0, B = 0, C = 0;
      for (const a of s.ax) {
        const ax = dot(a, rt) * S, ay = -dot(a, up) * S;
        A += ax * ax; B += ax * ay; C += ay * ay;
      }
      const tr = (A + C) / 2;
      const dd = Math.sqrt(Math.max(tr * tr - (A * C - B * B), 0));
      const r1 = Math.sqrt(tr + dd), r2 = Math.sqrt(Math.max(tr - dd, 0.09));
      const ang = Math.abs(B) < 1e-9 ? (A >= C ? 0 : Math.PI / 2) : Math.atan2(tr + dd - A, B);
      ctx.beginPath();
      ctx.ellipse(it.x, it.y, r1, r2, ang, 0, TAU);
      if (s.part === 'sprinkles') {
        ctx.fillStyle = `rgba(${INK},0.92)`;
        ctx.fill();
        continue;
      }
      const t = (1 - it.lam) * 0.26 + (s.part === 'frosting' ? 0.2 : 0);
      ctx.fillStyle = `rgb(${PAPER.map((c, i) => Math.round(c + (INK[i] - c) * t))})`;
      ctx.fill();
      ctx.lineWidth = 0.7 + 0.6 * s.k;
      ctx.strokeStyle = `rgba(${INK},${0.42 + 0.45 * s.k})`;
      ctx.stroke();
    }

    // Red-pencil notes ride on the surface.
    ctx.font = `700 14px ${FONT}`;
    marks.forEach((m, i) => {
      m.x = cx + dot(m.p, rt) * S;
      m.y = cy - dot(m.p, up) * S;
      m.front = dot(m.n, fw) > 0;
      ctx.globalAlpha = m.front ? 1 : 0.22;
      ctx.strokeStyle = RED;
      ctx.fillStyle = RED;
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.ellipse(m.x, m.y, 18, 14, -0.35, 0.3, TAU + 0.9);
      ctx.stroke();
      ctx.fillText(String(i + 1), m.x + 17, m.y - 13);
      ctx.globalAlpha = 1;
    });
    dirty = frac < 1 || !!poke;
  }

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const now = performance.now(); // the same clock the loop's timers use
    const dt = Math.min((now - lastFrame) / 1000, 0.05);
    lastFrame = now;
    if (!reduce.matches && !down && now - lastInput > 2600) { yaw += dt * 0.16; dirty = true; }
    if (dirty) draw(now);
  }

  function toggleMark(s) {
    if (marks.length >= 6) marks.shift();
    marks.push({ p: s.p.slice(), n: s.n.slice() });
    if (!reduce.matches) poke = { p: s.p.slice(), t0: performance.now() };
    dirty = true;
    onMarks();
  }
  function tap(x, y) {
    const hit = marks.findIndex((m) => m.front && Math.hypot(m.x - x, m.y - y) < 22);
    if (hit >= 0) { marks.splice(hit, 1); dirty = true; onMarks(); return; }
    let best = null;
    for (const it of list) {
      if (it.s.part === 'sprinkles' || Math.hypot(it.x - x, it.y - y) > 24) continue;
      if (!best || it.z > best.z) best = it;
    }
    if (best) toggleMark(best.s);
  }

  canvas.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, t: performance.now(), moved: false };
    try { canvas.setPointerCapture(e.pointerId); } catch { /* fine */ }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!down) return;
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) down.moved = true;
    yaw += (e.clientX - down.lx) * 0.009;
    if (e.pointerType === 'mouse') pitch = Math.min(1.4, Math.max(0.12, pitch + (e.clientY - down.ly) * 0.006));
    down.lx = e.clientX; down.ly = e.clientY;
    lastInput = performance.now();
    dirty = true;
  });
  const up = (e) => {
    if (!down) return;
    const wasTap = e.type === 'pointerup' && !down.moved && performance.now() - down.t < 700;
    down = null;
    lastInput = performance.now();
    if (wasTap) { const b = canvas.getBoundingClientRect(); tap(e.clientX - b.left, e.clientY - b.top); }
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('keydown', (e) => {
    const k = { ArrowLeft: [-0.16, 0], ArrowRight: [0.16, 0], ArrowUp: [0, -0.1], ArrowDown: [0, 0.1] }[e.key];
    if (k) {
      yaw += k[0];
      pitch = Math.min(1.4, Math.max(0.12, pitch + k[1]));
    } else if (e.key === 'Enter' || e.key === ' ') {
      // A note at the point of the drawing nearest the reader.
      const free = list.filter((it) => it.s.part !== 'sprinkles' && !marks.some((m) => Math.hypot(m.x - it.x, m.y - it.y) < 30));
      if (free.length) toggleMark(free[free.length - 1].s);
    } else return;
    e.preventDefault();
    lastInput = performance.now();
    dirty = true;
  });

  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; dirty = true; }).observe(canvas);
  document.fonts?.ready.then(() => { dirty = true; });
  resize();
  requestAnimationFrame(frame);

  return {
    set(next, ms) { splats = next; grow = { t0: performance.now(), ms: reduce.matches ? 0 : ms }; dirty = true; },
    marks: () => marks,
    clearMarks() { marks = []; dirty = true; onMarks(); },
    onMarks(fn) { onMarks = fn; },
    tapAt: tap,
  };
}

// ---------- the loop graph ----------
function makeGraph() {
  const token = $('#token');
  const nodes = { builder: $('#n-builder'), critic: $('#n-critic'), you: $('#n-you'), stop: $('#n-stop') };
  const place = (p) => { token.setAttribute('cx', p.x); token.setAttribute('cy', p.y); };
  return {
    at(name) { Object.entries(nodes).forEach(([k, el]) => el.classList.toggle('is-on', k === name)); },
    travel(id, ms) {
      const path = $(id);
      const len = path.getTotalLength();
      if (reduce.matches) { place(path.getPointAtLength(len)); return Promise.resolve(); }
      const t0 = performance.now();
      const step = (now) => {
        const k = Math.min(Math.max((now - t0) / ms, 0), 1);
        place(path.getPointAtLength(len * k * k * (3 - 2 * k)));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      // The clock is a timer, so a hidden tab cannot stall the loop.
      return new Promise((res) => { setTimeout(() => { place(path.getPointAtLength(len)); res(); }, ms); });
    },
  };
}

// ---------- the loop itself ----------
function workshop() {
  const board = makeBoard($('#sheet-canvas'));
  const graph = makeGraph();
  const logEl = $('#log'), statusEl = $('#status'), gate = $('#gate');
  const sendBtn = $('#send-back'), sendLabel = $('#send-label'), approveBtn = $('#approve');
  const stamp = $('#stamp');
  const st = { rev: 0, seed: 1, lumps: [], frost: false, sprinkles: false, busy: true, approved: false, added: '', run: 0 };
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

  function log(tag, who, text, cls = '') {
    const li = document.createElement('li');
    li.className = cls;
    li.innerHTML = '<b></b><i></i><span></span>';
    li.children[0].textContent = tag;
    li.children[1].textContent = who;
    li.children[2].textContent = text;
    logEl.append(li);
    while (logEl.children.length > 80) logEl.firstChild.remove();
    logEl.scrollTop = logEl.scrollHeight;
  }
  function relabel() {
    const n = board.marks().length;
    const extra = n ? `, ${plural(n, 'note')}` : '';
    if (st.approved) sendLabel.textContent = `Reopen it${extra}`;
    else if (!st.frost) sendLabel.textContent = `Send back: needs frosting${extra}`;
    else if (!st.sprinkles) sendLabel.textContent = `Send back: needs sprinkles${extra}`;
    else sendLabel.textContent = n ? `Send back with ${plural(n, 'note')}` : 'Send back: try another seed';
  }
  function setBusy(b) {
    st.busy = b;
    sendBtn.disabled = b;
    approveBtn.disabled = b || st.approved;
    gate.classList.toggle('is-waiting', !b && !st.approved);
  }
  function bom(res) {
    $('#bom').replaceChildren(...res.names.map((name, i) => {
      const tr = document.createElement('tr');
      [name, res.areas[i].toFixed(2), res.counts[i]].forEach((v) => { const td = document.createElement('td'); td.textContent = v; tr.append(td); });
      return tr;
    }));
  }
  function drafts() {
    const lump = st.added.lumps ? ` Raised a lump under ${plural(st.added.lumps, 'note')}.` : '';
    if (st.added.part === 'body') return [
      { mode: 'angle', text: `${BUDGET} splats on a torus, placed uniformly in angle.` },
      { mode: 'area', text: 'Re-placed by area: fewer inside the hole, more around the outside.' },
    ];
    if (st.added.part === 'frosting') return [
      { mode: 'equal', text: `Frosting added. Budget split evenly, ${BUDGET / 2} a part.${lump}` },
      { mode: 'area', text: 'Budget re-shared by surface area.' },
    ];
    if (st.added.part === 'sprinkles') return [{ mode: 'area', text: `26 sprinkles added, with their share of the budget.${lump}` }];
    if (st.added.part === 'seed') return [{ mode: 'area', text: `Redrawn from seed ${st.seed}.` }];
    return [{ mode: 'area', text: lump.trim() }];
  }

  async function runRevision() {
    const run = ++st.run;
    const letter = revLetter(st.rev);
    const plan = drafts();
    setBusy(true);
    $('#tb-rev').textContent = letter;
    $('#tb-checked').textContent = 'in progress';
    for (let round = 1; round <= 4; round += 1) {
      const d = plan[Math.min(round - 1, plan.length - 1)];
      graph.at('builder');
      statusEl.textContent = `The builder is drafting revision ${letter}${round > 1 ? `, round ${round}` : ''}.`;
      const res = build({ frost: st.frost, sprinkles: st.sprinkles, mode: d.mode, seed: st.seed, lumps: st.lumps });
      board.set(res.splats, 750);
      bom(res);
      log(`${letter}·${round}`, 'builder', d.text);
      await sleep(800);
      if (run !== st.run) return;
      await graph.travel('#e-bc', 300);
      graph.at('critic');
      statusEl.textContent = 'The critic is measuring it.';
      const m = measure(res);
      const pass = m.spread <= BAR && m.total === BUDGET;
      await sleep(380);
      log(`${letter}·${round}`, 'critic', `${m.total} splats. Densest region ${m.spread.toFixed(2)}× the sparsest; the bar is ${BAR}. ${pass ? 'Met.' : 'Not met: go again.'}`, pass ? 'is-pass' : 'is-fail');
      $('#tb-checked').textContent = `${m.spread.toFixed(2)}×, bar ${pass ? 'met' : 'not met'}`;
      if (pass || round === 4) break;
      await graph.travel('#e-cb', 480);
    }
    await graph.travel('#e-cy', 300);
    if (run !== st.run) return;
    graph.at('you');
    setBusy(false);
    relabel();
    statusEl.textContent = `Revision ${letter} stopped for a person. Your move.`;
  }

  sendBtn.addEventListener('click', async () => {
    if (st.busy && !st.approved) return;
    const letter = revLetter(st.rev);
    const notes = board.marks().map((m) => m.p);
    const withNotes = notes.length ? `, with ${plural(notes.length, 'note')}: more here` : '';
    let said;
    if (!st.frost) { st.frost = true; st.added = { part: 'frosting' }; said = `Sent back: needs frosting${withNotes}.`; }
    else if (!st.sprinkles) { st.sprinkles = true; st.added = { part: 'sprinkles' }; said = `Sent back: needs sprinkles${withNotes}.`; }
    else if (notes.length) { st.added = { part: '' }; said = `Sent back${withNotes}.`; }
    else { st.seed += 1; st.added = { part: 'seed' }; said = 'Sent back: try another seed.'; }
    if (st.approved) said = said.replace('Sent back', 'Reopened');
    st.added.lumps = notes.length;
    st.lumps.push(...notes);
    board.clearMarks();
    log(letter, 'you', said, 'is-you');
    st.approved = false;
    st.rev += 1;
    stamp.classList.remove('is-on');
    $('#tb-approved').textContent = 'not yet';
    $('#tb-approved').className = 'is-blank';
    setBusy(true);
    graph.at(null);
    const run = st.run;
    await graph.travel('#e-yb', 600);
    if (run === st.run) runRevision();
  });

  approveBtn.addEventListener('click', () => {
    if (st.busy || st.approved) return;
    const letter = revLetter(st.rev);
    const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
    st.approved = true;
    $('#stamp-line').textContent = `REV ${letter} · ${date}`;
    stamp.classList.add('is-on');
    $('#tb-approved').textContent = `a visitor, ${date}`;
    $('#tb-approved').className = 'is-signed';
    log(letter, 'you', 'Approved. The loop stops here.', 'is-you');
    statusEl.textContent = `Revision ${letter} is approved and on the record. It can be reopened.`;
    approveBtn.disabled = true;
    gate.classList.remove('is-waiting');
    relabel();
    graph.travel('#e-ys', 280).then(() => graph.at('stop'));
  });

  board.onMarks(relabel);
  logEl.replaceChildren();
  st.added = { part: 'body' };
  runRevision();
}

// ---------- small things on the other sheets ----------
function dimension() {
  const el = $('#dim-w');
  const set = () => { el.textContent = `${document.documentElement.clientWidth} px wide`; };
  set();
  addEventListener('resize', set);
}

function embed() {
  const frame = $('#embed-frame');
  $('#load-embed').addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = 'https://ryanjosephkamp.github.io/splashery/embed/?toy=donut&theme=light&bg=transparent&autoplay=pokes';
    f.title = 'Splashery toy: the donut';
    f.loading = 'lazy';
    frame.replaceChildren(f);
  });
}

function ripple() {
  const row = $('#fx-row');
  const N = 19;
  const els = [];
  for (let i = 0; i < N; i += 1) {
    const e = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    e.setAttribute('cx', 16 + i * 16);
    e.setAttribute('rx', 9);
    row.append(e);
    els.push(e);
  }
  const pose = (t) => els.forEach((e, i) => {
    const w = Math.sin(i * 0.62 - t * 3.2) * Math.exp(-(((i - 9) / 7) ** 2));
    e.setAttribute('cy', 60 - w * 22);
    e.setAttribute('ry', 13 + w * 5);
    e.setAttribute('transform', `rotate(${w * 24} ${16 + i * 16} ${60 - w * 22})`);
  });
  pose(0.4);
  if (reduce.matches) return;
  let on = false;
  const tick = (now) => { if (!on) return; pose(now / 1000); requestAnimationFrame(tick); };
  new IntersectionObserver(([en]) => { const was = on; on = en.isIntersecting; if (on && !was) requestAnimationFrame(tick); }).observe(row);
}

function stops() {
  const btn = $('#erase-stop');
  btn.addEventListener('click', () => {
    const erased = $('#lane-graph').classList.toggle('is-erased');
    btn.setAttribute('aria-pressed', String(erased));
    btn.textContent = erased ? 'Put the stops back' : 'Erase the stops';
  });
}

workshop();
dimension();
embed();
ripple();
stops();
