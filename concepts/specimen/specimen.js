// SPECIMEN — the maths, with no DOM in it, so verify.mjs can run the same code in Node.
//
// A specimen is a list of 3D Gaussians ("splats"): a centre m, a covariance S, a weight w,
// a stain (absorbance per colour channel), and two numbers that say when and how strongly
// a splat takes part in a spike. buildTree() pairs them up, level by level, into coarser
// splats that keep the same mass, centre and covariance.

export const DEPTH = 12; // 2^12 = 4,096 splats at full focus
export const WAVE_MS = 16; // length of the stored spike waveform, in milliseconds
export const T_SOMA = 4; // the soma fires this long after the first input arrives

/* ---------- small helpers ---------- */

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const unit = (a) => mul(a, 1 / (len(a) || 1));
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

function onSphere(r) {
  const z = 2 * r() - 1;
  const t = 2 * Math.PI * r();
  const s = Math.sqrt(1 - z * z);
  return [s * Math.cos(t), s * Math.sin(t), z];
}
function inBall(r) {
  return mul(onSphere(r), Math.cbrt(r()));
}
function perpTo(d, r) {
  return unit(cross(d, onSphere(r)));
}

// Covariance as six numbers: xx, yy, zz, xy, xz, yz.
const ball = (s) => [s * s, s * s, s * s, 0, 0, 0];
// Long along d, thin across it: across² I + (along² − across²) d dᵀ.
function needle(d, along, across) {
  const k = along * along - across * across;
  const c = across * across;
  return [c + k * d[0] * d[0], c + k * d[1] * d[1], c + k * d[2] * d[2], k * d[0] * d[1], k * d[0] * d[2], k * d[1] * d[2]];
}

// Stains are stored as absorbance, −ln(transmitted colour): light passes through, and is lost.
export const stain = (r, g, b) => [-Math.log(r), -Math.log(g), -Math.log(b)];
export const STAINS = {
  violet: stain(0.34, 0.17, 0.56), // cell bodies and neurites
  deep: stain(0.2, 0.1, 0.42), // nucleus, boutons
  myelin: stain(0.22, 0.56, 0.66), // the sheath
  spike: stain(1.0, 0.2, 0.3), // a membrane that is firing
};

/* ---------- the neuron recipe ---------- */

// A neurite that wanders and forks, as a list of short straight segments.
function grow(r, segs, tips, p, dir, length, radius, depth, s) {
  const steps = Math.max(3, Math.round(length / 0.05));
  const h = length / steps;
  for (let k = 0; k < steps; k += 1) {
    dir = unit(add(dir, mul(onSphere(r), 0.24)));
    const q = add(p, mul(dir, h));
    segs.push({ a: p, b: q, r: radius * (1 - (0.3 * k) / steps), s0: s, s1: s + h });
    p = q;
    s += h;
  }
  if (depth === 0) {
    tips.push({ p, s, dir });
    return;
  }
  const side = perpTo(dir, r);
  for (const sign of [1, -1]) {
    const tilt = 0.38 + 0.4 * r();
    const d = unit(add(mul(dir, Math.cos(tilt)), mul(side, sign * Math.sin(tilt))));
    grow(r, segs, tips, p, d, length * (0.66 + 0.16 * r()), radius * 0.72, depth - 1, s);
  }
}

// Exactly n splats spread evenly along a set of segments, each one a needle along its segment.
function alongTube(r, segs, n, emit, fat = 1) {
  const lens = segs.map((g) => len(sub(g.b, g.a)));
  const spacing = lens.reduce((a, b) => a + b, 0) / n;
  let j = 0;
  let before = 0;
  for (let i = 0; i < n; i += 1) {
    const u = (i + r()) * spacing;
    while (j < segs.length - 1 && before + lens[j] < u) {
      before += lens[j];
      j += 1;
    }
    const g = segs[j];
    const f = Math.min(1, Math.max(0, (u - before) / lens[j]));
    const d = unit(sub(g.b, g.a));
    const rad = g.r * fat;
    const p = add(mix(g.a, g.b, f), mul(perpTo(d, r), rad * 0.7 * Math.sqrt(r())));
    emit(p, needle(d, Math.max(spacing * 0.8, rad * 0.8), rad * 0.5), g.s0 + (g.s1 - g.s0) * f, g);
  }
}

