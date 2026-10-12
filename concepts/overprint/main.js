// Overprint: Ryan Kamp's portfolio as a two-ink print that is still moving.
// One cloud of Gaussian splats, re-formed by recipe. No dependencies.

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const TAU = Math.PI * 2;
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

// Paper and the two inks, as the shaders want them. Keep in step with styles.css.
const PAPER = [0.957, 0.941, 0.902];
const TEAL = [0.059, 0.498, 0.525];
const HOT = [1.0, 0.353, 0.212];

// A small seeded generator (mulberry32), so a recipe prints the same form every time.
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- Recipes ---------- */

// Every recipe returns n splats: a centre, the direction its stroke is laid
// in, and which of the two inks it takes (0 teal, 1 orange).
const blank = (n) => ({ pos: new Float32Array(n * 3), tan: new Float32Array(n * 3), ink: new Float32Array(n), aspect: 1 });

// Centre the form and scale it to fit: a ball of radius 1, or, for a flat
// form, a half-width of 1. Strokes are cut to one length.
function finish(out, stroke, flat = false) {
  const { pos, tan } = out;
  const n = out.ink.length;
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i += 1) {
    const a = i % 3;
    if (pos[i] < lo[a]) lo[a] = pos[i];
    if (pos[i] > hi[a]) hi[a] = pos[i];
  }
  const mid = lo.map((v, a) => (v + hi[a]) / 2);
  let reach = 0;
  for (let i = 0; i < n; i += 1) {
    const x = pos[i * 3] - mid[0];
    const y = pos[i * 3 + 1] - mid[1];
    const z = pos[i * 3 + 2] - mid[2];
    reach = Math.max(reach, flat ? Math.abs(x) : Math.hypot(x, y, z));
  }
  const k = 1 / (reach || 1);
  for (let i = 0; i < n; i += 1) {
    const len = Math.hypot(tan[i * 3], tan[i * 3 + 1], tan[i * 3 + 2]) || 1;
    for (let a = 0; a < 3; a += 1) {
      pos[i * 3 + a] = (pos[i * 3 + a] - mid[a]) * k;
      tan[i * 3 + a] = (tan[i * 3 + a] / len) * stroke;
    }
  }
  if (flat) out.aspect = (hi[0] - lo[0]) / Math.max(hi[1] - lo[1], 1e-6);
  return out;
}

// A word: draw it, keep every pixel the ink reached, drop a splat on each.
function word(n, { text }, rand) {
  const out = blank(n);
  const lines = String(text || '').toUpperCase().split('\n').filter((line) => line.trim());
  if (!lines.length) lines.push('?');
  const size = 150;
  const leading = size * 0.96;
  const font = `900 ${size}px Recursive, ui-sans-serif, system-ui, sans-serif`;
  const canvas = document.createElement('canvas');
  const pen = canvas.getContext('2d', { willReadFrequently: true });
  pen.font = font;
  const widest = Math.max(...lines.map((line) => pen.measureText(line).width), size * 0.5);
  canvas.width = Math.ceil(widest + size * 0.2);
  canvas.height = Math.ceil(lines.length * leading + size * 0.2);
  pen.font = font; // sizing a canvas clears its settings
  pen.textAlign = 'center';
  pen.textBaseline = 'middle';
  lines.forEach((line, i) => pen.fillText(line, canvas.width / 2, size * 0.1 + leading * (i + 0.5)));
  const { data } = pen.getImageData(0, 0, canvas.width, canvas.height);
  const inked = [];
  for (let p = 0; p < canvas.width * canvas.height; p += 1) if (data[p * 4 + 3] > 110) inked.push(p);
  if (!inked.length) inked.push(0);
  for (let i = 0; i < n; i += 1) {
    const p = inked[Math.floor(rand() * inked.length)];
    const second = i % 7 === 0; // one splat in seven goes to the second plate, set off register
    const hatch = 0.66 + (rand() - 0.5) * 0.5;
    out.pos[i * 3] = (p % canvas.width) + rand() + (second ? size * 0.055 : 0);
    out.pos[i * 3 + 1] = -(Math.floor(p / canvas.width) + rand()) - (second ? size * 0.045 : 0);
    out.pos[i * 3 + 2] = (rand() - 0.5) * size * 0.14 + (second ? size * 0.12 : 0);
    out.tan[i * 3] = Math.cos(hatch);
    out.tan[i * 3 + 1] = Math.sin(hatch);
    out.ink[i] = second ? 1 : 0;
  }
  return finish(out, 0.011, true);
}

