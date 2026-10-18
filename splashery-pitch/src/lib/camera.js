// An orbit camera that looks along +z in its own space, with y up. The view matrix
// is column-major, for WebGL.
import { sub, norm, cross, dot } from "./math.js";

export class OrbitCamera {
  constructor() {
    this.target = [0, 0, 0];
    this.yaw = 0; // radians, about +y
    this.pitch = 0.15; // radians, positive looks down on the object
    this.zoom = 1.15; // distance as a multiple of the distance that fits a unit sphere
    this.fitD = 3;
    this.fov = 0.6; // vertical, radians
  }

  get distance() {
    return this.zoom * this.fitD;
  }
  set distance(v) {
    this.zoom = v / this.fitD;
  }

  // The distance at which a sphere of radius 1 just fits the narrower side.
  fit(aspect) {
    const fy = this.fov;
    const fx = 2 * Math.atan(Math.tan(fy / 2) * aspect);
    this.fitD = 1 / Math.sin(Math.min(fx, fy) / 2);
  }

  eye() {
    const cp = Math.cos(this.pitch);
    return [
      this.target[0] + this.distance * cp * Math.sin(this.yaw),
      this.target[1] + this.distance * Math.sin(this.pitch),
      this.target[2] - this.distance * cp * Math.cos(this.yaw),
    ];
  }

  // The view matrix and the frame's basis.
  view() {
    const e = this.eye();
    const f = norm(sub(this.target, e));
    let r = cross([0, 1, 0], f);
    if (Math.hypot(...r) < 1e-6) r = [1, 0, 0];
    r = norm(r);
    const u = cross(f, r);
    const m = new Float32Array(16);
    m[0] = r[0];
    m[4] = r[1];
    m[8] = r[2];
    m[12] = -dot(r, e);
    m[1] = u[0];
    m[5] = u[1];
    m[9] = u[2];
    m[13] = -dot(u, e);
    m[2] = f[0];
    m[6] = f[1];
    m[10] = f[2];
    m[14] = -dot(f, e);
    m[15] = 1;
    return { m, eye: e, fwd: f, right: r, up: u };
  }

  // Focal length in pixels for a viewport height.
  focal(h) {
    return h / 2 / Math.tan(this.fov / 2);
  }
}

// Projects a world point to canvas pixels (origin top left), or null behind the camera.
export function project(v, focal, w, h, shift, p) {
  const m = v.m;
  const x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12];
  const y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13];
  const z = m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14];
  if (z < 0.01) return null;
  const nx = (focal * x) / z / (w / 2) + shift[0];
  const ny = (focal * y) / z / (h / 2) + shift[1];
  return [((nx + 1) / 2) * w, ((1 - ny) / 2) * h, z];
}