/**
 * A multipolar neuron, drawn the way a textbook lays one out: dendrites on the left, the
 * soma, then a myelinated axon running right to its terminals. Returns 4,096 leaves.
 */
export function neuron(seed = 1952) {
  const r = rng(seed);
  const leaves = [];
  const put = (m, S, a, delay, gain) => leaves.push({ m, S, w: 1, a, delay, gain });

  // Soma, 420, and its nucleus, 60.
  for (let i = 0; i < 420; i += 1) {
    const q = inBall(r);
    put([q[0] * 0.17, q[1] * 0.15, q[2] * 0.14], ball(0.034), STAINS.violet, T_SOMA, 1);
  }
  for (let i = 0; i < 60; i += 1) put(mul(inBall(r), 0.06), ball(0.02), STAINS.deep, T_SOMA, 1);

  // Dendrites, 1,480: six trunks fanned away from the axon.
  const dSegs = [];
  const dTips = [];
  for (const deg of [62, 108, 150, 192, 236, 290]) {
    const t = (deg * Math.PI) / 180;
    const d = unit([Math.cos(t), Math.sin(t), (r() - 0.5) * 0.9]);
    grow(r, dSegs, dTips, mul(d, 0.13), d, 0.34 + 0.1 * r(), 0.03, 4, 0.13);
  }
  const reach = Math.max(...dTips.map((t) => t.s));
  // Inputs start at the far tips at time 0 and reach the soma together at T_SOMA.
  alongTube(r, dSegs, 1480, (p, S, s) => put(p, S, STAINS.violet, T_SOMA * (1 - s / reach), 0.42));

  // The axon: a hillock, then five myelinated internodes with a node of Ranvier after each.
  const INTERNODES = 5;
  const HOP = 1.5; // ms from one node to the next: the spike jumps the sheath, then pauses
  const core = [];
  const sheaths = [];
  let p = [0.14, 0, 0];
  let dir = [1, 0, 0];
  let time = T_SOMA;
  const run = (length, r0, r1, t1, into) => {
    const steps = Math.round(length / 0.04);
    for (let k = 0; k < steps; k += 1) {
      dir = unit(add(dir, [0, (r() - 0.5) * 0.14 - p[1] * 0.05, (r() - 0.5) * 0.14 - p[2] * 0.05]));
      const q = add(p, mul(dir, length / steps));
      const g = { a: p, b: q, r: r0 + ((r1 - r0) * k) / steps, s0: time + ((t1 - time) * k) / steps, s1: time + ((t1 - time) * (k + 1)) / steps };
      core.push(g);
      if (into) into.push({ ...g, r: 0.058 * Math.sin((Math.PI * (k + 0.5)) / steps) ** 0.45 });
      p = q;
    }
    time = t1;
  };
  run(0.2, 0.075, 0.02, T_SOMA + 0.4, null);
  for (let k = 0; k < INTERNODES; k += 1) {
    const sheath = [];
    run(0.4, 0.02, 0.02, time + 0.25, sheath); // under the sheath: fast
    sheaths.push(sheath);
    run(0.048, 0.024, 0.024, time + HOP - 0.25, null); // at the node: regenerate
  }
  alongTube(r, core, 420, (q, S, s, g) => put(q, S, STAINS.violet, s, 1));
  for (const sheath of sheaths) alongTube(r, sheath, 210, (q, S, s) => put(q, S, STAINS.myelin, s, 0.9));

  // Terminal arbor, 400, and a bouton on each of its tips, 266 between them.
  const tSegs = [];
  const tTips = [];
  grow(r, tSegs, tTips, p, dir, 0.26, 0.016, 3, 0);
  const SPEED = 0.45; // arbor length covered per ms
  alongTube(r, tSegs, 400, (q, S, s) => put(q, S, STAINS.violet, time + s / SPEED, 1));
  for (let i = 0; i < 266; i += 1) {
    const tip = tTips[i % tTips.length];
    put(add(tip.p, mul(inBall(r), 0.034)), ball(0.014), STAINS.deep, time + tip.s / SPEED, 1);
  }

  return normalise(leaves);
}

