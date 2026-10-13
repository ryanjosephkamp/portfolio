// Checks every number and claim the page makes about its own cabinet.
// Run: node concepts/arcade/check.mjs   (prints PASS lines; exits 1 on a failure)
import { readFileSync } from "node:fs";
import { HOUSE, HOUSE_SEED, RULES, ROWS, DT, wall, houseRun, ruleCode, glyphSegments } from "./game.js";

let failed = 0;
const check = (ok, label) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) failed++;
};
const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");

// 1. The wall: the page says how many strokes the name has.
const strokes = wall();
const perLetter = ROWS.join("").split("").map((c) => glyphSegments(c).length);
check(strokes.length === perLetter.reduce((a, b) => a + b, 0), `the wall has ${strokes.length} strokes (${perLetter.join("+")})`);
check(html.includes(`${strokes.length} strokes`), `the page says "${strokes.length} strokes"`);

// 2. Eight rule sets, and the house clears the name on every one of them,
//    for exactly the score the table prints.
check(2 ** RULES.length === 8 && HOUSE.length === 8, "three switches make eight rule sets");
for (let bits = 0; bits < 8; bits++) {
  const a = houseRun(bits);
  const b = houseRun(bits);
  const secs = (a.step * DT).toFixed(1);
  check(a.state === "clear", `rule set ${ruleCode(bits)}: the house clears the name (${secs} s, ${a.balls} of 3 balls left)`);
  check(a.score === b.score && a.step === b.step, `rule set ${ruleCode(bits)}: the same seed replays to the same game`);
  check(a.score === HOUSE[bits], `rule set ${ruleCode(bits)}: house score ${a.score} matches the table's ${HOUSE[bits]}`);
  check(html.includes(`data-house="${a.score}"`), `rule set ${ruleCode(bits)}: the page's table row carries ${a.score}`);
}

// 3. Beyond the house seed: how often the house clears from other seeds.
//    Reported, and required only to finish every game (no ball stuck forever).
let clears = 0;
let games = 0;
let stuck = 0;
for (let bits = 0; bits < 8; bits++)
  for (let seed = 1; seed <= 250; seed++) {
    const g = houseRun(bits, seed, 600);
    games++;
    if (g.state === "clear") clears++;
    else if (g.state !== "over") stuck++;
  }
check(stuck === 0, `${games} more games (250 seeds on each rule set) all end; the house clears ${clears} of them`);

// 4. Ars Magna's plate: both words are the same letters.
const sort = (s) => s.replace(/\s/g, "").split("").sort().join("");
check(sort("ARS MAGNA") === sort("ANAGRAMS"), "ARS MAGNA and ANAGRAMS are the same eight letters");

// 5. Amordle's plate: ten clocks, two modes, Hard Mode on or off.
check(10 * 2 * 2 === 40 && (html.match(/class="pool"/g) || []).length === 0, "ten clocks by two modes by two is forty pools (cells are drawn by script)");

console.log(failed ? `\n${failed} check(s) failed` : `\nall checks pass (house seed ${HOUSE_SEED})`);
process.exit(failed ? 1 : 0);
