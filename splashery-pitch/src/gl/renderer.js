// WebGL2 splat renderer. Two splat textures (the cloud a flight leaves, and the one
// it reaches or rests in), one instanced quad per splat in the order the sort
// worker returns, premultiplied blending back to front.
import { SPLAT_VS, SPLAT_FS, QUAD_VS, OVERDRAW_FS } from "./shaders.js";
import { ROW_SPLATS } from "../lib/splats.js";

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

function program(gl, vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(p, i);
    const name = info.name.replace(/\[0\]$/, "");
    u[name] = gl.getUniformLocation(p, info.name);
  }
  return { p, u };
}

const IDENT_ROWS = (() => {
  const r0 = new Float32Array(64);
  const r1 = new Float32Array(64);
  const r2 = new Float32Array(64);
  const q = new Float32Array(64);
  for (let i = 0; i < 16; i++) {
    r0[i * 4] = 1;
    r1[i * 4 + 1] = 1;
    r2[i * 4 + 2] = 1;
    q[i * 4 + 3] = 1;
  }
  return { r0, r1, r2, q };
})();

export class SplatRenderer {
  constructor(canvas) {
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: true,
      premultipliedAlpha: true,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
    });
    if (!gl) throw new Error("WebGL2 is not available.");
    this.gl = gl;
    this.canvas = canvas;
    this.splat = program(gl, SPLAT_VS, SPLAT_FS);
    this.over = program(gl, QUAD_VS, OVERDRAW_FS);
    this.tex = { a: this.makeTex(), b: this.makeTex(), nextA: this.makeTex(), nextB: this.makeTex() };
    this.size = { a: 0, b: 0, nextA: 0, nextB: 0 };
    this.orderBuf = gl.createBuffer();
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.orderBuf);
    const loc = gl.getAttribLocation(this.splat.p, "aIndex");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribIPointer(loc, 1, gl.UNSIGNED_INT, 4, 0);
    gl.vertexAttribDivisor(loc, 1);
    gl.bindVertexArray(null);
    this.emptyVao = gl.createVertexArray();
    // A one-splat order for drawing the picked splat on top.
    this.selBuf = gl.createBuffer();
    this.selVao = gl.createVertexArray();
    gl.bindVertexArray(this.selVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.selBuf);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribIPointer(loc, 1, gl.UNSIGNED_INT, 4, 0);
    gl.vertexAttribDivisor(loc, 1);
    gl.bindVertexArray(null);
    this.selIndex = -1;
    this.orderCount = 0;
    this.fbo = null;
    // Overdraw counts above 255 need a float target.
    this.floatTarget = !!(gl.getExtension("EXT_color_buffer_float") || gl.getExtension("EXT_color_buffer_half_float")); // prettier-ignore
  }

  makeTex() {
    const gl = this.gl;
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32UI, 2, 1, 0, gl.RGBA_INTEGER, gl.UNSIGNED_INT, new Uint32Array(8)); // prettier-ignore
    return t;
  }

  // Uploads packed splats (8 uint32 per splat) into texture slot "a" or "b".
  upload(slot, u32, count) {
    const gl = this.gl;
    const rows = Math.max(1, Math.ceil(count / ROW_SPLATS));
    const need = rows * ROW_SPLATS * 8;
    let data = u32;
    if (u32.length < need) {
      data = new Uint32Array(need);
      data.set(u32.subarray(0, Math.min(u32.length, need)));
    } else if (u32.length > need) data = u32.subarray(0, need);
    gl.bindTexture(gl.TEXTURE_2D, this.tex[slot]);
    if (this.size[slot] === rows)
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, ROW_SPLATS * 2, rows, gl.RGBA_INTEGER, gl.UNSIGNED_INT, data); // prettier-ignore
    else
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32UI, ROW_SPLATS * 2, rows, 0, gl.RGBA_INTEGER, gl.UNSIGNED_INT, data); // prettier-ignore
    this.size[slot] = rows;
  }

  // Makes the uploaded "next" textures the drawn ones.
  commit(flying) {
    const t = this.tex;
    const z = this.size;
    [t.b, t.nextB] = [t.nextB, t.b];
    [z.b, z.nextB] = [z.nextB, z.b];
    if (flying) {
      [t.a, t.nextA] = [t.nextA, t.a];
      [z.a, z.nextA] = [z.nextA, z.a];
    }
  }

  setOrder(order) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.orderBuf);
    gl.bufferData(gl.ARRAY_BUFFER, order, gl.DYNAMIC_DRAW);
    this.orderCount = order.length;
  }

  resize(w, h) {
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  releaseFbo() {
    if (!this.fbo) return;
    this.gl.deleteFramebuffer(this.fbo.f);
    this.gl.deleteTexture(this.fbo.t);
    this.fbo = null;
  }

  ensureFbo(w, h) {
    const gl = this.gl;
    if (this.fbo && this.fbo.w === w && this.fbo.h === h) return this.fbo;
    if (this.fbo) {
      gl.deleteFramebuffer(this.fbo.f);
      gl.deleteTexture(this.fbo.t);
    }
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    if (this.floatTarget) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null); // prettier-ignore
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const f = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.fbo = { f, t, w, h };
    return this.fbo;
  }

  // s: the frame's state (see Stage.frameState).
  draw(s) {
    const gl = this.gl;
    const W = this.canvas.width;
    const H = this.canvas.height;
    gl.viewport(0, 0, W, H);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const n = Math.min(s.drawCount ?? this.orderCount, this.orderCount);
    if (!n) return;
    const overdraw = s.pass === 4;
    if (overdraw) {
      // Counted at half resolution: cheap to read back, and splats are wider than pixels.
      const fb = this.ensureFbo(Math.ceil(W / 2), Math.ceil(H / 2));
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb.f);
      gl.viewport(0, 0, fb.w, fb.h);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    const { p, u } = this.splat;
    gl.useProgram(p);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex.a);
    gl.uniform1i(u.uA, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.tex.b);
    gl.uniform1i(u.uB, 1);
    gl.uniformMatrix4fv(u.uView, false, s.view);
    gl.uniform2f(u.uFocal, s.focal, s.focal);
    gl.uniform2f(u.uViewport, W, H);
    gl.uniform2f(u.uShift, s.shift[0], s.shift[1]);
    gl.uniform1f(u.uMorph, s.morph);
    gl.uniform1f(u.uSpread, s.spread);
    gl.uniform1f(u.uArc, s.arc);
    gl.uniform1i(u.uCount, Math.max(1, this.orderCount));
    gl.uniform1f(u.uSplatScale, s.splatScale);
    gl.uniform1f(u.uExplode, s.explode);
    gl.uniform3fv(u.uFrozenEye, s.frozenEye);
    gl.uniform3fv(u.uFrozenFwd, s.frozenFwd);
    gl.uniform1f(u.uSlabs, s.slabs);
    gl.uniform1f(u.uStackCenter, s.stackCenter);
    gl.uniform1f(u.uStackLen, s.stackLen);
    const parts = s.parts || IDENT_ROWS;
    gl.uniform4fv(u.uPartRow0, parts.r0);
    gl.uniform4fv(u.uPartRow1, parts.r1);
    gl.uniform4fv(u.uPartRow2, parts.r2);
    gl.uniform4fv(u.uPartQuat, parts.q);
    gl.uniform1i(u.uUseParts, s.parts ? 1 : 0);
    gl.uniform1i(u.uPartTint, s.partTint ? 1 : 0);
    gl.uniform1i(u.uSelected, s.selected);
    gl.uniform1f(u.uDim, s.dim);
    gl.uniform4fv(u.uCut, s.cut);
    gl.uniform4fv(u.uRep, s.rep);
    gl.uniform1i(u.uPass, s.pass);
    gl.uniform1f(u.uCountStep, this.floatTarget ? 1 : 1 / 255);
    gl.uniform2f(u.uDepthRange, s.depthRange[0], s.depthRange[1]);
    gl.uniform1f(u.uFade, s.fade);
    gl.uniform1f(u.uLift, s.lift || 0);
    gl.uniform3fv(u.uLiftPos, s.liftPos || [0, 0, 0]);
    gl.uniform1f(u.uLiftScale, s.liftScale || 1);
    gl.uniform1i(u.uSelPass, 0);
    gl.enable(gl.BLEND);
    if (overdraw) gl.blendFunc(gl.ONE, gl.ONE);
    else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindVertexArray(this.vao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, n);
    gl.bindVertexArray(null);
    if (s.selected >= 0 && (s.lift || 0) > 0.02 && !overdraw) {
      if (this.selIndex !== s.selected) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.selBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Uint32Array([s.selected]), gl.DYNAMIC_DRAW);
        this.selIndex = s.selected;
      }
      gl.uniform1i(u.uSelPass, 1);
      gl.bindVertexArray(this.selVao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, 1);
      gl.bindVertexArray(null);
    }
    if (overdraw) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, W, H);
      gl.useProgram(this.over.p);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.fbo.t);
      gl.uniform1i(this.over.u.uTex, 0);
      gl.uniform1f(this.over.u.uMax, s.overdrawMax || 64);
      gl.uniform1f(this.over.u.uScale, this.floatTarget ? 1 : 255);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindVertexArray(this.emptyVao);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.bindVertexArray(null);
    }
  }

  // The most and the mean splats per covered pixel, read back after an overdraw pass.
  overdrawStats() {
    if (!this.fbo) return null;
    const gl = this.gl;
    const { w, h } = this.fbo;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo.f);
    const px = this.floatTarget ? new Float32Array(w * h * 4) : new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, this.floatTarget ? gl.FLOAT : gl.UNSIGNED_BYTE, px);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    let max = 0;
    let sum = 0;
    let n = 0;
    for (let i = 0; i < px.length; i += 4) {
      const c = Math.round(px[i]);
      if (c < 1) continue;
      n++;
      sum += c;
      if (c > max) max = c;
    }
    return { max, mean: n ? sum / n : 0, saturated: !this.floatTarget && max >= 255 };
  }
}
