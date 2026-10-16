// The page's checks, against the built site (run `npm run build` first):
//   - every step at 1440x900, at 390x844 as a touch phone, and with reduced motion,
//     in headless Chrome
//   - every step in WebKit as an iPhone (Playwright's WebKit, if it is installed)
//   - three forced failures: the first SOG blocked, the walnut answering 404, and the
//     data worker's script answering 404; each must show its message on the stage
//   - a walk through the whole page by keyboard only
// Screenshots and results.md go to screenshots/. Exits 1 if any check fails.
//
//   node tools/verify.mjs [--only=desk,phone,rm,fail,keys,webkit] [--url=https://…/]
//
// With --url, the walks (desk, phone, rm, webkit) run against that address instead,
// for checking a published copy; screenshots go to screenshots/live/. The forced
// failures need the local server, so they are skipped.
//
// WebKit: set PLAYWRIGHT to a Playwright package (default: Splashery's checkout) and
// WEBKIT to a WebKit build's pw_run.sh (default: the newest in Playwright's cache).
import { open } from "./cdp.mjs";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, "../dist");
const remote = (process.argv.find((a) => a.startsWith("--url=")) || "").slice(6);
const shots = path.resolve(here, remote ? "../screenshots/live" : "../screenshots");
fs.mkdirSync(shots, { recursive: true });
const only = (process.argv.find((a) => a.startsWith("--only=")) || "").slice(7).split(",").filter(Boolean); // prettier-ignore
const want = (k) => (!only.length || only.includes(k)) && !(remote && (k === "fail" || k === "keys"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- A static server that can fail files on purpose ------------------------------------

const faults = { blockFirstSog: false, walnut404: false, breakWorker: false };
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".wasm": "application/wasm", ".woff2": "font/woff2", ".jpg": "image/jpeg", ".png": "image/png", ".sog": "application/octet-stream", ".gz": "application/gzip", ".json": "application/json" }; // prettier-ignore
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (faults.blockFirstSog && p.endsWith("/assets/grape-lite.sog")) return req.socket.destroy();
  if (faults.walnut404 && p.endsWith("/assets/walnut.vol.gz")) return void res.writeHead(404).end("Not Found"); // prettier-ignore
  if (faults.breakWorker && /\/assets\/data-[^/]*\.js$/.test(p)) return void res.writeHead(404).end("Not Found"); // prettier-ignore
  let file = path.join(dist, p);
  if (p.endsWith("/")) file = path.join(file, "index.html");
  if (!file.startsWith(dist) || !fs.existsSync(file)) return void res.writeHead(404).end("Not Found");
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" }); // prettier-ignore
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const URL0 = remote || `http://127.0.0.1:${server.address().port}/`;

// ---- Results ---------------------------------------------------------------------------

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? "pass" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
}

const STEPS = ["hero", "frame", "splat", "dial", "recipe", "parts", "equation", "walnut", "link", "claims"]; // prettier-ignore
const SLOW = new Set(["recipe", "equation", "walnut", "link"]); // a flight first
const live = "document.querySelector('#stage').classList.contains('is-live')";
const errorText = "document.querySelector('#error').hidden ? '' : document.querySelector('#error-msg').textContent"; // prettier-ignore

// ---- Every step, in Chrome ---------------------------------------------------------------

async function walk(name, cfg) {
  const page = await open({ ...cfg, dpr: cfg.mobile ? 2 : 1 });
  try {
    await page.go(URL0);
    await page.until(`${live} && stage.count >= 300000`, 40000);
    const stageH = cfg.mobile ? Math.round(cfg.height * 0.58) : 0;
    for (const [i, s] of STEPS.entries()) {
      await page.scrollTo(`[data-step=${s}]`, -stageH + (cfg.mobile ? 10 : 0));
      await sleep(SLOW.has(s) ? 4200 : 2400);
      const st = JSON.parse(await page.eval(`JSON.stringify({ step: stage.host.dataset.step, count: stage.count, fps: Math.round(stage.fps), err: ${errorText} })`)); // prettier-ignore
      check(`${name}: ${s}`, st.step === s && st.count > 0 && !st.err, `${st.count.toLocaleString("en-US")} splats, ${st.fps} fps${st.err ? `, error: ${st.err}` : ""}`); // prettier-ignore
      await page.shot(path.join(shots, `${name}-${String(i).padStart(2, "0")}-${s}.jpg`));
    }
    await page.scrollTo("#end");
    await sleep(800);
    await page.shot(path.join(shots, `${name}-10-end.jpg`));
    const sw = await page.eval("document.documentElement.scrollWidth");
    check(`${name}: no sideways scroll`, sw <= cfg.width, `${sw} px wide at ${cfg.width}`);
    const errs = page.logs.filter((l) => /\[(error|exception)\]/.test(l));
    check(`${name}: no console errors`, !errs.length, errs.join(" | ").slice(0, 300));
  } finally {
    await page.close();
  }
}

