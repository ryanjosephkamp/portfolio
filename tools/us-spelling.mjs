#!/usr/bin/env node
// Finds spellings and date formats that are not American English.
//
//   node tools/us-spelling.mjs [--fix] [path ...]
//
// With no path it checks the whole repository. It prints one line per hit
// (file:line  found -> wanted) and exits 1 if there are any. With --fix it
// rewrites the files instead.
//
// It reads every word, including each part of a camelCase or snake_case
// name, so a fix renames identifiers too, the same way in every file it is
// given. Run the page and its tests afterward.
//
// Left alone: web and data addresses, and any line that carries the marker
//   us-spelling: keep
// which is for a name someone else chose (a toy id, a quoted title).

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TEXT = new Set(['.html', '.htm', '.css', '.js', '.mjs', '.cjs', '.ts', '.json', '.md', '.txt', '.svg', '.yml', '.yaml']);
const SKIP_DIRS = new Set(['.git', 'node_modules', '.claude', 'vendor', 'fonts']);
const KEEP = /us-spelling:\s*keep/;
const SELF = fileURLToPath(import.meta.url);

// Stems that take -or where British English writes -our.
const OUR = 'col|flav|fav|hon|hum|lab|neighb|rum|vap|harb|behavi|endeav|arm|od|savi|sav|tum|vig|rig|cand|clam|parl|demean|splend|val|ferv|ard|ranc|succ|enam';
const OUR_TAIL = 's|ed|ing|ings|ful|fully|less|able|ably|ite|ites|hood|hoods|ly|er|ers|ist|ists|al|ally|ise|ises|ised|ising|ize|izes|ized|izing|ation|y|ies';

// Stems that take -ize and -ization where British English writes -ise and -isation.
const ISE = [
  'organ', 'recogn', 'real', 'optim', 'visual', 'normal', 'initial', 'raster', 'summar', 'emphas', 'minim', 'maxim',
  'custom', 'special', 'general', 'standard', 'synchron', 'serial', 'token', 'quant', 'discret', 'parametr', 'parameter',
  'random', 'memor', 'priorit', 'categor', 'character', 'capital', 'final', 'stabil', 'util', 'harmon', 'digit', 'material',
  'vapor', 'polar', 'linear', 'regular', 'vector', 'color', 'anonym', 'author', 'apolog', 'critic', 'modern', 'personal',
  'local', 'global', 'external', 'internal', 'symbol', 'sympath', 'theor', 'item', 'penal', 'legal', 'equal', 'energ',
  'magnet', 'ion', 'oxid', 'hypothes', 'synthes', 'familiar', 'popular', 'formal', 'central', 'neutral', 'mobil', 'monet',
  'memo', 'factor', 'diagonal', 'orthogonal', 'pixel', 'voxel', 'crystall', 'patron', 'civil', 'colon', 'dramat', 'human',
  'immun', 'jeopard', 'marginal', 'natural', 'rational', 'revolution', 'scrutin', 'social', 'steril', 'terror', 'victim',
  'vocal', 'agon', 'antagon', 'brutal', 'carbon', 'commercial', 'computer', 'conceptual', 'contextual', 'democrat',
  'digital', 'econom', 'epitom', 'fantas', 'fossil', 'galvan', 'hospital', 'hybrid', 'ideal', 'immortal', 'individual',
  'industrial', 'ital', 'legitim', 'liberal', 'mesmer', 'metabol', 'modular', 'monopol', 'plagiar', 'pressur', 'privat',
  'public', 'pulver', 'radical', 'revital', 'satir', 'sensit', 'subsid', 'symmetr', 'tantal', 'trivial', 'urban', 'verbal',
  'weapon', 'alphabet', 'atom', 'bapt', 'cauter', 'fertil', 'homogen', 'hypnot', 'mechan', 'moistur', 'pasteur',
  'philosoph', 'sermon', 'tranquil', 'acclimat', 'amort', 'anthropomorph', 'canon', 'cannibal', 'caramel',
  'compartmental', 'decentral', 'demoral', 'destabil', 'editorial', 'eulog', 'evangel', 'incentiv', 'miniatur',
  'ostrac', 'plural', 'regional', 'sanit', 'scandal', 'secular', 'sensational', 'stigmat', 'total', 'vandal', 'vital',
  'western', 'triangular', 'binar', 'diagon', 'geometr', 'summat', 'emphasis', 'accessor', 'actual', 'sonif', 'spatial',
  'temporal', 'textur', 'tessellat', 'skeleton', 'bilinear', 'collin', 'gamif', 'audial', 'canonical', 'homogen',
];
const ISE_HEAD = '(?:re|un|de|dis|over|under|pre|non|mis|co)?';