// Equal weights that sum to 1, centre of mass at the origin, longest half-extent 1.
export function normalise(leaves) {
  const n = leaves.length;
  const c = [0, 0, 0];
  for (const l of leaves) for (let k = 0; k < 3; k += 1) c[k] += l.m[k] / n;
  let far = 0;
  for (const l of leaves) for (let k = 0; k < 3; k += 1) far = Math.max(far, Math.abs(l.m[k] - c[k]));
  const s = 1 / far;
  return leaves.map((l) => ({ ...l, w: 1 / n, m: mul(sub(l.m, c), s), S: l.S.map((v) => v * s * s) }));
}

/* ---------- the tree ---------- */

/**
 * Moment matching: the one Gaussian with the same mass, centre and covariance as the pair.
 *   w = wa + wb,  m = (wa·ma + wb·mb) / w,
 *   S = (wa·(Sa + da·daᵀ) + wb·(Sb + db·dbᵀ)) / w,  with da = ma − m.
 */
export function merge(A, B) {
  const w = A.w + B.w;
  const fa = A.w / w;
  const fb = B.w / w;
  const m = [fa * A.m[0] + fb * B.m[0], fa * A.m[1] + fb * B.m[1], fa * A.m[2] + fb * B.m[2]];
  const da = sub(A.m, m);
  const db = sub(B.m, m);
  const outer = (d) => [d[0] * d[0], d[1] * d[1], d[2] * d[2], d[0] * d[1], d[0] * d[2], d[1] * d[2]];
  const oa = outer(da);
  const ob = outer(db);
  return {
    w,
    m,
    S: A.S.map((_, k) => fa * (A.S[k] + oa[k]) + fb * (B.S[k] + ob[k])),
    a: A.a.map((_, k) => fa * A.a[k] + fb * B.a[k]),
    delay: fa * A.delay + fb * B.delay,
    gain: fa * A.gain + fb * B.gain,
  };
}

/**
 * Pair the leaves into a complete binary tree. nodes[1] is the whole specimen as one splat;
 * nodes[i] has children nodes[2i] and nodes[2i+1]; level L is nodes[2^L .. 2^(L+1) − 1].
 * Each split is at the median along the axis the leaves are most spread on.
 */
export function buildTree(leaves) {
  const depth = Math.log2(leaves.length);
  if (!Number.isInteger(depth)) throw new Error('a specimen needs a power-of-two number of splats');
  const nodes = new Array(2 * leaves.length);
  const order = Int32Array.from(leaves, (_, i) => i);
  const build = (i, lo, hi) => {
    if (hi - lo === 1) {
      nodes[i] = leaves[order[lo]];
      return;
    }
    let axis = 0;
    let widest = -1;
    for (let k = 0; k < 3; k += 1) {
      let s = 0;
      let s2 = 0;
      for (let j = lo; j < hi; j += 1) {
        const v = leaves[order[j]].m[k];
        s += v;
        s2 += v * v;
      }
      const spread = s2 - (s * s) / (hi - lo);
      if (spread > widest) {
        widest = spread;
        axis = k;
      }
    }
    order.subarray(lo, hi).sort((a, b) => leaves[a].m[axis] - leaves[b].m[axis]);
    const mid = (lo + hi) >> 1;
    build(2 * i, lo, mid);
    build(2 * i + 1, mid, hi);
    nodes[i] = merge(nodes[2 * i], nodes[2 * i + 1]);
  };
  build(1, 0, leaves.length);
  return { depth, nodes };
}

