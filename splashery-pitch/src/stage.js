// The stage: one canvas, one cloud of splats, and everything that happens to it.
// It owns the renderer, the orbit camera, the sort thread and the data thread, and
// draws the debug overlay (the exploded frame's layers, the picked splat's labels).
import { SplatRenderer } from "./gl/renderer.js";
import { OrbitCamera, project } from "./lib/camera.js";
import { clamp, lerp, easeInOut, easeOut, quatAxisAngle, quatToMat3 } from "./lib/math.js";
import SortWorker from "./workers/sort.js?worker";
import DataWorker from "./workers/data.js?worker";

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)");

// Calls into a worker, each answered by id. If the worker fails to start, throws, or
// sends something that can't be read, every call still waiting is rejected with that
// error, and so is every call after it.
class RPC {
  constructor(worker, name, onFail) {
    this.w = worker;
    this.name = name;
    this.n = 0;
    this.wait = new Map();
    this.dead = null;
    worker.onmessage = (e) => {
      const { id, ok, result, error, stack } = e.data;
      const p = this.wait.get(id);
      if (!p) return;
      this.wait.delete(id);
      if (ok) return p.resolve(result);
      // The page shows the message; the console keeps where it came from.
      if (stack) console.debug(`${name}:`, stack);
      p.reject(new Error(error));
    };
    const die = (why) => {
      if (this.dead) return;
      this.dead = new Error(why);
      for (const p of this.wait.values()) p.reject(this.dead);
      this.wait.clear();
      onFail(this.dead);
    };
    worker.onerror = (e) => {
      e.preventDefault?.();
      die(workerMessage(name, e));
    };
    worker.onmessageerror = () => die(`The ${name} sent a message this page could not read.`);
  }
  call(op, args = {}, transfer = []) {
    if (this.dead) return Promise.reject(this.dead);
    const id = ++this.n;
    return new Promise((resolve, reject) => {
      this.wait.set(id, { resolve, reject });
      this.w.postMessage({ id, op, args }, transfer);
    });
  }
}

// A worker's error event has a message when its code threw, and none when its script
// could not be loaded at all.
function workerMessage(name, e) {
  if (e && e.message) return `The ${name} stopped: ${e.message.replace(/^Uncaught (Error: )?/, "")}`;
  return `The ${name} could not start: its script did not load.`;
}

