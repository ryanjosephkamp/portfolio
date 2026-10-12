// The light box: reads the walnut off its contact sheet and hangs the live pictures.
// The math is in volume.js; this file is the DOM.

import { SCAN, CUTS, PRESETS, AIR, SHELL, BINS, sheetToVolume, cut, mip, solids, histogram, runningCount, windowCounts, lookup, shadowSet, viewAngle, rebuild } from './volume.js'; // prettier-ignore

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, root = document) => root.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const fmt = (n) => n.toLocaleString('en-US');
const mm = (k) => `${(k * SCAN.mm).toFixed(1)} mm`;

// ---- Colors: what a density prints as ------------------------------------------------------

const FILM = [7, 14, 22];
const LIGHT = [234, 245, 255];
const gray = (t) => FILM.map((f, i) => f + (LIGHT[i] - f) * t ** 0.9);
// Splashery's "Bone and tissue" transfer function.
const STOPS = ['#6e2a1e', '#b5553f', '#d99a76', '#eedcbc', '#fff8ea'].map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))); // prettier-ignore
const warm = (t) => {
  if (t <= 0) return FILM;
  const x = Math.min(t, 1) * (STOPS.length - 1);
  const i = Math.min(STOPS.length - 2, Math.floor(x));
  return STOPS[i].map((c, j) => c + (STOPS[i + 1][j] - c) * (x - i));
};

// ---- State ---------------------------------------------------------------------------------

const state = {
  pos: [56, 57, 70], // the voxel where the three cuts cross: x, y, z
  lo: PRESETS.full.lo,
  hi: PRESETS.full.hi,
  warm: false,
  theta: 0.5,
  touched: false, // a visitor has moved a cut
  turned: 0, // when a visitor last turned the walnut
};

async function readVolume() {
  const img = $('#sheet-data');
  if (!img.complete || !img.naturalWidth) await img.decode();
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  return sheetToVolume(g.getImageData(0, 0, c.width, c.height).data, c.width, 4);
}

