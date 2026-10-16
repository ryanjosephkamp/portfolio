// A splat program, read by Splashery's own equation reader (src/packs/splat-equation.js
// and src/equation.js, unchanged under vendor/) and placed every frame at time t.
// The placement follows the toy's build: a grid in (u, v) spaced along the shape,
// hue at saturation 0.72 and lightness 0.56, light and shade from the surface's normal,
// splats laid flat along a surface or drawn out along a curve.
import {
  PRESETS,
  FIELDS,
  readStatements,
  compileProgram,
} from "../../vendor/splashery/src/packs/splat-equation.js";
import { makeSet, packGPU } from "./splats.js";

// The shortest turn taking direction a onto direction b (as Splashery's kit.js has it).
function quatFromTo(a, b) {
  const la = Math.hypot(...a) || 1;
  const lb = Math.hypot(...b) || 1;
  const u = a.map((x) => x / la);
  const v = b.map((x) => x / lb);
  const d = u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
  if (d < -0.999999) {
    const ax = Math.abs(u[0]) < 0.9 ? [0, -u[2], u[1]] : [u[2], 0, -u[0]];
    const l = Math.hypot(...ax);
    return [ax[0] / l, ax[1] / l, ax[2] / l, 0];
  }
  const c = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const q = [c[0], c[1], c[2], 1 + d];
  const l = Math.hypot(...q);
  return q.map((x) => x / l);
}

const LIGHT = [0.42, 0.8, 0.43];
const TAU = Math.PI * 2;

export const PROGRAMS = Object.fromEntries(PRESETS.map((p) => [p.id, p]));

export function programText(p) {
  return FIELDS.filter((n) => p[n])
    .map((n) => `${n} = ${p[n]}`)
    .join("\n");
}

function hsl(h, s, l) {
  const f = (n) => {
    const k = (n + h * 12) % 12;
    return l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0), f(8), f(4)];
}

// Reads typed text into a compiled program, or throws with Splashery's own message.
export function readProgram(text) {
  const set = readStatements(text);
  return compileProgram(set);
}

function params(prog, n) {
  const [u0, u1] = prog.u;
  const [v0, v1] = prog.v;
  const out = [];
  let seed = 12345;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  if (prog.spread === "random") {
    for (let i = 0; i < n; i++) out.push([u0 + (u1 - u0) * rand(), prog.usesV ? v0 + (v1 - v0) * rand() : (v0 + v1) / 2]); // prettier-ignore
    return out;
  }
  if (!prog.usesV || !prog.usesU) {
    const along = prog.usesU || !prog.usesV;
    for (let i = 0; i < n; i++) {
      const f = (i + 0.5) / n;
      out.push(along ? [u0 + (u1 - u0) * f, (v0 + v1) / 2] : [(u0 + u1) / 2, v0 + (v1 - v0) * f]);
    }
    return out;
  }
  const vals = { θ: 0, y: 0, t: 0 };
  const at = (u, v) => {
    vals.θ = u;
    vals.y = v;
    return [prog.x.f(vals), prog.y.f(vals), prog.z.f(vals)];
  };
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const G = 12;
  let lu = 0;
  let lv = 0;
  for (let i = 0; i <= G; i++)
    for (let j = 0; j < G; j++) {
      const a = (i + 0.5) / (G + 1);
      const b0 = j / G;
      const b1 = (j + 1) / G;
      const du = dist(at(u0 + (u1 - u0) * b0, v0 + (v1 - v0) * a), at(u0 + (u1 - u0) * b1, v0 + (v1 - v0) * a)); // prettier-ignore
      const dv = dist(at(u0 + (u1 - u0) * a, v0 + (v1 - v0) * b0), at(u0 + (u1 - u0) * a, v0 + (v1 - v0) * b1)); // prettier-ignore
      if (Number.isFinite(du)) lu += du;
      if (Number.isFinite(dv)) lv += dv;
    }
  const ratio = lu > 0 && lv > 0 ? Math.min(400, Math.max(1 / 400, lu / lv)) : 1;
  const nu = Math.max(2, Math.round(Math.sqrt(n * ratio)));
  const nv = Math.max(2, Math.floor(n / nu));
  for (let i = 0; i < nu; i++)
    for (let j = 0; j < nv; j++)
      out.push([u0 + ((u1 - u0) * (i + 0.5)) / nu, v0 + ((v1 - v0) * (j + 0.5)) / nv]);
  return out;
}

