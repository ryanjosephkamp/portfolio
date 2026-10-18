// Detail: how much the page asks of a device. Four tiers, from the easiest to run to the
// hardest. Auto picks one from what the browser says about the device (never Max), and
// steps down a tier if frames still come too slowly; a visitor can pick any tier, and the
// choice is kept in this browser.
//
// Pixels are a budget for the stage's canvas, not a ratio: the same tier costs about the
// same on a phone's small stage and a desktop's large one. The chest's budgets are
// Splashery's own tiers for generated toys (60k, 140k, 200k, 280k).

export const TIERS = {
  1: { id: 1, name: "Low", pixels: 0.45e6, grape: "lite", chest: 60000, walnut: 60000, spin: false }, // prettier-ignore
  2: { id: 2, name: "Mid", pixels: 1.1e6, grape: "full", chest: 140000, walnut: 160000, spin: true }, // prettier-ignore
  3: { id: 3, name: "High", pixels: 2.0e6, grape: "full", chest: 200000, walnut: 240000, spin: true }, // prettier-ignore
  4: { id: 4, name: "Max", pixels: Infinity, grape: "full", chest: 280000, walnut: 600000, spin: true }, // prettier-ignore
};

const KEY = "splashery-pitch-detail";

// "auto", or a tier the visitor picked.
export function savedMode() {
  try {
    const v = localStorage.getItem(KEY);
    return v && TIERS[v] ? Number(v) : "auto";
  } catch {
    return "auto";
  }
}

export function saveMode(mode) {
  try {
    if (mode === "auto") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, String(mode));
  } catch {}
}

// The renderer's name, when the browser tells it.
export function rendererName(gl) {
  try {
    const x = gl.getExtension("WEBGL_debug_renderer_info");
    return String(x ? gl.getParameter(x.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
  } catch {
    return "";
  }
}

// Auto's pick, with the reason in a few words.
export function detect(gl) {
  const r = rendererName(gl);
  const mem = navigator.deviceMemory; // Chromium only, rounded, at most 8
  const cores = navigator.hardwareConcurrency;
  const coarse = matchMedia("(pointer: coarse)").matches;
  if (/SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(r))
    return { tier: 1, why: "drawing in software", software: true };
  if ((mem && mem <= 2) || (cores && cores <= 2)) return { tier: 1, why: "a small device" };
  if (coarse) return { tier: 2, why: "a phone or tablet" };
  const modestGpu = /Intel.*(HD|UHD) Graphics|Mali-[GT]?\d|Adreno|PowerVR|Mesa Intel/i.test(r);
  if (modestGpu || (mem && mem <= 4) || (cores && cores <= 4)) return { tier: 2, why: "modest graphics" };
  if (!r && !mem && !cores) return { tier: 2, why: "an unknown device" };
  return { tier: 3, why: "strong graphics" };
}

// The canvas's pixel ratio for a tier and a stage of cssW x cssH. Drawing in software
// (no graphics chip at all), Low goes further still: 0.2 megapixels.
export function pixelRatio(tier, cssW, cssH, software = false) {
  const native = Math.min(window.devicePixelRatio || 1, 3);
  const t = TIERS[tier];
  if (!Number.isFinite(t.pixels)) return native;
  const budget = software && tier === 1 ? 0.2e6 : t.pixels;
  const r = Math.sqrt(budget / Math.max(1, cssW * cssH));
  return Math.max(0.5, Math.min(native, r));
}
