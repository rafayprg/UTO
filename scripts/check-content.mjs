import fs from "node:fs";
import assert from "node:assert/strict";
import { stripTypeScriptTypes } from "node:module";
const source = fs.readFileSync("src/lib/guides.ts", "utf8");
const js = stripTypeScriptTypes(source, { mode: "transform" });
const { toolGuides, categoryGuides } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
assert.equal(Object.keys(toolGuides).length, 10);
assert.equal(Object.keys(categoryGuides).length, 15);
for (const [key, sections] of Object.entries({ ...toolGuides, ...categoryGuides })) {
  const words = sections.flatMap(section => section.paragraphs).join(" ").trim().split(/\s+/).length;
  assert(words >= 400 && words <= 800, `${key}: ${words} words, expected 400–800`);
  console.log(`${key}: ${words} words`);
}
for (const file of fs.readdirSync("src/content/blog").filter(file=>file.endsWith(".mdx"))) {
  const text=fs.readFileSync(`src/content/blog/${file}`,"utf8").replace(/^---[\s\S]*?---/, "");
  const words=text.trim().split(/\s+/).length;
  assert(words>=500,`${file}: expected a complete 500+ word guide (got ${words})`);
  console.log(`${file}: ${words} words`);
}
