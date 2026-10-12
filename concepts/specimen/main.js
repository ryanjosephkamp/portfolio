// SPECIMEN — Ryan Kamp. No dependencies. The math is in specimen.js; this file draws it.

import { neuron, buildTree, pack, moments, level, hodgkinHuxley, normalize, rng, STAINS, WAVE_MS, T_SOMA } from './specimen.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const $ = (s, el = document) => el.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);

/* ---------- the stage: splats drawn as stain on a lit slide ---------- */

// Each splat is one quad. The vertex shader slides it between its parent and itself (uT),
// turns its 3D covariance to face the screen (R S Rᵀ) and keeps the 2D part.
const VERT = `#version 300 es
precision highp float;
layout(location=0) in vec2 corner;
layout(location=1) in vec4 aMW; layout(location=2) in vec4 aSd; layout(location=3) in vec4 aSo; layout(location=4) in vec4 aInk;
layout(location=5) in vec4 pMW; layout(location=6) in vec4 pSd; layout(location=7) in vec4 pSo; layout(location=8) in vec4 pInk;
uniform mat3 uR; uniform vec3 uCenter; uniform vec2 uScale;
uniform float uT, uTime, uBlur, uDensity, uWaveMs;
uniform vec3 uSpike; uniform sampler2D uWave;
out vec2 vD; out vec3 vConic; out vec3 vAbs;
void main() {
  vec4 mw = mix(pMW, aMW, uT), sd = mix(pSd, aSd, uT), so = mix(pSo, aSo, uT), ink = mix(pInk, aInk, uT);
  mat3 S = mat3(sd.x, so.x, so.y, so.x, sd.y, so.z, so.y, so.z, sd.z);
  mat3 C = uR * S * transpose(uR);
  float a = C[0][0] + uBlur, b = C[0][1], c = C[1][1] + uBlur;
  float det = max(a * c - b * b, 1e-12);
  vec3 mu = uR * (mw.xyz - uCenter);
  vD = corner * 3.0 * sqrt(vec2(a, c));
  vConic = vec3(c, -b, a) / det;
  float act = 0.0;
  float tau = uTime - sd.w;
  if (uTime >= 0.0 && tau > 0.0 && tau < uWaveMs) act = (textureLod(uWave, vec2(tau / uWaveMs, 0.5), 0.0).r * 1.25 - 0.25) * so.w;
  vec3 stain = mix(ink.rgb, uSpike, clamp(act * 1.4, 0.0, 1.0));
  vAbs = stain * (mw.w / (6.2831853 * sqrt(det))) * uDensity * (1.0 + 1.6 * act);
  gl_Position = vec4((mu.xy + vD) * uScale, 0.0, 1.0);
}`;

// Optical depth of one splat at this pixel. Depths add; the light that survives is exp(−sum).
const FRAG = `#version 300 es
precision highp float;
in vec2 vD; in vec3 vConic; in vec3 vAbs;
uniform float uDirect;
out vec4 o;
void main() {
  float p = -0.5 * (vConic.x * vD.x * vD.x + 2.0 * vConic.y * vD.x * vD.y + vConic.z * vD.y * vD.y);
  if (p < -4.5) discard;
  vec3 depth = vAbs * exp(p);
  o = uDirect > 0.5 ? vec4(exp(-depth), 1.0) : vec4(depth, 1.0);
}`;

