import "@fontsource-variable/geist/wght.css";
import "@fontsource-variable/geist-mono/wght.css";
import { Stage, fmt } from "./stage.js";
import { clamp, lerp, easeInOut, easeOut, turbo, covariance } from "./lib/math.js";
import { project } from "./lib/camera.js";
import { LiveProgram, PROGRAMS, programText, readProgram } from "./lib/equation.js";
import { packGPU } from "./lib/splats.js";
import { TIERS, detect, savedMode, saveMode } from "./lib/detail.js";
import objectsSource from "../vendor/splashery/src/packs/objects.js?raw";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)");
const PHONE = matchMedia("(max-width: 860px)");
const asset = (p) => new URL(p, document.baseURI).href;
const SPLASHERY = "https://ryanjosephkamp.github.io/splashery/";
const GRAPE_LINK = "#s=j.eyJhcHAiOiJzcGxhc2hlcnkiLCJ2ZXJzaW9uIjozLCJ0b3kiOnsia2luZCI6ImJ1aWx0aW4iLCJpZCI6ImdyYXBlIn19"; // prettier-ignore

const host = $("#stage");
let stage;
try {
  stage = new Stage(host);
} catch (err) {
  $("[data-hud=load]").textContent = "This page needs WebGL2 to draw its splats.";
  throw err;
}
window.stage = stage;

// Detail: Auto's pick for this device, or the tier the visitor chose (kept in this browser).
const detail = { mode: savedMode(), auto: detect(stage.gl.gl), tier: 2 };
detail.tier = detail.mode === "auto" ? detail.auto.tier : detail.mode;
stage.software = !!detail.auto.software;
stage.setDetail(detail.tier);
const tierNow = () => TIERS[detail.tier];

const hud = Object.fromEntries($$("[data-hud]").map((el) => [el.dataset.hud, el]));
const say = (key, text) => {
  if (hud[key] && hud[key].textContent !== text) hud[key].textContent = text;
};

// ---- Clouds ----------------------------------------------------------------------

const clouds = new Map(); // key -> { gpu, pos, parts, count, ... } as last built
const FILES = {
  grape: "grape.sog",
  chest: "chest · objects.js",
  eq: "splat program",
  walnut: "walnut.vol.gz",
};
let current = null; // key of the cloud at rest on the stage
let wanted = null;
let busy = false;
let live = null; // the running equation, when the program is on stage

// Loads (or builds) a cloud once: a second caller while it is on its way gets the same
// promise. (Opening the page partway down used to start the grape twice, and its two
// swaps to the full capture then left the data thread without a grape.)
const loading = new Map();
function load(key) {
  if (clouds.has(key)) return Promise.resolve(clouds.get(key));
  if (!loading.has(key))
    loading.set(
      key,
      loadNow(key).finally(() => loading.delete(key)),
    );
  return loading.get(key);
}

async function loadNow(key) {
  let c;
  if (key === "grape") {
    // The lighter capture first (1.3 MB, 100,000 splats), then the full one swaps in.
    say("load", "Fetching grape-lite.sog, 1.3 MB");
    c = await stage.data.call("sog", { key, url: asset("./assets/grape-lite.sog"), upright: true }); // prettier-ignore
    FILES.grape = "grape-lite.sog";
    if (tierNow().grape === "full") upgradeGrape().catch((err) => console.warn(err));
  } else if (key === "chest") {
    c = await stage.data.call("chest", { key, count: recipe.budget, wood: recipe.wood });
    c.made = { budget: recipe.budget, wood: recipe.wood };
    recipe.result = c;
  } else if (key === "walnut") {
    c = await stage.data.call("walnut", { key, url: asset("./assets/walnut.vol.gz"), budget: tierNow().walnut }); // prettier-ignore
  } else if (key === "eq") {
    const set = program.live.frame(0);
    await stage.data.call("raw", { key, set: cloneSet(set) });
    c = { gpu: program.live.gpu.slice(), pos: set.pos.slice(), parts: set.part.slice(), count: set.count }; // prettier-ignore
  }
  clouds.set(key, c);
  return c;
}

let upgraded = false;
async function upgradeGrape() {
  if (upgraded) return;
  upgraded = true;
  let full;
  try {
    full = await stage.data.call("sog", { key: "grape-full", url: asset("./assets/grape.sog"), upright: true }); // prettier-ignore
  } catch (err) {
    // The lite capture stays on stage; the page works without the full one.
    console.warn("The full grape did not load; keeping the lite one.", err);
    return;
  }
  const quiet = () =>
    !busy &&
    (current !== "grape" ||
      (!pull.frozen && !pull.auto && !pick.result && step !== "dial" && stage.drawCount == null));
  while (!quiet()) await new Promise((r) => setTimeout(r, 250));
  // Detail went to Low while it waited: keep the lite capture.
  if (tierNow().grape !== "full") {
    upgraded = false;
    return;
  }
  await stage.data.call("rename", { from: "grape-full", to: "grape" });
  clouds.set("grape", full);
  FILES.grape = "grape.sog";
  tree.ready = false;
  tree.building = null;
  if (current === "grape") await stage.setCloud(full);
}

// Back to the lite capture (for Low), when nothing on the stage depends on the full one.
async function downgradeGrape() {
  if (!upgraded) return;
  const quiet = () =>
    !busy &&
    (current !== "grape" ||
      (!pull.frozen && !pull.auto && !pick.result && step !== "dial" && stage.drawCount == null));
  while (!quiet()) await new Promise((r) => setTimeout(r, 250));
  if (tierNow().grape === "full") return;
  const lite = await stage.data.call("sog", { key: "grape", url: asset("./assets/grape-lite.sog"), upright: true }); // prettier-ignore
  upgraded = false;
  clouds.set("grape", lite);
  FILES.grape = "grape-lite.sog";
  tree.ready = false;
  tree.building = null;
  if (current === "grape") await stage.setCloud(lite);
}

function cloneSet(s) {
  return { count: s.count, pos: s.pos.slice(), scale: s.scale.slice(), rot: s.rot.slice(), color: s.color.slice(), part: s.part.slice() }; // prettier-ignore
}

// Flies the cloud to `key`. Calls made during a flight join it: every caller gets the
// same promise, which settles when the cloud reaches the latest key asked for, or
// rejects with the error that stopped it.
let run = null;
function goTo(key) {
  wanted = key;
  if (!run)
    run = drive().finally(() => {
      run = null;
    });
  return run;
}

