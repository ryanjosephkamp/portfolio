// The data thread: reads the grape's SOG and the walnut's volume, runs Splashery's own
// recipes, builds the splat tree for the dial, pairs clouds for a flight, and finds
// the splat under a tap. Every set it keeps is normalized to a framing radius of 1.
import { readSOG } from "../lib/sog.js";
import { packGPU, framing, normalize } from "../lib/splats.js";
import { buildTree, levelPair, leafCount } from "../lib/tree.js";
import { pairSets } from "../lib/pair.js";
import { pickSplat } from "../lib/pick.js";
import { buildChest } from "../lib/recipe.js";
import { readWalnut } from "../lib/walnut.js";
import { quatAxisAngle, quatMul, quatRotate } from "../lib/math.js";

// Turns a set in place (positions and splat rotations).
function turn(set, q) {
  const p = [0, 0, 0];
  const r = [0, 0, 0, 1];
  for (let i = 0; i < set.count; i++) {
    for (let k = 0; k < 3; k++) p[k] = set.pos[i * 3 + k];
    const v = quatRotate(q, p);
    for (let k = 0; k < 3; k++) set.pos[i * 3 + k] = v[k];
    for (let k = 0; k < 4; k++) r[k] = set.rot[i * 4 + k];
    const w = quatMul(q, r);
    for (let k = 0; k < 4; k++) set.rot[i * 4 + k] = w[k];
  }
}

const sets = new Map();
const fileName = (url) => decodeURIComponent(new URL(url).pathname.split("/").pop());

// Downloads a file, and says which file and why when it can't.
async function get(url) {
  const name = fileName(url);
  let res;
  try {
    res = await fetch(url);
  } catch {
    throw new Error(`${name} did not load: the network request failed (${url}).`);
  }
  if (!res.ok) throw new Error(`${name} did not load: HTTP ${res.status}${res.statusText ? " " + res.statusText : ""} (${url}).`); // prettier-ignore
  try {
    return await res.arrayBuffer();
  } catch {
    throw new Error(`${name} did not load: the download stopped partway (${url}).`);
  }
}

// Reads a downloaded file, and names the file if it can't be read.
async function read(url, fn) {
  try {
    return await fn();
  } catch (err) {
    throw new Error(`${fileName(url)} could not be read: ${err.message}`);
  }
}
const trees = new Map();

function reply(set, extra = {}) {
  const gpu = packGPU(set);
  const pos = set.pos.slice();
  const parts = set.part.slice();
  return {
    result: { count: set.count, gpu, pos, parts, ...extra },
    transfer: [gpu.buffer, pos.buffer, parts.buffer],
  };
}

const OPS = {
  async sog({ key, url, upright }) {
    const t0 = performance.now();
    const buf = await get(url);
    const t1 = performance.now();
    const { set, meta } = await read(url, () => readSOG(buf));
    const t2 = performance.now();
    // The grape's capture lies along z with its stem toward -z; stand it stem up.
    if (upright) turn(set, quatAxisAngle([1, 0, 0], Math.PI / 2));
    const raw = framing(set);
    const tf = normalize(set, 1);
    set.transform = tf;
    sets.set(key, set);
    return reply(set, {
      key,
      meta,
      bytes: buf.byteLength,
      transform: tf,
      rawRadius: raw.radius,
      ms: { fetch: t1 - t0, decode: t2 - t1 },
    });
  },

  async chest({ key, count, seed, wood }) {
    const t0 = performance.now();
    const { set, parts, recipeBytes } = buildChest({ count, seed, wood });
    const ms = performance.now() - t0;
    set.transform = normalize(set, 1);
    // The parts' pivots move with the set.
    for (const p of parts) {
      p.pivot = p.pivot.map((v, k) => (v - set.transform.center[k]) * set.transform.scale);
    }
    sets.set(key, set);
    return reply(set, { key, parts, ms, recipeBytes });
  },

  async walnut({ key, url, budget }) {
    const buf = await get(url);
    const { set, info } = await read(url, () => readWalnut(new Uint8Array(buf), budget));
    set.transform = normalize(set, 1);
    // The front of the scan (nearest the camera, smallest z), for the cut's depth in mm.
    let zmin = Infinity;
    for (let i = 0; i < set.count; i++) zmin = Math.min(zmin, set.pos[i * 3 + 2]);
    sets.set(key, set);
    return reply(set, { key, info, bytes: buf.byteLength, mmPerUnit: 1 / set.transform.scale, zmin }); // prettier-ignore
  },

  async rename({ from, to }) {
    sets.set(to, sets.get(from));
    sets.delete(from);
    trees.delete(to);
    return { result: true };
  },

  async raw({ key, set }) {
    sets.set(key, set);
    return { result: { key, count: set.count } };
  },

  async tree({ key }) {
    const set = sets.get(key);
    const t0 = performance.now();
    const tree = buildTree(set);
    trees.set(key, tree);
    return { result: { levels: tree.levels, leaves: leafCount(tree), ms: performance.now() - t0 } };
  },

  // The flight from level L to level L + 1 of the tree (the last level is the set itself).
  async level({ key, level }) {
    const tree = trees.get(key);
    const { from, to } = levelPair(tree, sets.get(key), level);
    const a = packGPU(from);
    const b = packGPU(to);
    const pa = from.pos.slice();
    const pb = to.pos.slice();
    return {
      result: { count: to.count, from: a, to: b, posFrom: pa, posTo: pb },
      transfer: [a.buffer, b.buffer, pa.buffer, pb.buffer],
    };
  },

  async pair({ from, to }) {
    const A = sets.get(from);
    const B = sets.get(to);
    const { a, b } = pairSets(A, B);
    const ga = packGPU(a);
    const gb = packGPU(b);
    const pa = a.pos.slice();
    const pb = b.pos.slice();
    const parts = b.part.slice();
    return {
      result: { count: b.count, from: ga, to: gb, posFrom: pa, posTo: pb, parts },
      transfer: [ga.buffer, gb.buffer, pa.buffer, pb.buffer, parts.buffer],
    };
  },

  async pick({ key, view, focal, w, h, shift, x, y }) {
    const set = sets.get(key);
    return { result: pickSplat(set, view, focal, w, h, shift, x, y) };
  },
};

self.onmessage = async (e) => {
  const { id, op, args } = e.data;
  try {
    const r = await OPS[op](args);
    self.postMessage({ id, ok: true, result: r.result }, r.transfer || []);
  } catch (err) {
    self.postMessage({ id, ok: false, error: err?.message || String(err), stack: err?.stack || "" });
  }
};