// Mass, centre and covariance of a set of splats taken together.
export function moments(splats) {
  let w = 0;
  const m = [0, 0, 0];
  for (const s of splats) {
    w += s.w;
    for (let k = 0; k < 3; k += 1) m[k] += s.w * s.m[k];
  }
  for (let k = 0; k < 3; k += 1) m[k] /= w;
  const S = [0, 0, 0, 0, 0, 0];
  for (const s of splats) {
    const d = sub(s.m, m);
    const o = [d[0] * d[0], d[1] * d[1], d[2] * d[2], d[0] * d[1], d[0] * d[2], d[1] * d[2]];
    for (let k = 0; k < 6; k += 1) S[k] += (s.w * (s.S[k] + o[k])) / w;
  }
  return { w, m, S };
}

export const level = (tree, L) => tree.nodes.slice(1 << L, 2 << L);

// One row of 32 floats per node: itself, then its parent (holding half the parent's weight,
// so that two children resting on their parent add up to exactly the parent).
export function pack(tree) {
  const n = tree.nodes.length - 1;
  const out = new Float32Array(n * 32);
  const write = (o, s, w) => {
    out.set([s.m[0], s.m[1], s.m[2], w, s.S[0], s.S[1], s.S[2], s.delay, s.S[3], s.S[4], s.S[5], s.gain, s.a[0], s.a[1], s.a[2], 0], o);
  };
  for (let i = 1; i <= n; i += 1) {
    const s = tree.nodes[i];
    write((i - 1) * 32, s, s.w);
    if (i === 1) write(16, s, s.w);
    else write((i - 1) * 32 + 16, tree.nodes[i >> 1], tree.nodes[i >> 1].w / 2);
  }
  return out;
}

/* ---------- Hodgkin & Huxley, 1952 ---------- */

/**
 * The squid giant axon model, integrated with forward Euler at dt = 0.01 ms. A brief current
 * pulse at t = 0 from rest; returns the membrane potential (mV) every 0.1 ms.
 */
export function hodgkinHuxley({ ms = WAVE_MS, current = 20, pulse = 1, dt = 0.01 } = {}) {
  const gNa = 120, gK = 36, gL = 0.3, ENa = 50, EK = -77, EL = -54.387, C = 1;
  const ratio = (x, y) => (Math.abs(x) < 1e-7 ? y : x / (1 - Math.exp(-x / y)));
  const an = (v) => 0.01 * ratio(v + 55, 10);
  const bn = (v) => 0.125 * Math.exp(-(v + 65) / 80);
  const am = (v) => 0.1 * ratio(v + 40, 10);
  const bm = (v) => 4 * Math.exp(-(v + 65) / 18);
  const ah = (v) => 0.07 * Math.exp(-(v + 65) / 20);
  const bh = (v) => 1 / (1 + Math.exp(-(v + 35) / 10));
  let v = -65;
  let n = an(v) / (an(v) + bn(v));
  let m = am(v) / (am(v) + bm(v));
  let h = ah(v) / (ah(v) + bh(v));
  const rest = v;
  const trace = [];
  const every = Math.round(0.1 / dt);
  const steps = Math.round(ms / dt);
  for (let i = 0; i <= steps; i += 1) {
    if (i % every === 0) trace.push(v);
    const I = i * dt < pulse ? current : 0;
    const dv = (I - gNa * m ** 3 * h * (v - ENa) - gK * n ** 4 * (v - EK) - gL * (v - EL)) / C;
    n += dt * (an(v) * (1 - n) - bn(v) * n);
    m += dt * (am(v) * (1 - m) - bm(v) * m);
    h += dt * (ah(v) * (1 - h) - bh(v) * h);
    v += dt * dv;
  }
  return { trace, rest, peak: Math.max(...trace), trough: Math.min(...trace), step: 0.1 };
}