async function drive() {
  busy = true;
  try {
    while (wanted !== current) {
      const target = wanted;
      const prev = current;
      await load(target);
      if (wanted !== target) continue;
      if (prev) leaveCloud(prev);
      if (!prev) {
        await stage.setCloud(clouds.get(target));
      } else {
        if (prev === "eq") await stage.data.call("raw", { key: "eq", set: cloneSet(program.live.set) }); // prettier-ignore
        const pair = await stage.data.call("pair", { from: prev, to: target });
        hudState = "flying";
        // Without a graphics chip a long flight is a slideshow; keep it short.
        await stage.fly(pair, { duration: stage.software ? 0.8 : 2.4, spread: 0.6, arc: 0.45 });
        await stage.setCloud(clouds.get(target));
      }
      current = target;
      hudState = null;
      host.classList.add("is-live");
      errBox.hidden = true;
      host.classList.remove("is-stopped");
      enterCloud(target);
    }
  } finally {
    busy = false;
    hudState = null;
  }
}

function leaveCloud(key) {
  if (key === "chest") {
    stage.clearParts();
    stage.partTint = false;
  }
  if (key === "eq") live = null;
  if (key === "walnut") stage.cut = [0, 0, 0, 0];
}

function enterCloud(key) {
  if (key === "chest") {
    applyLid(lid.angle);
    showBuilt();
    chestCatchUp();
  }
  if (key === "eq") live = program.live;
  if (key === "walnut") applyCut();
}

// ---- Steps -------------------------------------------------------------------------

const VIEWS = {
  hero: { yaw: -0.5, pitch: 0.2, zoom: 1.22, target: [0, 0, 0] },
  frame: { yaw: 0.9, pitch: 0.25, zoom: 1.22, target: [0, 0, 0] },
  splat: { yaw: 0.2, pitch: 0.12, zoom: 1.3, target: [0, 0, 0] },
  dial: { yaw: -0.8, pitch: 0.3, zoom: 1.25, target: [0, 0, 0] },
  // The chest's recipe puts its front (the latch) toward +z, so these look from +z.
  recipe: { yaw: Math.PI - 0.55, pitch: 0.45, zoom: 1.5, target: [0, 0, 0] },
  parts: { yaw: Math.PI - 0.4, pitch: 0.38, zoom: 1.55, target: [0, 0, 0] },
  equation: { yaw: 0.4, pitch: 0.55, zoom: 1.3, target: [0, 0, 0] },
  walnut: { yaw: 0.0, pitch: 0.12, zoom: 1.32, target: [0, 0, 0] },
  link: { yaw: -0.4, pitch: 0.2, zoom: 1.28, target: [0, 0, 0] },
  claims: { yaw: 0.3, pitch: 0.18, zoom: 1.35, target: [0, 0, 0] },
};
const CLOUD = { hero: "grape", frame: "grape", splat: "grape", dial: "grape", recipe: "chest", parts: "chest", equation: "eq", walnut: "walnut", link: "grape", claims: "grape" }; // prettier-ignore

let step = null;
const steps = {};

function setStep(id) {
  if (id === step) return;
  const prev = step;
  step = id;
  host.dataset.step = id;
  stage.wake();
  keyHint();
  for (const el of $$("[data-for]")) el.classList.toggle("is-on", el.dataset.for.split(" ").includes(id)); // prettier-ignore
  if (prev && steps[prev]?.leave) steps[prev].leave(id);
  const v = VIEWS[id];
  // A phone's stage is short, and its HUD and tools take more of it: stand back a little.
  if (v) stage.view({ ...v, zoom: v.zoom * (PHONE.matches ? 1.14 : 1), yaw: stage.cam.yaw + angleTo(stage.cam.yaw, v.yaw) }, 1.6); // prettier-ignore
  goTo(CLOUD[id]).catch((err) => fail(err, () => goTo(CLOUD[step])));
  steps[id]?.enter?.(prev);
}

// The nearest equivalent of `to` from `from`, so the camera never spins the long way.
const angleTo = (from, to) => Math.atan2(Math.sin(to - from), Math.cos(to - from));

function watchSteps() {
  const els = $$(".step");
  const pick = () => {
    const line = PHONE.matches ? innerHeight * 0.72 : innerHeight * 0.5;
    let best = els[0];
    for (const el of els) if (el.getBoundingClientRect().top < line) best = el;
    if (best) setStep(best.dataset.step);
  };
  addEventListener("scroll", pick, { passive: true });
  addEventListener("resize", pick);
  pick();
}

// ---- Hero: pull the frame apart ------------------------------------------------------

const pull = { u: 0, target: 0, active: false, used: false, frozen: false, teased: false, auto: null };

steps.hero = {
  enter() {
    stage.gesture = "pull";
  },
  leave() {
    stage.gesture = "orbit";
    pull.target = 0;
  },
};

stage.onPull = (phase, u) => {
  if (current !== "grape" || busy) return;
  if (phase === "start") {
    pull.active = true;
    pull.auto = null;
  } else if (phase === "move") {
    if (!pull.frozen) startFreeze();
    pull.target = clamp(u, -1, 1);
    if (!pull.used) {
      pull.used = true;
      $(".hud-hint").classList.add("is-used");
    }
  } else {
    pull.active = false;
    pull.target = 0;
  }
};

function startFreeze() {
  stage.freeze();
  pull.frozen = true;
  pull.base = { yaw: stage.cam.yaw, pitch: stage.cam.pitch, zoom: stage.cam.zoom };
  stage.camTween = null;
  host.classList.add("is-frozen");
}

function tickPull(dt) {
  if (pull.auto) {
    const a = pull.auto;
    a.t += dt;
    const k = a.t / a.dur;
    pull.target = k < 0.35 ? a.to * easeInOut(k / 0.35) : k < 0.7 ? a.to : a.to * (1 - easeInOut((k - 0.7) / 0.3)); // prettier-ignore
    if (!pull.frozen && Math.abs(pull.target) > 0.001) startFreeze();
    if (k >= 1) {
      pull.auto = null;
      pull.target = 0;
    }
  }
  if (!pull.frozen) return;
  const rate = pull.active ? 14 : 5;
  pull.u = lerp(pull.u, pull.target, 1 - Math.exp(-dt * rate));
  const a = Math.abs(pull.u);
  const e = stage.explode;
  e.amount = easeOut(Math.min(1, a * 1.15));
  const b = pull.base;
  stage.cam.yaw = b.yaw + pull.u * 1.05;
  stage.cam.pitch = b.pitch + a * 0.18;
  stage.cam.zoom = b.zoom * (1 + 0.75 * a);
  if (!pull.active && !pull.auto && a < 0.002) {
    stage.cam.yaw = b.yaw;
    stage.cam.pitch = b.pitch;
    stage.cam.zoom = b.zoom;
    pull.u = 0;
    pull.frozen = false;
    stage.thaw();
    host.classList.remove("is-frozen");
  }
}

$("[data-act=explode]").addEventListener("click", () => {
  pull.used = true;
  $(".hud-hint").classList.add("is-used");
  demoPull(0.9, 4.2);
});