// A live program: call frame(t) for the splat set at time t (positions fitted to a
// radius of 1 with one scale for the whole cycle, so the shape doesn't breathe).
export class LiveProgram {
  constructor(prog) {
    this.prog = prog;
    this.uv = params(prog, prog.count);
    this.n = this.uv.length;
    this.set = makeSet(this.n);
    this.gpu = null;
    const vals = { θ: 0, y: 0, t: 0 };
    const reach = [];
    for (let k = 0; k < 6; k++) {
      vals.t = (TAU * k) / 6;
      for (let i = 0; i < this.n; i += Math.max(1, Math.floor(this.n / 1500))) {
        vals.θ = this.uv[i][0];
        vals.y = this.uv[i][1];
        const p = [prog.x.f(vals), prog.y.f(vals), prog.z.f(vals)];
        if (Number.isFinite(p[0] + p[1] + p[2])) reach.push(Math.hypot(...p));
      }
    }
    reach.sort((a, b) => a - b);
    const r98 = reach.length ? reach[Math.floor(reach.length * 0.98)] : 1;
    this.far = Math.max(1e-6, r98 * 3);
    this.fit = 1 / Math.max(1e-6, r98);
    this.surface = prog.usesU && prog.usesV && prog.spread === "grid";
    this.curve = prog.spread === "grid" && prog.usesU !== prog.usesV ? (prog.usesU ? "u" : "v") : null;
    this.du = (prog.u[1] - prog.u[0]) * 1e-3;
    this.dv = (prog.v[1] - prog.v[0]) * 1e-3;
  }

  frame(t) {
    const { prog, uv, set, fit, far } = this;
    const vals = { θ: 0, y: 0, t };
    const place = (u, v) => {
      vals.θ = u;
      vals.y = v;
      return [prog.x.f(vals), prog.y.f(vals), prog.z.f(vals)];
    };
    const byte = (x) => Math.max(0, Math.min(255, Math.round(x * 255)));
    for (let i = 0; i < this.n; i++) {
      const [u, v] = uv[i];
      const p = place(u, v);
      const o3 = i * 3;
      const o4 = i * 4;
      const ok = Number.isFinite(p[0] + p[1] + p[2]) && Math.hypot(...p) <= far;
      if (!ok) {
        set.scale[o3] = set.scale[o3 + 1] = set.scale[o3 + 2] = 0;
        set.color[o4 + 3] = 0;
        continue;
      }
      vals.θ = u;
      vals.y = v;
      let rgb;
      if (prog.hue) {
        const h = prog.hue.f(vals);
        rgb = Number.isFinite(h) ? hsl(((h % 1) + 1) % 1, 0.72, 0.56) : [0.5, 0.5, 0.5];
      } else rgb = ["r", "g", "b"].map((ch) => Math.max(0, Math.min(1, prog[ch].f(vals) || 0)));
      const s = prog.size.f(vals);
      const size = (Number.isFinite(s) && s > 0 ? Math.min(s, far) : 0.05 * far) * fit;
      let q = [0, 0, 0, 1];
      let sc = [size * 0.5, size * 0.5, size * 0.5];
      if (this.surface) {
        const a = place(u + this.du, v);
        const b = place(u, v + this.dv);
        const pu = [a[0] - p[0], a[1] - p[1], a[2] - p[2]];
        const pv = [b[0] - p[0], b[1] - p[1], b[2] - p[2]];
        const cr = [pu[1] * pv[2] - pu[2] * pv[1], pu[2] * pv[0] - pu[0] * pv[2], pu[0] * pv[1] - pu[1] * pv[0]]; // prettier-ignore
        const l = Math.hypot(...cr);
        if (l > 0 && Number.isFinite(l)) {
          const nrm = [cr[0] / l, cr[1] / l, cr[2] / l];
          const d = Math.abs(nrm[0] * LIGHT[0] + nrm[1] * LIGHT[1] + nrm[2] * LIGHT[2]);
          const f = 0.62 + 0.48 * d;
          const sp = 0.18 * Math.pow(d, 24);
          rgb = rgb.map((x) => Math.min(1, x * f + sp));
          q = quatFromTo([0, 0, 1], nrm);
          sc = [size * 0.62, size * 0.62, size * 0.62 * 0.12];
        }
      } else if (this.curve) {
        const a = this.curve === "u" ? place(u + this.du, v) : place(u, v + this.dv);
        const d = [a[0] - p[0], a[1] - p[1], a[2] - p[2]];
        if (Number.isFinite(d[0] + d[1] + d[2]) && Math.hypot(...d) > 0) {
          q = quatFromTo([1, 0, 0], d);
          sc = [size * 0.5 * 1.6, size * 0.5, size * 0.5];
        }
      }
      for (let k = 0; k < 3; k++) {
        set.pos[o3 + k] = p[k] * fit;
        set.scale[o3 + k] = sc[k];
      }
      for (let k = 0; k < 4; k++) set.rot[o4 + k] = q[k];
      set.color[o4] = byte(rgb[0]);
      set.color[o4 + 1] = byte(rgb[1]);
      set.color[o4 + 2] = byte(rgb[2]);
      set.color[o4 + 3] = 255;
    }
    this.gpu = packGPU(set, this.gpu);
    return set;
  }
}
