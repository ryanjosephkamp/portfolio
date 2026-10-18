// The splat shaders. One 3D Gaussian per instance: its covariance R S S^T R^T is
// carried through the camera's turn and the perspective's Jacobian to a 2D
// covariance on the screen, whose two eigenvectors set the axes of a quad that
// covers three standard deviations. The fragment shader evaluates the Gaussian and
// writes premultiplied color, blended back to front.
//
// The same shader also draws the debug passes (depth, sort rank, opacity, overdraw),
// the three other views of a splat (an ellipsoid, its 1-sigma ring, its center), a
// flight from one cloud to another, moving parts, a cut plane, and the exploded frame.

export const SPLAT_VS = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
precision highp usampler2D;

uniform usampler2D uA;
uniform usampler2D uB;
uniform mat4 uView;
uniform vec2 uFocal;
uniform vec2 uViewport;
uniform vec2 uShift;
uniform float uMorph;
uniform float uSpread;
uniform float uArc;
uniform int uCount;
uniform float uSplatScale;
uniform float uExplode;
uniform vec3 uFrozenEye;
uniform vec3 uFrozenFwd;
uniform float uSlabs;
uniform float uStackCenter;
uniform float uStackLen;
uniform vec4 uPartRow0[16];
uniform vec4 uPartRow1[16];
uniform vec4 uPartRow2[16];
uniform vec4 uPartQuat[16];
uniform int uUseParts;
uniform int uPartTint;
uniform int uSelected;
uniform float uDim;
uniform vec4 uCut;
uniform vec4 uRep;
uniform int uPass;
uniform vec2 uDepthRange;
uniform float uFade;
uniform float uLift;
uniform vec3 uLiftPos;
uniform float uLiftScale;
uniform int uSelPass;

in uint aIndex;

out vec4 vColor;
out vec2 vCorner;
out vec2 vExtent;
out vec2 vSigma;
flat out int vSel;

const float K = 3.0;

float hash01(uint i) {
  uint x = i ^ 0x9e3779b9u;
  x = (x ^ (x >> 16u)) * 0x21f0aaadu;
  x = (x ^ (x >> 15u)) * 0x735a2d97u;
  x = x ^ (x >> 15u);
  return float(x) / 4294967296.0;
}

vec3 turbo(float t) {
  t = clamp(t, 0.0, 1.0);
  vec4 v4 = vec4(1.0, t, t * t, t * t * t);
  vec2 v2 = v4.zw * v4.z;
  return clamp(vec3(
    dot(v4, vec4(0.13572138, 4.61539260, -42.66032258, 132.13108234)) + dot(v2, vec2(-152.94239396, 59.28637943)),
    dot(v4, vec4(0.09140261, 2.19418839, 4.84296658, -14.18503333)) + dot(v2, vec2(4.27729857, 2.82956604)),
    dot(v4, vec4(0.10667330, 12.64194608, -60.58204836, 110.36276771)) + dot(v2, vec2(-89.90310912, 27.34824973))
  ), 0.0, 1.0);
}

const vec3 PART_COLORS[6] = vec3[6](
  vec3(0.45, 0.47, 0.5), vec3(1.0, 0.83, 0.0), vec3(0.3, 0.75, 1.0),
  vec3(1.0, 0.42, 0.3), vec3(0.55, 0.9, 0.45), vec3(0.85, 0.5, 1.0)
);

void unpack(usampler2D t, uint i, out vec3 p, out vec4 c, out vec3 s, out vec4 q, out float aux) {
  ivec2 xy = ivec2(int((i & 1023u) * 2u), int(i >> 10u));
  uvec4 a = texelFetch(t, xy, 0);
  uvec4 b = texelFetch(t, xy + ivec2(1, 0), 0);
  p = uintBitsToFloat(a.xyz);
  c = vec4(float(a.w & 255u), float((a.w >> 8u) & 255u), float((a.w >> 16u) & 255u), float(a.w >> 24u)) / 255.0;
  vec2 h0 = unpackHalf2x16(b.x);
  vec2 h1 = unpackHalf2x16(b.y);
  vec2 h2 = unpackHalf2x16(b.z);
  vec2 h3 = unpackHalf2x16(b.w);
  s = vec3(h0.x, h0.y, h1.x);
  q = vec4(h1.y, h2.x, h2.y, h3.x);
  aux = h3.y;
}