function demoPull(to = 0.85, dur = 3.2) {
  if (current !== "grape") return;
  pull.auto = { t: 0, dur: REDUCED.matches ? 0.01 : dur, to };
}

// ---- One frame: blend and passes ------------------------------------------------------

const passLegend = {
  0: "",
  1: ["near", "far"],
  2: ["drawn first", "drawn last"],
  3: ["α = 0", "α = 1"],
  4: ["1 splat", "on a pixel"],
};

const blendPlay = { t: 0, on: false, done: false };

steps.frame = {
  enter() {
    stage.gesture = "orbit";
    const v = Number($("#blend").value);
    if (v < 1000) stage.drawCount = Math.round((v / 1000) * stage.count);
    // The first time: build the frame from the back, once, on its own.
    if (!blendPlay.done && !REDUCED.matches)
      setTimeout(() => {
        if (step === "frame" && !blendPlay.done && current === "grape") Object.assign(blendPlay, { t: 0, on: true, done: true }); // prettier-ignore
      }, 700);
  },
  leave() {
    stage.drawCount = null;
    stage.pass = 0;
    stage.spinOn = true;
    setRadio($$("[data-pass]"), "0", "pass");
    $("#blend").value = 1000;
    say("legend", "");
    $("#blend-out").textContent = "all";
  },
};

function setBlend(v) {
  $("#blend").value = String(v);
  const n = Math.round((v / 1000) * stage.count);
  stage.drawCount = v >= 1000 ? null : n;
  stage.spinOn = v >= 1000;
  $("#blend-out").textContent = v >= 1000 ? "all" : fmt(n);
}

function tickBlend(dt) {
  if (!blendPlay.on) return;
  if (step !== "frame") return void (blendPlay.on = false);
  blendPlay.t += dt / 3.4;
  const k = Math.min(1, blendPlay.t);
  setBlend(Math.round(1000 * (k < 0.08 ? 0 : easeInOut((k - 0.08) / 0.92))));
  if (k >= 1) blendPlay.on = false;
}

$("#blend").addEventListener("input", (e) => {
  blendPlay.on = false;
  const v = Number(e.target.value);
  const n = Math.round((v / 1000) * stage.count);
  stage.drawCount = v >= 1000 ? null : n;
  stage.spinOn = v >= 1000;
  $("#blend-out").textContent = v >= 1000 ? "all" : fmt(n);
});

for (const b of $$("[data-pass]"))
  b.addEventListener("click", () => {
    const p = Number(b.dataset.pass);
    stage.pass = p;
    setRadio($$("[data-pass]"), b.dataset.pass, "pass");
    drawLegend(p);
    if (p === 4) measureOverdraw();
  });

function drawLegend(p) {
  const el = hud.legend;
  el.textContent = "";
  const L = passLegend[p];
  if (!L) return;
  const ramp = document.createElement("span");
  ramp.className = "ramp";
  const stops = [];
  for (let i = 0; i <= 8; i++) {
    const c = p === 3 ? [i / 8, i / 8, i / 8] : turbo(p === 4 ? 0.08 + (0.92 * i) / 8 : i / 8);
    stops.push(`rgb(${c.map((x) => Math.round(x * 255)).join(" ")})`);
  }
  ramp.style.background = `linear-gradient(90deg, ${stops.join(", ")})`;
  const a = document.createElement("span");
  a.textContent = L[0];
  const b = document.createElement("span");
  b.textContent = L[1];
  b.dataset.hud = "legend-end";
  el.append(a, ramp, b);
}

// The overdraw pass counts splats per pixel; read the frame back once for its numbers.
function measureOverdraw() {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const r = stage.gl.overdrawStats();
      if (!r) return;
      stage.overdrawMax = Math.max(8, r.max);
      const end = $("[data-hud=legend-end]");
      if (end) end.textContent = `${fmt(r.max)}${r.saturated ? "+" : ""} splats on one pixel · ${fmt(r.mean)} on average`; // prettier-ignore
    }),
  );
}

function setRadio(buttons, value, key) {
  for (const b of buttons) b.setAttribute("aria-checked", String(b.dataset[key] === value));
}

// ---- One splat: the inspector ---------------------------------------------------------

const pick = { result: null, lift: 0, liftTarget: 0, busy: false };

steps.splat = {
  enter() {
    stage.gesture = "orbit";
    stage.shiftTarget = PHONE.matches ? [-0.3, 0.06] : [-0.22, 0.04];
    stage.onTap = (fx, fy) => pickAt(fx, fy);
    setTimeout(() => {
      if (step === "splat" && !pick.result && current === "grape") pickBest();
    }, 900);
  },
  leave() {
    stage.onTap = null;
    stage.shiftTarget = [0, 0.04];
    clearPick();
  },
};

async function pickAt(fx, fy) {
  if (current !== "grape" || pick.busy) return;
  pick.busy = true;
  try {
    const r = await stage.pick("grape", fx, fy);
    if (!r) return;
    pick.result = r;
    stage.selected = r.index;
    stage.dimTarget = 0;
    stage.spinOn = false;
    pick.liftTarget = 1;
    showPick(r);
  } finally {
    pick.busy = false;
  }
}

// Picks the splat with the largest share among a few pixels near the middle, so the
// first one shown is one that matters to the picture.
async function pickBest() {
  if (current !== "grape" || pick.busy) return;
  pick.busy = true;
  let best = null;
  try {
    for (const [fx, fy] of [[0.5, 0.45], [0.46, 0.52], [0.54, 0.4], [0.42, 0.42], [0.56, 0.55], [0.5, 0.6]]) {
      const r = await stage.pick("grape", fx, fy);
      if (r && (!best || r.share * r.opacity > best.share * best.opacity)) best = r;
    }
  } finally {
    pick.busy = false;
  }
  if (best && step === "splat") {
    pick.result = best;
    stage.selected = best.index;
    stage.dimTarget = 0;
    stage.spinOn = false;
    pick.liftTarget = 1;
    showPick(best);
  }
}

function clearPick() {
  pick.result = null;
  pick.liftTarget = 0;
  stage.selected = -1;
  stage.dimTarget = 1;
  stage.spinOn = true;
  stage.lift = 0;
}

$("[data-act=pick-again]").addEventListener("click", () => pickAt(0.3 + Math.random() * 0.4, 0.3 + Math.random() * 0.4)); // prettier-ignore
$("[data-act=pick-out]").addEventListener("click", clearPick);

// On a phone the readout moves under the stage, into the step's text.
const panel = $("#panel");
const placePanel = () => (PHONE.matches ? $("#panel-slot") : host).append(panel);
PHONE.addEventListener("change", placePanel);
placePanel();

const pickEls = Object.fromEntries($$("[data-pick]").map((el) => [el.dataset.pick, el]));
const num = (v, d = 4) => (Math.abs(v) < 1e-12 ? "0" : v.toFixed(d));

