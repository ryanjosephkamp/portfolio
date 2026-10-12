// Ranking for the Query board: BM25 over the ten project entries on the page.
// Pure functions, so check.mjs can run the same code outside a browser.

export const K1 = 1.2;
export const B = 0.75;
export const NAME_BOOST = 3;

export function fold(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function tokenize(text) {
  return fold(text).split(/[^a-z0-9]+/).filter(Boolean);
}

function bump(counts, token, field) {
  const c = counts.get(token) || { name: 0, body: 0 };
  c[field]++;
  counts.set(token, c);
}

// docs: [{ id, name, body }]. One entry is one document.
export function buildIndex(docs) {
  const out = docs.map((d) => {
    const name = tokenize(d.name);
    const body = tokenize(d.body);
    const counts = new Map();
    for (const t of name) bump(counts, t, "name");
    for (const t of body) bump(counts, t, "body");
    return { id: d.id, len: name.length + body.length, counts };
  });
  const vocab = [...new Set(out.flatMap((d) => [...d.counts.keys()]))].sort();
  const avgLen = out.reduce((sum, d) => sum + d.len, 0) / out.length;
  return { docs: out, vocab, avgLen, N: out.length };
}

// A query term matches every word that starts with it. A plural is typed as its singular.
export function parseQuery(q) {
  const terms = [];
  for (let t of tokenize(q)) {
    if (t.length > 3 && t.endsWith("s") && !t.endsWith("ss")) t = t.slice(0, -1);
    if (!terms.includes(t)) terms.push(t);
  }
  return terms;
}

export function search(index, q) {
  const terms = parseQuery(q);
  const rows = index.docs.map((d, order) => ({ id: d.id, order, len: d.len, score: 0, parts: [] }));
  const info = [];
  for (const term of terms) {
    const hits = index.docs.map((d) => {
      let name = 0;
      let body = 0;
      const words = [];
      for (const [token, c] of d.counts) {
        if (token.startsWith(term)) {
          name += c.name;
          body += c.body;
          words.push(token);
        }
      }
      return { name, body, words };
    });
    const df = hits.filter((h) => h.name + h.body > 0).length;
    const idf = Math.log(1 + (index.N - df + 0.5) / (df + 0.5));
    info.push({ term, df, idf });
    hits.forEach((h, i) => {
      if (h.name + h.body === 0) return;
      const tf = h.body + NAME_BOOST * h.name;
      const norm = 1 - B + B * (index.docs[i].len / index.avgLen);
      const points = (idf * (tf * (K1 + 1))) / (tf + K1 * norm);
      rows[i].score += points;
      rows[i].parts.push({ term, tf, name: h.name, body: h.body, df, idf, norm, points, words: h.words.sort() });
    });
  }
  rows.sort((a, b) => b.score - a.score || a.order - b.order);
  return { terms: info, rows, matched: rows.filter((r) => r.score > 0).length };
}

// For each project: the shortest query made of letters that ranks it first outright,
// earliest in alphabetical order among queries of that length.
export function codes(index, maxLen = 6) {
  const found = new Map();
  for (let n = 1; n <= maxLen && found.size < index.N; n++) {
    const starts = index.vocab.filter((t) => t.length >= n).map((t) => t.slice(0, n));
    const prefixes = [...new Set(starts)].filter((p) => /^[a-z]+$/.test(p)).sort();
    for (const p of prefixes) {
      const { rows } = search(index, p);
      if (rows[0].score > 0 && rows[0].score > rows[1].score && !found.has(rows[0].id)) found.set(rows[0].id, p);
    }
  }
  return found;
}
