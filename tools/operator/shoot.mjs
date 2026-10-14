// Real-time headless Chrome: load a page, optionally run a step, report frame rate and console errors, save a screenshot.
// usage: node shoot.mjs <url> <out.png> <width> <height> <waitMs> <port> [js to run after the wait, then 3 s more]
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const [url, out, w, h, wait, port, step] = process.argv.slice(2);
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${out}.profile`, '--no-first-run', '--mute-audio', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) { await sleep(200); try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); const errors = [];
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result); pending.delete(d.id); } if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text); if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errors.push(d.params.args.map((a) => a.value ?? a.description).join(' ')); if (d.method === 'Network.loadingFailed') errors.push('load failed: ' + d.params.errorText); };
const send = (method, params = {}) => new Promise((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable');
await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 1, mobile: +w < 500 });
await send('Page.navigate', { url });
await sleep(+wait);
let stepResult = '';
if (step) { const r = await send('Runtime.evaluate', { awaitPromise: true, returnByValue: true, expression: step }); stepResult = ' step: ' + JSON.stringify(r.result?.value ?? r.exceptionDetails?.text); await sleep(3000); }
const fps = await send('Runtime.evaluate', { awaitPromise: true, returnByValue: true, expression: `new Promise(res=>{let n=0;const t=performance.now();const f=()=>{n++;performance.now()-t<2000?requestAnimationFrame(f):res(JSON.stringify({fps:Math.round(n/2),hscroll:document.documentElement.scrollWidth>document.documentElement.clientWidth}))};requestAnimationFrame(f)})` });
const shot = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync(out, Buffer.from(shot.data, 'base64'));
console.log(`${w}x${h}`, fps.result.value, 'errors:', JSON.stringify(errors) + stepResult);
ws.close(); chrome.kill();