function showPick(r) {
  pickEls.title.textContent = `Splat ${fmt(r.index)}`;
  pickEls.of.textContent = `of ${fmt(stage.count)}`;
  pickEls.mu.textContent = r.mu.map((v) => num(v, 4)).join("  ");
  pickEls.sd.textContent = r.sd.map((v) => num(v, 5)).join("  ");
  pickEls.q.textContent = r.rot.map((v) => num(v, 3)).join("  ");
  fillMatrix(pickEls.sigma, [
    [r.sigma[0], r.sigma[1], r.sigma[2]],
    [r.sigma[1], r.sigma[3], r.sigma[4]],
    [r.sigma[2], r.sigma[4], r.sigma[5]],
  ], true); // prettier-ignore
  const hex = "#" + r.color.map((c) => c.toString(16).padStart(2, "0")).join("");
  pickEls.swatch.style.background = hex;
  pickEls.rgb.textContent = `${hex}  (${r.color.join(", ")})`;
  pickEls.alpha.textContent = r.opacity.toFixed(3);
  pickEls.share.textContent = `${Math.round(r.share * 100)}% · ${fmt(r.layers - 1)} others here`;
}

// Matrix cells, with one power of ten pulled out when the numbers are small.
function fillMatrix(el, rows, scaled) {
  let max = 0;
  for (const r of rows) for (const v of r) max = Math.max(max, Math.abs(v));
  const e = scaled && max > 0 ? Math.floor(Math.log10(max)) : 0;
  const k = 10 ** -e;
  el.textContent = "";
  for (const r of rows)
    for (const v of r) {
      const s = document.createElement("span");
      s.textContent = (v * k).toFixed(scaled ? 3 : 1);
      el.append(s);
    }
  el.dataset.exp = e ? `×10${sup(e)}` : "";
  el.nextSibling?.classList?.contains("exp") && el.nextSibling.remove();
  if (e) {
    const x = document.createElement("span");
    x.className = "unit exp";
    x.textContent = `×10${sup(e)}`;
    el.after(x);
  }
}
const sup = (n) =>
  String(n)
    .split("")
    .map((c) => "⁰¹²³⁴⁵⁶⁷⁸⁹"["0123456789".indexOf(c)] ?? (c === "-" ? "⁻" : c))
    .join("");

// The picked splat's screen covariance, from the current view (it changes as the grape turns).
function screenCov(r, view, focal) {
  const m = view.m;
  const [X, Y, Z] = r.world;
  const cx = m[0] * X + m[4] * Y + m[8] * Z + m[12];
  const cy = m[1] * X + m[5] * Y + m[9] * Z + m[13];
  const cz = m[2] * X + m[6] * Y + m[10] * Z + m[14];
  const c = covariance(r.worldScale, r.rot);
  const S = [c[0], c[1], c[2], c[1], c[3], c[4], c[2], c[4], c[5]];
  const W = [m[0], m[4], m[8], m[1], m[5], m[9], m[2], m[6], m[10]];
  const J = [focal / cz, 0, (-focal * cx) / (cz * cz), 0, focal / cz, (-focal * cy) / (cz * cz)];
  const T = [];
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 3; j++) T[i * 3 + j] = J[i * 3] * W[j] + J[i * 3 + 1] * W[3 + j] + J[i * 3 + 2] * W[6 + j]; // prettier-ignore
  const TS = [];
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 3; j++) TS[i * 3 + j] = T[i * 3] * S[j] + T[i * 3 + 1] * S[3 + j] + T[i * 3 + 2] * S[6 + j]; // prettier-ignore
  const a = TS[0] * T[0] + TS[1] * T[1] + TS[2] * T[2] + 0.3;
  const b = -(TS[0] * T[3] + TS[1] * T[4] + TS[2] * T[5]);
  const d = TS[3] * T[3] + TS[4] * T[4] + TS[5] * T[5] + 0.3;
  return [a, b, d];
}

// ---- One to all: the tree dial ---------------------------------------------------------

const tree = { levels: 0, ready: false, building: null, L: -1, loading: false, value: 19, want: null };

steps.dial = {
  async enter() {
    stage.gesture = "orbit";
    if (!tree.ready && !tree.building) {
      say("built", "");
      tree.building = (async () => {
        await load("grape");
        const t = await stage.data.call("tree", { key: "grape" });
        tree.levels = t.levels;
        tree.ready = true;
        say("levels", `2⁰ to 2${sup(t.levels)}, then all`);
        const dial = $("#dial");
        dial.max = String(t.levels + 1);
        dial.value = String(t.levels + 1);
        tree.value = t.levels + 1;
      })();
    }
    if (!tree.played && !REDUCED.matches)
      setTimeout(async () => {
        if (step !== "dial" || tree.played) return;
        await tree.building;
        if (step !== "dial" || current !== "grape") return;
        tree.played = true;
        tree.play = { t: 0 };
      }, 600);
  },
  leave() {
    stage.displayCount = null;
    if (tree.L >= 0 && current === "grape") {
      tree.L = -1;
      stage.morph.manual = false;
      stage.setCloud(clouds.get("grape"));
    }
    $("#dial").value = $("#dial").max;
    $("#dial-out").textContent = "all";
    stage.repTarget = [1, 0, 0, 0];
    setRadio($$("[data-rep]"), "0", "rep");
  },
};

$("#dial").addEventListener("input", (e) => {
  tree.play = null;
  setDial(Number(e.target.value));
});

// The dial on its own, the first time: merged down to one splat, held, then split
// back up to all of them.
function tickDial(dt) {
  const p = tree.play;
  if (!p) return;
  if (step !== "dial") return void (tree.play = null);
  if (tree.loading) return;
  p.t += dt;
  const top = tree.levels + 1;
  const sm = (x) => x * x * (3 - 2 * x);
  const t = p.t;
  const k = clamp((t - 2.6) / 6.5, 0, 1);
  const v = t < 1.8 ? top * (1 - sm(t / 1.8)) : t < 2.6 ? 0 : top * sm(k);
  $("#dial").value = String(v);
  setDial(v);
  if (k >= 1) tree.play = null;
}

async function setDial(v) {
  tree.want = v;
  if (!tree.ready) await tree.building;
  if (current !== "grape" || busy) return;
  if (tree.loading) return;
  const top = tree.levels + 1;
  while (tree.want !== null) {
    const want = Math.min(tree.want, top);
    tree.want = null;
    // Level L flying to L + 1, at fraction f.
    let L = Math.floor(want);
    let f = want - L;
    if (L >= top) {
      L = top - 1;
      f = 1;
    }
    if (L !== tree.L) {
      tree.loading = true;
      const pair = await stage.data.call("level", { key: "grape", level: L });
      tree.loading = false;
      await stage.showPair(pair, f);
      tree.L = L;
    } else stage.morph.t = f;
    const n = L + 1 >= top ? stage.count : 2 ** (L + 1);
    const shown = f >= 0.999 ? n : 2 ** L;
    stage.displayCount = want >= top ? null : shown;
    $("#dial-out").textContent = want >= top ? "all" : fmt(shown);
  }
}

