import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { compile } from '@mdx-js/mdx';

const dir = './src/content/blog';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.mdx'));

let errors = 0;
for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const { content: mdxContent } = matter(content);
  try {
    await compile(mdxContent, { jsx: true });
    console.log(`[PASS] ${file}`);
  } catch (err) {
    console.error(`[FAIL] ${file}:`, err.message);
    errors++;
  }
}

console.log(`Finished: ${files.length - errors}/${files.length} passed.`);
if (errors > 0) {
  process.exit(1);
}