// The Lorenz system, integrated with fourth-order Runge-Kutta. Each splat is
// one step, laid along the velocity; the wing it is on picks its ink.
function lorenz(n, { rho }) {
  const out = blank(n);
  const dt = 0.0052;
  const slope = (x, y, z) => [10 * (y - x), x * (rho - z) - y, x * y - (8 / 3) * z];
  let x = 0.6;
  let y = 0.1;
  let z = 0.2;
  for (let i = 0; i < n; i += 1) {
    const a = slope(x, y, z);
    const b = slope(x + (a[0] * dt) / 2, y + (a[1] * dt) / 2, z + (a[2] * dt) / 2);
    const c = slope(x + (b[0] * dt) / 2, y + (b[1] * dt) / 2, z + (b[2] * dt) / 2);
    const d = slope(x + c[0] * dt, y + c[1] * dt, z + c[2] * dt);
    x += (dt / 6) * (a[0] + 2 * b[0] + 2 * c[0] + d[0]);
    y += (dt / 6) * (a[1] + 2 * b[1] + 2 * c[1] + d[1]);
    z += (dt / 6) * (a[2] + 2 * b[2] + 2 * c[2] + d[2]);
    out.pos.set([x, z, -y], i * 3);
    out.tan.set([a[0], a[2], -a[1]], i * 3);
    out.ink[i] = x > 0 ? 1 : 0;
  }
  return finish(out, 0.016);
}

// A parametric surface drawn as threads: v is held at one of a few values
// while u runs free, so the strokes line up along the surface like hatching.
function threaded(n, threads, at, rand) {
  const out = blank(n);
  for (let i = 0; i < n; i += 1) {
    const thread = Math.floor(rand() * threads);
    const v = (thread / threads) * TAU;
    const u = rand() * TAU;
    const p = at(u, v);
    const q = at(u + 0.01, v);
    if (!p.every(Number.isFinite)) throw new Error(`not a number at u = ${u.toFixed(2)}, v = ${v.toFixed(2)}`);
    out.pos.set(p, i * 3);
    out.tan.set([q[0] - p[0], q[1] - p[1], q[2] - p[2]], i * 3);
    out.ink[i] = thread % 4 === 0 ? 1 : 0;
  }
  return finish(out, 0.016);
}

// Klein bottle, figure-eight immersion.
function klein(n, { threads }, rand) {
  return threaded(n, Math.round(threads), (u, v) => {
    const r = 2 + Math.cos(u / 2) * Math.sin(v) - Math.sin(u / 2) * Math.sin(2 * v);
    return [r * Math.cos(u), Math.sin(u / 2) * Math.sin(v) + Math.cos(u / 2) * Math.sin(2 * v), r * Math.sin(u)];
  }, rand);
}

// Whatever the visitor writes. u and v each run from 0 to 2π.
function yours(n, { x, y, z }, rand) {
  // The visitor's own typing, run in the visitor's own page; nothing is read from a URL.
  const fn = [x, y, z].map((src) => new Function('u', 'v', 'TAU', `with (Math) { return (${src}); }`));
  return threaded(n, 48, (u, v) => fn.map((f) => f(u, v, TAU)), rand);
}

// Gyroid: scatter points through a block, walk each onto the surface with a
// few Newton steps along the gradient, and keep a ball of them.
function gyroid(n, { cells }, rand) {
  const out = blank(n);
  const half = cells * Math.PI;
  const f = (x, y, z) => Math.sin(x) * Math.cos(y) + Math.sin(y) * Math.cos(z) + Math.sin(z) * Math.cos(x);
  const grad = (x, y, z) => [
    Math.cos(x) * Math.cos(y) - Math.sin(z) * Math.sin(x),
    Math.cos(y) * Math.cos(z) - Math.sin(x) * Math.sin(y),
    Math.cos(z) * Math.cos(x) - Math.sin(y) * Math.sin(z),
  ];
  let i = 0;
  for (let tries = 0; i < n && tries < n * 30; tries += 1) {
    let x = (rand() * 2 - 1) * half;
    let y = (rand() * 2 - 1) * half;
    let z = (rand() * 2 - 1) * half;
    for (let k = 0; k < 5; k += 1) {
      const g = grad(x, y, z);
      const s = f(x, y, z) / (g[0] * g[0] + g[1] * g[1] + g[2] * g[2] + 1e-6);
      x -= g[0] * s;
      y -= g[1] * s;
      z -= g[2] * s;
    }
    if (Math.hypot(x, y, z) > half || Math.abs(f(x, y, z)) > 0.02) continue;
    const g = grad(x, y, z);
    // hatch across the vertical, along the surface
    const across = Math.hypot(g[0], g[2]) > 0.05 ? [-g[2], 0, g[0]] : [0, g[2], -g[1]];
    out.pos.set([x, y, z], i * 3);
    out.tan.set(across, i * 3);
    out.ink[i] = g[0] * x + g[1] * y + g[2] * z > 0 ? 0 : 1; // the two faces of the surface
    i += 1;
  }
  return finish(out, 0.015);
}

