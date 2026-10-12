// The water: the 2D wave equation on a grid,
//
//   ∂²u/∂t² + γ(x, y) ∂u/∂t = c² ∇²u
//
// u is the height of the water (cm), c the wave speed (cm/s). It is solved the
// way the ripple tank in Splashery solves it: the explicit finite-difference
// scheme (second-order centered differences in time and space, the five-point
// Laplacian) at a Courant number of 0.5. γ is zero in open water and rises as
// the square of the depth into a border, the "beach" that soaks waves up so
// they do not come back. A barrier is a row of cells held at u = 0.
//
// Pure JavaScript, no DOM: check.mjs runs it in Node.

export const COURANT = 0.5;
// The water is shown slowed down this many times, so a wave at 8 Hz is easy to follow.
export const SLOW = 4;
export const SPEED = [15, 30]; // cm/s
export const FREQ = [4, 10]; // Hz

export class Tank {
  // width, depth: the tank in cm; nx: cells across (square cells).
  constructor({ width, depth, nx, beach = 4, cMax = SPEED[1] }) {
    this.width = width;
    this.nx = nx;
    this.dx = width / nx;
    this.ny = Math.round(depth / this.dx);
    this.depth = this.ny * this.dx;
    this.beach = beach;
    this.dt = (COURANT * this.dx) / cMax;
    const n = this.nx * this.ny;
    this.u = new Float32Array(n);
    this.prev = new Float32Array(n);
    this.next = new Float32Array(n);
    this.wall = new Uint8Array(n);
    this.gamma = new Float32Array(n);
    this.intensity = new Float32Array(n); // a running average of u² (the fringes)
    this.c = 20;
    this.f = 8;
    this.amp = 0.1;
    this.lineAmp = 0.07;
    this.time = 0;
    this.phase = 0;
    this.debt = 0;
    this.sources = []; // { x, y } cm: dippers
    this.line = null; // { y } cm: the bar that makes a plane wave
    this.running = true;
    // γ = γmax (d / L)² at depth d into a border L wide.
    const gmax = (3 * 8 * cMax * 0.5) / beach;
    for (let j = 0; j < this.ny; j++)
      for (let i = 0; i < nx; i++) {
        const x = (i + 0.5) * this.dx;
        const y = (j + 0.5) * this.dx;
        const d = Math.max(0, beach - Math.min(x, y, this.width - x, this.depth - y));
        this.gamma[j * nx + i] = gmax * (d / beach) ** 2;
      }
  }

  get wavelength() {
    return this.c / this.f;
  }

  // A wall across the tank at y (cm) with openings [{ center, width }] (cm). null: none.
  setBarrier(barrier) {
    this.wall.fill(0);
    this.barrier = barrier || null;
    if (!barrier) return;
    const { nx, dx } = this;
    const j0 = Math.round(barrier.y / dx) - 1;
    for (let j = j0; j < j0 + 2; j++)
      for (let i = 0; i < nx; i++) {
        const x = (i + 0.5) * dx;
        const open = barrier.openings.some((o) => Math.abs(x - o.center) < o.width / 2);
        if (!open) {
          const k = j * nx + i;
          this.wall[k] = 1;
          this.u[k] = this.prev[k] = this.next[k] = 0;
        }
      }
  }

  clear() {
    this.u.fill(0);
    this.prev.fill(0);
    this.next.fill(0);
    this.intensity.fill(0);
    this.time = 0;
    this.phase = 0;
  }

  // A pebble at (x, y) cm: a Gaussian dimple, radius r cm, pushed into the
  // water, which then runs out as rings.
  pebble(x, y, r = 0.6, depth = 0.5) {
    const { nx, ny, dx } = this;
    const R = Math.ceil((3 * r) / dx);
    const ci = Math.round(x / dx - 0.5);
    const cj = Math.round(y / dx - 0.5);
    for (let j = Math.max(1, cj - R); j <= Math.min(ny - 2, cj + R); j++)
      for (let i = Math.max(1, ci - R); i <= Math.min(nx - 2, ci + R); i++) {
        const k = j * nx + i;
        if (this.wall[k]) continue;
        const g = -depth * Math.exp(-(((i - ci) * dx) ** 2 + ((j - cj) * dx) ** 2) / (r * r));
        this.u[k] += g;
        this.prev[k] += g;
      }
  }

  // A dipper bobs as A sin(2π f t) over a small cross of cells; a plane wave
  // is a bar along a whole row. The drive fades in over its first period.
  drive() {
    if (!this.running || (!this.sources.length && !this.line)) return;
    const { nx, dx } = this;
    const ramp = Math.min(1, this.time * this.f);
    const s = ramp * Math.sin(this.phase);
    for (const src of this.sources) {
      const ci = Math.round(src.x / dx - 0.5);
      const cj = Math.round(src.y / dx - 0.5);
      for (let j = cj - 1; j <= cj + 1; j++)
        for (let i = ci - 1; i <= ci + 1; i++)
          if (Math.abs(i - ci) + Math.abs(j - cj) <= 1) this.u[j * nx + i] = this.amp * s;
    }
    if (this.line) {
      const j = Math.round(this.line.y / dx - 0.5);
      for (let i = 1; i < nx - 1; i++) this.u[j * nx + i] = this.lineAmp * s;
    }
  }