function start(vol) {
  const viewer = $('#viewer');
  const upTo = runningCount(histogram(vol));
  const solid = solids(vol);
  const hist = histogram(vol);
  let lut = new Uint32Array(256);
  let dirty = { cuts: true, mip: true, window: true, ct: true };
  let pending = false;
  let onScreen = true;
  let ctOnScreen = false;

  // -- The four pictures --
  const panes = [...viewer.querySelectorAll('.pane')].map((el) => {
    const name = el.dataset.cut;
    const canvas = $('canvas', el);
    const g = canvas.getContext('2d');
    const image = g.createImageData(canvas.width, canvas.height);
    return {
      name,
      el,
      view: $('.view', el),
      g,
      image,
      out: new Uint32Array(image.data.buffer),
      raw: new Uint8Array(canvas.width * canvas.height),
      readout: $('[data-readout]', el),
      cut: CUTS[name],
    };
  });
  const print = (p) => {
    for (let i = 0; i < p.raw.length; i++) p.out[i] = lut[p.raw[i]];
    p.g.putImageData(p.image, 0, 0);
  };

  function draw() {
    pending = false;
    if (dirty.window) {
      lut = new Uint32Array(lookup(state.lo, state.hi, state.warm ? warm : gray).buffer);
      drawWindow();
      dirty.ct = true;
    }
    for (const p of panes) {
      if (p.name === 'mip') {
        if (dirty.mip) mip(solid, state.theta, p.raw);
        if (dirty.mip || dirty.window) print(p);
        const deg = Math.round((((state.theta * 180) / Math.PI) % 360 + 360) % 360);
        p.readout.textContent = `turned ${deg}°`;
        continue;
      }
      if (!dirty.cuts && !dirty.window) continue;
      const c = p.cut;
      const k = state.pos[c.along];
      cut(vol, p.name, k, p.raw);
      print(p);
      p.view.style.setProperty('--x', (state.pos[c.across] + 0.5) / c.w);
      p.view.style.setProperty('--y', (state.pos[c.down] + 0.5) / c.h);
      p.readout.textContent = `${k + 1}/${c.n} · ${mm(k)}`;
    }
    if (dirty.cuts) {
      const [x, y, z] = state.pos;
      const v = vol[x + SCAN.nx * (y + SCAN.ny * z)];
      const what = v <= AIR ? 'air' : v < SHELL ? 'soft part' : 'shell';
      $('#burn-pos').textContent = `x ${mm(x)} · y ${mm(y)} · z ${mm(z)} · density ${v} · ${what}`;
      const ring = $('#ring');
      ring.style.setProperty('--c', z % SCAN.cols);
      ring.style.setProperty('--r', Math.floor(z / SCAN.cols));
      dirty.ct = true;
    }
    if (dirty.ct && ctOnScreen) drawCT();
    dirty.cuts = dirty.mip = dirty.window = false;
  }
  const ask = (what) => {
    if (what) dirty[what] = true;
    if (!pending) {
      pending = true;
      requestAnimationFrame(draw);
    }
  };

  // -- Moving the cuts --
  const moveTo = (p, e) => {
    const r = p.view.getBoundingClientRect();
    const c = p.cut;
    state.pos[c.across] = clamp(Math.floor(((e.clientX - r.left) / r.width) * c.w), 0, c.w - 1);
    state.pos[c.down] = clamp(Math.floor(((e.clientY - r.top) / r.height) * c.h), 0, c.h - 1);
    state.touched = true;
    ask('cuts');
  };
  for (const p of panes) {
    if (p.name === 'mip') {
      let from = null;
      p.view.addEventListener('pointerdown', (e) => {
        from = { x: e.clientX, theta: state.theta };
        p.view.setPointerCapture(e.pointerId);
      });
      p.view.addEventListener('pointermove', (e) => {
        if (!from) return;
        state.theta = from.theta + ((e.clientX - from.x) / p.view.clientWidth) * Math.PI;
        state.turned = performance.now();
        ask('mip');
      });
      const end = () => (from = null);
      p.view.addEventListener('pointerup', end);
      p.view.addEventListener('pointercancel', end);
      p.view.addEventListener('keydown', (e) => {
        const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
        if (!step) return;
        e.preventDefault();
        state.theta += (step * Math.PI) / 36;
        state.turned = performance.now();
        ask('mip');
      });
      continue;
    }
    // A mouse cuts wherever it hovers. A finger cuts where it taps, or follows a sideways
    // drag; an up-and-down swipe is left to scroll the page.
    let down = null;
    p.view.addEventListener('pointerdown', (e) => {
      down = { x: e.clientX, y: e.clientY, moved: e.pointerType === 'mouse' };
      if (down.moved) {
        p.view.setPointerCapture(e.pointerId);
        moveTo(p, e);
      }
    });
    p.view.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse') return moveTo(p, e);
      if (!down) return;
      if (!down.moved && Math.abs(e.clientX - down.x) > Math.abs(e.clientY - down.y) + 3) down.moved = true;
      if (down.moved) moveTo(p, e);
    });
    p.view.addEventListener('pointerup', (e) => {
      if (down && !down.moved) moveTo(p, e); // a tap
      down = null;
    });
    p.view.addEventListener('pointercancel', () => (down = null));
    p.view.addEventListener('keydown', (e) => {
      const c = p.cut;
      const step = {
        ArrowLeft: [c.across, -1],
        ArrowRight: [c.across, 1],
        ArrowUp: [c.down, -1],
        ArrowDown: [c.down, 1],
        PageUp: [c.along, -1],
        PageDown: [c.along, 1],
      }[e.key];
      if (!step) return;
      e.preventDefault();
      const n = [SCAN.nx, SCAN.ny, SCAN.nz][step[0]];
      state.pos[step[0]] = clamp(state.pos[step[0]] + step[1] * (e.shiftKey ? 10 : 1), 0, n - 1);
      state.touched = true;
      ask('cuts');
    });
  }

  // -- The window: a histogram, a step wedge, and the band you drag --
  const histCanvas = $('#hist');
  const hg = histCanvas.getContext('2d');
  const band = $('#band');
  const level = $('#level');
  const width = $('#width');
  const peak = Math.sqrt(Math.max(...hist.subarray(1)));
  function drawWindow() {
    const W = histCanvas.width;
    const H = histCanvas.height;
    hg.clearRect(0, 0, W, H);
    const bars = H - 14;
    for (let v = 0; v < 256; v++) {
      const c = lut[v];
      const css = `rgb(${c & 255} ${(c >> 8) & 255} ${(c >> 16) & 255})`;
      hg.fillStyle = css; // the step wedge: what each density prints as
      hg.fillRect(v * 2, H - 10, 2, 10);
      if (!hist[v] || v === 0) continue;
      const h = Math.max(1, (Math.sqrt(hist[v]) / peak) * bars);
      hg.fillStyle = v > state.lo && v < state.hi ? '#d6e9f7' : '#4d6a82';
      hg.fillRect(v * 2, bars - h, 2, h);
    }
    band.style.setProperty('--lo', state.lo / 255);
    band.style.setProperty('--hi', state.hi / 255);
    const w = state.hi - state.lo;
    const l = Math.round((state.lo + state.hi) / 2);
    level.value = l;
    width.value = w;
    $('#level-out').textContent = l;
    $('#width-out').textContent = w;
    const n = windowCounts(upTo, state.lo, state.hi);
    const pct = (k) => `${((100 * k) / n.total).toFixed(1)}%`;
    $('#count').textContent = `W ${w} · L ${l} · of the walnut's ${fmt(n.total)} voxels, ${pct(n.black)} print black, ${pct(n.gray)} gray, ${pct(n.white)} white`;
    for (const b of viewer.querySelectorAll('[data-preset]')) {
      const p = PRESETS[b.dataset.preset];
      b.setAttribute('aria-pressed', String(p.lo === state.lo && p.hi === state.hi));
    }
  }
  const setWindow = (lo, hi) => {
    lo = clamp(Math.round(lo), 0, 254);
    hi = clamp(Math.round(hi), lo + 1, 255);
    state.lo = lo;
    state.hi = hi;
    ask('window');
  };
  const fromSliders = () => {
    const w = Number(width.value);
    const lo = clamp(Number(level.value) - w / 2, 0, 255 - w);
    setWindow(lo, lo + w);
  };
  level.addEventListener('input', fromSliders);
  width.addEventListener('input', fromSliders);
  let grab = null;
  band.addEventListener('pointerdown', (e) => {
    const which = e.target.classList.contains('grip-lo') ? 'lo' : e.target.classList.contains('grip-hi') ? 'hi' : 'both';
    grab = { which, x: e.clientX, lo: state.lo, hi: state.hi };
    band.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  band.addEventListener('pointermove', (e) => {
    if (!grab) return;
    const d = ((e.clientX - grab.x) / histCanvas.clientWidth) * 255;
    if (grab.which === 'lo') setWindow(Math.min(grab.lo + d, grab.hi - 1), grab.hi);
    else if (grab.which === 'hi') setWindow(grab.lo, Math.max(grab.hi + d, grab.lo + 1));
    else {
      const w = grab.hi - grab.lo;
      const lo = clamp(grab.lo + d, 0, 255 - w);
      setWindow(lo, lo + w);
    }
  });
  const drop = () => (grab = null);
  band.addEventListener('pointerup', drop);
  band.addEventListener('pointercancel', drop);
  for (const b of viewer.querySelectorAll('[data-preset]'))
    b.addEventListener('click', () => setWindow(PRESETS[b.dataset.preset].lo, PRESETS[b.dataset.preset].hi));
  $('#colors').addEventListener('click', (e) => {
    state.warm = !state.warm;
    e.currentTarget.setAttribute('aria-pressed', String(state.warm));
    ask('window');
    ask('ct');
  });

  // -- The contact sheet: click a slice to hang it --
  const frame = $('#sheet .sheet-frame');
  frame.addEventListener('click', (e) => {
    const r = frame.getBoundingClientRect();
    const col = clamp(Math.floor(((e.clientX - r.left) / r.width) * SCAN.cols), 0, SCAN.cols - 1);
    const row = Math.floor(((e.clientY - r.top) / r.height) * Math.ceil(SCAN.nz / SCAN.cols));
    const z = row * SCAN.cols + col;
    if (z < 0 || z >= SCAN.nz) return;
    state.pos[2] = z;
    state.touched = true;
    ask('cuts');
    viewer.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  });

  // -- How a CT sees: the slice rebuilt from its shadows --
  const views = $('#views');
  const shadowCanvas = $('#ct-shadows');
  const sg = shadowCanvas.getContext('2d');
  const pictureCanvas = $('#ct-picture');
  const pg = pictureCanvas.getContext('2d');
  const top = new Uint8Array(SCAN.nx * SCAN.ny);
  let played = false;
  let set = null; // the shadows of the slice below, kept until the slice changes
  let setZ = -1;
  let setMax = 1;
  function drawCT() {
    dirty.ct = false;
    const n = Number(views.value);
    $('#views-out').textContent = n;
    if (setZ !== state.pos[2]) {
      setZ = state.pos[2];
      set = shadowSet(cut(vol, 'top', setZ, top), SCAN.nx, SCAN.ny);
      setMax = 1;
      for (const v of set.raw) if (v > setMax) setMax = v;
    }
    const picture = rebuild(set, SCAN.nx, SCAN.ny, n);
    const img = pg.createImageData(SCAN.nx, SCAN.ny);
    const out = new Uint32Array(img.data.buffer);
    for (let i = 0; i < picture.length; i++) out[i] = lut[clamp(Math.round(picture[i]), 0, 255)];
    pg.putImageData(img, 0, 0);
    const H = shadowCanvas.height;
    const simg = sg.createImageData(BINS, H);
    const sout = new Uint32Array(simg.data.buffer);
    for (let y = 0; y < H; y++) {
      const row = viewAngle(Math.floor((y * n) / H), n) * BINS;
      for (let b = 0; b < BINS; b++) {
        const [r, g, bl] = gray(set.raw[row + b] / setMax);
        sout[y * BINS + b] = 0xff000000 | (bl << 16) | (g << 8) | r;
      }
    }
    sg.putImageData(simg, 0, 0);
  }
  views.addEventListener('input', () => {
    played = true;
    ask('ct');
  });
  new IntersectionObserver(
    ([e]) => {
      ctOnScreen = e.isIntersecting;
      if (!ctOnScreen) return;
      ask('ct');
      if (played || reduce) {
        if (!played) views.value = 180;
        played = true;
        return;
      }
      played = true;
      const t0 = performance.now();
      const step = (t) => {
        if (document.activeElement === views) return;
        const f = clamp((t - t0) / 7000, 0, 1);
        views.value = Math.max(1, Math.round(180 * f * f));
        ask('ct');
        if (f < 1 && ctOnScreen) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },
    { threshold: 0.4 },
  ).observe($('#ct'));

  // -- Idle motion: the cut drifts down the walnut until someone takes it; the walnut turns --
  new IntersectionObserver(([e]) => (onScreen = e.isIntersecting)).observe(viewer);
  if (!reduce) {
    let last = performance.now();
    const idle = (t) => {
      const dt = Math.min(0.1, (t - last) / 1000);
      last = t;
      if (onScreen && !document.hidden) {
        if (!state.touched) {
          state.pos[2] = Math.round(70 + 52 * Math.sin(t / 2600));
          ask('cuts');
        }
        if (t - state.turned > 4000 || !state.turned) {
          state.theta += dt * 0.32;
          ask('mip');
        }
      }
      requestAnimationFrame(idle);
    };
    requestAnimationFrame(idle);
  }

  viewer.classList.add('live');
  ask();
}

// ---- The anatomy atlas, as four films: click the top one to peel it --------------------------

const layers = [...document.querySelectorAll('#layers li')];
layers.forEach((li, i) => {
  li.style.setProperty('--i', i);
  $('button', li).addEventListener('click', () => {
    const front = layers.findIndex((l) => !l.classList.contains('peeled'));
    if (front < 0) return;
    // After the organs, a click brings every layer back.
    if (front === layers.length - 1) layers.forEach((l) => l.classList.remove('peeled'));
    else layers[front].classList.add('peeled');
  });
});

// The real toy, from Splashery's own site, only when asked for.
$('#real-load')?.addEventListener('click', () => {
  const frame = document.createElement('iframe');
  frame.src = 'https://ryanjosephkamp.github.io/splashery/embed/?toy=walnut-ct&labs=1&theme=dark&zoom=0.6';
  frame.title = "Splashery: a walnut's CT scan as volume splats";
  frame.allow = 'fullscreen';
  $('#real').replaceChildren(frame);
});

// Without the scan the page falls back to what it is without scripts: the contact sheet.
readVolume().then(start, (err) => {
  document.documentElement.classList.remove('js');
  console.warn('The walnut did not load; the contact sheet stays up.', err);
});