const POST_VERT = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;
const POST_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uSum;
out vec4 o;
void main() {
  vec3 depth = texelFetch(uSum, ivec2(gl_FragCoord.xy), 0).rgb;
  float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  o = vec4(exp(-depth) + grain / 255.0, 1.0);
}`;

function program(gl, vs, fs) {
  const p = gl.createProgram();
  for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    gl.attachShader(p, s);
  }
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p;
}

class Slide {
  constructor(canvas, tree, { fit = 0.92, density = 1, wave } = {}) {
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
    if (!gl) throw new Error('WebGL2 is not available');
    Object.assign(this, { canvas, gl, tree, fit, density });
    this.level = tree.depth;
    this.time = -1;
    this.spin = 0;
    this.tilt = 0;
    this.portrait = false;

    // How much room the specimen needs: half its length, and its reach around the long axis.
    let lo = Infinity, hi = -Infinity, around = 0;
    for (const s of level(tree, tree.depth)) {
      const pad = 2 * Math.sqrt(Math.max(s.S[0], s.S[1], s.S[2]));
      lo = Math.min(lo, s.m[0] - pad);
      hi = Math.max(hi, s.m[0] + pad);
      around = Math.max(around, Math.hypot(s.m[1], s.m[2]) + pad);
    }
    this.center = [(lo + hi) / 2, 0, 0];
    this.half = [(hi - lo) / 2, around];

    this.prog = program(gl, VERT, FRAG);
    this.post = program(gl, POST_VERT, POST_FRAG);
    this.u = {};
    for (const n of ['uR', 'uCenter', 'uScale', 'uT', 'uTime', 'uBlur', 'uDensity', 'uWaveMs', 'uSpike', 'uWave', 'uDirect']) this.u[n] = gl.getUniformLocation(this.prog, n);

    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    this.rows = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.rows);
    gl.bufferData(gl.ARRAY_BUFFER, pack(tree), gl.STATIC_DRAW);
    for (let k = 1; k <= 8; k += 1) {
      gl.enableVertexAttribArray(k);
      gl.vertexAttribDivisor(k, 1);
    }
    this.bare = gl.createVertexArray();

    // The spike, as a strip of 256 samples the vertex shader reads by delay.
    const samples = new Uint8Array(256);
    if (wave) for (let i = 0; i < 256; i += 1) samples[i] = Math.round(clamp((wave((i / 255) * WAVE_MS) + 0.25) / 1.25, 0, 1) * 255);
    else samples.fill(51);
    this.wave = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.wave);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, 256, 1, 0, gl.RED, gl.UNSIGNED_BYTE, samples);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);

    // Sum optical depth in a float buffer when the browser can; otherwise multiply in 8 bits.
    this.float = !!gl.getExtension('EXT_color_buffer_float');
    this.wide = this.float && !!gl.getExtension('EXT_float_blend');
    if (this.float) {
      this.sum = gl.createTexture();
      this.fbo = gl.createFramebuffer();
    }
    gl.enable(gl.BLEND);
  }

  resize() {
    const { gl, canvas } = this;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (w === canvas.width && h === canvas.height && this.sized) return;
    this.sized = true;
    canvas.width = w;
    canvas.height = h;
    if (!this.float || !w || !h) return;
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.sum);
    gl.texImage2D(gl.TEXTURE_2D, 0, this.wide ? gl.RGBA32F : gl.RGBA16F, w, h, 0, gl.RGBA, this.wide ? gl.FLOAT : gl.HALF_FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.sum, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) this.float = false;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  draw() {
    this.resize();
    const { gl, canvas, u } = this;
    const W = canvas.width;
    const H = canvas.height;
    if (!W || !H) return;
    const long = this.portrait ? H : W;
    const short = this.portrait ? W : H;
    const scale = Math.min((long * this.fit) / (2 * this.half[0]), (short * this.fit) / (2 * this.half[1]));

    // Screen from model: roll (on a phone the axon points down), tilt, then spin about the long axis.
    const cs = Math.cos(this.spin), sn = Math.sin(this.spin), ct = Math.cos(this.tilt), st = Math.sin(this.tilt);
    const tiltSpin = [ct, st * sn, st * cs, 0, cs, -sn, -st, ct * sn, ct * cs];
    const R = this.portrait
      ? [tiltSpin[3], tiltSpin[4], tiltSpin[5], -tiltSpin[0], -tiltSpin[1], -tiltSpin[2], tiltSpin[6], tiltSpin[7], tiltSpin[8]]
      : tiltSpin;

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.float ? this.fbo : null);
    gl.viewport(0, 0, W, H);
    gl.enable(gl.BLEND);
    if (this.float) {
      gl.clearColor(0, 0, 0, 1);
      gl.blendFunc(gl.ONE, gl.ONE);
    } else {
      gl.clearColor(1, 1, 1, 1);
      gl.blendFunc(gl.DST_COLOR, gl.ZERO);
    }
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.prog);
    gl.bindVertexArray(this.vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.wave);
    gl.uniformMatrix3fv(u.uR, true, R);
    gl.uniform3fv(u.uCenter, this.center);
    gl.uniform2f(u.uScale, (2 * scale) / W, (2 * scale) / H);
    gl.uniform1f(u.uTime, this.time);
    gl.uniform1f(u.uBlur, (0.6 * (W / canvas.clientWidth) / scale) ** 2);
    gl.uniform1f(u.uDensity, this.density);
    gl.uniform1f(u.uWaveMs, WAVE_MS);
    gl.uniform3fv(u.uSpike, STAINS.spike);
    gl.uniform1i(u.uWave, 0);
    gl.uniform1f(u.uDirect, this.float ? 0 : 1);

    // A whole-number level draws that level. In between, the next level's splats are part-way
    // out from the parents they are splitting from.
    const lv = clamp(this.level, 0, this.tree.depth);
    const L = Math.ceil(lv);
    gl.uniform1f(u.uT, L === 0 ? 1 : smooth(lv - (L - 1)));
    const first = (1 << L) - 1;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.rows);
    for (let k = 0; k < 8; k += 1) gl.vertexAttribPointer(k + 1, 4, gl.FLOAT, false, 128, first * 128 + k * 16);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, 1 << L);

    if (this.float) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.disable(gl.BLEND);
      gl.useProgram(this.post);
      gl.bindVertexArray(this.bare);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.sum);
      gl.uniform1i(gl.getUniformLocation(this.post, 'uSum'), 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
  }
}

/* ---------- the hero: focus it, fire it ---------- */

function hero() {
  const root = $('#top');
  const canvas = $('#scope');
  const focus = $('#focus');
  const tree = buildTree(neuron());
  const hh = hodgkinHuxley();
  const volts = (ms) => {
    if (ms <= 0) return hh.rest;
    const x = Math.min(ms / hh.step, hh.trace.length - 1);
    const i = Math.floor(x);
    return hh.trace[i] + (hh.trace[Math.min(i + 1, hh.trace.length - 1)] - hh.trace[i]) * (x - i);
  };
  const wave = (ms) => (volts(ms) - hh.rest) / (hh.peak - hh.rest);

  let slide;
  try {
    slide = new Slide(canvas, tree, { density: 0.62, wave });
  } catch (err) {
    root.classList.add('no-gl');
    return;
  }
  root.classList.add('is-live');

  const DEPTH = tree.depth;
  const END = Math.max(...level(tree, DEPTH).map((s) => s.delay)) + 9; // ms until the cell is quiet again
  const SLOW = 7; // model milliseconds shown per second
  const stats = Array.from({ length: DEPTH + 1 }, (_, L) => moments(level(tree, L)));
  const out = { count: $('#count'), lvl: $('#lvl'), mass: $('#mass'), center: $('#center'), spread: $('#spread') };
  const fmt = (v, d) => (Math.abs(v) < 5 * 10 ** -(d + 1) ? 0 : v).toFixed(d);

  let target = Number(focus.value);
  let shown = target;
  let shownL = -1;
  let firedAt = null;
  let intro = null;
  let lastUser = -1e9;
  let visible = true;
  let dirty = true;
  let then = performance.now();

  function readout() {
    const L = Math.ceil(clamp(shown, 0, DEPTH) - 1e-6);
    root.style.setProperty('--focus', (shown / DEPTH).toFixed(3));
    if (L === shownL) return;
    shownL = L;
    const n = 1 << L;
    out.count.textContent = `${n.toLocaleString('en-US')} ${n === 1 ? 'splat' : 'splats'}`;
    out.lvl.textContent = String(L);
    const s = stats[L];
    out.mass.textContent = s.w.toFixed(9);
    out.center.textContent = `(${s.m.map((v) => fmt(v, 6)).join(', ')})`;
    out.spread.textContent = `(${s.S.slice(0, 3).map((v) => Math.sqrt(v).toFixed(6)).join(', ')})`;
    focus.setAttribute('aria-valuetext', out.count.textContent);
  }

  // The chart: membrane potential at the soma against time.
  const pen = $('#pen');
  const dot = $('#pen-dot');
  const X = (ms) => 44 + (ms / END) * 540;
  const Y = (mv) => 118 - ((mv + 90) / 150) * 108;
  function chart(until) {
    let d = '';
    for (let ms = 0; ms <= until; ms += 0.1) d += `${d ? 'L' : 'M'}${X(ms).toFixed(1)} ${Y(volts(ms - T_SOMA)).toFixed(1)}`;
    pen.setAttribute('d', d || `M${X(0)} ${Y(hh.rest)}`);
    dot.setAttribute('cx', X(Math.max(until, 0)));
    dot.setAttribute('cy', Y(volts(until - T_SOMA)));
  }
  $('#v-peak').textContent = `${hh.peak >= 0 ? '+' : '−'}${Math.abs(hh.peak).toFixed(0)} mV`;
  $('#v-rest').textContent = `−${Math.abs(hh.rest).toFixed(0)} mV`;
  chart(0);

  function fire() {
    firedAt = performance.now();
    root.classList.add('is-firing');
    dirty = true;
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - then) / 1000);
    then = now;
    if (!visible) return;

    if (intro !== null) {
      const t = clamp((now - intro) / 3400, 0, 1);
      target = DEPTH * smooth(t) ** 0.8;
      focus.value = target;
      if (t === 1) {
        intro = null;
        fire();
      }
    }
    if (Math.abs(target - shown) > 1e-3) {
      shown = reduceMotion.matches ? target : shown + (target - shown) * (1 - Math.exp(-dt * 12));
      dirty = true;
    } else if (shown !== target) {
      shown = target;
      dirty = true;
    }

    if (firedAt !== null) {
      let ms = ((now - firedAt) / 1000) * SLOW;
      if (reduceMotion.matches) ms = now - firedAt < 1400 ? T_SOMA + 1.1 : END + 1; // one still frame, then rest
      if (ms > END) {
        firedAt = null;
        slide.time = -1;
        chart(END);
        root.classList.remove('is-firing');
      } else {
        slide.time = ms;
        chart(reduceMotion.matches ? END : ms);
      }
      dirty = true;
    }

    const idle = now - lastUser > 2600;
    if (!reduceMotion.matches && idle) {
      slide.spin += dt * 0.16;
      slide.tilt += (0 - slide.tilt) * (1 - Math.exp(-dt * 0.8));
      dirty = true;
    }
    if (!dirty) return;
    dirty = false;
    slide.level = shown;
    slide.portrait = canvas.clientHeight > canvas.clientWidth * 1.05;
    readout();
    slide.draw();
  }

  const userTook = () => {
    intro = null;
  };
  focus.addEventListener('input', () => {
    userTook();
    target = Number(focus.value);
    dirty = true;
  });
  focus.addEventListener('pointerdown', userTook);
  $('#fire').addEventListener('click', () => {
    userTook();
    fire();
  });

  // On the cell itself: a tap fires it, a drag turns it.
  let grab = null;
  canvas.addEventListener('pointerdown', (e) => {
    grab = { x: e.clientX, y: e.clientY, moved: false };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!grab) return;
    const dx = e.clientX - grab.x;
    const dy = e.clientY - grab.y;
    if (!grab.moved && Math.hypot(dx, dy) < 6) return;
    grab.moved = true;
    grab.x = e.clientX;
    grab.y = e.clientY;
    lastUser = performance.now();
    if (slide.portrait) slide.spin += dx * 0.012;
    else {
      slide.spin -= dy * 0.012;
      slide.tilt = clamp(slide.tilt + dx * 0.006, -0.9, 0.9);
    }
    dirty = true;
  });
  canvas.addEventListener('pointerup', () => {
    if (grab && !grab.moved) {
      userTook();
      fire();
    }
    grab = null;
  });
  canvas.addEventListener('pointercancel', () => {
    grab = null;
  });

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    then = performance.now();
    dirty = true;
  }).observe(canvas);
  new ResizeObserver(() => {
    dirty = true;
  }).observe(canvas);
  reduceMotion.addEventListener('change', () => {
    dirty = true;
  });

  if (!reduceMotion.matches) {
    target = 0;
    shown = 0;
    focus.value = 0;
    intro = performance.now() + 500;
  }
  requestAnimationFrame(frame);
}

/* ---------- the cabinet: one small specimen per project ---------- */

// Each emblem is drawn with the 2D canvas, then sampled into 1,024 splats. Blue strokes take
// the myelin stain. The second function says when each part lights up, 0 to 1.
const EMBLEMS = {
  grooph: [(g) => {
    g.lineWidth = 9;
    for (const x of [22, 180, 338]) g.strokeRect(x, 150, 120, 66);
    g.fillRect(142, 178, 38, 9);
    g.fillRect(300, 178, 38, 9);
    g.strokeStyle = '#00f';
    g.beginPath();
    g.moveTo(240, 146);
    g.bezierCurveTo(240, 40, 82, 40, 82, 132);
    g.stroke();
    g.fillStyle = '#00f';
    g.beginPath();
    g.moveTo(64, 122);
    g.lineTo(100, 122);
    g.lineTo(82, 148);
    g.fill();
  }, (x, y) => (y < 0.48 ? 0.55 + (0.5 - x) * 0.9 : x * 0.55)],
  openlist: [(g) => {
    g.font = 'italic 500 190px Newsreader, Georgia, serif';
    g.textAlign = 'center';
    g.fillText('Aa', 196, 205);
    g.fillStyle = '#00f';
    for (let i = 0; i < 6; i += 1) g.fillRect(338, 78 + i * 26, [110, 84, 122, 66, 98, 76][i], 9);
  }, (x, y) => x * 0.6 + y * 0.3],
  resmon: [(g) => {
    g.lineWidth = 9;
    g.strokeStyle = '#00f';
    for (const r of [44, 84, 124]) {
      g.beginPath();
      g.arc(240, 150, r, 0, Math.PI * 2);
      g.stroke();
    }
    g.beginPath();
    g.arc(240, 150, 12, 0, Math.PI * 2);
    g.fill();
    g.fillRect(240, 146, 128, 9);
    for (const [x, y] of [[300, 96], [176, 188], [286, 220], [196, 70]]) {
      g.beginPath();
      g.arc(x, y, 11, 0, Math.PI * 2);
      g.fill();
    }
  }, (x, y) => Math.hypot(x - 0.5, (y - 0.5) * 0.625) * 2],
  ars: [(g) => {
    g.font = '600 76px Newsreader, Georgia, serif';
    g.textAlign = 'center';
    g.fillText('ARS MAGNA', 240, 132);
    g.fillStyle = '#00f';
    g.font = 'italic 500 62px Newsreader, Georgia, serif';
    g.fillText('anagrams', 240, 218);
  }, (x, y) => (y < 0.5 ? x * 0.5 : 0.5 + (1 - x) * 0.5)],
  amordle: [(g) => {
    g.lineWidth = 7;
    g.font = '600 46px Newsreader, Georgia, serif';
    g.textAlign = 'center';
    [...'AMORDLE'].forEach((ch, i) => {
      const x = 15 + i * 65;
      g.strokeStyle = i < 3 ? '#00f' : '#000';
      g.strokeRect(x, 118, 56, 64);
      g.fillText(ch, x + 28, 167);
    });
  }, (x) => x],
};

function emblem([draw, when], seed) {
  const W = 480, H = 300, N = 1024;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#000';
  g.strokeStyle = '#000';
  draw(g);
  const px = g.getImageData(0, 0, W, H).data;
  const inked = [];
  for (let i = 0; i < W * H; i += 1) if (px[i * 4 + 3] > 110) inked.push(i);
  const r = rng(seed);
  const sigma = clamp(0.8 * Math.sqrt(inked.length / N), 1.4, 6) / 150;
  const leaves = [];
  for (let k = 0; k < N; k += 1) {
    const i = inked[Math.floor(r() * inked.length)];
    const x = (i % W) + r();
    const y = Math.floor(i / W) + r();
    leaves.push({
      m: [(x - W / 2) / 150, -(y - H / 2) / 150, (r() - 0.5) * 0.08],
      S: [sigma * sigma, sigma * sigma, sigma * sigma * 0.5, 0, 0, 0],
      w: 1,
      a: px[i * 4 + 2] > 128 ? STAINS.myelin : STAINS.violet,
      delay: when(x / W, y / H) * 9,
      gain: 1,
    });
  }
  return buildTree(normalize(leaves));
}

function cabinet() {
  const pulse = (ms) => Math.exp(-(((ms - 2) / 1.1) ** 2));
  document.querySelectorAll('[data-emblem]').forEach((canvas, n) => {
    let slide;
    try {
      slide = new Slide(canvas, emblem(EMBLEMS[canvas.dataset.emblem], 7 + n), { fit: 0.84, density: 0.9, wave: pulse });
    } catch (err) {
      canvas.closest('.card').classList.add('no-gl');
      return;
    }
    const top = slide.tree.depth;
    let run = null;
    slide.level = reduceMotion.matches ? top : 0;
    const play = (from, pulseToo) => {
      if (reduceMotion.matches) {
        slide.level = top;
        slide.draw();
        return;
      }
      const t0 = performance.now();
      cancelAnimationFrame(run);
      const step = (now) => {
        const t = (now - t0) / 1000;
        slide.level = from + (top - from) * smooth(clamp(t / 1.5, 0, 1));
        slide.time = pulseToo ? (t - 0.5) * 9 : -1;
        if (slide.time > 9 + WAVE_MS / 2) slide.time = -1;
        slide.draw();
        if (t < (pulseToo ? 2.6 : 1.5)) run = requestAnimationFrame(step);
      };
      run = requestAnimationFrame(step);
    };
    const card = canvas.closest('.card');
    new IntersectionObserver(([entry], io) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      play(0, true);
    }, { threshold: 0.4 }).observe(canvas);
    card.addEventListener('pointerenter', () => play(5, true));
    canvas.addEventListener('click', () => play(0, true));
    new ResizeObserver(() => slide.draw()).observe(canvas);
  });
}

/* ---------- the collection: real Splashery toys, loaded only when asked for ---------- */

function collection() {
  const bench = $('#bench');
  const note = $('#bench-note');
  const picks = document.querySelectorAll('[data-toy]');
  picks.forEach((a) => {
    a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      let frame = $('iframe', bench);
      if (!frame) {
        frame = document.createElement('iframe');
        frame.style.colorScheme = 'light';
        bench.append(frame);
        bench.classList.add('is-live');
      }
      const name = $('b', a).textContent;
      frame.title = `Splashery: ${name}`;
      frame.src = `https://ryanjosephkamp.github.io/splashery/embed/?toy=${a.dataset.toy}&theme=light&bg=transparent`;
      picks.forEach((p) => p.toggleAttribute('aria-current', p === a));
      note.textContent = `On the bench: ${name}. ${a.dataset.note}`;
    });
  });
}

hero();
collection();
const faces = ['italic 500 60px Newsreader', '600 60px Newsreader'];
(document.fonts ? Promise.all(faces.map((f) => document.fonts.load(f))) : Promise.resolve()).then(cabinet, cabinet);
