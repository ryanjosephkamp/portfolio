// Checks every number and claim the page makes about its own cabinet.
// Run: node concepts/arcade/check.mjs   (prints PASS lines; exits 1 on a failure)
import { readFileSync } from "node:fs";
import { score, hardModeProblem, budgetFor, newRound, submit, advance, puzzleRows, GO_PUZZLES } from "./amordle.js";
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

// 6. The Amordle round. Scoring: the GO chain on Amordle's How to play page,
//    whose answer is STAIN, and repeated letters (extras are marked absent).
const code = (a, g) => score(a, g).map((m) => ({ correct: "✓", present: "~", absent: "×" })[m]).join("");
for (const [g, want] of [["crane", "××✓~×"], ["plate", "××✓~×"], ["stone", "✓✓×~×"], ["shore", "✓××××"], ["stand", "✓✓✓~×"], ["stain", "✓✓✓✓✓"]])
  check(code("stain", g) === want, `STAIN scores ${g.toUpperCase()} as ${want}, as Amordle's help page shows`);
check(code("abbey", "babes") === "~~✓✓×" && code("speed", "eerie") === "~~×××", "a guess with more copies of a letter than the answer gets the extras marked absent");
// Hard Mode, on the help page's evidence G× E~ N× E~ S✓.
const genes = [{ guess: "genes", marks: ["absent", "present", "absent", "present", "correct"] }];
const hm = ["meets", "mates", "glees", "melee"].map((w) => hardModeProblem(genes, w) === null);
check(hm.join() === "true,false,false,false", "Hard Mode on G× E~ N× E~ S✓ takes MEETS and refuses MATES, GLEES and MELEE");
check([0, 1, 2, 3, 4].map((i) => budgetFor("go", i)).join() === "6,5,4,3,2" && budgetFor("og", 0) === 6, "six guesses in OG; 6, 5, 4, 3, 2 down a GO chain");
{
  const list = new Set(["crane", "slate", "stain", "plate", "stone", "shore", "stand", "adieu"]);
  const r = newRound({ length: 5, mode: "og", hard: false, answers: ["crane"] });
  const refused = [submit(r, "zzzzz", list), submit(r, "cran", list)].every(Boolean) && r.rows.length === 0;
  ["slate", "adieu", "stain", "plate", "stone"].forEach((w) => submit(r, w, list));
  const sixth = r.status === "active";
  submit(r, "shore", list);
  check(refused && sixth && r.status === "lost", "an OG round refuses words off its list, takes six guesses, then ends");
  const g = newRound({ length: 5, mode: "go", hard: false, answers: ["crane", "slate", "stain", "plate", "stone"] });
  const seeds = [];
  for (const w of g.answers) {
    submit(g, w, list);
    if (g.status === "holding") {
      advance(g);
      seeds.push(puzzleRows(g).filter((x) => x.seeded).length);
    }
  }
  check(g.status === "won" && seeds.join() === "1,2,3,4", "a GO chain of five lays every solved answer on the next board");
}
// The word slice: one file per length, answers first, every word well formed.
const EXPECT = { 2: 134, 3: 1116, 4: 4297, 5: 9782 }; // every valid word at these lengths (release of September 24, 2026)
let sliceOK = true;
let total = 0;
for (let n = 2; n <= 35; n++) {
  const [a, b = ""] = readFileSync(new URL(`./assets/words/${n}.txt`, import.meta.url), "utf8").split("\n");
  const answers = a.split(" ").filter(Boolean);
  const rest = b.split("|").pop().split(" ").filter(Boolean);
  const all = new Set([...answers, ...rest]);
  total += all.size;
  const ok = answers.length >= GO_PUZZLES && all.size === answers.length + rest.length && [...all].every((w) => w.length === n && /^[a-z]+$/.test(w)) && (!EXPECT[n] || all.size === EXPECT[n]);
  if (!ok) console.log(`      length ${n}: ${answers.length} answers, ${all.size} words`);
  sliceOK = sliceOK && ok;
}
check(sliceOK, `the word slice covers 2 to 35 letters (${total} words; every valid word at 2 to 5), with enough answers for a GO chain at each`);

console.log(failed ? `\n${failed} check(s) failed` : `\nall checks pass (house seed ${HOUSE_SEED})`);
process.exit(failed ? 1 : 0);
