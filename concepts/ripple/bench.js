// A small light bench: rays traced through one prism with Snell's law,
//
//   n₁ sin θ₁ = n₂ sin θ₂,
//
// in vector form, with total internal reflection when sin θ₂ would exceed 1.
// The glass is Schott N-BK7; its index at each wavelength comes from the
// Sellmeier fit on its data sheet (wavelength in micrometers):
//
//   n² − 1 = Σ Bᵢ λ² / (λ² − Cᵢ)
//
// Pure JavaScript, no DOM, so check.mjs can run it in Node.

const B = [1.03961212, 0.231792344, 1.01046945];
const C = [0.00600069867, 0.0200179144, 103.560653];

export function sellmeier(nm) {
  const l2 = (nm / 1000) ** 2;
  let s = 1;
  for (let i = 0; i < 3; i++) s += (B[i] * l2) / (l2 - C[i]);
  return Math.sqrt(s);
}

// White light as nine wavelengths across the visible spectrum.
export const WHITE = [410, 445, 475, 505, 540, 587.6, 610, 635, 665];
export const LIGHTS = { white: WHITE, red: [650], green: [532], blue: [450] };

// An approximate screen color for a wavelength in nm.
export function wavelengthRGB(nm) {
  let r = 0;
  let g = 0;
  let b = 0;
  if (nm < 440) [r, g, b] = [(440 - nm) / 60, 0, 1];
  else if (nm < 490) [r, g, b] = [0, (nm - 440) / 50, 1];
  else if (nm < 510) [r, g, b] = [0, 1, (510 - nm) / 20];
  else if (nm < 580) [r, g, b] = [(nm - 510) / 70, 1, 0];
  else if (nm < 645) [r, g, b] = [1, (645 - nm) / 65, 0];
  else [r, g, b] = [1, 0, 0];
  const edge = nm < 420 ? 0.45 + (0.55 * (nm - 380)) / 40 : nm > 680 ? 0.45 + (0.55 * (750 - nm)) / 70 : 1;
  return [r, g, b].map((v) => Math.round(255 * Math.min(1, Math.max(0, v * edge)) ** 0.8));
}

// The corners of an equilateral prism with side s, turned by `turn` radians.
export function prismCorners(s, turn) {
  const r = s / Math.sqrt(3);
  return [0, 1, 2].map((i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 3 + turn;
    return [r * Math.cos(a), r * Math.sin(a)];
  });
}

// Traces one ray from `from` along `dir` (a unit vector) through the prism.
// Returns the points it passes and the direction it leaves in.
export function trace(corners, from, dir, n, reach = 10) {
  const pts = [from];
  let p = from;
  let d = dir;
  let inside = false;
  for (let bounce = 0; bounce < 8; bounce++) {
    let best = null;
    for (let i = 0; i < 3; i++) {
      const a = corners[i];
      const b = corners[(i + 1) % 3];
      const ex = b[0] - a[0];
      const ey = b[1] - a[1];
      const det = ex * d[1] - ey * d[0];
      if (Math.abs(det) < 1e-12) continue;
      const t = (ex * (a[1] - p[1]) - ey * (a[0] - p[0])) / det;
      const s = (d[0] * (a[1] - p[1]) - d[1] * (a[0] - p[0])) / det;
      if (t > 1e-7 && s >= 0 && s <= 1 && (!best || t < best.t)) best = { t, ex, ey };
    }
    if (!best) break;
    p = [p[0] + d[0] * best.t, p[1] + d[1] * best.t];
    pts.push(p);
    // The face's normal, turned to face the incoming ray.
    const len = Math.hypot(best.ex, best.ey);
    let nx = best.ey / len;
    let ny = -best.ex / len;
    if (nx * d[0] + ny * d[1] > 0) [nx, ny] = [-nx, -ny];
    const eta = inside ? n : 1 / n;
    const cos1 = -(nx * d[0] + ny * d[1]);
    const k = 1 - eta * eta * (1 - cos1 * cos1);
    if (k < 0) d = [d[0] + 2 * cos1 * nx, d[1] + 2 * cos1 * ny];
    else {
      const m = eta * cos1 - Math.sqrt(k);
      d = [eta * d[0] + m * nx, eta * d[1] + m * ny];
      inside = !inside;
    }
  }
  pts.push([p[0] + d[0] * reach, p[1] + d[1] * reach]);
  return { pts, out: d, hit: pts.length > 2 };
}
