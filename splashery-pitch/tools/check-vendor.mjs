// Checks that every file under vendor/splashery/ is the one VENDOR.json records: the
// same SHA-256 as Splashery's own file at the recorded commit. Exits 1 on any mismatch
// or missing file, so a changed copy can't pass for Splashery's.
//
//   npm run check:vendor
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "vendor/splashery/VENDOR.json"), "utf8"));
let bad = 0;
for (const f of manifest.files) {
  const file = path.join(root, f.path);
  if (!fs.existsSync(file)) {
    console.error(`missing   ${f.path}`);
    bad++;
    continue;
  }
  const sha = createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  if (sha !== f.sha256) {
    console.error(`changed   ${f.path}\n  expected ${f.sha256}\n  found    ${sha}`);
    bad++;
  }
}
// Every file in the folder is in the manifest, too.
const listed = new Set(manifest.files.map((f) => f.path));
const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])); // prettier-ignore
for (const file of walk(path.join(root, "vendor/splashery"))) {
  const rel = path.relative(root, file).split(path.sep).join("/");
  if (rel !== "vendor/splashery/VENDOR.json" && !listed.has(rel)) {
    console.error(`unlisted  ${rel}`);
    bad++;
  }
}
if (bad) {
  console.error(`${bad} problem${bad === 1 ? "" : "s"} in vendor/splashery (Splashery ${manifest.commit.slice(0, 7)}).`);
  process.exit(1);
}
console.log(`vendor/splashery: ${manifest.files.length} files match Splashery ${manifest.commit.slice(0, 7)} (${manifest.copied}).`);