  step() {
    const { nx, ny, u, prev, next, wall, gamma, dt } = this;
    const r2 = ((this.c * dt) / this.dx) ** 2;
    for (let j = 1; j < ny - 1; j++) {
      const row = j * nx;
      for (let i = 1; i < nx - 1; i++) {
        const k = row + i;
        if (wall[k]) {
          next[k] = 0;
          continue;
        }
        const lap = u[k - 1] + u[k + 1] + u[k - nx] + u[k + nx] - 4 * u[k];
        const g = gamma[k] * dt * 0.5;
        next[k] = (2 * u[k] - (1 - g) * prev[k] + r2 * lap) / (1 + g);
      }
    }
    this.prev = u;
    this.u = next;
    this.next = prev;
    this.time += dt;
    this.phase = (this.phase + 2 * Math.PI * this.f * dt) % (2 * Math.PI);
    this.drive();
  }

  // Runs the water on by `seconds` of tank time in whole steps, and keeps the
  // running average of u² over about `avg` seconds.
  advance(seconds, { maxSteps = 12, avg = 0.7 } = {}) {
    this.debt += seconds;
    let n = Math.min(maxSteps, Math.floor(this.debt / this.dt));
    this.debt = Math.min(this.debt - n * this.dt, this.dt);
    const a = Math.min(1, this.dt / avg);
    const I = this.intensity;
    while (n-- > 0) {
      this.step();
      const u = this.u;
      for (let k = 0; k < I.length; k++) I[k] += (u[k] * u[k] - I[k]) * a;
    }
  }

  sample(field, x, y) {
    const { nx, ny, dx } = this;
    const fx = Math.min(nx - 1.001, Math.max(0, x / dx - 0.5));
    const fy = Math.min(ny - 1.001, Math.max(0, y / dx - 0.5));
    const i = Math.floor(fx);
    const j = Math.floor(fy);
    const s = fx - i;
    const t = fy - j;
    const k = j * nx + i;
    return (1 - t) * ((1 - s) * field[k] + s * field[k + 1]) + t * ((1 - s) * field[k + nx] + s * field[k + nx + 1]);
  }
}

// The angles (degrees) where d·sin θ = m·λ puts a bright line, m = 0, 1, 2 …
export function brightAngles(d, lambda) {
  const out = [];
  for (let m = 0; m * lambda <= d; m++) out.push((Math.asin((m * lambda) / d) * 180) / Math.PI);
  return out;
}

// Young's measurement, done on the water itself. Walk an arc of radius R
// around the midpoint of two sources (pair: { x, y, d }, cm; the waves run
// toward +y), find the bright line on the axis and the first one on each
// side, and read off how much farther each side line is from one source than
// from the other. That path difference is one wavelength. Returns the
// wavelength in cm, or null when the arc holds no first-order line.
// The page shows it for two dippers while that line is within about 37° of
// the axis (λ ≤ 0.6 d, MEASURABLE below); check.mjs measures every water in
// that range. Behind two slits the tops sit several percent inside where the
// formula puts them, so the page leaves that number out there.
export const MEASURABLE = 0.6;
export function fringeWavelength(tank, pair, R) {
  const N = 481;
  const span = 1.25;
  const prof = new Float32Array(N);
  const lo = tank.beach + 0.5;
  let top = 0;
  for (let k = 0; k < N; k++) {
    const th = -span + (2 * span * k) / (N - 1);
    const x = pair.x + R * Math.sin(th);
    const y = pair.y + R * Math.cos(th);
    const inside = x > lo && x < tank.width - lo && y > lo && y < tank.depth - lo;
    prof[k] = inside ? tank.sample(tank.intensity, x, y) : NaN;
    if (inside && prof[k] > top) top = prof[k];
  }
  if (!(top > 0)) return null;
  // Smooth a little, then take the tops. A side line counts only when the
  // water goes properly dark between it and the line on the axis.
  const soft = prof.map((v, k) => (k < 2 || k > N - 3 ? NaN : (prof[k - 2] + prof[k - 1] + v + prof[k + 1] + prof[k + 2]) / 5));
  const angle = (k) => -span + (2 * span * k) / (N - 1);
  const tops = [];
  for (let k = 3; k < N - 3; k++) {
    const a = soft[k - 1];
    const b = soft[k];
    const c = soft[k + 1];
    if (!(b > a && b >= c) || !(b > 0.12 * top)) continue;
    tops.push({ k, v: b, th: angle(k + (0.5 * (a - c)) / (a - 2 * b + c || 1)) }); // the top of the parabola through the three
  }
  let mid = -1;
  for (let i = 0; i < tops.length; i++) if (mid < 0 || Math.abs(tops[i].th) < Math.abs(tops[mid].th)) mid = i;
  if (mid < 0 || Math.abs(tops[mid].th) > 0.08) return null;
  const sides = [];
  for (const dir of [-1, 1])
    for (let i = mid + dir; i >= 0 && i < tops.length; i += dir) {
      let dark = Infinity;
      for (let k = Math.min(tops[i].k, tops[mid].k); k <= Math.max(tops[i].k, tops[mid].k); k++) dark = Math.min(dark, soft[k]);
      if (dark < 0.4 * Math.min(tops[i].v, tops[mid].v)) {
        sides.push(tops[i].th);
        break;
      }
    }
  if (!sides.length) return null;
  let sum = 0;
  for (const th of sides) {
    const x = R * Math.sin(th);
    const y = R * Math.cos(th);
    sum += Math.abs(Math.hypot(x + pair.d / 2, y) - Math.hypot(x - pair.d / 2, y));
  }
  return sum / sides.length;
}
