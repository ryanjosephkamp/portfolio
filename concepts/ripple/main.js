// Ripple: the tank in the hero and the small light bench.
// The water is solved in sim.js; this file draws it and wires the controls.

import { Tank, fringeWavelength, brightAngles, MEASURABLE, SLOW } from './sim.js';
import { MARGIN, CELLS_PER_CM, BARRIER_Y, SETUPS, tankLayout, arcRadius } from './layout.js';
import { sellmeier, LIGHTS, wavelengthRGB, prismCorners, trace } from './bench.js';

const $ = (id) => document.getElementById(id);
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const DEPTH = 3; // cm of water over the tile
const GAIN = 3; // heights are drawn this many times taller
const TILE = 4; // mosaic tiles per cm
const FACE = '"Atkinson Hyperlegible Next", system-ui, sans-serif';

const VERT = `#version 300 es
in vec2 a; void main() { gl_Position = vec4(a, 0., 1.); }`;

// One pixel, looking straight down. The view ray bends at the surface by
// Snell's law (air to water, n = 1.333) and lands on the tile. The sun is
// straight overhead, so its light takes the same path: where neighboring
// rays crowd together on the floor the tile is brighter (the caustics), by
// the ratio of the areas.
const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uH, uT;
uniform vec2 uRes, uVis, uDom, uGrid, uTG;
uniform float uM, uDepth, uGain, uTile, uLambda, uGuide;
uniform vec4 uSrc, uBar, uOpen;
uniform vec3 uPair, uFinger;
out vec4 o;
const vec3 RED = vec3(1., .23, .29);
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
// The height in cm at p (cm), through a cubic B-spline so the slopes are smooth.
float H(vec2 p) {
  vec2 st = p / uDom * uGrid - .5;
  vec2 i = floor(st), f = st - i;
  vec2 w0 = f * (f * (-f + 3.) - 3.) + 1., w1 = f * f * (3. * f - 6.) + 4.;
  vec2 w2 = f * (f * (-3. * f + 3.) + 3.) + 1., w3 = f * f * f;
  vec2 g0 = w0 + w1, g1 = w2 + w3;
  vec2 h0 = (w1 / g0 - .5 + i) / uGrid, h1 = (w3 / g1 + 1.5 + i) / uGrid;
  return (g0.y * (g0.x * texture(uH, h0).r + g1.x * texture(uH, vec2(h1.x, h0.y)).r)
        + g1.y * (g0.x * texture(uH, vec2(h0.x, h1.y)).r + g1.x * texture(uH, h1).r)) / 36.;
}
void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uRes * uVis + uM;
  float e = uDom.x / uGrid.x;
  float h = H(p) * uGain;
  vec2 g = vec2(H(p + vec2(e, 0.)) - H(p - vec2(e, 0.)), H(p + vec2(0., e)) - H(p - vec2(0., e))) * (uGain / (2. * e));
  vec3 n = normalize(vec3(-g, 1.));
  vec3 r = refract(vec3(0., 0., -1.), n, 1. / 1.333);
  vec2 q = p + r.xy / -r.z * (uDepth + h);
  float cm = uVis.x / uRes.x;
  float L = 1. / max(abs(determinant(mat2(dFdx(q), dFdy(q)))) / (cm * cm), .16);

  vec2 t = (q - uM) * uTile;
  vec2 id = floor(t);
  vec4 tex = texture(uT, (id + .5) / uTG);
  float v = hash(id);
  vec3 alb = mix(vec3(.93 + .07 * v), vec3(.04, .16, .22) * (.8 + .5 * v), tex.r);
  alb = mix(alb, RED * (.85 + .25 * v), tex.g);
  vec2 f = abs(fract(t) - .5);
  float aa = max(fwidth(t.x), fwidth(t.y));
  float grout = smoothstep(.43 - aa, .43 + aa, max(f.x, f.y)) * clamp(1.3 - aa * 1.6, 0., 1.);
  alb = mix(alb, vec3(.78, .90, .92), grout * .55);

  vec3 col = alb * mix(vec3(.42, .82, .88), vec3(1.), clamp(L * .8, 0., 1.)) + max(L - 1.25, 0.) * .14;
  col += smoothstep(.12, 0., length(2. * n.xy - vec2(.2, -.16))) * .3;

  if (uGuide > .5 && uPair.z > 0. && p.y > uPair.y + .8) {
    float r1 = length(p - vec2(uPair.x - uPair.z * .5, uPair.y));
    float r2 = length(p - vec2(uPair.x + uPair.z * .5, uPair.y));
    float m = (r1 - r2) / uLambda;
    float dm = abs(m - round(m)) / max(fwidth(m), 1e-4);
    col = mix(col, RED, smoothstep(1.8, .7, dm) * step(.5, fract((r1 + r2) * .7)) * .9);
  }
  if (uBar.y > 0.) {
    float dy = p.y - uBar.y;
    if (abs(p.x - uOpen.x) > uOpen.y * .5 && abs(p.x - uOpen.z) > uOpen.w * .5) {
      col *= 1. - .2 * smoothstep(1.1, .3, dy) * step(0., dy);
      col = mix(col, vec3(.99 - .08 * smoothstep(.05, .3, dy)), smoothstep(.34, .29, abs(dy)));
    }
  }
  if (uBar.x > 0.) {
    float dy = p.y - uBar.x;
    col *= 1. - .16 * smoothstep(.8, .2, dy) * step(0., dy);
    col = mix(col, RED, smoothstep(.22, .17, abs(dy)));
  }
  for (int k = 0; k < 2; k++) {
    vec2 s = k == 0 ? uSrc.xy : uSrc.zw;
    if (s.x < 0.) continue;
    col *= 1. - .2 * smoothstep(.75, .3, length(p - s - vec2(.12, .28)));
    float d = length(p - s);
    col = mix(col, RED, smoothstep(.46, .41, d));
    col = mix(col, vec3(1.), smoothstep(.14, .08, length(p - s + vec2(.13, .15))) * .8);
  }
  if (uFinger.z > .5) {
    float d = abs(length(p - uFinger.xy) - .9);
    col = mix(col, RED, smoothstep(.12, .05, d));
  }
  o = vec4(col, 1.);
}`;

function startTank() {
  const host = $('tank');
  const canvas = $('water');
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) return;
  const shader = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram();
  try {
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (err) {
    console.warn('ripple: the water could not start', err);
    return;
  }
  gl.useProgram(prog);
  const U = {};
  for (const name of ['uH', 'uT', 'uRes', 'uVis', 'uDom', 'uGrid', 'uTG', 'uM', 'uDepth', 'uGain', 'uTile', 'uLambda', 'uGuide', 'uSrc', 'uBar', 'uOpen', 'uPair', 'uFinger'])
    U[name] = gl.getUniformLocation(prog, name);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.bindAttribLocation(prog, 0, 'a');
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  const texture = (unit, filter) => {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };
  texture(0, gl.LINEAR);
  texture(1, gl.NEAREST);
  gl.uniform1i(U.uH, 0);
  gl.uniform1i(U.uT, 1);

  const state = { setup: 'still', spacing: 6, width: 2, guides: false, playing: !reduce.matches };
  let tank = null;
  let vis = null;
  let layout = null;
  let changedAt = 0;
  let tileGrid = [1, 1];
  const finger = { x: 0, y: 0 };

  // The floor: the name and a pool sign, one texel per mosaic tile.
  function layTiles() {
    const tw = Math.round(vis.w * TILE);
    const th = Math.round(vis.h * TILE);
    const cv = document.createElement('canvas');
    cv.width = tw;
    cv.height = th;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, tw, th);
    const lines = vis.w / vis.h > 1.15 ? ['RYAN KAMP'] : ['RYAN', 'KAMP'];
    ctx.font = `800 100px ${FACE}`;
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    // The lettering keeps clear of the dippers and the barrier above it, and
    // shrinks when the water is too short to hold it at full width.
    const one = lines.length === 1;
    const zoneTop = (BARRIER_Y + 1.3) * TILE;
    const avail = th - (one ? 3 : 14) - zoneTop;
    const perSize = one ? 0.72 : 0.72 * 2.24;
    let size = (100 * tw * 0.84) / widest;
    if (perSize * size + Math.max(8.5, size * 0.17) * 1.55 > avail) size = Math.max(12, (avail - 8.5 * 1.55) / perSize);
    const nameW = (widest * size) / 100;
    const cap = size * 0.72;
    const lead = cap * 1.24;
    const small = Math.max(8.5, size * 0.17);
    const base = zoneTop + Math.max(0, (avail - cap - lead * (lines.length - 1) - small * 1.55) / 2) + cap;
    ctx.font = `800 ${size}px ${FACE}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f00';
    lines.forEach((l, i) => ctx.fillText(l, tw / 2, base + i * lead));
    const signY = base + (lines.length - 1) * lead + small * 1.55;
    ctx.font = `800 ${small}px ${FACE}`;
    ctx.fillStyle = '#0f0';
    if (lines.length === 1) {
      ctx.textAlign = 'left';
      ctx.fillText('DEPTH 3 CM', tw / 2 - nameW / 2, signY);
      ctx.textAlign = 'right';
      ctx.fillText('NO DIVING', tw / 2 + nameW / 2, signY);
    } else ctx.fillText('NO DIVING', tw / 2, signY);
    const img = ctx.getImageData(0, 0, tw, th);
    const d = img.data;
    for (let k = 0; k < d.length; k += 4) {
      d[k] = d[k] > 120 ? 255 : 0;
      d[k + 1] = d[k + 1] > 120 ? 255 : 0;
    }
    gl.activeTexture(gl.TEXTURE1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, tw, th, 0, gl.RGBA, gl.UNSIGNED_BYTE, d);
    tileGrid = [tw, th];
  }

  function applyLayout(clear) {
    layout = tankLayout(state, vis);
    if (clear) tank.clear();
    tank.sources = layout.sources;
    tank.line = layout.line;
    tank.setBarrier(layout.barrier);
    changedAt = tank.time;
    const single = state.setup === 'single';
    const gap = $('gap');
    gap.min = single ? 0.5 : 2;
    gap.max = single ? 8 : 14;
    gap.step = single ? 0.25 : 0.5;
    gap.value = single ? state.width : state.spacing;
    $('gap-name').textContent = single ? 'Slit width' : 'Spacing d';
    const used = single || !!layout.pair;
    gap.disabled = !used;
    gap.closest('.slider').classList.toggle('is-off', !used);
    $('guides').disabled = !layout.pair;
    $('guides').closest('.check').classList.toggle('is-off', !layout.pair);
    const driven = state.setup !== 'still';
    for (const id of ['freq', 'speed']) {
      $(id).disabled = !driven;
      $(id).closest('.slider').classList.toggle('is-off', !driven);
    }
    outputs();
  }

  function outputs() {
    $('out-freq').textContent = `${tank.f.toFixed(1)} Hz`;
    $('out-speed').textContent = `${tank.c.toFixed(1)} cm/s`;
    $('out-gap').textContent = `${Number($('gap').value).toFixed(state.setup === 'single' ? 2 : 1)} cm`;
  }

  function numbers() {
    const lambda = tank.wavelength;
    $('n-lambda').textContent = state.setup === 'still' ? 'still water, pebbles only' : `${lambda.toFixed(2)} cm`;
    $('n-grid').textContent = `${tank.nx} × ${tank.ny} cells, Courant number 0.5`;
    if (!layout.pair) {
      $('n-lines').textContent = $('n-young').textContent = 'with two dippers or two slits';
      return;
    }
    const angles = brightAngles(layout.pair.d, lambda).map((a, m) => (m ? `±${a.toFixed(1)}°` : '0°'));
    $('n-lines').textContent = angles.length > 4 ? `${angles.slice(0, 4).join(', ')} and ${angles.length - 4} more` : angles.join(', ');
    const R = arcRadius(layout.pair, vis);
    if (state.setup !== 'two') {
      $('n-young').textContent = 'measured with two dippers';
      return;
    }
    if (lambda > MEASURABLE * layout.pair.d) {
      $('n-young').textContent = 'side lines too far off the axis';
      return;
    }
    if (tank.time - changedAt < (R + 6) / tank.c + 1) {
      $('n-young').textContent = state.playing ? 'settling…' : 'press Play to let it settle';
      return;
    }
    const got = fringeWavelength(tank, layout.pair, R);
    $('n-young').textContent = got === null ? 'no side line to measure' : `${got.toFixed(2)} cm`;
  }

  function build() {
    const r = host.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    const w = r.width >= 900 ? 48 : r.width >= 600 ? 36 : 24;
    const h = Math.min(64, (w * r.height) / r.width);
    if (vis && vis.w === w && Math.abs(vis.h - h) < 0.4) return;
    vis = { w, h };
    const keep = tank ? { c: tank.c, f: tank.f } : { c: Number($('speed').value), f: Number($('freq').value) };
    tank = new Tank({ width: w + 2 * MARGIN, depth: h + 2 * MARGIN, nx: (w + 2 * MARGIN) * CELLS_PER_CM, beach: MARGIN });
    Object.assign(tank, keep);
    vis.h = tank.depth - 2 * MARGIN;
    finger.x = MARGIN + w / 2;
    finger.y = MARGIN + vis.h * 0.3;
    gl.activeTexture(gl.TEXTURE0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, tank.nx, tank.ny, 0, gl.RED, gl.FLOAT, tank.u);
    layTiles();
    applyLayout(false);
    if (state.playing) draw();
    else stillFrame();
  }

  function draw() {
    gl.activeTexture(gl.TEXTURE0);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, tank.nx, tank.ny, gl.RED, gl.FLOAT, tank.u);
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform2f(U.uVis, vis.w, vis.h);
    gl.uniform2f(U.uDom, tank.width, tank.depth);
    gl.uniform2f(U.uGrid, tank.nx, tank.ny);
    gl.uniform2f(U.uTG, tileGrid[0], tileGrid[1]);
    gl.uniform1f(U.uM, MARGIN);
    gl.uniform1f(U.uDepth, DEPTH);
    gl.uniform1f(U.uGain, GAIN);
    gl.uniform1f(U.uTile, TILE);
    gl.uniform1f(U.uLambda, tank.wavelength);
    gl.uniform1f(U.uGuide, state.guides ? 1 : 0);
    const s = layout.sources;
    gl.uniform4f(U.uSrc, s[0] ? s[0].x : -1, s[0] ? s[0].y : -1, s[1] ? s[1].x : -1, s[1] ? s[1].y : -1);
    gl.uniform4f(U.uBar, layout.line ? layout.line.y : -1, layout.barrier ? layout.barrier.y : -1, 0, 0);
    const op = layout.barrier ? layout.barrier.openings : [];
    gl.uniform4f(U.uOpen, op[0] ? op[0].center : -99, op[0] ? op[0].width : 0, op[1] ? op[1].center : -99, op[1] ? op[1].width : 0);
    const pr = layout.pair;
    gl.uniform3f(U.uPair, pr ? pr.x : 0, pr ? pr.y : 0, pr ? pr.d : 0);
    gl.uniform3f(U.uFinger, finger.x, finger.y, canvas.matches(':focus-visible') ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  // With motion reduced the water does not run on its own: each change is
  // solved ahead a little and shown as one still picture.
  function stillFrame(seconds = 0.45) {
    tank.advance(seconds, { maxSteps: 4000 });
    draw();
    numbers();
  }

  function pebbleAt(x, y, r, depth) {
    tank.pebble(x, y, r, depth);
    host.classList.add('is-touched');
    if (!state.playing) stillFrame();
  }

  // ---- The loop: runs while the tank is on screen ----
  let raf = 0;
  let last = 0;
  let lastRead = 0;
  let onScreen = true;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    if (state.playing) tank.advance(dt / SLOW);
    draw();
    if (now - lastRead > 300) {
      lastRead = now;
      numbers();
    }
  }
  function wake() {
    cancelAnimationFrame(raf);
    if (onScreen) raf = requestAnimationFrame(frame);
  }
  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    wake();
  }).observe(host);

  // ---- Pointer and keyboard on the water ----
  const toTank = (ev) => {
    const r = canvas.getBoundingClientRect();
    return [MARGIN + ((ev.clientX - r.left) / r.width) * vis.w, MARGIN + ((ev.clientY - r.top) / r.height) * vis.h];
  };
  let trail = null;
  canvas.addEventListener('pointerdown', (ev) => {
    const [x, y] = toTank(ev);
    pebbleAt(x, y, 0.6, 0.5);
    trail = [x, y];
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (!state.playing) return;
    const [x, y] = toTank(ev);
    if (trail && Math.hypot(x - trail[0], y - trail[1]) < 0.7) return;
    tank.pebble(x, y, 0.45, ev.buttons ? 0.16 : 0.06);
    if (trail) host.classList.add('is-touched');
    trail = [x, y];
  });
  canvas.addEventListener('keydown', (ev) => {
    const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[ev.key];
    if (step) {
      finger.x = Math.min(MARGIN + vis.w - 1, Math.max(MARGIN + 1, finger.x + step[0]));
      finger.y = Math.min(MARGIN + vis.h - 1, Math.max(MARGIN + 1, finger.y + step[1]));
      if (state.playing) tank.pebble(finger.x, finger.y, 0.45, 0.1);
      else draw();
    } else if (ev.key === 'Enter' || ev.key === ' ') pebbleAt(finger.x, finger.y, 0.6, 0.5);
    else return;
    ev.preventDefault();
  });
  canvas.addEventListener('focus', () => state.playing || draw());
  canvas.addEventListener('blur', () => state.playing || draw());

  // ---- The deck ----
  $('setups').addEventListener('change', (ev) => {
    state.setup = ev.target.value;
    applyLayout(true);
    host.classList.add('is-touched');
    if (!state.playing) stillFrame(1.6);
  });
  $('freq').addEventListener('input', (ev) => {
    tank.f = Number(ev.target.value);
    changedAt = tank.time;
    outputs();
    if (!state.playing) stillFrame();
  });
  $('speed').addEventListener('input', (ev) => {
    tank.c = Number(ev.target.value);
    changedAt = tank.time;
    outputs();
    if (!state.playing) stillFrame();
  });
  $('gap').addEventListener('input', (ev) => {
    state[state.setup === 'single' ? 'width' : 'spacing'] = Number(ev.target.value);
    applyLayout(false);
    if (state.playing) draw();
    else stillFrame();
  });
  $('guides').addEventListener('change', (ev) => {
    state.guides = ev.target.checked;
    if (!state.playing) draw();
  });
  $('pebble').addEventListener('click', () => {
    pebbleAt(MARGIN + vis.w * (0.2 + 0.6 * Math.random()), MARGIN + vis.h * (0.4 + 0.45 * Math.random()), 0.6, 0.5);
  });
  const pause = $('pause');
  const setPlaying = (on) => {
    state.playing = on;
    pause.textContent = on ? 'Pause' : 'Play';
    pause.setAttribute('aria-pressed', String(!on));
    last = performance.now();
  };
  pause.addEventListener('click', () => setPlaying(!state.playing));
  reduce.addEventListener('change', () => setPlaying(!reduce.matches));

  let resizing = 0;
  new ResizeObserver(() => {
    clearTimeout(resizing);
    resizing = setTimeout(build, 120);
  }).observe(host);

  host.classList.add('is-live');
  build();
  setPlaying(state.playing);
  document.fonts.load(`800 40px ${FACE}`).then(() => vis && layTiles()).catch(() => {});
  // A link can open a setup: ?setup=double
  const asked = new URLSearchParams(location.search).get('setup');
  const radio = SETUPS.includes(asked) && document.querySelector(`input[name="setup"][value="${asked}"]`);
  if (radio && asked !== 'still') {
    radio.checked = true;
    state.setup = asked;
    applyLayout(true);
    if (!state.playing) stillFrame(1.6);
  } else if (state.playing) {
    // Two pebbles to start, so the water is already moving when it is first seen.
    const first = () => tank.pebble(MARGIN + vis.w * 0.27, MARGIN + vis.h * 0.36, 0.6, 0.5);
    setTimeout(first, 350);
    setTimeout(() => tank.pebble(MARGIN + vis.w * 0.7, MARGIN + vis.h * 0.72, 0.6, 0.5), 1300);
  } else {
    tank.pebble(MARGIN + vis.w * 0.27, MARGIN + vis.h * 0.36, 0.6, 0.5);
    stillFrame(0.5);
  }
  wake();
}

