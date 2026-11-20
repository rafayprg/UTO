// Smoke test for every catalog entry and ops module.
// - every catalog entry points at a module/op that exists, slugs are unique and well formed
// - every text op runs on its own example (generators run with default options)
// - every calc op computes with its default values
// - category-specific assertions live in scripts/ops-tests/*.mjs and run afterwards
import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const load = file => import(pathToFileURL(path.join(root, file)).href);

const CATEGORIES = ["pdf", "image", "media", "dev", "crypto", "youtube", "text", "calculator", "data", "finance", "real-estate", "insurance", "business", "marketing"];
const MODULES = {
  text: ["dev-text", "data-text", "crypto-text", "seo-text", "youtube-text", "media-text", "image-css"],
  calc: ["calc-finance", "calc-math", "calc-units", "youtube-calc", "calc-business", "calc-marketing", "calc-realestate", "calc-insurance"],
  image: ["image-ops"],
  pdf: ["pdf-ops"],
};
const HANDCRAFTED = ["background-remover", "heic-converter", "zip-tool", "pdf-merger", "json-formatter", "qr-generator", "word-counter", "youtube-toolkit", "percentage-calculator", "unit-converter"];

const ops = {};
for (const [engine, names] of Object.entries(MODULES)) {
  for (const name of names) ops[name] = { engine, ops: (await load(`src/lib/ops/${name}.ts`)).ops };
}

const slugs = new Set(HANDCRAFTED);
const counts = {};
const used = new Set();
for (const category of CATEGORIES) {
  const exportName = category.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) + "Catalog";
  const mod = await load(`src/lib/catalog/${category}.ts`);
  const entries = mod[exportName] || mod[`${category}Catalog`];
  assert.ok(Array.isArray(entries), `${category} catalog must export ${exportName}`);
  counts[category] = { total: entries.length, live: 0 };
  for (const entry of entries) {
    const where = `${category}/${entry.slug}`;
    assert.match(entry.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, `${where}: slug must be kebab-case`);
    assert.ok(!slugs.has(entry.slug), `${where}: duplicate slug`);
    slugs.add(entry.slug);
    assert.ok(entry.title && entry.shortDesc && entry.group, `${where}: title, shortDesc and group are required`);
    assert.ok(entry.shortDesc.length <= 160, `${where}: shortDesc is too long`);
    assert.ok(Array.isArray(entry.keywords) && entry.keywords.length > 0, `${where}: keywords required`);
    if (entry.engine === "planned") {
      assert.ok(entry.plannedEngine && entry.plannedInput, `${where}: planned tools need plannedEngine and plannedInput`);
      continue;
    }
    counts[category].live += 1;
    const mod = ops[entry.module];
    assert.ok(mod, `${where}: unknown module ${entry.module}`);
    assert.equal(mod.engine, entry.engine, `${where}: module ${entry.module} is a ${mod.engine} module, not ${entry.engine}`);
    assert.ok(mod.ops[entry.op], `${where}: op ${entry.op} not found in ${entry.module}`);
    used.add(`${entry.module}:${entry.op}`);
  }
}

const defaults = fields => Object.fromEntries((fields ?? []).map(field => [field.id, field.default]));
let ran = 0;
for (const [name, mod] of Object.entries(ops)) {
  for (const [key, op] of Object.entries(mod.ops)) {
    const where = `${name}:${key}`;
    if (mod.engine === "text") {
      const input = op.input ? op.input.example : "";
      if (op.input) assert.ok(input, `${where}: input.example is required`);
      const output = await op.run(input, defaults(op.options), op.second?.example);
      assert.equal(typeof output, "string", `${where}: run must return a string`);
      assert.ok(output.length > 0, `${where}: example produced empty output`);
      ran += 1;
    } else if (mod.engine === "calc") {
      const values = Object.fromEntries(op.fields.map(field => [field.id, field.default]));
      const output = op.compute(values);
      assert.ok(output.results.length > 0, `${where}: defaults produced no results`);
      for (const result of output.results) assert.ok(!/NaN|Infinity|undefined/.test(result.value), `${where}: bad value ${result.value} for ${result.label}`);
      ran += 1;
    }
  }
}

const extra = path.join(root, "scripts/ops-tests");
const files = (await readdir(extra).catch(() => [])).filter(file => file.endsWith(".mjs")).sort();
for (const file of files) await import(pathToFileURL(path.join(extra, file)).href);

const total = Object.values(counts).reduce((sum, c) => sum + c.total, 0) + HANDCRAFTED.length;
const live = Object.values(counts).reduce((sum, c) => sum + c.live, 0) + HANDCRAFTED.length;
console.log(`PASS: ${total} tools (${live} live, ${total - live} coming soon); ${ran} text/calc ops ran on their examples; ${files.length} category test files.`);
console.log(Object.entries(counts).map(([c, v]) => `${c} ${v.total} (${v.live} live)`).join(" · "));
