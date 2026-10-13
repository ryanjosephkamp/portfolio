#!/usr/bin/env node
// Checks that playing a take back gives the notes that were played, in
// their order and at their times, whatever rate the page is drawn at.
//
//   node concepts/resonance/tools/check-take.mjs
//
// 1. A known performance is recorded: four figures and two struck bars, with
//    a rest between two of them. It is played back at 120, 60, 30, 12, 5 and
//    2 frames a second, and each playback must give the same figures in the
//    same order, each starting within one frame of when it was played, with
//    the rest kept and both bars struck once.
// 2. A pause longer than four seconds starts a new take, and the old notes
//    are not in it.
// 3. Playing back ends the take: the next note starts a new one.
// 4. A take holds thirty seconds and no more.
//
// Exits 1 if any of it fails.

import { Take, TAKE_GAP, TAKE_MAX } from '../take.js';

let failed = false;
const fail = (msg) => {
  failed = true;
  console.log('FAIL  ' + msg);
};

// A performance: [figure, starts at ms, lasts ms]. A rest from 2400 to 3200.
const NOTES = [
  [0, 0, 700],
  [2, 800, 700],
  [22, 1600, 800],
  [7, 3200, 900],
];
const BARS = [
  [1100, 1568, 0.8, 0.32],
  [3900, 311, 0.8, 0.32],
];

function record(take, start, fps = 60) {
  const dt = 1000 / fps;
  const barsLeft = BARS.slice();
  for (let t = 0; t <= 4200; t += dt) {
    const n = NOTES.find(([, at, lasts]) => t >= at && t < at + lasts);
    take.frame(start + t, n ? n[0] : 0, n ? 0.8 : 0);
    while (barsLeft.length && barsLeft[0][0] <= t) {
      const [, hz, seconds, gain] = barsLeft.shift();
      take.ping(start + t, hz, seconds, gain);
    }
  }
}

function playback(take, fps) {
  const p = take.player();
  const dt = 1000 / fps;
  const heard = []; // [figure, starts at]
  const bars = [];
  let last = null;
  let silentFrom = null;
  let longestRest = 0;
  for (let t = 0; t < p.end + 1000; t += dt) {
    const now = p.at(t);
    for (const b of now.pings) bars.push([t, b.hz]);
    if (now.u === null) {
      if (silentFrom === null) silentFrom = t;
      last = null;
    } else {
      if (silentFrom !== null && heard.length) longestRest = Math.max(longestRest, t - silentFrom);
      silentFrom = null;
      if (now.u !== last) heard.push([now.u, t]);
      last = now.u;
    }
    if (now.done) break;
  }
  return { heard, bars, longestRest };
}

// 1. The same notes back, at any frame rate.
for (const fps of [120, 60, 30, 12, 5, 2]) {
  const take = new Take();
  record(take, 5000);
  const { heard, bars, longestRest } = playback(take, fps);
  const frame = 1000 / fps;
  const figures = heard.map((h) => h[0]).join(' ');
  if (figures !== NOTES.map((n) => n[0]).join(' ')) fail(`${fps} fps: played ${NOTES.map((n) => n[0]).join(' ')}, heard ${figures}`);
  heard.forEach(([, at], i) => {
    if (NOTES[i] && Math.abs(at - NOTES[i][1]) > frame + 35) fail(`${fps} fps: note ${i + 1} came at ${at.toFixed(0)} ms, played at ${NOTES[i][1]}`);
  });
  if (bars.length !== BARS.length) fail(`${fps} fps: ${bars.length} bars struck, played ${BARS.length}`);
  bars.forEach(([at, hz], i) => {
    if (hz !== BARS[i][1] || Math.abs(at - BARS[i][0]) > frame + 35) fail(`${fps} fps: bar ${i + 1} wrong`);
  });
  if (longestRest < 800 - 250 - frame - 35) fail(`${fps} fps: the rest shrank to ${longestRest.toFixed(0)} ms`);
  console.log(`${String(fps).padStart(3)} fps  figures ${figures}  at ${heard.map((h) => h[1].toFixed(0)).join(', ')} ms  bars ${bars.length}  rest ${longestRest.toFixed(0)} ms`);
}

// 2. A long pause starts a new take.
{
  const take = new Take();
  record(take, 0);
  take.frame(4200 + TAKE_GAP + 500, 9, 0.8);
  take.frame(4200 + TAKE_GAP + 600, 9, 0.8);
  const { heard, bars } = playback(take, 60);
  if (heard.length !== 1 || heard[0][0] !== 9 || bars.length) fail(`after a pause the take should hold only the new note, heard ${heard.map((h) => h[0]).join(' ')}`);
  else console.log('a pause over four seconds starts a new take');
}

// 3. Playing back ends the take.
{
  const take = new Take();
  record(take, 0);
  take.player();
  take.frame(4300, 5, 0.8); // well inside four seconds, but after a playback
  const { heard } = playback(take, 60);
  if (heard.length !== 1 || heard[0][0] !== 5) fail('a note after a playback should start a new take');
  else console.log('a playback ends the take');
}

// 4. Thirty seconds and no more.
{
  const take = new Take();
  for (let t = 0; t < TAKE_MAX + 5000; t += 1000 / 60) take.frame(t, 3, 0.8);
  if (take.length > TAKE_MAX) fail(`a take ran ${take.length} ms`);
  else console.log(`a take stops at ${(take.length / 1000).toFixed(0)} seconds`);
}

console.log(failed ? 'FAILED' : 'ok');
process.exit(failed ? 1 : 0);