vec4 qmul(vec4 a, vec4 b) {
  return vec4(
    a.w * b.x + b.w * a.x + a.y * b.z - a.z * b.y,
    a.w * b.y + b.w * a.y + a.z * b.x - a.x * b.z,
    a.w * b.z + b.w * a.z + a.x * b.y - a.y * b.x,
    a.w * b.w - dot(a.xyz, b.xyz));
}

mat3 quatMat(vec4 q) {
  float x = q.x, y = q.y, z = q.z, w = q.w;
  return mat3(
    1.0 - 2.0 * (y * y + z * z), 2.0 * (x * y + w * z), 2.0 * (x * z - w * y),
    2.0 * (x * y - w * z), 1.0 - 2.0 * (x * x + z * z), 2.0 * (y * z + w * x),
    2.0 * (x * z + w * y), 2.0 * (y * z - w * x), 1.0 - 2.0 * (x * x + y * y));
}

void cull() {
  gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
  vColor = vec4(0.0);
}

void main() {
  uint i = aIndex;
  vec3 p; vec4 c; vec3 s; vec4 q; float aux;
  unpack(uB, i, p, c, s, q, aux);
  int part = int(aux + 0.5);
  if (uUseParts == 1 && part > 0 && part < 16) {
    vec4 r0 = uPartRow0[part];
    vec4 r1 = uPartRow1[part];
    vec4 r2 = uPartRow2[part];
    p = vec3(dot(r0.xyz, p) + r0.w, dot(r1.xyz, p) + r1.w, dot(r2.xyz, p) + r2.w);
    q = qmul(uPartQuat[part], q);
  }
  if (uPartTint == 1) c.rgb = mix(c.rgb, PART_COLORS[min(part, 5)], 0.85);
  if (uMorph < 1.0) {
    vec3 pa; vec4 ca; vec3 sa; vec4 qa; float auxa;
    unpack(uA, i, pa, ca, sa, qa, auxa);
    float h = hash01(i);
    float t = clamp((uMorph - h * uSpread) / (1.0 - uSpread), 0.0, 1.0);
    float e = t * t * (3.0 - 2.0 * t);
    float arc = sin(3.14159265 * e);
    vec3 dir = vec3(hash01(i * 3u + 11u), hash01(i * 7u + 5u), hash01(i * 13u + 3u)) - 0.5;
    dir = normalize(dir + vec3(0.0, 0.25, 0.0));
    p = mix(pa, p, e) + dir * arc * uArc;
    if (dot(qa, q) < 0.0) qa = -qa;
    q = normalize(mix(qa, q, e));
    s = mix(sa, s, e) * (1.0 - 0.5 * arc);
    c = mix(ca, c, e);
  }
  if (dot(uCut.xyz, uCut.xyz) > 0.0 && dot(uCut.xyz, p) > uCut.w) { cull(); return; }
  bool isSel = int(i) == uSelected;
  if (isSel && uLift > 0.0) {
    // The picked splat drawn once more on top, lifted out and magnified.
    if (uSelPass == 0 && uLift > 0.02) { cull(); return; }
    p = mix(p, uLiftPos, uLift);
    s *= mix(1.0, uLiftScale, uLift);
  }

  float rank = (float(gl_InstanceID) + 0.5) / float(uCount);
  if (uExplode > 0.0) {
    vec3 v = p - uFrozenEye;
    float d = dot(v, uFrozenFwd);
    float slab = floor(rank * uSlabs);
    float sd = uStackCenter + (0.5 - (slab + 0.5) / uSlabs) * uStackLen;
    float k = mix(d, sd, uExplode) / max(d, 1e-4);
    p = uFrozenEye + v * k;
    s *= k;
  }

  vec4 cam = uView * vec4(p, 1.0);
  float z = cam.z;
  if (z < 0.01) { cull(); return; }
  vec2 ndc = vec2(uFocal.x * cam.x / z, uFocal.y * cam.y / z) / (0.5 * uViewport) + uShift;
  if (abs(ndc.x) > 1.4 || abs(ndc.y) > 1.4) { cull(); return; }

  mat3 R = quatMat(q);
  vec3 ss = s * uSplatScale;
  mat3 M = mat3(R[0] * ss.x, R[1] * ss.y, R[2] * ss.z);
  mat3 Sigma = M * transpose(M);
  mat3 W = mat3(uView);
  mat3 J = mat3(
    uFocal.x / z, 0.0, 0.0,
    0.0, uFocal.y / z, 0.0,
    -uFocal.x * cam.x / (z * z), -uFocal.y * cam.y / (z * z), 0.0);
  mat3 T = J * W;
  mat3 cov = T * Sigma * transpose(T);
  float a = cov[0][0] + 0.3;
  float b = cov[0][1];
  float d = cov[1][1] + 0.3;
  float mid = 0.5 * (a + d);
  float rad = length(vec2(0.5 * (a - d), b));
  float l1 = mid + rad;
  float l2 = max(mid - rad, 0.05);
  vec2 v1 = abs(b) < 1e-12 ? (a >= d ? vec2(1.0, 0.0) : vec2(0.0, 1.0)) : normalize(vec2(b, l1 - a));
  vec2 v2 = vec2(-v1.y, v1.x);
  vec2 sig = vec2(sqrt(l1), sqrt(l2));

  vec4 col = c;
  if (uPass == 1) col.rgb = turbo((z - uDepthRange.x) / max(uDepthRange.y - uDepthRange.x, 1e-6));
  else if (uPass == 2) col.rgb = turbo(rank);
  else if (uPass == 3) col.rgb = vec3(c.a);
  vSel = isSel ? 1 : 0;
  if (uSelected >= 0 && vSel == 0) {
    // Everything but the picked splat steps back: grayer, darker, thinner.
    float k = 1.0 - uDim;
    col.rgb = mix(col.rgb, vec3(dot(col.rgb, vec3(0.3, 0.59, 0.11))), 0.8 * k) * (1.0 - 0.72 * k);
    col.a *= 1.0 - 0.45 * k;
  }
  col.a *= uFade;
  if (col.a < 1.0 / 255.0 && uRep.z + uRep.w == 0.0) { cull(); return; }

  // The quad reaches only as far as the splat can still be seen: where its alpha,
  // a * exp(-r^2 / 2), falls to 1/255, which for a faint splat is well inside 3 sigma.
  // (The ellipsoid, ring, and center views, and the picked splat, keep the full 3 sigma.)
  float reach = K;
  if (uRep.y + uRep.z + uRep.w == 0.0 && vSel == 0) reach = min(K, sqrt(max(0.0, 2.0 * log(255.0 * col.a))));
  vec2 ext = sig * reach;
  float dotR = 2.6 * max(uRep.w, float(vSel));
  ext = max(ext, vec2(dotR + 1.0));
  ext = min(ext, vec2(2048.0));
  vec2 corner = vec2(float(gl_VertexID & 1), float((gl_VertexID >> 1) & 1)) * 2.0 - 1.0;
  vec2 off = corner.x * ext.x * v1 + corner.y * ext.y * v2;
  gl_Position = vec4(ndc + off / (0.5 * uViewport), 0.0, 1.0);
  vColor = col;
  vCorner = corner;
  vExtent = ext;
  vSigma = sig;
}
`;

export const SPLAT_FS = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
uniform vec4 uRep;
uniform int uPass;
uniform float uCountStep;
in vec4 vColor;
in vec2 vCorner;
in vec2 vExtent;
in vec2 vSigma;
flat in int vSel;
out vec4 frag;

void main() {
  vec2 px = vCorner * vExtent;
  vec2 sg = px / vSigma;
  float r2 = dot(sg, sg);
  if (uPass == 4) {
    float g = exp(-0.5 * r2) * vColor.a;
    if (g < 1.0 / 255.0) discard;
    frag = vec4(uCountStep);
    return;
  }
  float r = sqrt(r2);
  float fw = max(fwidth(r), 1e-4);
  vec3 rgb = vColor.rgb;
  float alpha = 0.0;
  vec3 outc = vec3(0.0);

  if (uRep.x > 0.0) {
    float a = exp(-0.5 * r2) * vColor.a;
    outc += uRep.x * rgb * a;
    alpha += uRep.x * a;
  }
  if (uRep.y > 0.0) {
    // Solid at two standard deviations, lit as if it were a sphere in its own frame.
    const float E = 2.0;
    float inside = 1.0 - smoothstep(E - fw, E, r);
    float n = sqrt(max(0.0, 1.0 - (r / E) * (r / E)));
    float lit = 0.28 + 0.72 * n + 0.18 * pow(n, 12.0);
    float a = inside * min(1.0, vColor.a * 1.6);
    outc += uRep.y * rgb * lit * a;
    alpha += uRep.y * a;
  }
  if (uRep.z > 0.0) {
    float ring = 1.0 - smoothstep(0.35 * fw, 1.25 * fw, abs(r - 1.0));
    float a = ring * mix(0.35, 1.0, vColor.a);
    outc += uRep.z * mix(rgb, vec3(1.0), 0.25) * a;
    alpha += uRep.z * a;
  }
  float pr = length(px);
  if (uRep.w > 0.0) {
    float a = (1.0 - smoothstep(1.0, 2.0, pr)) * mix(0.5, 1.0, vColor.a);
    outc += uRep.w * rgb * a;
    alpha += uRep.w * a;
  }
  if (vSel == 1) {
    // The picked splat: its own color, with its 1, 2 and 3 sigma rings in signal yellow.
    vec3 sel = vec3(1.0, 0.83, 0.0);
    float ring = 0.0;
    for (int k = 1; k <= 3; k++) ring = max(ring, 1.0 - smoothstep(0.4 * fw, 1.4 * fw, abs(r - float(k))));
    float dotc = 1.0 - smoothstep(1.2, 2.2, pr);
    float a = max(ring, dotc);
    outc = mix(outc, sel * a, a);
    alpha = max(alpha, a);
  }
  if (alpha < 1.0 / 255.0) discard;
  frag = vec4(outc, min(alpha, 1.0));
}
`;

