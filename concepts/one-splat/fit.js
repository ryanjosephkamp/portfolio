// A picture as a hierarchy of Gaussians. Pure code: runs in the browser or in Node.
//
// Every node of the tree is the Gaussian with the exact mean and covariance of
// the points beneath it (moment matching). A node splits at the median along
// its principal axis, so each level has twice the splats of the one above and
// every splat on a level carries the same mass.

export const PIXEL = 1 / 12; // variance of a unit pixel along each axis

// Rearranges key[l..r] (and idx with it) so that key[k] is the value a full
// sort would put there, with nothing larger before it and nothing smaller after.
function select(key, idx, l, r, k) {
  while (r > l) {
    const pivot = key[(l + r) >> 1];
    let i = l;
    let j = r;
    while (i <= j) {
      while (key[i] < pivot) i += 1;
      while (key[j] > pivot) j -= 1;
      if (i <= j) {
        const t = key[i];
        key[i] = key[j];
        key[j] = t;
        const u = idx[i];
        idx[i] = idx[j];
        idx[j] = u;
        i += 1;
        j -= 1;
      }
    }
    if (k <= j) r = j;
    else if (k >= i) l = i;
    else return;
  }
}

/**
 * Nodes are stored heap-style: the root is 1 and the children of i are 2i and
 * 2i + 1, so level L occupies indices 2^L to 2^(L+1) - 1.
 * Each node has a count n, a mean (mx, my) and a covariance [[a, b], [b, c]].
 */
export function buildTree(xs, ys, maxLevel) {
  const total = xs.length;
  const levels = Math.max(0, Math.min(maxLevel, Math.floor(Math.log2(total))));
  const size = 2 ** (levels + 1);
  const idx = new Uint32Array(total);
  for (let i = 0; i < total; i += 1) idx[i] = i;
  const key = new Float32Array(total);
  const lo = new Uint32Array(size);
  const hi = new Uint32Array(size);
  const tree = {
    levels,
    size,
    total,
    n: new Uint32Array(size),
    mx: new Float64Array(size),
    my: new Float64Array(size),
    a: new Float64Array(size),
    b: new Float64Array(size),
    c: new Float64Array(size),
    // Which points each node owns: idx[lo[i]] to idx[hi[i] - 1].
    idx,
    lo,
    hi,
  };

  const measure = (i, s, e) => {
    const count = e - s;
    let sx = 0;
    let sy = 0;
    for (let k = s; k < e; k += 1) {
      sx += xs[idx[k]];
      sy += ys[idx[k]];
    }
    const ux = sx / count;
    const uy = sy / count;
    let sxx = 0;
    let sxy = 0;
    let syy = 0;
    for (let k = s; k < e; k += 1) {
      const dx = xs[idx[k]] - ux;
      const dy = ys[idx[k]] - uy;
      sxx += dx * dx;
      sxy += dx * dy;
      syy += dy * dy;
    }
    tree.n[i] = count;
    tree.mx[i] = ux;
    tree.my[i] = uy;
    tree.a[i] = sxx / count + PIXEL;
    tree.b[i] = sxy / count;
    tree.c[i] = syy / count + PIXEL;
    lo[i] = s;
    hi[i] = e;
  };

  measure(1, 0, total);
  for (let i = 1; i < size / 2; i += 1) {
    const s = lo[i];
    const e = hi[i];
    const theta = 0.5 * Math.atan2(2 * tree.b[i], tree.a[i] - tree.c[i]);
    const vx = Math.cos(theta);
    const vy = Math.sin(theta);
    for (let k = s; k < e; k += 1) {
      key[k] = (xs[idx[k]] - tree.mx[i]) * vx + (ys[idx[k]] - tree.my[i]) * vy;
    }
    const m = s + ((e - s) >> 1);
    select(key, idx, s, e - 1, m);
    measure(2 * i, s, m);
    measure(2 * i + 1, m, e);
  }
  return tree;
}

/**
 * The law of total covariance, tested at every split: the two halves must
 * carry the parent's mass, mean and covariance between them.
 * Returns the number of splits and the worst residual, relative to the
 * parent's own scale.
 */
export function checkTree(tree) {
  const { n, mx, my, a, b, c } = tree;
  let worst = 0;
  let splits = 0;
  for (let i = 1; i < tree.size / 2; i += 1) {
    const l = 2 * i;
    const r = l + 1;
    const wl = n[l] / n[i];
    const wr = n[r] / n[i];
    const dxl = mx[l] - mx[i];
    const dyl = my[l] - my[i];
    const dxr = mx[r] - mx[i];
    const dyr = my[r] - my[i];
    const scale = a[i] + c[i];
    const residual = Math.max(
      Math.abs(n[l] + n[r] - n[i]),
      Math.abs(wl * mx[l] + wr * mx[r] - mx[i]) / Math.sqrt(scale),
      Math.abs(wl * my[l] + wr * my[r] - my[i]) / Math.sqrt(scale),
      Math.abs(wl * (a[l] + dxl * dxl) + wr * (a[r] + dxr * dxr) - a[i]) / scale,
      Math.abs(wl * (b[l] + dxl * dyl) + wr * (b[r] + dxr * dyr) - b[i]) / scale,
      Math.abs(wl * (c[l] + dyl * dyl) + wr * (c[r] + dyr * dyr) - c[i]) / scale,
    );
    if (residual > worst) worst = residual;
    splits += 1;
  }
  return { splits, worst };
}

// Eigen-decomposition of [[a, b], [b, c]]: the two variances along the
// principal axes, and the angle of the major one.
export function eig(a, b, c) {
  const mean = (a + c) / 2;
  const d = Math.sqrt(((a - c) / 2) ** 2 + b * b);
  return { l1: mean + d, l2: Math.max(mean - d, 1e-9), theta: 0.5 * Math.atan2(2 * b, a - c) };
}

// The covariance of a splat with standard deviations s1 and s2, turned by theta:
// R S S^T R^T.
export function covariance(s1, s2, theta) {
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  return {
    a: s1 * s1 * cos * cos + s2 * s2 * sin * sin,
    b: (s1 * s1 - s2 * s2) * sin * cos,
    c: s1 * s1 * sin * sin + s2 * s2 * cos * cos,
  };
}