// ---- Forced failures ---------------------------------------------------------------------

async function failures() {
  // 1. The first SOG never arrives: the boot says so, and Retry loads it.
  faults.blockFirstSog = true;
  let page = await open({ width: 1440, height: 900, dpr: 1 });
  try {
    await page.go(URL0);
    await page.until(`(${errorText}).length > 0`, 20000);
    const msg = await page.eval(errorText);
    check("failure: first SOG blocked shows a message", /grape-lite\.sog/.test(msg), msg);
    const spins = await page.eval(`!${live}`);
    check("failure: first SOG blocked, the stage does not claim to be live", spins);
    await page.shot(path.join(shots, "fail-1-sog-blocked.jpg"));
    faults.blockFirstSog = false;
    await page.eval("document.querySelector('#error-retry').click()");
    await page.until(`${live} && stage.count > 0`, 20000);
    check("failure: Retry after the SOG comes back", await page.eval(`${live} && document.querySelector('#error').hidden`)); // prettier-ignore
  } finally {
    faults.blockFirstSog = false;
    await page.close();
  }

  // 2. The walnut answers 404: its step says which file and the status.
  faults.walnut404 = true;
  page = await open({ width: 1440, height: 900, dpr: 1 });
  try {
    await page.go(URL0);
    await page.until(`${live} && stage.count >= 300000`, 40000);
    await page.scrollTo("[data-step=walnut]");
    await page.until(`(${errorText}).length > 0`, 20000);
    const msg = await page.eval(errorText);
    check("failure: walnut 404 shows the file and status", /walnut\.vol\.gz/.test(msg) && /404/.test(msg), msg); // prettier-ignore
    await page.shot(path.join(shots, "fail-2-walnut-404.jpg"));
    faults.walnut404 = false;
    await page.eval("document.querySelector('#error-retry').click()");
    await page.until("stage.host.dataset.step === 'walnut' && stage.count > 100000 && document.querySelector('#error').hidden", 20000); // prettier-ignore
    check("failure: Retry brings the walnut", true);
  } finally {
    faults.walnut404 = false;
    await page.close();
  }

  // 3. The data worker's script answers 404: the page says the thread could not start.
  faults.breakWorker = true;
  page = await open({ width: 1440, height: 900, dpr: 1 });
  try {
    await page.go(URL0);
    await page.until(`(${errorText}).length > 0`, 20000);
    const msg = await page.eval(errorText);
    check("failure: broken worker URL shows a message", /data thread/.test(msg), msg);
    const label = await page.eval("document.querySelector('#error-retry').textContent");
    check("failure: broken worker offers a reload", /Reload/.test(label), label);
    await page.shot(path.join(shots, "fail-3-worker.jpg"));
    faults.breakWorker = false;
    await page.eval("document.querySelector('#error-retry').click()");
    await sleep(500);
    await page.until(`${live} && stage.count > 0`, 30000);
    check("failure: Reload after the worker comes back", true);
  } finally {
    faults.breakWorker = false;
    await page.close();
  }
}

// ---- Keyboard only -----------------------------------------------------------------------

