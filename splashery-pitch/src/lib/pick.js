// Finds the splat that gives the most to one pixel: every splat is projected the way
// the vertex shader projects it, the ones whose Gaussian reaches the pixel are taken
// front to back, and each one's share is its alpha times the light still getting
// through (a_i * T_i, with T the product of 1 - a_j in front of it).
import { covariance } from "./math.js";

export function pickSplat(set, view, focal, w, h, shift, x, y) {
  const m = view;
  const n = set.count;
  const hits = [];
  const s = [0, 0, 0];
  const q = [0, 0, 0, 1];
  // Pixel to a y-up frame centered on the principal point.
  const px = x - ((shift[0] + 1) / 2) * w;
  const py = ((1 - shift[1]) / 2) * h - y;
  for (let i = 0; i < n; i++) {
    const o = i * 3;
    const X = set.pos[o];
    const Y = set.pos[o + 1];
    const Z = set.pos[o + 2];
    const cx = m[0] * X + m[4] * Y + m[8] * Z + m[12];
    const cy = m[1] * X + m[5] * Y + m[9] * Z + m[13];
    const cz = m[2] * X + m[6] * Y + m[10] * Z + m[14];
    if (cz < 0.01) continue;
    const sx = (focal * cx) / cz;
    const sy = (focal * cy) / cz;
    const dx = px - sx;
    const dy = py - sy;
    // Cheap reject: farther than about 3 times the largest axis.
    const smax = Math.max(set.scale[o], set.scale[o + 1], set.scale[o + 2]);
    const rpx = (3 * smax * focal) / cz + 1.5;
    if (dx * dx + dy * dy > rpx * rpx) continue;
    const c2 = project2(set, i, m, focal, cx, cy, cz, s, q);
    const a = c2[0] + 0.3;
    const b = c2[1];
    const d = c2[2] + 0.3;
    const det = a * d - b * b;
    if (det <= 0) continue;
    const power = -0.5 * ((d * dx * dx - 2 * b * dx * dy + a * dy * dy) / det);
    if (power < -4.5) continue;
    const alpha = Math.min(0.99, (set.color[i * 4 + 3] / 255) * Math.exp(power));
    if (alpha < 1 / 255) continue;
    hits.push({ i, z: cz, alpha, cov2: [a, b, d], screen: [sx, sy] });
  }
  hits.sort((p, r) => p.z - r.z);
  let T = 1;
  let best = null;
  let layers = 0;
  for (const hit of hits) {
    const share = hit.alpha * T;
    if (!best || share > best.share) best = { ...hit, share, T };
    T *= 1 - hit.alpha;
    layers++;
    if (T < 1e-3) break;
  }
  if (!best) return null;
  const i = best.i;
  const tf = set.transform || { center: [0, 0, 0], scale: 1 };
  const k = 1 / tf.scale;
  const mu = [0, 1, 2].map((a) => set.pos[i * 3 + a] * k + tf.center[a]);
  const sd = [0, 1, 2].map((a) => set.scale[i * 3 + a] * k);
  const rot = [0, 1, 2, 3].map((a) => set.rot[i * 4 + a]);
  const sigma = covariance(sd, rot);
  return {
    index: i,
    mu,
    sd,
    rot,
    sigma,
    color: [0, 1, 2].map((a) => set.color[i * 4 + a]),
    opacity: set.color[i * 4 + 3] / 255,
    share: best.share,
    through: best.T,
    behind: hits.length,
    layers,
    depth: best.z,
    cov2: best.cov2,
    world: [0, 1, 2].map((a) => set.pos[i * 3 + a]),
    worldScale: [0, 1, 2].map((a) => set.scale[i * 3 + a]),
  };
}

function project2(set, i, m, focal, cx, cy, cz, s, q) {
  for (let k = 0; k < 3; k++) s[k] = set.scale[i * 3 + k];
  for (let k = 0; k < 4; k++) q[k] = set.rot[i * 4 + k];
  const c = covariance(s, q);
  // Sigma in world space (symmetric).
  const S = [c[0], c[1], c[2], c[1], c[3], c[4], c[2], c[4], c[5]];
  // W: world to camera rotation, row-major from the column-major view matrix.
  const W = [m[0], m[4], m[8], m[1], m[5], m[9], m[2], m[6], m[10]];
  const z2 = cz * cz;
  const J = [focal / cz, 0, (-focal * cx) / z2, 0, focal / cz, (-focal * cy) / z2];
  // T = J W (2x3)
  const T = [0, 0, 0, 0, 0, 0];
  for (let r = 0; r < 2; r++)
    for (let col = 0; col < 3; col++)
      T[r * 3 + col] = J[r * 3] * W[col] + J[r * 3 + 1] * W[3 + col] + J[r * 3 + 2] * W[6 + col];
  // T S T^T (2x2)
  const TS = [0, 0, 0, 0, 0, 0];
  for (let r = 0; r < 2; r++)
    for (let col = 0; col < 3; col++)
      TS[r * 3 + col] = T[r * 3] * S[col] + T[r * 3 + 1] * S[3 + col] + T[r * 3 + 2] * S[6 + col];
  const a = TS[0] * T[0] + TS[1] * T[1] + TS[2] * T[2];
  const b = TS[0] * T[3] + TS[1] * T[4] + TS[2] * T[5];
  const d = TS[3] * T[3] + TS[4] * T[4] + TS[5] * T[5];
  return [a, b, d];
}