// ---- The light bench ----
function startBench() {
  const cv = $('bench');
  const ctx = cv.getContext('2d');
  const slider = $('turn');
  let light = 'white';
  const deg = (r) => (r * 180) / Math.PI;
  const DIR = [Math.cos((22 * Math.PI) / 180), -Math.sin((22 * Math.PI) / 180)];
  const FROM = [-0.25 - DIR[0] * 2, -0.144 - DIR[1] * 2];

  function draw() {
    const r = cv.getBoundingClientRect();
    if (r.width < 10) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(r.width * dpr);
    cv.height = Math.round(r.height * dpr);
    const W = cv.width;
    const Hh = cv.height;
    const S = Math.min(W, Hh * 1.45) * 0.34;
    const px = ([x, y]) => [W * 0.5 + x * S, Hh * 0.56 + y * S];
    const turn = Number(slider.value);
    const corners = prismCorners(1, (turn * Math.PI) / 180);
    ctx.fillStyle = '#03222c';
    ctx.fillRect(0, 0, W, Hh);
    ctx.strokeStyle = 'rgba(159, 211, 218, 0.09)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < W; x += 24 * dpr) ctx.rect(Math.round(x) + 0.5, 0, 0, Hh);
    for (let y = 0; y < Hh; y += 24 * dpr) ctx.rect(0, Math.round(y) + 0.5, W, 0);
    ctx.stroke();
    ctx.beginPath();
    corners.forEach((c, i) => (i ? ctx.lineTo(...px(c)) : ctx.moveTo(...px(c))));
    ctx.closePath();
    ctx.fillStyle = 'rgba(143, 224, 228, 0.16)';
    ctx.fill();
    ctx.strokeStyle = '#bff3f6';
    ctx.lineWidth = 1.5 * dpr;
    ctx.stroke();

    ctx.globalCompositeOperation = 'lighter';
    ctx.lineJoin = 'round';
    const list = LIGHTS[light];
    for (const nm of list) {
      const ray = trace(corners, FROM, DIR, sellmeier(nm), 6);
      const [cr, cg, cb] = wavelengthRGB(nm);
      ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${list.length > 1 ? 0.55 : 1})`;
      ctx.lineWidth = (list.length > 1 ? 2.2 : 2.8) * dpr;
      ctx.beginPath();
      ray.pts.forEach((p, i) => (i ? ctx.lineTo(...px(p)) : ctx.moveTo(...px(p))));
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';

    const mainNm = list.length > 1 ? 587.6 : list[0];
    const main = trace(corners, FROM, DIR, sellmeier(mainNm));
    $('out-turn').textContent = `${turn.toFixed(1)}°`;
    $('b-dev').textContent = main.hit ? `${deg(Math.acos(Math.min(1, main.out[0] * DIR[0] + main.out[1] * DIR[1]))).toFixed(1)}° at ${mainNm} nm` : 'the beam misses the prism';
    const a = trace(corners, FROM, DIR, sellmeier(410));
    const b = trace(corners, FROM, DIR, sellmeier(665));
    $('b-spread').textContent = a.hit && b.hit ? `${deg(Math.acos(Math.min(1, a.out[0] * b.out[0] + a.out[1] * b.out[1]))).toFixed(2)}°` : 'none';
  }

  $('b-index').textContent = sellmeier(587.6).toFixed(4);
  slider.addEventListener('input', draw);
  for (const input of document.querySelectorAll('input[name="light"]'))
    input.addEventListener('change', () => {
      light = input.value;
      draw();
    });
  let grab = null;
  cv.addEventListener('pointerdown', (ev) => {
    grab = { x: ev.clientX, turn: Number(slider.value) };
    cv.setPointerCapture(ev.pointerId);
  });
  cv.addEventListener('pointermove', (ev) => {
    if (!grab) return;
    slider.value = Math.max(-30, Math.min(30, grab.turn + (ev.clientX - grab.x) * 0.2));
    draw();
  });
  const drop = () => (grab = null);
  cv.addEventListener('pointerup', drop);
  cv.addEventListener('pointercancel', drop);
  new ResizeObserver(draw).observe(cv);
  draw();
}

startTank();
startBench();
