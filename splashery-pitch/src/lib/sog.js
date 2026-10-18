// Reads a SOG file (PlayCanvas's packed splat format, version 2) into a splat set.
// A SOG is a zip of WebP pictures, one pixel per splat, and a meta.json:
//   means_l, means_u  the low and high bytes of a 16-bit position, log-transformed
//   quats             the three smallest quaternion components; alpha says which is largest
//   scales            three indices into a codebook of log scales
//   sh0               three indices into a codebook of color coefficients; alpha is opacity
// The decoding follows @playcanvas/splat-transform's own reader, so the numbers here are
// the numbers Splashery's engine draws.
import { unzipSync, strFromU8 } from "fflate";
import WebPModule from "../../vendor/playcanvas-webp/webp.mjs";
import wasmUrl from "../../vendor/playcanvas-webp/webp.wasm?url";
import { makeSet } from "./splats.js";

const SH_C0 = 0.28209479177387814;
let webp = null;

async function decoder() {
  if (!webp) webp = WebPModule({ locateFile: () => wasmUrl });
  return webp;
}

function decodeRGBA(M, bytes) {
  const inPtr = M._malloc(bytes.length);
  const outPtrPtr = M._malloc(4);
  const wPtr = M._malloc(4);
  const hPtr = M._malloc(4);
  M.HEAPU8.set(bytes, inPtr);
  const ok = M._webp_decode_rgba(inPtr, bytes.length, outPtrPtr, wPtr, hPtr);
  if (!ok) throw new Error("A WebP picture in the SOG would not decode.");
  const outPtr = M.HEAPU32[outPtrPtr >> 2];
  const w = M.HEAPU32[wPtr >> 2];
  const h = M.HEAPU32[hPtr >> 2];
  const rgba = M.HEAPU8.slice(outPtr, outPtr + w * h * 4);
  M._webp_free(outPtr);
  for (const p of [inPtr, outPtrPtr, wPtr, hPtr]) M._free(p);
  return rgba;
}

const unlog = (v) => (v < 0 ? -(Math.exp(-v) - 1) : Math.exp(v) - 1);

export async function readSOG(buffer) {
  const files = unzipSync(new Uint8Array(buffer));
  const meta = JSON.parse(strFromU8(files["meta.json"]));
  if (meta.version !== 2) throw new Error("Only version 2 SOG files are read here.");
  const M = await decoder();
  const pic = (name) => decodeRGBA(M, files[name]);
  const n = meta.count;
  const lo = pic(meta.means.files[0]);
  const hi = pic(meta.means.files[1]);
  const qs = pic(meta.quats.files[0]);
  const sc = pic(meta.scales.files[0]);
  const c0 = pic(meta.sh0.files[0]);
  const { mins, maxs } = meta.means;
  const sCode = meta.scales.codebook;
  const cCode = meta.sh0.codebook;
  const set = makeSet(n);
  const IDX = [1, 2, 3, 0, 2, 3, 0, 1, 3, 0, 1, 2];
  const comps = [0, 0, 0, 0];
  const byte = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    const i3 = i * 3;
    // Positions. PLY space has y down; Splashery's engine turns it 180 degrees about z.
    for (let k = 0; k < 3; k++) {
      const q = lo[o + k] | (hi[o + k] << 8);
      const v = unlog(mins[k] + (maxs[k] - mins[k]) * (q / 65535));
      set.pos[i3 + k] = k < 2 ? -v : v;
    }
    // Scales.
    for (let k = 0; k < 3; k++) set.scale[i3 + k] = Math.exp(sCode[sc[o + k]]);
    // Rotation, stored as (w, x, y, z) with the largest component dropped.
    const tag = qs[o + 3];
    if (tag >= 252 && tag <= 255) {
      const maxComp = tag - 252;
      const a = ((qs[o] / 255) * 2 - 1) / Math.SQRT2;
      const b = ((qs[o + 1] / 255) * 2 - 1) / Math.SQRT2;
      const c = ((qs[o + 2] / 255) * 2 - 1) / Math.SQRT2;
      comps[0] = comps[1] = comps[2] = comps[3] = 0;
      comps[IDX[maxComp * 3]] = a;
      comps[IDX[maxComp * 3 + 1]] = b;
      comps[IDX[maxComp * 3 + 2]] = c;
      comps[maxComp] = Math.sqrt(Math.max(0, 1 - (a * a + b * b + c * c)));
    } else {
      comps[0] = 1;
      comps[1] = comps[2] = comps[3] = 0;
    }
    // (w, x, y, z) -> (x, y, z, w), then the same 180 degree turn about z:
    // q' = (0, 0, 1, 0) * q.
    const [w, x, y, z] = comps;
    set.rot[o] = -y;
    set.rot[o + 1] = x;
    set.rot[o + 2] = w;
    set.rot[o + 3] = -z;
    // Color from the zeroth spherical harmonic; opacity is stored already squashed.
    set.color[o] = byte(0.5 + SH_C0 * cCode[c0[o]]);
    set.color[o + 1] = byte(0.5 + SH_C0 * cCode[c0[o + 1]]);
    set.color[o + 2] = byte(0.5 + SH_C0 * cCode[c0[o + 2]]);
    set.color[o + 3] = c0[o + 3];
  }
  return { set, meta: { count: n, generator: meta.asset?.generator || "" } };
}
