// The depth sort, on its own thread: a 16-bit counting sort of every splat's depth
// along the camera's forward axis, farthest first, so the graphics chip can blend
// back to front. During a flight it sorts the in-between positions, with the same
// per-splat timing the vertex shader uses.
import { hash01 } from "../lib/math.js";

let A = null; // positions the cloud flies from (or null when it is at rest)
let B = null; // positions the cloud is at, or flying to
let parts = null; // part index per splat
let partMats = null; // 16 x 12 floats: a 3x4 matrix per part
let count = 0;
let delays = null;

const keys16 = { buf: new Uint16Array(0) };
const counts = new Uint32Array(65536);

function ensure(n) {
  if (keys16.buf.length < n) keys16.buf = new Uint16Array(n);
}

self.onmessage = (e) => {
  const m = e.data;
  if (m.type === "set") {
    A = m.from || null;
    B = m.to;
    count = m.count;
    parts = m.parts || null;
    delays = new Float32Array(count);
    for (let i = 0; i < count; i++) delays[i] = hash01(i);
    return;
  }
  if (m.type === "parts") {
    partMats = m.mats;
    return;
  }
  if (m.type === "sort") {
    if (!B) {
      self.postMessage({ type: "order", order: null, version: m.version, ms: 0 });
      return;
    }
    const t0 = performance.now();
    const order = sort(m);
    self.postMessage({ type: "order", order, version: m.version, ms: performance.now() - t0 }, [order.buffer]); // prettier-ignore
  }
};

function sort({ fwd, morph, spread }) {
  const n = count;
  ensure(n);
  const depth = new Float32Array(n);
  const [fx, fy, fz] = fwd;
  let min = Infinity;
  let max = -Infinity;
  const flying = A && morph < 1;
  const usePart = parts && partMats;
  for (let i = 0; i < n; i++) {
    const o = i * 3;
    let x = B[o];
    let y = B[o + 1];
    let z = B[o + 2];
    if (usePart) {
      const p = parts[i];
      if (p) {
        const M = partMats;
        const b = p * 12;
        const nx = M[b] * x + M[b + 1] * y + M[b + 2] * z + M[b + 3];
        const ny = M[b + 4] * x + M[b + 5] * y + M[b + 6] * z + M[b + 7];
        const nz = M[b + 8] * x + M[b + 9] * y + M[b + 10] * z + M[b + 11];
        x = nx;
        y = ny;
        z = nz;
      }
    }
    if (flying) {
      let t = (morph - delays[i] * spread) / (1 - spread);
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const s = t * t * (3 - 2 * t);
      x = A[o] + (x - A[o]) * s;
      y = A[o + 1] + (y - A[o + 1]) * s;
      z = A[o + 2] + (z - A[o + 2]) * s;
    }
    const d = x * fx + y * fy + z * fz;
    depth[i] = d;
    if (d < min) min = d;
    if (d > max) max = d;
  }
  const k = 65535 / (max - min || 1);
  const keys = keys16.buf;
  counts.fill(0);
  for (let i = 0; i < n; i++) {
    // Farthest first: invert the key.
    const key = 65535 - (((depth[i] - min) * k) | 0);
    keys[i] = key;
    counts[key]++;
  }
  let sum = 0;
  for (let j = 0; j < 65536; j++) {
    const c = counts[j];
    counts[j] = sum;
    sum += c;
  }
  const order = new Uint32Array(n);
  for (let i = 0; i < n; i++) order[counts[keys[i]]++] = i;
  return order;
}