export class Stage {
  constructor(host) {
    this.host = host;
    this.canvas = document.createElement("canvas");
    this.canvas.className = "stage-gl";
    this.canvas.setAttribute("aria-hidden", "true");
    this.overlay = document.createElement("canvas");
    this.overlay.className = "stage-overlay";
    this.overlay.setAttribute("aria-hidden", "true");
    host.prepend(this.overlay);
    host.prepend(this.canvas);
    this.ctx = this.overlay.getContext("2d");
    this.gl = new SplatRenderer(this.canvas);
    this.cam = new OrbitCamera();
    this.cam.zoom = 1.15;
    // Anything that stops a thread or the drawing context ends here; the page shows it.
    this.broken = false;
    this.onError = (err) => console.error(err);
    const broke = (err) => {
      this.broken = true;
      if (this.pending) {
        const p = this.pending;
        this.pending = null;
        p.reject(err);
      }
      this.onError(err);
    };
    this.data = new RPC(new DataWorker(), "data thread", broke);
    this.sorter = new SortWorker();
    this.sorter.onmessage = (e) => this.onOrder(e.data);
    this.sorter.onerror = (e) => {
      e.preventDefault?.();
      broke(new Error(workerMessage("sort thread", e)));
    };
    this.sorter.onmessageerror = () => broke(new Error("The sort thread sent a message this page could not read.")); // prettier-ignore
    this.canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      broke(new Error("The graphics chip dropped this page's drawing context."));
    });
    this.version = 0; // version of the data the sort worker holds
    this.shown = 0; // version currently drawn
    this.pending = null; // { version, commit() }
    this.sortBusy = false;
    this.lastSort = null;
    this.count = 0;
    this.listeners = new Set();

    // What the frame draws.
    this.rep = [1, 0, 0, 0];
    this.repTarget = [1, 0, 0, 0];
    this.pass = 0;
    this.drawCount = null;
    this.selected = -1;
    this.dim = 1;
    this.dimTarget = 1;
    this.cut = [0, 0, 0, 0];
    this.parts = null;
    this.partMats = null;
    this.partTint = false;
    this.shift = [0, 0.04];
    this.shiftTarget = [0, 0.04];
    this.displayCount = null;
    this.splatScale = 1;
    this.fade = 1;
    this.fadeTarget = 1;
    this.morph = { t: 1, dur: 1, spread: 0.5, arc: 0, done: null, start: 0, manual: false };
    this.lift = 0;
    this.liftPos = [0, 0, 0];
    this.liftScale = 1;
    this.explode = { amount: 0, frozen: false, eye: [0, 0, 0], fwd: [0, 0, 1], center: 3, len: 3, slabs: 24 }; // prettier-ignore
    this.overdrawMax = 48;

    // Camera motion.
    this.spin = 0.1; // radians a second when idle
    this.spinOn = true;
    this.camTween = null;
    this.idleAt = 0;
    this.gesture = "orbit";
    this.pointer = null;
    this.onTap = null;
    this.onPull = null;
    this.visible = true;
    this.fps = 60;
    this.sortMs = 0;
    // Big desktop canvases start at 1.5; adapt() lowers it further if frames run late.
    this.dpr = Math.min(devicePixelRatio || 1, matchMedia("(pointer: coarse)").matches ? 2 : 1.5);
    this.slow = 0;

    this.bindPointer();
    new ResizeObserver(() => this.resize()).observe(host);
    this.resize();
    const io = new IntersectionObserver((es) => {
      this.visible = es[0].isIntersecting;
    });
    io.observe(host);
    this.t0 = performance.now();
    this.last = this.t0;
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  on(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  resize() {
    const r = this.host.getBoundingClientRect();
    this.cssW = Math.max(1, r.width);
    this.cssH = Math.max(1, r.height);
    const w = Math.round(this.cssW * this.dpr);
    const h = Math.round(this.cssH * this.dpr);
    this.gl.resize(w, h);
    this.overlay.width = Math.round(this.cssW * Math.min(devicePixelRatio || 1, 2));
    this.overlay.height = Math.round(this.cssH * Math.min(devicePixelRatio || 1, 2));
  }

  // ---- Data ------------------------------------------------------------------------

  // Shows a cloud at rest. Resolves once it is drawn.
  setCloud({ gpu, pos, parts, count }) {
    const v = ++this.version;
    this.sorter.postMessage({ type: "set", to: pos.slice(), count, parts: parts ? parts.slice() : null }); // prettier-ignore
    this.gl.upload("nextB", gpu, count);
    return new Promise((resolve, reject) => {
      if (this.broken) return reject(new Error("The page's threads have stopped."));
      this.pending = {
        version: v,
        reject,
        commit: () => {
          this.gl.commit(false);
          this.count = count;
          this.morph.t = 1;
          this.morph.manual = false;
          resolve();
        },
      };
      this.requestSort(true);
    });
  }

  // Flies from one cloud to another (both `count` long, paired splat for splat).
  fly({ from, to, posFrom, posTo, count, parts }, { duration = 2.2, spread = 0.55, arc = 0.35 } = {}) {
    const v = ++this.version;
    this.sorter.postMessage({ type: "set", from: posFrom.slice(), to: posTo.slice(), count, parts: parts ? parts.slice() : null }); // prettier-ignore
    this.gl.upload("nextB", to, count);
    this.gl.upload("nextA", from, count);
    if (REDUCED.matches) duration = 0.35;
    return new Promise((resolve, reject) => {
      if (this.broken) return reject(new Error("The page's threads have stopped."));
      this.pending = {
        version: v,
        reject,
        commit: () => {
          this.gl.commit(true);
          this.count = count;
          Object.assign(this.morph, { t: 0, dur: duration, spread, arc, start: performance.now(), done: resolve, manual: false }); // prettier-ignore
        },
      };
      this.requestSort(true);
    });
  }

  // Replaces the drawn splats in place (same count), for a cloud that changes every frame.
  liveSet(gpu, pos, count) {
    if (this.pending || count !== this.count) return;
    this.gl.upload("b", gpu, count);
    this.sorter.postMessage({ type: "set", to: pos.slice(), count });
    this.requestSort(true);
  }

  // Shows a pair of clouds at a fixed point between them (the dial), without a timeline.
  showPair({ from, to, posFrom, posTo, count }, t) {
    const v = ++this.version;
    this.sorter.postMessage({ type: "set", from: posFrom, to: posTo, count }, [posFrom.buffer, posTo.buffer]); // prettier-ignore
    this.gl.upload("nextB", to, count);
    this.gl.upload("nextA", from, count);
    return new Promise((resolve, reject) => {
      if (this.broken) return reject(new Error("The page's threads have stopped."));
      this.pending = {
        version: v,
        reject,
        commit: () => {
          this.gl.commit(true);
          this.count = count;
          Object.assign(this.morph, { t, spread: 0, arc: 0, manual: true, done: null });
          resolve();
        },
      };
      this.requestSort(true);
    });
  }

  requestSort(force = false) {
    if (this.sortBusy) {
      if (force) this.sortAgain = true;
      return;
    }
    if (this.explode.frozen && !force && !this.pending) return;
    if (!this.pending && !this.count) return;
    const v = this.cam.view();
    const f = v.fwd;
    const key = `${f[0].toFixed(4)},${f[1].toFixed(4)},${f[2].toFixed(4)},${this.morph.t.toFixed(3)},${this.partKey || ""}`;
    if (!force && key === this.lastSort) return;
    this.lastSort = key;
    this.sortBusy = true;
    this.sorter.postMessage({ type: "sort", fwd: f, morph: this.morph.t, spread: this.morph.spread, version: this.version }); // prettier-ignore
  }

  onOrder({ order, version, ms }) {
    this.sortBusy = false;
    if (!order) {
      if (this.pending) this.requestSort(true);
      return;
    }
    this.sortMs = this.sortMs ? this.sortMs * 0.8 + ms * 0.2 : ms;
    if (this.pending && version === this.pending.version) {
      this.gl.setOrder(order);
      const p = this.pending;
      this.pending = null;
      this.shown = version;
      p.commit();
    } else if (version === this.shown && !this.pending) {
      if (!this.explode.frozen) this.gl.setOrder(order);
    }
    if (this.sortAgain || this.pending) {
      this.sortAgain = false;
      this.requestSort(true);
    }
  }

  setParts(parts, angles) {
    // parts: [{ pivot, axis }], angles: { index: radians }
    const r0 = new Float32Array(64);
    const r1 = new Float32Array(64);
    const r2 = new Float32Array(64);
    const q = new Float32Array(64);
    const mats = new Float32Array(16 * 12);
    let key = "";
    for (let i = 0; i < 16; i++) {
      const p = parts[i];
      const ang = (p && angles[i]) || 0;
      key += ang.toFixed(3);
      const qq = p ? quatAxisAngle(p.axis, ang) : [0, 0, 0, 1];
      const R = quatToMat3(qq);
      const pv = p ? p.pivot : [0, 0, 0];
      // p' = R (p - pivot) + pivot
      const t = [0, 1, 2].map((k) => pv[k] - (R[k * 3] * pv[0] + R[k * 3 + 1] * pv[1] + R[k * 3 + 2] * pv[2])); // prettier-ignore
      r0.set([R[0], R[1], R[2], t[0]], i * 4);
      r1.set([R[3], R[4], R[5], t[1]], i * 4);
      r2.set([R[6], R[7], R[8], t[2]], i * 4);
      q.set(qq, i * 4);
      mats.set([R[0], R[1], R[2], t[0], R[3], R[4], R[5], t[1], R[6], R[7], R[8], t[2]], i * 12);
    }
    this.parts = { r0, r1, r2, q };
    if (key !== this.partKey) {
      this.partKey = key;
      this.sorter.postMessage({ type: "parts", mats });
    }
  }

  clearParts() {
    this.parts = null;
    this.partKey = "";
    this.sorter.postMessage({ type: "parts", mats: null });
  }

  // ---- Camera ------------------------------------------------------------------------

  view(to, duration = 1.4) {
    const from = { yaw: this.cam.yaw, pitch: this.cam.pitch, zoom: this.cam.zoom, target: this.cam.target.slice(), fov: this.cam.fov }; // prettier-ignore
    // Take the short way round.
    if (to.yaw !== undefined) {
      const d = to.yaw - from.yaw;
      to = { ...to, yaw: from.yaw + Math.atan2(Math.sin(d), Math.cos(d)) };
    }
    this.camTween = { from, to, start: performance.now(), dur: REDUCED.matches ? 0.01 : duration };
  }

  freeze() {
    const v = this.cam.view();
    const e = this.explode;
    e.frozen = true;
    e.eye = v.eye;
    e.fwd = v.fwd;
    e.right = v.right;
    e.up = v.up;
    e.center = this.cam.distance;
    e.len = 3.4;
    e.slabs = 16;
    e.yaw0 = this.cam.yaw;
    e.pitch0 = this.cam.pitch;
    e.zoom0 = this.cam.zoom;
  }

  thaw() {
    this.explode.frozen = false;
    this.explode.amount = 0;
    this.requestSort(true);
  }

  // ---- Pointer -----------------------------------------------------------------------

  bindPointer() {
    const el = this.host;
    el.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || !e.isPrimary) return;
      if (e.target.closest("button, a, input, label, .hud-interactive")) return;
      const r = el.getBoundingClientRect();
      this.pointer = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t0: performance.now(), yaw0: this.cam.yaw, pitch0: this.cam.pitch, moved: false, r }; // prettier-ignore
      this.idleAt = performance.now();
      if (this.gesture === "pull" && this.onPull) this.onPull("start", 0, e);
    });
    el.addEventListener("pointermove", (e) => {
      const p = this.pointer;
      if (!p || e.pointerId !== p.id) return;
      p.x = e.clientX;
      p.y = e.clientY;
      const dx = p.x - p.x0;
      const dy = p.y - p.y0;
      if (!p.moved && Math.hypot(dx, dy) > 6) {
        p.moved = true;
        try {
          el.setPointerCapture(e.pointerId);
        } catch {}
      }
      if (!p.moved) return;
      this.idleAt = performance.now();
      if (this.gesture === "pull" && this.onPull) this.onPull("move", dx / Math.max(170, p.r.width * 0.5), e); // prettier-ignore
      else if (this.gesture === "cut" && this.onCut) {
        this.onCut((p.x - (p.lastX ?? p.x0)) / p.r.width);
        p.lastX = p.x;
      } else if (this.gesture === "orbit") {
        this.camTween = null;
        this.cam.yaw = p.yaw0 + (dx / p.r.width) * 3.2;
        if (e.pointerType !== "touch") this.cam.pitch = clamp(p.pitch0 + (dy / p.r.height) * 2, -1.2, 1.2); // prettier-ignore
      }
    });
    const end = (e) => {
      const p = this.pointer;
      if (!p || e.pointerId !== p.id) return;
      this.pointer = null;
      this.idleAt = performance.now();
      if (this.gesture === "pull" && this.onPull) this.onPull("end", 0, e);
      if (!p.moved && e.type === "pointerup" && performance.now() - p.t0 < 500 && this.onTap) {
        const r = el.getBoundingClientRect();
        this.onTap((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
      }
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  }

  // Canvas device pixels of a point given as fractions of the stage.
  devicePoint(fx, fy) {
    return [fx * this.canvas.width, fy * this.canvas.height];
  }

  async pick(key, fx, fy) {
    const v = this.cam.view();
    const [x, y] = this.devicePoint(fx, fy);
    return this.data.call("pick", {
      key,
      view: v.m,
      focal: this.cam.focal(this.canvas.height),
      w: this.canvas.width,
      h: this.canvas.height,
      shift: this.shift,
      x,
      y,
    });
  }

  // ---- Frame -------------------------------------------------------------------------

  loop(now) {
    requestAnimationFrame(this.loop);
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    if (!this.visible || document.hidden) return;
    this.fps = this.fps * 0.95 + (1 / Math.max(dt, 1e-3)) * 0.05;
    this.adapt(dt);
    const cam = this.cam;
    cam.fit(this.cssW / this.cssH);

    // Camera tween, then idle spin.
    if (this.camTween) {
      const tw = this.camTween;
      const k = clamp((now - tw.start) / 1000 / tw.dur, 0, 1);
      const e = easeInOut(k);
      for (const key of ["yaw", "pitch", "zoom", "fov"])
        if (tw.to[key] !== undefined) cam[key] = lerp(tw.from[key], tw.to[key], e);
      if (tw.to.target) cam.target = tw.from.target.map((v, i) => lerp(v, tw.to.target[i], e));
      if (k >= 1) this.camTween = null;
    } else if (this.spinOn && !this.pointer && !this.explode.frozen && !REDUCED.matches && now - this.idleAt > 2500) {
      cam.yaw += this.spin * dt;
    }

    // Eased values.
    const ease = 1 - Math.exp(-dt * 7);
    for (let i = 0; i < 4; i++) this.rep[i] = lerp(this.rep[i], this.repTarget[i], ease);
    for (let i = 0; i < 2; i++) this.shift[i] = lerp(this.shift[i], this.shiftTarget[i], ease);
    this.dim = lerp(this.dim, this.dimTarget, ease);
    this.fade = lerp(this.fade, this.fadeTarget, 1 - Math.exp(-dt * 4));

    // Flight.
    const m = this.morph;
    if (m.t < 1 && !m.manual) {
      m.t = clamp((now - m.start) / 1000 / m.dur, 0, 1);
      if (m.t >= 1 && m.done) {
        const d = m.done;
        m.done = null;
        d();
      }
    }

    this.requestSort();
    const v = cam.view();
    const focal = cam.focal(this.canvas.height);
    const e = this.explode;
    const state = {
      view: v.m,
      focal,
      shift: this.shift,
      morph: m.t,
      spread: m.spread,
      arc: m.arc,
      splatScale: this.splatScale,
      explode: e.amount,
      frozenEye: e.eye,
      frozenFwd: e.fwd,
      slabs: e.slabs,
      stackCenter: e.center,
      stackLen: e.len,
      parts: this.parts,
      partTint: this.partTint,
      selected: this.selected,
      dim: this.dim,
      cut: this.cut,
      rep: this.rep,
      pass: this.pass,
      depthRange: [cam.distance - 0.95, cam.distance + 0.45],
      fade: this.fade,
      lift: this.lift,
      liftPos: this.liftPos,
      liftScale: this.liftScale,
      drawCount: this.drawCount,
      overdrawMax: this.overdrawMax,
    };
    this.gl.draw(state);
    this.frame = { view: v, focal, now, dt };
    this.drawOverlay(v, focal);
    for (const fn of this.listeners) fn(this.frame);
  }

  // Lowers the canvas resolution if frames keep arriving late, and raises it again
  // when there is room.
  adapt(dt) {
    if (dt > 0.024) this.slow++;
    else this.slow = Math.max(0, this.slow - 0.5);
    if (this.slow > 45 && this.dpr > 1) {
      this.dpr = Math.max(1, this.dpr - 0.25);
      this.slow = 0;
      this.resize();
    }
  }

  drawOverlay(v, focal) {
    const c = this.ctx;
    const W = this.overlay.width;
    const H = this.overlay.height;
    c.clearRect(0, 0, W, H);
    const e = this.explode;
    if (e.amount > 0.01) this.drawLayers(c, v, W, H);
    if (this.overlayHook) this.overlayHook(c, v, W, H);
  }

  // The exploded frame's layers: each slab's plane, drawn as the frustum slice of the
  // frozen camera that covers the object, with every fourth slab labeled.
  drawLayers(c, v, W, H) {
    const e = this.explode;
    const focal = this.cam.focal(H);
    const scale = W / this.overlay.width;
    const a = e.amount;
    const K = e.slabs;
    const per = Math.round(this.count / K);
    const dpr = W / this.cssW;
    c.save();
    c.lineWidth = 1 * dpr;
    c.font = `${10.5 * dpr}px "Geist Mono Variable", ui-monospace, monospace`;
    for (let s = 0; s < K; s++) {
      const sd = lerp(e.center, e.center + (0.5 - (s + 0.5) / K) * e.len, a);
      const k = sd / e.center;
      const hx = 1.08 * k;
      const hy = 1.08 * k;
      const ctr = [0, 1, 2].map((i) => e.eye[i] + e.fwd[i] * sd);
      const corners = [
        [-hx, -hy],
        [hx, -hy],
        [hx, hy],
        [-hx, hy],
      ].map(([x, y]) => [0, 1, 2].map((i) => ctr[i] + e.right[i] * x + e.up[i] * y));
      const pts = corners.map((p) => project(v, focal, W, H, this.shift, p));
      if (pts.some((p) => !p)) continue;
      const first = s === 0 || s === K - 1;
      c.strokeStyle = `rgba(255, 212, 0, ${(first ? 0.55 : 0.16) * a})`;
      c.beginPath();
      pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
      c.closePath();
      c.stroke();
      const ly = pts[3][1] - 5 * dpr;
      if ((s === 0 || s === K - 1 || s === K >> 1) && ly > 70 * dpr && ly < H - 60 * dpr) {
        c.fillStyle = `rgba(232, 230, 225, ${0.75 * a})`;
        const lo = s * per;
        const hi = Math.min(this.count, (s + 1) * per) - 1;
        const label = s === K - 1 ? `${fmt(lo)}–${fmt(this.count - 1)} · nearest` : s === 0 ? `0–${fmt(hi)} · farthest` : `${fmt(lo)}–${fmt(hi)}`; // prettier-ignore
        c.fillText(label, pts[3][0] + 4 * dpr, ly);
      }
    }
    c.restore();
    void scale;
  }
}

export const fmt = (n) => Math.round(n).toLocaleString("en-US");
