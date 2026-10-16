// Records the signature moment: the grape, a sideways drag that takes one frame apart,
// a swing to the other side, and the release that puts it back together.
//
//   node tools/clip.mjs [url] [--phone] [--out clips/]
//
// Needs Chrome and ffmpeg. Writes an MP4 (H.264) at 30 frames a second.
import { open } from "./cdp.mjs";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
const url = args.find((a) => a.startsWith("http")) || "http://127.0.0.1:4192/";
const phone = args.includes("--phone");
const outDir = path.resolve(args[args.indexOf("--out") + 1] && args.includes("--out") ? args[args.indexOf("--out") + 1] : "clips"); // prettier-ignore
fs.mkdirSync(outDir, { recursive: true });

const size = phone ? { width: 390, height: 844, mobile: true, dpr: 2 } : { width: 1280, height: 800, dpr: 1.5 };
const page = await open(size);
await page.go(url);
await page.until("document.querySelector('#stage').classList.contains('is-live') && stage.count >= 300000", 60000);
// No automatic tease: the clip shows a hand doing it.
await page.eval("pitch.pull.used = true; document.querySelector('.hud-hint').classList.remove('is-used')");
await page.sleep(2500);

const box = await page.eval("JSON.stringify(document.querySelector('#stage').getBoundingClientRect())").then(JSON.parse); // prettier-ignore
const cx = box.x + box.width * 0.5;
const cy = box.y + box.height * 0.5;
const reach = Math.min(box.width * 0.42, 340);

const frames = path.join(os.tmpdir(), `pitch-clip-${Date.now()}`);
const cast = await page.screencast(frames, { quality: 94 });
await page.sleep(1400);

// Press, pull right, hold, swing through to the left, hold, come back, let go.
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const path1 = [];
const seg = (from, to, n) => {
  for (let i = 1; i <= n; i++) path1.push([cx + (from + (to - from) * ease(i / n)) * reach, cy + Math.sin(i / 9) * 3]); // prettier-ignore
};
const hold = (n) => {
  for (let i = 0; i < n; i++) path1.push(path1[path1.length - 1]);
};
path1.push([cx, cy]);
seg(0, 0.9, 70);
hold(55);
seg(0.9, -0.85, 110);
hold(45);
seg(-0.85, -0.1, 50);
await page.drag(path1, { touch: phone, stepMs: 16 });
await page.sleep(2200);
const shot = await cast.stop();
await page.close();

// Variable-rate screencast frames to a steady 30 frames a second.
const list = path.join(frames, "list.txt");
let txt = "";
for (let i = 0; i < shot.length; i++) {
  const d = i + 1 < shot.length ? shot[i + 1].t - shot[i].t : 1 / 30;
  txt += `file '${shot[i].file}'\nduration ${Math.max(0.001, d).toFixed(4)}\n`;
}
txt += `file '${shot[shot.length - 1].file}'\n`;
fs.writeFileSync(list, txt);
const name = path.join(outDir, phone ? "splashery-pull-phone.mp4" : "splashery-pull-desktop.mp4");
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, "-vf", "fps=30,scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p", "-c:v", "libx264", "-crf", "20", "-preset", "slow", "-movflags", "+faststart", name]); // prettier-ignore
fs.rmSync(frames, { recursive: true, force: true });
console.log(`${name}: ${shot.length} frames`);