async function keyboard() {
  const page = await open({ width: 1440, height: 900, dpr: 1 });
  const describe = `(() => { const a = document.activeElement; const s = a.closest('.step'); return JSON.stringify({ tag: a.tagName.toLowerCase(), href: a.href || '', id: a.id, act: a.dataset.act || a.dataset.pass || a.dataset.rep || a.dataset.wood || a.dataset.budget || a.dataset.preset || '', text: (a.getAttribute('aria-label') || a.textContent || '').trim().slice(0, 40), inStep: s ? s.dataset.step : '', step: stage.host.dataset.step }); })()`; // prettier-ignore
  try {
    await page.go(URL0);
    await page.until(`${live} && stage.count >= 300000`, 40000);
    await page.eval("pitch.pull.used = true");
    const seen = new Set();
    const trail = [];
    const done = new Set();
    let last = "";
    for (let n = 0; n < 220; n++) {
      await page.key("Tab");
      await sleep(260);
      const a = JSON.parse(await page.eval(describe));
      trail.push(`${a.step}:${a.tag}${a.id ? "#" + a.id : ""}${a.act ? "[" + a.act + "]" : ""}`);
      seen.add(a.step);
      if (a.inStep && a.inStep !== a.step) await sleep(300);

      if (a.id === "stage" && a.step === "hero" && !done.has("stage")) {
        done.add("stage");
        const y0 = await page.eval("stage.cam.yaw");
        for (let k = 0; k < 3; k++) await page.key("ArrowRight");
        const y1 = await page.eval("stage.cam.yaw");
        check("keys: arrows turn the stage", y1 > y0 + 0.3, `yaw ${y0.toFixed(2)} to ${y1.toFixed(2)}`);
        await page.shot(path.join(shots, "keys-1-stage-focus.jpg"));
        await page.key("Enter");
        await sleep(1400);
        check("keys: Enter takes the frame apart", await page.eval("stage.explode.amount > 0.3"));
        await page.shot(path.join(shots, "keys-2-enter-explodes.jpg"));
        await sleep(3500);
      }
      if (a.act === "0" && a.tag === "button" && a.inStep === "frame" && !done.has("radio")) {
        done.add("radio");
        await sleep(400);
        await page.key("ArrowRight");
        await sleep(200);
        const c1 = await page.eval("document.querySelector('[data-pass][aria-checked=true]').dataset.pass + document.activeElement.dataset.pass"); // prettier-ignore
        await page.key("End");
        const c2 = await page.eval("document.querySelector('[data-pass][aria-checked=true]').dataset.pass");
        await sleep(600);
        await page.shot(path.join(shots, "keys-3-radio-end.jpg"));
        await page.key("Home");
        const c3 = await page.eval("document.querySelector('[data-pass][aria-checked=true]').dataset.pass");
        const tabs = await page.eval("[...document.querySelectorAll('[data-pass]')].map((b) => b.tabIndex).join('')"); // prettier-ignore
        check("keys: radio arrows, End and Home", c1 === "11" && c2 === "4" && c3 === "0" && tabs === "0-1-1-1-1", `after Right ${c1[0]}, End ${c2}, Home ${c3}, tab stops ${tabs}`); // prettier-ignore
      }
      if (a.act === "to-stage" && a.step === "splat" && !done.has("pick")) {
        done.add("pick");
        await sleep(800);
        await page.key("Enter");
        await sleep(300);
        const onStage = await page.eval("document.activeElement.id");
        await page.key(" ");
        await sleep(1800);
        const sel = await page.eval("stage.selected");
        await page.shot(path.join(shots, "keys-4-space-picks.jpg"));
        check("keys: Space on the stage picks a splat", onStage === "stage" && sel >= 0, `focus ${onStage}, splat ${sel}`); // prettier-ignore
        await page.key("Escape");
        await sleep(300);
        check("keys: Escape lets it go", (await page.eval("stage.selected")) === -1);
        await page.key("Tab");
        await sleep(200);
        const back = JSON.parse(await page.eval(describe));
        check("keys: Tab from the stage carries on in the step", back.act === "pick-again", `${back.tag} ${back.act}`); // prettier-ignore
      }
      if (a.act === "lid" && !done.has("lid")) {
        done.add("lid");
        const before = await page.eval("document.querySelector('[data-act=lid]').getAttribute('aria-pressed')"); // prettier-ignore
        await page.key("Enter");
        await sleep(300);
        const after = await page.eval("document.querySelector('[data-act=lid]').getAttribute('aria-pressed')"); // prettier-ignore
        check("keys: Enter on the lid button", before !== after, `${before} to ${after}`);
      }
      if (a.id === "dial" && !done.has("dial")) {
        done.add("dial");
        await sleep(9000); // let the dial's own play finish
        const v0 = await page.eval("+document.querySelector('#dial').value");
        for (let k = 0; k < 6; k++) await page.key("ArrowLeft");
        await sleep(1500);
        const v1 = await page.eval("+document.querySelector('#dial').value");
        const shown = await page.eval("document.querySelector('#dial-out').textContent");
        check("keys: arrows turn the dial a level at a time", Math.round(v0) - v1 === 6, `${v0} to ${v1}, showing ${shown}`); // prettier-ignore
        await page.shot(path.join(shots, "keys-5-dial.jpg"));
      }
      if (a.id === "cut" && !done.has("cut")) {
        done.add("cut");
        await sleep(800);
        for (let k = 0; k < 10; k++) await page.key("ArrowLeft");
        await sleep(400);
        check("keys: arrows move the cut", (await page.eval("document.querySelector('#cut-out').textContent")) !== "whole"); // prettier-ignore
        await page.shot(path.join(shots, "keys-6-cut.jpg"));
      }
      // Stop at the end of the page: focus back on the body, or not moving.
      const key = JSON.stringify(a);
      if (a.tag === "body" || key === last || (n > 10 && a.href.endsWith("#end"))) break;
      last = key;
    }
    const missing = STEPS.filter((s) => !seen.has(s));
    check("keys: Tab alone reaches every step", !missing.length, missing.length ? `missing ${missing.join(", ")}` : `${trail.length} stops`); // prettier-ignore
    for (const k of ["stage", "radio", "pick", "lid", "dial", "cut"]) if (!done.has(k)) check(`keys: reached ${k}`, false); // prettier-ignore
    fs.writeFileSync(path.join(shots, "keys-trail.txt"), trail.join("\n") + "\n");
    const errs = page.logs.filter((l) => /\[(error|exception)\]/.test(l));
    check("keys: no console errors", !errs.length, errs.join(" | ").slice(0, 300));
  } finally {
    await page.close();
  }
}

