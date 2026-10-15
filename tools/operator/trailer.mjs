// Records a page in real-time headless Chrome as a short clip: screencast frames with their timestamps,
// and an ffmpeg concat list (frames.txt) that keeps their real timing. tools/operator/trailers.sh drives it.
// usage: node trailer.mjs <url> <outDir> <width> <height> <warmupMs> <seconds> <port> [js run once before recording] [js run every 1.5 s while recording]
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
const [url, out, w, h, warm, secs, port, setup, tick] = process.argv.slice(2);
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${out}/.profile`, '--no-first-run', '--mute-audio', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 60 && !target; i++) { await sleep(200); try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); const errors = []; const frames = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result); pending.delete(d.id); }
  if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
  if (d.method === 'Page.screencastFrame') {
    frames.push({ data: d.params.data, t: d.params.metadata.timestamp });
    ws.send(JSON.stringify({ id: ++id, method: 'Page.screencastFrameAck', params: { sessionId: d.params.sessionId } }));
  }
};
const send = (method, params = {}) => new Promise((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
await send('Runtime.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
await sleep(+warm);
if (setup) await send('Runtime.evaluate', { awaitPromise: true, expression: setup });
await sleep(400);
let timer;
if (tick) timer = setInterval(() => send('Runtime.evaluate', { expression: tick }), 1500);
await send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: +w, maxHeight: +h, everyNthFrame: 1 });
await sleep(+secs * 1000);
await send('Page.stopScreencast');
clearInterval(timer);
const lines = [];
frames.forEach((f, i) => {
  const name = `f${String(i).padStart(4, '0')}.jpg`;
  writeFileSync(`${out}/${name}`, Buffer.from(f.data, 'base64'));
  const next = frames[i + 1] ? frames[i + 1].t : f.t + 1 / 30;
  lines.push(`file '${name}'`, `duration ${Math.max(0.001, next - f.t).toFixed(4)}`);
});
if (frames.length) lines.push(`file 'f${String(frames.length - 1).padStart(4, '0')}.jpg'`);
writeFileSync(`${out}/frames.txt`, lines.join('\n') + '\n');
console.log(JSON.stringify({ url, frames: frames.length, span: frames.length ? +(frames.at(-1).t - frames[0].t).toFixed(2) : 0, errors }));
ws.close(); chrome.kill();