// Decisions: evidence starts at zero and wanders, with a drift toward the
// upper line. A thread ends when it first touches either line.
function decisions(n, { drift }, rand) {
  const out = blank(n);
  const gauss = () => Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(TAU * rand());
  const dt = 0.012;
  const sd = Math.sqrt(dt);
  const span = 2.4; // seconds shown
  const threads = 30;
  let i = 0;
  for (; i < n * 0.08; i += 1) { // the two lines
    const top = i % 2 === 0;
    out.pos.set([rand() * span, top ? 1 : -1, (Math.floor(rand() * 9) / 8 - 0.5) * 1.5], i * 3);
    out.tan.set([1, 0, 0], i * 3);
    out.ink[i] = top ? 0 : 1;
  }
  const each = Math.floor((n - i) / threads);
  for (let k = 0; k < threads; k += 1) {
    let path;
    let x;
    let t;
    do { // a thread that has not decided by the edge of the figure is drawn again
      path = [[0, 0]];
      x = 0;
      t = 0;
      while (Math.abs(x) < 1 && t < span) {
        x += drift * dt + sd * gauss();
        t += dt;
        path.push([t, clamp(x, -1, 1)]);
      }
    } while (Math.abs(x) < 1);
    const ink = x > 0 ? 0 : 1; // where this decision ended
    const depth = (k / (threads - 1) - 0.5) * 1.5;
    for (let stop = k === threads - 1 ? n : i + each; i < stop; i += 1) {
      const at = rand() * (path.length - 1);
      const s = Math.min(Math.floor(at), path.length - 2);
      const f = at - s;
      const p = path[s];
      const q = path[s + 1];
      out.pos.set([p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f, depth], i * 3);
      out.tan.set([q[0] - p[0], q[1] - p[1], 0], i * 3);
      out.ink[i] = ink;
    }
  }
  return finish(out, 0.012);
}

// A loop graph: builder, critic, and the person who decides; one edge loops back.
function loop(n, _, rand) {
  const out = blank(n);
  const nodes = [-1.5, 0, 1.5];
  const r = 0.36;
  for (let i = 0; i < n; i += 1) {
    const pick = rand();
    let p;
    let t;
    let ink = 0;
    if (pick < 0.46) {
      const c = nodes[Math.floor(rand() * 3)];
      const a = rand() * TAU;
      const filled = c > 1; // the node where a person decides is printed solid
      const d = filled ? r * Math.sqrt(rand()) : r * (1 + (rand() - 0.5) * 0.07);
      p = [c + Math.cos(a) * d, Math.sin(a) * d];
      t = [-Math.sin(a), Math.cos(a)];
      ink = filled ? 1 : 0;
    } else if (pick < 0.66) {
      const from = rand() < 0.5 ? -1.5 : 0;
      p = [from + r + 0.07 + (1.5 - 2 * r - 0.14) * rand(), (rand() - 0.5) * 0.02];
      t = [1, 0];
    } else {
      const a = rand() * Math.PI; // from the critic, up and over, back to the builder
      p = [-0.75 + Math.cos(a) * 0.75, r + 0.1 + Math.sin(a) * 0.6];
      t = [-Math.sin(a) * 0.75, Math.cos(a) * 0.6];
      ink = 1;
    }
    out.pos.set([p[0], p[1], (rand() - 0.5) * 0.08 + ink * 0.14], i * 3);
    out.tan.set([t[0], t[1], 0], i * 3);
    out.ink[i] = ink;
  }
  return finish(out, 0.011, true);
}