// ---- WebKit as an iPhone -----------------------------------------------------------------

async function webkit() {
  const pw = process.env.PLAYWRIGHT || "/Users/noir/splashery-2/node_modules/playwright/index.mjs";
  const cache = path.join(os.homedir(), "Library/Caches/ms-playwright");
  const builds = fs.existsSync(cache) ? fs.readdirSync(cache).filter((d) => /^webkit-\d+$/.test(d)).sort((a, b) => +b.slice(7) - +a.slice(7)) : []; // prettier-ignore
  const exe = process.env.WEBKIT || (builds[0] && path.join(cache, builds[0], "pw_run.sh"));
  if (!fs.existsSync(pw) || !exe || !fs.existsSync(exe)) return check("webkit: available", false, "no Playwright or WebKit build found"); // prettier-ignore
  const { webkit, devices } = await import(pw);
  const browser = await webkit.launch({ executablePath: exe });
  try {
    // A published copy can't be made to fail, so it gets the walk only.
    for (const run of remote ? ["walk"] : ["walk", "fail"]) {
      if (run === "fail") faults.blockFirstSog = true;
      const ctx = await browser.newContext({ ...devices["iPhone 15"] });
      const page = await ctx.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(URL0);
      if (run === "fail") {
        await page.waitForFunction(() => !document.querySelector("#error").hidden, null, { timeout: 20000 }); // prettier-ignore
        const msg = await page.textContent("#error-msg");
        check("webkit: first SOG blocked shows a message", /grape-lite\.sog/.test(msg), msg);
        await page.screenshot({ path: path.join(shots, "webkit-fail-sog.jpg"), quality: 82 });
        faults.blockFirstSog = false;
        await page.click("#error-retry");
        await page.waitForFunction(() => document.querySelector("#stage").classList.contains("is-live"), null, { timeout: 30000 }); // prettier-ignore
        check("webkit: Retry loads it", true);
      } else {
        await page.waitForFunction(() => document.querySelector("#stage").classList.contains("is-live") && window.stage.count >= 300000, null, { timeout: 40000 }); // prettier-ignore
        const stageH = Math.round(page.viewportSize().height * 0.58);
        for (const [i, s] of STEPS.entries()) {
          await page.evaluate(([s, h]) => { const el = document.querySelector(`[data-step=${s}]`); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - h + 10); }, [s, stageH]); // prettier-ignore
          await sleep(SLOW.has(s) ? 4500 : 2400);
          const st = await page.evaluate(() => ({ step: stage.host.dataset.step, count: stage.count, err: document.querySelector("#error").hidden ? "" : document.querySelector("#error-msg").textContent })); // prettier-ignore
          check(`webkit: ${s}`, st.step === s && st.count > 0 && !st.err, `${st.count.toLocaleString("en-US")} splats${st.err ? ", " + st.err : ""}`); // prettier-ignore
          await page.screenshot({ path: path.join(shots, `webkit-${String(i).padStart(2, "0")}-${s}.jpg`), quality: 82 }); // prettier-ignore
        }
        check("webkit: no page errors", !errors.length, errors.join(" | "));
      }
      await ctx.close();
      faults.blockFirstSog = false;
    }
  } finally {
    await browser.close();
  }
}

// ---- Run ---------------------------------------------------------------------------------

try {
  if (want("desk")) await walk("desk", { width: 1440, height: 900 });
  if (want("phone")) await walk("phone", { width: 390, height: 844, mobile: true });
  if (want("rm")) await walk("reduced", { width: 1280, height: 800, reducedMotion: true });
  if (want("fail")) await failures();
  if (want("keys")) await keyboard();
  if (want("webkit")) await webkit();
} catch (err) {
  check("verify: ran to the end", false, err.message);
} finally {
  server.close();
}
const failed = results.filter((r) => !r.ok);
const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
const md = [`# Checks, ${date}`, "", `${results.length - failed.length} of ${results.length} passed.`, "", "| Check | Result | Detail |", "| --- | --- | --- |", ...results.map((r) => `| ${r.name} | ${r.ok ? "pass" : "**fail**"} | ${String(r.detail).replace(/\|/g, "/")} |`)].join("\n"); // prettier-ignore
fs.writeFileSync(path.join(shots, only.length ? `results-${only.join("-")}.md` : "results.md"), md + "\n");
console.log(`\n${results.length - failed.length} of ${results.length} passed.`);
process.exit(failed.length ? 1 : 0);