export const QUAD_VS = /* glsl */ `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(float(gl_VertexID & 1), float((gl_VertexID >> 1) & 1));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

// Overdraw: how many splats touched each pixel, through turbo.
export const OVERDRAW_FS = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform float uMax;
uniform float uScale;
in vec2 vUv;
out vec4 frag;
vec3 turbo(float t) {
  t = clamp(t, 0.0, 1.0);
  vec4 v4 = vec4(1.0, t, t * t, t * t * t);
  vec2 v2 = v4.zw * v4.z;
  return clamp(vec3(
    dot(v4, vec4(0.13572138, 4.61539260, -42.66032258, 132.13108234)) + dot(v2, vec2(-152.94239396, 59.28637943)),
    dot(v4, vec4(0.09140261, 2.19418839, 4.84296658, -14.18503333)) + dot(v2, vec2(4.27729857, 2.82956604)),
    dot(v4, vec4(0.10667330, 12.64194608, -60.58204836, 110.36276771)) + dot(v2, vec2(-89.90310912, 27.34824973))
  ), 0.0, 1.0);
}
void main() {
  float n = texture(uTex, vUv).r * uScale;
  if (n < 0.5) discard;
  float t = n / uMax;
  frag = vec4(turbo(0.08 + 0.92 * t), 1.0);
}
`;