// make: the recipe. width: a splat's short radius, in units of the form.
// gain: how much ink one splat lays down. spin: turns freely; otherwise it
// faces the reader and sways by this many radians.
const FORMS = {
  name: {
    label: 'name', make: word, seed: 3, width: 0.0021, gain: 0.085, sway: 0.16, params: { text: 'RYAN KAMP' },
    recipe: 'draw the word; keep every pixel the ink reached;\ndrop a splat on each, hatched near 38°;\none splat in seven goes to the second plate',
    controls: [{ key: 'text', type: 'text', label: 'word', max: 14 }],
    note: () => 'Type any word.',
  },
  lorenz: {
    label: 'lorenz', make: lorenz, seed: 5, width: 0.0034, gain: 0.2, spin: true, params: { rho: 28 },
    recipe: 'dx = 10 (y − x)\ndy = x (ρ − z) − y\ndz = x y − 8⁄3 z',
    controls: [{ key: 'rho', type: 'range', label: 'ρ', min: 16, max: 40, step: 0.1 }],
    // σ(σ + β + 3) / (σ − β − 1) with σ = 10, β = 8/3 is exactly 470/19
    note: ({ rho }) => (rho > 470 / 19
      ? `ρ = ${rho.toFixed(1)}. Past 470⁄19 ≈ 24.74 neither resting point is stable, and the path never settles.`
      : `ρ = ${rho.toFixed(1)}. Below 470⁄19 ≈ 24.74 both resting points are stable, and the path can spiral into one.`),
  },
  klein: {
    label: 'klein bottle', make: klein, seed: 8, width: 0.0034, gain: 0.2, spin: true, params: { threads: 48 },
    recipe: 'r = 2 + cos ½u sin v − sin ½u sin 2v\nx = r cos u,  z = r sin u\ny = sin ½u sin v + cos ½u sin 2v',
    controls: [{ key: 'threads', type: 'range', label: 'threads', min: 6, max: 96, step: 1 }],
    note: ({ threads }) => `${Math.round(threads)} threads laid along the surface. Every fourth is orange.`,
  },
  gyroid: {
    label: 'gyroid', make: gyroid, seed: 13, width: 0.0036, gain: 0.2, spin: true, params: { cells: 1.5 },
    recipe: 'sin x cos y + sin y cos z + sin z cos x = 0',
    controls: [{ key: 'cells', type: 'range', label: 'periods', min: 1, max: 3, step: 0.25 }],
    note: ({ cells }) => `A ball ${cells} periods across. The two inks are the two faces of the surface.`,
  },
  yours: {
    label: 'write your own', make: yours, seed: 21, width: 0.0034, gain: 0.2, spin: true,
    params: { x: 'cos(u) * (2 + cos(v))', y: 'sin(v) + sin(3 * u) / 2', z: 'sin(u) * (2 + cos(v))' },
    recipe: 'a surface: three expressions in u and v',
    controls: [
      { key: 'x', type: 'text', label: 'x', max: 90 },
      { key: 'y', type: 'text', label: 'y', max: 90 },
      { key: 'z', type: 'text', label: 'z', max: 90 },
    ],
    note: () => 'u and v each run from 0 to 2π. sin, cos, pow, abs, PI and the rest of Math all work.',
  },
  decisions: { make: decisions, seed: 34, width: 0.0034, gain: 0.26, sway: 0.5, tilt: 0.2, params: { drift: 0.9 } },
  loop: { make: loop, seed: 55, width: 0.0034, gain: 0.16, sway: 0.24, params: {} },
  anagram: { make: word, seed: 89, width: 0.0021, gain: 0.085, sway: 0.16, params: { text: 'ANAGRAMS' } },
};
const SHELF = ['name', 'lorenz', 'klein', 'gyroid', 'yours'];

/* ---------- The press: WebGL2 ---------- */

// Pass one lays every splat onto two plates at once (red channel teal, green
// channel orange), adding as it goes. A splat is a Gaussian with a centre, a
// long axis that follows its stroke through the turn and the perspective, and
// a short radius.
const SPLAT_VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aCorner;
layout(location = 1) in vec3 aPosA;
layout(location = 2) in vec3 aTanA;
layout(location = 3) in vec3 aPosB;
layout(location = 4) in vec3 aTanB;
layout(location = 5) in vec4 aMisc; // seed, ink before, ink after, size
uniform mat3 uTurn;
uniform float uMorph;
uniform float uTime;
uniform float uCalm;
uniform vec2 uView;    // canvas size, in device pixels
uniform vec2 uCentre;  // where the form sits, from the canvas centre, y up
uniform float uScale;  // device pixels to one unit of the form
uniform float uWidth;  // a splat's short radius, in units
uniform vec3 uPointer; // xy measured like uCentre; z is its reach
out vec2 vUv;
out float vInk;
out float vWeight;

const float CAM = 4.0;

vec2 project(vec3 p) {
  return p.xy * (CAM / (CAM - p.z)) * uScale;
}