for (const b of $$("[data-rep]"))
  b.addEventListener("click", () => {
    const r = [0, 0, 0, 0];
    r[Number(b.dataset.rep)] = 1;
    stage.repTarget = r;
    setRadio($$("[data-rep]"), b.dataset.rep, "rep");
  });

// ---- Recipe ------------------------------------------------------------------------------

const recipe = { wood: "#8a5a2b", budget: tierNow().chest, result: null, building: false };

const chestSource = (() => {
  const lines = objectsSource.split("\n");
  const i = lines.findIndex((l) => l.startsWith("  chest: {"));
  let j = i + 1;
  while (j < lines.length && !/^ {2}[a-zA-Z"-]+: \{/.test(lines[j])) j++;
  return lines.slice(i, j).join("\n").trimEnd();
})();
const chestBytes = new TextEncoder().encode(chestSource).length;
say("recipe-size", `${(chestBytes / 1024).toFixed(1)} KB, src/packs/objects.js`);
hud["recipe-src"].innerHTML = highlight(chestSource);

function highlight(src) {
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return src
    .split("\n")
    .map((line) => {
      const m = line.match(/^(.*?)(\/\/.*)?$/);
      let code = esc(m[1]);
      code = code
        .replace(/("[^"]*"|`[^`]*`)/g, '<span class="s">$1</span>')
        .replace(/\b(const|let|return|for|of|if|else|new|function)\b/g, '<span class="k">$1</span>')
        .replace(/(?<![\w#">])(-?\d+\.?\d*)(?![\w"])/g, '<span class="n">$1</span>');
      return code + (m[2] ? `<span class="c">${esc(m[2])}</span>` : "");
    })
    .join("\n");
}

for (const b of $$("[data-budget]"))
  b.setAttribute("aria-checked", String(Number(b.dataset.budget) === recipe.budget));
steps.recipe = {
  enter() {
    stage.gesture = "orbit";
    showBuilt();
  },
};

function showBuilt() {
  const r = clouds.get("chest");
  if (!r) return say("built", "Building on this device…");
  say("built", `${fmt(r.count)} splats · built in ${Math.round(r.ms)} ms on this device · recipe ${(chestBytes / 1024).toFixed(1)} KB`); // prettier-ignore
}

async function rebuild(change, btn) {
  Object.assign(recipe, change);
  // Mid-flight or mid-build, the choice is kept and built when the chest is on stage.
  if (recipe.building || current !== "chest" || busy) return;
  recipe.building = true;
  say("built", "Building on this device…");
  try {
    const made = { budget: recipe.budget, wood: recipe.wood };
    const next = await stage.data.call("chest", { key: "chest-next", count: made.budget, wood: made.wood }); // prettier-ignore
    next.made = made;
    const pair = await stage.data.call("pair", { from: "chest", to: "chest-next" });
    await stage.data.call("rename", { from: "chest-next", to: "chest" });
    clouds.set("chest", next);
    recipe.result = next;
    stage.clearParts();
    await stage.fly(pair, { duration: change.wood ? 1.2 : 1.8, spread: 0.85, arc: change.wood ? 0 : 0.12 });
    await stage.setCloud(next);
    applyLid(lid.angle);
    showBuilt();
  } finally {
    recipe.building = false;
  }
  if (current === "chest") chestCatchUp();
  void btn;
}

// Builds again if the wood or the budget was changed while the chest couldn't.
function chestCatchUp() {
  const m = clouds.get("chest")?.made;
  if (m && (m.wood !== recipe.wood || m.budget !== recipe.budget)) setTimeout(() => rebuild({}), 0);
}

for (const b of $$("[data-wood]"))
  b.addEventListener("click", () => {
    setRadio($$("[data-wood]"), b.dataset.wood, "wood");
    rebuild({ wood: b.dataset.wood });
  });
for (const b of $$("[data-budget]"))
  b.addEventListener("click", () => {
    if (Number(b.dataset.budget) === recipe.budget) return;
    setRadio($$("[data-budget]"), b.dataset.budget, "budget");
    rebuild({ budget: Number(b.dataset.budget) });
  });

// ---- Moving parts --------------------------------------------------------------------------

const lid = { open: 0, target: 0, angle: 0 };

steps.parts = {
  enter() {
    stage.gesture = "orbit";
    stage.onTap = () => toggleLid();
    setTimeout(() => {
      if (step === "parts" && lid.target === 0 && !lid.touched) toggleLid(true);
    }, 1400);
  },
  leave(next) {
    stage.onTap = null;
    if (next !== "recipe") {
      lid.target = 0;
      setPressed("lid", false);
    }
    stage.partTint = false;
    setPressed("tint", false);
  },
};

// The lid's state changes at once; if the chest is still flying in, it opens on arrival.
function toggleLid(auto) {
  if (auto && current !== "chest") return;
  if (!auto) lid.touched = true;
  lid.target = lid.target ? 0 : 1;
  setPressed("lid", !!lid.target);
  $("[data-act=lid]").textContent = lid.target ? "Close the lid" : "Open the lid";
}

$("[data-act=lid]").addEventListener("click", () => toggleLid());
$("[data-act=tint]").addEventListener("click", () => {
  stage.partTint = !stage.partTint;
  setPressed("tint", stage.partTint);
});

function setPressed(act, on) {
  $(`[data-act=${act}]`).setAttribute("aria-pressed", String(on));
}

function applyLid(angle) {
  const r = clouds.get("chest");
  if (!r?.parts || current !== "chest") return;
  const i = r.parts.findIndex((p) => p.name === "lid");
  if (i < 0) return;
  stage.setParts(r.parts, { [i]: angle });
}

function tickLid(dt) {
  const speed = dt / 1.1;
  if (lid.open < lid.target) lid.open = Math.min(lid.target, lid.open + speed);
  else if (lid.open > lid.target) lid.open = Math.max(lid.target, lid.open - speed);
  // The recipe's own drive(): angle = -1.95 * easeInOut(open).
  const x = lid.open;
  const e = x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  const angle = -1.95 * e;
  if (angle !== lid.angle) {
    lid.angle = angle;
    if (current === "chest" && !busy && !recipe.building) applyLid(angle);
  }
}

// ---- Equations -----------------------------------------------------------------------------

const program = { id: "klein", live: null, t: 0 };
const area = $("#program");
const msg = $("#program-msg");

function setProgram(text, fromPreset) {
  try {
    const prog = readProgram(text);
    program.live = new LiveProgram(prog);
    msg.textContent = `${fmt(program.live.n)} splats, placed again every frame`;
    msg.classList.remove("is-error");
    if (current === "eq") {
      live = program.live;
      const set = live.frame(program.t);
      stage.setCloud({ gpu: live.gpu, pos: set.pos, parts: set.part, count: set.count });
    } else clouds.delete("eq");
    return true;
  } catch (err) {
    msg.textContent = err.message;
    msg.classList.add("is-error");
    void fromPreset;
    return false;
  }
}

area.value = programText(PROGRAMS.klein);
setProgram(area.value, true);
let typing = 0;
area.addEventListener("input", () => {
  clearTimeout(typing);
  typing = setTimeout(() => {
    setRadio($$("[data-preset]"), "", "preset");
    setProgram(area.value);
  }, 350);
});
for (const b of $$("[data-preset]"))
  b.addEventListener("click", () => {
    setRadio($$("[data-preset]"), b.dataset.preset, "preset");
    area.value = programText(PROGRAMS[b.dataset.preset]);
    setProgram(area.value, true);
  });

steps.equation = {
  enter() {
    stage.gesture = "orbit";
  },
};

function tickProgram(dt) {
  // The program plays while someone is here; left alone for 30 s it holds still.
  if (!live || current !== "eq" || busy || !stage.awake) return;
  if (!REDUCED.matches) program.t = (program.t + (dt * Math.PI * 2) / 8) % (Math.PI * 2);
  const set = live.frame(program.t);
  stage.liveSet(live.gpu, set.pos, set.count);
}

// ---- The walnut -----------------------------------------------------------------------------

const cut = { v: 1, dragging: null };

steps.walnut = {
  enter() {
    stage.gesture = "cut";
    stage.onCut = (dx) => {
      cut.touched = true;
      cut.anim = null;
      cut.v = clamp(cut.v - dx * 1.6, 0, 1);
      $("#cut").value = String(Math.round(cut.v * 1000));
      applyCut();
    };
    setTimeout(() => {
      if (step === "walnut" && cut.v === 1 && !cut.touched) animateCut(0.5);
    }, 2600);
  },
  leave() {
    stage.gesture = "orbit";
    stage.onCut = null;
  },
};

$("#cut").addEventListener("input", (e) => {
  cut.touched = true;
  cut.anim = null;
  cut.v = Number(e.target.value) / 1000;
  applyCut();
});

function animateCut(to) {
  cut.anim = { from: cut.v, to, t: 0, dur: REDUCED.matches ? 0.01 : 1.6 };
}

function tickCut(dt) {
  const a = cut.anim;
  if (!a) return;
  a.t += dt;
  const k = clamp(a.t / a.dur, 0, 1);
  cut.v = lerp(a.from, a.to, easeInOut(k));
  $("#cut").value = String(Math.round(cut.v * 1000));
  applyCut();
  if (k >= 1) cut.anim = null;
}

function applyCut() {
  // A vertical plane facing the walnut's front: everything in front of it is cut away.
  const d = lerp(-0.85, 1.15, cut.v);
  if (current === "walnut") stage.cut = cut.v >= 0.999 ? [0, 0, 0, 0] : [0, 0, -1, -d];
  const w = clouds.get("walnut");
  const mm = w ? Math.max(0, (d - w.zmin) * w.mmPerUnit).toFixed(1) : "";
  $("#cut-out").textContent = cut.v >= 0.999 ? "whole" : `${mm} mm in`;
}

// ---- The link -------------------------------------------------------------------------------

steps.link = {
  enter() {
    stage.gesture = "orbit";
    decode();
  },
};

$("#link-open").href = SPLASHERY + GRAPE_LINK;
$("[data-act=decode]").addEventListener("click", () => decode());
say("link-len", String(GRAPE_LINK.length));

let decoding = null;
function decode() {
  const link = GRAPE_LINK;
  const head = 5; // "#s=j."
  const body = link.slice(head);
  const json = atob(body.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((body.length + 3) % 4)); // prettier-ignore
  const linkEl = hud.link;
  const jsonEl = hud.json;
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const groups = Math.ceil(body.length / 4);
  let g = 0;
  clearInterval(decoding);
  const draw = () => {
    const done = body.slice(0, g * 4);
    const hot = body.slice(g * 4, g * 4 + 4);
    const rest = body.slice(g * 4 + 4);
    linkEl.innerHTML = `<span class="seen">${esc(link.slice(0, head))}</span><span class="seen">${esc(done)}</span><span class="hot">${esc(hot)}</span><span class="dimmed">${esc(rest)}</span>`; // prettier-ignore
    const shownBytes = Math.min(json.length, Math.floor(((g + 1) * 4 * 3) / 4));
    let out = esc(json.slice(0, shownBytes));
    if (g >= groups) out = out.replace("grape", '<span class="hot">grape</span>');
    jsonEl.innerHTML = out + (g < groups ? '<span class="hot"> </span>' : "");
  };
  if (REDUCED.matches) {
    g = groups;
    draw();
    return;
  }
  draw();
  decoding = setInterval(() => {
    g++;
    draw();
    if (g >= groups) clearInterval(decoding);
  }, 70);
}

// ---- The end: Splashery's own player ----------------------------------------------------------

$("#embed-start").addEventListener("click", () => {
  const f = document.createElement("iframe");
  f.src = `${SPLASHERY}embed/?toy=toy-piano&sound=on&theme=dark&turntable=off`;
  f.title = "Splashery's toy piano, live";
  f.allow = "fullscreen; autoplay";
  $("#embed").replaceChildren(f);
});

// ---- The frame loop ---------------------------------------------------------------------------

let hudState = null;
let hudTick = 0;

stage.on((frame) => {
  const dt = frame.dt;
  tickPull(dt);
  tickBlend(dt);
  tickDial(dt);
  tickLid(dt);
  tickProgram(dt);
  tickCut(dt);
  // The picked splat floats out to the side of the grape, five times its size.
  pick.lift = lerp(pick.lift, pick.liftTarget, 1 - Math.exp(-dt * 4));
  stage.lift = pick.lift;
  if (pick.result) {
    const v = frame.view;
    // Where it floats: a point on the stage, given as a fraction of its half-width and
    // half-height, at the depth of the grape's center.
    const halfH = stage.cam.distance * Math.tan(stage.cam.fov / 2);
    const halfW = halfH * (stage.cssW / stage.cssH);
    const at = PHONE.matches ? [0.52, -0.3] : [0.42, -0.48];
    const sx = (at[0] - stage.shift[0]) * halfW;
    const sy = (at[1] - stage.shift[1]) * halfH;
    stage.liftPos = [0, 1, 2].map((i) => stage.cam.target[i] + v.right[i] * sx + v.up[i] * sy);
    const s = Math.max(...pick.result.worldScale);
    stage.liftScale = clamp((0.075 * Math.min(halfW, halfH)) / s, 1, 600);
    hudTick++;
    if (hudTick % 6 === 0) {
      const c = screenCov(pick.result, v, frame.focal);
      fillMatrix(pickEls.sigma2, [
        [c[0], c[1]],
        [c[1], c[2]],
      ], false); // prettier-ignore
    }
  }
  updateHud(frame);
});

stage.overlayHook = (c, v, W, H) => {
  if (pick.result && pick.lift > 0.02) {
    const focal = stage.cam.focal(H);
    const a = project(v, focal, W, H, stage.shift, pick.result.world);
    const b = project(v, focal, W, H, stage.shift, stage.liftPos);
    if (a && b) {
      const dpr = W / stage.cssW;
      c.save();
      c.strokeStyle = `rgba(255, 212, 0, ${0.8 * pick.lift})`;
      c.lineWidth = 1 * dpr;
      c.setLineDash([4 * dpr, 4 * dpr]);
      c.beginPath();
      c.moveTo(a[0], a[1]);
      c.lineTo(lerp(a[0], b[0], pick.lift), lerp(a[1], b[1], pick.lift));
      c.stroke();
      c.setLineDash([]);
      c.beginPath();
      c.arc(a[0], a[1], 4 * dpr, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    }
  }
};

let hudAt = 0;
function updateHud(frame) {
  if (frame.now - hudAt < 250) return;
  hudAt = frame.now;
  const state = !errBox.hidden ? "stopped" : !host.classList.contains("is-live") ? "loading" : pull.frozen ? "frozen" : hudState || (stage.morph.t < 1 && !stage.morph.manual ? "flying" : frame.idle ? "idle" : "live"); // prettier-ignore
  say("state", state);
  say("file", FILES[current] || "");
  const drawn = stage.gl.orderCount;
  const n = stage.drawCount != null ? `${fmt(Math.min(stage.drawCount, drawn))} of ${fmt(stage.count)} splats` : drawn < stage.count && stage.displayCount == null ? `${fmt(drawn)} of ${fmt(stage.count)} splats drawn` : `${fmt(stage.displayCount ?? stage.count)} ${stage.displayCount === 1 ? "splat" : "splats"}`; // prettier-ignore
  say("count", n);
  say("sort", `sort ${stage.sortMs.toFixed(1)} ms · worker`);
  say("fps", frame.idle ? "no redraws" : `${Math.round(stage.fps)} fps`);
  if (pull.frozen) {
    const drawn = stage.gl.orderCount || stage.count;
    const per = Math.round(drawn / stage.explode.slabs);
    say("frozen", `Frame frozen. ${fmt(drawn)} splats in the order they are blended,\nshown as ${stage.explode.slabs} layers of about ${fmt(per)}.`); // prettier-ignore
  } else say("frozen", "");
}

// ---- Detail --------------------------------------------------------------------------------

const detailPop = $("#detail-pop");
const DETAIL_TEXT = { 1: "Low", 2: "Mid", 3: "High", 4: "Max" };

function showDetail() {
  const t = tierNow();
  $("#detail-now").textContent = detail.mode === "auto" ? `${t.name}, auto` : t.name;
  say("detail", `detail ${t.name.toLowerCase()}`);
  say("detail-auto", `${TIERS[detail.auto.tier].name}, for this device (${detail.auto.why})`);
  setRadio($$("[data-detail]"), String(detail.mode), "detail");
}

// Changes the tier on the spot: the canvas's pixels and spin at once, the chest and the
// walnut rebuilt at their new budgets (now if on stage, otherwise when next shown), and
// the grape swapped between its two captures when nothing depends on the one shown.
function applyDetail(tier) {
  if (tier === detail.tier) return showDetail();
  const before = TIERS[detail.tier];
  detail.tier = tier;
  const t = TIERS[tier];
  stage.setDetail(tier);
  if (t.chest !== recipe.budget) {
    setRadio($$("[data-budget]"), String(t.chest), "budget");
    if (current === "chest") rebuild({ budget: t.chest });
    else {
      recipe.budget = t.chest;
      if (!loading.has("chest")) clouds.delete("chest");
    }
  }
  if (t.walnut !== before.walnut) {
    if (current === "walnut" && !busy) {
      loadNow("walnut").then((c) => {
        clouds.set("walnut", c);
        if (current === "walnut" && !busy) stage.setCloud(c).then(() => applyCut());
      }).catch((err) => fail(err, () => goTo(CLOUD[step])));
    } else if (!loading.has("walnut")) clouds.delete("walnut");
  }
  if (t.grape === "full") upgradeGrape().catch((err) => console.warn(err));
  else downgradeGrape().catch((err) => console.warn(err));
  showDetail();
}

for (const b of $$("[data-detail]"))
  b.addEventListener("click", () => {
    const v = b.dataset.detail;
    detail.mode = v === "auto" ? "auto" : Number(v);
    saveMode(detail.mode);
    applyDetail(detail.mode === "auto" ? detail.auto.tier : detail.mode);
  });

// The popover's fallback where the Popover API is missing.
if (!HTMLElement.prototype.togglePopover) {
  detailPop.hidden = true;
  $("#detail-btn").addEventListener("click", () => (detailPop.hidden = !detailPop.hidden));
}

// Auto steps down a tier when frames keep coming too slowly, and says so. A tier the
// visitor picked is left alone.
stage.onStruggle = (median) => {
  if (detail.mode !== "auto" || detail.tier <= 1) return;
  applyDetail(detail.tier - 1);
  toast(`Frames took ${Math.round(median * 1000)} ms, so detail is now ${tierNow().name}. Change it under Detail.`); // prettier-ignore
};

let toastTimer = 0;
function toast(text) {
  say("toast", text);
  hud.toast.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => hud.toast.classList.remove("is-on"), 7000);
}

showDetail();
if (stage.software)
  setTimeout(() => toast("This browser is drawing without a graphics chip, so the stage is at its lightest and will still be slow."), 1500); // prettier-ignore

// Anything the visitor does keeps the stage awake (its idle spin, the program's play).
for (const type of ["scroll", "keydown", "pointerdown", "input"])
  addEventListener(type, () => stage.wake(), { passive: true, capture: true });

// ---- Keyboard ------------------------------------------------------------------------------

// Where the stage is, for the controls fixed over it.
function measureStage() {
  const r = $(".stage-col").getBoundingClientRect();
  const root = document.documentElement.style;
  root.setProperty("--stage-left", `${Math.round(r.left)}px`);
  root.setProperty("--stage-width", `${Math.round(r.width)}px`);
}
addEventListener("resize", measureStage);
measureStage();

// Focus entering a step that isn't on (Tab onto its controls, say) scrolls it on.
for (const el of $$(".step"))
  el.addEventListener("focusin", () => {
    if (el.dataset.step === step) return;
    const top = el.getBoundingClientRect().top + scrollY;
    const stageH = PHONE.matches ? $(".stage-col").getBoundingClientRect().height : 0;
    window.scrollTo({ top: Math.max(0, top - stageH), behavior: "instant" });
    setStep(el.dataset.step);
  });

// Sliders: arrows move a useful step (the dial one level), Page Up and Page Down a big
// one, Home and End to the ends.
function keySteps(input, small, big, snap = false) {
  input.addEventListener("keydown", (e) => {
    const min = +input.min;
    const max = +input.max;
    const v = snap ? Math.round(+input.value) : +input.value;
    const n = { ArrowRight: v + small, ArrowUp: v + small, ArrowLeft: v - small, ArrowDown: v - small, PageUp: v + big, PageDown: v - big, Home: min, End: max }[e.key]; // prettier-ignore
    if (n === undefined) return;
    e.preventDefault();
    input.value = String(clamp(n, min, max));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
keySteps($("#blend"), 20, 100);
keySteps($("#cut"), 20, 100);
keySteps($("#dial"), 1, 4, true);

// Radio groups: one tab stop each, arrows (and Home, End) move the choice.
function roving(group) {
  const items = () => $$('[role="radio"]', group);
  const sync = () => {
    const its = items();
    const on = its.find((b) => b.getAttribute("aria-checked") === "true") || its[0];
    for (const b of its) b.tabIndex = b === on ? 0 : -1;
  };
  group.addEventListener("keydown", (e) => {
    const its = items();
    const i = its.indexOf(document.activeElement);
    if (i < 0) return;
    const n = its.length;
    const j = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: n - 1 }[e.key]; // prettier-ignore
    if (j === undefined) return;
    e.preventDefault();
    const b = its[(j + n) % n];
    b.focus();
    b.click();
  });
  sync();
  new MutationObserver(sync).observe(group, { subtree: true, childList: true, attributes: true, attributeFilter: ["aria-checked"] }); // prettier-ignore
}
$$('[role="radiogroup"]').forEach(roving);

// The stage itself: arrows turn the camera; Enter or Space does the step's own
// thing (picks the splat under the crosshair, takes the frame apart, opens the lid);
// Escape lets the picked splat go.
const KEY_HINT = {
  hero: "Arrow keys turn it · Enter takes the frame apart",
  splat: "Arrows turn it · Enter picks at the crosshair · Esc lets go",
  parts: "Arrow keys turn it · Enter opens or closes the lid",
};
const keyHint = () => say("stage-keys", KEY_HINT[step] || "Arrow keys turn it");
hud["stage-keys"] = $("#stage-keys");

// From a step's controls, "Use the stage with the keys" moves focus onto the stage;
// Tab from the stage then carries on from where it came, not from the top of the page.
let stageFrom = null;
for (const b of $$("[data-act=to-stage]"))
  b.addEventListener("click", () => {
    stageFrom = b;
    host.focus();
  });

const focusables = () =>
  $$('a[href], button:not([disabled]), input:not([disabled]), textarea, summary, [tabindex="0"]').filter(
    (el) => el.tabIndex >= 0 && el.getClientRects().length && getComputedStyle(el).visibility !== "hidden",
  );

host.addEventListener("keydown", (e) => {
  if (e.target !== host || e.key !== "Tab" || !stageFrom) return;
  const list = focusables();
  const i = list.indexOf(stageFrom);
  const next = list[i + (e.shiftKey ? 0 : 1)] || stageFrom;
  stageFrom = null;
  e.preventDefault();
  next.focus();
});
host.addEventListener("focusout", () => {
  // Leaving the stage any other way (a click, the error's button) forgets where it came from.
  setTimeout(() => {
    if (document.activeElement !== host) stageFrom = null;
  }, 0);
});

host.addEventListener("keydown", (e) => {
  if (e.target !== host || e.altKey || e.ctrlKey || e.metaKey) return;
  const cam = stage.cam;
  const turn = { ArrowLeft: [-0.16, 0], ArrowRight: [0.16, 0], ArrowUp: [0, 0.1], ArrowDown: [0, -0.1] }[e.key]; // prettier-ignore
  if (turn) {
    e.preventDefault();
    stage.camTween = null;
    stage.idleAt = performance.now();
    cam.yaw += turn[0];
    cam.pitch = clamp(cam.pitch + turn[1], -1.2, 1.2);
    return;
  }
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    if (step === "splat") pickAt(0.5, 0.5);
    else if (step === "hero") {
      pull.used = true;
      $(".hud-hint").classList.add("is-used");
      demoPull(0.9, 4.2);
    } else if (step === "parts") toggleLid();
  } else if (e.key === "Escape" && pick.result) {
    e.preventDefault();
    clearPick();
  }
});

// ---- Errors -------------------------------------------------------------------------------

// One place for anything that stops the page: a file that won't load, a thread that
// won't start or dies, a lost drawing context. It says what failed, and Retry tries
// again (or reloads the page when a thread or the context is gone).
const errBox = $("#error");
let retryWith = null;

function fail(err, retry) {
  const message = (err && (err.message || String(err))) || "Something stopped the page.";
  console.error(err);
  $("#error-msg").textContent = message.replace(/^Error: /, "");
  retryWith = stage.broken ? () => location.reload() : retry;
  $("#error-retry").textContent = stage.broken ? "Reload the page" : "Retry";
  errBox.hidden = false;
  host.classList.add("is-stopped");
  say("load", "");
}

$("#error-retry").addEventListener("click", () => {
  errBox.hidden = true;
  host.classList.remove("is-stopped");
  const r = retryWith;
  retryWith = null;
  if (r) r();
});

stage.onError = (err) => fail(err, () => location.reload());

// ---- Boot ----------------------------------------------------------------------------------------

async function boot() {
  errBox.hidden = true;
  const t0 = performance.now();
  try {
    await goTo(CLOUD[step] || "grape");
  } catch (err) {
    fail(err, boot);
    return;
  }
  host.classList.add("is-live");
  say("load", "");
  console.log(`first cloud in ${Math.round(performance.now() - t0)} ms`);
  if (step === "hero")
    setTimeout(() => {
      if (!pull.used && step === "hero") demoPull(0.42, 2.8);
    }, 900);
  // Warm the next clouds while the visitor reads; a failure here shows when its step comes.
  setTimeout(() => load("chest").then(() => load("walnut")).catch(() => {}), 1500);
}

watchSteps();
boot();

// For checks from the console and the clip tool.
window.pitch = { demoPull, pull, goTo, setStep, pickAt, setDial, toggleLid, animateCut, decode };
