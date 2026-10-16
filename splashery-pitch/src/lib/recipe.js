// Runs Splashery's own treasure chest recipe (src/packs/objects.js) through Splashery's
// own kit (src/kit.js), copied unchanged under vendor/splashery. The kit is plain
// JavaScript, so the recipe builds here exactly as it does in the app: same seed,
// same budget, same splats.
import { buildRecipe } from "../../vendor/splashery/src/kit.js";
import { RECIPES } from "../../vendor/splashery/src/packs/objects.js";
import { hash32 } from "../../vendor/splashery/src/noise.js";
import { makeSet } from "./splats.js";

export const CHEST_SEED = hash32("chest");

export function buildChest({ count = 140000, seed = CHEST_SEED, wood } = {}) {
  const recipe = RECIPES.chest;
  const options = {};
  for (const o of recipe.options || []) options[o.key] = o.default;
  if (wood) options.wood = wood;
  const it = buildRecipe(recipe, { seed, count, options }, () => {});
  let r = it.next();
  while (!r.done) r = it.next();
  const ctx = r.value;
  const buf = ctx.buf;
  // Leave out splats the kit removed (zero size).
  let n = 0;
  for (let i = 0; i < buf.count; i++)
    if (buf.scale[i * 3] + buf.scale[i * 3 + 1] + buf.scale[i * 3 + 2] > 0) n++;
  const set = makeSet(n);
  const byte = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
  let j = 0;
  for (let i = 0; i < buf.count; i++) {
    if (!(buf.scale[i * 3] + buf.scale[i * 3 + 1] + buf.scale[i * 3 + 2] > 0)) continue;
    for (let k = 0; k < 3; k++) {
      set.pos[j * 3 + k] = buf.pos[i * 3 + k];
      set.scale[j * 3 + k] = buf.scale[i * 3 + k];
    }
    for (let k = 0; k < 4; k++) set.rot[j * 4 + k] = buf.rot[i * 4 + k];
    for (let k = 0; k < 4; k++) set.color[j * 4 + k] = byte(buf.color[i * 4 + k]);
    set.part[j] = buf.anim ? Math.round(buf.anim[i * 4]) % 16 : 0;
    j++;
  }
  const parts = ctx.parts.map((p) => ({ name: p.name, pivot: p.pivot.slice(), axis: p.axis.slice() }));
  return { set, parts, requested: count };
}
