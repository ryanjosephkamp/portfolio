// A small DevTools-protocol driver for checking the page and recording its clip:
// headless Chrome with the GPU, device emulation, touch and mouse input, page
// evaluation, screenshots, and a screencast. Node 22 or later (global WebSocket).
//
//   import { open } from "./cdp.mjs";
//   const page = await open({ width: 390, height: 844, mobile: true });
//   await page.go("http://127.0.0.1:4192/");
//   await page.eval("window.stage.count");
//   await page.shot("phone.png");
//   await page.close();
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CHROME =
  process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function open({ width = 1440, height = 900, mobile = false, dpr, port = 9300 + Math.floor(Math.random() * 500), reducedMotion = false } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pitch-chrome-"));
  const proc = spawn(CHROME, [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${dir}`,
    "--use-angle=metal",
    "--enable-gpu",
    "--ignore-gpu-blocklist",
    "--enable-webgl",
    "--no-first-run",
    "--no-default-browser-check",
    "--hide-scrollbars",
    "--autoplay-policy=no-user-gesture-required",
    `--window-size=${Math.max(width, 500)},${height}`,
    "about:blank",
  ], { stdio: "ignore" });
  // If the script dies before close(), don't leave a headless browser running the page.
  const reap = () => {
    try {
      proc.kill("SIGKILL");
    } catch {}
  };
  process.on("exit", reap);
  for (const sig of ["SIGINT", "SIGTERM"]) process.once(sig, () => (reap(), process.exit(1)));
  let targets;
  for (let i = 0; i < 80; i++) {
    try {
      targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      if (targets.some((t) => t.type === "page")) break;
    } catch {}
    await sleep(100);
  }
  const target = targets.find((t) => t.type === "page");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r, j) => {
    ws.onopen = r;
    ws.onerror = j;
  });
  let n = 0;
  const wait = new Map();
  const listeners = new Set();
  const logs = [];
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && wait.has(m.id)) {
      const p = wait.get(m.id);
      wait.delete(m.id);
      if (m.error) p.reject(new Error(m.error.message));
      else p.resolve(m.result);
    } else if (m.method) {
      if (m.method === "Runtime.consoleAPICalled")
        logs.push(`[${m.params.type}] ${m.params.args.map((a) => a.value ?? a.description ?? "").join(" ")}`);
      if (m.method === "Runtime.exceptionThrown")
        logs.push(`[exception] ${m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text}`);
      for (const fn of listeners) fn(m);
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++n;
      wait.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: dpr || (mobile ? 3 : 2),
    mobile,
    screenWidth: width,
    screenHeight: height,
  });
  if (mobile) {
    await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    await send("Emulation.setUserAgentOverride", {
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    });
  }
  if (reducedMotion)
    await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });

  const page = {
    send,
    logs,
    width,
    height,
    async go(url, settle = 0) {
      await send("Page.navigate", { url });
      await page.until("document.readyState === 'complete'", 15000);
      if (settle) await sleep(settle);
    },
    async eval(expr) {
      const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    },
    async until(expr, timeout = 20000) {
      const t0 = Date.now();
      while (Date.now() - t0 < timeout) {
        try {
          if (await page.eval(expr)) return true;
        } catch {}
        await sleep(100);
      }
      throw new Error(`Timed out waiting for ${expr}`);
    },
    sleep,
    async shot(file, { full = false } = {}) {
      const jpeg = file.endsWith(".jpg");
      const r = await send("Page.captureScreenshot", { format: jpeg ? "jpeg" : "png", quality: jpeg ? 82 : undefined, captureBeyondViewport: full }); // prettier-ignore
      fs.writeFileSync(file, Buffer.from(r.data, "base64"));
      return file;
    },
    // A key press: key is a DOM key name ("Tab", "Enter", "ArrowRight", " ").
    async key(key, { shift = false } = {}) {
      const codes = { Tab: [9, "Tab"], Enter: [13, "Enter"], Escape: [27, "Escape"], " ": [32, "Space"], ArrowLeft: [37, "ArrowLeft"], ArrowUp: [38, "ArrowUp"], ArrowRight: [39, "ArrowRight"], ArrowDown: [40, "ArrowDown"], Home: [36, "Home"], End: [35, "End"] }; // prettier-ignore
      const [code, name] = codes[key] || [0, key];
      const base = { key, code: name, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code, modifiers: shift ? 8 : 0 }; // prettier-ignore
      const text = key === "Enter" ? "\r" : key === " " ? " " : undefined;
      await send("Input.dispatchKeyEvent", { type: text ? "keyDown" : "rawKeyDown", text, ...base });
      await send("Input.dispatchKeyEvent", { type: "keyUp", ...base });
    },
    async touch(type, x, y) {
      await send("Input.dispatchTouchEvent", {
        type,
        touchPoints: type === "touchEnd" ? [] : [{ x, y, radiusX: 4, radiusY: 4, force: 1, id: 1 }],
      });
    },
    async mouse(type, x, y, buttons = 1) {
      await send("Input.dispatchMouseEvent", { type, x, y, button: "left", buttons, clickCount: 1 });
    },
    // A drag along a path, at about 60 steps a second.
    async drag(points, { touch = mobile, stepMs = 16 } = {}) {
      const [x0, y0] = points[0];
      if (touch) await page.touch("touchStart", x0, y0);
      else await page.mouse("mousePressed", x0, y0);
      for (const [x, y] of points.slice(1)) {
        if (touch) await page.touch("touchMove", x, y);
        else await page.mouse("mouseMoved", x, y);
        await sleep(stepMs);
      }
      const [x1, y1] = points[points.length - 1];
      if (touch) await page.touch("touchEnd", x1, y1);
      else await page.mouse("mouseReleased", x1, y1, 0);
    },
    async scrollTo(selector, offset = 0) {
      await page.eval(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); window.scrollTo(0, el.getBoundingClientRect().top + scrollY + ${offset}); })()`);
    },
    // Records frames until stop() is called; returns the frame files.
    async screencast(dir, { quality = 92, everyNth = 1 } = {}) {
      fs.mkdirSync(dir, { recursive: true });
      const frames = [];
      const fn = async (m) => {
        if (m.method !== "Page.screencastFrame") return;
        const { data, sessionId, metadata } = m.params;
        const f = path.join(dir, `f${String(frames.length).padStart(5, "0")}.jpg`);
        fs.writeFileSync(f, Buffer.from(data, "base64"));
        frames.push({ file: f, t: metadata.timestamp });
        send("Page.screencastFrameAck", { sessionId }).catch(() => {});
      };
      listeners.add(fn);
      await send("Page.startScreencast", { format: "jpeg", quality, everyNthFrame: everyNth });
      return {
        frames,
        async stop() {
          await send("Page.stopScreencast");
          listeners.delete(fn);
          return frames;
        },
      };
    },
    async close() {
      try {
        ws.close();
      } catch {}
      process.off("exit", reap);
      proc.kill("SIGKILL");
      await sleep(200);
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
  return page;
}