// Verbs that double the l before a suffix in British English only.
const LL = 'travel|label|model|cancel|signal|level|fuel|channel|tunnel|panel|pencil|total|dial|marvel|quarrel|towel|shovel|swivel|bevel|chisel|initial|equal|rival|spiral|funnel|snorkel|counsel|duel|jewel|libel|parcel|pedal|grovel|unravel|remodel|relabel|mislabel|barrel|cudgel|gravel|kennel|metal|trowel|yodel|carol|pummel|ravel|revel|tinsel|squirrel|stencil|dishevel|enamel|marshal|refuel|tassel';

// One lowercase word in, its American spelling out. Order matters.
const WORDS = [
  [new RegExp(`^([a-z]*?)(${OUR})our(${OUR_TAIL})?$`), '$1$2or$3'],
  [/^([a-z]*?)centre(s|piece|pieces|line|lines|fold)?$/, '$1center$2'],
  [/^([a-z]*?)centred$/, '$1centered'],
  [/^([a-z]*?)centring$/, '$1centering'],
  [/^(kilo|centi|milli|nano|micro)?(met|lit|fib|theat|calib|lust|somb|spect|scept|sab|meag|goit|mit|nit|sepulch|reconnoit)re(s)?$/, '$1$2er$3'],
  [/^manoeuvr(e|es|ed|ing|able|ability)$/, (m, t) => `maneuver${{ e: '', es: 's', ed: 'ed', ing: 'ing', able: 'able', ability: 'ability' }[t]}`],
  [new RegExp(`^(${ISE_HEAD})(${ISE.join('|')})is(e|es|ed|er|ers|ing|ation|ations|ational|able)$`), '$1$2iz$3'],
  [/^(anal|catal|paral|dial|hydrol|electrol|breathal)ys(e|ed|er|ers|ing)$/, '$1yz$2'],
  [new RegExp(`^(${LL})l(ed|ing|er|ers|ous|ously|or|ors)$`), '$1$2'],
  [/^jewellery$/, 'jewelry'],
  [/^(enrol|fulfil|instal|distil|appal|enthral|instil)(s|ment|ments)?$/, '$1l$2'],
  [/^(ski|wi)lful(ly|ness)?$/, '$1llful$2'],
  [/^(focus)s(ed|ing|es)$/, '$1$2'],
  [/^(benefit|target|budget)t(ed|ing)$/, '$1$2'],
  [/^(def|off|pret|lic)ence(s|less)?$/, '$1ense$2'],
  [/^practis(e|es|ed|ing)$/, 'practic$1'],
  [/^grey(s|er|est|ed|ing|ish|scale|ness)?$/, 'gray$1'],
  [/^(kilo|milli)?(program|gram)me(s)?$/, '$1$2$3'],
  [/^(judg|acknowledg|abridg|lodg)ement(s|al)?$/, '$1ment$2'],
  [/^ageing$/, 'aging'],
  [/^artefact(s|ual)?$/, 'artifact$1'],
  [/^aluminium$/, 'aluminum'],
  [/^sceptic(s|al|ally|ism)?$/, 'skeptic$1'],
  [/^(catalog|analog)ue(s)?$/, '$1$2'],
  [/^catalogued$/, 'cataloged'],
  [/^cataloguing$/, 'cataloging'],
  [/^mould(s|ed|ing|y)?$/, 'mold$1'],
  [/^moult(s|ed|ing)?$/, 'molt$1'],
  [/^smoulder(s|ed|ing)?$/, 'smolder$1'],
  [/^plough(s|ed|ing)?$/, 'plow$1'],
  [/^tyre(s)?$/, 'tire$1'],
  [/^kerb(s|side)?$/, 'curb$1'],
  [/^whilst$/, 'while'],
  [/^amongst$/, 'among'],
  [/^amidst$/, 'amid'],
  [/^learnt$/, 'learned'],
  [/^spelt$/, 'spelled'],
  [/^dreamt$/, 'dreamed'],
  [/^leant$/, 'leaned'],
  [/^maths$/, 'math'],
  [/^speciality$/, 'specialty'],
  [/^specialities$/, 'specialties'],
  [/^(dis)?orientat(e|es|ed|ing)$/, (m, d = '', t) => `${d}orient${{ e: '', es: 's', ed: 'ed', ing: 'ing' }[t]}`],
  [/^cos(y|ier|iest|ily|iness)$/, 'coz$1'],
  [/^haem([a-z]+)$/, 'hem$1'],
  [/^(an|leuk|septic|tox|isch)aemi(a|c)$/, '$1emi$2'],
  [/^anaesth([a-z]+)$/, 'anesth$1'],
  [/^(p|orthop|encyclop)aed([a-z]+)$/, '$1ed$2'],
  [/^mediaeval$/, 'medieval'],
  [/^foet(us|al|uses)$/, 'fet$1'],
  [/^oe(strogen|sophagus|dema)$/, 'e$1'],
  [/^sulph(ur|urs|uric|ate|ates|ide|ides|ite|ites)$/, 'sulf$1'],
  [/^caesium$/, 'cesium'],
  [/^storey$/, 'story'],
  [/^storeys$/, 'stories'],
  [/^pyjamas$/, 'pajamas'],
  [/^draught(s|y)?$/, 'draft$1'],
  [/^cheque(s|book)?$/, 'check$1'],
  [/^aeroplane(s)?$/, 'airplane$1'],
  [/^moustache(s)?$/, 'mustache$1'],
  [/^yoghurt(s)?$/, 'yogurt$1'],
  [/^enquir(e|es|ed|ing|y|ies)$/, 'inquir$1'],
  [/^gaol(s|ed|er)?$/, 'jail$1'],
];

const MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December';

function american(word) {
  const lower = word.toLowerCase();
  for (const [pattern, to] of WORDS) {
    if (!pattern.test(lower)) continue;
    const fixed = lower.replace(pattern, to).replace(/undefined/g, '');
    if (fixed === lower) return word;
    if (word === word.toUpperCase() && word.length > 1) return fixed.toUpperCase();
    if (word[0] === word[0].toUpperCase()) return fixed[0].toUpperCase() + fixed.slice(1);
    return fixed;
  }
  return word;
}

function fixLine(line) {
  if (KEEP.test(line)) return { text: line, hits: [] };
  const hits = [];
  const swap = (found, wanted) => {
    if (found !== wanted) hits.push([found, wanted]);
    return wanted;
  };
  // Lift web addresses out so nothing inside them is read as a word.
  const links = [];
  let text = line.replace(/\b(?:https?:\/\/|www\.|data:)[^\s"'<>)\]]+/g, (url) => {
    links.push(url);
    return `\u0000${links.length - 1}\u0000`;
  });
  // 12 October 2026 -> October 12, 2026; 12 October -> October 12
  text = text.replace(new RegExp(`\\b(\\d{1,2}) (${MONTHS}),? (\\d{4})\\b`, 'g'), (m, d, mo, y) => swap(m, `${mo} ${d}, ${y}`));
  text = text.replace(new RegExp(`\\b(\\d{1,2}) (${MONTHS})\\b(?!,? \\d)`, 'g'), (m, d, mo) => swap(m, `${mo} ${d}`));
  text = text.replace(/\b([Pp])er cent\b/g, (m, p) => swap(m, `${p}ercent`));
  // Every word, and every hump of a camelCase name.
  text = text.replace(/[A-Z]?[a-z]+|[A-Z]+(?![a-z])/g, (word) => swap(word, american(word)));
  text = text.replace(/\u0000(\d+)\u0000/g, (m, i) => links[Number(i)]);
  return { text, hits };
}

function* walk(path) {
  const stat = statSync(path);
  if (stat.isFile()) {
    if (TEXT.has(extname(path)) && resolve(path) !== SELF) yield path;
    return;
  }
  for (const name of readdirSync(path)) {
    if (SKIP_DIRS.has(name) || name.endsWith('.min.js')) continue;
    yield* walk(join(path, name));
  }
}

const args = process.argv.slice(2);
const fix = args.includes('--fix');
const paths = args.filter((a) => !a.startsWith('--'));
let total = 0;
let changed = 0;

for (const root of paths.length ? paths : ['.']) {
  for (const file of walk(root)) {
    const lines = readFileSync(file, 'utf8').split('\n');
    let dirty = false;
    lines.forEach((line, i) => {
      const { text, hits } = fixLine(line);
      if (!hits.length) return;
      total += hits.length;
      dirty = true;
      lines[i] = text;
      if (!fix) hits.forEach(([found, wanted]) => console.log(`${relative('.', file)}:${i + 1}  ${found} -> ${wanted}`));
    });
    if (fix && dirty) {
      writeFileSync(file, lines.join('\n'));
      changed += 1;
    }
  }
}

if (fix) console.log(`${total} fixed in ${changed} file${changed === 1 ? '' : 's'}`);
else if (total) console.log(`\n${total} to fix. Run again with --fix, then run the page and its tests.`);
process.exit(!fix && total ? 1 : 0);
