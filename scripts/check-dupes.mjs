import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const load = file => import(pathToFileURL(path.join(root, file)).href);

const CATEGORIES = ["pdf", "image", "media", "dev", "crypto", "youtube", "text", "calculator", "data", "finance", "real-estate", "insurance", "business", "marketing"];
const HANDCRAFTED = ["background-remover", "heic-converter", "zip-tool", "pdf-merger", "json-formatter", "qr-generator", "word-counter", "youtube-toolkit", "percentage-calculator", "unit-converter"];

const seen = new Map();
HANDCRAFTED.forEach(s => seen.set(s, "HANDCRAFTED"));
const dupes = [];

for (const cat of CATEGORIES) {
  const exportName = cat.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) + "Catalog";
  const mod = await load(`src/lib/catalog/${cat}.ts`);
  const entries = mod[exportName] || mod[`${cat}Catalog`];
  if (!entries) {
    console.error(`Missing entries for ${cat}`);
    continue;
  }
  for (const item of entries) {
    if (seen.has(item.slug)) {
      dupes.push({ slug: item.slug, first: seen.get(item.slug), second: cat });
    } else {
      seen.set(item.slug, cat);
    }
  }
}

console.log("Total unique tools:", seen.size);
console.log("Found", dupes.length, "duplicates:");
console.log(dupes);