void main() {
  float seed = aMisc.x;
  // splats leave in turn, so a change of form passes through the cloud
  float k = clamp(uMorph * 1.7 - seed * 0.7, 0.0, 1.0);
  k = k * k * (3.0 - 2.0 * k);
  vec3 p = mix(aPosA, aPosB, k);
  vec3 t = mix(aTanA, aTanB, k);
  float lively = 1.0 - uCalm;
  p += lively * sin(k * 3.14159265) * 0.32 * vec3(sin(seed * 41.0), cos(seed * 57.0), sin(seed * 91.0 + 1.0));
  p += lively * 0.006 * vec3(sin(uTime * 0.9 + seed * 50.0), cos(uTime * 0.7 + seed * 80.0), sin(uTime * 0.8 + seed * 20.0));

  vec3 q = uTurn * p;
  vec2 c = project(q) + uCentre;
  vec2 major = project(q + uTurn * t) + uCentre - c;
  float minor = max(uWidth * aMisc.w * uScale * CAM / (CAM - q.z), 0.85);

  // the pointer parts the cloud
  vec2 away = c - uPointer.xy;
  float d = length(away);
  float reach = uPointer.z;
  c += (away / (d + 1.0)) * reach * 0.5 * exp(-(d * d) / (reach * reach * 0.45 + 1.0)) * (0.5 + fract(seed * 13.7));

  float len = length(major);
  vec2 dir = len > 0.001 ? major / len : vec2(1.0, 0.0);
  float along = sqrt(len * len + minor * minor);
  vec2 offset = (dir * aCorner.x * along + vec2(-dir.y, dir.x) * aCorner.y * minor) * 2.2;
  vUv = aCorner * 2.2;
  vInk = mix(aMisc.y, aMisc.z, k);
  vWeight = mix(0.55, 1.0, smoothstep(-1.2, 1.2, q.z));
  gl_Position = vec4((c + offset) / (uView * 0.5), 0.0, 1.0);
}`;

const SPLAT_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
in float vInk;
in float vWeight;
uniform float uGain;
out vec4 plate;
void main() {
  float a = max(exp(-0.5 * dot(vUv, vUv)) - 0.089, 0.0) * uGain * vWeight;
  plate = vec4(a * (1.0 - vInk), a * vInk, 0.0, 1.0);
}`;

// Pass two prints the plates onto the paper. Ink builds up and saturates,
// and where both inks land, one multiplies the other: an overprint.
const PRINT_VERT = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const PRINT_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uPlates;
uniform vec2 uView;
uniform float uDpr;
uniform vec3 uPaper;
uniform vec3 uInkA;
uniform vec3 uInkB;
out vec4 colour;

float grain(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec2 at = gl_FragCoord.xy;
  // the second plate never lands quite where the first did
  float a = texture(uPlates, at / uView).r;
  float b = texture(uPlates, (at + vec2(1.5, -1.1) * uDpr) / uView).g;
  vec2 cell = floor(at / uDpr);
  float da = min((1.0 - exp(-a * 3.2)) * (0.84 + 0.22 * grain(cell)), 1.0);
  float db = min((1.0 - exp(-b * 3.2)) * (0.84 + 0.22 * grain(cell + 19.0)), 1.0);
  colour = vec4(uPaper * mix(vec3(1.0), uInkA, da) * mix(vec3(1.0), uInkB, db), 1.0);
}`;

function program(gl, vertex, fragment) {
  const id = gl.createProgram();
  [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]].forEach(([type, src]) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    gl.attachShader(id, shader);
  });
  gl.linkProgram(id);
  if (!gl.getProgramParameter(id, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(id));
  const u = {};
  for (let i = 0; i < gl.getProgramParameter(id, gl.ACTIVE_UNIFORMS); i += 1) {
    const { name } = gl.getActiveUniform(id, i);
    u[name] = gl.getUniformLocation(id, name);
  }
  return { id, u };
}

class Cloud {
  constructor(canvas, count) {
    const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false });
    if (!gl) throw new Error('WebGL2 is not available');
    this.canvas = canvas;
    this.gl = gl;
    this.n = count;
    this.splats = program(gl, SPLAT_VERT, SPLAT_FRAG);
    this.press = program(gl, PRINT_VERT, PRINT_FRAG);

    // Where each splat is coming from and going to: centre then stroke.
    this.from = new Float32Array(count * 6);
    this.to = new Float32Array(count * 6);
    this.misc = new Float32Array(count * 4);
    const rand = seeded(11);
    for (let i = 0; i < count; i += 1) {
      this.misc[i * 4] = rand();
      this.misc[i * 4 + 3] = 0.7 + rand() * 0.6;
    }
    this.morph = 1;
    this.seconds = 1;
    this.maxDpr = 2;

    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    this.fromBuf = this.perSplat([1, 2], 3, this.from);
    this.toBuf = this.perSplat([3, 4], 3, this.to);
    this.miscBuf = this.perSplat([5], 4, this.misc);
    gl.bindVertexArray(null);
    this.bare = gl.createVertexArray();

    this.plates = gl.createTexture();
    this.frame = gl.createFramebuffer();
    this.resize();
  }

  perSplat(locations, size, data) {
    const { gl } = this;
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    locations.forEach((loc, j) => {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, locations.length * size * 4, j * size * 4);
      gl.vertexAttribDivisor(loc, 1);
    });
    return buffer;
  }

  resize() {
    const { gl, canvas } = this;
    this.dpr = Math.min(devicePixelRatio || 1, this.maxDpr);
    const w = Math.max(1, Math.round(canvas.clientWidth * this.dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * this.dpr));
    if (this.sized && canvas.width === w && canvas.height === h) return;
    this.sized = true;
    canvas.width = w;
    canvas.height = h;
    gl.bindTexture(gl.TEXTURE_2D, this.plates);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.frame);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.plates, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  // Re-form into `data`, each splat setting off from wherever it is now.
  show(data, seconds) {
    const { gl, n, from, to, misc } = this;
    const m = this.morph;
    if (m >= 1) {
      from.set(to);
      for (let i = 0; i < n; i += 1) misc[i * 4 + 1] = misc[i * 4 + 2];
    } else if (m > 0) {
      for (let i = 0; i < n; i += 1) {
        let k = clamp(m * 1.7 - misc[i * 4] * 0.7, 0, 1);
        k = k * k * (3 - 2 * k);
        for (let j = i * 6; j < i * 6 + 6; j += 1) from[j] += (to[j] - from[j]) * k;
        misc[i * 4 + 1] += (misc[i * 4 + 2] - misc[i * 4 + 1]) * k;
      }
    }
    for (let i = 0; i < n; i += 1) {
      for (let a = 0; a < 3; a += 1) {
        to[i * 6 + a] = data.pos[i * 3 + a];
        to[i * 6 + 3 + a] = data.tan[i * 3 + a];
      }
      misc[i * 4 + 2] = data.ink[i];
    }
    [[this.fromBuf, from], [this.toBuf, to], [this.miscBuf, misc]].forEach(([buffer, values]) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, values);
    });
    this.morph = 0;
    this.seconds = seconds;
  }

  draw({ time, dt, turn, centre, scale, width, gain, pointer, calm }) {
    const { gl, canvas, dpr } = this;
    this.morph = calm ? 1 : Math.min(1, this.morph + dt / this.seconds);
    const w = canvas.width;
    const h = canvas.height;
    gl.viewport(0, 0, w, h);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.frame);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    let p = this.splats;
    gl.useProgram(p.id);
    gl.uniformMatrix3fv(p.u.uTurn, false, turn);
    gl.uniform1f(p.u.uMorph, this.morph);
    gl.uniform1f(p.u.uTime, time);
    gl.uniform1f(p.u.uCalm, calm ? 1 : 0);
    gl.uniform2f(p.u.uView, w, h);
    gl.uniform2f(p.u.uCentre, centre[0] * dpr, centre[1] * dpr);
    gl.uniform1f(p.u.uScale, scale * dpr);
    gl.uniform1f(p.u.uWidth, width);
    gl.uniform3f(p.u.uPointer, pointer[0] * dpr, pointer[1] * dpr, pointer[2] * dpr);
    gl.uniform1f(p.u.uGain, gain);
    gl.bindVertexArray(this.vao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.n);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.disable(gl.BLEND);
    p = this.press;
    gl.useProgram(p.id);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.plates);
    gl.uniform1i(p.u.uPlates, 0);
    gl.uniform2f(p.u.uView, w, h);
    gl.uniform1f(p.u.uDpr, dpr);
    gl.uniform3fv(p.u.uPaper, PAPER);
    gl.uniform3fv(p.u.uInkA, TEAL);
    gl.uniform3fv(p.u.uInkB, HOT);
    gl.bindVertexArray(this.bare);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

/* ---------- The page: which form, where, and who is turning it ---------- */

// Where the form sits for a section, in CSS pixels from the canvas centre
// (y up), and the room it has.
function spot(at, w, h) {
  if (at === 'hero') return { cx: 0, cy: h * 0.11, room: [w * 0.9, h * 0.48] };
  if (at === 'centre') return { cx: 0, cy: h * 0.2, room: [w * 0.84, h * 0.36] };
  if (w < 960) return { cx: 0, cy: h * 0.21, room: [w * 0.9, h * 0.46] };
  return { cx: (at === 'left' ? -1 : 1) * w * 0.24, cy: 0, room: [w * 0.46, h * 0.74] };
}

function start() {
  const canvas = document.getElementById('cloud');
  if (!canvas) return;
  const count = innerWidth < 700 ? 14000 : 24000;
  let cloud;
  try {
    cloud = new Cloud(canvas, count);
  } catch (err) {
    console.info('Overprint: the cloud needs WebGL2, so the page is showing without it.', err.message);
    return;
  }
  document.documentElement.classList.add('gl');
  document.querySelectorAll('[data-count]').forEach((el) => { el.textContent = count.toLocaleString('en-US'); });

  // On a narrow screen each word of a phrase takes its own line.
  const stacked = (text) => (canvas.clientWidth < 700 ? text.trim().split(/\s+/).join('\n') : text);
  const made = new Map();
  const build = (key, params) => {
    const form = FORMS[key];
    const settings = { ...form.params, ...params };
    if (typeof settings.text === 'string') settings.text = stacked(settings.text);
    const id = key + JSON.stringify(settings);
    if (!made.has(id)) {
      if (made.size > 16) made.delete(made.keys().next().value);
      made.set(id, form.make(count, settings, seeded(form.seed)));
    }
    return made.get(id);
  };

  let current = null; // { key, form, data }
  let section = 'hero';
  const hero = { key: 'name', params: Object.fromEntries(SHELF.map((key) => [key, { ...FORMS[key].params }])) };
  // Returns the error, if the recipe could not be made.
  const go = (key, params = {}, quick = false) => {
    let data;
    try {
      data = build(key, params);
    } catch (err) {
      return err;
    }
    current = { key, form: FORMS[key], data };
    cloud.show(data, quick ? 0.75 : 1.8);
    return null;
  };

  /* the recipe card */
  const card = document.getElementById('recipe');
  const chips = document.getElementById('chips');
  const recipeText = document.getElementById('recipe-text');
  const controls = document.getElementById('controls');
  const note = document.getElementById('recipe-note');
  const tell = (err) => {
    const form = FORMS[hero.key];
    note.classList.toggle('is-bad', Boolean(err));
    note.textContent = err ? `That did not parse: ${err.message}` : form.note(hero.params[hero.key]);
  };
  const reprint = (quick) => {
    if (section === 'hero') tell(go(hero.key, hero.params[hero.key], quick));
    else tell(null);
  };
  const choose = (key) => {
    hero.key = key;
    const form = FORMS[key];
    [...chips.children].forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.key === key)));
    recipeText.textContent = form.recipe;
    controls.textContent = '';
    form.controls.forEach((spec) => {
      const label = document.createElement('label');
      label.className = `field field--${spec.type}`;
      const name = document.createElement('span');
      name.textContent = spec.label;
      const input = document.createElement('input');
      input.type = spec.type;
      if (spec.type === 'range') {
        input.min = spec.min;
        input.max = spec.max;
        input.step = spec.step;
      } else {
        input.maxLength = spec.max;
        input.spellcheck = false;
        input.autocomplete = 'off';
        input.autocapitalize = 'off';
      }
      input.value = hero.params[key][spec.key];
      input.addEventListener('input', () => {
        hero.params[key][spec.key] = spec.type === 'range' ? Number(input.value) : input.value;
        reprint(true);
      });
      label.append(name, input);
      controls.append(label);
    });
    reprint(false);
  };
  SHELF.forEach((key) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.dataset.key = key;
    chip.textContent = FORMS[key].label;
    chip.addEventListener('click', () => choose(key));
    chips.append(chip);
  });
  card.hidden = false;

  /* each section asks for its own form as it reaches the middle of the screen */
  let swap = 0;
  const enter = (el) => {
    clearInterval(swap);
    section = el.dataset.at;
    const key = el.dataset.form;
    if (key === 'hero') {
      reprint(false);
    } else if (key === 'anagram') {
      const words = ['ANAGRAMS', 'ARS MAGNA'];
      let i = 0;
      go(key, { text: words[0] });
      if (!reduceMotion.matches) {
        swap = setInterval(() => {
          i = 1 - i;
          go(key, { text: words[i] });
        }, 3600);
      }
    } else if (key === 'name') {
      go(key, { text: 'RYAN KAMP' });
    } else {
      go(key);
    }
  };
  const sections = [...document.querySelectorAll('[data-form]')];
  let active = null;
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.target !== active) {
        active = entry.target;
        enter(active);
      }
    });
  }, { rootMargin: '-50% 0px -50% 0px' });

  /* pointer: it parts the cloud, and a drag turns it */
  const pointer = { x: 0, y: 0, nx: 0, ny: 0, reach: 0, on: false };
  const drag = { on: false, x: 0, y: 0 };
  let yaw = 0;
  let pitch = 0;
  let coast = 0;
  addEventListener('pointermove', (e) => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    pointer.x = e.clientX - w / 2;
    pointer.y = h / 2 - e.clientY;
    pointer.nx = pointer.x / (w / 2);
    pointer.ny = pointer.y / (h / 2);
    pointer.on = true;
    if (drag.on) {
      coast = (e.clientX - drag.x) * 0.006;
      yaw += coast;
      pitch = clamp(pitch + (e.clientY - drag.y) * 0.005, -1.2, 1.2);
      drag.x = e.clientX;
      drag.y = e.clientY;
    }
  });
  addEventListener('pointerdown', (e) => {
    if (e.button || (e.target instanceof Element && e.target.closest('a, button, input, label, .card, .sec__text, .bar'))) return;
    drag.on = true;
    drag.x = e.clientX;
    drag.y = e.clientY;
    document.documentElement.classList.add('is-turning');
  });
  const release = (e) => {
    drag.on = false;
    document.documentElement.classList.remove('is-turning');
    if (e.pointerType !== 'mouse') pointer.on = false;
  };
  addEventListener('pointerup', release);
  addEventListener('pointercancel', release);
  document.documentElement.addEventListener('pointerleave', () => { pointer.on = false; });

  /* the loop */
  const view = { cx: 0, cy: 0, scale: 1, width: 0.003, gain: 0.15, set: false };
  let last = 0;
  let slow = 0;
  const tick = (now) => {
    const t = now / 1000;
    const raw = last ? t - last : 0;
    const dt = clamp(raw, 0, 0.25); // long enough that a throttled tab still gets there
    last = t;
    const calm = reduceMotion.matches;

    // a machine that cannot keep up gets a coarser print
    slow = raw > 0.034 && raw < 0.5 ? slow + 1 : Math.max(0, slow - 1);
    if (slow > 50 && cloud.maxDpr > 1) {
      cloud.maxDpr = 1;
      slow = 0;
    }
    cloud.resize();

    if (current) {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const { form, data } = current;
      const place = spot(section, w, h);
      const scale = Math.min(place.room[0] / 2, (place.room[1] / 2) * data.aspect, 600);
      const ease = calm || !view.set ? 1 : 1 - Math.exp(-dt * 3.4);
      view.set = true;
      view.cx += (place.cx - view.cx) * ease;
      view.cy += (place.cy - view.cy) * ease;
      view.scale += (scale - view.scale) * ease;
      view.width += (form.width - view.width) * ease;
      view.gain += (form.gain - view.gain) * ease;

      const settle = calm ? 1 : 1 - Math.exp(-dt * 2.6);
      if (!drag.on) {
        if (form.spin) {
          if (!calm) yaw += dt * 0.22 + coast;
          coast *= 0.94;
          pitch += (0.3 + pointer.ny * 0.1 - pitch) * settle;
        } else {
          coast = 0;
          const face = Math.round(yaw / TAU) * TAU;
          const sway = calm ? 0 : form.sway * Math.sin(t * 0.42) + pointer.nx * 0.2;
          yaw += (face + sway - yaw) * settle;
          pitch += ((form.tilt || 0) - pointer.ny * 0.1 - pitch) * settle;
        }
      }
      pointer.reach += ((pointer.on ? 120 : 0) - pointer.reach) * (1 - Math.exp(-dt * 8));

      const cy = Math.cos(yaw);
      const sy = Math.sin(yaw);
      const cp = Math.cos(pitch);
      const sp = Math.sin(pitch);
      cloud.draw({
        time: t,
        dt,
        turn: [cy, sp * sy, -cp * sy, 0, cp, sp, sy, -sp * cy, cp * cy],
        centre: [view.cx, view.cy],
        scale: view.scale,
        width: view.width,
        gain: view.gain,
        pointer: [pointer.x, pointer.y, pointer.reach],
        calm,
      });
    }
    requestAnimationFrame(tick);
  };

  // The name is set in Recursive, so wait for the face before drawing it.
  const ready = document.fonts && document.fonts.load ? document.fonts.load('900 150px Recursive') : Promise.resolve();
  Promise.race([ready, new Promise((done) => setTimeout(done, 1800))]).catch(() => {}).then(() => {
    choose('name');
    sections.forEach((el) => spy.observe(el));
    requestAnimationFrame(tick);
  });
}

console.log('%c OVERPRINT %c one cloud of splats, two inks. Try the "write your own" recipe.', 'background:#ff5a36;color:#17232b;font-weight:900', 'font-weight:600');

start();
